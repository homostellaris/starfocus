import { expect, test } from 'bun:test'
import { generateProceduralPlanetSpec } from '../assets/planetGenerator'
import DevProceduralAssets, {
	DEFAULT_TEST_TODOS,
	TEST_STAR_ROLES,
	createCustomTestTodoItem,
} from './DevProceduralAssets'

test('DEFAULT_TEST_TODOS covers all 6 celestial classes (1, 2, 3, 5, 8, 13 pts) with 6 distinct Star Points primary hues', () => {
	expect(DEFAULT_TEST_TODOS.length).toBe(6)

	const resolvedClasses = new Set<string>()
	const resolvedPrimaryHues = new Set<string>()

	for (const item of DEFAULT_TEST_TODOS) {
		const role = TEST_STAR_ROLES.find(
			(candidate) => candidate.id === item.todo.starRole,
		)
		const spec = generateProceduralPlanetSpec({
			todo: item.todo,
			starRole: role,
			starRoleGroupTitle: item.starRoleGroupTitle,
		})
		resolvedClasses.add(spec.celestialClass)
		resolvedPrimaryHues.add(spec.palette.highlight)
	}

	expect(resolvedClasses).toEqual(
		new Set([
			'asteroid',
			'dwarf_planet',
			'terrestrial',
			'gas_giant',
			'star',
			'black_hole',
		]),
	)
	expect(resolvedPrimaryHues.size).toBe(6)
})

test('createCustomTestTodoItem builds a valid test todo entry with deterministic spec attributes', () => {
	const customEntry = createCustomTestTodoItem({
		id: 'tds0Q5i__n4r2jYrf8JQB_p2z|ucom',
		title: 'Procedural game-friendly visual assets',
		starPoints: 13,
		biomeId: 'engineering',
	})

	expect(customEntry.todo.id).toBe('tds0Q5i__n4r2jYrf8JQB_p2z|ucom')
	expect(customEntry.todo.title).toBe('Procedural game-friendly visual assets')
	expect(customEntry.todo.starPoints).toBe(13)
})

test('DevProceduralAssets exports a valid React component function', () => {
	expect(typeof DevProceduralAssets).toBe('function')
})

test('createCustomTestTodoItem provides fallback id and title when empty strings are supplied', () => {
	const fallbackEntry = createCustomTestTodoItem({
		id: '   ',
		title: '',
		starPoints: 1,
		biomeId: 'strategy',
	})

	expect(fallbackEntry.todo.id.length).toBeGreaterThan(0)
	expect(fallbackEntry.todo.title).toBe('Untitled Test Objective')
	expect(fallbackEntry.todo.starPoints).toBe(1)
})

test('createCustomTestTodoItem clamps starPoints to [1, 13] with 13 as the maximum', () => {
	const lowClamped = createCustomTestTodoItem({
		id: 'clamped-seed',
		title: 'Boundary Check',
		starPoints: -99,
		biomeId: 'urgent',
	})
	const highClamped = createCustomTestTodoItem({
		id: 'clamped-seed-high',
		title: 'Max Boundary Check',
		starPoints: 21,
		biomeId: 'urgent',
	})

	expect(lowClamped.todo.starPoints).toBe(1)
	expect(highClamped.todo.starPoints).toBe(13)
})
