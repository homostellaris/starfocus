import order, { starMudder, MAX_ORDER_KEY_LENGTH } from '../common/order'
import { db, DexieStarfocus, Todo } from '../db'
import posthog from 'posthog-js'

export class TodoRepository {
	constructor(private readonly db: DexieStarfocus) {}

	async addToTopOfAsteroidField(todoId: string): Promise<void> {
		const firstItem = await db.asteroidFieldOrder.orderBy('order').first()
		const newOrder = order(undefined, firstItem?.order)
		await db.asteroidFieldOrder.put({ todoId, order: newOrder })
		if (newOrder.length > MAX_ORDER_KEY_LENGTH) {
			await this.rebalanceAsteroidFieldOrder(newOrder, 'add_to_top')
		}
	}

	async addToTopOfWayfinder(todoId: string): Promise<void> {
		const firstItem = await db.wayfinderOrder.orderBy('order').first()
		const newOrder = order(undefined, firstItem?.order)
		await db.wayfinderOrder.put({ todoId, order: newOrder })
		if (newOrder.length > MAX_ORDER_KEY_LENGTH) {
			await this.rebalanceWayfinderOrder(newOrder, 'add_to_top')
		}
	}


	async rebalanceAsteroidFieldOrder(triggerKey?: string, triggerSource?: string): Promise<void> {
		const items = await db.asteroidFieldOrder.orderBy('order').toArray()
		if (items.length === 0) return
		console.info(`[TodoRepository] Rebalancing Asteroid Field order keys (Trigger key: "${triggerKey || ''}", source: ${triggerSource || 'unknown'}). Total items: ${items.length}`);
		posthog.capture('todo_database_rebalanced', {
			list_type: 'asteroid_field',
			item_count: items.length,
			trigger_key: triggerKey,
			trigger_key_length: triggerKey?.length,
			trigger_source: triggerSource,
		})
		const newOrderKeys = starMudder(items.length)
		await Promise.all(
			items.map((item, index) =>
				db.asteroidFieldOrder.update(item.todoId, { order: newOrderKeys[index] }),
			),
		)
	}

	async rebalanceWayfinderOrder(triggerKey?: string, triggerSource?: string): Promise<void> {
		const items = await db.wayfinderOrder.orderBy('order').toArray()
		if (items.length === 0) return
		console.info(`[TodoRepository] Rebalancing Wayfinder order keys (Trigger key: "${triggerKey || ''}", source: ${triggerSource || 'unknown'}). Total items: ${items.length}`);
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
			db.asteroidFieldOrder,
			db.wayfinderOrder,
			async () => {
				await db.todos.update(todo.id, { completedAt: undefined })

				if (todo.starPoints) {
					await this.addToTopOfWayfinder(todo.id)
				} else {
					await this.addToTopOfAsteroidField(todo.id)
				}
			},
		)
	}

	async asteroidFieldTodos() {
		const asteroidFieldOrder = await db.asteroidFieldOrder
			.orderBy('order')
			.toArray()
		const todoIds = asteroidFieldOrder.map(item => item.todoId)
		const todos = await db.todos.bulkGet(todoIds)
		return todos.map((todo, index) => ({
			...asteroidFieldOrder[index],
			...todo,
		}))
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
