import {
	STAR_POINTS_THEMES,
	type StarPointsThemeId,
	getActiveStarPointsTheme,
	isValidStarPointsThemeId,
} from '../theme/starPointsThemes'
import { getAdditiveGlowBitmap } from './planetGenerator'
import {
	sampleSimplexNoise2D,
	shouldApplyBayerDither,
} from './proceduralMath'
import type {
	AssembledShipLayer,
	ShipArchetypeId,
	ShipColorPalette,
	ShipLoadoutConfig,
	ShipSkinId,
	ShipSocketManifest,
	ThrusterPlumeType,
} from './types'

export const STARSHIP_BITMAP_RESOLUTION = 128
const MAX_STARSHIP_CACHE_ENTRIES = 96
const LIGHT_DIRECTION: [number, number, number] = [-0.42, -0.48, 0.77]

export interface BakedStarshipBitmap {
	cacheKey: string
	pixelBuffer: Uint8ClampedArray
	canvas: HTMLCanvasElement | null
}

const starshipBitmapCache = new Map<string, BakedStarshipBitmap>()

export const SHIP_ARCHETYPE_IDS: ShipArchetypeId[] = [
	'interceptor_vanguard_mk1',
	'striker_wraith_mk1',
	'science_helios_mk1',
	'hauler_atlas_mk1',
	'valkyrie_crescent_mk1',
]

export const SHIP_ARCHETYPE_LIST = SHIP_ARCHETYPE_IDS

export const SHIP_SKIN_IDS: ShipSkinId[] = [
	'vanguard_cyan',
	'solar_ember',
	'terran_sage',
	'nebula_violet',
	'stealth_obsidian',
]

export const SHIP_SKIN_LIST = SHIP_SKIN_IDS

export const THRUSTER_PLUME_TYPES: ThrusterPlumeType[] = [
	'cyan_ion',
	'heavy_plasma',
	'violet_ring',
	'crimson_afterburner',
]

export const SHIP_COLOR_PALETTES: ShipColorPalette[] = [
	{
		id: 'vanguard_cyan',
		name: 'Aegis Command',
		tagline: 'Titanium-white fleet armor with electric cyan ion core',
		primaryHullRed: '#e2e8f0',
		secondaryTrimGreen: '#0ea5e9',
		emissiveCockpitBlue: '#38bdf8',
		outlineDark: '#09090b',
		hullPrimary: '#1e293b',
		hullSecondary: '#475569',
		hullHighlight: '#f1f5f9',
		accentStripe: '#0284c7',
		cockpitGlow: '#38bdf8',
		thrusterPlume: '#38bdf8',
	},
	{
		id: 'solar_ember',
		name: 'Crimson Vanguard',
		tagline: 'Obsidian strike plating with crimson livery & solar plasma',
		primaryHullRed: '#f8fafc',
		secondaryTrimGreen: '#ef4444',
		emissiveCockpitBlue: '#f59e0b',
		outlineDark: '#09090b',
		hullPrimary: '#18181b',
		hullSecondary: '#3f3f46',
		hullHighlight: '#e4e4e7',
		accentStripe: '#dc2626',
		cockpitGlow: '#fbbf24',
		thrusterPlume: '#f97316',
	},
	{
		id: 'terran_sage',
		name: 'Emerald Horizon',
		tagline: 'Deep forest composite armor with bioluminescent teal drive',
		primaryHullRed: '#ecfdf5',
		secondaryTrimGreen: '#10b981',
		emissiveCockpitBlue: '#2dd4bf',
		outlineDark: '#09090b',
		hullPrimary: '#0f2922',
		hullSecondary: '#1f4d3d',
		hullHighlight: '#d1fae5',
		accentStripe: '#10b981',
		cockpitGlow: '#5eead4',
		thrusterPlume: '#34d399',
	},
	{
		id: 'nebula_violet',
		name: 'Nebula Royal',
		tagline: 'Astral indigo hull with burnished gold & orchid plasma',
		primaryHullRed: '#f3e8ff',
		secondaryTrimGreen: '#a855f7',
		emissiveCockpitBlue: '#e879f9',
		outlineDark: '#09090b',
		hullPrimary: '#1e1b4b',
		hullSecondary: '#3730a3',
		hullHighlight: '#ede9fe',
		accentStripe: '#c084fc',
		cockpitGlow: '#f0abfc',
		thrusterPlume: '#d946ef',
	},
	{
		id: 'stealth_obsidian',
		name: 'Void Spec-Ops',
		tagline: 'Matte carbon stealth facets with tactical chartreuse optics',
		primaryHullRed: '#334155',
		secondaryTrimGreen: '#84cc16',
		emissiveCockpitBlue: '#a3e635',
		outlineDark: '#050507',
		hullPrimary: '#090d16',
		hullSecondary: '#1e293b',
		hullHighlight: '#475569',
		accentStripe: '#84cc16',
		cockpitGlow: '#bef264',
		thrusterPlume: '#84cc16',
	},
]

export const SHIP_SOCKET_MANIFESTS: Record<
	ShipArchetypeId,
	ShipSocketManifest
> = {
	interceptor_vanguard_mk1: {
		hull_id: 'interceptor_vanguard_mk1',
		name: 'Vanguard Interceptor',
		roleLabel: 'Agile Fleet Fighter',
		description:
			'Sleek swept-blade starfighter with twin intake strakes, panoramic faceted canopy, and dual vector ion afterburners.',
		dimensions: { width: 64, height: 64 },
		sockets: {
			cockpit: { x: 0, y: -6 },
			dorsal_cargo: [],
			wing_left: {
				x: -14,
				y: 2,
				mirrorX: false,
				hardpoint: { x: -6, y: -8 },
			},
			wing_right: {
				x: 14,
				y: 2,
				mirrorX: true,
				hardpoint: { x: 6, y: -8 },
			},
			thrusters: [
				{ x: -6, y: 24, scale: 1.0, type: 'cyan_ion' },
				{ x: 6, y: 24, scale: 1.0, type: 'cyan_ion' },
			],
		},
	},
	striker_wraith_mk1: {
		hull_id: 'striker_wraith_mk1',
		name: 'Phantom Stealth',
		roleLabel: 'Delta Recon Corvette',
		description:
			'Razor-angled stealth delta fuselage with forward canard blades, dorsal plasma spine, and wide slit vector thrusters.',
		dimensions: { width: 64, height: 64 },
		sockets: {
			cockpit: { x: 0, y: -2 },
			dorsal_cargo: [],
			wing_left: {
				x: -13,
				y: 4,
				mirrorX: false,
				hardpoint: { x: -5, y: -11 },
			},
			wing_right: {
				x: 13,
				y: 4,
				mirrorX: true,
				hardpoint: { x: 5, y: -11 },
			},
			thrusters: [
				{ x: -5, y: 23, scale: 0.95, type: 'crimson_afterburner' },
				{ x: 5, y: 23, scale: 0.95, type: 'crimson_afterburner' },
			],
		},
	},
	science_helios_mk1: {
		hull_id: 'science_helios_mk1',
		name: 'Helios Explorer',
		roleLabel: 'Deep-Space Science Vessel',
		description:
			'Sculpted gravimetric ring hull with twin forward sensor mandibles, spherical quantum core dome, and twin warp nacelles.',
		dimensions: { width: 64, height: 64 },
		sockets: {
			cockpit: { x: 0, y: -4 },
			dorsal_cargo: [{ x: 0, y: 8 }],
			wing_left: {
				x: -15,
				y: -2,
				mirrorX: false,
				hardpoint: { x: -7, y: -6 },
			},
			wing_right: {
				x: 15,
				y: -2,
				mirrorX: true,
				hardpoint: { x: 7, y: -6 },
			},
			thrusters: [{ x: 0, y: 24, scale: 1.15, type: 'violet_ring' }],
		},
	},
	hauler_atlas_mk1: {
		hull_id: 'hauler_atlas_mk1',
		name: 'Atlas Heavy Cruiser',
		roleLabel: 'Armored Flagship Dreadnought',
		description:
			'Broad-shouldered command cruiser with terraced armor plating, twin heavy bow railguns, and quad fusion drive nacelles.',
		dimensions: { width: 64, height: 64 },
		sockets: {
			cockpit: { x: 0, y: -12 },
			dorsal_cargo: [
				{ x: -6, y: 0 },
				{ x: 6, y: 0 },
				{ x: -6, y: 8 },
				{ x: 6, y: 8 },
			],
			wing_left: {
				x: -16,
				y: 0,
				mirrorX: false,
				hardpoint: { x: -4, y: -10 },
			},
			wing_right: {
				x: 16,
				y: 0,
				mirrorX: true,
				hardpoint: { x: 4, y: -10 },
			},
			thrusters: [
				{ x: -9, y: 25, scale: 1.25, type: 'heavy_plasma' },
				{ x: 9, y: 25, scale: 1.25, type: 'heavy_plasma' },
			],
		},
	},
	valkyrie_crescent_mk1: {
		hull_id: 'valkyrie_crescent_mk1',
		name: 'Valkyrie Crescent',
		roleLabel: 'Exotic Singularity Interceptor',
		description:
			'Sweeping crescent-scythe aero-wings flanking a suspended singularity core and needle-lance forward fuselage.',
		dimensions: { width: 64, height: 64 },
		sockets: {
			cockpit: { x: 0, y: -5 },
			dorsal_cargo: [],
			wing_left: {
				x: -15,
				y: 0,
				mirrorX: false,
				hardpoint: { x: -8, y: -9 },
			},
			wing_right: {
				x: 15,
				y: 0,
				mirrorX: true,
				hardpoint: { x: 8, y: -9 },
			},
			thrusters: [
				{ x: -7, y: 23, scale: 0.9, type: 'cyan_ion' },
				{ x: 0, y: 25, scale: 1.2, type: 'violet_ring' },
				{ x: 7, y: 23, scale: 0.9, type: 'cyan_ion' },
			],
		},
	},
}

