#!/bin/bash
# starloop-orchestrate.sh — idempotent StarLoop orchestrator
#
# Checks active Claude Code ACP sessions, wraps up any whose todo is complete,
# then hands off to OpenClaw to pick and start a new task if capacity is free.
#
# Called by: OpenClaw cron job and todo-watcher.sh (on file events)
#
# Usage: starloop-orchestrate.sh [--force]
#
# Environment variables:
#   TODOS_DIR                 Path to StarFocus todos folder (required)
#   OPENCLAW_CHANNEL          OpenClaw message channel (e.g. telegram, whatsapp) (optional)
#   OPENCLAW_TARGET           OpenClaw target user ID/phone number (required)
#   STAR_ROLES                Comma-separated star roles to filter todos by (optional — omit to include any role)
#   MAX_CONCURRENCY           Max simultaneous Claude Code sessions (default: 1)
#   ACPX                      Path to acpx binary (default: acpx on PATH)
#   ACPX_WORKSPACE            Path to acpx workspace dir (default: ~/.openclaw/workspace)
#   STARLOOP_COOLDOWN_SECONDS Min seconds between proposal messages (default: 60)
#   FORCE                     Force proposal check-in regardless of state hash (default: false)

set -euo pipefail

# Ensure standard tools (bun, node, brew, acpx) are discoverable
export PATH="/home/linuxbrew/.linuxbrew/bin:$HOME/.bun/bin:$HOME/.npm-global/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"

TODOS_DIR="${TODOS_DIR:-}"
OPENCLAW_CHANNEL="${OPENCLAW_CHANNEL:-}"
OPENCLAW_TARGET="${OPENCLAW_TARGET:-}"
STAR_ROLES="${STAR_ROLES:-}"
MAX_CONCURRENCY="${MAX_CONCURRENCY:-1}"
ACPX="${ACPX:-$(command -v acpx 2>/dev/null || echo "")}"
ACPX_WORKSPACE="${ACPX_WORKSPACE:-$HOME/.openclaw/workspace}"
COOLDOWN_SECONDS="${STARLOOP_COOLDOWN_SECONDS:-60}"
FORCE="${FORCE:-false}"

for arg in "$@"; do
  case "$arg" in
    --force|-f) FORCE=true ;;
  esac
done

# --- Helpers ------------------------------------------------------------------

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# --- Concurrency Lock (Single-Flight) -----------------------------------------
LOCK_FILE="${STARLOOP_LOCK_FILE:-/tmp/starloop-orchestrate.lock}"
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
  log "Another instance of starloop-orchestrate is already running. Exiting."
  exit 0
fi

# --- Validation ---------------------------------------------------------------

if [ -z "$TODOS_DIR" ]; then
  echo "Error: TODOS_DIR is not set." >&2
  exit 1
fi

# Fallback compatibility check
if [ -z "$OPENCLAW_TARGET" ] && [ -n "${TELEGRAM_TARGET:-}" ]; then
  OPENCLAW_TARGET="$TELEGRAM_TARGET"
  OPENCLAW_CHANNEL="${OPENCLAW_CHANNEL:-telegram}"
elif [ -z "$OPENCLAW_TARGET" ] && [ -n "${WHATSAPP_TARGET:-}" ]; then
  OPENCLAW_TARGET="$WHATSAPP_TARGET"
  OPENCLAW_CHANNEL="${OPENCLAW_CHANNEL:-whatsapp}"
fi

if [ -z "$OPENCLAW_TARGET" ]; then
  echo "Error: Neither OPENCLAW_TARGET, TELEGRAM_TARGET, nor WHATSAPP_TARGET is set." >&2
  exit 1
fi

if [ -z "$ACPX" ]; then
  echo "Error: acpx not found. Install it or set the ACPX environment variable." >&2
  exit 1
fi

todo_is_complete() {
  local session_name="$1"
  local todo_file="$TODOS_DIR/${session_name}.md"
  [ -f "$todo_file" ] && grep -qE '^completedAt:.+[0-9]' "$todo_file"
}

