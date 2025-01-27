import { db, DexieStarfocus } from '../db'

export class TodoRepository {
	constructor(private db: DexieStarfocus) {}

	async complete(todoId: string) {
		this.db.transaction(
			'rw',
			this.db.todos,
			this.db.wayfinderOrder,
			async () => {
				this.db.todos.update(todoId, {
					completedAt: new Date(),
				})
				this.db.wayfinderOrder.delete(todoId)
			},
		)
	}
}

export const todoRepository = new TodoRepository(db)
