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

export default function PlanetAsset({
	todo,
	starRole,
	starRoleGroupTitle,
	visitCount = 0,
	size = 32,
	hudMode = 'productivity',
	enableDithering = true,
	enableAtmosphereGlow = true,
	celestialClassOverride,
	biomeOverride,
	onBakeMetrics,
	className = '',
	slot,
}: {
	todo: Pick<Todo, 'id' | 'title' | 'starPoints' | 'starRole'>
	starRole?: StarRole
	starRoleGroupTitle?: string
	visitCount?: number
	size?: number
	hudMode?: 'none' | 'productivity' | 'arcade'
	enableDithering?: boolean
	enableAtmosphereGlow?: boolean
	celestialClassOverride?: CelestialClass
	biomeOverride?: BiomePaletteId
	onBakeMetrics?: (metrics: PlanetBakeMetrics) => void
	className?: string
	slot?: string
}) {
	const spec = generateProceduralPlanetSpec({
		todo,
		starRole,
		starRoleGroupTitle,
		visitCount,
		celestialClassOverride,
		biomeOverride,
	})

	const bakeResult = bakePlanetBitmap(spec, { enableDithering })
	onBakeMetrics?.(bakeResult.metrics)

	const safeSize =
		typeof size === 'number' && Number.isFinite(size) && size > 0 ? size : 32
	const reticleColor =
		hudMode === 'arcade'
			? '#FFB703'
			: hudMode === 'productivity'
				? '#38bdf8'
				: 'transparent'

	return (
		<div
			slot={slot}
			data-testid="planet-asset"
			data-todo-id={spec.todoId}
			data-celestial-class={spec.celestialClass}
			data-emissive-subtype={spec.emissiveSubType}
			data-biome-id={spec.biomeId}
			data-hud-mode={hudMode}
			data-orbiting-moons={spec.orbitingMoonCount}
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
			{hudMode !== 'none' && (
				<svg
					viewBox="0 0 100 100"
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 h-full w-full transition-colors duration-300"
				>
					{hudMode === 'productivity' ? (
						<g
							stroke={reticleColor}
							strokeWidth="2.2"
							fill="none"
							opacity="0.65"
							style={{
								transform: `rotate(${spec.hudReticleRotationDegrees}deg)`,
								transformOrigin: '50px 50px',
							}}
						>
							<path d="M 18 30 L 18 18 L 30 18" />
							<path d="M 70 18 L 82 18 L 82 30" />
							<path d="M 82 70 L 82 82 L 70 82" />
							<path d="M 30 82 L 18 82 L 18 70" />
						</g>
					) : (
						<g
							stroke={reticleColor}
							strokeWidth="2.5"
							fill="none"
							opacity="0.92"
						>
							<circle
								cx="50"
								cy="50"
								r="44"
								strokeDasharray="10 6"
							/>
							<path d="M 50 2 L 50 12 M 50 88 L 50 98 M 2 50 L 12 50 M 88 50 L 98 50" />
							<path d="M 14 24 L 14 14 L 24 14" />
							<path d="M 76 14 L 86 14 L 86 24" />
							<path d="M 86 76 L 86 86 L 76 86" />
							<path d="M 24 86 L 14 86 L 14 76" />
						</g>
					)}
				</svg>
			)}
		</div>
	)
}

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

	if (enableAtmosphereGlow && spec.celestialClass !== 'asteroid') {
		const glowColor =
			spec.celestialClass === 'emissive'
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

	if (spec.orbitingMoonCount > 0) {
		const center = 64
		const orbitRadius = spec.hasRings ? 56 : 52
		for (let moonIndex = 0; moonIndex < spec.orbitingMoonCount; moonIndex++) {
			const angleRadians =
				((spec.hudReticleRotationDegrees + moonIndex * (360 / spec.orbitingMoonCount)) *
					Math.PI) /
				180
			const moonX = center + Math.cos(angleRadians) * orbitRadius
			const moonY = center + Math.sin(angleRadians) * (orbitRadius * 0.72)

			context.beginPath()
			context.arc(moonX, moonY, 4.5, 0, Math.PI * 2)
			context.fillStyle = '#09090b'
			context.fill()

			context.beginPath()
			context.arc(moonX, moonY, 3, 0, Math.PI * 2)
			context.fillStyle = spec.palette.emissiveOrAtmos
			context.fill()
		}
	}
}
