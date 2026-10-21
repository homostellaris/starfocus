import { expect, test } from 'bun:test'
import {
	combineNoteContents,
	determineHighestStarPoints,
} from './actions'

// Happy path tests first
test('combines unique note contents with markdown dividers', () => {
	const result = combineNoteContents([
		'First important note',
		'Second supplementary note',
	])
	expect(result).toBe('First important note\n\n---\n\nSecond supplementary note')
})

test('deduplicates identical notes when combining', () => {
	const result = combineNoteContents([
		'Same note content',
		'Same note content',
	])
	expect(result).toBe('Same note content')
})

test('determines highest star points among merged candidates', () => {
	const result = determineHighestStarPoints([1, 5, 2, undefined])
	expect(result).toBe(5)
})

// Sad path tests second
test('returns undefined when all notes are empty or undefined', () => {
	const result = combineNoteContents([undefined, '   ', ''])
	expect(result).toBeUndefined()
})

test('returns undefined when no positive star points are present', () => {
	const result = determineHighestStarPoints([undefined, 0, undefined])
	expect(result).toBeUndefined()
})

// Bad path tests third
test('handles empty arrays gracefully without throwing', () => {
	expect(combineNoteContents([])).toBeUndefined()
	expect(determineHighestStarPoints([])).toBeUndefined()
})
