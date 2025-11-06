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

				console.log({ todo })

				if (todo.starPoints) {
					const wayfinderOrder = await db.wayfinderOrder
						.orderBy('order')
						.limit(1)
						.keys()
					promises.push(
						db.wayfinderOrder.add({
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
						db.asteroidFieldOrder.add({
							todoId: todo.id,
							order: order(undefined, asteroidFieldOrder[0]?.toString()),
						}),
					)
				}

				await Promise.all(promises)
			},
		)
	}
}

const todoRepository = new TodoRepository(db)

export default todoRepository
