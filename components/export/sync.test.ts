import {
	describe,
	expect,
	test,
	beforeEach,
	afterEach,
	setSystemTime,
} from 'bun:test'
import matter from 'gray-matter'
import { upsertTodoFiles, FileOperations, TodoFile } from './sync'

beforeEach(() => {
	setSystemTime(new Date('2025-06-15T12:00:00.000Z'))
})

afterEach(() => {
	setSystemTime()
})

function createInMemoryFileOps(
	initial: Record<string, string> = {},
): FileOperations & { files: Record<string, string> } {
	const files = { ...initial }
	return {
		files,
		async readFile(filename: string) {
			return files[filename] ?? null
		},
		async writeFile(filename: string, content: string) {
			files[filename] = content
			return true
		},
		async deleteFile(filename: string) {
			delete files[filename]
			return true
		},
		async listFiles() {
			return Object.keys(files)
		},
	}
}

function makeTodoFile(overrides: Partial<TodoFile> = {}): TodoFile {
	const todoId = overrides.todoId ?? 'todo-1'
	const title = 'Buy groceries'
	const frontMatterData = overrides.frontMatterData ?? {
		id: todoId,
		title,
		exportedAt: '2025-06-15T12:00:00.000Z',
	}
	return {
		todoId,
		filename: overrides.filename ?? 'buy-groceries_todo-1.md',
		content: overrides.content ?? matter.stringify('', frontMatterData),
		frontMatterData,
		...overrides,
	}
}

describe('creating files', () => {
	test('creates a file when todo has no existing markdown file', async () => {
		const ops = createInMemoryFileOps()

		const result = await upsertTodoFiles([makeTodoFile()], ops)

		expect(result.created).toBe(1)
		expect(result.updated).toBe(0)
		expect(ops.files['buy-groceries_todo-1.md']).toContain('id: todo-1')
	})

	test('creates files for all todos on first sync', async () => {
		const ops = createInMemoryFileOps()
		const todos = [
			makeTodoFile({ todoId: 'todo-1', filename: 'todo-1.md' }),
			makeTodoFile({ todoId: 'todo-2', filename: 'todo-2.md' }),
		]

		const result = await upsertTodoFiles(todos, ops)

		expect(result.created).toBe(2)
		expect(result.updated).toBe(0)
		expect(Object.keys(ops.files)).toHaveLength(2)
	})
})

describe('updating files', () => {
	test('updates front matter of existing file, preserves user-added body content', async () => {
		const existingContent = [
			'---',
			'id: todo-1',
			'title: Buy groceries',
			'starPoints: 3',
			'---',
			'My shopping list',
			'',
		].join('\n')
		const ops = createInMemoryFileOps({
			'buy-groceries_todo-1.md': existingContent,
		})

		const todoFile = makeTodoFile({
			frontMatterData: {
				id: 'todo-1',
				title: 'Buy groceries',
				starPoints: 5,
				exportedAt: '2025-06-15T12:00:00.000Z',
			},
		})

		const result = await upsertTodoFiles([todoFile], ops)

		expect(result.updated).toBe(1)
		expect(result.created).toBe(0)
		const written = ops.files['buy-groceries_todo-1.md']
		expect(written).toContain('starPoints: 5')
		expect(written).toContain('My shopping list')
	})

	test('updates front matter when star role changes, preserves body', async () => {
		const existingContent = [
			'---',
			'id: todo-1',
			'title: Buy groceries',
			'starRole: Chef',
			'---',
			'Notes here',
			'',
		].join('\n')
		const ops = createInMemoryFileOps({
			'buy-groceries_todo-1.md': existingContent,
		})

		const todoFile = makeTodoFile({
			frontMatterData: {
				id: 'todo-1',
				title: 'Buy groceries',
				starRole: 'Shopper',
				exportedAt: '2025-06-15T12:00:00.000Z',
			},
		})

		const result = await upsertTodoFiles([todoFile], ops)

		expect(result.updated).toBe(1)
		const written = ops.files['buy-groceries_todo-1.md']
		expect(written).toContain('starRole: Shopper')
		expect(written).not.toContain('starRole: Chef')
		expect(written).toContain('Notes here')
	})

	test('updates front matter when star points change, preserves body', async () => {
		const existingContent = [
			'---',
			'id: todo-1',
			'title: Buy groceries',
			'starPoints: 2',
			'---',
			'Detailed notes',
			'',
		].join('\n')
		const ops = createInMemoryFileOps({
			'buy-groceries_todo-1.md': existingContent,
		})

		const todoFile = makeTodoFile({
			frontMatterData: {
				id: 'todo-1',
				title: 'Buy groceries',
				starPoints: 8,
				exportedAt: '2025-06-15T12:00:00.000Z',
			},
		})

		const result = await upsertTodoFiles([todoFile], ops)

		expect(result.created).toBe(0)
		expect(result.updated).toBe(1)
		const written = ops.files['buy-groceries_todo-1.md']
		expect(written).toContain('starPoints: 8')
		expect(written).toContain('Detailed notes')
	})

	test('creates file when file is missing from disk', async () => {
		const ops = createInMemoryFileOps()

		const result = await upsertTodoFiles([makeTodoFile()], ops)

		expect(result.created).toBe(1)
		expect(result.updated).toBe(0)
		expect(ops.files['buy-groceries_todo-1.md']).toBeDefined()
	})
})

