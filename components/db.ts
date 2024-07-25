import Dexie, { Table } from 'dexie'

import dexieCloud, { DexieCloudTable } from 'dexie-cloud-addon'

export interface Todo {
	completedAt?: Date
	id: string
	note?: Note
	starRole?: StarRole['id']
	starPoints?: string
	title: string
}

export interface Note {
	uri: string
}

export interface StarRole {
	id: string
	title: string
}

export interface List {
	order: string[] // Todo IDs
	type: '#important'
}

export enum ListType {
	important,
	icebox,
}

export interface Setting {
	key: string
	value: any
}

export class DexieStarfocus extends Dexie {
	lists!: Table<List>
	settings!: DexieCloudTable<Setting, 'key'>
	starRoles: DexieCloudTable<StarRole, 'id'>
	todos!: DexieCloudTable<Todo, 'id'>

	constructor() {
		super('starfocus', {
			addons: [dexieCloud],
		})
		this.version(3).stores({
			todos: '@id, createdAt, completedAt, starRole, title',
			lists: 'type',
			settings: '&key',
			starRoles: '@id, title',
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

// Helpful for inspecting the database to debug errors in production
declare global {
	interface Window {
		db: DexieStarfocus
	}
}

window.db = db
