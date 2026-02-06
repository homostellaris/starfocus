import { Todo, StarRole, StarRoleGroup, Visit } from '../db'

export interface TodoWithRelations extends Todo {
	starRoleData?: StarRole
	starRoleGroupData?: StarRoleGroup
	visitsData?: Visit[]
}

export interface MarkdownExportOptions {
	includeCompleted?: boolean
	includeVisits?: boolean
}

/**
 * Converts a todo to a markdown string with YAML front matter
 */
export function todoToMarkdown(
	todo: TodoWithRelations,
	options: MarkdownExportOptions = {},
): string {
	const frontMatter = buildFrontMatter(todo)
	const content = buildContent(todo, options)

	return `---\n${frontMatter}---\n\n${content}`
}

function buildFrontMatter(todo: TodoWithRelations): string {
	const lines: string[] = []

	// Core fields
	lines.push(`id: "${todo.id}"`)
	lines.push(`title: "${escapeYamlString(todo.title)}"`)

	// Star points
	if (todo.starPoints !== undefined) {
		lines.push(`starPoints: ${todo.starPoints}`)
	}

	// Star role
	if (todo.starRoleData) {
		lines.push(`starRole:`)
		lines.push(`  id: "${todo.starRoleData.id}"`)
		lines.push(`  title: "${escapeYamlString(todo.starRoleData.title)}"`)
		if (todo.starRoleData.icon) {
			lines.push(`  icon: "${todo.starRoleData.icon.name}"`)
		}
		if (todo.starRoleGroupData) {
			lines.push(`  group: "${escapeYamlString(todo.starRoleGroupData.title)}"`)
		}
	}

	// Completion status - only include completedAt when completed
	if (todo.completedAt) {
		lines.push(`completedAt: ${todo.completedAt.toISOString()}`)
	}

	// Note reference
	if (todo.note?.uri) {
		lines.push(`noteUri: "${todo.note.uri}"`)
	}

	// Visits summary
	if (todo.visitsData && todo.visitsData.length > 0) {
		lines.push(`visitCount: ${todo.visitsData.length}`)
		const lastVisit = todo.visitsData.sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		)[0]
		if (lastVisit) {
			lines.push(`lastVisit: ${new Date(lastVisit.date).toISOString()}`)
		}
	}

	// Metadata
	lines.push(`exportedAt: ${new Date().toISOString()}`)

	return lines.join('\n') + '\n'
}

function buildContent(
	todo: TodoWithRelations,
	options: MarkdownExportOptions,
): string {
	const sections: string[] = []

	// Title as heading
	sections.push(`# ${todo.title}`)

	// Star role badge
	if (todo.starRoleData) {
		const groupPrefix = todo.starRoleGroupData
			? `${todo.starRoleGroupData.title} > `
			: ''
		sections.push(`\n**Role:** ${groupPrefix}${todo.starRoleData.title}`)
	}

	// Star points
	if (todo.starPoints !== undefined) {
		sections.push(`\n**Star Points:** ${todo.starPoints}`)
	}

	// Visits history
	if (options.includeVisits && todo.visitsData && todo.visitsData.length > 0) {
		sections.push(`\n## Visit History\n`)
		const sortedVisits = [...todo.visitsData].sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		)
		for (const visit of sortedVisits) {
			sections.push(`- ${formatDate(new Date(visit.date))}`)
		}
	}

	return sections.join('\n')
}

function escapeYamlString(str: string): string {
	return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

function formatDate(date: Date): string {
	return date.toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

/**
 * Generates a safe filename from a todo title
 */
export function generateFilename(todo: Todo): string {
	// Create a safe filename from the title
	const safeTitle = todo.title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 50)

	// Use a short ID suffix to ensure uniqueness
	const shortId = todo.id.slice(-8)

	return `${safeTitle}-${shortId}.md`
}

/**
 * Creates a manifest file with metadata about the export
 */
export function createManifest(
	todos: TodoWithRelations[],
	starRoles: StarRole[],
	starRoleGroups: StarRoleGroup[],
): string {
	const manifest = {
		exportedAt: new Date().toISOString(),
		version: '1.0.0',
		stats: {
			totalTodos: todos.length,
			activeTodos: todos.filter(t => !t.completedAt).length,
			completedTodos: todos.filter(t => t.completedAt).length,
			todosWithStarPoints: todos.filter(t => t.starPoints !== undefined).length,
			todosWithStarRoles: todos.filter(t => t.starRoleData).length,
		},
		starRoles: starRoles.map(sr => ({
			id: sr.id,
			title: sr.title,
			group: starRoleGroups.find(g => g.id === sr.starRoleGroupId)?.title,
		})),
		starRoleGroups: starRoleGroups.map(g => ({
			id: g.id,
			title: g.title,
		})),
	}

	const frontMatter = `---
type: manifest
exportedAt: ${manifest.exportedAt}
version: ${manifest.version}
---

`

	const content = `# Starfocus Export Manifest

## Statistics

| Metric | Count |
|--------|-------|
| Total Todos | ${manifest.stats.totalTodos} |
| Active Todos | ${manifest.stats.activeTodos} |
| Completed Todos | ${manifest.stats.completedTodos} |
| With Star Points | ${manifest.stats.todosWithStarPoints} |
| With Star Roles | ${manifest.stats.todosWithStarRoles} |

## Star Roles

${starRoles
	.map(sr => {
		const group = starRoleGroups.find(g => g.id === sr.starRoleGroupId)
		return `- **${sr.title}**${group ? ` (${group.title})` : ''}`
	})
	.join('\n')}

## Star Role Groups

${starRoleGroups.map(g => `- **${g.title}**`).join('\n')}

---

*This manifest was automatically generated by Starfocus.*
`

	return frontMatter + content
}
