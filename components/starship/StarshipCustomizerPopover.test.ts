import { expect, test } from 'bun:test'
import StarshipCustomizerPopover, {
	resolveActiveLoadoutSummary,
} from './StarshipCustomizerPopover'

test('StarshipCustomizerPopover exports a valid React component function', () => {
	expect(typeof StarshipCustomizerPopover).toBe('function')
})

test('resolveActiveLoadoutSummary resolves names for standard ship archetype and theme', () => {
	const summary = resolveActiveLoadoutSummary('hauler_atlas_mk1', 'solar_forge')
	expect(summary.shipName).toBe('Atlas Heavy Cruiser')
	expect(summary.themeName).toBe('Solar Forge')
})

test('resolveActiveLoadoutSummary resolves names for all 5 whole starship archetypes', () => {
	expect(resolveActiveLoadoutSummary('interceptor_vanguard_mk1', 'redshift').shipName).toBe(
		'Vanguard Interceptor',
	)
	expect(resolveActiveLoadoutSummary('valkyrie_crescent_mk1', 'stellar_spectrum').shipName).toBe(
		'Valkyrie Crescent',
	)
	expect(resolveActiveLoadoutSummary('science_helios_mk1', 'outrun_synthwave').shipName).toBe(
		'Helios Explorer',
	)
	expect(resolveActiveLoadoutSummary('striker_wraith_mk1', 'bioluminescent_abyss').shipName).toBe(
		'Phantom Stealth',
	)
	expect(resolveActiveLoadoutSummary('hauler_atlas_mk1', 'solar_forge').shipName).toBe(
		'Atlas Heavy Cruiser',
	)
})

test('resolveActiveLoadoutSummary falls back gracefully when given unknown identifiers', () => {
	const fallbackSummary = resolveActiveLoadoutSummary(
		'unknown_ship' as any,
		'unknown_theme' as any,
	)
	expect(fallbackSummary.shipName).toBe('Starship')
	expect(fallbackSummary.themeName).toBe('Standard')
})
