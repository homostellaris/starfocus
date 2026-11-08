import { getAdditiveGlowBitmap } from './planetGenerator'
import type {
	AssembledShipLayer,
	ShipArchetypeId,
	ShipColorPalette,
	ShipLoadoutConfig,
	ShipSocketManifest,
	ThrusterPlumeType,
} from './types'

export const SHIP_ARCHETYPE_IDS: ShipArchetypeId[] = [
	'interceptor_vanguard_mk1',
	'hauler_atlas_mk1',
	'science_helios_mk1',
	'striker_wraith_mk1',
]

export const THRUSTER_PLUME_TYPES: ThrusterPlumeType[] = [
	'cyan_ion',
	'heavy_plasma',
	'violet_ring',
	'crimson_afterburner',
]

export const SHIP_COLOR_PALETTES: ShipColorPalette[] = [
	{
		id: 'vanguard_cobalt',
		name: 'Vanguard Cobalt & Solar Orange',
		primaryHullRed: '#dbeafe',
		secondaryTrimGreen: '#f97316',
		emissiveCockpitBlue: '#38bdf8',
		outlineDark: '#09090b',
	},
	{
		id: 'atlas_industrial',
		name: 'Atlas Heavy Amber & Titanium',
		primaryHullRed: '#cbd5e1',
		secondaryTrimGreen: '#eab308',
		emissiveCockpitBlue: '#45D9FD',
		outlineDark: '#09090b',
	},
	{
		id: 'helios_explorer',
		name: 'Helios Bio-Emerald & Violet',
		primaryHullRed: '#ecfdf5',
		secondaryTrimGreen: '#10b981',
		emissiveCockpitBlue: '#c084fc',
		outlineDark: '#09090b',
	},
	{
		id: 'wraith_stealth',
		name: 'Wraith Obsidian & Magma Crimson',
		primaryHullRed: '#334155',
		secondaryTrimGreen: '#ef4444',
		emissiveCockpitBlue: '#fbbf24',
		outlineDark: '#09090b',
	},
]

export const SHIP_SOCKET_MANIFESTS: Record<
	ShipArchetypeId,
	ShipSocketManifest
