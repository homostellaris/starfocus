import { expect, test } from 'bun:test'
import {
	BIOME_PALETTES,
	bakePlanetBitmap,
	generateProceduralPlanetSpec,
	resolveBiomePalette,
	resolveCelestialClass,
} from './planetGenerator'
import PlanetAsset, { CelestialBody } from './PlanetAsset'

test('resolveCelestialClass maps each Fibonacci starPoints tier (1, 2, 3, 5, 8, 13) to a distinct celestial body class', () => {
	expect(resolveCelestialClass(1)).toBe('asteroid')
	expect(resolveCelestialClass(2)).toBe('dwarf_planet')
	expect(resolveCelestialClass(3)).toBe('terrestrial')
	expect(resolveCelestialClass(5)).toBe('gas_giant')
	expect(resolveCelestialClass(8)).toBe('star')
	expect(resolveCelestialClass(13)).toBe('black_hole')
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

test('generateProceduralPlanetSpec is 100% deterministic and bakes distinct 128x128 bitmaps for all 6 star point tiers', () => {
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
	})
	const secondSpec = generateProceduralPlanetSpec({
		todo: sampleTodo,
		starRole: sampleRole,
		starRoleGroupTitle: 'Reality sculptor',
	})

	expect(firstSpec).toEqual(secondSpec)
	expect(firstSpec.celestialClass).toBe('black_hole')
	expect(firstSpec.hasRings).toBe(true)
	expect(firstSpec.biomeId).toBe('engineering')

	const firstBake = bakePlanetBitmap(firstSpec)
	const secondBake = bakePlanetBitmap(firstSpec)

	expect(firstBake.metrics.resolution).toBe(128)
	expect(firstBake.metrics.cacheKey).toBe(secondBake.metrics.cacheKey)
	expect(secondBake.metrics.cacheHit).toBe(true)

	const tierPointValues = [1, 2, 3, 5, 8, 13] as const
	const resolvedClasses = tierPointValues.map(points => {
		const spec = generateProceduralPlanetSpec({
			todo: { id: 'same-seed-id', title: 'Tier test', starPoints: points },
			biomeOverride: 'engineering',
		})
		const baked = bakePlanetBitmap(spec)
		expect(baked.rgbaPixels.length).toBe(128 * 128 * 4)
		return spec.celestialClass
	})
	expect(new Set(resolvedClasses).size).toBe(6)
})

test('CelestialBody and PlanetAsset render raw celestial body data attributes without HUD reticle overlays', () => {
	const element = CelestialBody({
		todo: {
			id: 'todo-star-8',
			title: 'Deep work engine refactor',
			starPoints: 8,
			starRole: 'role-eng',
		},
		starRole: {
			id: 'role-eng',
			title: 'Engineer',
			icon: { type: 'ionicon', name: 'flashSharp' },
		},
		size: 96,
	})

	expect(element.props['data-testid']).toBe('planet-asset')
	expect(element.props['data-todo-id']).toBe('todo-star-8')
	expect(element.props['data-celestial-class']).toBe('star')
	expect(element.props['data-biome-id']).toBe('engineering')
	expect(element.props['data-star-points']).toBe(8)
	expect(PlanetAsset).toBe(CelestialBody)
})

test('resolveCelestialClass and resolveBiomePalette handle undefined starPoints and missing starRole gracefully', () => {
	expect(resolveCelestialClass(undefined)).toBe('asteroid')
	expect(resolveCelestialClass(0)).toBe('asteroid')

	const fallbackPalette = resolveBiomePalette({ id: 'unassigned-todo-id' })
	expect(Object.keys(BIOME_PALETTES)).toContain(fallbackPalette.id)
})

test('generateProceduralPlanetSpec clamps negative or above-13 starPoints to the valid [1..13] range', () => {
	const negativeSpec = generateProceduralPlanetSpec({
		todo: { id: '', title: '', starPoints: -15 },
	})
	expect(negativeSpec.starPoints).toBe(1)
	expect(negativeSpec.celestialClass).toBe('asteroid')

	const extremeSpec = generateProceduralPlanetSpec({
		todo: { id: 'extreme-milestone', title: 'Hyperstructure', starPoints: 9999 },
	})
	expect(extremeSpec.starPoints).toBe(13)
	expect(extremeSpec.celestialClass).toBe('black_hole')
})