export const SHIP_CATALOG = SHIP_SOCKET_MANIFESTS

export const SHIP_SKINS: Record<ShipSkinId, ShipColorPalette> = {
	vanguard_cyan: SHIP_COLOR_PALETTES[0],
	solar_ember: SHIP_COLOR_PALETTES[1],
	terran_sage: SHIP_COLOR_PALETTES[2],
	nebula_violet: SHIP_COLOR_PALETTES[3],
	stealth_obsidian: SHIP_COLOR_PALETTES[4],
}

const DEFAULT_THRUSTER_BY_ARCHETYPE: Record<
	ShipArchetypeId,
	ThrusterPlumeType
> = {
	interceptor_vanguard_mk1: 'cyan_ion',
	striker_wraith_mk1: 'crimson_afterburner',
	science_helios_mk1: 'violet_ring',
	hauler_atlas_mk1: 'heavy_plasma',
	valkyrie_crescent_mk1: 'violet_ring',
}

const DEFAULT_SKIN_BY_ARCHETYPE: Record<ShipArchetypeId, ShipSkinId> = {
	interceptor_vanguard_mk1: 'vanguard_cyan',
	striker_wraith_mk1: 'solar_ember',
	science_helios_mk1: 'terran_sage',
	hauler_atlas_mk1: 'vanguard_cyan',
	valkyrie_crescent_mk1: 'nebula_violet',
}

export function resolveShipLoadout(
	partial?: Partial<ShipLoadoutConfig>,
	themeId?: StarPointsThemeId,
): ShipLoadoutConfig {
	const hullArchetype = isValidArchetypeId(partial?.hullArchetype)
		? partial.hullArchetype
		: 'interceptor_vanguard_mk1'
	const wingArchetype = hullArchetype
	const cockpitArchetype = hullArchetype
	const hardpointArchetype = hullArchetype

	const thrusterType = isValidThrusterType(partial?.thrusterType)
		? partial.thrusterType
		: DEFAULT_THRUSTER_BY_ARCHETYPE[hullArchetype]

	const activeTheme =
		themeId && isValidStarPointsThemeId(themeId)
			? STAR_POINTS_THEMES[themeId]
			: getActiveStarPointsTheme()

	const hasExplicitSkin =
		isValidSkinId(partial?.skinId) || isValidSkinId(partial?.palette?.id)

	const requestedSkinId =
		partial?.skinId ??
		(isValidSkinId(partial?.palette?.id) ? partial.palette.id : undefined) ??
		activeTheme.shipSkinId ??
		DEFAULT_SKIN_BY_ARCHETYPE[hullArchetype]

	const skinId: ShipSkinId = isValidSkinId(requestedSkinId)
		? requestedSkinId
		: DEFAULT_SKIN_BY_ARCHETYPE[hullArchetype]

	const matchedSkin = hasExplicitSkin
		? (SHIP_COLOR_PALETTES.find(candidate => candidate.id === skinId) ??
			activeTheme.shipPalette)
		: activeTheme.shipPalette

	const palette: ShipColorPalette = partial?.palette
		? {
				...matchedSkin,
				...partial.palette,
				id: skinId,
				primaryHullRed: sanitizeHexColor(
					partial.palette.primaryHullRed,
					matchedSkin.primaryHullRed,
				),
				secondaryTrimGreen: sanitizeHexColor(
					partial.palette.secondaryTrimGreen,
					matchedSkin.secondaryTrimGreen,
				),
				emissiveCockpitBlue: sanitizeHexColor(
					partial.palette.emissiveCockpitBlue,
					matchedSkin.emissiveCockpitBlue,
				),
				outlineDark: sanitizeHexColor(
					partial.palette.outlineDark,
					matchedSkin.outlineDark,
				),
			}
		: matchedSkin

	return {
		hullArchetype,
		wingArchetype,
		cockpitArchetype,
		hardpointArchetype,
		thrusterType,
		palette,
		skinId,
	}
}

export function assembleShipLayers(
	loadout: ShipLoadoutConfig,
	state: { recoilOffsetPx: number; thrusterFrame: number },
): AssembledShipLayer[] {
	const resolved = resolveShipLoadout(loadout)
	const manifest = SHIP_SOCKET_MANIFESTS[resolved.hullArchetype]
	const clampedRecoilOffset = clampNumber(state.recoilOffsetPx, 0, 6)
	const safeThrusterFrame =
		Math.abs(
			Math.trunc(
				Number.isFinite(state.thrusterFrame) ? state.thrusterFrame : 0,
			),
		) % 3
	const frameScaleBoost = 1 + safeThrusterFrame * 0.08

	const layers: AssembledShipLayer[] = []

	for (const thruster of manifest.sockets.thrusters) {
		layers.push({
			zIndex: 0,
			layerKey: 'thrusters',
			archetypeId: resolved.hullArchetype,
			offsetX: thruster.x,
			offsetY: thruster.y,
			mirrorX: false,
			scale: Number((thruster.scale * frameScaleBoost).toFixed(3)),
			blendMode: 'lighter',
		})
	}

	layers.push({
		zIndex: 1,
		layerKey: 'wings',
		archetypeId: resolved.hullArchetype,
		offsetX: manifest.sockets.wing_left.x,
		offsetY: manifest.sockets.wing_left.y,
		mirrorX: manifest.sockets.wing_left.mirrorX,
		scale: 1,
		blendMode: 'source-over',
	})

	layers.push({
		zIndex: 1,
		layerKey: 'wings',
		archetypeId: resolved.hullArchetype,
		offsetX: manifest.sockets.wing_right.x,
		offsetY: manifest.sockets.wing_right.y,
		mirrorX: manifest.sockets.wing_right.mirrorX,
		scale: 1,
		blendMode: 'source-over',
	})

	layers.push({
		zIndex: 2,
		layerKey: 'hardpoints',
		archetypeId: resolved.hullArchetype,
		offsetX:
			manifest.sockets.wing_left.x + manifest.sockets.wing_left.hardpoint.x,
		offsetY:
			manifest.sockets.wing_left.y +
			manifest.sockets.wing_left.hardpoint.y +
			clampedRecoilOffset,
		mirrorX: false,
		scale: 1,
		blendMode: 'source-over',
	})

	layers.push({
		zIndex: 2,
		layerKey: 'hardpoints',
		archetypeId: resolved.hullArchetype,
		offsetX:
			manifest.sockets.wing_right.x + manifest.sockets.wing_right.hardpoint.x,
		offsetY:
			manifest.sockets.wing_right.y +
			manifest.sockets.wing_right.hardpoint.y +
			clampedRecoilOffset,
		mirrorX: true,
		scale: 1,
		blendMode: 'source-over',
	})

	layers.push({
		zIndex: 3,
		layerKey: 'hull',
		archetypeId: resolved.hullArchetype,
		offsetX: 0,
		offsetY: 0,
		mirrorX: false,
		scale: 1,
		blendMode: 'source-over',
	})

	layers.push({
		zIndex: 4,
		layerKey: 'cockpit_and_dorsal',
		archetypeId: resolved.hullArchetype,
		offsetX: manifest.sockets.cockpit.x,
		offsetY: manifest.sockets.cockpit.y,
		mirrorX: false,
		scale: 1,
		blendMode: 'source-over',
	})

	return layers.sort((first, second) => first.zIndex - second.zIndex)
}

