import { Todo } from '../../db'

export type DuplicateMatchType = 'exact' | 'high' | 'medium' | 'none'
export type TodoLocation = 'wayfinder' | 'database' | 'completed'

export interface DuplicateMatch {
	todo: Todo
	similarityScore: number
	matchType: DuplicateMatchType
	location: TodoLocation
}

export interface DuplicateCluster {
	identifier: string
	canonicalTodo: Todo
	canonicalLocation: TodoLocation
	duplicateTodos: Array<{
		todo: Todo
		location: TodoLocation
		similarityScore: number
		matchType: DuplicateMatchType
	}>
	highestSimilarityScore: number
	matchType: DuplicateMatchType
}

export function findDuplicatesForTitle(
	candidateTitle: string,
	existingTodos: Todo[],
	candidateTodoIdentifier?: string,
	wayfinderIdentifiers: Set<string> = new Set(),
	threshold = 0.7,
): DuplicateMatch[] {
	if (!candidateTitle.trim()) {
		return []
	}

	const matches: DuplicateMatch[] = []

	for (const todo of existingTodos) {
		if (candidateTodoIdentifier && todo.id === candidateTodoIdentifier) {
			continue
		}

		const { similarityScore, matchType } = calculateTitleSimilarity(
			candidateTitle,
			todo.title,
		)

		if (similarityScore >= threshold) {
			const location = determineTodoLocation(todo, wayfinderIdentifiers)
			matches.push({
				todo,
				similarityScore,
				matchType,
				location,
			})
		}
	}

	return matches.sort(
		(firstMatch, secondMatch) =>
			secondMatch.similarityScore - firstMatch.similarityScore,
	)
}

export function findHighestActiveFuzzyDuplicate(
	candidateTitle: string,
	existingTodos: Todo[],
	candidateTodoIdentifier?: string,
	wayfinderIdentifiers: Set<string> = new Set(),
	threshold = 0.82,
): DuplicateMatch | undefined {
	const allMatches = findDuplicatesForTitle(
		candidateTitle,
		existingTodos,
		candidateTodoIdentifier,
		wayfinderIdentifiers,
		threshold,
	)

	return allMatches.find(
		match => match.location === 'wayfinder' || match.location === 'database',
	)
}

