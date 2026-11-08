import type { StarRole, Todo } from '../db'
import {
	type StarPointsThemeId,
	resolveStarPointCelestialPalette,
} from '../theme/starPointsThemes'
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

export const CELESTIAL_POINT_TIERS = [1, 2, 3, 5, 8, 13] as const

export const CELESTIAL_CLASS_LABELS: Record<CelestialClass, string> = {
	asteroid: 'Asteroid',
	dwarf_planet: 'Dwarf Planet',
	terrestrial: 'Medium Planet',
	gas_giant: 'Gas Giant',
	star: 'Star',
	black_hole: 'Black Hole',
}

interface CachedPlanetEntry {
	canvas: HTMLCanvasElement | null
	pixelBuffer: Uint8ClampedArray
	bakeDurationMilliseconds: number
}

const planetBitmapCache = new Map<string, CachedPlanetEntry>()
const additiveGlowCache = new Map<string, HTMLCanvasElement>()

export function resolveCelestialClass(starPoints?: number): CelestialClass {
	if (
		starPoints === undefined ||
		!Number.isFinite(starPoints) ||
		starPoints <= 1
	) {
		return 'asteroid'
	}
	const clampedPoints = Math.min(13, Math.max(1, Math.round(starPoints)))
	if (clampedPoints === 2) {
		return 'dwarf_planet'
	}
	if (clampedPoints <= 4) {
		return 'terrestrial'
	}
	if (clampedPoints <= 7) {
		return 'gas_giant'
	}
	if (clampedPoints <= 12) {
		return 'star'
	}
	return 'black_hole'
}

export function resolveBiomePalette(
	todo: Pick<Todo, 'id' | 'starPoints' | 'starRole'>,
	_starRole?: StarRole,
	_starRoleGroupTitle?: string,
	themeId?: StarPointsThemeId,
): BiomePalette {
	return resolveStarPointCelestialPalette(todo?.starPoints, themeId)
}

export function generateProceduralPlanetSpec({
	todo,
	celestialClassOverride,
	biomeOverride,
	themeId,
}: {
	todo: Pick<Todo, 'id' | 'title' | 'starPoints' | 'starRole'>
	starRole?: StarRole
	starRoleGroupTitle?: string
	celestialClassOverride?: CelestialClass
	biomeOverride?: BiomePaletteId
	themeId?: StarPointsThemeId
}): ProceduralPlanetSpec {
	const safeId = todo.id || todo.title || 'starfocus-planet'
	const seed = hashStringToSeed(safeId)
	const randomGenerator = createSeededRandom(seed)

	const safeStarPoints =
		typeof todo.starPoints === 'number' && Number.isFinite(todo.starPoints)
			? Math.max(1, Math.min(13, Math.round(todo.starPoints)))
			: 1

	const celestialClass =
		celestialClassOverride ?? resolveCelestialClass(safeStarPoints)

	const palette = biomeOverride
		? BIOME_PALETTES[biomeOverride]
		: resolveStarPointCelestialPalette(safeStarPoints, themeId)

	const emissiveSubType = resolveEmissiveSubType(palette.id, randomGenerator)
	const craterCount =
		celestialClass === 'asteroid'
			? 5 + Math.floor(randomGenerator() * 4)
			: celestialClass === 'dwarf_planet'
				? 6 + Math.floor(randomGenerator() * 4)
				: 2 + Math.floor(randomGenerator() * 3)

	const maxCraterRadialOffset =
		celestialClass === 'asteroid'
			? 13
			: celestialClass === 'dwarf_planet'
				? 19
				: 22

	const craters: CraterStamp[] = Array.from({ length: craterCount }, () => {
		const angle = randomGenerator() * Math.PI * 2
		const distance = randomGenerator() * maxCraterRadialOffset
		return {
			centerX: Math.cos(angle) * distance,
			centerY: Math.sin(angle) * distance,
			radius:
				celestialClass === 'asteroid'
					? 3 + randomGenerator() * 4.5
					: 3.5 + randomGenerator() * 6,
			depth: 0.45 + randomGenerator() * 0.45,
		}
	})

	const continentFrequency = 2.1 + randomGenerator() * 1.8
	const cloudCoverage = 0.25 + randomGenerator() * 0.45
	const ringTiltDegrees =
		Math.round(((randomGenerator() * 32 - 16) || 14) * 10) / 10
	const hasRings =
		celestialClass === 'gas_giant' || celestialClass === 'black_hole'

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
	}
}

