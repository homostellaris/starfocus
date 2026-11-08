import type { StarRole, Todo } from '../db'
import {
	createSeededRandom,
	hashStringToSeed,
	sampleFractalNoise2D,
	sampleSimplexNoise2D,
	shouldApplyBayerDither,
} from './proceduralMath'
import type {
	BiomePalette,
	BiomePaletteId,
	CelestialClass,
	CraterStamp,
	EmissiveSubType,
	PlanetBakeMetrics,
	ProceduralPlanetSpec,
} from './types'

export const PLANET_BITMAP_RESOLUTION = 128
const MAX_PLANET_CACHE_ENTRIES = 128

export const BIOME_PALETTES: Record<BiomePaletteId, BiomePalette> = {
	engineering: {
		id: 'engineering',
		label: 'Cryo Cyan & Deep Indigo',
		categoryDescription: 'Deep Work / Engineering',
		deepShadow: '#0B1D3A',
		midtone: '#1E5F74',
		highlight: '#45D9FD',
		emissiveOrAtmos: '#E0FBFC',
	},
	urgent: {
		id: 'urgent',
		label: 'Volcanic Basalt & Magma Amber',
		categoryDescription: 'Urgent / Admin / Bugs',
		deepShadow: '#1F1A24',
		midtone: '#3D2C2E',
		highlight: '#E63946',
		emissiveOrAtmos: '#FFB703',
	},
	growth: {
		id: 'growth',
		label: 'Terran Emerald & Atmos Gold',
		categoryDescription: 'Health / Personal / Growth',
		deepShadow: '#102A23',
		midtone: '#2D6A4F',
		highlight: '#74C69D',
		emissiveOrAtmos: '#F4A261',
	},
	strategy: {
		id: 'strategy',
		label: 'Nebula Violet & Jovian Cream',
		categoryDescription: 'Strategy / Planning',
		deepShadow: '#241634',
		midtone: '#5A3E7A',
		highlight: '#C77DFF',
		emissiveOrAtmos: '#F8EDEB',
	},
}

const BIOME_ORDER: BiomePaletteId[] = [
	'engineering',
	'urgent',
	'growth',
	'strategy',
]

interface CachedPlanetEntry {
	canvas: HTMLCanvasElement | null
	pixelBuffer: Uint8ClampedArray
	bakeDurationMilliseconds: number
}

const planetBitmapCache = new Map<string, CachedPlanetEntry>()
const additiveGlowCache = new Map<string, HTMLCanvasElement>()

export function resolveCelestialClass(
	starPoints?: number,
	visitCount = 0,
	_seed = 0,
): CelestialClass {
	if (starPoints === undefined || !Number.isFinite(starPoints) || starPoints <= 2) {
		return 'asteroid'
	}
	if (starPoints <= 5) {
		return 'terrestrial'
	}
	if (starPoints >= 20) {
		return 'gas_giant'
	}
	if (starPoints >= 13 && visitCount >= 2) {
		return 'gas_giant'
	}
	return 'emissive'
}

export function resolveBiomePalette(
	todo: Pick<Todo, 'id' | 'starRole'>,
	starRole?: StarRole,
	starRoleGroupTitle?: string,
): BiomePalette {
	const combinedText = [
		starRole?.title ?? '',
		starRoleGroupTitle ?? '',
		starRole?.icon?.name ?? '',
	]
		.join(' ')
		.toLowerCase()

	if (
		matchesAnyKeyword(combinedText, [
			'engineer',
			'code',
			'dev',
			'deep',
			'focus',
			'starfocuser',
			'sculptor',
			'tech',
			'build',
			'terminal',
			'flashsharp',
			'planetsharp',
		])
	) {
		return BIOME_PALETTES.engineering
	}

	if (
		matchesAnyKeyword(combinedText, [
			'urgent',
			'admin',
			'bug',
			'fix',
			'ops',
			'chore',
			'security',
			'flamesharp',
			'bugsharp',
			'warningsharp',
			'hammersharp',
		])
	) {
		return BIOME_PALETTES.urgent
	}

	if (
		matchesAnyKeyword(combinedText, [
			'health',
			'personal',
			'growth',
			'father',
			'partner',
			'family',
			'botanist',
			'life',
			'wellness',
			'heartsharp',
			'leafsharp',
			'malesharp',
			'sparklessharp',
		])
	) {
		return BIOME_PALETTES.growth
	}

	if (
		matchesAnyKeyword(combinedText, [
			'strategy',
			'plan',
			'captain',
			'navigator',
			'vision',
			'research',
			'marketing',
			'starsharp',
			'compasssharp',
			'rocketsharp',
			'layerssharp',
		])
	) {
		return BIOME_PALETTES.strategy
	}

	const fallbackSeed = hashStringToSeed(
		starRole?.id || todo.starRole || todo.id || 'default-biome',
	)
	const paletteIndex = fallbackSeed % BIOME_ORDER.length
	return BIOME_PALETTES[BIOME_ORDER[paletteIndex]]
}

