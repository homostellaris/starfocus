import { expect, test } from 'bun:test'
import {
	STAR_POINTS_THEMES,
	STAR_POINTS_THEME_IDS,
	applyStarPointsThemeToDocument,
	getActiveStarPointsThemeId,
	resolveStarPointCelestialPalette,
	resolveStarPointsColor,
	setActiveStarPointsThemeId,
} from './starPointsThemes'

test('STAR_POINTS_THEMES defines 5 themes where each theme assigns 6 distinct hex colors to 1, 2, 3, 5, 8, 13 star points and a coordinated ship palette', () => {
	expect(STAR_POINTS_THEME_IDS.length).toBe(5)

	for (const themeId of STAR_POINTS_THEME_IDS) {
		const theme = STAR_POINTS_THEMES[themeId]
		expect(theme.id).toBe(themeId)
		const tierColors = [
			theme.starColors[1],
			theme.starColors[2],
			theme.starColors[3],
			theme.starColors[5],
			theme.starColors[8],
			theme.starColors[13],
		]
		expect(new Set(tierColors).size).toBe(6)
		expect(theme.shipPalette.cockpitGlow).toMatch(/^#[0-9a-fA-F]{6}$/)
	}
})

test('resolveStarPointCelestialPalette sets highlight to the exact Star Points primary hue and varies across themes', () => {
	const redshift3 = resolveStarPointCelestialPalette(3, 'redshift')
	const synthwave3 = resolveStarPointCelestialPalette(3, 'outrun_synthwave')
	const redshift13 = resolveStarPointCelestialPalette(13, 'redshift')

	expect(redshift3.highlight.toLowerCase()).toBe(
		STAR_POINTS_THEMES.redshift.starColors[3].toLowerCase(),
	)
	expect(synthwave3.highlight.toLowerCase()).toBe(
		STAR_POINTS_THEMES.outrun_synthwave.starColors[3].toLowerCase(),
	)
	expect(redshift3.highlight).not.toBe(synthwave3.highlight)
	expect(redshift3.highlight).not.toBe(redshift13.highlight)
})

test('setActiveStarPointsThemeId updates active theme and syncs CSS variables when document is available', () => {
	setActiveStarPointsThemeId('stellar_spectrum')
	expect(getActiveStarPointsThemeId()).toBe('stellar_spectrum')

	setActiveStarPointsThemeId('redshift')
	expect(getActiveStarPointsThemeId()).toBe('redshift')
})

test('resolveStarPointsColor snaps intermediate point values to nearest Fibonacci tier', () => {
	expect(resolveStarPointsColor(4, 'redshift')).toBe(
		STAR_POINTS_THEMES.redshift.starColors[3],
	)
	expect(resolveStarPointsColor(6, 'redshift')).toBe(
		STAR_POINTS_THEMES.redshift.starColors[5],
	)
	expect(resolveStarPointsColor(10, 'redshift')).toBe(
		STAR_POINTS_THEMES.redshift.starColors[8],
	)
})

test('resolveStarPointsColor and setActiveStarPointsThemeId handle out-of-range points and unknown theme ids safely', () => {
	expect(resolveStarPointsColor(-10, 'unknown_theme' as never)).toBe(
		STAR_POINTS_THEMES.redshift.starColors[1],
	)
	expect(resolveStarPointsColor(999, 'unknown_theme' as never)).toBe(
		STAR_POINTS_THEMES.redshift.starColors[13],
	)

	setActiveStarPointsThemeId('invalid_theme' as never)
	expect(getActiveStarPointsThemeId()).toBe('redshift')
	expect(() => applyStarPointsThemeToDocument('redshift')).not.toThrow()
})
