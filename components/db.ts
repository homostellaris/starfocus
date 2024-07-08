import Dexie, { Table } from 'dexie'
import dexieCloud from 'dexie-cloud-addon'

export interface Todo {
	createdAt: Date
	completedAt?: Date
	note?: Note // URL
	role?: Role
	starPoints?: string
	title: string
}

export interface Note {
	uri: string
}

export interface Role {
	title: string
}

export interface List {
	order: string[] // Todo IDs
	type: '#important'
}

export interface Setting {
	key: string
	value: any
}

export class DexieStarfocus extends Dexie {
	lists!: Table<List>
	settings!: Table<Setting>
	todos!: Table<Todo>

	constructor() {
		super('starfocus', {
			addons: [dexieCloud],
		})
		this.version(2).stores({
			todos: '@id, createdAt, completedAt, title',
			lists: 'type',
			settings: '&key',
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
