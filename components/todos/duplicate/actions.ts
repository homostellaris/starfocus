import posthog from 'posthog-js'
import { db } from '../../db'
import { createPairKey, DuplicateCluster } from './detector'

export async function mergeDuplicateTodos(
	canonicalTodoIdentifier: string,
	duplicateTodoIdentifiers: string[],
): Promise<void> {
	if (duplicateTodoIdentifiers.length === 0) {
		return
	}

	await db.transaction(
		'rw',
		db.todos,
		db.wayfinderOrder,
		db.asteroidFieldOrder,
		db.visits,
		async () => {
			const canonicalTodo = await db.todos.get(canonicalTodoIdentifier)
			if (!canonicalTodo) {
				return
			}

			const rawDuplicates = await db.todos.bulkGet(duplicateTodoIdentifiers)
			const duplicateTodos = rawDuplicates.filter(
				(todo): todo is NonNullable<typeof todo> => Boolean(todo),
			)

			const mergedNoteContent = combineNoteContents([
				canonicalTodo.noteInitialContent,
				...duplicateTodos.map(duplicate => duplicate.noteInitialContent),
			])

			const highestStarPoints = determineHighestStarPoints([
				canonicalTodo.starPoints,
				...duplicateTodos.map(duplicate => duplicate.starPoints),
			])

			const chosenStarRole =
				canonicalTodo.starRole ||
				duplicateTodos.find(duplicate => duplicate.starRole)?.starRole

			await db.todos.update(canonicalTodoIdentifier, {
				noteInitialContent: mergedNoteContent,
				starPoints: highestStarPoints,
				starRole: chosenStarRole,
			})

			for (const duplicateIdentifier of duplicateTodoIdentifiers) {
				const existingVisits = await db.visits
					.where('todoId')
					.equals(duplicateIdentifier)
					.toArray()

				for (const visit of existingVisits) {
					await db.visits.update((visit as any).id, {
						todoId: canonicalTodoIdentifier,
					})
				}

				await Promise.all([
					db.todos.delete(duplicateIdentifier),
					db.wayfinderOrder.delete(duplicateIdentifier),
					db.asteroidFieldOrder.delete(duplicateIdentifier),
				])
			}
		},
	)

	posthog.capture('todos_merged_duplicates', {
		canonical_todo_id: canonicalTodoIdentifier,
		merged_count: duplicateTodoIdentifiers.length,
	})
}

export async function deleteDuplicateTodo(
	todoIdentifier: string,
): Promise<void> {
	await db.transaction(
		'rw',
		db.visits,
		db.asteroidFieldOrder,
		db.wayfinderOrder,
		db.todos,
		async () => {
			await Promise.all([
				db.todos.delete(todoIdentifier),
				db.asteroidFieldOrder.delete(todoIdentifier),
				db.wayfinderOrder.delete(todoIdentifier),
				db.visits.where('todoId').equals(todoIdentifier).delete(),
			])
		},
	)

	posthog.capture('todo_deleted', {
		source: 'duplicate_resolver',
	})
}

export async function dismissDuplicatePair(
	firstTodoIdentifier: string,
	secondTodoIdentifier: string,
): Promise<void> {
	const pairKey = createPairKey(firstTodoIdentifier, secondTodoIdentifier)
	const currentSetting = await db.settings.get('#dismissedDuplicatePairs')
	const dismissedPairKeys: string[] = Array.isArray(currentSetting?.value)
		? currentSetting.value
		: []

	if (!dismissedPairKeys.includes(pairKey)) {
		dismissedPairKeys.push(pairKey)
		await db.settings.put({
			key: '#dismissedDuplicatePairs',
			value: dismissedPairKeys,
		})
	}
}

export async function mergeAllDuplicateClusters(
	clusters: DuplicateCluster[],
): Promise<void> {
	for (const cluster of clusters) {
		const duplicateIdentifiers = cluster.duplicateTodos.map(
			duplicate => duplicate.todo.id,
		)
		await mergeDuplicateTodos(
			cluster.canonicalTodo.id,
			duplicateIdentifiers,
		)
	}
}

export function combineNoteContents(
	noteContents: Array<string | undefined>,
): string | undefined {
	const validNotes = noteContents
		.map(note => note?.trim())
		.filter((note): note is string => Boolean(note && note.length > 0))

	if (validNotes.length === 0) {
		return undefined
	}

	return Array.from(new Set(validNotes)).join('\n\n---\n\n')
}

export function determineHighestStarPoints(
	pointsList: Array<number | undefined>,
): number | undefined {
	const numbers = pointsList.filter(
		(points): points is number => typeof points === 'number' && points > 0,
	)

	if (numbers.length === 0) {
		return undefined
	}

	return Math.max(...numbers)
}