export function bakePlanetBitmap(
	spec: ProceduralPlanetSpec,
	options?: { enableDithering?: boolean },
): {
	canvas: HTMLCanvasElement | null
	pixelBuffer: Uint8ClampedArray
	rgbaPixels: Uint8ClampedArray
	metrics: PlanetBakeMetrics
} {
	const enableDithering = options?.enableDithering ?? true
	const cacheKey = `${spec.seed}:${spec.celestialClass}:${spec.palette.highlight}:${spec.palette.midtone}:${spec.ringTiltDegrees}:${enableDithering ? 1 : 0}`

	const existingEntry = planetBitmapCache.get(cacheKey)
	if (existingEntry) {
		return {
			canvas: existingEntry.canvas,
			pixelBuffer: existingEntry.pixelBuffer,
			rgbaPixels: existingEntry.pixelBuffer,
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
		rgbaPixels: pixelBuffer,
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
	gradient.addColorStop(
		0.45,
		`rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0.22)`,
	)
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
	if (spec.celestialClass === 'black_hole') {
		return renderBlackHolePixels(spec, enableDithering)
	}
	if (spec.celestialClass === 'star') {
		return renderStarPixels(spec, enableDithering)
	}

	const resolution = PLANET_BITMAP_RESOLUTION
	const buffer = new Uint8ClampedArray(resolution * resolution * 4)
	const center = resolution / 2

	const baseRadius =
		spec.celestialClass === 'asteroid'
			? 22
			: spec.celestialClass === 'dwarf_planet'
				? 29
				: spec.celestialClass === 'terrestrial'
					? 38
					: 36

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

			if (spec.celestialClass === 'gas_giant') {
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
					writePixel(
						buffer,
						pixelX,
						pixelY,
						resolution,
						ringColor,
						ringSample.alpha,
					)
				}
			}

			const localRadius = computeSilhouetteRadius(
				spec,
				offsetX,
				offsetY,
				baseRadius,
			)

			if (radialDistance <= localRadius + 1.8) {
				if (radialDistance >= localRadius) {
					const edgeAlpha = Math.max(
						0,
						Math.min(255, Math.round((localRadius + 1.8 - radialDistance) * 190)),
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
						Math.max(
							0,
							1 - normalizedX * normalizedX - normalizedY * normalizedY,
						),
					)

					const lightDirectionX = -0.58
					const lightDirectionY = -0.52
					const lightDirectionZ = 0.62
					const rawLambert =
						normalizedX * lightDirectionX +
						normalizedY * lightDirectionY +
						normalizedZ * lightDirectionZ
					const normalizedLight = Math.max(
						0,
						Math.min(1, (rawLambert + 0.25) / 1.15),
					)

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

			if (spec.celestialClass === 'gas_giant') {
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
								: midtoneRgb
					writePixel(
						buffer,
						pixelX,
						pixelY,
						resolution,
						ringColor,
						ringSample.alpha,
					)
				}
			}
		}
	}

	return buffer
}