export function applyRgbMaskPalette(
	maskGrid: number[][],
	palette: ShipColorPalette,
): (string | null)[][] {
	const safeOutline = sanitizeHexColor(palette?.outlineDark, '#09090b')
	const safePrimary = sanitizeHexColor(palette?.primaryHullRed, '#dbeafe')
	const safeSecondary = sanitizeHexColor(palette?.secondaryTrimGreen, '#f97316')
	const safeEmissive = sanitizeHexColor(palette?.emissiveCockpitBlue, '#38bdf8')

	return maskGrid.map(row =>
		row.map(channelValue => {
			switch (channelValue) {
				case 1:
					return safeOutline
				case 2:
					return safePrimary
				case 3:
					return safeSecondary
				case 4:
					return safeEmissive
				case 5:
					return '#ffffff'
				default:
					return null
			}
		}),
	)
}

export function bakeStarshipBitmap(
	loadout: Partial<ShipLoadoutConfig>,
	options?: {
		recoilOffsetPx?: number
		thrusterFrame?: number
		thrusterActive?: boolean
		enableDithering?: boolean
		themeId?: StarPointsThemeId
	},
): BakedStarshipBitmap {
	const resolved = resolveShipLoadout(loadout, options?.themeId)
	const safeRecoil = Math.round(clampNumber(options?.recoilOffsetPx ?? 0, 0, 6))
	const safeFrame =
		Math.abs(
			Math.trunc(
				Number.isFinite(options?.thrusterFrame)
					? (options?.thrusterFrame as number)
					: 0,
			),
		) % 3
	const thrusterActive = options?.thrusterActive ?? true
	const enableDithering = options?.enableDithering ?? true

	const cacheKey = [
		resolved.hullArchetype,
		resolved.palette.outlineDark,
		resolved.palette.hullPrimary,
		resolved.palette.hullSecondary,
		resolved.palette.hullHighlight,
		resolved.palette.accentStripe,
		resolved.palette.cockpitGlow,
		resolved.palette.thrusterPlume,
		safeRecoil,
		thrusterActive ? safeFrame : 'off',
		enableDithering ? 'dither' : 'smooth',
	].join(':')

	const cached = starshipBitmapCache.get(cacheKey)
	if (cached) {
		starshipBitmapCache.delete(cacheKey)
		starshipBitmapCache.set(cacheKey, cached)
		return cached
	}

	const pixelBuffer = renderStarshipPixelBuffer({
		archetypeId: resolved.hullArchetype,
		palette: resolved.palette,
		recoilOffsetPx: safeRecoil,
		thrusterFrame: safeFrame,
		thrusterActive,
		enableDithering,
	})

	const canvas = createCanvasFromPixelBuffer(
		pixelBuffer,
		STARSHIP_BITMAP_RESOLUTION,
	)

	const entry: BakedStarshipBitmap = {
		cacheKey,
		pixelBuffer,
		canvas,
	}

	if (starshipBitmapCache.size >= MAX_STARSHIP_CACHE_ENTRIES) {
		const oldestKey = starshipBitmapCache.keys().next().value
		if (oldestKey) {
			starshipBitmapCache.delete(oldestKey)
		}
	}
	starshipBitmapCache.set(cacheKey, entry)

	return entry
}

export function paintModularShipToContext({
	context,
	loadout,
	recoilOffsetPx = 0,
	thrusterFrame = 0,
	thrusterActive = true,
}: {
	context: CanvasRenderingContext2D
	loadout: ShipLoadoutConfig
	recoilOffsetPx?: number
	thrusterFrame?: number
	thrusterActive?: boolean
	explodedLayerSpacingPx?: number
}): void {
	const resolvedLoadout = resolveShipLoadout(loadout)
	const baked = bakeStarshipBitmap(resolvedLoadout, {
		recoilOffsetPx,
		thrusterFrame,
		thrusterActive,
		enableDithering: true,
	})

	if (thrusterActive) {
		const glowBitmap = getAdditiveGlowBitmap(
			resolvedLoadout.palette.thrusterPlume,
			64,
		)
		if (glowBitmap) {
			context.save()
			context.globalCompositeOperation = 'lighter'
			context.drawImage(glowBitmap, 8, 22, 48, 42)
			context.restore()
		}
	}

	if (baked.canvas) {
		context.drawImage(baked.canvas, 0, 0, 64, 64)
	}
}

interface ParsedShipShaderPalette {
	outlineRgb: [number, number, number]
	deepHullRgb: [number, number, number]
	hullPrimaryRgb: [number, number, number]
	hullSecondaryRgb: [number, number, number]
	hullHighlightRgb: [number, number, number]
	specularWhiteRgb: [number, number, number]
	accentShadowRgb: [number, number, number]
	accentMidRgb: [number, number, number]
	accentBrightRgb: [number, number, number]
	canopyDeepRgb: [number, number, number]
	canopyMidRgb: [number, number, number]
	canopyBrightRgb: [number, number, number]
	plumeDeepRgb: [number, number, number]
	plumeMidRgb: [number, number, number]
	plumeCoreRgb: [number, number, number]
}

type ShipMaterialKind =
	| 'hull_base'
	| 'armor_plate'
	| 'accent_livery'
	| 'canopy_glass'
	| 'dark_trench'
	| 'weapon_metal'
	| 'weapon_muzzle'
	| 'engine_nozzle'
	| 'energy_core'
	| 'singularity_void'

interface ShipSurfaceSample {
	material: ShipMaterialKind
	nx: number
	ny: number
	nz: number
	borderDistance: number
	isPanelSeam: boolean
	emissiveBoost?: number
}

function renderStarshipPixelBuffer({
	archetypeId,
	palette,
	recoilOffsetPx,
	thrusterFrame,
	thrusterActive,
	enableDithering,
}: {
	archetypeId: ShipArchetypeId
	palette: ShipColorPalette
	recoilOffsetPx: number
	thrusterFrame: number
	thrusterActive: boolean
	enableDithering: boolean
}): Uint8ClampedArray {
	const resolution = STARSHIP_BITMAP_RESOLUTION
	const buffer = new Uint8ClampedArray(resolution * resolution * 4)
	const center = (resolution - 1) / 2
	const recoilScaled = recoilOffsetPx * 1.8
	const shaderPalette = buildParsedShipShaderPalette(palette)
	const seedNumber = getArchetypeSeed(archetypeId)

	for (let pixelY = 0; pixelY < resolution; pixelY++) {
		for (let pixelX = 0; pixelX < resolution; pixelX++) {
			const x = pixelX - center
			const y = pixelY - center
			const ditherX = Math.floor(pixelX / 2)
			const ditherY = Math.floor(pixelY / 2)

			const surfaceSample = sampleStarshipArchetypeSurface({
				archetypeId,
				x,
				y,
				recoilScaled,
			})

			if (surfaceSample) {
				const rgb = shadeStarshipSurfaceSample({
					sample: surfaceSample,
					shaderPalette,
					x,
					y,
					ditherX,
					ditherY,
					enableDithering,
					seedNumber,
				})
				writePixel(buffer, pixelX, pixelY, resolution, rgb, 255)
				continue
			}

			if (thrusterActive) {
				const plumePixel = sampleStarshipThrusterPlume({
					archetypeId,
					x,
					y,
					thrusterFrame,
					shaderPalette,
					ditherX,
					ditherY,
					enableDithering,
					seedNumber,
				})
				if (plumePixel) {
					writePixel(
						buffer,
						pixelX,
						pixelY,
						resolution,
						plumePixel.rgb,
						plumePixel.alpha,
					)
				}
			}
		}
	}

	return buffer
}

function sampleStarshipArchetypeSurface({
	archetypeId,
	x,
	y,
	recoilScaled,
}: {
	archetypeId: ShipArchetypeId
	x: number
	y: number
	recoilScaled: number
}): ShipSurfaceSample | null {
	switch (archetypeId) {
		case 'interceptor_vanguard_mk1':
			return sampleVanguardInterceptorSurface(x, y, recoilScaled)
		case 'striker_wraith_mk1':
			return samplePhantomStealthSurface(x, y, recoilScaled)
		case 'science_helios_mk1':
			return sampleHeliosExplorerSurface(x, y, recoilScaled)
		case 'hauler_atlas_mk1':
			return sampleAtlasCruiserSurface(x, y, recoilScaled)
		case 'valkyrie_crescent_mk1':
			return sampleValkyrieCrescentSurface(x, y, recoilScaled)
	}
}

