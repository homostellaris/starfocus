import { expect, test } from 'bun:test'
import {
	generateProceduralPlanetSpec,
} from '../assets/planetGenerator'
import DevProceduralAssets, {
	DEFAULT_TEST_TODOS,
	TEST_STAR_ROLES,
	createCustomTestTodoItem,
} from './DevProceduralAssets'

test('DEFAULT_TEST_TODOS covers all 4 celestial classes and all 4 biome palettes', () => {
	expect(DEFAULT_TEST_TODOS.length).toBeGreaterThanOrEqual(8)

	const resolvedClasses = new Set<string>()
	const resolvedBiomes = new Set<string>()

	for (const item of DEFAULT_TEST_TODOS) {
		const role = TEST_STAR_ROLES.find(candidate => candidate.id === item.todo.starRole)
		const spec = generateProceduralPlanetSpec({
			todo: item.todo,
			starRole: role,
			starRoleGroupTitle: item.starRoleGroupTitle,
			visitCount: item.visitCount,
		})
		resolvedClasses.add(spec.celestialClass)
		resolvedBiomes.add(spec.biomeId)
	}

	expect(resolvedClasses).toEqual(
		new Set(['asteroid', 'terrestrial', 'emissive', 'gas_giant']),
	)
	expect(resolvedBiomes).toEqual(
		new Set(['engineering', 'urgent', 'growth', 'strategy']),
	)
})

test('createCustomTestTodoItem builds a valid test todo entry with deterministic spec attributes', () => {
	const customEntry = createCustomTestTodoItem({
		id: 'tds0Q5i__n4r2jYrf8JQB_p2z|ucom',
		title: 'Procedural game-friendly visual assets',
		starPoints: 13,
		biomeId: 'engineering',
		visitCount: 2,
	})

	expect(customEntry.todo.id).toBe('tds0Q5i__n4r2jYrf8JQB_p2z|ucom')
	expect(customEntry.todo.title).toBe('Procedural game-friendly visual assets')
	expect(customEntry.todo.starPoints).toBe(13)
	expect(customEntry.visitCount).toBe(2)
})

test('DevProceduralAssets exports a valid React component function', () => {
	expect(typeof DevProceduralAssets).toBe('function')
})

test('createCustomTestTodoItem provides fallback id and title when empty strings are supplied', () => {
	const fallbackEntry = createCustomTestTodoItem({
		id: '   ',
		title: '',
		starPoints: 0,
		biomeId: 'strategy',
		visitCount: 0,
	})

	expect(fallbackEntry.todo.id.length).toBeGreaterThan(0)
	expect(fallbackEntry.todo.title).toBe('Untitled Test Objective')
	expect(fallbackEntry.todo.starPoints).toBe(0)
})

test('createCustomTestTodoItem clamps negative or excessive starPoints and visitCount', () => {
	const clampedEntry = createCustomTestTodoItem({
		id: 'clamped-seed',
		title: 'Boundary Check',
		starPoints: -99,
		biomeId: 'urgent',
		visitCount: 999,
	})

	expect(clampedEntry.todo.starPoints).toBe(0)
	expect(clampedEntry.visitCount).toBe(8)
})