export function generateProceduralPlanetSpec({
	todo,
	starRole,
	starRoleGroupTitle,
	visitCount = 0,
	celestialClassOverride,
	biomeOverride,
}: {
	todo: Pick<Todo, 'id' | 'title' | 'starPoints' | 'starRole'>
	starRole?: StarRole
	starRoleGroupTitle?: string
	visitCount?: number
	celestialClassOverride?: CelestialClass
	biomeOverride?: BiomePaletteId
}): ProceduralPlanetSpec {
	const safeId = todo.id || todo.title || 'starfocus-planet'
	const seed = hashStringToSeed(safeId)
	const randomGenerator = createSeededRandom(seed)

	const safeStarPoints =
		typeof todo.starPoints === 'number' && Number.isFinite(todo.starPoints)
			? Math.max(0, Math.min(100, Math.round(todo.starPoints)))
			: 0
	const safeVisitCount =
		typeof visitCount === 'number' && Number.isFinite(visitCount)
			? Math.max(0, Math.min(8, Math.floor(visitCount)))
			: 0

	const celestialClass =
		celestialClassOverride ??
		resolveCelestialClass(safeStarPoints, safeVisitCount, seed)

	const palette = biomeOverride
		? BIOME_PALETTES[biomeOverride]
		: resolveBiomePalette(todo, starRole, starRoleGroupTitle)

	const emissiveSubType = resolveEmissiveSubType(palette.id, randomGenerator)
	const craterCount =
		celestialClass === 'asteroid'
			? 4 + Math.floor(randomGenerator() * 4)
			: 2 + Math.floor(randomGenerator() * 3)

	const craters: CraterStamp[] = Array.from({ length: craterCount }, () => {
		const angle = randomGenerator() * Math.PI * 2
		const distance = randomGenerator() * 24
		return {
			centerX: Math.cos(angle) * distance,
			centerY: Math.sin(angle) * distance,
			radius: 4 + randomGenerator() * 7,
			depth: 0.4 + randomGenerator() * 0.5,
		}
	})

	const continentFrequency = 2.1 + randomGenerator() * 1.8
	const cloudCoverage = 0.25 + randomGenerator() * 0.45
	const ringTiltDegrees = Math.round((randomGenerator() * 44 - 22) * 10) / 10
	const hasRings = celestialClass === 'gas_giant'
	const hudReticleRotationDegrees = Math.floor(randomGenerator() * 360)

	return {
		todoId: todo.id || 'unassigned',
		title: todo.title || 'Untitled Objective',
		seed,
		starPoints: safeStarPoints,
		celestialClass,
		emissiveSubType,
		biomeId: palette.id,
		palette,
		craterCount,
		craters,
		continentFrequency,
		cloudCoverage,
		ringTiltDegrees,
		hasRings,
		orbitingMoonCount: safeVisitCount,
		hudReticleRotationDegrees,
	}
}

