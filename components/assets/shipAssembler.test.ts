import { expect, test } from 'bun:test'
import {
	SHIP_COLOR_PALETTES,
	SHIP_SOCKET_MANIFESTS,
	applyRgbMaskPalette,
	assembleShipLayers,
	resolveShipLoadout,
} from './shipAssembler'
import ModularStarship from './ModularStarship'

test('assembleShipLayers returns strictly ordered z:0..z:4 layers for all 4 canonical ship archetypes', () => {
	const archetypeIds = [
		'interceptor_vanguard_mk1',
		'hauler_atlas_mk1',
		'science_helios_mk1',
		'striker_wraith_mk1',
	] as const

	for (const archetypeId of archetypeIds) {
		const loadout = resolveShipLoadout({ hullArchetype: archetypeId })
		const layers = assembleShipLayers(loadout, {
			recoilOffsetPx: 0,
			thrusterFrame: 0,
		})

		const zIndices = layers.map(layer => layer.zIndex)
		const sortedZIndices = [...zIndices].sort((first, second) => first - second)
		expect(zIndices).toEqual(sortedZIndices)
		expect(new Set<number>(zIndices)).toEqual(new Set([0, 1, 2, 3, 4]))

		const thrusterLayers = layers.filter(layer => layer.zIndex === 0)
		for (const thrusterLayer of thrusterLayers) {
			expect(thrusterLayer.blendMode).toBe('lighter')
		}

		const wingLayers = layers.filter(layer => layer.zIndex === 1)
		expect(wingLayers.some(wing => wing.mirrorX === false)).toBe(true)
		expect(wingLayers.some(wing => wing.mirrorX === true)).toBe(true)
	}
})

test('assembleShipLayers applies mechanical recoil offset (y + 2px) exclusively to z:2 wing hardpoints', () => {
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

test('ModularStarship component renders with data attributes for hull archetype, thruster type, and recoil', () => {
	const element = ModularStarship({
		loadout: {
			hullArchetype: 'striker_wraith_mk1',
			thrusterType: 'crimson_afterburner',
		},
		hardpointRecoilOffsetPx: 2,
		hudMode: 'arcade',
	})

	expect(element.props['data-testid']).toBe('modular-starship')
	expect(element.props['data-hull-archetype']).toBe('striker_wraith_mk1')
	expect(element.props['data-thruster-type']).toBe('crimson_afterburner')
	expect(element.props['data-hud-mode']).toBe('arcade')
	expect(element.props['data-recoil-offset']).toBe(2)
})

test('resolveShipLoadout falls back to interceptor_vanguard_mk1 defaults when partial fields are omitted', () => {
	const defaultLoadout = resolveShipLoadout(undefined)
	expect(defaultLoadout.hullArchetype).toBe('interceptor_vanguard_mk1')
	expect(defaultLoadout.wingArchetype).toBe('interceptor_vanguard_mk1')
	expect(defaultLoadout.thrusterType).toBe('cyan_ion')
	expect(SHIP_SOCKET_MANIFESTS[defaultLoadout.hullArchetype].dimensions).toEqual({
		width: 64,
		height: 64,
	})
})

test('assembleShipLayers and applyRgbMaskPalette sanitize out-of-range recoil offsets and invalid hex strings', () => {
	const loadout = resolveShipLoadout({
		hullArchetype: 'unknown_archetype' as any,
	})
	expect(loadout.hullArchetype).toBe('interceptor_vanguard_mk1')

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
