#!/bin/bash
# todo-watcher.sh — watches StarFocus todos folder and calls the orchestrator on changes
#
# Triggers starloop-orchestrate.sh when:
#   - A new todo file arrives (potential new work)
#   - An existing todo is updated (may have been completed)
#
# Usage: todo-watcher.sh
#
# Environment variables (passed through to starloop-orchestrate.sh):
#   TODOS_DIR         Path to StarFocus todos folder (required)
#   TELEGRAM_TARGET   Your Telegram user ID (required)
#   STAR_ROLE         Star role to filter todos by (default: Starfocuser)
#   MAX_CONCURRENCY   Max simultaneous Claude Code sessions (default: 1)
#   ACPX              Path to acpx binary (default: acpx on PATH)
#   ACPX_WORKSPACE    Path to acpx workspace dir (default: ~/.openclaw/workspace)

set -euo pipefail

TODOS_DIR="${TODOS_DIR:-/home/openclaw/obsidian/reality-sculptor/todos}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ORCHESTRATE="$SCRIPT_DIR/starloop-orchestrate.sh"

if [ -z "${TELEGRAM_TARGET:-}" ]; then
  echo "Error: TELEGRAM_TARGET is not set." >&2
  echo "  Find it: cat ~/.openclaw/credentials/telegram-default-allowFrom.json" >&2
  exit 1
fi

log() { echo "[$(date '+%H:%M:%S')] $*"; }

log "Watching $TODOS_DIR with inotify"

inotifywait -m -e close_write,moved_to --format '%f' "$TODOS_DIR" 2>/dev/null | while read -r FILENAME; do
  [[ "$FILENAME" != *.md ]] && continue
  log "Change detected: $FILENAME — running orchestrator"
  "$ORCHESTRATE" 2>&1 | log "orchestrate: $(cat)" || log "orchestrator failed"
done
