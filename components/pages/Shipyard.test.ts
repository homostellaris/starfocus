import { expect, test } from 'bun:test'
import Shipyard, {
	CELESTIAL_SHOWCASE_TIERS,
	calculateClosestCarouselIndex,
} from './Shipyard'

test('Shipyard exports a valid React component function', () => {
	expect(typeof Shipyard).toBe('function')
})

test('CELESTIAL_SHOWCASE_TIERS covers all 6 celestial tiers in ascending star points order', () => {
	const tiers = CELESTIAL_SHOWCASE_TIERS.map(item => item.tier)
	expect(tiers).toEqual([1, 2, 3, 5, 8, 13])

	const names = CELESTIAL_SHOWCASE_TIERS.map(item => item.name)
	expect(names).toEqual([
		'Asteroid',
		'Dwarf Planet',
		'Terrestrial',
		'Gas Giant',
		'Star',
		'Black Hole',
	])
})

test('calculateClosestCarouselIndex identifies the middle card closest to viewport center line', () => {
	const itemPositions = [
		{ offsetLeft: 0, offsetWidth: 280 },
		{ offsetLeft: 296, offsetWidth: 280 },
		{ offsetLeft: 592, offsetWidth: 280 },
	]

	const firstCardCenter = 140
	expect(calculateClosestCarouselIndex(firstCardCenter, itemPositions)).toBe(0)

	const secondCardCenter = 436
	expect(calculateClosestCarouselIndex(secondCardCenter, itemPositions)).toBe(1)

	const thirdCardCenter = 732
	expect(calculateClosestCarouselIndex(thirdCardCenter, itemPositions)).toBe(2)
})

test('calculateClosestCarouselIndex handles scrolling boundary when between items', () => {
	const itemPositions = [
		{ offsetLeft: 0, offsetWidth: 280 },
		{ offsetLeft: 300, offsetWidth: 280 },
	]

	expect(calculateClosestCarouselIndex(285, itemPositions)).toBe(0)
	expect(calculateClosestCarouselIndex(295, itemPositions)).toBe(1)
})

test('calculateClosestCarouselIndex handles empty items list safely returning index 0', () => {
	expect(calculateClosestCarouselIndex(250, [])).toBe(0)
})
