import order, { starMudder, MAX_ORDER_KEY_LENGTH } from '../common/order'
import { db, DexieStarfocus, Todo } from '../db'
import posthog from 'posthog-js'

export class TodoRepository {
	constructor(private readonly db: DexieStarfocus) {}

	async addToTopOfWayfinder(todoId: string): Promise<void> {
		const firstItem = await db.wayfinderOrder.orderBy('order').first()
		const newOrder = order(undefined, firstItem?.order)
		await db.wayfinderOrder.put({ todoId, order: newOrder })
		if (newOrder.length > MAX_ORDER_KEY_LENGTH) {
			await this.rebalanceWayfinderOrder(newOrder, 'add_to_top')
		}
	}

	async migrateAsteroidFieldToWayfinder(): Promise<void> {
		await db.transaction(
			'rw',
			db.asteroidFieldOrder,
			db.wayfinderOrder,
			async () => {
				const asteroidItems = await db.asteroidFieldOrder
					.orderBy('order')
					.toArray()
				if (asteroidItems.length === 0) return

				const wayfinderItems = await db.wayfinderOrder
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

				await db.wayfinderOrder.bulkPut(updatedWayfinderEntries)
				await db.asteroidFieldOrder.clear()
			},
		)
	}

	async rebalanceWayfinderOrder(
		triggerKey?: string,
		triggerSource?: string,
	): Promise<void> {
		const items = await db.wayfinderOrder.orderBy('order').toArray()
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
				db.wayfinderOrder.update(item.todoId, { order: newOrderKeys[index] }),
			),
		)
	}

	async complete(todo: Todo): Promise<void> {
		await db.transaction(
			'rw',
			db.todos,
			db.asteroidFieldOrder,
			db.wayfinderOrder,
			async () => {
				await Promise.all([
					db.todos.update(todo.id, {
						completedAt: new Date(),
					}),
					db.asteroidFieldOrder.delete(todo.id),
					db.wayfinderOrder.delete(todo.id),
				])
			},
		)
	}

	async uncomplete(todo: Todo): Promise<void> {
		await db.transaction(
			'rw',
			db.todos,
			db.wayfinderOrder,
			async () => {
				await db.todos.update(todo.id, { completedAt: undefined })
				await this.addToTopOfWayfinder(todo.id)
			},
		)
	}

	async wayfinderTodos() {
		const wayfinderOrder = await db.wayfinderOrder.orderBy('order').toArray()
		const todoIds = wayfinderOrder.map(item => item.todoId)
		const todos = await db.todos.bulkGet(todoIds)
		return todos.map((todo, index) => ({
			...wayfinderOrder[index],
			...todo,
		}))
	}
}

const todoRepository = new TodoRepository(db)

export default todoRepository
