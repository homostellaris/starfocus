export type FlightStagingMode =
	| 'kepler_orbit'
	| 'lagrange_parking'
	| 'gravity_flyby'
	| 'dual_staging'

export interface FlightStagingDefinition {
	id: FlightStagingMode
	name: string
	tagline: string
	description: string
}

export const FLIGHT_STAGING_MODES: FlightStagingDefinition[] = [
	{
		id: 'kepler_orbit',
		name: 'Kepler Orbit',
		tagline: 'Idea 1: 2.5D Elliptical Orbit',
		description:
			'Tilted 2.5D elliptical orbit around the planet with dynamic z-depth occlusion, scaling, and tangential banking.',
	},
	{
		id: 'lagrange_parking',
		name: 'Lagrange Station',
		tagline: 'Idea 2: L4 Equilibrium & Scanner',
		description:
			'Maintains station at the L4 equilibrium point with subtle thruster stabilization and a live telemetry survey beam.',
	},
	{
		id: 'gravity_flyby',
		name: 'Hyperbolic Flyby',
		tagline: 'Idea 3: Gravitational Assist',
		description:
			'Sweeps close to periapsis with accelerated transit and dramatic orbital swing-by mechanics.',
	},
	{
		id: 'dual_staging',
		name: 'Dual Staging',
		tagline: 'Idea 4: Adaptive Landscape Escort',
		description:
			'Runs tight micro-orbit in portrait, then automatically opens into a wide companion flight corridor in landscape.',
	},
]

export interface OrbitalState {
	offsetX: number
	offsetY: number
	scale: number
	headingDegrees: number
	isBehind: boolean
	opacity: number
	scannerBeamTarget: { x: number; y: number } | null
	showOrbitGuide: boolean
}

