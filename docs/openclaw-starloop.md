# StarLoop with OpenClaw

StarLoop is an autonomous work loop that uses OpenClaw to orchestrate Claude Code sessions against your StarFocus todos. OpenClaw handles scheduling, task selection, and user approval via Telegram. Claude Code handles execution.

## How it works

1. **Every 4 hours**, an OpenClaw cron job wakes up and runs the `/starloop` skill against your todos folder.
2. The skill reads your wayfinder and asteroid field, ranks uncompleted Starfocuser todos, and produces a recommendation with reasoning.
3. OpenClaw sends the recommendation to you via **Telegram** with a top pick and two alternatives.
4. You reply `go`, `1`, `2`, or a task name.
5. OpenClaw spawns a **Claude Code ACP session** (named after the todo file) and passes it the todo filepath.
6. Claude Code reads the todo and executes the task autonomously. If it needs input, it messages you via Telegram and pauses.
7. When you mark the todo complete in the StarFocus app, a **todo watcher** detects the `completedAt` change, steers Claude Code to wrap up, closes the session, and triggers the next cycle.

```
Cron (4h)
  └─▶ /starloop skill → ranked recommendation
        └─▶ Telegram message to user
              └─▶ User replies
                    └─▶ sessions_spawn (ACP) → Claude Code session
                          ├─▶ Claude works autonomously
                          ├─▶ Claude ←→ User via Telegram (if input needed)
                          └─▶ User marks done in app
                                └─▶ todo-watcher detects completedAt
                                      └─▶ acpx steer → wrap up → close
                                            └─▶ next cycle
```

## Prerequisites

- [OpenClaw](https://openclaw.ai) installed and running
- Telegram channel connected (`openclaw channels login --channel telegram`)
- Vercel AI Gateway configured as the model provider
- `acpx` available: symlinked from the OpenClaw extension bundle (see setup)
- Claude Code CLI installed (`npm i -g @anthropic-ai/claude-code`)

## Setup

### 1. Configure the cron job

Add the starloop orchestrator cron job via OpenClaw:

```bash
openclaw cron add \
  --name starloop-orchestrator \
  --every 4h \
  --session main \
  --system-event "Starloop check: check for active ACP sessions with agentId 'claude' — if any exist, a starloop task is already running, do nothing and stop. Otherwise, run /starloop /mnt/d/Philomath/todos Starfocuser. Send the result via: openclaw message send --channel telegram --target <YOUR_TELEGRAM_ID> --message \"[message]\". When the user replies with go, a number, or a task name: use sessions_spawn with runtime:\"acp\", agentId:\"claude\", cwd:\"<PATH_TO_THIS_REPO>\", and task:\"Read /mnt/d/Philomath/todos/[chosen-filename] and execute the task. If you need input, send: openclaw message send --channel telegram --target <YOUR_TELEGRAM_ID> --message YOUR_QUESTION and pause.\". Use the todo filename minus .md as the session label. Do NOT discuss the task or ask any questions — just spawn, then confirm to the user via Telegram using the exact session label."
```

Replace:
- `<YOUR_TELEGRAM_ID>` — your Telegram user ID (find it with `openclaw directory peers list --channel telegram` or from `~/.openclaw/credentials/telegram-default-allowFrom.json`)
- `/mnt/d/Philomath/todos` — path to your StarFocus todos folder
- `<PATH_TO_THIS_REPO>` — absolute path to this repository
- `Starfocuser` — your star role (or whichever role you want to loop over)

### 2. Configure Claude Code sessions for autonomous use

The `.claude/settings.json` in this repo already sets `bypassPermissions` mode so spawned sessions run without approval prompts. No action needed.

### 3. Set up the todo watcher

The watcher polls your todos folder for `completedAt` changes (polling is used instead of inotify because the todos folder is on a Windows-mounted drive in WSL2).

Copy the script somewhere permanent and start it:

```bash
cp scripts/todo-watcher.sh ~/.openclaw/scripts/todo-watcher.sh
chmod +x ~/.openclaw/scripts/todo-watcher.sh

# Run in background
nohup ~/.openclaw/scripts/todo-watcher.sh /mnt/d/Philomath/todos \
  > ~/.openclaw/logs/todo-watcher.log 2>&1 &
```

Or run it as a systemd user service for reliability across reboots (see below).

### 4. Install acpx

`acpx` is bundled with OpenClaw's extension but not on PATH by default:

```bash
cd ~/.npm-global/lib/node_modules/openclaw/dist/extensions/acpx
npm install --omit=dev --no-save acpx@0.3.1
ln -sf $(pwd)/node_modules/.bin/acpx ~/.local/bin/acpx
acpx --version  # should print 0.3.1
```

### 5. Find your Telegram user ID

```bash
cat ~/.openclaw/credentials/telegram-default-allowFrom.json
```

## Running the todo watcher as a systemd service

```ini
# ~/.config/systemd/user/starloop-watcher.service
[Unit]
Description=StarLoop todo watcher
After=network.target

[Service]
ExecStart=/home/<user>/.openclaw/scripts/todo-watcher.sh /mnt/d/Philomath/todos
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now starloop-watcher
```

## The `/starloop` skill

The skill lives at `skills/starloop/SKILL.md` in this repo. It handles only **task selection** — reading todos, ranking by wayfinder position, star points, and urgency, and producing a formatted Telegram message with a top pick and alternatives. Orchestration (sending messages, spawning sessions) is handled by the cron job.

## Caveats

- **inotify on WSL2**: inotify does not fire for changes on Windows-mounted drives (`/mnt/`). The watcher uses polling (every 30s by default) instead.
- **Session guard**: The cron checks for active ACP sessions before starting a new one. If a session is detected, the cycle is skipped silently.
- **Model**: Task selection uses the default OpenClaw model (configured as `vercel-ai-gateway/anthropic/claude-sonnet-4.6`). Claude Code execution uses whatever model Claude Code defaults to.