export function bakePlanetBitmap(
	spec: ProceduralPlanetSpec,
	options?: { enableDithering?: boolean },
): {
	canvas: HTMLCanvasElement | null
	pixelBuffer: Uint8ClampedArray
	metrics: PlanetBakeMetrics
} {
	const enableDithering = options?.enableDithering ?? true
	const cacheKey = `${spec.seed}:${spec.celestialClass}:${spec.emissiveSubType}:${spec.biomeId}:${spec.ringTiltDegrees}:${enableDithering ? 1 : 0}`

	const existingEntry = planetBitmapCache.get(cacheKey)
	if (existingEntry) {
		return {
			canvas: existingEntry.canvas,
			pixelBuffer: existingEntry.pixelBuffer,
			metrics: {
				cacheKey,
				cacheHit: true,
				bakeDurationMilliseconds: existingEntry.bakeDurationMilliseconds,
				resolution: PLANET_BITMAP_RESOLUTION,
			},
		}
	}

	const startTimestamp =
		typeof performance !== 'undefined' ? performance.now() : Date.now()
	const pixelBuffer = renderPlanetPixels(spec, enableDithering)
	const offscreenCanvas = createCanvasFromPixelBuffer(
		pixelBuffer,
		PLANET_BITMAP_RESOLUTION,
	)
	const endTimestamp =
		typeof performance !== 'undefined' ? performance.now() : Date.now()
	const bakeDurationMilliseconds =
		Math.round(Math.max(0.01, endTimestamp - startTimestamp) * 100) / 100

	if (planetBitmapCache.size >= MAX_PLANET_CACHE_ENTRIES) {
		const oldestKey = planetBitmapCache.keys().next().value
		if (oldestKey) {
			planetBitmapCache.delete(oldestKey)
		}
	}

	planetBitmapCache.set(cacheKey, {
		canvas: offscreenCanvas,
		pixelBuffer,
		bakeDurationMilliseconds,
	})

	return {
		canvas: offscreenCanvas,
		pixelBuffer,
		metrics: {
			cacheKey,
			cacheHit: false,
			bakeDurationMilliseconds,
			resolution: PLANET_BITMAP_RESOLUTION,
		},
	}
}

export function getAdditiveGlowBitmap(
	hexColor: string,
	size = 64,
): HTMLCanvasElement | null {
	if (typeof document === 'undefined') {
		return null
	}
	const cacheKey = `${hexColor}:${size}`
	const cachedCanvas = additiveGlowCache.get(cacheKey)
	if (cachedCanvas) {
		return cachedCanvas
	}

	const canvas = document.createElement('canvas')
	canvas.width = size
	canvas.height = size
	const context = canvas.getContext('2d')
	if (!context) {
		return null
	}

	const center = size / 2
	const rgb = parseHexToRgb(hexColor)
	const gradient = context.createRadialGradient(
		center,
		center,
		size * 0.06,
		center,
		center,
		center,
	)
	gradient.addColorStop(0, `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0.55)`)
	gradient.addColorStop(0.45, `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0.22)`)
	gradient.addColorStop(1, `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0)`)

	context.fillStyle = gradient
	context.fillRect(0, 0, size, size)

	additiveGlowCache.set(cacheKey, canvas)
	return canvas
}

export function clearPlanetBitmapCache(): void {
	planetBitmapCache.clear()
}

