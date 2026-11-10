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
		id: 'lagrange_parking',
		name: 'Lagrange Station',
		tagline: 'Stationary Shoulder Parking',
		description:
			'Maintains a stationary post alongside the celestial body with zero idle movement, animating smoothly only during task transitions and user inputs.',
	},
	{
		id: 'dual_staging',
		name: 'Dual Staging',
		tagline: 'Portrait Shoulder / Landscape Flight Bay',
		description:
			'Stationary shoulder parking in portrait and companion flight bay in landscape orientation.',
	},
	{
		id: 'gravity_flyby',
		name: 'Hyperbolic Flyby',
		tagline: 'Static Approach Vector',
		description:
			'Static approach vector tangent to the celestial body.',
	},
	{
		id: 'kepler_orbit',
		name: 'Kepler Orbit',
		tagline: 'Dynamic Elliptical Orbit',
		description:
			'Tilted 2.5D elliptical orbit around the planet.',
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
			? 'dual_staging'
			: mode

	switch (resolvedMode) {
		case 'lagrange_parking': {
			const offsetX = isLandscape ? -40 : -24
			const offsetY = isLandscape ? 0 : -16

			return {
				offsetX,
				offsetY,
				scale: 0.92,
				headingDegrees: 180,
				isBehind: false,
				opacity: 1,
				scannerBeamTarget: null,
				showOrbitGuide: false,
			}
		}

		case 'dual_staging': {
			const offsetX = isLandscape ? -42 : -24
			const offsetY = isLandscape ? 0 : -16

			return {
				offsetX,
				offsetY,
				scale: 0.92,
				headingDegrees: 180,
				isBehind: false,
				opacity: 1,
				scannerBeamTarget: null,
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
