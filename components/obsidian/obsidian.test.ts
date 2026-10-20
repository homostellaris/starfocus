import { expect, test } from 'bun:test'
import {
	formatObsidianFilePath,
	getObsidianOpenUri,
	getObsidianNewUri,
} from './obsidian'

// Happy path tests
test('formats obsidian file path with folder and valid todo', () => {
	const todo = { id: 'todo-12345678', title: 'Buy groceries' }
	const result = formatObsidianFilePath(todo, 'todos')

	expect(result).toBe('todos/buy-groceries_12345678')
})

test('formats obsidian file path without folder', () => {
	const todo = { id: 'todo-12345678', title: 'Buy groceries' }
	const result = formatObsidianFilePath(todo)

	expect(result).toBe('buy-groceries_12345678')
})

test('strips leading and trailing slashes from folder path', () => {
	const todo = { id: 'todo-12345678', title: 'Buy groceries' }
	const result = formatObsidianFilePath(todo, '///todos/subfolder///')

	expect(result).toBe('todos/subfolder/buy-groceries_12345678')
})

test('generates obsidian open URI with vault and folder', () => {
	const todo = { id: 'todo-12345678', title: 'Buy groceries' }
	const uri = getObsidianOpenUri({
		vault: 'Reality Sculptor',
		folder: 'todos',
		todo,
	})

	expect(uri).toBe(
		'obsidian://open?vault=Reality%20Sculptor&file=todos%2Fbuy-groceries_12345678',
	)
})

test('generates obsidian new URI with initial content', () => {
	const todo = { id: 'todo-12345678', title: 'Buy groceries' }
	const uri = getObsidianNewUri({
		vault: 'Reality Sculptor',
		folder: 'todos',
		todo,
		content: '# Shopping list\n- Milk\n- Bread',
	})

	expect(uri).toBe(
		'obsidian://new?vault=Reality%20Sculptor&file=todos%2Fbuy-groceries_12345678&content=%23%20Shopping%20list%0A-%20Milk%0A-%20Bread',
	)
})

// Sad tests (empty or missing optional inputs)
test('generates obsidian open URI when folder is empty string', () => {
	const todo = { id: 'todo-12345678', title: 'Buy groceries' }
	const uri = getObsidianOpenUri({
		vault: 'Personal',
		folder: '',
		todo,
	})

	expect(uri).toBe('obsidian://open?vault=Personal&file=buy-groceries_12345678')
})

test('generates obsidian new URI without content parameter when content is omitted', () => {
	const todo = { id: 'todo-12345678', title: 'Buy groceries' }
	const uri = getObsidianNewUri({
		vault: 'Personal',
		folder: 'todos',
		todo,
	})

	expect(uri).toBe(
		'obsidian://new?vault=Personal&file=todos%2Fbuy-groceries_12345678',
	)
})

// Bad tests (malformed or missing data)
test('formats obsidian file path safely when todo title and identifier are missing', () => {
	const todo = {}
	const result = formatObsidianFilePath(todo, 'todos')

	expect(result).toBe('todos/untitled_')
})

test('trims whitespace from vault name in URI', () => {
	const todo = { id: 'todo-12345678', title: 'Task' }
	const uri = getObsidianOpenUri({
		vault: '   My Vault   ',
		todo,
	})

	expect(uri).toBe('obsidian://open?vault=My%20Vault&file=task_12345678')
})
