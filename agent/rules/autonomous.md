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

Always push using the bot's installation token so the push is attributed to the bot rather than your personal account:

```bash
GH_TOKEN=$(bun run agent/scripts/github-app-token.ts) git push
```

Or for setting up a new remote tracking branch:

```bash
GH_TOKEN=$(bun run agent/scripts/github-app-token.ts) git push -u origin <branch>
```

## Pull requests

Use `ghb` (not `gh`) for all PR operations so they are attributed to the bot:

```bash
ghb pr create --title "..." --body "..."
ghb pr comment <number> --body "@homostellaris PR ready for review."
```

After raising or updating a PR, always post the review comment so @homostellaris receives a push notification.
