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
                    └─▶ acpx claude sessions new → Claude Code session
                          ├─▶ Claude works autonomously
                          ├─▶ Claude ←→ User via Telegram (if input needed)
                          └─▶ User marks done in app
                                └─▶ todo-watcher detects completedAt (inotify)
                                      └─▶ acpx steer → wrap up → close
                                            └─▶ next cycle
```

## Prerequisites

- [OpenClaw](https://openclaw.ai) installed and running
- Telegram channel connected (`openclaw channels login --channel telegram`)
- Vercel AI Gateway configured as the model provider
- `acpx` available: symlinked from the OpenClaw extension bundle (see setup)
- Claude Code CLI installed (`npm i -g @anthropic-ai/claude-code`)
- **Obsidian Sync** subscription (required for headless sync — see below)

## Syncing todos with obsidian-headless

StarFocus exports your todos as markdown files. If you annotate those files with notes in Obsidian (e.g. from your phone), Claude Code needs to be able to read those notes when it starts a session.

**Do not rely on the Obsidian desktop app for this.** The desktop app only syncs while it is open and in the foreground — on Windows it will stop receiving changes when the screen is locked or the app is minimised, even on a desktop PC that otherwise stays awake. This means notes you write on your phone may not appear until you physically open Obsidian.

Instead, use **[obsidian-headless](https://github.com/obsidianmd/obsidian-headless)** — Obsidian's official CLI sync client (released February 2026). It runs as a background daemon and syncs your vault continuously without the GUI app, so notes written on mobile appear on disk within seconds.

### Install and configure obsidian-headless

```bash
bun install -g obsidian-headless   # or: npm install -g obsidian-headless
ob login
ob sync-list-remote                # find your vault name
ob sync-setup --vault "My Vault" --path ~/obsidian/my-vault
ob sync-config --path ~/obsidian/my-vault --direction pull-only
```

Use `pull-only` mode so local filesystem changes (e.g. from Claude Code) are never pushed back to your vault.

### Run as a systemd user service

```ini
# ~/.config/systemd/user/obsidian-sync.service
[Unit]
Description=Obsidian headless sync (pull-only)
After=network-online.target

[Service]
ExecStart=/home/<user>/.bun/bin/ob sync --continuous --path /home/<user>/obsidian/my-vault
Restart=on-failure
RestartSec=10
Environment=PATH=/home/<user>/.bun/bin:/usr/local/bin:/usr/bin:/bin

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now obsidian-sync
```

## Setup

### 1. Configure the cron job

Find your Telegram user ID first:

```bash
cat ~/.openclaw/credentials/telegram-default-allowFrom.json
```

Add the starloop orchestrator cron job:

```bash
openclaw cron add \
  --name starloop-orchestrator \
  --every 4h \
  --session main \
  --system-event "Starloop check: check for active ACP sessions with agentId 'claude' — if any exist, a starloop task is already running, do nothing and stop. Otherwise, run /starloop <TODOS_DIR> <STAR_ROLE>. Send the result via: openclaw message send --channel telegram --target <YOUR_TELEGRAM_ID> --message \"[message]\". When the user replies with go, a number, or a task name: spawn a Claude Code ACP session by running: acpx claude sessions new --name [todo-filename-no-ext] (cwd: ~/.openclaw/workspace). Then send the task via: acpx claude -s [todo-filename-no-ext] \"Read <TODOS_DIR>/[chosen-filename] and execute the task. If you need input, send: openclaw message send --channel telegram --target <YOUR_TELEGRAM_ID> --message YOUR_QUESTION and pause.\". Do NOT discuss the task or ask any questions — just spawn, then confirm to the user via Telegram: '🚀 Started session [todo-filename-no-ext]. I will update you when done or if Claude needs input.'"
```

Replace:
- `<YOUR_TELEGRAM_ID>` — your Telegram user ID
- `<TODOS_DIR>` — path to your todos folder (e.g. `/home/<user>/obsidian/my-vault/todos`)
- `<STAR_ROLE>` — your star role (e.g. `Starfocuser`)

### 2. Configure Claude Code sessions for autonomous use

The `.claude/settings.json` in this repo already sets `bypassPermissions` mode so spawned sessions run without approval prompts. No action needed.

### 3. Set up the todo watcher

The watcher uses `inotifywait` to detect `completedAt` changes in real time. It requires your todos folder to be on a **native Linux filesystem** — this is another reason to use obsidian-headless rather than a Windows-mounted drive (inotify does not fire on `/mnt/` paths in WSL2).

Run the script directly from the repo as a systemd user service so it stays in sync with updates:

```ini
# ~/.config/systemd/user/starloop-watcher.service
[Unit]
Description=StarLoop todo watcher
After=network.target obsidian-sync.service
Wants=obsidian-sync.service

[Service]
ExecStart=/path/to/starfocus/scripts/todo-watcher.sh
Restart=on-failure
RestartSec=10
Environment=TODOS_DIR=/home/<user>/obsidian/my-vault/todos
Environment=TELEGRAM_TARGET=<YOUR_TELEGRAM_ID>
Environment=STAR_ROLE=Starfocuser
Environment=ACPX=/home/<user>/.local/bin/acpx

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now starloop-watcher
```

### 4. Install acpx

`acpx` is bundled with OpenClaw's extension but not on PATH by default:

```bash
cd ~/.npm-global/lib/node_modules/openclaw/dist/extensions/acpx
npm install --omit=dev --no-save acpx@0.3.1
ln -sf $(pwd)/node_modules/.bin/acpx ~/.local/bin/acpx
acpx --version  # should print 0.3.1
```

## The `/starloop` skill

The skill lives at `skills/starloop/SKILL.md` in this repo. It handles only **task selection** — reading todos, ranking by wayfinder position, star points, and urgency, and producing a formatted Telegram message with a top pick and alternatives. Orchestration (sending messages, spawning sessions) is handled by the cron job.

## Dead session recovery

Claude Code ACP sessions can die unexpectedly (process killed, machine rebooted, etc.). When the todo watcher detects a completion and the steer fails, it automatically attempts to resume the session:

1. Retrieves the Claude Code session ID via `acpx claude sessions show`
2. Calls `acpx claude sessions new --resume-session <id>` to reconnect to the existing conversation history
3. Re-steers the resumed session to wrap up and raise a PR

## Caveats

- **Session guard**: The cron checks for active ACP sessions before starting a new one. If a session is detected, the cycle is skipped silently.
- **Model**: Task selection uses the default OpenClaw model (configured as `vercel-ai-gateway/anthropic/claude-sonnet-4.6`). Claude Code execution uses whatever model Claude Code defaults to.
- **Vercel CLI**: Do not authenticate the Vercel CLI in autonomous sessions — it requires team-scoped tokens with broad write access. See `CLAUDE.md` for details.
- **obsidian-headless credentials**: `ob login` stores your Obsidian account credentials locally at `~/.config/obsidian-headless/`. Use `pull-only` sync mode to limit blast radius. Consider running under a dedicated system user if you need stronger isolation.
