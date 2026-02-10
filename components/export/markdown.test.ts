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

test('converts a minimal todo to markdown with front matter', () => {
	const result = todoToMarkdown(makeTodo())

	expect(result.split('\n')).toEqual([
		'---',
		'id: "todo-abc12345"',
		'title: "Buy groceries"',
		'exportedAt: 2025-06-15T12:00:00.000Z',
		'---',
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
		'starRole: "Developer"',
		'exportedAt: 2025-06-15T12:00:00.000Z',
		'---',
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
		'starRole: "Developer"',
		'starRoleGroup: "Work"',
		'exportedAt: 2025-06-15T12:00:00.000Z',
		'---',
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
	])
})

test('does not include completedAt when todo is not completed', () => {
	const result = todoToMarkdown(makeTodo())

	expect(result).not.toContain('completedAt:')
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
		])
	})
})