compute_state_hash() {
  node -e '
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const dir = process.argv[1];
if (!dir || !fs.existsSync(dir)) {
  console.log("");
  process.exit(0);
}

const hash = crypto.createHash("sha256");

// wayfinder (priority order)
try {
  const w = fs.readFileSync(path.join(dir, "_wayfinder.md"), "utf8")
    .split("\n").filter(l => !l.startsWith("exportedAt:")).join("\n");
  hash.update("_wayfinder.md\n" + w + "\n");
} catch (e) {}

// asteroid field (urgency)
try {
  const a = fs.readFileSync(path.join(dir, "_asteroid-field.md"), "utf8")
    .split("\n").filter(l => !l.startsWith("exportedAt:")).join("\n");
  hash.update("_asteroid-field.md\n" + a + "\n");
} catch (e) {}

// active uncompleted todos
try {
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".md") && !f.startsWith("_")).sort();
  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(dir, f), "utf8");
      if (/^completedAt:.+[0-9]/m.test(content)) continue;
      const clean = content.split("\n").filter(l => !l.startsWith("exportedAt:")).join("\n");
      hash.update(f + "\n" + clean + "\n");
    } catch (e) {}
  }
} catch (e) {}

console.log(hash.digest("hex"));
' "$TODOS_DIR"
}

steer_and_close() {
  local session_name="$1"
  local steer_msg="The user has marked this todo complete. Please finish any in-progress work, raise a PR if not already done, then exit cleanly."

  log "Steering session '$session_name' to wrap up..."
  if ! (cd "$ACPX_WORKSPACE" && "$ACPX" claude -s "$session_name" "$steer_msg" 2>&1) | while IFS= read -r line; do log "acpx steer: $line"; done; then
    log "Steer failed — attempting session resume"
    local session_id
    session_id=$(cd "$ACPX_WORKSPACE" && "$ACPX" claude sessions show "$session_name" 2>/dev/null | awk '/^sessionId:/ {print $2}')
    if [ -n "$session_id" ]; then
      log "Resuming Claude Code session $session_id"
      (cd "$ACPX_WORKSPACE" && "$ACPX" claude sessions new --name "$session_name" --resume-session "$session_id" 2>&1) | while IFS= read -r line; do log "acpx resume: $line"; done
      sleep 5
      (cd "$ACPX_WORKSPACE" && "$ACPX" claude -s "$session_name" "$steer_msg" 2>&1) | while IFS= read -r line; do log "acpx steer (resumed): $line"; done || log "acpx steer failed after resume"
    else
      log "Could not retrieve session ID for '$session_name' — skipping resume"
    fi
  fi

  log "Waiting 60s for '$session_name' to wrap up..."
  sleep 60

  log "Closing session '$session_name'"
  (cd "$ACPX_WORKSPACE" && "$ACPX" claude sessions close "$session_name" 2>&1) | while IFS= read -r line; do log "acpx close: $line"; done || log "acpx close failed"
}

# --- Step 1: Check active sessions, wrap up completed todos -------------------

log "Checking active ACP sessions..."
active_sessions=$(cd "$ACPX_WORKSPACE" && "$ACPX" claude sessions list 2>/dev/null | grep -v '\[closed\]' || true)
session_wrapped_up=false

if [ -z "$active_sessions" ]; then
  log "No active sessions"
  active_count=0
else
  log "Active sessions:"
  echo "$active_sessions" | while IFS=$'\t' read -r _id name _rest; do
    [ -n "$name" ] && log "  $name"
  done

  # Wrap up completed todos or close dead sessions
  while IFS=$'\t' read -r _id name _rest; do
    [ -z "$name" ] && continue

    session_pid=$(cd "$ACPX_WORKSPACE" && "$ACPX" claude sessions show "$name" 2>/dev/null | awk '/^pid:/ {print $2}')
    disconnect_reason=$(cd "$ACPX_WORKSPACE" && "$ACPX" claude sessions show "$name" 2>/dev/null | awk '/^disconnectReason:/ {print $2}')

    is_alive=false
    if [ -n "$session_pid" ] && [ "$session_pid" != "-" ] && kill -0 "$session_pid" 2>/dev/null; then
      is_alive=true
    fi

    if todo_is_complete "$name"; then
      log "Todo complete for session '$name' — wrapping up"
      channel_opt=""
      [ -n "$OPENCLAW_CHANNEL" ] && channel_opt="--channel $OPENCLAW_CHANNEL"
      openclaw message send $channel_opt --target "$OPENCLAW_TARGET" \
        --message "✅ Todo complete: *${name}* — wrapping up Claude session and raising PR."
      if [ "$is_alive" = "true" ]; then
        steer_and_close "$name"
      else
        log "Session '$name' process already terminated — closing record"
        (cd "$ACPX_WORKSPACE" && "$ACPX" claude sessions close "$name" 2>&1) || true
      fi
      session_wrapped_up=true
    else
      if [ "$is_alive" = "false" ] || [ "$disconnect_reason" = "process_exit" ]; then
        log "Session '$name' process has died (pid: ${session_pid:-none}, disconnectReason: ${disconnect_reason:--}) — closing stale record"
        (cd "$ACPX_WORKSPACE" && "$ACPX" claude sessions close "$name" 2>&1) || true
      fi
    fi
  done <<< "$active_sessions"

  # Recount after closures
  active_count=$(cd "$ACPX_WORKSPACE" && "$ACPX" claude sessions list 2>/dev/null | grep -vc '\[closed\]' || echo 0)
