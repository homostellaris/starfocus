# Starloop Skill

Read a StarFocus todo folder and produce a ranked recommendation for the next task to work on.

## Arguments

- `$ARGUMENTS[0]` — path to the todos folder (e.g. `/mnt/d/Philomath/todos`)
- `$ARGUMENTS[1]` — star role to filter by (e.g. `Starfocuser`)

## Steps

### 1. Read the todo folder

Read all `.md` files in `$ARGUMENTS[0]`. Skip:
- `_manifest.md`
- `_asteroid-field.md`
- `_wayfinder.md`
- Any file with `completedAt` set in its frontmatter

Filter to todos where `starRole` matches `$ARGUMENTS[1]`.

### 2. Read context files

- `_wayfinder.md` — strategic priority order
- `_asteroid-field.md` — urgent/time-sensitive items

### 3. Rank and pick top 3 candidates

Rank using:
1. Position in `_wayfinder.md` (higher = more important)
2. `starPoints` value
3. Presence in `_asteroid-field.md` (urgency boost)
4. Tractability — prefer tasks that can make concrete progress right now

### 4. Output a recommendation message

Format using Telegram markdown. Example:

```
StarLoop 🔄 Top pick: **[title]**

[1–2 sentences: why this one now — strategic priority, momentum, dependencies, urgency]

Other options:
1️⃣ **[title]** — [one-line reason]
2️⃣ **[title]** — [one-line reason]

Reply **go** for the top pick, **1** or **2** for an alternative, or name a different task.
```

Return the message text and the filename for each option so the caller knows which file to pass to Claude Code.