> = {
	interceptor_vanguard_mk1: {
		hull_id: 'interceptor_vanguard_mk1',
		name: 'The Vanguard',
		roleLabel: 'Agile Interceptor (Default)',
		description:
			'Forward-swept twin wings, needle nose chassis, and high-thrust cyan ion plumes.',
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
	hauler_atlas_mk1: {
		hull_id: 'hauler_atlas_mk1',
		name: 'The Atlas',
		roleLabel: 'Heavy Cargo Hauler (Builder)',
		description:
			'Wide industrial catamaran hull with dorsal cargo pods and heavy plasma nozzles.',
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
	science_helios_mk1: {
		hull_id: 'science_helios_mk1',
		name: 'The Helios',
		roleLabel: 'Science & Recon Vessel (Explorer)',
		description:
			'Twin solar-array wings, sensor dish hardpoints, and panoramic glass canopy.',
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
	striker_wraith_mk1: {
		hull_id: 'striker_wraith_mk1',
		name: 'The Wraith',
		roleLabel: 'Stealth Striker (Deep Focus)',
		description:
			'Angular diamond delta-wing, recessed dark cockpit, and twin micro-railguns.',
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
}

const DEFAULT_THRUSTER_BY_ARCHETYPE: Record<
	ShipArchetypeId,
	ThrusterPlumeType
> = {
	interceptor_vanguard_mk1: 'cyan_ion',
	hauler_atlas_mk1: 'heavy_plasma',
	science_helios_mk1: 'violet_ring',
	striker_wraith_mk1: 'crimson_afterburner',
}

const DEFAULT_PALETTE_INDEX_BY_ARCHETYPE: Record<ShipArchetypeId, number> = {
	interceptor_vanguard_mk1: 0,
	hauler_atlas_mk1: 1,
	science_helios_mk1: 2,
	striker_wraith_mk1: 3,
}

export function resolveShipLoadout(
	partial?: Partial<ShipLoadoutConfig>,
): ShipLoadoutConfig {
	const hullArchetype = isValidArchetypeId(partial?.hullArchetype)
		? partial.hullArchetype
		: 'interceptor_vanguard_mk1'
	const wingArchetype = isValidArchetypeId(partial?.wingArchetype)
		? partial.wingArchetype
		: hullArchetype
	const cockpitArchetype = isValidArchetypeId(partial?.cockpitArchetype)
		? partial.cockpitArchetype
		: hullArchetype
	const hardpointArchetype = isValidArchetypeId(partial?.hardpointArchetype)
		? partial.hardpointArchetype
		: hullArchetype
	const thrusterType = isValidThrusterType(partial?.thrusterType)
		? partial.thrusterType
		: DEFAULT_THRUSTER_BY_ARCHETYPE[hullArchetype]
	const defaultPalette =
		SHIP_COLOR_PALETTES[DEFAULT_PALETTE_INDEX_BY_ARCHETYPE[hullArchetype]]
	const palette: ShipColorPalette = partial?.palette
		? {
				id: partial.palette.id || defaultPalette.id,
				name: partial.palette.name || defaultPalette.name,
				primaryHullRed: sanitizeHexColor(
					partial.palette.primaryHullRed,
					defaultPalette.primaryHullRed,
				),
				secondaryTrimGreen: sanitizeHexColor(
					partial.palette.secondaryTrimGreen,
					defaultPalette.secondaryTrimGreen,
				),
				emissiveCockpitBlue: sanitizeHexColor(
					partial.palette.emissiveCockpitBlue,
					defaultPalette.emissiveCockpitBlue,
				),
				outlineDark: sanitizeHexColor(
					partial.palette.outlineDark,
					defaultPalette.outlineDark,
				),
			}
		: defaultPalette

	return {
		hullArchetype,
		wingArchetype,
		cockpitArchetype,
		hardpointArchetype,
		thrusterType,
		palette,
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
		Math.abs(Math.trunc(Number.isFinite(state.thrusterFrame) ? state.thrusterFrame : 0)) %
		3
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
		archetypeId: resolved.wingArchetype,
		offsetX: manifest.sockets.wing_left.x,
		offsetY: manifest.sockets.wing_left.y,
		mirrorX: manifest.sockets.wing_left.mirrorX,
		scale: 1,
		blendMode: 'source-over',
	})

	layers.push({
		zIndex: 1,
		layerKey: 'wings',
		archetypeId: resolved.wingArchetype,
		offsetX: manifest.sockets.wing_right.x,
		offsetY: manifest.sockets.wing_right.y,
		mirrorX: manifest.sockets.wing_right.mirrorX,
		scale: 1,
		blendMode: 'source-over',
	})

	layers.push({
		zIndex: 2,
		layerKey: 'hardpoints',
		archetypeId: resolved.hardpointArchetype,
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
		archetypeId: resolved.hardpointArchetype,
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
		archetypeId: resolved.cockpitArchetype,
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
	explodedLayerSpacingPx = 0,
}: {
	context: CanvasRenderingContext2D
	loadout: ShipLoadoutConfig
	recoilOffsetPx?: number
	thrusterFrame?: number
	thrusterActive?: boolean
	explodedLayerSpacingPx?: number
}): void {
	const resolvedLoadout = resolveShipLoadout(loadout)
	const layers = assembleShipLayers(resolvedLoadout, {
		recoilOffsetPx,
		thrusterFrame,
	})
	const center = 32
	const spacing = clampNumber(explodedLayerSpacingPx, 0, 24)

	for (const layer of layers) {
		const explodedShiftY = (layer.zIndex - 2) * spacing
		context.save()
		context.translate(
			center + layer.offsetX,
			center + layer.offsetY + explodedShiftY,
		)
		if (layer.mirrorX) {
			context.scale(-1, 1)
		}

		if (layer.layerKey === 'thrusters') {
			if (thrusterActive) {
				paintThrusterPlume(
					context,
					resolvedLoadout.thrusterType,
					layer.scale,
					thrusterFrame,
				)
			}
		} else if (layer.layerKey === 'wings') {
			paintWingPart(context, layer.archetypeId, resolvedLoadout.palette)
		} else if (layer.layerKey === 'hardpoints') {
			paintHardpointPart(context, layer.archetypeId, resolvedLoadout.palette)
		} else if (layer.layerKey === 'hull') {
			paintHullPart(context, layer.archetypeId, resolvedLoadout.palette)
		} else if (layer.layerKey === 'cockpit_and_dorsal') {
			paintCockpitAndDorsalPart(
				context,
				layer.archetypeId,
				resolvedLoadout.hullArchetype,
				resolvedLoadout.palette,
			)
		}
		context.restore()
	}
}

function paintThrusterPlume(
	context: CanvasRenderingContext2D,
	thrusterType: ThrusterPlumeType,
	scale: number,
	thrusterFrame: number,
): void {
	const colorMap: Record<
		ThrusterPlumeType,
		{ outer: string; core: string }
	> = {
		cyan_ion: { outer: '#38bdf8', core: '#e0f2fe' },
		heavy_plasma: { outer: '#f97316', core: '#fef08a' },
		violet_ring: { outer: '#a855f7', core: '#f3e8ff' },
		crimson_afterburner: { outer: '#ef4444', core: '#fde047' },
	}
	const colors = colorMap[thrusterType] ?? colorMap.cyan_ion
	const jitterLength = 9 + (Math.abs(thrusterFrame) % 3) * 2.5

	const glowBitmap = getAdditiveGlowBitmap(colors.outer, 32)
	if (glowBitmap) {
		context.save()
		context.globalCompositeOperation = 'lighter'
		context.drawImage(
			glowBitmap,
			-10 * scale,
			-6 * scale,
			20 * scale,
			22 * scale,
		)
		context.restore()
	}

	context.save()
	context.globalCompositeOperation = 'lighter'
	context.fillStyle = colors.outer
	context.beginPath()
	context.moveTo(-3.5 * scale, -2)
	context.lineTo(3.5 * scale, -2)
	context.lineTo(0, jitterLength * scale)
	context.closePath()
	context.fill()

	context.fillStyle = colors.core
	context.beginPath()
	context.moveTo(-1.8 * scale, -1)
	context.lineTo(1.8 * scale, -1)
	context.lineTo(0, (jitterLength - 3) * scale)
	context.closePath()
	context.fill()
	context.restore()
}

function paintWingPart(
	context: CanvasRenderingContext2D,
	archetypeId: ShipArchetypeId,
	palette: ShipColorPalette,
): void {
	context.lineWidth = 2
	context.strokeStyle = palette.outlineDark
	context.fillStyle = palette.primaryHullRed

	context.beginPath()
	if (archetypeId === 'interceptor_vanguard_mk1') {
		context.moveTo(4, -10)
		context.lineTo(-10, -4)
		context.lineTo(-14, -14)
		context.lineTo(-12, 12)
		context.lineTo(4, 14)
	} else if (archetypeId === 'hauler_atlas_mk1') {
		context.rect(-10, -14, 12, 28)
	} else if (archetypeId === 'science_helios_mk1') {
		context.moveTo(2, -8)
		context.lineTo(-14, -12)
		context.lineTo(-14, 12)
		context.lineTo(2, 8)
	} else {
		context.moveTo(4, -14)
		context.lineTo(-14, 6)
		context.lineTo(-8, 16)
		context.lineTo(4, 10)
	}
	context.closePath()
	context.fill()
	context.stroke()

	context.fillStyle = palette.secondaryTrimGreen
	context.fillRect(-8, -2, 6, 4)
}

function paintHardpointPart(
	context: CanvasRenderingContext2D,
	archetypeId: ShipArchetypeId,
	palette: ShipColorPalette,
): void {
	context.fillStyle = palette.outlineDark
	context.fillRect(-3, -7, 6, 12)

	context.fillStyle =
		archetypeId === 'science_helios_mk1'
			? palette.emissiveCockpitBlue
			: palette.secondaryTrimGreen
	context.fillRect(-2, -6, 4, 8)

	context.fillStyle = '#ffffff'
	context.fillRect(-1, -7, 2, 2)
}

function paintHullPart(
	context: CanvasRenderingContext2D,
	archetypeId: ShipArchetypeId,
	palette: ShipColorPalette,
): void {
	context.lineWidth = 2.2
	context.strokeStyle = palette.outlineDark
	context.fillStyle = palette.primaryHullRed

	context.beginPath()
	if (archetypeId === 'interceptor_vanguard_mk1') {
		context.moveTo(0, -26)
		context.lineTo(10, -4)
		context.lineTo(12, 18)
		context.lineTo(6, 24)
		context.lineTo(-6, 24)
		context.lineTo(-12, 18)
		context.lineTo(-10, -4)
	} else if (archetypeId === 'hauler_atlas_mk1') {
		context.moveTo(-9, -24)
		context.lineTo(9, -24)
		context.lineTo(14, -12)
		context.lineTo(14, 22)
		context.lineTo(8, 25)
		context.lineTo(-8, 25)
		context.lineTo(-14, 22)
		context.lineTo(-14, -12)
	} else if (archetypeId === 'science_helios_mk1') {
		context.moveTo(0, -24)
		context.lineTo(11, -10)
		context.lineTo(9, 20)
		context.lineTo(0, 25)
		context.lineTo(-9, 20)
		context.lineTo(-11, -10)
	} else {
		context.moveTo(0, -27)
		context.lineTo(12, 2)
		context.lineTo(8, 23)
		context.lineTo(0, 19)
		context.lineTo(-8, 23)
		context.lineTo(-12, 2)
	}
	context.closePath()
	context.fill()
	context.stroke()

	context.fillStyle = palette.secondaryTrimGreen
	context.fillRect(-5, 10, 10, 5)
	context.fillRect(-2, -18, 4, 8)
}

function paintCockpitAndDorsalPart(
	context: CanvasRenderingContext2D,
	cockpitArchetypeId: ShipArchetypeId,
	hullArchetypeId: ShipArchetypeId,
	palette: ShipColorPalette,
): void {
	context.lineWidth = 1.6
	context.strokeStyle = palette.outlineDark
	context.fillStyle = palette.emissiveCockpitBlue

	context.beginPath()
	if (cockpitArchetypeId === 'science_helios_mk1') {
		context.arc(0, 0, 6.5, 0, Math.PI * 2)
	} else if (cockpitArchetypeId === 'hauler_atlas_mk1') {
		context.rect(-6, -3, 12, 6)
	} else {
		context.moveTo(0, -7)
		context.lineTo(4.5, 2)
		context.lineTo(0, 6)
		context.lineTo(-4.5, 2)
		context.closePath()
	}
	context.fill()
	context.stroke()

	context.fillStyle = '#ffffff'
	context.fillRect(-1.5, -4, 2, 3)

	const dorsalSockets =
		SHIP_SOCKET_MANIFESTS[hullArchetypeId].sockets.dorsal_cargo
	for (const crate of dorsalSockets) {
		context.fillStyle = palette.outlineDark
		context.fillRect(crate.x - 4, crate.y + 8, 8, 6)
		context.fillStyle = palette.secondaryTrimGreen
		context.fillRect(crate.x - 3, crate.y + 9, 6, 4)
	}
}

function isValidArchetypeId(value: unknown): value is ShipArchetypeId {
	return (
		typeof value === 'string' &&
		(SHIP_ARCHETYPE_IDS as string[]).includes(value)
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