function renderStarPixels(
	spec: ProceduralPlanetSpec,
	enableDithering: boolean,
): Uint8ClampedArray {
	const resolution = PLANET_BITMAP_RESOLUTION
	const buffer = new Uint8ClampedArray(resolution * resolution * 4)
	const center = resolution / 2
	const starRadius = 35
	const coronaOuterRadius = 60

	const midtoneRgb = parseHexToRgb(spec.palette.midtone)
	const highlightRgb = parseHexToRgb(spec.palette.highlight)
	const emissiveRgb = parseHexToRgb(spec.palette.emissiveOrAtmos)
	const whiteCoreRgb = {
		red: Math.min(255, Math.round((emissiveRgb.red + 255) / 2)),
		green: Math.min(255, Math.round((emissiveRgb.green + 255) / 2)),
		blue: Math.min(255, Math.round((emissiveRgb.blue + 255) / 2)),
	}

	for (let pixelY = 0; pixelY < resolution; pixelY++) {
		for (let pixelX = 0; pixelX < resolution; pixelX++) {
			const offsetX = pixelX - center + 0.5
			const offsetY = pixelY - center + 0.5
			const radialDistance = Math.hypot(offsetX, offsetY)
			const angle = Math.atan2(offsetY, offsetX)

			if (radialDistance <= starRadius) {
				const normalizedX = offsetX / starRadius
				const normalizedY = offsetY / starRadius
				const normalizedZ = Math.sqrt(
					Math.max(0, 1 - normalizedX * normalizedX - normalizedY * normalizedY),
				)

				const granulation = sampleFractalNoise2D(
					normalizedX * 6.5 + 2.3,
					normalizedY * 6.5 - 1.7,
					spec.seed + 41,
					3,
				)
				const sunspotNoise = sampleSimplexNoise2D(
					normalizedX * 3.2 - 1.1,
					normalizedY * 3.2 + 0.8,
					spec.seed + 113,
				)
				const heatFactor =
					normalizedZ * 0.78 + (granulation * 0.5 + 0.5) * 0.34
				const cellX = Math.floor(pixelX / 2)
				const cellY = Math.floor(pixelY / 2)

				let pixelColor = highlightRgb
				if (sunspotNoise > 0.72 && normalizedZ > 0.35) {
					pixelColor = midtoneRgb
				} else if (
					heatFactor > 0.78 ||
					(enableDithering &&
						heatFactor > 0.62 &&
						shouldApplyBayerDither(cellX, cellY, (heatFactor - 0.55) * 2.5))
				) {
					pixelColor = whiteCoreRgb
				} else if (
					heatFactor > 0.52 ||
					(enableDithering &&
						shouldApplyBayerDither(cellX, cellY, heatFactor * 1.2))
				) {
					pixelColor = emissiveRgb
				} else if (normalizedZ < 0.22) {
					pixelColor = midtoneRgb
				}

				writePixel(buffer, pixelX, pixelY, resolution, pixelColor, 255)
			} else if (radialDistance <= coronaOuterRadius) {
				const normalizedCorona =
					(radialDistance - starRadius) / (coronaOuterRadius - starRadius)
				const flareNoise = sampleSimplexNoise2D(
					Math.cos(angle) * 3.2,
					Math.sin(angle) * 3.2,
					spec.seed + 19,
				)
				const cardinalSpike = Math.max(
					Math.pow(Math.abs(Math.cos(angle * 2)), 14),
					Math.pow(Math.abs(Math.sin(angle * 2 + 0.78)), 18) * 0.65,
				)
				const prominenceReach =
					0.32 + Math.max(0, flareNoise) * 0.42 + cardinalSpike * 0.55

				if (normalizedCorona < prominenceReach) {
					const falloff = 1 - normalizedCorona / prominenceReach
					const coronaColor =
						normalizedCorona < 0.16
							? whiteCoreRgb
							: normalizedCorona < 0.42
								? emissiveRgb
								: highlightRgb
					const alpha = Math.round(
						Math.min(255, Math.pow(falloff, 1.45) * 235),
					)
					if (alpha > 8) {
						writePixel(buffer, pixelX, pixelY, resolution, coronaColor, alpha)
					}
				}
			}
		}
	}

	return buffer
}