export function detectAllDuplicateClusters(
	todos: Todo[],
	wayfinderIdentifiers: Set<string>,
	dismissedPairKeys: Set<string> = new Set(),
	threshold = 0.75,
): DuplicateCluster[] {
	const adjacencyMap = new Map<string, Map<string, { score: number; type: DuplicateMatchType }>>()

	for (const todo of todos) {
		adjacencyMap.set(todo.id, new Map())
	}

	const todoMap = new Map<string, Todo>()
	for (const todo of todos) {
		todoMap.set(todo.id, todo)
	}

	for (let firstIndex = 0; firstIndex < todos.length; firstIndex++) {
		const firstTodo = todos[firstIndex]
		for (let secondIndex = firstIndex + 1; secondIndex < todos.length; secondIndex++) {
			const secondTodo = todos[secondIndex]
			const pairKey = createPairKey(firstTodo.id, secondTodo.id)

			if (dismissedPairKeys.has(pairKey)) {
				continue
			}

			const { similarityScore, matchType } = calculateTitleSimilarity(
				firstTodo.title,
				secondTodo.title,
			)

			if (similarityScore >= threshold) {
				adjacencyMap.get(firstTodo.id)!.set(secondTodo.id, {
					score: similarityScore,
					type: matchType,
				})
				adjacencyMap.get(secondTodo.id)!.set(firstTodo.id, {
					score: similarityScore,
					type: matchType,
				})
			}
		}
	}

	const visitedIdentifiers = new Set<string>()
	const clusters: DuplicateCluster[] = []

	for (const todo of todos) {
		if (visitedIdentifiers.has(todo.id)) {
			continue
		}

		const neighbors = adjacencyMap.get(todo.id)!
		if (neighbors.size === 0) {
			continue
		}

		const clusterTodoIdentifiers: string[] = []
		const queue: string[] = [todo.id]
		visitedIdentifiers.add(todo.id)

		while (queue.length > 0) {
			const currentIdentifier = queue.shift()!
			clusterTodoIdentifiers.push(currentIdentifier)

			const currentNeighbors = adjacencyMap.get(currentIdentifier)!
			for (const neighborIdentifier of Array.from(currentNeighbors.keys())) {
				if (!visitedIdentifiers.has(neighborIdentifier)) {
					visitedIdentifiers.add(neighborIdentifier)
					queue.push(neighborIdentifier)
				}
			}
		}

		if (clusterTodoIdentifiers.length > 1) {
			const clusterTodos = clusterTodoIdentifiers
				.map(identifier => todoMap.get(identifier)!)
				.filter(Boolean)

			const canonicalTodo = selectCanonicalTodo(
				clusterTodos,
				wayfinderIdentifiers,
			)
			const canonicalLocation = determineTodoLocation(
				canonicalTodo,
				wayfinderIdentifiers,
			)

			let highestSimilarityScore = 0
			let dominantMatchType: DuplicateMatchType = 'medium'

			const duplicateTodos = clusterTodos
				.filter(clusterTodo => clusterTodo.id !== canonicalTodo.id)
				.map(duplicateCandidate => {
					const { similarityScore, matchType } = calculateTitleSimilarity(
						canonicalTodo.title,
						duplicateCandidate.title,
					)

					if (similarityScore > highestSimilarityScore) {
						highestSimilarityScore = similarityScore
						dominantMatchType = matchType
					}

					return {
						todo: duplicateCandidate,
						location: determineTodoLocation(
							duplicateCandidate,
							wayfinderIdentifiers,
						),
						similarityScore,
						matchType,
					}
				})

			clusters.push({
				identifier: `cluster-${canonicalTodo.id}`,
				canonicalTodo,
				canonicalLocation,
				duplicateTodos,
				highestSimilarityScore,
				matchType: dominantMatchType,
			})
		}
	}

	return clusters.sort(
		(firstCluster, secondCluster) =>
			secondCluster.highestSimilarityScore -
			firstCluster.highestSimilarityScore,
	)
}

export function calculateTitleSimilarity(
	sourceTitle: string,
	targetTitle: string,
): { similarityScore: number; matchType: DuplicateMatchType } {
	const normalizedSource = normalizeTitle(sourceTitle)
	const normalizedTarget = normalizeTitle(targetTitle)

	if (!normalizedSource || !normalizedTarget) {
		return { similarityScore: 0, matchType: 'none' }
	}

	const isIdenticalNormalized = normalizedSource === normalizedTarget

	if (isIdenticalNormalized) {
		return { similarityScore: 1, matchType: 'exact' }
	}

	const sourceTokens = tokenizeTitle(normalizedSource)
	const targetTokens = tokenizeTitle(normalizedTarget)

	const tokenSimilarity = calculateTokenJaccard(sourceTokens, targetTokens)
	const levenshteinSimilarity = calculateLevenshteinSimilarity(
		normalizedSource,
		normalizedTarget,
	)
	const containmentScore = calculateContainmentScore(
		normalizedSource,
		normalizedTarget,
	)

	// Combine token similarity and character edit distance to catch both word inversions and typos
	const blendedScore = Math.max(
		levenshteinSimilarity,
		tokenSimilarity * 0.95,
		containmentScore,
		tokenSimilarity * 0.5 + levenshteinSimilarity * 0.5,
	)

	const roundedScore = Math.round(blendedScore * 100) / 100

	return {
		similarityScore: roundedScore,
		matchType: categorizeScore(roundedScore, false),
	}
}

