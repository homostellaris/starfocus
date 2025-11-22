import Dexie, { Table } from 'dexie'

import dexieCloud, { DexieCloudTable } from 'dexie-cloud-addon'
import { TodoRepository } from './todos/repository'

export interface Todo {
	completedAt?: Date
	id: string
	note?: Note
	starRole?: StarRole['id'] // TODO: How do we delete this when the star role is deleted? Need to add associative table and compute ID of association from todo ID and starRoleID, then delete entries when star roles gets deleted.
	starPoints?: number
	title: string
}

export type TodoInput = Pick<Todo, 'title' | 'starRole' | 'starPoints'> & {
	noteInitialContent?: string
}

export type AsteroidFieldOrder = {
	todoId: string
} & WayfinderMeta

export type WayfinderOrder = {
	todoId: string
} & WayfinderMeta

export interface WayfinderMeta {
	order: string
	snoozedUntil?: Date
}

export type TodoListItemBase = Todo & {
	/* Array means its a todo with visits
	 * undefined means its a todo that's not meant to have visits
	 * true means its actually a visit itself */
	visits?: Visit[] | true
}

export type LogTodoListItem = TodoListItemBase

export type AsteroidFieldTodoListItem = TodoListItemBase & WayfinderMeta

export type WayfinderTodoListItem = TodoListItemBase & WayfinderMeta

export interface Note {
	uri: string
}

export interface StarRole {
	id: string
	icon: Icon
	starRoleGroupId?: string
	title: string
}

export interface StarRoleGroup {
	id: string
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
	asteroidField,
	wayfinder,
	database,
}

export interface Setting {
	key: string
	value: any
}

export interface Visit {
	todoId: string
	date: Date
}

export class DexieStarfocus extends Dexie {
	visits: DexieCloudTable<Visit, 'todoId'>
	asteroidFieldOrder: DexieCloudTable<AsteroidFieldOrder, 'todoId'>
	wayfinderOrder!: DexieCloudTable<WayfinderOrder, 'todoId'>
	lists!: Table<List>
	settings!: DexieCloudTable<Setting, 'key'>
	starRoles: DexieCloudTable<StarRole, 'id'>
	starRoleGroups: DexieCloudTable<StarRoleGroup, 'id'>
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
		this.version(8).stores({
			checkins: '&todoId, date',
			lists: 'type',
			wayfinderOrder: '&todoId, order, snoozedUntil',
			settings: '&key',
			starRoles: '@id, starRoleGroupId, title',
			starRoleGroups: '@id, title',
			starRolesOrder: '&starRoleId, order',
			todos: '@id, createdAt, completedAt, starRole, title',
		})
		this.version(9).stores({
			checkins: null,
			lists: 'type',
			wayfinderOrder: '&todoId, order, snoozedUntil',
			settings: '&key',
			starRoles: '@id, starRoleGroupId, title',
			starRoleGroups: '@id, title',
			starRolesOrder: '&starRoleId, order',
			todos: '@id, createdAt, completedAt, starRole, title',
			visits: '@id, todoId, date',
		})
		this.version(10).stores({
			asteroidFieldOrder: '&todoId, order, snoozedUntil',
			lists: 'type',
			wayfinderOrder: '&todoId, order, snoozedUntil',
			settings: '&key',
			starRoles: '@id, starRoleGroupId, title',
			starRoleGroups: '@id, title',
			starRolesOrder: '&starRoleId, order',
			todos: '@id, createdAt, completedAt, starRole, title',
			visits: '@id, todoId, date',
		})
		this.cloud.configure({
			customLoginGui: true,
			databaseUrl:
				process.env.NEXT_PUBLIC_DATABASE_URL || 'https://z0vnq74nz.dexie.cloud', // Necessary because can't figure out how to set this in Cypress test
			requireAuth: false,
		})
	}
}

export const db = new DexieStarfocus()

// Helpful for inspecting the database to debug errors in production
declare global {
	interface Window {
		db: DexieStarfocus
		todoRepository: TodoRepository
	}
}
