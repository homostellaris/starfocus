export type CelestialClass =
	| 'asteroid'
	| 'terrestrial'
	| 'emissive'
	| 'gas_giant'

export type EmissiveSubType = 'cryo' | 'bioluminescent' | 'volcanic'

export type BiomePaletteId = 'engineering' | 'urgent' | 'growth' | 'strategy'

export interface BiomePalette {
	id: BiomePaletteId
	label: string
	categoryDescription: string
	deepShadow: string
	midtone: string
	highlight: string
	emissiveOrAtmos: string
}

export interface CraterStamp {
	centerX: number
	centerY: number
	radius: number
	depth: number
}

export interface ProceduralPlanetSpec {
	todoId: string
	title: string
	seed: number
	starPoints: number
	celestialClass: CelestialClass
	emissiveSubType: EmissiveSubType
	biomeId: BiomePaletteId
	palette: BiomePalette
	craterCount: number
	craters: CraterStamp[]
	continentFrequency: number
	cloudCoverage: number
	ringTiltDegrees: number
	hasRings: boolean
	orbitingMoonCount: number
	hudReticleRotationDegrees: number
}

export interface PlanetBakeMetrics {
	cacheKey: string
	cacheHit: boolean
	bakeDurationMilliseconds: number
	resolution: number
}

export type ShipArchetypeId =
	| 'interceptor_vanguard_mk1'
	| 'hauler_atlas_mk1'
	| 'science_helios_mk1'
	| 'striker_wraith_mk1'

export type ThrusterPlumeType =
	| 'cyan_ion'
	| 'heavy_plasma'
	| 'violet_ring'
	| 'crimson_afterburner'

export interface SocketCoordinate {
	x: number
	y: number
}

export interface WingSocket extends SocketCoordinate {
	mirrorX: boolean
	hardpoint: SocketCoordinate
}

export interface ThrusterSocket extends SocketCoordinate {
	scale: number
	type: ThrusterPlumeType
}

export interface ShipSocketManifest {
	hull_id: ShipArchetypeId
	name: string
	roleLabel: string
	description: string
	dimensions: { width: number; height: number }
	sockets: {
		cockpit: SocketCoordinate
		dorsal_cargo: SocketCoordinate[]
		wing_left: WingSocket
		wing_right: WingSocket
		thrusters: ThrusterSocket[]
	}
}

export interface ShipColorPalette {
	id: string
	name: string
	primaryHullRed: string
	secondaryTrimGreen: string
	emissiveCockpitBlue: string
	outlineDark: string
}

export interface ShipLoadoutConfig {
	hullArchetype: ShipArchetypeId
	wingArchetype: ShipArchetypeId
	cockpitArchetype: ShipArchetypeId
	hardpointArchetype: ShipArchetypeId
	thrusterType: ThrusterPlumeType
	palette: ShipColorPalette
}

export interface AssembledShipLayer {
	zIndex: 0 | 1 | 2 | 3 | 4
	layerKey:
		| 'thrusters'
		| 'wings'
		| 'hardpoints'
		| 'hull'
		| 'cockpit_and_dorsal'
	archetypeId: ShipArchetypeId
	offsetX: number
	offsetY: number
	mirrorX: boolean
	scale: number
	blendMode: 'source-over' | 'lighter'
}

export type BatteryPerformanceTier = 'active' | 'battery_saver' | 'idle'

export interface BatteryTickerTelemetry {
	tier: BatteryPerformanceTier
	targetFps: number
	measuredFps: number
	idleMilliseconds: number
	activeParticleCount: number
	maxParticlePoolSize: number
}

export interface PooledParticle {
	active: boolean
	x: number
	y: number
	velocityX: number
	velocityY: number
	lifeRemaining: number
	maxLife: number
	size: number
	color: string
}

export interface ArcadePlanetNode {
	todoId: string
	title: string
	starPoints: number
	x: number
	y: number
	radius: number
	spec: ProceduralPlanetSpec
	hitPoints: number
	maxHitPoints: number
	destroyedSubtasks: number
}

export interface ArcadeProjectile {
	id: string
	x: number
	y: number
	velocityX: number
	velocityY: number
	radius: number
	color: string
	remainingLifeSeconds: number
}

export interface ArcadeShipState {
	x: number
	y: number
	velocityX: number
	velocityY: number
	angleDegrees: number
	recoilOffsetPx: number
	shotsFired: number
}
