---
name: starloop
description: "Read a StarFocus todo folder and produce a ranked recommendation for the next task to work on. Parses todo markdown files, applies wayfinder priorities and asteroid-field urgency, ranks by star points and tractability, and outputs a Telegram-formatted pick message. Use when the user wants task recommendations, next-task suggestions, or priority ranking from their StarFocus todos."
---

# Starloop

Read a StarFocus todo folder and produce a ranked recommendation for the next task to work on.

## Arguments

- `$ARGUMENTS[0]` — path to the todos folder (e.g. `/mnt/d/Philomath/todos`)
- `$ARGUMENTS[1]` — comma-separated star roles to filter by (e.g. `Starfocuser,Autism helper`). If omitted or empty, include todos with any star role.

## Workflow

### 1. Read the todo folder

Read all `.md` files in `$ARGUMENTS[0]`. Skip these files:
- `_manifest.md`
- `_asteroid-field.md`
- `_wayfinder.md`
- Any file with `completedAt` set in its frontmatter

If `$ARGUMENTS[1]` is provided, filter to todos where `starRole` matches any value in the comma-separated list. If omitted or empty, include all todos regardless of star role.

### 2. Read context files

- `_wayfinder.md` — strategic priority order
- `_asteroid-field.md` — urgent/time-sensitive items

### 3. Rank and pick top 3 candidates

Rank using these criteria in priority order:
1. Position in `_wayfinder.md` (higher = more important)
2. `starPoints` value (higher = more weight)
3. Presence in `_asteroid-field.md` (urgency boost)
4. Tractability — prefer tasks that can make concrete progress right now

### 4. Output a recommendation message

Format using Telegram markdown:

```
StarLoop 🔄 Top pick: **[title]**

[1–2 sentences: why this one now — strategic priority, momentum, dependencies, urgency]

Other options:
1️⃣ **[title]** — [one-line reason]
2️⃣ **[title]** — [one-line reason]

Reply **go** for the top pick, **1** or **2** for an alternative, or name a different task.
```

Return the message text and the full filename (including ID suffix) for each option so the caller knows which file to pass to Claude Code.

## Important: filename ID suffixes

Todo filenames follow the pattern `[title]_[id].md` where `[id]` is a short unique identifier (e.g. `star-role-descriptions_dfif0com.md`). The ID suffix is the primary key that links the file to the database record and to the ACP session. Never omit or shorten it — always reference todos by their full filename.