fi

# --- Step 2: Hand off to OpenClaw if capacity is available -------------------

log "Active sessions after cleanup: $active_count / $MAX_CONCURRENCY"

if [ "$active_count" -lt "$MAX_CONCURRENCY" ]; then
  STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw/state}"
  mkdir -p "$STATE_DIR"
  STATE_FILE="$STATE_DIR/starloop-state.json"

  current_hash=$(compute_state_hash)
  now=$(date +%s)

  if [ "$FORCE" != "true" ] && [ "$session_wrapped_up" = "false" ]; then
    if [ -f "$STATE_FILE" ]; then
      last_hash=$(node -e 'try { const s=JSON.parse(require("fs").readFileSync(process.argv[1])); console.log(s.lastProposalHash||""); } catch { console.log(""); }' "$STATE_FILE" 2>/dev/null || true)
      last_time=$(node -e 'try { const s=JSON.parse(require("fs").readFileSync(process.argv[1])); console.log(s.lastProposalAt||0); } catch { console.log("0"); }' "$STATE_FILE" 2>/dev/null || echo 0)

      if [ -n "$last_hash" ] && [ "$current_hash" = "$last_hash" ]; then
        log "Todo priorities and active tasks unchanged ($current_hash) — skipping duplicate proposal"
        exit 0
      fi

      elapsed=$(( now - last_time ))
      if [ "$elapsed" -lt "$COOLDOWN_SECONDS" ]; then
        log "Proposal cooldown active (${elapsed}s < ${COOLDOWN_SECONDS}s) — skipping proposal"
        exit 0
      fi
    fi
  fi

  log "Capacity available — handing off to OpenClaw"
  
  channel_part=""
  via_part="the default channel"
  if [ -n "$OPENCLAW_CHANNEL" ]; then
    channel_part="--channel $OPENCLAW_CHANNEL "
    via_part="$OPENCLAW_CHANNEL"
  fi

  openclaw agent --agent main \
    --message "Execute the starloop skill with arguments: todos-dir=$TODOS_DIR star-roles=$STAR_ROLES. Send the result via: openclaw message send ${channel_part}--target $OPENCLAW_TARGET --message '[message]'. When the user replies with go, a number, or a task name: spawn a Claude Code ACP session by running: acpx --ttl 0 claude sessions new --name [session-name] (cwd: $ACPX_WORKSPACE). The session name MUST be the full todo filename including the ID suffix, minus .md — e.g. for 'fix-long-order-properties_0fc3acom.md' use 'fix-long-order-properties_0fc3acom'. Then set bypass permissions mode: acpx --ttl 0 claude set-mode -s [session-name] bypassPermissions (cwd: $ACPX_WORKSPACE). Then send the initial task prompt in the background so it does not block: nohup acpx --ttl 0 claude -s [session-name] \"Read $TODOS_DIR/[chosen-filename] and execute the task. If you need input, send: openclaw message send ${channel_part}--target $OPENCLAW_TARGET --message YOUR_QUESTION and pause.\" > /tmp/acpx-[session-name].log 2>&1 & disown. Do NOT discuss the task or ask any questions — just spawn, then confirm to the user via ${via_part}: '🚀 Started session [session-name]. I will update you when done or if Claude needs input.'"

  # Update state record
  cat > "$STATE_FILE" <<EOF
{
  "lastProposalAt": $now,
  "lastProposalHash": "$current_hash"
}
EOF
  log "Updated StarLoop state (hash: $current_hash, time: $now)"
else
  log "At capacity ($active_count/$MAX_CONCURRENCY) — nothing to do"
fi
