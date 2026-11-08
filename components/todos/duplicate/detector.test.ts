import { expect, test } from 'bun:test'
import {
	calculateTitleSimilarity,
	detectAllDuplicateClusters,
	findDuplicatesForTitle,
	findHighestActiveFuzzyDuplicate,
	normalizeTitle,
	createPairKey,
} from './detector'
import { Todo } from '../../db'

// Happy path tests first
test('normalizes title by trimming, lowercasing, and removing punctuation', () => {
	expect(normalizeTitle('  Buy Oat Milk!  ')).toBe('buy oat milk')
	expect(normalizeTitle('Task: with (parentheses) & symbols')).toBe(
		'task with parentheses symbols',
	)
})

test('identifies identical titles as exact duplicate with score 1', () => {
	const result = calculateTitleSimilarity('Buy oat milk', 'buy oat milk!')
	expect(result.similarityScore).toBe(1)
	expect(result.matchType).toBe('exact')
})

test('identifies word inversions as high-confidence duplicates via token set jaccard', () => {
	const result = calculateTitleSimilarity('Fix auth bug', 'auth bug fix')
	expect(result.similarityScore).toBeGreaterThanOrEqual(0.82)
	expect(result.matchType).toBe('high')
})

test('identifies minor typos and spacing differences as high similarity', () => {
	const result = calculateTitleSimilarity('Buy oat milk', 'Buy oatmilk')
	expect(result.similarityScore).toBeGreaterThanOrEqual(0.82)
	expect(result.matchType).toBe('high')
})

test('finds fuzzy duplicates among existing todos sorted by score', () => {
	const existingTodos: Todo[] = [
		{ id: '1', title: 'Buy oat milk', starPoints: 2 },
		{ id: '2', title: 'Fix auth bug', starPoints: 3 },
		{ id: '3', title: 'Call dentist', starPoints: 1 },
	]
	const wayfinderIdentifiers = new Set(['1'])

	const matches = findDuplicatesForTitle(
		'buy oatmilk',
		existingTodos,
		undefined,
		wayfinderIdentifiers,
	)

	expect(matches.length).toBe(1)
	expect(matches[0].todo.id).toBe('1')
	expect(matches[0].location).toBe('wayfinder')
	expect(matches[0].similarityScore).toBeGreaterThanOrEqual(0.82)
})

test('finds highest active fuzzy duplicate intercept candidate', () => {
	const existingTodos: Todo[] = [
		{ id: '1', title: 'Ship release notes', completedAt: new Date() },
		{ id: '2', title: 'Ship release notes now' },
	]
	const wayfinderIdentifiers = new Set(['2'])

	const match = findHighestActiveFuzzyDuplicate(
		'Ship release notes',
		existingTodos,
		undefined,
		wayfinderIdentifiers,
	)

	expect(match).toBeDefined()
	expect(match?.todo.id).toBe('2')
	expect(match?.location).toBe('wayfinder')
})

test('clusters duplicate todos across database and selects canonical active todo', () => {
	const todos: Todo[] = [
		{ id: '1', title: 'Prepare launch presentation', starPoints: 1, completedAt: new Date() },
		{ id: '2', title: 'prepare launch presentation!', starPoints: 5 },
		{ id: '3', title: 'Completely unrelated errand', starPoints: 2 },
	]
	const wayfinderIdentifiers = new Set(['2'])

	const clusters = detectAllDuplicateClusters(todos, wayfinderIdentifiers)

	expect(clusters.length).toBe(1)
	expect(clusters[0].canonicalTodo.id).toBe('2')
	expect(clusters[0].canonicalLocation).toBe('wayfinder')
	expect(clusters[0].duplicateTodos.length).toBe(1)
	expect(clusters[0].duplicateTodos[0].todo.id).toBe('1')
	expect(clusters[0].duplicateTodos[0].location).toBe('completed')
})

test('excludes dismissed pairs from clusters', () => {
	const todos: Todo[] = [
		{ id: 'alpha', title: 'Weekly sync' },
		{ id: 'beta', title: 'Weekly sync team' },
	]
	const dismissedPairs = new Set([createPairKey('alpha', 'beta')])

	const clusters = detectAllDuplicateClusters(todos, new Set(), dismissedPairs)

	expect(clusters.length).toBe(0)
})

// Sad path tests second
test('returns none for completely unrelated titles', () => {
	const result = calculateTitleSimilarity('Buy oat milk', 'Call dentist tomorrow')
	expect(result.similarityScore).toBeLessThan(0.4)
	expect(result.matchType).toBe('none')
})

test('returns empty matches when no existing todos meet threshold', () => {
	const existingTodos: Todo[] = [
		{ id: '1', title: 'Read cosmic books' },
		{ id: '2', title: 'Clean workstation' },
	]
	const matches = findDuplicatesForTitle('Go stargazing', existingTodos)
	expect(matches).toEqual([])
})

test('ignores existing todo if candidateTodoIdentifier matches itself during editing', () => {
	const existingTodos: Todo[] = [{ id: 'target-id', title: 'Paint space station' }]
	const matches = findDuplicatesForTitle(
		'Paint space station',
		existingTodos,
		'target-id',
	)
	expect(matches).toEqual([])
})

test('returns undefined when only completed duplicates exist for active interception', () => {
	const existingTodos: Todo[] = [
		{ id: '1', title: 'Inspect heat shields', completedAt: new Date() },
	]
	const match = findHighestActiveFuzzyDuplicate(
		'Inspect heat shields',
		existingTodos,
	)
	expect(match).toBeUndefined()
})

// Bad path tests third
test('handles empty candidate title gracefully', () => {
	const matches = findDuplicatesForTitle('', [{ id: '1', title: 'Existing' }])
	expect(matches).toEqual([])
})

test('handles whitespace-only and punctuation-only titles without crashing', () => {
	const result = calculateTitleSimilarity('   ', '!!!???')
	expect(result.similarityScore).toBe(0)
	expect(result.matchType).toBe('none')
})

test('handles empty todo lists in cluster detector', () => {
	const clusters = detectAllDuplicateClusters([], new Set())
	expect(clusters).toEqual([])
})
