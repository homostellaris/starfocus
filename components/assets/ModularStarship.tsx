'use client'

import React from 'react'
import {
	paintModularShipToContext,
	resolveShipLoadout,
} from './shipAssembler'
import type {
	BatteryPerformanceTier,
	ShipLoadoutConfig,
} from './types'

export default function ModularStarship({
	loadout,
	size = 56,
	rotationDegrees = 0,
	thrusterActive = true,
	thrusterFrame = 0,
	hardpointRecoilOffsetPx = 0,
	hudMode = 'none',
	batteryTier = 'active',
	explodedLayerSpacingPx = 0,
	onDoubleClick,
	className = '',
}: {
	loadout?: Partial<ShipLoadoutConfig>
	size?: number
	rotationDegrees?: number
	thrusterActive?: boolean
	thrusterFrame?: number
	hardpointRecoilOffsetPx?: number
	hudMode?: 'none' | 'productivity' | 'arcade'
	batteryTier?: BatteryPerformanceTier
	explodedLayerSpacingPx?: number
	onDoubleClick?: React.MouseEventHandler<HTMLDivElement>
	className?: string
}) {
	const resolvedLoadout = resolveShipLoadout(loadout)
	const safeSize =
		typeof size === 'number' && Number.isFinite(size) && size > 0 ? size : 56
	const safeRecoil = Math.max(
		0,
		Math.min(
			6,
			Number.isFinite(hardpointRecoilOffsetPx) ? hardpointRecoilOffsetPx : 0,
		),
	)

	return (
		<div
			data-testid="modular-starship"
			data-hull-archetype={resolvedLoadout.hullArchetype}
			data-wing-archetype={resolvedLoadout.wingArchetype}
			data-cockpit-archetype={resolvedLoadout.cockpitArchetype}
			data-hardpoint-archetype={resolvedLoadout.hardpointArchetype}
			data-thruster-type={resolvedLoadout.thrusterType}
			data-hud-mode={hudMode}
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
				width={64}
				height={64}
				className="h-full w-full"
				ref={canvasElement => {
					if (!canvasElement) return
					const context = canvasElement.getContext('2d')
					if (!context) return
					context.clearRect(0, 0, 64, 64)
					paintModularShipToContext({
						context,
						loadout: resolvedLoadout,
						recoilOffsetPx: safeRecoil,
						thrusterFrame,
						thrusterActive,
						explodedLayerSpacingPx,
					})
				}}
			/>
		</div>
	)
}
