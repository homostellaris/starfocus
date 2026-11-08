import { getAdditiveGlowBitmap } from './planetGenerator'
import type {
	AssembledShipLayer,
	ShipArchetypeId,
	ShipColorPalette,
	ShipLoadoutConfig,
	ShipSkinId,
	ShipSocketManifest,
	ThrusterPlumeType,
} from './types'

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
			'Sculpted gravimetric ring hull with twin forward sensor mandibles, spherical quantum core dome, and tri-ion impulse array.',
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

	const requestedSkinId =
		partial?.skinId ??
		(isValidSkinId(partial?.palette?.id) ? partial.palette.id : undefined) ??
		DEFAULT_SKIN_BY_ARCHETYPE[hullArchetype]

	const skinId: ShipSkinId = isValidSkinId(requestedSkinId)
		? requestedSkinId
		: DEFAULT_SKIN_BY_ARCHETYPE[hullArchetype]

	const matchedSkin =
		SHIP_COLOR_PALETTES.find(candidate => candidate.id === skinId) ??
		SHIP_COLOR_PALETTES[0]

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
	const { hullArchetype, palette } = resolvedLoadout
	const safeRecoil = clampNumber(recoilOffsetPx, 0, 6)
	const plumeStretch = 1 + (Math.abs(thrusterFrame) % 3) * 0.14

	context.save()
	context.translate(32, 32)

	if (thrusterActive) {
		const thrusters = SHIP_SOCKET_MANIFESTS[hullArchetype].sockets.thrusters
		for (const thruster of thrusters) {
			context.save()
			context.translate(thruster.x, thruster.y)
			paintCanvasThrusterFlame(
				context,
				palette.thrusterPlume,
				thruster.scale * plumeStretch,
			)
			context.restore()
		}
	}

	paintWholeStarshipCanvasHull(
		context,
		hullArchetype,
		palette,
		safeRecoil,
	)

	context.restore()
}

function paintCanvasThrusterFlame(
	context: CanvasRenderingContext2D,
	plumeColor: string,
	scale: number,
): void {
	const glowBitmap = getAdditiveGlowBitmap(plumeColor, 32)
	if (glowBitmap) {
		context.save()
		context.globalCompositeOperation = 'lighter'
		context.drawImage(
			glowBitmap,
			-11 * scale,
			-5 * scale,
			22 * scale,
			24 * scale,
		)
		context.restore()
	}

	context.save()
	context.globalCompositeOperation = 'lighter'
	context.fillStyle = plumeColor
	context.beginPath()
	context.moveTo(-4.2 * scale, -1)
	context.quadraticCurveTo(-2.5 * scale, 8 * scale, 0, 15 * scale)
	context.quadraticCurveTo(2.5 * scale, 8 * scale, 4.2 * scale, -1)
	context.closePath()
	context.fill()

	context.fillStyle = '#ffffff'
	context.beginPath()
	context.moveTo(-2 * scale, -1)
	context.lineTo(2 * scale, -1)
	context.lineTo(0, 9.5 * scale)
	context.closePath()
	context.fill()
	context.restore()
}