export function computeOrbitalState({
	mode,
	elapsedSeconds,
	isLandscape = false,
	isDragging = false,
}: {
	mode: FlightStagingMode
	elapsedSeconds: number
	isLandscape?: boolean
	isDragging?: boolean
}): OrbitalState {
	if (isDragging) {
		return {
			offsetX: 0,
			offsetY: 0,
			scale: 1,
			headingDegrees: 180,
			isBehind: false,
			opacity: 1,
			scannerBeamTarget: null,
			showOrbitGuide: false,
		}
	}

	const resolvedMode: FlightStagingMode =
		mode === 'dual_staging'
			? isLandscape
				? 'dual_staging'
				: 'kepler_orbit'
			: mode

	switch (resolvedMode) {
		case 'lagrange_parking': {
			const baseX = -22
			const baseY = -14
			const driftX = Math.sin(elapsedSeconds * 1.2) * 1.2
			const driftY = Math.cos(elapsedSeconds * 0.9) * 0.9
			const offsetX = baseX + driftX
			const offsetY = baseY + driftY
			const angleToPlanetRad = Math.atan2(-offsetY, -offsetX)
			const headingDegrees = (angleToPlanetRad * 180) / Math.PI + 90

			return {
				offsetX,
				offsetY,
				scale: 0.88,
				headingDegrees,
				isBehind: false,
				opacity: 1,
				scannerBeamTarget: { x: 0, y: 0 },
				showOrbitGuide: false,
			}
		}

		case 'gravity_flyby': {
			const orbitalPeriod = 5.0
			const meanAnomaly = ((elapsedSeconds % orbitalPeriod) / orbitalPeriod) * Math.PI * 2
			const eccentricity = 0.55
			const semiMajorAxis = 22
			const radius =
				(semiMajorAxis * (1 - eccentricity * eccentricity)) /
				(1 + eccentricity * Math.cos(meanAnomaly))

			const tiltRadians = (-18 * Math.PI) / 180
			const rawX = radius * Math.cos(meanAnomaly)
			const rawY = radius * Math.sin(meanAnomaly) * 0.65

			const offsetX = rawX * Math.cos(tiltRadians) - rawY * Math.sin(tiltRadians)
			const offsetY = rawX * Math.sin(tiltRadians) + rawY * Math.cos(tiltRadians)

			const derivativeX = -Math.sin(meanAnomaly) * semiMajorAxis
			const derivativeY = Math.cos(meanAnomaly) * semiMajorAxis * 0.65
			const tangentX =
				derivativeX * Math.cos(tiltRadians) - derivativeY * Math.sin(tiltRadians)
			const tangentY =
				derivativeX * Math.sin(tiltRadians) + derivativeY * Math.cos(tiltRadians)

			const flightAngleRad = Math.atan2(tangentY, tangentX)
			const headingDegrees = (flightAngleRad * 180) / Math.PI + 90
			const isBehind = offsetY < -2

			const normalizedRadius = (radius - semiMajorAxis * 0.45) / semiMajorAxis
			const scale = isBehind ? 0.72 + normalizedRadius * 0.1 : 0.88 + (1 - normalizedRadius) * 0.2

			return {
				offsetX,
				offsetY,
				scale,
				headingDegrees,
				isBehind,
				opacity: isBehind ? 0.82 : 1,
				scannerBeamTarget: null,
				showOrbitGuide: true,
			}
		}

		case 'dual_staging': {
			const orbitalPeriod = 7.0
			const phase = ((elapsedSeconds % orbitalPeriod) / orbitalPeriod) * Math.PI * 2
			const semiMajorAxis = 48
			const semiMinorAxis = 16
			const tiltRadians = (-10 * Math.PI) / 180

			const rawX = semiMajorAxis * Math.cos(phase)
			const rawY = semiMinorAxis * Math.sin(phase)

			const offsetX = rawX * Math.cos(tiltRadians) - rawY * Math.sin(tiltRadians)
			const offsetY = rawX * Math.sin(tiltRadians) + rawY * Math.cos(tiltRadians)

			const velocityX = -semiMajorAxis * Math.sin(phase)
			const velocityY = semiMinorAxis * Math.cos(phase)
			const tangentX =
				velocityX * Math.cos(tiltRadians) - velocityY * Math.sin(tiltRadians)
			const tangentY =
				velocityX * Math.sin(tiltRadians) + velocityY * Math.cos(tiltRadians)

			const flightAngleRad = Math.atan2(tangentY, tangentX)
			const headingDegrees = (flightAngleRad * 180) / Math.PI + 90
			const isBehind = Math.sin(phase) < 0

			const scale = isBehind
				? 0.78 + (Math.sin(phase) + 1) * 0.08
				: 0.88 + Math.sin(phase) * 0.2

			return {
				offsetX,
				offsetY,
				scale,
				headingDegrees,
				isBehind,
				opacity: isBehind ? 0.85 : 1,
				scannerBeamTarget: null,
				showOrbitGuide: true,
			}
		}

		case 'kepler_orbit':
		default: {
			const orbitalPeriod = 5.6
			const phase = ((elapsedSeconds % orbitalPeriod) / orbitalPeriod) * Math.PI * 2
			const semiMajorAxis = 23.5
			const semiMinorAxis = 9.5
			const tiltRadians = (-14 * Math.PI) / 180

			const rawX = semiMajorAxis * Math.cos(phase)
			const rawY = semiMinorAxis * Math.sin(phase)

			const offsetX = rawX * Math.cos(tiltRadians) - rawY * Math.sin(tiltRadians)
			const offsetY = rawX * Math.sin(tiltRadians) + rawY * Math.cos(tiltRadians)

			const velocityX = -semiMajorAxis * Math.sin(phase)
			const velocityY = semiMinorAxis * Math.cos(phase)
			const tangentX =
				velocityX * Math.cos(tiltRadians) - velocityY * Math.sin(tiltRadians)
			const tangentY =
				velocityX * Math.sin(tiltRadians) + velocityY * Math.cos(tiltRadians)

			const flightAngleRad = Math.atan2(tangentY, tangentX)
			const headingDegrees = (flightAngleRad * 180) / Math.PI + 90
			const isBehind = Math.sin(phase) < 0

			const scale = isBehind
				? 0.75 + (Math.sin(phase) + 1) * 0.08
				: 0.86 + Math.sin(phase) * 0.22

			return {
				offsetX,
				offsetY,
				scale,
				headingDegrees,
				isBehind,
				opacity: isBehind ? 0.8 : 1,
				scannerBeamTarget: null,
				showOrbitGuide: true,
			}
		}
	}
}
