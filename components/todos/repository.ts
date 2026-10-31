import order, { starMudder, MAX_ORDER_KEY_LENGTH } from '../common/order'
import { db, DexieStarfocus, Todo } from '../db'
import posthog from 'posthog-js'

export class TodoRepository {
	constructor(private readonly db: DexieStarfocus) {}

	async addToTopOfWayfinder(todoId: string): Promise<void> {
		const firstItem = await this.db.wayfinderOrder.orderBy('order').first()
		const newOrder = order(undefined, firstItem?.order)
		await this.db.wayfinderOrder.put({ todoId, order: newOrder })
		if (newOrder.length > MAX_ORDER_KEY_LENGTH) {
			await this.rebalanceWayfinderOrder(newOrder, 'add_to_top')
		}
	}

	async migrateAsteroidFieldToWayfinder(): Promise<void> {
		await this.db.transaction(
			'rw',
			this.db.asteroidFieldOrder,
			this.db.wayfinderOrder,
			async () => {
				const asteroidItems = await this.db.asteroidFieldOrder
					.orderBy('order')
					.toArray()
				if (asteroidItems.length === 0) return

				const wayfinderItems = await this.db.wayfinderOrder
					.orderBy('order')
					.toArray()
				const asteroidTodoIds = new Set(
					asteroidItems.map(item => item.todoId),
				)

				const remainingWayfinderItems = wayfinderItems.filter(
					item => !asteroidTodoIds.has(item.todoId),
				)

				const combinedItems = [...asteroidItems, ...remainingWayfinderItems]
				const newOrderKeys = starMudder(combinedItems.length)

				const updatedWayfinderEntries = combinedItems.map(
					(item, index) => ({
						todoId: item.todoId,
						order: newOrderKeys[index],
						...(item.snoozedUntil ? { snoozedUntil: item.snoozedUntil } : {}),
					}),
				)

				await this.db.wayfinderOrder.bulkPut(updatedWayfinderEntries)
				await this.db.asteroidFieldOrder.clear()
			},
		)
	}

	async rebalanceWayfinderOrder(
		triggerKey?: string,
		triggerSource?: string,
	): Promise<void> {
		const items = await this.db.wayfinderOrder.orderBy('order').toArray()
		if (items.length === 0) return
		console.info(
			`[TodoRepository] Rebalancing Wayfinder order keys (Trigger key: "${triggerKey || ''}", source: ${triggerSource || 'unknown'}). Total items: ${items.length}`,
		)
		posthog.capture('todo_database_rebalanced', {
			list_type: 'wayfinder',
			item_count: items.length,
			trigger_key: triggerKey,
			trigger_key_length: triggerKey?.length,
			trigger_source: triggerSource,
		})
		const newOrderKeys = starMudder(items.length)
		await Promise.all(
			items.map((item, index) =>
				this.db.wayfinderOrder.update(item.todoId, { order: newOrderKeys[index] }),
			),
		)
	}

	async complete(todo: Todo): Promise<void> {
		await this.db.transaction(
			'rw',
			this.db.todos,
			this.db.asteroidFieldOrder,
			this.db.wayfinderOrder,
			async () => {
				await Promise.all([
					this.db.todos.update(todo.id, {
						completedAt: new Date(),
					}),
					this.db.asteroidFieldOrder.delete(todo.id),
					this.db.wayfinderOrder.delete(todo.id),
				])
			},
		)
	}

	async uncomplete(todo: Todo): Promise<void> {
		await this.db.transaction(
			'rw',
			this.db.todos,
			this.db.wayfinderOrder,
			async () => {
				await this.db.todos.update(todo.id, { completedAt: undefined })
				await this.addToTopOfWayfinder(todo.id)
			},
		)
	}

	async wayfinderTodos() {
		const wayfinderOrder = await this.db.wayfinderOrder.orderBy('order').toArray()
		const todoIds = wayfinderOrder.map(item => item.todoId)
		const todos = await this.db.todos.bulkGet(todoIds)
		return todos
			.map((todo, index) => {
				if (!todo) return null
				return {
					...wayfinderOrder[index],
					...todo,
				}
			})
			.filter((todo): todo is NonNullable<typeof todo> => todo !== null)
	}

	async pruneOrphanedWayfinderEntries(): Promise<string[]> {
		const wayfinderEntries = await this.db.wayfinderOrder.toArray()
		if (wayfinderEntries.length === 0) return []

		const todoIds = wayfinderEntries.map(entry => entry.todoId)
		const todos = await this.db.todos.bulkGet(todoIds)
		const orphanedTodoIds = wayfinderEntries
			.filter((_, index) => todos[index] === undefined)
			.map(entry => entry.todoId)

		if (orphanedTodoIds.length > 0) {
			await this.db.wayfinderOrder.bulkDelete(orphanedTodoIds)
		}

		return orphanedTodoIds
	}
}

const todoRepository = new TodoRepository(db)

export default todoRepository
