import Dexie, { Table } from 'dexie'
import dexieCloud from 'dexie-cloud-addon'

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
		super('starfocus', {
			addons: [dexieCloud],
		})
		this.version(1).stores({
			todos: '@id, createdAt, completedAt, title',
			lists: 'type', // Is this unique?
		})
		this.cloud.configure({
			databaseUrl: 'https://zy0myinc2.dexie.cloud',
			requireAuth: false,
		})
	}
}

export const db = new DexieStarfocus()
