#!/bin/bash
# todo-watcher.sh — polls StarFocus todo folder for completedAt changes
# Note: inotify doesn't fire on /mnt/d (Windows-mounted drive), so we poll.
#
# Usage: todo-watcher.sh [todo-dir] [poll-interval-seconds]
#
# Environment variables:
#   TELEGRAM_TARGET   Your Telegram user ID (required)
#   TODOS_DIR         Path to StarFocus todos folder (default: first argument)
#   STAR_ROLE         Star role to filter todos by (default: Starfocuser)
#   ACPX              Path to acpx binary (default: acpx on PATH)
#   ACPX_WORKSPACE    Path to acpx workspace dir (default: ~/.openclaw/workspace)

set -euo pipefail

TODO_DIR="${1:-${TODOS_DIR:-/mnt/d/Philomath/todos}}"
POLL_INTERVAL="${2:-30}"  # seconds
STAR_ROLE="${STAR_ROLE:-Starfocuser}"

ACPX="${ACPX:-$(command -v acpx 2>/dev/null || echo "")}"
if [ -z "$ACPX" ]; then
  echo "Error: acpx not found. Install it or set the ACPX environment variable." >&2
  exit 1
fi

ACPX_WORKSPACE="${ACPX_WORKSPACE:-$HOME/.openclaw/workspace}"

if [ -z "${TELEGRAM_TARGET:-}" ]; then
  echo "Error: TELEGRAM_TARGET is not set. Export your Telegram user ID." >&2
  echo "  Find it: cat ~/.openclaw/credentials/telegram-default-allowFrom.json" >&2
  exit 1
fi

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# Snapshot: file→completedAt pairs for all todos with completedAt set
snapshot() {
  grep -rlE '^completedAt:.+[0-9]' "$TODO_DIR" 2>/dev/null \
    | xargs -I{} sh -c 'f="{}"; v=$(grep -m1 "^completedAt:" "$f"); echo "$f|$v"' \
    | sort
}

PREV=$(snapshot)
log "Watching $TODO_DIR every ${POLL_INTERVAL}s (role: $STAR_ROLE, Telegram: $TELEGRAM_TARGET)"

while true; do
  sleep "$POLL_INTERVAL"

  CURR=$(snapshot)

  if [ "$CURR" != "$PREV" ]; then
    # Lines in CURR not in PREV = newly completed todos
    NEW=$(comm -13 <(echo "$PREV") <(echo "$CURR") | head -5)

    if [ -n "$NEW" ]; then
      TODO_FILE=$(echo "$NEW" | head -1 | cut -d'|' -f1 | xargs basename)
      SESSION_NAME="${TODO_FILE%.md}"
      log "Completed: $TODO_FILE — steering acpx session '$SESSION_NAME'"

      # Try to steer the running session; if dead, resume it first
      STEER_MSG="The user has marked the current todo complete in their StarFocus app. Please finish any in-progress work, raise a PR if not already done, then exit cleanly."
      if ! "$ACPX" claude -s "$SESSION_NAME" "$STEER_MSG" 2>&1 | log "acpx steer: $(cat)"; then
        log "Session appears dead — attempting resume"
        SESSION_ID=$(cd "$ACPX_WORKSPACE" && "$ACPX" claude sessions show "$SESSION_NAME" 2>/dev/null | awk '/^sessionId:/ {print $2}')
        if [ -n "$SESSION_ID" ]; then
          log "Resuming Claude Code session $SESSION_ID"
          (cd "$ACPX_WORKSPACE" && "$ACPX" claude sessions new --name "$SESSION_NAME" --resume-session "$SESSION_ID" 2>&1) | log "acpx resume: $(cat)"
          sleep 5
          (cd "$ACPX_WORKSPACE" && "$ACPX" claude -s "$SESSION_NAME" "$STEER_MSG" 2>&1) | log "acpx steer (resumed): $(cat)" || log "acpx steer failed after resume"
        else
          log "Could not retrieve session ID for $SESSION_NAME — skipping resume"
        fi
      fi

      # Give it 60s to wrap up, then close
      sleep 60
      "$ACPX" claude sessions close "$SESSION_NAME" 2>&1 \
        | log "acpx close: $(cat)" || log "acpx close failed"

      # Notify OpenClaw to pick the next todo
      openclaw agent \
        --message "Starloop session for $TODO_FILE has ended. Run /starloop $TODO_DIR $STAR_ROLE and send the recommendation via: openclaw message send --channel telegram --target $TELEGRAM_TARGET --message '[message]'" \
        2>&1 | log "openclaw agent: $(cat)"
    fi

    PREV="$CURR"
  fi
done
