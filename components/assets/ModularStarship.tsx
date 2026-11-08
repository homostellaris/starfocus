'use client'

import React from 'react'
import {
	SHIP_SOCKET_MANIFESTS,
	resolveShipLoadout,
} from './shipAssembler'
import type {
	BatteryPerformanceTier,
	ShipArchetypeId,
	ShipColorPalette,
	ShipLoadoutConfig,
} from './types'

export interface ModularStarshipProps {
	loadout?: Partial<ShipLoadoutConfig>
	size?: number
	rotationDegrees?: number
	thrusterActive?: boolean
	thrusterFrame?: number
	hardpointRecoilOffsetPx?: number
	batteryTier?: BatteryPerformanceTier
	onDoubleClick?: React.MouseEventHandler<HTMLDivElement>
	className?: string
}

export default function ModularStarship({
	loadout,
	size = 56,
	rotationDegrees = 0,
	thrusterActive = true,
	thrusterFrame = 0,
	hardpointRecoilOffsetPx = 0,
	batteryTier = 'active',
	onDoubleClick,
	className = '',
}: ModularStarshipProps) {
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
	const plumeStretch = 1 + (Math.abs(thrusterFrame) % 3) * 0.14
	const gradientPrefix = `ship-${resolvedLoadout.hullArchetype}-${resolvedLoadout.skinId}`
	const thrusters =
		SHIP_SOCKET_MANIFESTS[resolvedLoadout.hullArchetype].sockets.thrusters

	return (
		<div
			data-testid="modular-starship"
			data-hull-archetype={resolvedLoadout.hullArchetype}
			data-skin-id={resolvedLoadout.skinId}
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
			<svg
				viewBox="-36 -38 72 78"
				className="h-full w-full overflow-visible drop-shadow-[0_6px_14px_rgba(0,0,0,0.65)]"
				aria-hidden="true"
			>
				<defs>
					<linearGradient
						id={`${gradientPrefix}-hull-base`}
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor={resolvedLoadout.palette.hullSecondary} />
						<stop offset="55%" stopColor={resolvedLoadout.palette.hullPrimary} />
						<stop offset="100%" stopColor={resolvedLoadout.palette.outlineDark} />
					</linearGradient>
					<linearGradient
						id={`${gradientPrefix}-armor-plate`}
						x1="0%"
						y1="0%"
						x2="0%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
						<stop
							offset="28%"
							stopColor={resolvedLoadout.palette.hullHighlight}
						/>
						<stop
							offset="100%"
							stopColor={resolvedLoadout.palette.hullSecondary}
						/>
					</linearGradient>
					<linearGradient
						id={`${gradientPrefix}-canopy`}
						x1="0%"
						y1="0%"
						x2="0%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#ffffff" />
						<stop
							offset="35%"
							stopColor={resolvedLoadout.palette.cockpitGlow}
						/>
						<stop
							offset="100%"
							stopColor={resolvedLoadout.palette.accentStripe}
						/>
					</linearGradient>
					<radialGradient
						id={`${gradientPrefix}-plume`}
						cx="50%"
						cy="15%"
						r="85%"
					>
						<stop offset="0%" stopColor="#ffffff" />
						<stop
							offset="40%"
							stopColor={resolvedLoadout.palette.thrusterPlume}
							stopOpacity="0.95"
						/>
						<stop
							offset="100%"
							stopColor={resolvedLoadout.palette.thrusterPlume}
							stopOpacity="0"
						/>
					</radialGradient>
				</defs>

				{thrusterActive &&
					thrusters.map((thruster, index) => {
						const plumeScale = thruster.scale * plumeStretch
						return (
							<g
								key={index}
								transform={`translate(${thruster.x}, ${thruster.y})`}
							>
								<ellipse
									cx="0"
									cy={6 * plumeScale}
									rx={5.5 * plumeScale}
									ry={11 * plumeScale}
									fill={`url(#${gradientPrefix}-plume)`}
									opacity="0.85"
								/>
								<path
									d={`M ${-3.6 * plumeScale} -1 Q 0 ${16 * plumeScale} ${3.6 * plumeScale} -1 Z`}
									fill={resolvedLoadout.palette.thrusterPlume}
									opacity="0.92"
								/>
								<path
									d={`M ${-1.8 * plumeScale} -1 L 0 ${10 * plumeScale} L ${1.8 * plumeScale} -1 Z`}
									fill="#ffffff"
								/>
							</g>
						)
					})}

				{renderWholeStarshipSvgGeometry({
					archetypeId: resolvedLoadout.hullArchetype,
					palette: resolvedLoadout.palette,
					gradientPrefix,
					recoilOffset: safeRecoil,
				})}
			</svg>
		</div>
	)
}

