import { expect, test } from 'bun:test'
import {
	SHIP_ARCHETYPE_IDS,
	SHIP_COLOR_PALETTES,
	SHIP_SOCKET_MANIFESTS,
	STARSHIP_BITMAP_RESOLUTION,
	applyRgbMaskPalette,
	assembleShipLayers,
	bakeStarshipBitmap,
	resolveShipLoadout,
} from './shipAssembler'
import ModularStarship from './ModularStarship'

test('resolveShipLoadout, assembleShipLayers, and bakeStarshipBitmap support all 5 whole starship models and 5 skins at 128x128 pixel-shader resolution', () => {
	expect(SHIP_ARCHETYPE_IDS.length).toBe(5)
	expect(SHIP_COLOR_PALETTES.length).toBe(5)
	expect(STARSHIP_BITMAP_RESOLUTION).toBe(128)

	for (const archetypeId of SHIP_ARCHETYPE_IDS) {
		const loadout = resolveShipLoadout({
			hullArchetype: archetypeId,
			skinId: 'vanguard_cyan',
		})
		expect(loadout.hullArchetype).toBe(archetypeId)

		const baked = bakeStarshipBitmap(loadout, {
			recoilOffsetPx: 0,
			thrusterFrame: 1,
			enableDithering: true,
		})
		expect(baked.pixelBuffer.length).toBe(128 * 128 * 4)

		let nonTransparentPixels = 0
		for (let i = 3; i < baked.pixelBuffer.length; i += 4) {
			if (baked.pixelBuffer[i] > 0) {
				nonTransparentPixels++
			}
		}
		expect(nonTransparentPixels).toBeGreaterThan(1200)

		const layers = assembleShipLayers(loadout, {
			recoilOffsetPx: 0,
			thrusterFrame: 0,
		})
		const zIndices = layers.map(layer => layer.zIndex)
		const sortedZIndices = [...zIndices].sort((first, second) => first - second)
		expect(zIndices).toEqual(sortedZIndices)
	}
})

test('assembleShipLayers and bakeStarshipBitmap apply mechanical recoil offset (y + 2px) to wing hardpoints', () => {
	const loadout = resolveShipLoadout({
		hullArchetype: 'hauler_atlas_mk1',
	})
	const restingLayers = assembleShipLayers(loadout, {
		recoilOffsetPx: 0,
		thrusterFrame: 0,
	})
	const firingLayers = assembleShipLayers(loadout, {
		recoilOffsetPx: 2,
		thrusterFrame: 0,
	})

	for (let index = 0; index < restingLayers.length; index++) {
		const restingLayer = restingLayers[index]
		const firingLayer = firingLayers[index]
		if (restingLayer.zIndex === 2) {
			expect(firingLayer.offsetY).toBe(restingLayer.offsetY + 2)
		} else {
			expect(firingLayer.offsetY).toBe(restingLayer.offsetY)
		}
	}

	const restingBitmap = bakeStarshipBitmap(loadout, { recoilOffsetPx: 0 })
	const firingBitmap = bakeStarshipBitmap(loadout, { recoilOffsetPx: 3 })
	expect(restingBitmap.cacheKey).not.toBe(firingBitmap.cacheKey)
})

test('applyRgbMaskPalette maps 4-channel indexed mask values to configured hex palette colors', () => {
	const palette = SHIP_COLOR_PALETTES[0]
	const sampleMask = [
		[0, 1, 2],
		[3, 4, 5],
	]

	const coloredPixels = applyRgbMaskPalette(sampleMask, palette)
	expect(coloredPixels[0][0]).toBeNull()
	expect(coloredPixels[0][1]).toBe(palette.outlineDark)
	expect(coloredPixels[0][2]).toBe(palette.primaryHullRed)
	expect(coloredPixels[1][0]).toBe(palette.secondaryTrimGreen)
	expect(coloredPixels[1][1]).toBe(palette.emissiveCockpitBlue)
	expect(coloredPixels[1][2]).toBe('#ffffff')
})

test('ModularStarship component renders 128x128 pixel-shader canvas with whole starship model and skin data attributes', () => {
	const element = ModularStarship({
		loadout: {
			hullArchetype: 'striker_wraith_mk1',
			skinId: 'solar_ember',
			thrusterType: 'crimson_afterburner',
		},
		hardpointRecoilOffsetPx: 2,
	})

	expect(element.props['data-testid']).toBe('modular-starship')
	expect(element.props['data-hull-archetype']).toBe('striker_wraith_mk1')
	expect(element.props['data-skin-id']).toBe('solar_ember')
	expect(element.props['data-thruster-type']).toBe('crimson_afterburner')
	expect(element.props['data-recoil-offset']).toBe(2)
})

test('resolveShipLoadout falls back to interceptor_vanguard_mk1 defaults when partial fields are omitted', () => {
	const defaultLoadout = resolveShipLoadout(undefined)
	expect(defaultLoadout.hullArchetype).toBe('interceptor_vanguard_mk1')
	expect(defaultLoadout.skinId).toBe('vanguard_cyan')
	expect(defaultLoadout.thrusterType).toBe('cyan_ion')
	expect(SHIP_SOCKET_MANIFESTS[defaultLoadout.hullArchetype].dimensions).toEqual({
		width: 64,
		height: 64,
	})
})

test('assembleShipLayers and resolveShipLoadout sanitize out-of-range recoil offsets and unknown archetypes', () => {
	const loadout = resolveShipLoadout({
		hullArchetype: 'unknown_archetype' as any,
		skinId: 'unknown_skin' as any,
	})
	expect(loadout.hullArchetype).toBe('interceptor_vanguard_mk1')
	expect(loadout.skinId).toBe('vanguard_cyan')

	const clampedNegative = assembleShipLayers(loadout, {
		recoilOffsetPx: -25,
		thrusterFrame: -3,
	})
	const clampedExcessive = assembleShipLayers(loadout, {
		recoilOffsetPx: 999,
		thrusterFrame: 999,
	})

	const restingHardpoint = assembleShipLayers(loadout, {
		recoilOffsetPx: 0,
		thrusterFrame: 0,
	}).find(layer => layer.zIndex === 2)!
	const negativeHardpoint = clampedNegative.find(layer => layer.zIndex === 2)!
	const excessiveHardpoint = clampedExcessive.find(layer => layer.zIndex === 2)!

	expect(negativeHardpoint.offsetY).toBe(restingHardpoint.offsetY)
	expect(excessiveHardpoint.offsetY).toBe(restingHardpoint.offsetY + 6)
})
