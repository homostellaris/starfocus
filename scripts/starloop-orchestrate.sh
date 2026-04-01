#!/bin/bash
# starloop-orchestrate.sh — idempotent StarLoop orchestrator
#
# Checks active Claude Code ACP sessions, wraps up any whose todo is complete,
# then hands off to OpenClaw to pick and start a new task if capacity is free.
#
# Called by: OpenClaw cron job (every 4h) and todo-watcher.sh (on file events)
#
# Usage: starloop-orchestrate.sh
#
# Environment variables:
#   TODOS_DIR         Path to StarFocus todos folder (required)
#   TELEGRAM_TARGET   Your Telegram user ID (required)
#   STAR_ROLE         Star role to filter todos by (default: Starfocuser)
#   MAX_CONCURRENCY   Max simultaneous Claude Code sessions (default: 1)
#   ACPX              Path to acpx binary (default: acpx on PATH)
#   ACPX_WORKSPACE    Path to acpx workspace dir (default: ~/.openclaw/workspace)

set -euo pipefail

TODOS_DIR="${TODOS_DIR:-}"
TELEGRAM_TARGET="${TELEGRAM_TARGET:-}"
STAR_ROLE="${STAR_ROLE:-Starfocuser}"
MAX_CONCURRENCY="${MAX_CONCURRENCY:-1}"
ACPX="${ACPX:-$(command -v acpx 2>/dev/null || echo "")}"
ACPX_WORKSPACE="${ACPX_WORKSPACE:-$HOME/.openclaw/workspace}"

# --- Validation ---------------------------------------------------------------

if [ -z "$TODOS_DIR" ]; then
  echo "Error: TODOS_DIR is not set." >&2
  exit 1
fi

if [ -z "$TELEGRAM_TARGET" ]; then
  echo "Error: TELEGRAM_TARGET is not set." >&2
  exit 1
fi

if [ -z "$ACPX" ]; then
  echo "Error: acpx not found. Install it or set the ACPX environment variable." >&2
  exit 1
fi

# --- Helpers ------------------------------------------------------------------

log() { echo "[$(date '+%H:%M:%S')] $*"; }

todo_is_complete() {
  local session_name="$1"
  local todo_file="$TODOS_DIR/${session_name}.md"
  [ -f "$todo_file" ] && grep -qE '^completedAt:.+[0-9]' "$todo_file"
}

steer_and_close() {
  local session_name="$1"
  local steer_msg="The user has marked this todo complete. Please finish any in-progress work, raise a PR if not already done, then exit cleanly."

  log "Steering session '$session_name' to wrap up..."
  if ! (cd "$ACPX_WORKSPACE" && "$ACPX" claude -s "$session_name" "$steer_msg" 2>&1) | log "acpx steer: $(cat)"; then
    log "Steer failed — attempting session resume"
    local session_id
    session_id=$(cd "$ACPX_WORKSPACE" && "$ACPX" claude sessions show "$session_name" 2>/dev/null | awk '/^sessionId:/ {print $2}')
    if [ -n "$session_id" ]; then
      log "Resuming Claude Code session $session_id"
      (cd "$ACPX_WORKSPACE" && "$ACPX" claude sessions new --name "$session_name" --resume-session "$session_id" 2>&1) | log "acpx resume: $(cat)"
      sleep 5
      (cd "$ACPX_WORKSPACE" && "$ACPX" claude -s "$session_name" "$steer_msg" 2>&1) | log "acpx steer (resumed): $(cat)" || log "acpx steer failed after resume"
    else
      log "Could not retrieve session ID for '$session_name' — skipping resume"
    fi
  fi

  log "Waiting 60s for '$session_name' to wrap up..."
  sleep 60

  log "Closing session '$session_name'"
  (cd "$ACPX_WORKSPACE" && "$ACPX" claude sessions close "$session_name" 2>&1) | log "acpx close: $(cat)" || log "acpx close failed"
}

# --- Step 1: Check active sessions, wrap up completed todos -------------------

log "Checking active ACP sessions..."
active_sessions=$(cd "$ACPX_WORKSPACE" && "$ACPX" claude sessions list 2>/dev/null | grep -v '\[closed\]' || true)

if [ -z "$active_sessions" ]; then
  log "No active sessions"
  active_count=0
else
  log "Active sessions:"
  echo "$active_sessions" | while IFS=$'\t' read -r _id name _rest; do
    log "  $name"
  done

  # Wrap up any session whose todo is complete, serially to respect concurrency
  while IFS=$'\t' read -r _id name _rest; do
    if todo_is_complete "$name"; then
      log "Todo complete for session '$name' — wrapping up"
      steer_and_close "$name"
    fi
  done <<< "$active_sessions"

  # Recount after closures
  active_count=$(cd "$ACPX_WORKSPACE" && "$ACPX" claude sessions list 2>/dev/null | grep -vc '\[closed\]' || echo 0)
fi

# --- Step 2: Hand off to OpenClaw if capacity is available -------------------

log "Active sessions after cleanup: $active_count / $MAX_CONCURRENCY"

if [ "$active_count" -lt "$MAX_CONCURRENCY" ]; then
  log "Capacity available — handing off to OpenClaw"
  openclaw agent --agent main \
    --message "Run /starloop $TODOS_DIR $STAR_ROLE and send the result via: openclaw message send --channel telegram --target $TELEGRAM_TARGET --message '[message]'. When the user replies with go, a number, or a task name: spawn a Claude Code ACP session by running: acpx claude sessions new --name [session-name] (cwd: $ACPX_WORKSPACE). The session name MUST be the full todo filename including the ID suffix, minus .md — e.g. for 'fix-long-order-properties_0fc3acom.md' use 'fix-long-order-properties_0fc3acom'. Then send the task via: acpx claude -s [session-name] \"Read $TODOS_DIR/[chosen-filename] and execute the task. If you need input, send: openclaw message send --channel telegram --target $TELEGRAM_TARGET --message YOUR_QUESTION and pause.\". Do NOT discuss the task or ask any questions — just spawn, then confirm to the user via Telegram: '🚀 Started session [session-name]. I will update you when done or if Claude needs input.'"
else
  log "At capacity ($active_count/$MAX_CONCURRENCY) — nothing to do"
fi
