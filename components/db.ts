import Dexie, { Table } from 'dexie'

interface Todo {
	title: string
	completedAt?: Date
}

interface List {
	order: string[]
	type: 'important'
}

export class DexieStarfocus extends Dexie {
	todos!: Table<Todo>
	lists!: Table<List>

	constructor() {
		super('starfocus')
		this.version(1).stores({
			todos: '++id, title',
			lists: 'type', // Is this unique?
		})
	}
}

export const db = new DexieStarfocus()
