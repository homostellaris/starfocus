import {
	describe,
	expect,
	test,
	beforeEach,
	afterEach,
	setSystemTime,
} from 'bun:test'
import { todoToMarkdown, TodoWithRelations } from './markdown'

beforeEach(() => {
	setSystemTime(new Date('2025-06-15T12:00:00.000Z'))
})

afterEach(() => {
	setSystemTime()
})

function makeTodo(
	overrides: Partial<TodoWithRelations> = {},
): TodoWithRelations {
	return {
		id: 'todo-abc12345',
		title: 'Buy groceries',
		...overrides,
	}
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

test('converts a minimal todo to markdown with front matter', () => {
	const result = todoToMarkdown(makeTodo())

	expect(result.split('\n')).toEqual([
		'---',
		'id: "todo-abc12345"',
		'title: "Buy groceries"',
		'exportedAt: 2025-06-15T12:00:00.000Z',
		'---',
		'',
		'# Buy groceries',
	])
})

test('includes starPoints in front matter and content', () => {
	const result = todoToMarkdown(makeTodo({ starPoints: 5 }))

	expect(result.split('\n')).toEqual([
		'---',
		'id: "todo-abc12345"',
		'title: "Buy groceries"',
		'starPoints: 5',
		'exportedAt: 2025-06-15T12:00:00.000Z',
		'---',
		'',
		'# Buy groceries',
		'',
		'**Star Points:** 5',
	])
})

test('includes star role in front matter and content', () => {
	const result = todoToMarkdown(
		makeTodo({
			starRoleData: {
				id: 'role-1',
				title: 'Developer',
				icon: { type: 'ionicon', name: 'code-outline' },
			},
		}),
	)

	expect(result.split('\n')).toEqual([
		'---',
		'id: "todo-abc12345"',
		'title: "Buy groceries"',
		'starRole:',
		'  id: "role-1"',
		'  title: "Developer"',
		'  icon: "code-outline"',
		'exportedAt: 2025-06-15T12:00:00.000Z',
		'---',
		'',
		'# Buy groceries',
		'',
		'**Role:** Developer',
	])
})

test('includes star role group in front matter and content', () => {
	const result = todoToMarkdown(
		makeTodo({
			starRoleData: {
				id: 'role-1',
				title: 'Developer',
				icon: { type: 'ionicon', name: 'code-outline' },
				starRoleGroupId: 'group-1',
			},
			starRoleGroupData: { id: 'group-1', title: 'Work' },
		}),
	)

	expect(result.split('\n')).toEqual([
		'---',
		'id: "todo-abc12345"',
		'title: "Buy groceries"',
		'starRole:',
		'  id: "role-1"',
		'  title: "Developer"',
		'  icon: "code-outline"',
		'  group: "Work"',
		'exportedAt: 2025-06-15T12:00:00.000Z',
		'---',
		'',
		'# Buy groceries',
		'',
		'**Role:** Work > Developer',
	])
})

test('includes completedAt when todo is completed', () => {
	const completedAt = new Date('2025-03-01T10:00:00.000Z')
	const result = todoToMarkdown(makeTodo({ completedAt }))

	expect(result.split('\n')).toEqual([
		'---',
		'id: "todo-abc12345"',
		'title: "Buy groceries"',
		'completedAt: 2025-03-01T10:00:00.000Z',
		'exportedAt: 2025-06-15T12:00:00.000Z',
		'---',
		'',
		'# Buy groceries',
	])
})

test('does not include completedAt when todo is not completed', () => {
	const result = todoToMarkdown(makeTodo())

	expect(result).not.toContain('completedAt:')
})

test('includes noteUri when todo has a note', () => {
	const result = todoToMarkdown(makeTodo({ note: { uri: 'note://abc' } }))

	expect(result.split('\n')).toEqual([
		'---',
		'id: "todo-abc12345"',
		'title: "Buy groceries"',
		'noteUri: "note://abc"',
		'exportedAt: 2025-06-15T12:00:00.000Z',
		'---',
		'',
		'# Buy groceries',
	])
})

test('includes visit summary in front matter', () => {
	const result = todoToMarkdown(
		makeTodo({
			visitsData: [
				{
					todoId: 'todo-abc12345',
					date: new Date('2025-01-01T09:00:00.000Z'),
				},
				{
					todoId: 'todo-abc12345',
					date: new Date('2025-02-15T14:00:00.000Z'),
				},
			],
		}),
	)

	expect(result.split('\n')).toEqual([
		'---',
		'id: "todo-abc12345"',
		'title: "Buy groceries"',
		'visitCount: 2',
		'lastVisit: 2025-02-15T14:00:00.000Z',
		'exportedAt: 2025-06-15T12:00:00.000Z',
		'---',
		'',
		'# Buy groceries',
	])
})

test('excludes visit history from content by default', () => {
	const result = todoToMarkdown(
		makeTodo({
			visitsData: [
				{
					todoId: 'todo-abc12345',
					date: new Date('2025-01-01T09:00:00.000Z'),
				},
			],
		}),
	)

	expect(result).not.toContain('## Visit History')
})

test('includes visit history in content when includeVisits is true', () => {
	const visitDate1 = new Date('2025-01-01T09:00:00.000Z')
	const visitDate2 = new Date('2025-02-15T14:00:00.000Z')
	const result = todoToMarkdown(
		makeTodo({
			visitsData: [
				{ todoId: 'todo-abc12345', date: visitDate1 },
				{ todoId: 'todo-abc12345', date: visitDate2 },
			],
		}),
		{ includeVisits: true },
	)

	expect(result.split('\n')).toEqual([
		'---',
		'id: "todo-abc12345"',
		'title: "Buy groceries"',
		'visitCount: 2',
		'lastVisit: 2025-02-15T14:00:00.000Z',
		'exportedAt: 2025-06-15T12:00:00.000Z',
		'---',
		'',
		'# Buy groceries',
		'',
		'## Visit History',
		'',
		`- ${formatDate(visitDate2)}`,
		`- ${formatDate(visitDate1)}`,
	])
})

describe('YAML escaping', () => {
	test('escapes double quotes in title', () => {
		const result = todoToMarkdown(makeTodo({ title: 'Read "Dune"' }))

		expect(result.split('\n')).toEqual([
			'---',
			'id: "todo-abc12345"',
			'title: "Read \\"Dune\\""',
			'exportedAt: 2025-06-15T12:00:00.000Z',
			'---',
			'',
			'# Read "Dune"',
		])
	})

	test('escapes backslashes in title', () => {
		const result = todoToMarkdown(makeTodo({ title: 'path\\to\\thing' }))

		expect(result.split('\n')).toEqual([
			'---',
			'id: "todo-abc12345"',
			'title: "path\\\\to\\\\thing"',
			'exportedAt: 2025-06-15T12:00:00.000Z',
			'---',
			'',
			'# path\\to\\thing',
		])
	})

	test('escapes newlines in title', () => {
		const result = todoToMarkdown(makeTodo({ title: 'line1\nline2' }))

		expect(result.split('\n')).toEqual([
			'---',
			'id: "todo-abc12345"',
			'title: "line1\\nline2"',
			'exportedAt: 2025-06-15T12:00:00.000Z',
			'---',
			'',
			'# line1',
			'line2',
		])
	})
})
