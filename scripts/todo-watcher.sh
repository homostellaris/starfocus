#!/bin/bash
# todo-watcher.sh — watches StarFocus todos folder and calls the orchestrator on changes
#
# Triggers starloop-orchestrate.sh when:
#   - A new todo file arrives (potential new work)
#   - An existing todo is updated (may have been completed)
#   - Priority/index files (_wayfinder.md, _asteroid-field.md, etc.) change
#
# Uses an inotify stream debounced by a configurable quiet window (default: 25s)
# so bursts of file writes (e.g. creating multiple todos or Obsidian sync runs)
# coalesce into a single orchestrator run.
#
# Usage: todo-watcher.sh
#
# Environment variables (passed through to starloop-orchestrate.sh):
#   TODOS_DIR                 Path to StarFocus todos folder (required)
#   OPENCLAW_CHANNEL          OpenClaw message channel (e.g. telegram, whatsapp) (optional)
#   OPENCLAW_TARGET           OpenClaw target user ID/phone number (required)
#   STAR_ROLES                Comma-separated star roles to filter todos by (optional)
#   MAX_CONCURRENCY           Max simultaneous Claude Code sessions (default: 1)
#   ACPX                      Path to acpx binary (default: acpx on PATH)
#   ACPX_WORKSPACE            Path to acpx workspace dir (default: ~/.openclaw/workspace)
#   STARLOOP_DEBOUNCE_SECONDS Quiet period in seconds to wait before triggering (default: 25)

set -euo pipefail

TODOS_DIR="${TODOS_DIR:-/home/openclaw/obsidian/reality-sculptor/todos}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ORCHESTRATE="$SCRIPT_DIR/starloop-orchestrate.sh"
DEBOUNCE_SECONDS="${STARLOOP_DEBOUNCE_SECONDS:-25}"

# Fallback check
if [ -z "${OPENCLAW_TARGET:-}" ] && [ -n "${TELEGRAM_TARGET:-}" ]; then
  export OPENCLAW_TARGET="$TELEGRAM_TARGET"
  export OPENCLAW_CHANNEL="${OPENCLAW_CHANNEL:-telegram}"
elif [ -z "${OPENCLAW_TARGET:-}" ] && [ -n "${WHATSAPP_TARGET:-}" ]; then
  export OPENCLAW_TARGET="$WHATSAPP_TARGET"
  export OPENCLAW_CHANNEL="${OPENCLAW_CHANNEL:-whatsapp}"
fi

if [ -z "${OPENCLAW_TARGET:-}" ]; then
  echo "Error: Neither OPENCLAW_TARGET, TELEGRAM_TARGET, nor WHATSAPP_TARGET is set." >&2
  exit 1
fi

log() { echo "[$(date '+%H:%M:%S')] $*"; }

if [ ! -d "$TODOS_DIR" ]; then
  echo "Error: TODOS_DIR '$TODOS_DIR' does not exist or is not a directory." >&2
  exit 1
fi

if ! command -v inotifywait >/dev/null 2>&1; then
  echo "Error: inotifywait is not installed or not in PATH." >&2
  exit 1
fi

FIFO=$(mktemp -u /tmp/todo-watcher-fifo.XXXXXX)
mkfifo "$FIFO"
exec 3<>"$FIFO"
rm -f "$FIFO"

cleanup() {
  log "Stopping watcher..."
  if [ -n "${INOTIFY_PID:-}" ]; then
    kill "$INOTIFY_PID" 2>/dev/null || true
  fi
  exec 3>&- 2>/dev/null || true
  exit 0
}
trap cleanup EXIT INT TERM

log "Watching $TODOS_DIR with inotify (debounce: ${DEBOUNCE_SECONDS}s)"
inotifywait -m -e close_write,moved_to,create --format '%f' "$TODOS_DIR" 2>/dev/null >&3 &
INOTIFY_PID=$!

while true; do
  if ! read -r -u 3 FILENAME; then
    log "Inotify monitor pipe closed. Exiting."
    break
  fi

  [[ "$FILENAME" != *.md ]] && continue

  log "Change detected: $FILENAME — debouncing (${DEBOUNCE_SECONDS}s quiet window)..."

  deadline=$(( $(date +%s) + DEBOUNCE_SECONDS ))
  while true; do
    now=$(date +%s)
    remaining=$(( deadline - now ))
    [ "$remaining" -le 0 ] && break

    if read -t "$remaining" -r -u 3 NEXT_FILE; then
      if [[ "$NEXT_FILE" == *.md ]]; then
        deadline=$(( $(date +%s) + DEBOUNCE_SECONDS ))
        log "Additional change detected: $NEXT_FILE — extending quiet window (${DEBOUNCE_SECONDS}s)..."
      fi
    else
      # Timeout elapsed with no events in quiet window
      break
    fi
  done

  log "Debounce window settled. Running orchestrator..."
  "$ORCHESTRATE" 2>&1 | while IFS= read -r line; do log "orchestrate: $line"; done || log "orchestrator finished with errors"
done
