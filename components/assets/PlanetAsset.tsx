'use client'

import React from 'react'
import type { StarRole, Todo } from '../db'
import {
	bakePlanetBitmap,
	generateProceduralPlanetSpec,
	getAdditiveGlowBitmap,
} from './planetGenerator'
import type {
	BiomePaletteId,
	CelestialClass,
	PlanetBakeMetrics,
	ProceduralPlanetSpec,
} from './types'

export interface CelestialBodyProps {
	todo: Pick<Todo, 'id' | 'title' | 'starPoints' | 'starRole'>
	starRole?: StarRole
	starRoleGroupTitle?: string
	size?: number
	enableDithering?: boolean
	enableAtmosphereGlow?: boolean
	celestialClassOverride?: CelestialClass
	biomeOverride?: BiomePaletteId
	onBakeMetrics?: (metrics: PlanetBakeMetrics) => void
	className?: string
	slot?: string
}

export function CelestialBody({
	todo,
	starRole,
	starRoleGroupTitle,
	size = 32,
	enableDithering = true,
	enableAtmosphereGlow = true,
	celestialClassOverride,
	biomeOverride,
	onBakeMetrics,
	className = '',
	slot,
}: CelestialBodyProps) {
	const spec = generateProceduralPlanetSpec({
		todo,
		starRole,
		starRoleGroupTitle,
		celestialClassOverride,
		biomeOverride,
	})

	const bakeResult = bakePlanetBitmap(spec, { enableDithering })
	onBakeMetrics?.(bakeResult.metrics)

	const safeSize =
		typeof size === 'number' && Number.isFinite(size) && size > 0 ? size : 32

	return (
		<div
			slot={slot}
			data-testid="planet-asset"
			data-todo-id={spec.todoId}
			data-star-points={spec.starPoints}
			data-celestial-class={spec.celestialClass}
			data-emissive-subtype={spec.emissiveSubType}
			data-biome-id={spec.biomeId}
			data-cache-hit={String(bakeResult.metrics.cacheHit)}
			title={`${spec.title} (${spec.celestialClass} • ${spec.palette.label})`}
			className={`relative inline-flex shrink-0 items-center justify-center select-none ${className}`}
			style={{
				width: `${safeSize}px`,
				height: `${safeSize}px`,
			}}
		>
			<canvas
				width={128}
				height={128}
				className="h-full w-full"
				ref={canvasElement => {
					if (!canvasElement) return
					paintPlanetAssetCanvas({
						canvasElement,
						spec,
						bakedCanvas: bakeResult.canvas,
						enableAtmosphereGlow,
					})
				}}
			/>
		</div>
	)
}

export default CelestialBody

export function paintPlanetAssetCanvas({
	canvasElement,
	spec,
	bakedCanvas,
	enableAtmosphereGlow,
}: {
	canvasElement: HTMLCanvasElement
	spec: ProceduralPlanetSpec
	bakedCanvas: HTMLCanvasElement | null
	enableAtmosphereGlow: boolean
}): void {
	const context = canvasElement.getContext('2d')
	if (!context) return

	context.clearRect(0, 0, 128, 128)

	if (
		enableAtmosphereGlow &&
		spec.celestialClass !== 'asteroid' &&
		spec.celestialClass !== 'dwarf_planet'
	) {
		const glowColor =
			spec.celestialClass === 'star' || spec.celestialClass === 'black_hole'
				? spec.palette.emissiveOrAtmos
				: spec.palette.highlight
		const glowBitmap = getAdditiveGlowBitmap(glowColor, 64)
		if (glowBitmap) {
			context.save()
			context.globalCompositeOperation = 'lighter'
			context.drawImage(glowBitmap, 6, 6, 116, 116)
			context.restore()
		}
	}

	if (bakedCanvas) {
		context.drawImage(bakedCanvas, 0, 0, 128, 128)
	}
}