function renderWholeStarshipSvgGeometry({
	archetypeId,
	palette,
	gradientPrefix,
	recoilOffset,
}: {
	archetypeId: ShipArchetypeId
	palette: ShipColorPalette
	gradientPrefix: string
	recoilOffset: number
}) {
	if (archetypeId === 'interceptor_vanguard_mk1') {
		return (
			<g>
				<g transform={`translate(0, ${recoilOffset})`}>
					<rect
						x="-19"
						y="-13"
						width="2.6"
						height="11"
						rx="1"
						fill={palette.hullHighlight}
						stroke={palette.outlineDark}
						strokeWidth="0.9"
					/>
					<rect
						x="16.4"
						y="-13"
						width="2.6"
						height="11"
						rx="1"
						fill={palette.hullHighlight}
						stroke={palette.outlineDark}
						strokeWidth="0.9"
					/>
					<circle cx="-17.7" cy="-13.5" r="1.4" fill={palette.cockpitGlow} />
					<circle cx="17.7" cy="-13.5" r="1.4" fill={palette.cockpitGlow} />
				</g>

				<path
					d="M 0 -31 L 7 -13 L 28 7 L 30 18 L 16 14 L 10 24 L 4 25 L 0 21 L -4 25 L -10 24 L -16 14 L -30 18 L -28 7 L -7 -13 Z"
					fill={`url(#${gradientPrefix}-hull-base)`}
					stroke={palette.outlineDark}
					strokeWidth="1.6"
					strokeLinejoin="round"
				/>

				<path
					d="M -7 -9 L -25 8 L -23 13 L -8 6 Z M 7 -9 L 25 8 L 23 13 L 8 6 Z"
					fill={palette.accentStripe}
				/>

				<path
					d="M 0 -27 L 5.5 -10 L 18 6 L 12 12 L 7.5 21 L 0 18 L -7.5 21 L -12 12 L -18 6 L -5.5 -10 Z"
					fill={`url(#${gradientPrefix}-armor-plate)`}
					stroke={palette.hullPrimary}
					strokeWidth="1"
					strokeLinejoin="round"
				/>

				<path
					d="M 0 -25 L 0 16 M -6 -6 L -14 8 M 6 -6 L 14 8"
					stroke={palette.hullPrimary}
					strokeWidth="0.9"
					opacity="0.65"
				/>

				<rect
					x="-8.5"
					y="21"
					width="5"
					height="4"
					rx="1"
					fill={palette.hullSecondary}
					stroke={palette.outlineDark}
					strokeWidth="1"
				/>
				<rect
					x="3.5"
					y="21"
					width="5"
					height="4"
					rx="1"
					fill={palette.hullSecondary}
					stroke={palette.outlineDark}
					strokeWidth="1"
				/>

				<path
					d="M 0 -14 L 4.5 -3 L 3 8 L 0 11 L -3 8 L -4.5 -3 Z"
					fill={`url(#${gradientPrefix}-canopy)`}
					stroke={palette.outlineDark}
					strokeWidth="1.2"
				/>
				<path
					d="M -1.5 -10 L 0 -12 L 1.2 -3 L -1.2 1 Z"
					fill="#ffffff"
					opacity="0.8"
				/>
			</g>
		)
	}

	if (archetypeId === 'striker_wraith_mk1') {
		return (
			<g>
				<g transform={`translate(0, ${recoilOffset})`}>
					<path
						d="M -14 -16 L -12 -16 L -11 -4 L -15 -4 Z M 12 -16 L 14 -16 L 15 -4 L 11 -4 Z"
						fill={palette.accentStripe}
						stroke={palette.outlineDark}
						strokeWidth="0.8"
					/>
				</g>

				<path
					d="M 0 -32 L 11 -13 L 30 11 L 24 23 L 13 16 L 8 25 L 0 20 L -8 25 L -13 16 L -24 23 L -30 11 L -11 -13 Z"
					fill={`url(#${gradientPrefix}-hull-base)`}
					stroke={palette.outlineDark}
					strokeWidth="1.6"
					strokeLinejoin="round"
				/>

				<path
					d="M 0 -26 L 8.5 -8 L 22 11 L 15 14 L 6 21 L 0 16 L -6 21 L -15 14 L -22 11 L -8.5 -8 Z"
					fill={palette.hullSecondary}
					stroke={palette.hullHighlight}
					strokeWidth="0.9"
					strokeLinejoin="round"
				/>

				<path
					d="M 0 -21 L 4.5 -6 L 16 9 L 11 12 L 0 5 L -11 12 L -16 9 L -4.5 -6 Z"
					fill={palette.accentStripe}
					opacity="0.9"
				/>

				<path
					d="M 0 -15 L 4 -3 L 0 11 L -4 -3 Z"
					fill={`url(#${gradientPrefix}-canopy)`}
					stroke={palette.outlineDark}
					strokeWidth="1.2"
				/>
				<line
					x1="0"
					y1="-28"
					x2="0"
					y2="18"
					stroke={palette.cockpitGlow}
					strokeWidth="1.2"
					opacity="0.75"
				/>
			</g>
		)
	}

	if (archetypeId === 'science_helios_mk1') {
		return (
			<g>
				<circle
					cx="0"
					cy="2"
					r="23"
					fill={`url(#${gradientPrefix}-hull-base)`}
					stroke={palette.outlineDark}
					strokeWidth="1.6"
				/>
				<circle
					cx="0"
					cy="2"
					r="17.5"
					fill="none"
					stroke={palette.accentStripe}
					strokeWidth="3"
					strokeDasharray="12 5"
				/>
				<circle
					cx="0"
					cy="2"
					r="12"
					fill={palette.outlineDark}
					stroke={palette.hullHighlight}
					strokeWidth="1"
				/>

				<g transform={`translate(0, ${recoilOffset})`}>
					<circle
						cx="-19"
						cy="-7"
						r="3"
						fill={palette.cockpitGlow}
						stroke={palette.outlineDark}
						strokeWidth="1"
					/>
					<circle
						cx="19"
						cy="-7"
						r="3"
						fill={palette.cockpitGlow}
						stroke={palette.outlineDark}
						strokeWidth="1"
					/>
				</g>

				<path
					d="M -3.5 -29 L -10 -24 L -12 20 L -5 25 L 5 25 L 12 20 L 10 -24 L 3.5 -29 L 3.5 -12 L -3.5 -12 Z"
					fill={`url(#${gradientPrefix}-armor-plate)`}
					stroke={palette.outlineDark}
					strokeWidth="1.4"
					strokeLinejoin="round"
				/>

				<circle
					cx="0"
					cy="1"
					r="7.2"
					fill={`url(#${gradientPrefix}-canopy)`}
					stroke={palette.outlineDark}
					strokeWidth="1.3"
				/>
				<circle cx="-2" cy="-1.5" r="2.2" fill="#ffffff" opacity="0.85" />
			</g>
		)
	}

	if (archetypeId === 'hauler_atlas_mk1') {
		return (
			<g>
				<g transform={`translate(0, ${recoilOffset})`}>
					<rect
						x="-16"
						y="-26"
						width="4"
						height="12"
						rx="1"
						fill={palette.hullHighlight}
						stroke={palette.outlineDark}
						strokeWidth="1"
					/>
					<rect
						x="12"
						y="-26"
						width="4"
						height="12"
						rx="1"
						fill={palette.hullHighlight}
						stroke={palette.outlineDark}
						strokeWidth="1"
					/>
				</g>

				<path
					d="M -5 -27 L 5 -27 L 13 -22 L 26 -8 L 27 17 L 18 25 L -18 25 L -27 17 L -26 -8 L -13 -22 Z"
					fill={`url(#${gradientPrefix}-hull-base)`}
					stroke={palette.outlineDark}
					strokeWidth="1.7"
					strokeLinejoin="round"
				/>

				<path
					d="M -8 -23 L 8 -23 L 18 -7 L 19 17 L 11 22 L -11 22 L -19 17 L -18 -7 Z"
					fill={`url(#${gradientPrefix}-armor-plate)`}
					stroke={palette.hullPrimary}
					strokeWidth="1.1"
					strokeLinejoin="round"
				/>

				<rect
					x="-23"
					y="-5"
					width="6"
					height="18"
					rx="1.5"
					fill={palette.accentStripe}
				/>
				<rect
					x="17"
					y="-5"
					width="6"
					height="18"
					rx="1.5"
					fill={palette.accentStripe}
				/>

				<rect
					x="-10"
					y="-2"
					width="8"
					height="7"
					rx="1.5"
					fill={palette.hullSecondary}
					stroke={palette.outlineDark}
					strokeWidth="1"
				/>
				<rect
					x="2"
					y="-2"
					width="8"
					height="7"
					rx="1.5"
					fill={palette.hullSecondary}
					stroke={palette.outlineDark}
					strokeWidth="1"
				/>
				<rect
					x="-10"
					y="8"
					width="8"
					height="7"
					rx="1.5"
					fill={palette.hullSecondary}
					stroke={palette.outlineDark}
					strokeWidth="1"
				/>
				<rect
					x="2"
					y="8"
					width="8"
					height="7"
					rx="1.5"
					fill={palette.hullSecondary}
					stroke={palette.outlineDark}
					strokeWidth="1"
				/>

				<path
					d="M -7 -16 L 7 -16 L 9 -8 L -9 -8 Z"
					fill={`url(#${gradientPrefix}-canopy)`}
					stroke={palette.outlineDark}
					strokeWidth="1.2"
				/>
				<line
					x1="-5"
					y1="-14"
					x2="5"
					y2="-14"
					stroke="#ffffff"
					strokeWidth="1.3"
					opacity="0.85"
				/>
			</g>
		)
	}

	return (
		<g>
			<g transform={`translate(0, ${recoilOffset})`}>
				<path
					d="M -21 -12 L -19 -18 L -17 -10 Z M 21 -12 L 19 -18 L 17 -10 Z"
					fill={palette.cockpitGlow}
				/>
			</g>

			<path
				d="M 0 -32 C 5 -16, 26 -8, 30 12 C 28 22, 20 26, 17 12 C 12 16, 8 24, 0 19 C -8 24, -12 16, -17 12 C -20 26, -28 22, -30 12 C -26 -8, -5 -16, 0 -32 Z"
				fill={`url(#${gradientPrefix}-hull-base)`}
				stroke={palette.outlineDark}
				strokeWidth="1.6"
				strokeLinejoin="round"
			/>

			<path
				d="M 0 -26 C 4 -12, 20 -4, 23 10 C 17 8, 12 12, 6 18 L 0 14 L -6 18 C -12 12, -17 8, -23 10 C -20 -4, -4 -12, 0 -26 Z"
				fill={`url(#${gradientPrefix}-armor-plate)`}
				stroke={palette.accentStripe}
				strokeWidth="1"
			/>

			<ellipse
				cx="0"
				cy="-4"
				rx="4.5"
				ry="9.5"
				fill={`url(#${gradientPrefix}-canopy)`}
				stroke={palette.outlineDark}
				strokeWidth="1.2"
			/>
			<circle
				cx="0"
				cy="10"
				r="3.2"
				fill={palette.cockpitGlow}
				stroke="#ffffff"
				strokeWidth="0.9"
			/>
		</g>
	)
}