function renderPlanetPixels(
	spec: ProceduralPlanetSpec,
	enableDithering: boolean,
): Uint8ClampedArray {
	const resolution = PLANET_BITMAP_RESOLUTION
	const buffer = new Uint8ClampedArray(resolution * resolution * 4)
	const center = resolution / 2
	const baseRadius = spec.celestialClass === 'gas_giant' ? 38 : 46

	const darkOutlineRgb = { red: 9, green: 9, blue: 11 }
	const deepShadowRgb = parseHexToRgb(spec.palette.deepShadow)
	const midtoneRgb = parseHexToRgb(spec.palette.midtone)
	const highlightRgb = parseHexToRgb(spec.palette.highlight)
	const emissiveRgb = parseHexToRgb(spec.palette.emissiveOrAtmos)

	const tiltRadians = (spec.ringTiltDegrees * Math.PI) / 180
	const cosineTilt = Math.cos(tiltRadians)
	const sineTilt = Math.sin(tiltRadians)

	for (let pixelY = 0; pixelY < resolution; pixelY++) {
		for (let pixelX = 0; pixelX < resolution; pixelX++) {
			const offsetX = pixelX - center + 0.5
			const offsetY = pixelY - center + 0.5
			const radialDistance = Math.hypot(offsetX, offsetY)

			if (spec.hasRings) {
				const ringSample = evaluateGasGiantRing(
					offsetX,
					offsetY,
					cosineTilt,
					sineTilt,
					baseRadius,
					pixelX,
					pixelY,
					enableDithering,
				)
				if (ringSample.inRing && ringSample.isBehindPlanet) {
					const ringColor =
						ringSample.bandIndex === 0
							? emissiveRgb
							: ringSample.bandIndex === 1
								? highlightRgb
								: midtoneRgb
					writePixel(buffer, pixelX, pixelY, resolution, ringColor, ringSample.alpha)
				}
			}

			const localRadius = computeSilhouetteRadius(
				spec,
				offsetX,
				offsetY,
				baseRadius,
			)

			if (radialDistance <= localRadius + 2) {
				if (radialDistance >= localRadius) {
					const edgeAlpha = Math.max(
						0,
						Math.min(255, Math.round((localRadius + 2 - radialDistance) * 180)),
					)
					writePixel(
						buffer,
						pixelX,
						pixelY,
						resolution,
						darkOutlineRgb,
						edgeAlpha,
					)
				} else {
					const normalizedX = offsetX / localRadius
					const normalizedY = offsetY / localRadius
					const normalizedZ = Math.sqrt(
						Math.max(0, 1 - normalizedX * normalizedX - normalizedY * normalizedY),
					)

					const lightDirectionX = -0.58
					const lightDirectionY = -0.52
					const lightDirectionZ = 0.62
					const rawLambert =
						normalizedX * lightDirectionX +
						normalizedY * lightDirectionY +
						normalizedZ * lightDirectionZ
					const normalizedLight = Math.max(0, Math.min(1, (rawLambert + 0.25) / 1.15))

					const interiorRgb = samplePlanetInteriorColor({
						spec,
						pixelX,
						pixelY,
						offsetX,
						offsetY,
						normalizedX,
						normalizedY,
						normalizedZ,
						normalizedLight,
						enableDithering,
						deepShadowRgb,
						midtoneRgb,
						highlightRgb,
						emissiveRgb,
					})

					writePixel(buffer, pixelX, pixelY, resolution, interiorRgb, 255)
				}
			}

			if (spec.hasRings) {
				const ringSample = evaluateGasGiantRing(
					offsetX,
					offsetY,
					cosineTilt,
					sineTilt,
					baseRadius,
					pixelX,
					pixelY,
					enableDithering,
				)
				if (ringSample.inRing && !ringSample.isBehindPlanet) {
					const ringColor =
						ringSample.bandIndex === 0
							? emissiveRgb
							: ringSample.bandIndex === 1
								? highlightRgb
								: darkOutlineRgb
					writePixel(buffer, pixelX, pixelY, resolution, ringColor, ringSample.alpha)
				}
			}
		}
	}

	return buffer
}

