import Dexie, { Table } from 'dexie'

import dexieCloud, { DexieCloudTable } from 'dexie-cloud-addon'

export interface Todo {
	completedAt?: Date
	id: string
	note?: Note
	starRole?: StarRole['id'] // TODO: How do we delete this when the star role is deleted? Need to add associative table and compute ID of association from todo ID and starRoleID, then delete entries when star roles gets deleted.
	starPoints?: number
	title: string
}

export interface TodoMeta {
	order: string
	snoozedUntil?: Date
}

export type WayfinderOrder = {
	todoId: string
} & TodoMeta

export type EnrichedTodo = Todo & TodoMeta

export interface Note {
	uri: string
}

export interface StarRole {
	id: string
	icon: Icon
	title: string
}

export interface Icon {
	type: 'ionicon'
	name: string
}

export interface List {
	order: string[] // Todo IDs
	type: '#important'
}

export enum ListType {
	wayfinder,
	icebox,
}

export interface Setting {
	key: string
	value: any
}

export interface Checkin {
	todoId: string
	date: Date
}

export class DexieStarfocus extends Dexie {
	checkins: DexieCloudTable<Checkin, 'todoId'>
	wayfinderOrder!: DexieCloudTable<WayfinderOrder, 'todoId'>
	lists!: Table<List>
	settings!: DexieCloudTable<Setting, 'key'>
	starRoles: DexieCloudTable<StarRole, 'id'>
	starRolesOrder!: DexieCloudTable<
		{ starRoleId: string; order: number },
		'starRoleId'
	>
	todos!: DexieCloudTable<Todo, 'id'>

	constructor() {
		super('starfocus', {
			addons: [dexieCloud],
		})

		this.on.ready.subscribe(async (db: DexieStarfocus) => {
			console.debug('Database ready')
		}, false)
		this.on.populate.subscribe(() => {
			this.on.ready.subscribe((db: DexieStarfocus) => {
				console.debug('Database ready for population')
			}, false)
		})

		this.version(3).stores({
			todos: '@id, createdAt, completedAt, starRole, title',
			lists: 'type',
			settings: '&key',
			starRoles: '@id, title',
		})
		this.version(4).stores({
			lists: 'type',
			wayfinderOrder: '&todoId, &order',
			settings: '&key',
			starRoles: '@id, title',
			starRolesOrder: '&starRoleId, &order',
			todos: '@id, createdAt, completedAt, starRole, title',
		})
		this.version(5).stores({
			lists: 'type',
			wayfinderOrder: '&todoId, order',
			settings: '&key',
			starRoles: '@id, title',
			starRolesOrder: '&starRoleId, order',
			todos: '@id, createdAt, completedAt, starRole, title',
		})
		this.version(6).stores({
			lists: 'type',
			wayfinderOrder: '&todoId, order, snoozedUntil',
			settings: '&key',
			starRoles: '@id, title',
			starRolesOrder: '&starRoleId, order',
			todos: '@id, createdAt, completedAt, starRole, title',
		})
		this.version(7).stores({
			checkins: '&todoId, date',
			lists: 'type',
			wayfinderOrder: '&todoId, order, snoozedUntil',
			settings: '&key',
			starRoles: '@id, title',
			starRolesOrder: '&starRoleId, order',
			todos: '@id, createdAt, completedAt, starRole, title',
		})
		this.cloud.configure({
			databaseUrl: process.env.NEXT_PUBLIC_DATABASE_URL!,
			requireAuth: false,
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
