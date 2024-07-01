import Dexie, { Table } from 'dexie'

export interface Todo {
	title: string
	createdAt: Date
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
			todos: '++id, createdAt, completedAt, title',
			lists: 'type', // Is this unique?
		})
	}
}

export const db = new DexieStarfocus()