function samplePlanetInteriorColor({
	spec,
	pixelX,
	pixelY,
	offsetX,
	offsetY,
	normalizedX,
	normalizedY,
	normalizedZ,
	normalizedLight,
	enableDithering,
	deepShadowRgb,
	midtoneRgb,
	highlightRgb,
	emissiveRgb,
}: {
	spec: ProceduralPlanetSpec
	pixelX: number
	pixelY: number
	offsetX: number
	offsetY: number
	normalizedX: number
	normalizedY: number
	normalizedZ: number
	normalizedLight: number
	enableDithering: boolean
	deepShadowRgb: { red: number; green: number; blue: number }
	midtoneRgb: { red: number; green: number; blue: number }
	highlightRgb: { red: number; green: number; blue: number }
	emissiveRgb: { red: number; green: number; blue: number }
}): { red: number; green: number; blue: number } {
	const cellX = Math.floor(pixelX / 2)
	const cellY = Math.floor(pixelY / 2)

	const isLitDaySide = enableDithering
		? shouldApplyBayerDither(cellX, cellY, normalizedLight)
		: normalizedLight > 0.45

	if (spec.celestialClass === 'asteroid') {
		let craterShade = 0
		for (const crater of spec.craters) {
			const deltaX = offsetX - crater.centerX
			const deltaY = offsetY - crater.centerY
			const distanceToCrater = Math.hypot(deltaX, deltaY)
			if (distanceToCrater < crater.radius) {
				const rimFactor = distanceToCrater / crater.radius
				if (rimFactor > 0.72 && deltaX + deltaY > 0) {
					craterShade = 1
				} else {
					craterShade = -1
				}
				break
			}
		}

		if (craterShade === 1 && isLitDaySide) {
			return emissiveRgb
		}
		if (craterShade === -1 || !isLitDaySide) {
			return deepShadowRgb
		}
		return normalizedLight > 0.68 ? highlightRgb : midtoneRgb
	}

	if (spec.celestialClass === 'terrestrial') {
		const fresnelRim = normalizedZ < 0.28
		if (fresnelRim && isLitDaySide) {
			return emissiveRgb
		}

		const continentValue = sampleFractalNoise2D(
			normalizedX * spec.continentFrequency + 1.7,
			normalizedY * spec.continentFrequency - 0.9,
			spec.seed,
			4,
		)
		const cloudValue = sampleSimplexNoise2D(
			normalizedX * 3.4 - 2.1,
			normalizedY * 4.2 + 1.3,
			spec.seed + 77,
		)

		if (cloudValue > 1 - spec.cloudCoverage && isLitDaySide) {
			return emissiveRgb
		}

		const isLandmass = continentValue > 0.04
		if (!isLitDaySide) {
			return isLandmass ? midtoneRgb : deepShadowRgb
		}
		return isLandmass ? highlightRgb : midtoneRgb
	}

	if (spec.celestialClass === 'emissive') {
		const tectonicNoise = sampleSimplexNoise2D(
			normalizedX * 3.8,
			normalizedY * 3.8,
			spec.seed + 31,
		)
		const ridgeFactor = 1 - Math.abs(tectonicNoise)
		const secondaryCrack =
			1 -
			Math.abs(
				sampleSimplexNoise2D(
					normalizedX * 6.5 + 4,
					normalizedY * 6.5 - 3,
					spec.seed + 99,
				),
			)

		if (ridgeFactor > 0.86 || (ridgeFactor > 0.74 && secondaryCrack > 0.82)) {
			return emissiveRgb
		}
		if (ridgeFactor > 0.72) {
			return highlightRgb
		}
		return isLitDaySide ? midtoneRgb : deepShadowRgb
	}

	const turbulence = sampleSimplexNoise2D(
		normalizedX * 2.5,
		normalizedY * 5.0,
		spec.seed + 205,
	)
	const latitudeBand = Math.sin((normalizedY + turbulence * 0.14) * Math.PI * 5.5)
	const stormDistance = Math.hypot(normalizedX - 0.22, (normalizedY - 0.18) * 1.8)

	if (stormDistance < 0.22) {
		return isLitDaySide ? emissiveRgb : highlightRgb
	}
	if (!isLitDaySide) {
		return latitudeBand > 0 ? midtoneRgb : deepShadowRgb
	}
	if (latitudeBand > 0.45) {
		return emissiveRgb
	}
	if (latitudeBand > -0.15) {
		return highlightRgb
	}
	return midtoneRgb
}

function computeSilhouetteRadius(
	spec: ProceduralPlanetSpec,
	offsetX: number,
	offsetY: number,
	baseRadius: number,
): number {
	if (spec.celestialClass !== 'asteroid') {
		return baseRadius
	}

	const angle = Math.atan2(offsetY, offsetX)
	const lobeA = Math.cos(angle * 3 + (spec.seed % 7)) * 4.5
	const lobeB = Math.sin(angle * 5 + (spec.seed % 13)) * 2.8
	const facetNoise = sampleSimplexNoise2D(
		Math.cos(angle) * 1.6,
		Math.sin(angle) * 1.6,
		spec.seed,
	)
	return baseRadius - 6 + lobeA + lobeB + facetNoise * 3.5
}