function sampleVanguardInterceptorSurface(
	x: number,
	y: number,
	recoilScaled: number,
): ShipSurfaceSample | null {
	const absX = Math.abs(x)
	const signX = x < 0 ? -1 : 1

	const canopyRx = 6.2
	const canopyRy = 15.5
	const canopyY = y + 7
	const canopyNorm =
		(absX * absX) / (canopyRx * canopyRx) +
		(canopyY * canopyY) / (canopyRy * canopyRy)
	if (canopyNorm <= 1) {
		const nz = Math.sqrt(Math.max(0.1, 1 - canopyNorm * 0.85))
		return {
			material: 'canopy_glass',
			nx: (x / canopyRx) * 0.75,
			ny: (canopyY / canopyRy) * 0.65,
			nz,
			borderDistance: (1 - Math.sqrt(canopyNorm)) * canopyRx,
			isPanelSeam:
				Math.abs(canopyY + 3) < 0.7 || Math.abs(canopyY - 6) < 0.7,
		}
	}

	const cannonCenterX = 26.5
	const cannonHalfW = 2.6
	const cannonTopY = -25 + recoilScaled
	const cannonBottomY = -3 + recoilScaled
	if (
		absX >= cannonCenterX - cannonHalfW &&
		absX <= cannonCenterX + cannonHalfW &&
		y >= cannonTopY &&
		y <= cannonBottomY
	) {
		const localX = (absX - cannonCenterX) / cannonHalfW
		const borderDist = Math.min(
			cannonHalfW - Math.abs(absX - cannonCenterX),
			y - cannonTopY,
			cannonBottomY - y,
		)
		const isMuzzle = y < cannonTopY + 3.8
		return {
			material: isMuzzle ? 'weapon_muzzle' : 'weapon_metal',
			nx: signX * localX * 0.7,
			ny: isMuzzle ? -0.6 : -0.15,
			nz: Math.sqrt(Math.max(0.15, 1 - localX * localX * 0.5)),
			borderDistance: borderDist,
			isPanelSeam: Math.abs(y - (cannonTopY + 7)) < 0.7,
		}
	}

	if (y >= 28 && y <= 36 && absX >= 6 && absX <= 15.5) {
		const nozzleCenter = 10.75
		const localX = (absX - nozzleCenter) / 4.75
		const borderDist = Math.min(
			4.75 - Math.abs(absX - nozzleCenter),
			36 - y,
			y - 28,
		)
		const isExhaustLip = y > 33.5 && Math.abs(localX) < 0.68
		return {
			material: isExhaustLip ? 'energy_core' : 'engine_nozzle',
			nx: signX * localX * 0.75,
			ny: 0.35,
			nz: Math.sqrt(Math.max(0.2, 1 - localX * localX * 0.55)),
			borderDistance: borderDist,
			isPanelSeam: Math.abs(y - 31) < 0.7,
		}
	}

	if (y < -52 || y > 34) return null

	let maxSpan = 0
	if (y < -18) {
		maxSpan = 1.5 + ((y + 52) / 34) * 10.5
	} else if (y < 14) {
		maxSpan = 12 + ((y + 18) / 32) * 37
	} else if (y < 24) {
		maxSpan = 49 - ((y - 14) / 10) * 4
	} else {
		maxSpan = 21 - ((y - 24) / 10) * 5
	}

	let rearCutout = false
	if (y > 20 && absX > 16.5 && absX < 38) {
		const notchDepth = (y - 20) * 1.9
		if (absX > 36 - notchDepth && absX < 16.5 + notchDepth * 1.2) {
			rearCutout = true
		}
	}
	if (y > 25 && absX < 5.5) {
		rearCutout = true
	}
	if (rearCutout || absX > maxSpan) return null

	const borderDist = Math.min(maxSpan - absX, y + 52, 34 - y)

	const spineWidth =
		y < -14
			? 1.5 + ((y + 52) / 38) * 9.5
			: Math.max(5.5, 11.5 - Math.max(0, y - 10) * 0.22)

	if (absX <= spineWidth) {
		const nx = (x / Math.max(2, spineWidth)) * 0.68
		const ny = y < -15 ? -0.38 : 0.1
		const nz = Math.sqrt(Math.max(0.18, 1 - nx * nx - ny * ny))
		const isSeam =
			Math.abs(absX - spineWidth) < 1.1 ||
			Math.abs(y + 26) < 0.75 ||
			Math.abs(y - 14) < 0.75 ||
			(absX < 0.8 && y < -22)

		return {
			material: 'armor_plate',
			nx,
			ny,
			nz,
			borderDistance: borderDist,
			isPanelSeam: isSeam,
		}
	}

	if (absX >= 6 && absX <= 16.5 && y >= 8 && y <= 29) {
		const nacelleCenter = 11.2
		const localNx = ((absX - nacelleCenter) / 5.3) * signX * 0.7
		const nz = Math.sqrt(Math.max(0.2, 1 - localNx * localNx))
		return {
			material: 'armor_plate',
			nx: localNx,
			ny: 0.08,
			nz,
			borderDistance: borderDist,
			isPanelSeam:
				Math.abs(absX - 16.2) < 0.9 || Math.abs(y - 18) < 0.75,
		}
	}

	const chevronBand = y - absX * 0.58
	const isAccentStripe =
		chevronBand >= -9.5 &&
		chevronBand <= -2.2 &&
		absX >= spineWidth + 2 &&
		absX <= maxSpan - 3.5

	const isWingtipFin = absX > 41.5 && y >= 6 && y <= 24
	const wingSlopeNx = signX * (0.28 + (absX / 50) * 0.35)
	const wingSlopeNy = y < 8 ? -0.32 : 0.22
	const wingNz = Math.sqrt(
		Math.max(0.2, 1 - wingSlopeNx * wingSlopeNx - wingSlopeNy * wingSlopeNy),
	)

	const isWingSeam =
		Math.abs(chevronBand + 9.5) < 0.75 ||
		Math.abs(chevronBand + 2.2) < 0.75 ||
		Math.abs(absX - 26.5) < 0.75 ||
		Math.abs(absX - 41.5) < 0.85

	return {
		material: isAccentStripe
			? 'accent_livery'
			: isWingtipFin
				? 'armor_plate'
				: 'hull_base',
		nx: isWingtipFin ? signX * 0.65 : wingSlopeNx,
		ny: wingSlopeNy,
		nz: wingNz,
		borderDistance: borderDist,
		isPanelSeam: isWingSeam,
	}
}