function paintWholeStarshipCanvasHull(
	context: CanvasRenderingContext2D,
	archetypeId: ShipArchetypeId,
	palette: ShipColorPalette,
	recoilOffset: number,
): void {
	context.lineJoin = 'round'
	context.lineCap = 'round'

	if (archetypeId === 'interceptor_vanguard_mk1') {
		drawSymmetricPolygon(
			context,
			[
				[0, -28],
				[6, -12],
				[25, 6],
				[27, 16],
				[14, 14],
				[9, 22],
				[4, 24],
				[0, 20],
			],
			palette.hullPrimary,
			palette.outlineDark,
			1.8,
		)
		drawSymmetricPolygon(
			context,
			[
				[0, -25],
				[5, -9],
				[18, 7],
				[12, 12],
				[7, 20],
				[0, 17],
			],
			palette.hullHighlight,
			palette.hullSecondary,
			1,
		)
		drawSymmetricPolygon(
			context,
			[
				[5, -8],
				[22, 7],
				[20, 11],
				[6, 2],
			],
			palette.accentStripe,
		)
		context.fillStyle = palette.hullSecondary
		context.fillRect(-16, -9 + recoilOffset, 2.5, 9)
		context.fillRect(13.5, -9 + recoilOffset, 2.5, 9)
	} else if (archetypeId === 'striker_wraith_mk1') {
		drawSymmetricPolygon(
			context,
			[
				[0, -29],
				[10, -12],
				[27, 10],
				[22, 22],
				[12, 16],
				[7, 24],
				[0, 19],
			],
			palette.hullPrimary,
			palette.outlineDark,
			1.8,
		)
		drawSymmetricPolygon(
			context,
			[
				[0, -24],
				[8, -7],
				[19, 10],
				[13, 13],
				[5, 20],
				[0, 15],
			],
			palette.hullSecondary,
			palette.hullHighlight,
			1,
		)
		drawSymmetricPolygon(
			context,
			[
				[0, -19],
				[4, -4],
				[14, 9],
				[10, 11],
				[0, 4],
			],
			palette.accentStripe,
		)
	} else if (archetypeId === 'science_helios_mk1') {
		context.beginPath()
		context.arc(0, 0, 21, 0, Math.PI * 2)
		context.fillStyle = palette.hullPrimary
		context.fill()
		context.lineWidth = 1.8
		context.strokeStyle = palette.outlineDark
		context.stroke()

		context.beginPath()
		context.arc(0, 0, 16, 0, Math.PI * 2)
		context.strokeStyle = palette.accentStripe
		context.lineWidth = 2.5
		context.stroke()

		drawSymmetricPolygon(
			context,
			[
				[3, -27],
				[9, -24],
				[11, 20],
				[5, 24],
				[0, 22],
				[0, -14],
			],
			palette.hullHighlight,
			palette.hullSecondary,
			1.2,
		)
	} else if (archetypeId === 'hauler_atlas_mk1') {
		drawSymmetricPolygon(
			context,
			[
				[4, -26],
				[12, -22],
				[24, -8],
				[25, 16],
				[17, 24],
				[5, 25],
				[0, 22],
				[0, -24],
			],
			palette.hullPrimary,
			palette.outlineDark,
			1.8,
		)
		drawSymmetricPolygon(
			context,
			[
				[0, -22],
				[9, -18],
				[18, -6],
				[18, 15],
				[11, 21],
				[0, 20],
			],
			palette.hullHighlight,
			palette.hullSecondary,
			1.1,
		)
		drawSymmetricPolygon(
			context,
			[
				[11, -12],
				[21, -4],
				[21, 12],
				[11, 14],
			],
			palette.accentStripe,
		)
	} else {
		drawSymmetricPolygon(
			context,
			[
				[0, -29],
				[5, -14],
				[24, -4],
				[28, 12],
				[19, 24],
				[14, 12],
				[6, 22],
				[0, 18],
			],
			palette.hullPrimary,
			palette.outlineDark,
			1.8,
		)
		drawSymmetricPolygon(
			context,
			[
				[0, -24],
				[4, -10],
				[19, -1],
				[22, 10],
				[15, 7],
				[5, 18],
				[0, 14],
			],
			palette.hullHighlight,
			palette.accentStripe,
			1.1,
		)
	}

	context.beginPath()
	context.ellipse(0, -4, 4.2, 8.5, 0, 0, Math.PI * 2)
	context.fillStyle = palette.cockpitGlow
	context.fill()
	context.lineWidth = 1.2
	context.strokeStyle = palette.outlineDark
	context.stroke()

	context.beginPath()
	context.ellipse(-1.2, -6.5, 1.3, 3.2, -0.2, 0, Math.PI * 2)
	context.fillStyle = '#ffffff'
	context.fill()
}

function drawSymmetricPolygon(
	context: CanvasRenderingContext2D,
	rightHalfPoints: [number, number][],
	fillStyle: string,
	strokeStyle?: string,
	lineWidth = 1.5,
): void {
	if (rightHalfPoints.length === 0) return
	context.beginPath()
	context.moveTo(rightHalfPoints[0][0], rightHalfPoints[0][1])
	for (let index = 1; index < rightHalfPoints.length; index++) {
		context.lineTo(rightHalfPoints[index][0], rightHalfPoints[index][1])
	}
	for (let index = rightHalfPoints.length - 1; index >= 0; index--) {
		const [x, y] = rightHalfPoints[index]
		if (x !== 0) {
			context.lineTo(-x, y)
		}
	}
	context.closePath()
	context.fillStyle = fillStyle
	context.fill()
	if (strokeStyle) {
		context.lineWidth = lineWidth
		context.strokeStyle = strokeStyle
		context.stroke()
	}
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
