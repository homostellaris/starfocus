'use client'

import React, { useEffect, useState } from 'react'
import PlanetAsset from '../assets/PlanetAsset'
import Starship from '../common/Starship'
import {
	computeOrbitalState,
	FLIGHT_STAGING_MODES,
	type FlightStagingMode,
} from './orbitalMechanics'

const SHOWCASE_CELESTIALS: Record<FlightStagingMode, { title: string; starPoints: number }> = {
	kepler_orbit: { title: 'Terrestrial Colony', starPoints: 3 },
	lagrange_parking: { title: 'Jovian Gas Giant', starPoints: 5 },
	gravity_flyby: { title: 'Solar Furnace', starPoints: 8 },
	dual_staging: { title: 'Singularity Void', starPoints: 13 },
}

export function OrbitalStagingCard({
	mode,
	elapsedSeconds,
}: {
	mode: FlightStagingMode
	elapsedSeconds: number
}) {
	const definition = FLIGHT_STAGING_MODES.find(m => m.id === mode)!
	const celestial = SHOWCASE_CELESTIALS[mode]

	const orbitalState = computeOrbitalState({
		mode,
		elapsedSeconds,
		isLandscape: mode === 'dual_staging',
	})

	return (
		<div
			data-testid={`orbital-staging-card-${mode}`}
			className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 shadow-xl"
		>
			<div className="mb-2">
				<div className="flex items-center justify-between">
					<h4 className="text-sm font-bold text-white tracking-wide">
						{definition.name}
					</h4>
					<span className="text-[10px] font-mono font-medium text-sky-400 bg-sky-950/70 px-2 py-0.5 rounded-full border border-sky-800/40">
						★ {celestial.starPoints} pts
					</span>
				</div>
				<p className="text-[11px] text-sky-300 font-mono mt-0.5">
					{definition.tagline}
				</p>
			</div>

			<div className="relative my-2 flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-neutral-900 bg-gradient-to-b from-[#060c18] to-[#020409]">
				{/* Orbit Guide Ellipse */}
				{orbitalState.showOrbitGuide && (
					<svg
						viewBox="-40 -40 80 80"
						className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
						aria-hidden="true"
					>
						<ellipse
							cx="0"
							cy="0"
							rx={mode === 'dual_staging' ? 36 : 24}
							ry={mode === 'dual_staging' ? 14 : 9.5}
							transform="rotate(-14)"
							fill="none"
							stroke="#38bdf8"
							strokeWidth="1"
							strokeDasharray="2 3"
							opacity="0.35"
						/>
					</svg>
				)}

				{/* Lagrange Scanner Beam */}
				{orbitalState.scannerBeamTarget && (
					<svg
						viewBox="-40 -40 80 80"
						className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
						aria-hidden="true"
					>
						<line
							x1={orbitalState.offsetX}
							y1={orbitalState.offsetY}
							x2="0"
							y2="0"
							stroke="#38bdf8"
							strokeWidth="1.5"
							strokeDasharray="3 2"
							opacity="0.8"
						/>
						<circle
							cx={orbitalState.offsetX}
							cy={orbitalState.offsetY}
							r="2"
							fill="#38bdf8"
						/>
					</svg>
				)}

				{/* Celestial Body in center */}
				<div className="relative z-[2] flex h-14 w-14 items-center justify-center drop-shadow-lg">
					<PlanetAsset
						size={42}
						todo={{
							id: `showcase-celestial-${mode}`,
							title: celestial.title,
							starPoints: celestial.starPoints,
						}}
					/>
				</div>

				{/* Orbiting / Stationing Starship */}
				<div
					data-testid={`showcase-ship-${mode}`}
					className={`pointer-events-none absolute h-12 w-12 flex items-center justify-center transition-transform duration-75 ${
						orbitalState.isBehind ? 'z-0' : 'z-10'
					}`}
					style={{
						transform: `translate(${orbitalState.offsetX}px, ${orbitalState.offsetY}px)`,
						opacity: orbitalState.opacity,
					}}
				>
					<div
						className="h-full w-full flex items-center justify-center"
						style={{
							transform: `scale(${orbitalState.scale * 0.9})`,
						}}
					>
						<Starship rotationDegrees={orbitalState.headingDegrees} />
					</div>
				</div>
			</div>

			<p className="text-xs text-neutral-400 mt-1 leading-relaxed">
				{definition.description}
			</p>
		</div>
	)
}

export function OrbitalStagingShowcase() {
	const [elapsedSeconds, setElapsedSeconds] = useState(0)

	useEffect(() => {
		if (typeof window === 'undefined') return
		let animationFrameId: number
		const startTime = performance.now()

		const tick = (now: number) => {
			if (!document.hidden) {
				setElapsedSeconds((now - startTime) / 1000)
			}
			animationFrameId = requestAnimationFrame(tick)
		}
		animationFrameId = requestAnimationFrame(tick)

		return () => {
			cancelAnimationFrame(animationFrameId)
		}
	}, [])

	return (
		<div data-testid="orbital-staging-showcase" className="space-y-3">
			<div className="flex items-baseline justify-between">
				<h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-200">
					Planetary Flight Staging Concepts (All 4 Showcased)
				</h3>
				<span className="text-xs text-neutral-400">
					Real-time 60fps orbital physics
				</span>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{FLIGHT_STAGING_MODES.map(mode => (
					<OrbitalStagingCard
						key={mode.id}
						mode={mode.id}
						elapsedSeconds={elapsedSeconds}
					/>
				))}
			</div>
		</div>
	)
}

export default OrbitalStagingShowcase