function samplePhantomStealthSurface(
	x: number,
	y: number,
	recoilScaled: number,
): ShipSurfaceSample | null {
	const absX = Math.abs(x)
	const signX = x < 0 ? -1 : 1

	if (y >= -18 && y <= 8 && absX <= 6.8) {
		const visorV = y + absX * 1.35
		if (visorV >= -14 && visorV <= 11) {
			const isCoreSlit =
				Math.abs(visorV + 4) < 2.2 || (absX < 1.3 && y >= -40 && y <= 22)
			return {
				material: 'canopy_glass',
				nx: signX * (absX > 2 ? 0.52 : 0.15),
				ny: visorV < -2 ? -0.45 : 0.25,
				nz: 0.78,
				borderDistance: Math.min(6.8 - absX, 11 - visorV, visorV + 14),
				isPanelSeam: Math.abs(visorV - 2) < 0.75,
				emissiveBoost: isCoreSlit ? 0.35 : 0,
			}
		}
	}

	if (absX < 1.4 && y >= -44 && y <= 22) {
		return {
			material: 'energy_core',
			nx: 0,
			ny: -0.2,
			nz: 0.95,
			borderDistance: 3,
			isPanelSeam: false,
		}
	}

	const lanceCenterX = 18.5
	const lanceTopY = -36 + recoilScaled
	const lanceBottomY = -10 + recoilScaled
	if (
		absX >= lanceCenterX - 2.3 &&
		absX <= lanceCenterX + 2.3 &&
		y >= lanceTopY &&
		y <= lanceBottomY
	) {
		const borderDist = Math.min(
			2.3 - Math.abs(absX - lanceCenterX),
			y - lanceTopY,
			lanceBottomY - y,
		)
		return {
			material: y < lanceTopY + 4 ? 'weapon_muzzle' : 'weapon_metal',
			nx: signX * ((absX - lanceCenterX) / 2.3) * 0.65,
			ny: -0.35,
			nz: 0.72,
			borderDistance: borderDist,
			isPanelSeam: false,
		}
	}

	if (y < -54 || y > 35) return null

	let maxSpan = 0
	let minSpan = 0
	if (y < -32) {
		maxSpan = 1.2 + ((y + 54) / 22) * 9.5
	} else if (y < -18) {
		maxSpan = 10.7 + ((y + 32) / 14) * 14
	} else if (y < -8) {
		maxSpan = 15 + ((y + 18) / 10) * 24
	} else if (y < 14) {
		maxSpan = 39 + ((y + 8) / 22) * 11
	} else {
		maxSpan = 50 - ((y - 14) / 21) * 16
	}

	if (y > 16) {
		if (absX > 15 && absX < 34) {
			const wCut = (y - 16) * 1.45
			if (absX > 25 - wCut && absX < 25 + wCut) {
				return null
			}
		}
		if (y > 24 && absX < 5) {
			minSpan = (y - 24) * 0.65
		}
	}

	if (absX < minSpan || absX > maxSpan) return null
	const borderDist = Math.min(maxSpan - absX, absX - minSpan, y + 54, 35 - y)

	if (y >= 26 && absX >= 6 && absX <= 15) {
		return {
			material: y > 31 ? 'energy_core' : 'engine_nozzle',
			nx: signX * 0.45,
			ny: 0.4,
			nz: 0.78,
			borderDistance: borderDist,
			isPanelSeam: Math.abs(y - 28.5) < 0.75,
		}
	}

	const facetA = y + absX * 0.72
	const facetB = y - absX * 0.65
	const isFacetSeam =
		Math.abs(facetA + 12) < 0.8 ||
		Math.abs(facetA - 8) < 0.8 ||
		Math.abs(facetB + 6) < 0.8 ||
		Math.abs(absX - 14) < 0.85 ||
		Math.abs(absX - 31) < 0.85

	const isStealthTrim =
		(facetB >= -6 && facetB <= 1.5 && absX >= 14 && absX <= 42) ||
		(absX >= maxSpan - 5 && absX <= maxSpan - 1.8 && y >= -6 && y <= 20)

	let facetNx = signX * 0.42
	let facetNy = -0.25
	if (absX < 14) {
		facetNx = signX * 0.26
		facetNy = facetA < -12 ? -0.48 : 0.12
	} else if (absX < 31) {
		facetNx = signX * (facetB < -6 ? 0.18 : 0.58)
		facetNy = facetB < -6 ? -0.45 : 0.28
	} else {
		facetNx = signX * 0.68
		facetNy = y < 6 ? -0.38 : 0.32
	}
	const facetNz = Math.sqrt(
		Math.max(0.18, 1 - facetNx * facetNx - facetNy * facetNy),
	)

	return {
		material: isStealthTrim
			? 'accent_livery'
			: absX < 14
				? 'armor_plate'
				: 'hull_base',
		nx: facetNx,
		ny: facetNy,
		nz: facetNz,
		borderDistance: borderDist,
		isPanelSeam: isFacetSeam,
	}
}

function sampleHeliosExplorerSurface(
	x: number,
	y: number,
	recoilScaled: number,
): ShipSurfaceSample | null {
	const absX = Math.abs(x)
	const signX = x < 0 ? -1 : 1

	const saucerCenterY = -9
	const dySaucer = y - saucerCenterY
	const distSaucer = Math.hypot(x, dySaucer)

	const lanceTopY = -51 + recoilScaled
	const lanceBottomY = -36 + recoilScaled
	if (
		absX >= 7.5 &&
		absX <= 12.5 &&
		y >= lanceTopY &&
		y <= lanceBottomY
	) {
		const localX = (absX - 10) / 2.5
		const borderDist = Math.min(
			2.5 - Math.abs(absX - 10),
			y - lanceTopY,
			lanceBottomY - y,
		)
		return {
			material: y < lanceTopY + 4.5 ? 'weapon_muzzle' : 'weapon_metal',
			nx: signX * localX * 0.65,
			ny: -0.35,
			nz: 0.75,
			borderDistance: borderDist,
			isPanelSeam: Math.abs(y - (lanceTopY + 7)) < 0.7,
		}
	}

	if (distSaucer <= 34.5) {
		const isFrontNotch =
			dySaucer < -22 && absX < 5.2 && distSaucer > 24
		if (!isFrontNotch) {
			const borderDist = 34.5 - distSaucer
			if (distSaucer <= 11.2) {
				const domeNorm = distSaucer / 11.2
				const nz = Math.sqrt(Math.max(0.15, 1 - domeNorm * domeNorm * 0.85))
				return {
					material: 'canopy_glass',
					nx: (x / 11.2) * 0.78,
					ny: (dySaucer / 11.2) * 0.78,
					nz,
					borderDistance: 11.2 - distSaucer,
					isPanelSeam: Math.abs(distSaucer - 6.5) < 0.65,
				}
			}

			if (distSaucer >= 14.5 && distSaucer <= 20.2) {
				const angle = Math.atan2(dySaucer, x)
				const strutMod = Math.abs(Math.sin(angle * 4))
				if (strutMod < 0.18) {
					return {
						material: 'weapon_metal',
						nx: (x / distSaucer) * 0.35,
						ny: (dySaucer / distSaucer) * 0.35,
						nz: 0.88,
						borderDistance: 2.5,
						isPanelSeam: false,
					}
				}
				const ringPos = (distSaucer - 17.35) / 2.85
				return {
					material: 'energy_core',
					nx: (x / distSaucer) * ringPos * 0.6,
					ny: (dySaucer / distSaucer) * ringPos * 0.6,
					nz: Math.sqrt(Math.max(0.2, 1 - ringPos * ringPos * 0.7)),
					borderDistance: 2.85 - Math.abs(distSaucer - 17.35),
					isPanelSeam: false,
					emissiveBoost: 0.3,
				}
			}

			const saucerNx = (x / 34.5) * 0.62
			const saucerNy = (dySaucer / 34.5) * 0.62
			const saucerNz = Math.sqrt(
				Math.max(0.2, 1 - saucerNx * saucerNx - saucerNy * saucerNy),
			)
			const isAccentRing = distSaucer >= 26.5 && distSaucer <= 30.2
			const radialAngle = Math.atan2(dySaucer, absX)
			const isRadialSeam =
				Math.abs(Math.sin(radialAngle * 4)) < 0.045 ||
				Math.abs(distSaucer - 26.5) < 0.7 ||
				Math.abs(distSaucer - 30.2) < 0.7

			return {
				material: isAccentRing
					? 'accent_livery'
					: distSaucer < 26.5
						? 'armor_plate'
						: 'hull_base',
				nx: saucerNx,
				ny: saucerNy,
				nz: saucerNz,
				borderDistance: borderDist,
				isPanelSeam: isRadialSeam,
			}
		}
	}

	const nacelleCenterX = 35
	const nacelleHalfW = 5.4
	if (
		absX >= nacelleCenterX - nacelleHalfW &&
		absX <= nacelleCenterX + nacelleHalfW &&
		y >= -10 &&
		y <= 38
	) {
		const localX = (absX - nacelleCenterX) / nacelleHalfW
		const borderDist = Math.min(
			nacelleHalfW - Math.abs(absX - nacelleCenterX),
			y + 10,
			38 - y,
		)
		const isBussardDome = y < -3.5
		const isWarpGrille =
			y >= 0 && y <= 30 && Math.abs(localX) < 0.45
		const isRearNozzle = y > 33

		return {
			material: isBussardDome
				? 'accent_livery'
				: isWarpGrille || isRearNozzle
					? 'energy_core'
					: 'armor_plate',
			nx: signX * localX * 0.78,
			ny: isBussardDome ? -0.55 : isRearNozzle ? 0.45 : 0,
			nz: Math.sqrt(Math.max(0.18, 1 - localX * localX * 0.7)),
			borderDistance: borderDist,
			isPanelSeam:
				Math.abs(y + 3.5) < 0.75 ||
				Math.abs(y - 15) < 0.75 ||
				Math.abs(y - 33) < 0.75,
		}
	}

	if (y >= 8 && y <= 23 && absX >= 8 && absX <= 30) {
		const pylonCenterY = 12 + (absX - 8) * 0.25
		if (Math.abs(y - pylonCenterY) <= 4.2) {
			const borderDist = 4.2 - Math.abs(y - pylonCenterY)
			return {
				material: 'hull_base',
				nx: signX * 0.25,
				ny: (y - pylonCenterY) / 4.2 * 0.55,
				nz: 0.78,
				borderDistance: borderDist,
				isPanelSeam: Math.abs(absX - 20) < 0.8,
			}
		}
	}

	if (y >= 18 && y <= 34 && absX <= 9.5) {
		const borderDist = Math.min(9.5 - absX, 34 - y)
		const isImpulseNozzle = y > 29.5
		return {
			material: isImpulseNozzle ? 'engine_nozzle' : 'armor_plate',
			nx: (x / 9.5) * 0.65,
			ny: isImpulseNozzle ? 0.4 : 0.1,
			nz: Math.sqrt(Math.max(0.2, 1 - (x / 9.5) * (x / 9.5) * 0.5)),
			borderDistance: borderDist,
			isPanelSeam: Math.abs(y - 29.5) < 0.75,
		}
	}

	return null
}

