'use client'

import React from 'react'
import {
	type StarPointsThemeId,
	getActiveStarPointsThemeId,
} from '../theme/starPointsThemes'
import { getAdditiveGlowBitmap } from './planetGenerator'
import {
	STARSHIP_BITMAP_RESOLUTION,
	bakeStarshipBitmap,
	resolveShipLoadout,
} from './shipAssembler'
import type { BatteryPerformanceTier, ShipLoadoutConfig } from './types'

export interface ModularStarshipProps {
	loadout?: Partial<ShipLoadoutConfig>
	themeId?: StarPointsThemeId
	size?: number
	rotationDegrees?: number
	thrusterActive?: boolean
	thrusterFrame?: number
	hardpointRecoilOffsetPx?: number
	enableDithering?: boolean
	batteryTier?: BatteryPerformanceTier
	onDoubleClick?: React.MouseEventHandler<HTMLDivElement>
	className?: string
}

export default function ModularStarship({
	loadout,
	themeId,
	size = 56,
	rotationDegrees = 0,
	thrusterActive = true,
	thrusterFrame = 0,
	hardpointRecoilOffsetPx = 0,
	enableDithering = true,
	batteryTier = 'active',
	onDoubleClick,
	className = '',
}: ModularStarshipProps) {
	const resolvedThemeId = themeId ?? getActiveStarPointsThemeId()
	const resolvedLoadout = resolveShipLoadout(loadout, resolvedThemeId)
	const safeSize =
		typeof size === 'number' && Number.isFinite(size) && size > 0 ? size : 56
	const safeRecoil = Math.max(
		0,
		Math.min(
			6,
			Number.isFinite(hardpointRecoilOffsetPx) ? hardpointRecoilOffsetPx : 0,
		),
	)

	const bakeResult = bakeStarshipBitmap(resolvedLoadout, {
		recoilOffsetPx: safeRecoil,
		thrusterFrame,
		thrusterActive,
		enableDithering,
		themeId: resolvedThemeId,
	})

	return (
		<div
			data-testid="modular-starship"
			data-hull-archetype={resolvedLoadout.hullArchetype}
			data-skin-id={resolvedLoadout.skinId}
			data-star-theme={resolvedThemeId}
			data-thruster-type={resolvedLoadout.thrusterType}
			data-battery-tier={batteryTier}
			data-recoil-offset={safeRecoil}
			onDoubleClick={onDoubleClick}
			className={`relative inline-flex items-center justify-center select-none ${className}`}
			style={{
				width: `${safeSize}px`,
				height: `${safeSize}px`,
				transform: rotationDegrees
					? `rotate(${rotationDegrees}deg)`
					: undefined,
			}}
		>
			<canvas
				width={STARSHIP_BITMAP_RESOLUTION}
				height={STARSHIP_BITMAP_RESOLUTION}
				className="h-full w-full"
				ref={canvasElement => {
					if (!canvasElement) return
					paintModularStarshipCanvas({
						canvasElement,
						loadout: resolvedLoadout,
						bakedCanvas: bakeResult.canvas,
						thrusterActive,
					})
				}}
			/>
		</div>
	)
}

export function paintModularStarshipCanvas({
	canvasElement,
	loadout,
	bakedCanvas,
	thrusterActive,
}: {
	canvasElement: HTMLCanvasElement
	loadout: ShipLoadoutConfig
	bakedCanvas: HTMLCanvasElement | null
	thrusterActive: boolean
}): void {
	const context = canvasElement.getContext('2d')
	if (!context) return

	context.clearRect(
		0,
		0,
		STARSHIP_BITMAP_RESOLUTION,
		STARSHIP_BITMAP_RESOLUTION,
	)

	if (thrusterActive) {
		const plumeGlow = getAdditiveGlowBitmap(loadout.palette.thrusterPlume, 64)
		if (plumeGlow) {
			context.save()
			context.globalCompositeOperation = 'lighter'
			context.drawImage(plumeGlow, 22, 54, 84, 72)
			context.restore()
		}
	}

	if (
		loadout.hullArchetype === 'science_helios_mk1' ||
		loadout.hullArchetype === 'valkyrie_crescent_mk1'
	) {
		const coreGlow = getAdditiveGlowBitmap(loadout.palette.cockpitGlow, 64)
		if (coreGlow) {
			context.save()
			context.globalCompositeOperation = 'lighter'
			context.drawImage(coreGlow, 28, 22, 72, 72)
			context.restore()
		}
	}

	if (bakedCanvas) {
		context.drawImage(
			bakedCanvas,
			0,
			0,
			STARSHIP_BITMAP_RESOLUTION,
			STARSHIP_BITMAP_RESOLUTION,
		)
	}
}