function evaluateGasGiantRing(
	offsetX: number,
	offsetY: number,
	cosineTilt: number,
	sineTilt: number,
	planetRadius: number,
	pixelX: number,
	pixelY: number,
	enableDithering: boolean,
): {
	inRing: boolean
	isBehindPlanet: boolean
	bandIndex: 0 | 1 | 2
	alpha: number
} {
	const rotatedX = offsetX * cosineTilt + offsetY * sineTilt
	const rotatedY = -offsetX * sineTilt + offsetY * cosineTilt
	const aspectRatio = 3.2
	const ellipticalRadius = Math.hypot(rotatedX, rotatedY * aspectRatio)

	const innerRadius = planetRadius * 1.18
	const outerRadius = planetRadius * 1.62
	if (ellipticalRadius < innerRadius || ellipticalRadius > outerRadius) {
		return {
			inRing: false,
			isBehindPlanet: false,
			bandIndex: 0,
			alpha: 0,
		}
	}

	const normalizedRingPosition =
		(ellipticalRadius - innerRadius) / (outerRadius - innerRadius)
	if (normalizedRingPosition > 0.52 && normalizedRingPosition < 0.62) {
		return {
			inRing: false,
			isBehindPlanet: false,
			bandIndex: 0,
			alpha: 0,
		}
	}

	if (
		enableDithering &&
		!shouldApplyBayerDither(Math.floor(pixelX / 2), Math.floor(pixelY / 2), 0.75)
	) {
		return {
			inRing: false,
			isBehindPlanet: false,
			bandIndex: 0,
			alpha: 0,
		}
	}

	const isBehindPlanet = rotatedY < 0
	const bandIndex: 0 | 1 | 2 =
		normalizedRingPosition < 0.25
			? 2
			: normalizedRingPosition < 0.52
				? 0
				: 1

	return {
		inRing: true,
		isBehindPlanet,
		bandIndex,
		alpha: 235,
	}
}

function resolveEmissiveSubType(
	biomeId: BiomePaletteId,
	randomGenerator: () => number,
): EmissiveSubType {
	if (biomeId === 'urgent') {
		return 'volcanic'
	}
	if (biomeId === 'engineering') {
		return 'cryo'
	}
	if (biomeId === 'growth') {
		return 'bioluminescent'
	}
	const roll = randomGenerator()
	if (roll < 0.34) return 'cryo'
	if (roll < 0.67) return 'bioluminescent'
	return 'volcanic'
}

function matchesAnyKeyword(text: string, keywords: string[]): boolean {
	for (const keyword of keywords) {
		if (text.includes(keyword)) {
			return true
		}
	}
	return false
}

function parseHexToRgb(hexColor: string): {
	red: number
	green: number
	blue: number
} {
	const cleaned = (hexColor || '').replace('#', '').trim()
	if (cleaned.length !== 6) {
		return { red: 69, green: 217, blue: 253 }
	}
	const numericValue = Number.parseInt(cleaned, 16)
	if (Number.isNaN(numericValue)) {
		return { red: 69, green: 217, blue: 253 }
	}
	return {
		red: (numericValue >> 16) & 255,
		green: (numericValue >> 8) & 255,
		blue: numericValue & 255,
	}
}

function writePixel(
	buffer: Uint8ClampedArray,
	pixelX: number,
	pixelY: number,
	resolution: number,
	rgb: { red: number; green: number; blue: number },
	alpha: number,
): void {
	const offset = (pixelY * resolution + pixelX) * 4
	if (alpha >= 255 || buffer[offset + 3] === 0) {
		buffer[offset] = rgb.red
		buffer[offset + 1] = rgb.green
		buffer[offset + 2] = rgb.blue
		buffer[offset + 3] = alpha
	} else {
		const blendFactor = alpha / 255
		buffer[offset] = Math.round(
			buffer[offset] * (1 - blendFactor) + rgb.red * blendFactor,
		)
		buffer[offset + 1] = Math.round(
			buffer[offset + 1] * (1 - blendFactor) + rgb.green * blendFactor,
		)
		buffer[offset + 2] = Math.round(
			buffer[offset + 2] * (1 - blendFactor) + rgb.blue * blendFactor,
		)
		buffer[offset + 3] = Math.min(255, buffer[offset + 3] + alpha)
	}
}

function createCanvasFromPixelBuffer(
	pixelBuffer: Uint8ClampedArray,
	resolution: number,
): HTMLCanvasElement | null {
	if (typeof document === 'undefined') {
		return null
	}
	try {
		const canvas = document.createElement('canvas')
		canvas.width = resolution
		canvas.height = resolution
		const context = canvas.getContext('2d')
		if (!context) {
			return null
		}
		const imageData = context.createImageData(resolution, resolution)
		imageData.data.set(pixelBuffer)
		context.putImageData(imageData, 0, 0)
		return canvas
	} catch {
		return null
	}
}