function sampleAtlasCruiserSurface(
	x: number,
	y: number,
	recoilScaled: number,
): ShipSurfaceSample | null {
	const absX = Math.abs(x)
	const signX = x < 0 ? -1 : 1

	const innerTurretX = 16.5
	const innerTurretTop = -55 + recoilScaled
	const innerTurretBottom = -42 + recoilScaled
	if (
		absX >= innerTurretX - 2.6 &&
		absX <= innerTurretX + 2.6 &&
		y >= innerTurretTop &&
		y <= innerTurretBottom
	) {
		const borderDist = Math.min(
			2.6 - Math.abs(absX - innerTurretX),
			y - innerTurretTop,
			innerTurretBottom - y,
		)
		return {
			material: y < innerTurretTop + 4 ? 'weapon_muzzle' : 'weapon_metal',
			nx: signX * ((absX - innerTurretX) / 2.6) * 0.65,
			ny: -0.35,
			nz: 0.75,
			borderDistance: borderDist,
			isPanelSeam: false,
		}
	}

	const outerTurretX = 34.5
	const outerTurretTop = -29 + recoilScaled
	const outerTurretBottom = -15 + recoilScaled
	if (
		absX >= outerTurretX - 2.6 &&
		absX <= outerTurretX + 2.6 &&
		y >= outerTurretTop &&
		y <= outerTurretBottom
	) {
		const borderDist = Math.min(
			2.6 - Math.abs(absX - outerTurretX),
			y - outerTurretTop,
			outerTurretBottom - y,
		)
		return {
			material: y < outerTurretTop + 4 ? 'weapon_muzzle' : 'weapon_metal',
			nx: signX * ((absX - outerTurretX) / 2.6) * 0.65,
			ny: -0.35,
			nz: 0.75,
			borderDistance: borderDist,
			isPanelSeam: false,
		}
	}

	const podCentersY = [-8, 6]
	for (const podY of podCentersY) {
		const dxPod = absX - 15.5
		const dyPod = y - podY
		const distPod = Math.hypot(dxPod, dyPod)
		if (distPod <= 5.8) {
			const podNorm = distPod / 5.8
			const nz = Math.sqrt(Math.max(0.18, 1 - podNorm * podNorm * 0.82))
			return {
				material: distPod < 2.2 ? 'accent_livery' : 'armor_plate',
				nx: ((x - signX * 15.5) / 5.8) * 0.78,
				ny: (dyPod / 5.8) * 0.78,
				nz,
				borderDistance: 5.8 - distPod,
				isPanelSeam: Math.abs(distPod - 4.2) < 0.65,
			}
		}
	}

	if (y >= 14 && y <= 27 && absX <= 12) {
		const borderDist = Math.min(12 - absX, y - 14, 27 - y)
		const isViewport = y >= 16.5 && y <= 20.5 && absX <= 8.5
		if (isViewport) {
			return {
				material: 'canopy_glass',
				nx: (x / 8.5) * 0.55,
				ny: -0.45,
				nz: 0.78,
				borderDistance: Math.min(8.5 - absX, 20.5 - y, y - 16.5),
				isPanelSeam: Math.abs(absX - 4.2) < 0.65,
			}
		}
		return {
			material: 'armor_plate',
			nx: (x / 12) * 0.62,
			ny: y < 17 ? -0.45 : 0.25,
			nz: 0.75,
			borderDistance: borderDist,
			isPanelSeam: Math.abs(y - 23) < 0.75,
		}
	}

	if (y < -48 || y > 36) return null

	let maxSpan = 0
	if (y < -36) {
		maxSpan = 20 + ((y + 48) / 12) * 5
	} else if (y < -18) {
		maxSpan = 25 + ((y + 36) / 18) * 18
	} else if (y < 20) {
		maxSpan = 46
	} else {
		maxSpan = 46 - ((y - 20) / 16) * 14
	}

	if (absX > maxSpan) return null

	if (y < -40 && absX < 8.5) {
		return null
	}

	const borderDist = Math.min(
		maxSpan - absX,
		y < -40 ? absX - 8.5 : 99,
		y + 48,
		36 - y,
	)

	if (y >= -40 && y <= 10 && absX <= 7.8) {
		const isRunwayChevron =
			absX < 3.2 && Math.abs(((y + 48) % 9) - 4.5) < 1.6
		return {
			material: isRunwayChevron ? 'energy_core' : 'dark_trench',
			nx: (x / 7.8) * 0.35,
			ny: 0.15,
			nz: 0.9,
			borderDistance: borderDist,
			isPanelSeam: Math.abs(absX - 7.2) < 0.8,
		}
	}

	if (y >= 30) {
		const isEngineBank =
			absX <= 6.5 || (absX >= 15 && absX <= 26.5)
		if (isEngineBank) {
			return {
				material: y > 33.5 ? 'energy_core' : 'engine_nozzle',
				nx: signX * 0.35,
				ny: 0.45,
				nz: 0.8,
				borderDistance: borderDist,
				isPanelSeam: Math.abs(y - 32) < 0.75,
			}
		}
	}

	const isShoulderStripe =
		absX >= 31 && absX <= 41 && y >= -12 && y <= 16
	const isMandibleDeck = absX >= 8 && absX <= 24 && y < 14
	const isArmorSeam =
		Math.abs(absX - 24) < 0.85 ||
		Math.abs(absX - 31) < 0.8 ||
		Math.abs(y + 24) < 0.75 ||
		Math.abs(y + 1) < 0.75 ||
		Math.abs(y - 14) < 0.75

	const hullNx = isMandibleDeck
		? signX * ((absX - 16) / 10) * 0.55
		: signX * (0.35 + ((absX - 24) / 22) * 0.4)
	const hullNy = y < -18 ? -0.35 : y > 20 ? 0.32 : 0.05
	const hullNz = Math.sqrt(
		Math.max(0.2, 1 - hullNx * hullNx - hullNy * hullNy),
	)

	return {
		material: isShoulderStripe
			? 'accent_livery'
			: isMandibleDeck
				? 'armor_plate'
				: 'hull_base',
		nx: hullNx,
		ny: hullNy,
		nz: hullNz,
		borderDistance: borderDist,
		isPanelSeam: isArmorSeam,
	}
}

