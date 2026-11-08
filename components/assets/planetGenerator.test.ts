import { expect, test } from 'bun:test'
import {
	BIOME_PALETTES,
	bakePlanetBitmap,
	generateProceduralPlanetSpec,
	resolveBiomePalette,
	resolveCelestialClass,
} from './planetGenerator'
import PlanetAsset from './PlanetAsset'

test('resolveCelestialClass maps Fibonacci starPoints to the 4 canonical celestial classes', () => {
	expect(resolveCelestialClass(1)).toBe('asteroid')
	expect(resolveCelestialClass(2)).toBe('asteroid')
	expect(resolveCelestialClass(3)).toBe('terrestrial')
	expect(resolveCelestialClass(5)).toBe('terrestrial')
	expect(resolveCelestialClass(8)).toBe('emissive')
	expect(resolveCelestialClass(13, 0, 10)).toBe('emissive')
	expect(resolveCelestialClass(13, 2, 10)).toBe('gas_giant')
	expect(resolveCelestialClass(21)).toBe('gas_giant')
})

test('resolveBiomePalette maps Engineering, Urgent, Growth, and Strategy roles to their 4-color palettes', () => {
	const engineeringPalette = resolveBiomePalette(
		{ id: 'todo-1', starRole: 'role-eng' },
		{
			id: 'role-eng',
			title: 'Starfocuser',
			icon: { type: 'ionicon', name: 'planetSharp' },
		},
		'Reality sculptor',
	)
	expect(engineeringPalette.id).toBe('engineering')
	expect(engineeringPalette.deepShadow).toBe('#0B1D3A')
	expect(engineeringPalette.highlight).toBe('#45D9FD')

	const urgentPalette = resolveBiomePalette(
		{ id: 'todo-2', starRole: 'role-bug' },
		{
			id: 'role-bug',
			title: 'Bug Squasher',
			icon: { type: 'ionicon', name: 'flameSharp' },
		},
	)
	expect(urgentPalette.id).toBe('urgent')
	expect(urgentPalette.highlight).toBe('#E63946')
	expect(urgentPalette.emissiveOrAtmos).toBe('#FFB703')

	const growthPalette = resolveBiomePalette(
		{ id: 'todo-3', starRole: 'role-father' },
		{
			id: 'role-father',
			title: 'Father',
			icon: { type: 'ionicon', name: 'maleSharp' },
		},
	)
	expect(growthPalette.id).toBe('growth')
	expect(growthPalette.highlight).toBe('#74C69D')

	const strategyPalette = resolveBiomePalette(
		{ id: 'todo-4', starRole: 'role-captain' },
		{
			id: 'role-captain',
			title: 'Captain',
			icon: { type: 'ionicon', name: 'starSharp' },
		},
	)
	expect(strategyPalette.id).toBe('strategy')
	expect(strategyPalette.highlight).toBe('#C77DFF')
})

test('generateProceduralPlanetSpec is 100% deterministic for a given Todo and caches offscreen bake metrics', () => {
	const sampleTodo = {
		id: 'tds0Q5i__n4r2jYrf8JQB_p2z|ucom',
		title: 'Procedural game-friendly visual assets',
		starPoints: 13,
		starRole: 'role-starfocuser',
	}
	const sampleRole = {
		id: 'role-starfocuser',
		title: 'Starfocuser',
		icon: { type: 'ionicon' as const, name: 'flashSharp' as const },
	}

	const firstSpec = generateProceduralPlanetSpec({
		todo: sampleTodo,
		starRole: sampleRole,
		starRoleGroupTitle: 'Reality sculptor',
		visitCount: 3,
	})
	const secondSpec = generateProceduralPlanetSpec({
		todo: sampleTodo,
		starRole: sampleRole,
		starRoleGroupTitle: 'Reality sculptor',
		visitCount: 3,
	})

	expect(firstSpec).toEqual(secondSpec)
	expect(firstSpec.celestialClass).toBe('gas_giant')
	expect(firstSpec.hasRings).toBe(true)
	expect(firstSpec.orbitingMoonCount).toBe(3)
	expect(firstSpec.biomeId).toBe('engineering')

	const firstBake = bakePlanetBitmap(firstSpec)
	const secondBake = bakePlanetBitmap(firstSpec)

	expect(firstBake.metrics.resolution).toBe(128)
	expect(firstBake.metrics.cacheKey).toBe(secondBake.metrics.cacheKey)
	expect(secondBake.metrics.cacheHit).toBe(true)
})

test('PlanetAsset component renders deterministic data attributes for celestial class, biome, and HUD mode', () => {
	const element = PlanetAsset({
		todo: {
			id: 'todo-emissive-8',
			title: 'Deep work engine refactor',
			starPoints: 8,
			starRole: 'role-eng',
		},
		starRole: {
			id: 'role-eng',
			title: 'Engineer',
			icon: { type: 'ionicon', name: 'flashSharp' },
		},
		visitCount: 2,
		size: 96,
		hudMode: 'arcade',
	})

	expect(element.props['data-testid']).toBe('planet-asset')
	expect(element.props['data-todo-id']).toBe('todo-emissive-8')
	expect(element.props['data-celestial-class']).toBe('emissive')
	expect(element.props['data-biome-id']).toBe('engineering')
	expect(element.props['data-hud-mode']).toBe('arcade')
	expect(element.props['data-orbiting-moons']).toBe(2)
})

test('resolveCelestialClass and resolveBiomePalette handle undefined starPoints and missing starRole gracefully', () => {
	expect(resolveCelestialClass(undefined)).toBe('asteroid')
	expect(resolveCelestialClass(0)).toBe('asteroid')

	const fallbackPalette = resolveBiomePalette({ id: 'unassigned-todo-id' })
	expect(Object.keys(BIOME_PALETTES)).toContain(fallbackPalette.id)
})

test('generateProceduralPlanetSpec clamps negative or extreme starPoints and visitCount to safe ranges', () => {
	const negativeSpec = generateProceduralPlanetSpec({
		todo: { id: '', title: '', starPoints: -15 },
		visitCount: -4,
	})
	expect(negativeSpec.celestialClass).toBe('asteroid')
	expect(negativeSpec.orbitingMoonCount).toBe(0)

	const extremeSpec = generateProceduralPlanetSpec({
		todo: { id: 'extreme-milestone', title: 'Hyperstructure', starPoints: 9999 },
		visitCount: 500,
	})
	expect(extremeSpec.celestialClass).toBe('gas_giant')
	expect(extremeSpec.orbitingMoonCount).toBeLessThanOrEqual(8)
})
