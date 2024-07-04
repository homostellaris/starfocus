import Dexie, { Table } from 'dexie'
import dexieCloud from 'dexie-cloud-addon'

export interface Todo {
	createdAt: Date
	completedAt?: Date
	note?: string // URL
	role?: string
	starPoints?: string
	title: string
}

interface List {
	order: string[] // Todo IDs
	type: '#important'
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
			lists: 'type',
		})
		this.cloud.configure({
			databaseUrl: 'https://zy0myinc2.dexie.cloud',
			requireAuth: false,
		})
		this.on.populate.subscribe(() => {
			this.on.ready.subscribe((db: DexieStarfocus) => {
				db.lists.put({
					type: '#important',
					order: [],
				})
			}, false)
		})
	}
}

export const db = new DexieStarfocus()