export function normalizeTitle(title: string): string {
	return title
		.toLowerCase()
		.replace(/[\p{P}\p{S}]+/gu, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

export function createPairKey(
	firstIdentifier: string,
	secondIdentifier: string,
): string {
	return firstIdentifier < secondIdentifier
		? `${firstIdentifier}:::${secondIdentifier}`
		: `${secondIdentifier}:::${firstIdentifier}`
}

function determineTodoLocation(
	todo: Todo,
	wayfinderIdentifiers: Set<string>,
): TodoLocation {
	if (todo.completedAt) {
		return 'completed'
	}
	if (wayfinderIdentifiers.has(todo.id)) {
		return 'wayfinder'
	}
	return 'database'
}

function selectCanonicalTodo(
	todos: Todo[],
	wayfinderIdentifiers: Set<string>,
): Todo {
	return [...todos].sort((firstTodo, secondTodo) => {
		const firstIsActive = !firstTodo.completedAt
		const secondIsActive = !secondTodo.completedAt
		if (firstIsActive !== secondIsActive) {
			return firstIsActive ? -1 : 1
		}

		const firstInWayfinder = wayfinderIdentifiers.has(firstTodo.id)
		const secondInWayfinder = wayfinderIdentifiers.has(secondTodo.id)
		if (firstInWayfinder !== secondInWayfinder) {
			return firstInWayfinder ? -1 : 1
		}

		const firstPoints = firstTodo.starPoints ?? 0
		const secondPoints = secondTodo.starPoints ?? 0
		if (firstPoints !== secondPoints) {
			return secondPoints - firstPoints
		}

		const firstHasNote = Boolean(firstTodo.noteInitialContent)
		const secondHasNote = Boolean(secondTodo.noteInitialContent)
		if (firstHasNote !== secondHasNote) {
			return firstHasNote ? -1 : 1
		}

		const firstCreatedAt = firstTodo.createdAt?.getTime() ?? 0
		const secondCreatedAt = secondTodo.createdAt?.getTime() ?? 0
		return firstCreatedAt - secondCreatedAt
	})[0]
}

function tokenizeTitle(normalizedTitle: string): Set<string> {
	return new Set(normalizedTitle.split(' ').filter(token => token.length > 0))
}

function calculateTokenJaccard(
	sourceTokens: Set<string>,
	targetTokens: Set<string>,
): number {
	if (sourceTokens.size === 0 || targetTokens.size === 0) {
		return 0
	}

	let intersectionCount = 0
	for (const token of Array.from(sourceTokens)) {
		if (targetTokens.has(token)) {
			intersectionCount++
		}
	}

	const unionCount =
		sourceTokens.size + targetTokens.size - intersectionCount
	if (unionCount === 0) {
		return 0
	}

	return intersectionCount / unionCount
}

function calculateLevenshteinSimilarity(
	source: string,
	target: string,
): number {
	const distance = calculateLevenshteinDistance(source, target)
	const maximumLength = Math.max(source.length, target.length)
	if (maximumLength === 0) {
		return 1
	}
	return (maximumLength - distance) / maximumLength
}

function calculateLevenshteinDistance(
	source: string,
	target: string,
): number {
	const sourceLength = source.length
	const targetLength = target.length

	if (sourceLength === 0) return targetLength
	if (targetLength === 0) return sourceLength

	let previousRow = Array.from({ length: targetLength + 1 }, (_, index) => index)
	let currentRow = new Array(targetLength + 1)

	for (let sourceIndex = 1; sourceIndex <= sourceLength; sourceIndex++) {
		currentRow[0] = sourceIndex
		const sourceCharacter = source[sourceIndex - 1]

		for (let targetIndex = 1; targetIndex <= targetLength; targetIndex++) {
			const targetCharacter = target[targetIndex - 1]
			const substitutionCost =
				sourceCharacter === targetCharacter ? 0 : 1

			currentRow[targetIndex] = Math.min(
				currentRow[targetIndex - 1] + 1,
				previousRow[targetIndex] + 1,
				previousRow[targetIndex - 1] + substitutionCost,
			)
		}

		const temporarySwap = previousRow
		previousRow = currentRow
		currentRow = temporarySwap
	}

	return previousRow[targetLength]
}

function calculateContainmentScore(
	source: string,
	target: string,
): number {
	if (source.includes(target)) {
		return target.length / source.length
	}
	if (target.includes(source)) {
		return source.length / target.length
	}
	return 0
}

function categorizeScore(
	score: number,
	isIdenticalString: boolean,
): DuplicateMatchType {
	if (isIdenticalString) {
		return 'exact'
	}
	if (score >= 0.82) {
		return 'high'
	}
	if (score >= 0.7) {
		return 'medium'
	}
	return 'none'
}
