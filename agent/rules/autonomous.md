---
applyTo: "**"
---

# Autonomous session rules

These rules apply to Claude Code sessions running autonomously via StarLoop.

## Git identity

Before making any commits, configure git to use the bot identity from `~/.config/github-app.env`:

```bash
source <(grep -E '^GITHUB_BOT_GIT_(NAME|EMAIL)=' ~/.config/github-app.env)
git config user.name "$GITHUB_BOT_GIT_NAME"
git config user.email "$GITHUB_BOT_GIT_EMAIL"
```

## Pushing

Always verify uncommitted changes locally, then push directly to `master` using the bot's installation token:

```bash
GH_TOKEN=$(bun run agent/scripts/github-app-token.ts) git push origin master
```
