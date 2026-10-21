import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { db } from '../../db'
import {
	findDuplicatesForTitle,
	findHighestActiveFuzzyDuplicate,
} from './detector'

export function useDuplicateDetector(
	candidateTitle?: string,
	candidateTodoIdentifier?: string,
) {
	const [debouncedTitle, setDebouncedTitle] = useState(candidateTitle ?? '')

	useEffect(() => {
		const timeoutIdentifier = setTimeout(() => {
			setDebouncedTitle(candidateTitle ?? '')
		}, 150)

		return () => clearTimeout(timeoutIdentifier)
	}, [candidateTitle])

	const queryResult = useLiveQuery(
		async () => {
			const [allTodos, wayfinderEntries] = await Promise.all([
				db.todos.toArray(),
				db.wayfinderOrder.toArray(),
			])
			const wayfinderIdentifiers = new Set(
				wayfinderEntries.map(entry => entry.todoId),
			)
			return { allTodos, wayfinderIdentifiers }
		},
		[],
		{ allTodos: [], wayfinderIdentifiers: new Set<string>() },
	)

	const matches = useMemo(() => {
		if (!debouncedTitle.trim() || queryResult.allTodos.length === 0) {
			return []
		}
		return findDuplicatesForTitle(
			debouncedTitle,
			queryResult.allTodos,
			candidateTodoIdentifier,
			queryResult.wayfinderIdentifiers,
			0.7,
		)
	}, [
		debouncedTitle,
		queryResult.allTodos,
		queryResult.wayfinderIdentifiers,
		candidateTodoIdentifier,
	])

	const highestActiveDuplicate = useMemo(() => {
		if (!debouncedTitle.trim() || queryResult.allTodos.length === 0) {
			return undefined
		}
		return findHighestActiveFuzzyDuplicate(
			debouncedTitle,
			queryResult.allTodos,
			candidateTodoIdentifier,
			queryResult.wayfinderIdentifiers,
			0.82,
		)
	}, [
		debouncedTitle,
		queryResult.allTodos,
		queryResult.wayfinderIdentifiers,
		candidateTodoIdentifier,
	])

	return {
		matches,
		highestActiveDuplicate,
		isDebouncing: candidateTitle !== debouncedTitle,
	}
}
