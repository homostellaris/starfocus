import { expect, test } from 'bun:test'
import { STAR_POINTS_THEMES } from '../theme/starPointsThemes'
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

test('resolveBiomePalette and generateProceduralPlanetSpec match the primary hue to starPoints rather than starRole and adapt to the active theme', () => {
	const engRole = {
		id: 'role-eng',
		title: 'Starfocuser',
		icon: { type: 'ionicon' as const, name: 'planetSharp' as const },
	}
	const urgentRole = {
		id: 'role-bug',
		title: 'Bug Squasher',
		icon: { type: 'ionicon' as const, name: 'flameSharp' as const },
	}

	const specWithEngRole = generateProceduralPlanetSpec({
		todo: { id: 'todo-a', title: 'Task A', starPoints: 5, starRole: 'role-eng' },
		starRole: engRole,
		themeId: 'redshift',
	})
	const specWithUrgentRole = generateProceduralPlanetSpec({
		todo: { id: 'todo-b', title: 'Task B', starPoints: 5, starRole: 'role-bug' },
		starRole: urgentRole,
		themeId: 'redshift',
	})

	expect(specWithEngRole.palette.highlight).toBe(
		STAR_POINTS_THEMES.redshift.starColors[5],
	)
	expect(specWithUrgentRole.palette.highlight).toBe(
		STAR_POINTS_THEMES.redshift.starColors[5],
	)

	const synthwaveSpec = generateProceduralPlanetSpec({
		todo: { id: 'todo-a', title: 'Task A', starPoints: 5 },
		themeId: 'outrun_synthwave',
	})
	expect(synthwaveSpec.palette.highlight).toBe(
		STAR_POINTS_THEMES.outrun_synthwave.starColors[5],
	)
	expect(synthwaveSpec.palette.highlight).not.toBe(
		specWithEngRole.palette.highlight,
	)
})

test('generateProceduralPlanetSpec is 100% deterministic and bakes distinct 128x128 bitmaps for all 6 star point tiers with distinct primary hues', () => {
	const sampleTodo = {
		id: 'tds0Q5i__n4r2jYrf8JQB_p2z|ucom',
		title: 'Procedural game-friendly visual assets',
		starPoints: 13,
		starRole: 'role-starfocuser',
	}

	const firstSpec = generateProceduralPlanetSpec({
		todo: sampleTodo,
		themeId: 'redshift',
	})
	const secondSpec = generateProceduralPlanetSpec({
		todo: sampleTodo,
		themeId: 'redshift',
	})

	expect(firstSpec).toEqual(secondSpec)
	expect(firstSpec.celestialClass).toBe('black_hole')
	expect(firstSpec.hasRings).toBe(true)
	expect(firstSpec.palette.highlight).toBe(
		STAR_POINTS_THEMES.redshift.starColors[13],
	)

	const firstBake = bakePlanetBitmap(firstSpec)
	const secondBake = bakePlanetBitmap(firstSpec)

	expect(firstBake.metrics.resolution).toBe(128)
	expect(firstBake.metrics.cacheKey).toBe(secondBake.metrics.cacheKey)
	expect(secondBake.metrics.cacheHit).toBe(true)

	const tierPointValues = [1, 2, 3, 5, 8, 13] as const
	const resolvedClasses = new Set<string>()
	const resolvedPrimaryHues = new Set<string>()

	for (const points of tierPointValues) {
		const spec = generateProceduralPlanetSpec({
			todo: { id: 'same-seed-id', title: 'Tier test', starPoints: points },
			themeId: 'redshift',
		})
		const baked = bakePlanetBitmap(spec)
		expect(baked.rgbaPixels.length).toBe(128 * 128 * 4)
		resolvedClasses.add(spec.celestialClass)
		resolvedPrimaryHues.add(spec.palette.highlight)
	}
	expect(resolvedClasses.size).toBe(6)
	expect(resolvedPrimaryHues.size).toBe(6)
})

test('CelestialBody and PlanetAsset render raw celestial body data attributes and primary Star Points color without HUD reticle overlays', () => {
	const element = CelestialBody({
		todo: {
			id: 'todo-star-8',
			title: 'Deep work engine refactor',
			starPoints: 8,
			starRole: 'role-eng',
		},
		themeId: 'redshift',
		size: 96,
	})

	expect(element.props['data-testid']).toBe('planet-asset')
	expect(element.props['data-todo-id']).toBe('todo-star-8')
	expect(element.props['data-celestial-class']).toBe('star')
	expect(element.props['data-star-points']).toBe(8)
	expect(element.props['data-primary-color']).toBe(
		STAR_POINTS_THEMES.redshift.starColors[8],
	)
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
