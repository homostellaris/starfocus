import { PromiseExtended } from 'dexie'
import order from '../common/order'
import { db, DexieStarfocus, Todo } from '../db'

export class TodoRepository {
	constructor(private readonly db: DexieStarfocus) {}

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
				const promises: PromiseExtended<number | string>[] = [
					db.todos.update(todo.id, {
						completedAt: undefined,
					}),
				]

				if (todo.starPoints) {
					const wayfinderOrder = await db.wayfinderOrder
						.orderBy('order')
						.limit(1)
						.keys()
					promises.push(
						db.wayfinderOrder.put({
							todoId: todo.id,
							order: order(undefined, wayfinderOrder[0]?.toString()),
						}),
					)
				} else {
					const asteroidFieldOrder = await db.asteroidFieldOrder
						.orderBy('order')
						.limit(1)
						.keys()
					promises.push(
						db.asteroidFieldOrder.put({
							todoId: todo.id,
							order: order(undefined, asteroidFieldOrder[0]?.toString()),
						}),
					)
				}

				await Promise.all(promises)
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
