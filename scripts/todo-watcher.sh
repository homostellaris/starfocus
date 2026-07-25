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
#   OPENCLAW_CHANNEL  OpenClaw message channel (e.g. telegram, whatsapp) (optional)
#   OPENCLAW_TARGET   OpenClaw target user ID/phone number (required)
#   STAR_ROLE         Star role to filter todos by (default: Starfocuser)
#   MAX_CONCURRENCY   Max simultaneous Claude Code sessions (default: 1)
#   ACPX              Path to acpx binary (default: acpx on PATH)
#   ACPX_WORKSPACE    Path to acpx workspace dir (default: ~/.openclaw/workspace)

set -euo pipefail

TODOS_DIR="${TODOS_DIR:-/home/openclaw/obsidian/reality-sculptor/todos}"
CRON_JOB_ID="6bdc9802-39dd-4888-a6b4-efd3f240821c"

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

log "Watching $TODOS_DIR with inotify"

inotifywait -m -e close_write,moved_to --format '%f' "$TODOS_DIR" 2>/dev/null | while read -r FILENAME; do
  [[ "$FILENAME" != *.md ]] && continue
  log "Change detected: $FILENAME — triggering OpenClaw cron"
  openclaw cron run "$CRON_JOB_ID" || log "cron run failed"
done