function renderBlackHolePixels(
	spec: ProceduralPlanetSpec,
	enableDithering: boolean,
): Uint8ClampedArray {
	const resolution = PLANET_BITMAP_RESOLUTION
	const buffer = new Uint8ClampedArray(resolution * resolution * 4)
	const center = resolution / 2

	const horizonRadius = 19.5
	const photonRingInner = 19.8
	const photonRingOuter = 23.2
	const lensedHaloOuter = 35

	const voidBlackRgb = { red: 3, green: 3, blue: 8 }
	const deepShadowRgb = parseHexToRgb(spec.palette.deepShadow)
	const midtoneRgb = parseHexToRgb(spec.palette.midtone)
	const highlightRgb = parseHexToRgb(spec.palette.highlight)
	const emissiveRgb = parseHexToRgb(spec.palette.emissiveOrAtmos)
	const whiteHotRgb = {
		red: Math.min(255, Math.round((emissiveRgb.red + 255) / 2)),
		green: Math.min(255, Math.round((emissiveRgb.green + 255) / 2)),
		blue: Math.min(255, Math.round((emissiveRgb.blue + 255) / 2)),
	}

	const tiltRadians = ((spec.ringTiltDegrees || -14) * Math.PI) / 180
	const cosineTilt = Math.cos(tiltRadians)
	const sineTilt = Math.sin(tiltRadians)

	for (let pixelY = 0; pixelY < resolution; pixelY++) {
		for (let pixelX = 0; pixelX < resolution; pixelX++) {
			const offsetX = pixelX - center + 0.5
			const offsetY = pixelY - center + 0.5
			const radialDistance = Math.hypot(offsetX, offsetY)

			const rotatedX = offsetX * cosineTilt + offsetY * sineTilt
			const rotatedY = -offsetX * sineTilt + offsetY * cosineTilt

			const diskSample = evaluateAccretionDiskSample({
				rotatedX,
				rotatedY,
				radialDistance,
				horizonRadius,
				pixelX,
				pixelY,
				seed: spec.seed,
				enableDithering,
			})

			if (radialDistance >= photonRingOuter && radialDistance <= lensedHaloOuter) {
				const verticalArchFactor = Math.abs(rotatedY) / radialDistance
				if (verticalArchFactor > 0.36) {
					const archProgress =
						(radialDistance - photonRingOuter) /
						(lensedHaloOuter - photonRingOuter)
					const archIntensity =
						(1 - archProgress) * Math.pow(verticalArchFactor, 1.3)
					if (archIntensity > 0.14) {
						const lensedColor =
							archProgress < 0.25
								? whiteHotRgb
								: archProgress < 0.6
									? emissiveRgb
									: highlightRgb
						const alpha = Math.min(255, Math.round(archIntensity * 235))
						writePixel(buffer, pixelX, pixelY, resolution, lensedColor, alpha)
					}
				}
			}

			if (diskSample.inDisk && diskSample.isBackHalf) {
				const diskColor = selectAccretionColor(
					diskSample.temperature,
					whiteHotRgb,
					emissiveRgb,
					highlightRgb,
					midtoneRgb,
				)
				writePixel(
					buffer,
					pixelX,
					pixelY,
					resolution,
					diskColor,
					diskSample.alpha,
				)
			}

			if (radialDistance <= horizonRadius) {
				writePixel(buffer, pixelX, pixelY, resolution, voidBlackRgb, 255)
			} else if (radialDistance <= photonRingOuter) {
				const ringPos =
					(radialDistance - photonRingInner) /
					(photonRingOuter - photonRingInner)
				const dopplerBoost = rotatedX < 0 ? 1.15 : 0.85
				const ringColor =
					ringPos < 0.45 && dopplerBoost > 0.9
						? whiteHotRgb
						: ringPos < 0.78
							? emissiveRgb
							: highlightRgb
				writePixel(buffer, pixelX, pixelY, resolution, ringColor, 255)
			} else if (radialDistance <= photonRingOuter + 2.2) {
				writePixel(buffer, pixelX, pixelY, resolution, deepShadowRgb, 150)
			}

			if (diskSample.inDisk && !diskSample.isBackHalf) {
				const diskColor = selectAccretionColor(
					diskSample.temperature,
					whiteHotRgb,
					emissiveRgb,
					highlightRgb,
					midtoneRgb,
				)
				writePixel(
					buffer,
					pixelX,
					pixelY,
					resolution,
					diskColor,
					diskSample.alpha,
				)
			}
		}
	}

	return buffer
}