function sampleValkyrieCrescentSurface(
	x: number,
	y: number,
	recoilScaled: number,
): ShipSurfaceSample | null {
	const absX = Math.abs(x)
	const signX = x < 0 ? -1 : 1

	const coreCenterY = 19
	const distCore = Math.hypot(x, y - coreCenterY)
	if (distCore <= 9.6) {
		if (distCore <= 4.3) {
			return {
				material: 'singularity_void',
				nx: 0,
				ny: 0,
				nz: 1,
				borderDistance: 4.3 - distCore,
				isPanelSeam: false,
			}
		}
		const ringNorm = (distCore - 4.3) / 5.3
		return {
			material: 'energy_core',
			nx: (x / distCore) * 0.5,
			ny: ((y - coreCenterY) / distCore) * 0.5,
			nz: Math.sqrt(Math.max(0.25, 1 - ringNorm * 0.6)),
			borderDistance: 9.6 - distCore,
			isPanelSeam: false,
			emissiveBoost: distCore < 6.4 ? 0.55 : 0.15,
		}
	}

	const canopyRx = 5.4
	const canopyRy = 14
	const canopyY = y + 11
	const canopyNorm =
		(absX * absX) / (canopyRx * canopyRx) +
		(canopyY * canopyY) / (canopyRy * canopyRy)
	if (canopyNorm <= 1) {
		const nz = Math.sqrt(Math.max(0.15, 1 - canopyNorm * 0.82))
		return {
			material: 'canopy_glass',
			nx: (x / canopyRx) * 0.72,
			ny: (canopyY / canopyRy) * 0.68,
			nz,
			borderDistance: (1 - Math.sqrt(canopyNorm)) * canopyRx,
			isPanelSeam: Math.abs(canopyY) < 0.7,
		}
	}

	const lanceX = 28
	const lanceTopY = -20 + recoilScaled
	const lanceBottomY = -3 + recoilScaled
	if (
		absX >= lanceX - 2.3 &&
		absX <= lanceX + 2.3 &&
		y >= lanceTopY &&
		y <= lanceBottomY
	) {
		const borderDist = Math.min(
			2.3 - Math.abs(absX - lanceX),
			y - lanceTopY,
			lanceBottomY - y,
		)
		return {
			material: y < lanceTopY + 4 ? 'weapon_muzzle' : 'weapon_metal',
			nx: signX * ((absX - lanceX) / 2.3) * 0.65,
			ny: -0.4,
			nz: 0.72,
			borderDistance: borderDist,
			isPanelSeam: false,
		}
	}

	if (y >= -54 && y <= 8) {
		const fusWidth =
			y < -20
				? 1.2 + ((y + 54) / 34) * 8.2
				: 9.4 - ((y + 20) / 28) * 2.2
		if (absX <= fusWidth) {
			const borderDist = Math.min(fusWidth - absX, y + 54)
			const nx = (x / Math.max(2, fusWidth)) * 0.72
			const ny = y < -24 ? -0.38 : 0.1
			const nz = Math.sqrt(Math.max(0.2, 1 - nx * nx - ny * ny))
			return {
				material: 'armor_plate',
				nx,
				ny,
				nz,
				borderDistance: borderDist,
				isPanelSeam:
					Math.abs(y + 30) < 0.75 || (absX < 0.8 && y < -28),
			}
		}
	}

	if (y >= 4 && y <= 33 && absX >= 10.2 && absX <= 17.5) {
		const prongCenter = 13.8 + (y - 18) * 0.08
		const halfW = 3.4 - Math.max(0, y - 22) * 0.12
		if (Math.abs(absX - prongCenter) <= halfW) {
			const borderDist = Math.min(
				halfW - Math.abs(absX - prongCenter),
				33 - y,
			)
			const localNx = ((absX - prongCenter) / halfW) * signX * 0.7
			return {
				material: y > 29.5 ? 'engine_nozzle' : 'armor_plate',
				nx: localNx,
				ny: 0.25,
				nz: Math.sqrt(Math.max(0.2, 1 - localNx * localNx)),
				borderDistance: borderDist,
				isPanelSeam: Math.abs(y - 18) < 0.75,
			}
		}
	}

	if (absX >= 6 && absX <= 50) {
		const leadY = -28 + 0.022 * absX * absX
		const trailY =
			absX < 18
				? 10 + (absX - 6) * 0.35
				: -6 + 0.024 * absX * absX
		if (y >= leadY && y <= trailY) {
			const wingChord = Math.max(2, trailY - leadY)
			const chordPos = (y - leadY) / wingChord
			const borderDist = Math.min(y - leadY, trailY - y, 50 - absX)
			const isCrescentStripe = chordPos >= 0.32 && chordPos <= 0.56
			const isInnerArmor = chordPos < 0.32 || absX < 24

			const curveNx = signX * (0.22 + (absX / 50) * 0.52)
			const curveNy = (chordPos - 0.42) * 0.75
			const curveNz = Math.sqrt(
				Math.max(0.18, 1 - curveNx * curveNx - curveNy * curveNy),
			)

			return {
				material: isCrescentStripe
					? 'accent_livery'
					: isInnerArmor
						? 'armor_plate'
						: 'hull_base',
				nx: curveNx,
				ny: curveNy,
				nz: curveNz,
				borderDistance: borderDist,
				isPanelSeam:
					Math.abs(chordPos - 0.32) < 0.055 ||
					Math.abs(chordPos - 0.56) < 0.055 ||
					Math.abs(absX - 28) < 0.8,
			}
		}
	}

	return null
}

function shadeStarshipSurfaceSample({
	sample,
	shaderPalette,
	x,
	y,
	ditherX,
	ditherY,
	enableDithering,
	seedNumber,
}: {
	sample: ShipSurfaceSample
	shaderPalette: ParsedShipShaderPalette
	x: number
	y: number
	ditherX: number
	ditherY: number
	enableDithering: boolean
	seedNumber: number
}): [number, number, number] {
	if (sample.borderDistance < 1.45) {
		return shaderPalette.outlineRgb
	}

	if (sample.material === 'singularity_void') {
		return shaderPalette.outlineRgb
	}

	const normLen =
		Math.hypot(sample.nx, sample.ny, sample.nz) || 1
	const nx = sample.nx / normLen
	const ny = sample.ny / normLen
	const nz = sample.nz / normLen

	const rawLight = clamp01(
		nx * LIGHT_DIRECTION[0] +
			ny * LIGHT_DIRECTION[1] +
			nz * LIGHT_DIRECTION[2],
	)

	const microNoise = sampleSimplexNoise2D(
		x * 0.14 + (seedNumber % 67),
		y * 0.14 + ((seedNumber >> 4) % 67),
		seedNumber,
	)
	const lightLevel = clamp01(
		rawLight + microNoise * 0.08 + (sample.emissiveBoost ?? 0),
	)

	if (sample.material === 'energy_core' || sample.material === 'weapon_muzzle') {
		return pickFourStopDitheredColor({
			value: clamp01(lightLevel + 0.18),
			stops: [
				shaderPalette.accentShadowRgb,
				shaderPalette.plumeMidRgb,
				shaderPalette.canopyMidRgb,
				shaderPalette.plumeCoreRgb,
			],
			ditherX,
			ditherY,
			enableDithering,
		})
	}

	if (sample.material === 'canopy_glass') {
		if (sample.isPanelSeam) {
			return shaderPalette.outlineRgb
		}
		const isSpecularGlint =
			x < -0.5 && lightLevel > 0.74
		if (isSpecularGlint) {
			const specFraction = clamp01((lightLevel - 0.74) / 0.22)
			if (
				!enableDithering
					? specFraction > 0.5
					: shouldApplyBayerDither(ditherX, ditherY, specFraction + 0.25)
			) {
				return shaderPalette.specularWhiteRgb
			}
		}
		return pickFourStopDitheredColor({
			value: lightLevel,
			stops: [
				shaderPalette.outlineRgb,
				shaderPalette.canopyDeepRgb,
				shaderPalette.canopyMidRgb,
				shaderPalette.canopyBrightRgb,
			],
			ditherX,
			ditherY,
			enableDithering,
		})
	}

	if (sample.material === 'dark_trench' || sample.material === 'engine_nozzle') {
		if (sample.isPanelSeam) {
			return shaderPalette.outlineRgb
		}
		return pickFourStopDitheredColor({
			value: lightLevel * 0.75,
			stops: [
				shaderPalette.outlineRgb,
				shaderPalette.deepHullRgb,
				shaderPalette.hullPrimaryRgb,
				shaderPalette.hullSecondaryRgb,
			],
			ditherX,
			ditherY,
			enableDithering,
		})
	}

	if (sample.isPanelSeam) {
		return lightLevel > 0.65
			? shaderPalette.hullPrimaryRgb
			: shaderPalette.outlineRgb
	}

	if (sample.material === 'accent_livery') {
		return pickFourStopDitheredColor({
			value: lightLevel,
			stops: [
				shaderPalette.outlineRgb,
				shaderPalette.accentShadowRgb,
				shaderPalette.accentMidRgb,
				shaderPalette.accentBrightRgb,
			],
			ditherX,
			ditherY,
			enableDithering,
		})
	}

	if (sample.material === 'weapon_metal') {
		return pickFourStopDitheredColor({
			value: clamp01(lightLevel + 0.08),
			stops: [
				shaderPalette.deepHullRgb,
				shaderPalette.hullPrimaryRgb,
				shaderPalette.hullSecondaryRgb,
				shaderPalette.hullHighlightRgb,
			],
			ditherX,
			ditherY,
			enableDithering,
		})
	}

	if (sample.material === 'armor_plate') {
		return pickFourStopDitheredColor({
			value: clamp01(lightLevel + 0.12),
			stops: [
				shaderPalette.hullPrimaryRgb,
				shaderPalette.hullSecondaryRgb,
				shaderPalette.hullHighlightRgb,
				shaderPalette.specularWhiteRgb,
			],
			ditherX,
			ditherY,
			enableDithering,
		})
	}

	return pickFourStopDitheredColor({
		value: lightLevel,
		stops: [
			shaderPalette.deepHullRgb,
			shaderPalette.hullPrimaryRgb,
			shaderPalette.hullSecondaryRgb,
			shaderPalette.hullHighlightRgb,
		],
		ditherX,
		ditherY,
		enableDithering,
	})
}

