# Starloop Skill

Use your `starfocus` MCP tools to query your todo vault, analyze priorities, and recommend the next task to work on.

## Steps

### 1. Retrieve Todo Data & Context
Invoke the following MCP tools to get the full picture of your todo vault:
- **`starfocus/get_wayfinder`**: Read the strategic priority list.
- **`starfocus/get_asteroid_field`**: Read the list of urgent/active items.
- **`starfocus/list_todos`**: Fetch the lightweight summary of all incomplete todos (containing filename, title, starRole, starPoints, wayfinderIndex, inAsteroidField).

### 2. Identify Candidates
Review the list of incomplete todos. Use your own intelligence to match them against your user profile (`USER.md`), strategic goals, and recent memories. 
Select the top 3 most promising and tractable candidates. 
If you need to read the full details or descriptions for any candidate todo to assess its complexity, use the **`starfocus/get_todo`** tool.

### 3. Output Recommendation
Format your output using Telegram/WhatsApp markdown. Recommend the top pick and explain why, offering two alternative options.

Example:
```
StarLoop 🔄 Top pick: **[title]**

**Why now:** [2–3 sentences: why it is important based on wayfinder/asteroid-field, why it matches your recent memories or current priorities]

Other options:
1️⃣ **[title]** — [one-line reason]
2️⃣ **[title]** — [one-line reason]

Reply **go** for the top pick, **1** or **2** for an alternative, or name a different task.
```