function evaluateAccretionDiskSample({
	rotatedX,
	rotatedY,
	radialDistance,
	horizonRadius,
	pixelX,
	pixelY,
	seed,
	enableDithering,
}: {
	rotatedX: number
	rotatedY: number
	radialDistance: number
	horizonRadius: number
	pixelX: number
	pixelY: number
	seed: number
	enableDithering: boolean
}): {
	inDisk: boolean
	isBackHalf: boolean
	temperature: number
	alpha: number
} {
	const aspectRatio = 3.8
	const diskWarpY =
		rotatedY < 0
			? rotatedY * 0.76 -
				Math.exp(-Math.abs(rotatedX) / 22) * 4.5
			: rotatedY * 1.05
	const ellipticalRadius = Math.hypot(rotatedX, diskWarpY * aspectRatio)
	const innerDisk = horizonRadius * 1.15
	const outerDisk = 60

	if (ellipticalRadius < innerDisk || ellipticalRadius > outerDisk) {
		return {
			inDisk: false,
			isBackHalf: false,
			temperature: 0,
			alpha: 0,
		}
	}

	const normalizedDisk =
		(ellipticalRadius - innerDisk) / (outerDisk - innerDisk)
	const spiralAngle = Math.atan2(diskWarpY * aspectRatio, rotatedX)
	const spiralNoise = sampleSimplexNoise2D(
		Math.cos(spiralAngle * 2 + normalizedDisk * 6) * 2.1,
		Math.sin(spiralAngle * 2 + normalizedDisk * 6) * 2.1,
		seed + 67,
	)

	const dopplerBeaming = rotatedX < 0 ? 0.24 : -0.14
	const radialHeat = 1 - normalizedDisk
	const temperature = Math.max(
		0,
		Math.min(1, radialHeat * 0.85 + spiralNoise * 0.2 + dopplerBeaming),
	)

	if (
		enableDithering &&
		normalizedDisk > 0.72 &&
		!shouldApplyBayerDither(
			Math.floor(pixelX / 2),
			Math.floor(pixelY / 2),
			(1 - normalizedDisk) * 3.2,
		)
	) {
		return {
			inDisk: false,
			isBackHalf: false,
			temperature: 0,
			alpha: 0,
		}
	}

	const edgeFade =
		normalizedDisk > 0.78 ? (1 - normalizedDisk) / 0.22 : 1
	const alpha = Math.max(0, Math.min(255, Math.round(edgeFade * 245)))

	return {
		inDisk: radialDistance > horizonRadius * 0.72,
		isBackHalf: rotatedY < 0,
		temperature,
		alpha,
	}
}