function sampleStarshipThrusterPlume({
	archetypeId,
	x,
	y,
	thrusterFrame,
	shaderPalette,
	ditherX,
	ditherY,
	enableDithering,
	seedNumber,
}: {
	archetypeId: ShipArchetypeId
	x: number
	y: number
	thrusterFrame: number
	shaderPalette: ParsedShipShaderPalette
	ditherX: number
	ditherY: number
	enableDithering: boolean
	seedNumber: number
}): { rgb: [number, number, number]; alpha: number } | null {
	const absX = Math.abs(x)
	const frameStretch = 1 + (thrusterFrame % 3) * 0.14

	const emitters: { centerX: number; startY: number; width: number; length: number }[] =
		archetypeId === 'interceptor_vanguard_mk1'
			? [{ centerX: 10.75, startY: 34, width: 5.2, length: 24 * frameStretch }]
			: archetypeId === 'striker_wraith_mk1'
				? [{ centerX: 10.5, startY: 31, width: 5.0, length: 25 * frameStretch }]
				: archetypeId === 'science_helios_mk1'
					? [
							{ centerX: 0, startY: 33, width: 6.5, length: 24 * frameStretch },
							{ centerX: 35, startY: 37, width: 4.5, length: 20 * frameStretch },
						]
					: archetypeId === 'hauler_atlas_mk1'
						? [
								{ centerX: 0, startY: 34, width: 5.8, length: 23 * frameStretch },
								{ centerX: 20.5, startY: 34, width: 6.4, length: 25 * frameStretch },
							]
						: [
								{ centerX: 0, startY: 28, width: 6.2, length: 28 * frameStretch },
								{ centerX: 14, startY: 32, width: 4.4, length: 22 * frameStretch },
							]

	for (const emitter of emitters) {
		if (y < emitter.startY || y > emitter.startY + emitter.length) continue
		const along = (y - emitter.startY) / emitter.length
		const halfWidth = emitter.width * (1 - along * 0.72)
		const distAcross = Math.abs(absX - emitter.centerX)
		if (distAcross > halfWidth) continue

		const radialFactor = 1 - distAcross / Math.max(0.5, halfWidth)
		const axialFactor = 1 - along
		const flickerNoise = sampleSimplexNoise2D(
			x * 0.25 + thrusterFrame * 3.7,
			y * 0.22 + (seedNumber % 31),
			seedNumber,
		)
		const intensity = clamp01(
			radialFactor * 0.68 + axialFactor * 0.48 + flickerNoise * 0.14,
		)

		if (
			enableDithering &&
			intensity < 0.36 &&
			!shouldApplyBayerDither(ditherX, ditherY, intensity / 0.36)
		) {
			continue
		}

		const rgb = pickFourStopDitheredColor({
			value: intensity,
			stops: [
				shaderPalette.accentShadowRgb,
				shaderPalette.plumeDeepRgb,
				shaderPalette.plumeMidRgb,
				shaderPalette.plumeCoreRgb,
			],
			ditherX,
			ditherY,
			enableDithering,
		})

		const alpha = Math.round(clamp01(intensity * 1.35) * 255)
		return { rgb, alpha }
	}

	return null
}

function pickFourStopDitheredColor({
	value,
	stops,
	ditherX,
	ditherY,
	enableDithering,
}: {
	value: number
	stops: [
		[number, number, number],
		[number, number, number],
		[number, number, number],
		[number, number, number],
	]
	ditherX: number
	ditherY: number
	enableDithering: boolean
}): [number, number, number] {
	const clamped = clamp01(value)
	const scaled = clamped * 3
	const index = Math.min(2, Math.floor(scaled))
	const fraction = scaled - index

	if (!enableDithering) {
		return fraction >= 0.5 ? stops[index + 1] : stops[index]
	}

	return shouldApplyBayerDither(ditherX, ditherY, fraction)
		? stops[index + 1]
		: stops[index]
}

function buildParsedShipShaderPalette(
	palette: ShipColorPalette,
): ParsedShipShaderPalette {
	const outlineRgb = parseHexToRgb(palette.outlineDark)
	const hullPrimaryRgb = parseHexToRgb(palette.hullPrimary)
	const hullSecondaryRgb = parseHexToRgb(palette.hullSecondary)
	const hullHighlightRgb = parseHexToRgb(palette.hullHighlight)
	const accentMidRgb = parseHexToRgb(palette.accentStripe)
	const canopyMidRgb = parseHexToRgb(palette.cockpitGlow)
	const plumeMidRgb = parseHexToRgb(palette.thrusterPlume)
	const specularWhiteRgb: [number, number, number] = [255, 255, 255]

	return {
		outlineRgb,
		deepHullRgb: mixRgb(outlineRgb, hullPrimaryRgb, 0.62),
		hullPrimaryRgb,
		hullSecondaryRgb,
		hullHighlightRgb,
		specularWhiteRgb,
		accentShadowRgb: mixRgb(outlineRgb, accentMidRgb, 0.52),
		accentMidRgb,
		accentBrightRgb: mixRgb(accentMidRgb, specularWhiteRgb, 0.46),
		canopyDeepRgb: mixRgb(outlineRgb, canopyMidRgb, 0.42),
		canopyMidRgb,
		canopyBrightRgb: mixRgb(canopyMidRgb, specularWhiteRgb, 0.62),
		plumeDeepRgb: mixRgb(outlineRgb, plumeMidRgb, 0.58),
		plumeMidRgb,
		plumeCoreRgb: mixRgb(plumeMidRgb, specularWhiteRgb, 0.78),
	}
}

function getArchetypeSeed(archetypeId: ShipArchetypeId): number {
	switch (archetypeId) {
		case 'interceptor_vanguard_mk1':
			return 101
		case 'striker_wraith_mk1':
			return 203
		case 'science_helios_mk1':
			return 307
		case 'hauler_atlas_mk1':
			return 409
		case 'valkyrie_crescent_mk1':
			return 521
	}
}

function createCanvasFromPixelBuffer(
	pixelBuffer: Uint8ClampedArray,
	resolution: number,
): HTMLCanvasElement | null {
	if (typeof document === 'undefined') return null
	const canvas = document.createElement('canvas')
	canvas.width = resolution
	canvas.height = resolution
	const context = canvas.getContext('2d')
	if (!context) return null

	const imageData =
		typeof ImageData !== 'undefined'
			? new ImageData(new Uint8ClampedArray(pixelBuffer), resolution, resolution)
			: context.createImageData(resolution, resolution)

	if (typeof ImageData === 'undefined') {
		imageData.data.set(pixelBuffer)
	}

	context.putImageData(imageData, 0, 0)
	return canvas
}

function writePixel(
	buffer: Uint8ClampedArray,
	x: number,
	y: number,
	resolution: number,
	rgb: [number, number, number],
	alpha: number,
): void {
	const offset = (y * resolution + x) * 4
	buffer[offset] = rgb[0]
	buffer[offset + 1] = rgb[1]
	buffer[offset + 2] = rgb[2]
	buffer[offset + 3] = alpha
}

function parseHexToRgb(hex: string): [number, number, number] {
	const cleaned = hex.replace(/^#/, '').trim()
	if (cleaned.length !== 6) return [180, 190, 210]
	const numberValue = Number.parseInt(cleaned, 16)
	if (Number.isNaN(numberValue)) return [180, 190, 210]
	return [
		(numberValue >> 16) & 255,
		(numberValue >> 8) & 255,
		numberValue & 255,
	]
}

function mixRgb(
	first: [number, number, number],
	second: [number, number, number],
	ratio: number,
): [number, number, number] {
	const weight = clamp01(ratio)
	return [
		Math.round(first[0] + (second[0] - first[0]) * weight),
		Math.round(first[1] + (second[1] - first[1]) * weight),
		Math.round(first[2] + (second[2] - first[2]) * weight),
	]
}

function isValidArchetypeId(value: unknown): value is ShipArchetypeId {
	return (
		typeof value === 'string' &&
		(SHIP_ARCHETYPE_IDS as string[]).includes(value)
	)
}

function isValidSkinId(value: unknown): value is ShipSkinId {
	return (
		typeof value === 'string' && (SHIP_SKIN_IDS as string[]).includes(value)
	)
}

function isValidThrusterType(value: unknown): value is ThrusterPlumeType {
	return (
		typeof value === 'string' &&
		(THRUSTER_PLUME_TYPES as string[]).includes(value)
	)
}

function sanitizeHexColor(value: unknown, fallback: string): string {
	if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.trim())) {
		return value.trim()
	}
	return fallback
}

function clampNumber(value: number, minimum: number, maximum: number): number {
	if (!Number.isFinite(value)) return minimum
	return Math.max(minimum, Math.min(maximum, value))
}

function clamp01(value: number): number {
	if (!Number.isFinite(value)) return 0
	return Math.max(0, Math.min(1, value))
}