describe('deleting files', () => {
	test('deletes orphaned file whose front matter id is not in current todos', async () => {
		const existingContent = [
			'---',
			'id: todo-1',
			'title: Buy groceries',
			'---',
			'',
		].join('\n')
		const ops = createInMemoryFileOps({
			'buy-groceries_todo-1.md': existingContent,
		})

		const result = await upsertTodoFiles([], ops)

		expect(result.deleted).toBe(1)
		expect(ops.files['buy-groceries_todo-1.md']).toBeUndefined()
	})

	test('does NOT delete user-created files without front matter id', async () => {
		const ops = createInMemoryFileOps({
			'user-created-file.md': '# My notes',
		})

		const result = await upsertTodoFiles([], ops)

		expect(result.deleted).toBe(0)
		expect(ops.files['user-created-file.md']).toBe('# My notes')
	})

	test('does NOT delete files without valid front matter', async () => {
		const ops = createInMemoryFileOps({
			'random-notes.md': 'Just some text without front matter',
		})

		const result = await upsertTodoFiles([], ops)

		expect(result.deleted).toBe(0)
		expect(ops.files['random-notes.md']).toBe(
			'Just some text without front matter',
		)
	})
})

describe('renames', () => {
	test('deletes old file and creates new file when title changes', async () => {
		const existingContent = [
			'---',
			'id: todo-1',
			'title: Old title',
			'---',
			'',
		].join('\n')
		const ops = createInMemoryFileOps({
			'old-title-todo-1.md': existingContent,
		})

		const todoFile = makeTodoFile({
			filename: 'new-title-todo-1.md',
			frontMatterData: {
				id: 'todo-1',
				title: 'New title',
				exportedAt: '2025-06-15T12:00:00.000Z',
			},
		})

		const result = await upsertTodoFiles([todoFile], ops)

		expect(ops.files['old-title-todo-1.md']).toBeUndefined()
		expect(ops.files['new-title-todo-1.md']).toContain('title: New title')
		expect(result.created).toBe(1)
	})

	test('carries body content from old file to new file on rename', async () => {
		const existingContent = [
			'---',
			'id: todo-1',
			'title: Old title',
			'---',
			'Important notes',
			'',
		].join('\n')
		const ops = createInMemoryFileOps({
			'old-title-todo-1.md': existingContent,
		})

		const todoFile = makeTodoFile({
			filename: 'new-title-todo-1.md',
			frontMatterData: {
				id: 'todo-1',
				title: 'New title',
				exportedAt: '2025-06-15T12:00:00.000Z',
			},
		})

		await upsertTodoFiles([todoFile], ops)

		const written = ops.files['new-title-todo-1.md']
		expect(written).toContain('title: New title')
		expect(written).toContain('Important notes')
	})
})

describe('stats', () => {
	test('returns correct created/updated/deleted/failed counts', async () => {
		const ops = createInMemoryFileOps({
			'existing-todo-2.md': [
				'---',
				'id: todo-2',
				'title: Existing',
				'---',
				'Body',
				'',
			].join('\n'),
			'deleted-todo-3.md': [
				'---',
				'id: todo-3',
				'title: Deleted',
				'---',
				'',
			].join('\n'),
		})

		const todos = [
			makeTodoFile({ todoId: 'todo-1', filename: 'new-todo-1.md' }),
			makeTodoFile({ todoId: 'todo-2', filename: 'existing-todo-2.md' }),
		]

		const result = await upsertTodoFiles(todos, ops)

		expect(result.created).toBe(1)
		expect(result.updated).toBe(1)
		expect(result.deleted).toBe(1)
		expect(result.failed).toBe(0)
	})
})