function selectAccretionColor(
	temperature: number,
	whiteHotRgb: { red: number; green: number; blue: number },
	emissiveRgb: { red: number; green: number; blue: number },
	highlightRgb: { red: number; green: number; blue: number },
	midtoneRgb: { red: number; green: number; blue: number },
): { red: number; green: number; blue: number } {
	if (temperature > 0.76) {
		return whiteHotRgb
	}
	if (temperature > 0.52) {
		return emissiveRgb
	}
	if (temperature > 0.28) {
		return highlightRgb
	}
	return midtoneRgb
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

		const facetRidge = sampleSimplexNoise2D(
			normalizedX * 3.1,
			normalizedY * 3.1,
			spec.seed + 13,
		)

		if (craterShade === 1 && isLitDaySide) {
			return emissiveRgb
		}
		if (craterShade === -1 || !isLitDaySide) {
			return deepShadowRgb
		}
		return normalizedLight + facetRidge * 0.2 > 0.66
			? highlightRgb
			: midtoneRgb
	}

	if (spec.celestialClass === 'dwarf_planet') {
		let craterEffect: 'rim' | 'floor' | 'none' = 'none'
		for (const crater of spec.craters) {
			const deltaX = offsetX - crater.centerX
			const deltaY = offsetY - crater.centerY
			const distanceToCrater = Math.hypot(deltaX, deltaY)
			if (distanceToCrater < crater.radius) {
				const ratio = distanceToCrater / crater.radius
				if (ratio > 0.74) {
					craterEffect = 'rim'
				} else {
					craterEffect = 'floor'
				}
				break
			}
		}

		const basinNoise = sampleFractalNoise2D(
			normalizedX * 2.4 + 0.5,
			normalizedY * 2.4 - 0.4,
			spec.seed + 53,
			3,
		)
		const polarFrost = Math.abs(normalizedY) > 0.78

		if (craterEffect === 'rim' && isLitDaySide) {
			return emissiveRgb
		}
		if (craterEffect === 'floor') {
			return isLitDaySide ? midtoneRgb : deepShadowRgb
		}
		if (polarFrost && isLitDaySide) {
			return emissiveRgb
		}
		if (!isLitDaySide) {
			return basinNoise > 0.15 ? midtoneRgb : deepShadowRgb
		}
		if (basinNoise > 0.28) {
			return emissiveRgb
		}
		return basinNoise > -0.1 ? highlightRgb : midtoneRgb
	}

	if (spec.celestialClass === 'terrestrial') {
		const fresnelRim = normalizedZ < 0.26
		if (fresnelRim && isLitDaySide) {
			return emissiveRgb
		}

		if (Math.abs(normalizedY) > 0.82 && isLitDaySide) {
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

		const isLandmass = continentValue > 0.02
		if (!isLitDaySide) {
			return isLandmass ? midtoneRgb : deepShadowRgb
		}
		return isLandmass ? highlightRgb : midtoneRgb
	}

	const turbulence = sampleSimplexNoise2D(
		normalizedX * 2.5,
		normalizedY * 5.0,
		spec.seed + 205,
	)
	const latitudeBand = Math.sin(
		(normalizedY + turbulence * 0.14) * Math.PI * 5.5,
	)
	const stormDistance = Math.hypot(
		normalizedX - 0.22,
		(normalizedY - 0.18) * 1.8,
	)

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
	const lobeA = Math.cos(angle * 3 + (spec.seed % 7)) * 3.8
	const lobeB = Math.sin(angle * 5 + (spec.seed % 13)) * 2.4
	const facetNoise = sampleSimplexNoise2D(
		Math.cos(angle) * 1.8,
		Math.sin(angle) * 1.8,
		spec.seed,
	)
	return baseRadius + lobeA + lobeB + facetNoise * 3.2
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
	const outerRadius = planetRadius * 1.66
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
		!shouldApplyBayerDither(
			Math.floor(pixelX / 2),
			Math.floor(pixelY / 2),
			0.75,
		)
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
		return
	}

	const sourceFactor = alpha / 255
	const destinationFactor = 1 - sourceFactor
	buffer[offset] = Math.round(
		rgb.red * sourceFactor + buffer[offset] * destinationFactor,
	)
	buffer[offset + 1] = Math.round(
		rgb.green * sourceFactor + buffer[offset + 1] * destinationFactor,
	)
	buffer[offset + 2] = Math.round(
		rgb.blue * sourceFactor + buffer[offset + 2] * destinationFactor,
	)
	buffer[offset + 3] = Math.min(
		255,
		Math.round(alpha + buffer[offset + 3] * destinationFactor),
	)
}

function createCanvasFromPixelBuffer(
	pixelBuffer: Uint8ClampedArray,
	resolution: number,
): HTMLCanvasElement | null {
	if (typeof document === 'undefined') {
		return null
	}
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
}
