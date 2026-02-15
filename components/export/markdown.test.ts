import {
	describe,
	expect,
	test,
	beforeEach,
	afterEach,
	setSystemTime,
} from 'bun:test'
import {
	generateFilename,
	todoToMarkdown,
	updateFrontMatter,
	TodoWithRelations,
} from './markdown'

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

describe('todoToMarkdown', () => {
	test('converts a minimal todo to markdown with front matter', () => {
		const result = todoToMarkdown(makeTodo())

		expect(result.split('\n')).toEqual([
			'---',
			'id: todo-abc12345',
			'title: Buy groceries',
			"exportedAt: '2025-06-15T12:00:00.000Z'",
			'---',
			'',
			'',
		])
	})

	test('includes starPoints in front matter', () => {
		const result = todoToMarkdown(makeTodo({ starPoints: 5 }))

		expect(result.split('\n')).toEqual([
			'---',
			'id: todo-abc12345',
			'title: Buy groceries',
			'starPoints: 5',
			"exportedAt: '2025-06-15T12:00:00.000Z'",
			'---',
			'',
			'',
		])
	})

	test('includes star role in front matter', () => {
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
			'id: todo-abc12345',
			'title: Buy groceries',
			'starRole: Developer',
			"exportedAt: '2025-06-15T12:00:00.000Z'",
			'---',
			'',
			'',
		])
	})

	test('includes star role group in front matter', () => {
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
			'id: todo-abc12345',
			'title: Buy groceries',
			'starRole: Developer',
			'starRoleGroup: Work',
			"exportedAt: '2025-06-15T12:00:00.000Z'",
			'---',
			'',
			'',
		])
	})

	test('includes completedAt when todo is completed', () => {
		const result = todoToMarkdown(
			makeTodo({ completedAt: new Date('2025-03-01T10:00:00.000Z') }),
		)

		expect(result.split('\n')).toEqual([
			'---',
			'id: todo-abc12345',
			'title: Buy groceries',
			"completedAt: '2025-03-01T10:00:00.000Z'",
			"exportedAt: '2025-06-15T12:00:00.000Z'",
			'---',
			'',
			'',
		])
	})

	test('does not include completedAt when todo is not completed', () => {
		const result = todoToMarkdown(makeTodo())

		expect(result).not.toContain('completedAt:')
	})
})

describe('updateFrontMatter', () => {
	test('preserves body content when updating front matter', () => {
		const existing =
			'---\nid: todo-abc12345\ntitle: Buy groceries\n---\nMy shopping notes\n'
		const result = updateFrontMatter(existing, makeTodo())

		expect(result.split('\n')).toEqual([
			'---',
			'id: todo-abc12345',
			'title: Buy groceries',
			"exportedAt: '2025-06-15T12:00:00.000Z'",
			'---',
			'My shopping notes',
			'',
		])
	})

	test('updates star role in front matter, preserves body', () => {
		const existing =
			'---\nid: todo-abc12345\ntitle: Buy groceries\n---\nBody content here\n'
		const result = updateFrontMatter(
			existing,
			makeTodo({
				starRoleData: {
					id: 'role-1',
					title: 'Chef',
					icon: { type: 'ionicon', name: 'restaurant-outline' },
				},
			}),
		)

		expect(result.split('\n')).toEqual([
			'---',
			'id: todo-abc12345',
			'title: Buy groceries',
			'starRole: Chef',
			"exportedAt: '2025-06-15T12:00:00.000Z'",
			'---',
			'Body content here',
			'',
		])
	})

	test('updates star points in front matter, preserves body', () => {
		const existing =
			'---\nid: todo-abc12345\ntitle: Buy groceries\nstarPoints: 3\n---\nBody content\n'
		const result = updateFrontMatter(existing, makeTodo({ starPoints: 7 }))

		expect(result.split('\n')).toEqual([
			'---',
			'id: todo-abc12345',
			'title: Buy groceries',
			'starPoints: 7',
			"exportedAt: '2025-06-15T12:00:00.000Z'",
			'---',
			'Body content',
			'',
		])
	})

	test('handles file with front matter only (no body)', () => {
		const existing = '---\nid: todo-abc12345\ntitle: Old title\n---\n'
		const result = updateFrontMatter(existing, makeTodo({ title: 'New title' }))

		expect(result.split('\n')).toEqual([
			'---',
			'id: todo-abc12345',
			'title: New title',
			"exportedAt: '2025-06-15T12:00:00.000Z'",
			'---',
			'',
			'',
		])
	})

	test('handles file with front matter and multi-line body content', () => {
		const existing =
			'---\nid: todo-abc12345\ntitle: Buy groceries\n---\n## Notes\n\n- Milk\n- Bread\n- Eggs\n'
		const result = updateFrontMatter(existing, makeTodo({ starPoints: 2 }))

		expect(result.split('\n')).toEqual([
			'---',
			'id: todo-abc12345',
			'title: Buy groceries',
			'starPoints: 2',
			"exportedAt: '2025-06-15T12:00:00.000Z'",
			'---',
			'## Notes',
			'',
			'- Milk',
			'- Bread',
			'- Eggs',
			'',
		])
	})
})

describe('generateFilename', () => {
	test('generates a filename from title and ID suffix', () => {
		expect(generateFilename(makeTodo())).toBe('buy-groceries_abc12345.md')
	})

	test('sanitizes slash characters from Dexie Cloud realm IDs', () => {
		const filename = generateFilename(makeTodo({ id: 'todABC/rlm1234' }))

		expect(filename).toBe('buy-groceries_crlm1234.md')
		expect(filename).not.toContain('/')
	})
})
