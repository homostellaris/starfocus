'use client'

import { useEffect, useRef, useState } from 'react'
import { IonIcon } from '@ionic/react'
import { syncSharp } from 'ionicons/icons'

export type MomentumGlowColor = 'cyan' | 'blue' | 'purple' | 'amber'

export type MomentumIndicatorStyle = 'dot' | 'color' | 'pill' | 'glow' | 'none'

export type MomentumPhase = 'idle' | 'accelerating' | 'cruising' | 'coasting'

export interface MomentumTelemetry {
	phase: MomentumPhase
	velocity: number
	angle: number
	isSyncing: boolean
	isCoasting: boolean
}

export interface MomentumSyncIconProps {
	id?: string
	isSyncing: boolean
	className?: string
	style?: React.CSSProperties
	slot?: string
	size?: 'sm' | 'md' | 'lg' | 'xl' | number
	indicatorStyle?: MomentumIndicatorStyle
	glowColor?: MomentumGlowColor
	glowIntensity?: number
	maxVelocity?: number
	accelerationRate?: number
	frictionCoefficient?: number
	minimumImpulseDuration?: number
	enablePhysics?: boolean
	onTelemetryChange?: (telemetry: MomentumTelemetry) => void
	'data-testid'?: string
}

export const GLOW_COLOR_STYLES: Record<
	MomentumGlowColor,
	{ activeColor: string; dropShadow: string; haloBackground: string }
> = {
	cyan: {
		activeColor: 'text-sky-400',
		dropShadow:
			'drop-shadow(0 0 6px rgba(56, 189, 248, 0.85)) drop-shadow(0 0 14px rgba(14, 165, 233, 0.5))',
		haloBackground: 'bg-sky-400',
	},
	blue: {
		activeColor: 'text-blue-400',
		dropShadow:
			'drop-shadow(0 0 6px rgba(96, 165, 250, 0.85)) drop-shadow(0 0 14px rgba(59, 130, 246, 0.5))',
		haloBackground: 'bg-blue-500',
	},
	purple: {
		activeColor: 'text-fuchsia-400',
		dropShadow:
			'drop-shadow(0 0 6px rgba(232, 121, 249, 0.85)) drop-shadow(0 0 14px rgba(217, 70, 239, 0.5))',
		haloBackground: 'bg-fuchsia-500',
	},
	amber: {
		activeColor: 'text-amber-400',
		dropShadow:
			'drop-shadow(0 0 6px rgba(251, 191, 36, 0.85)) drop-shadow(0 0 14px rgba(245, 158, 11, 0.5))',
		haloBackground: 'bg-amber-400',
	},
}

export function calculateNextVelocity({
	currentVelocity,
	requiresImpulse,
	maxVelocity,
	accelerationRate,
	frictionCoefficient,
	deltaSeconds,
}: {
	currentVelocity: number
	requiresImpulse: boolean
	maxVelocity: number
	accelerationRate: number
	frictionCoefficient: number
	deltaSeconds: number
}): number {
	const clampedDeltaSeconds = Math.min(Math.max(deltaSeconds, 0), 0.1)
	if (requiresImpulse) {
		return Math.min(
			maxVelocity,
			currentVelocity + accelerationRate * clampedDeltaSeconds,
		)
	}
	return Math.max(
		0,
		currentVelocity * Math.exp(-frictionCoefficient * clampedDeltaSeconds),
	)
}

export function calculateNextAngle(
	currentAngle: number,
	velocity: number,
	deltaSeconds: number,
): number {
	const clampedDeltaSeconds = Math.min(Math.max(deltaSeconds, 0), 0.1)
	return (currentAngle + velocity * clampedDeltaSeconds) % 360
}

export function determineMomentumPhase({
	requiresImpulse,
	velocity,
	maxVelocity,
}: {
	requiresImpulse: boolean
	velocity: number
	maxVelocity: number
}): MomentumPhase {
	if (requiresImpulse) {
		return velocity >= maxVelocity * 0.9 ? 'cruising' : 'accelerating'
	}
	if (velocity > 1) {
		return 'coasting'
	}
	return 'idle'
}

export function resolvePixelSize(
	size: 'sm' | 'md' | 'lg' | 'xl' | number,
): number | undefined {
	if (typeof size === 'number') {
		return size
	}
	switch (size) {
		case 'sm':
			return 16
		case 'md':
			return 20
		case 'lg':
			return 32
		case 'xl':
			return 48
		default:
			return undefined
	}
}

export default function MomentumSyncIcon({
	id,
	isSyncing,
	className = '',
	style,
	slot,
	size = 'md',
	indicatorStyle = 'dot',
	glowColor = 'cyan',
	glowIntensity = 1,
	maxVelocity = 540,
	accelerationRate = 960,
	frictionCoefficient = 2.4,
	minimumImpulseDuration = 650,
	enablePhysics = true,
	onTelemetryChange,
	'data-testid': testIdentifier = 'sync-icon',
}: MomentumSyncIconProps) {
	const iconReference = useRef<HTMLIonIconElement | null>(null)
	const [currentPhase, setCurrentPhase] = useState<MomentumPhase>('idle')
	const glowStyle = GLOW_COLOR_STYLES[glowColor]

	const physicsStateReference = useRef({
		angle: 0,
		velocity: 0,
		isSyncing: false,
		minimumAnimationEndTime: 0,
		lastTimestamp: 0,
		animationFrameIdentifier: 0,
	})

	useEffect(() => {
		physicsStateReference.current.isSyncing = isSyncing

		if (isSyncing) {
			const currentTime = performance.now()
			physicsStateReference.current.minimumAnimationEndTime =
				currentTime + minimumImpulseDuration
		}
	}, [isSyncing, minimumImpulseDuration])

	useEffect(() => {
		if (!enablePhysics) {
			onTelemetryChange?.({
				phase: isSyncing ? 'cruising' : 'idle',
				velocity: isSyncing ? maxVelocity : 0,
				angle: 0,
				isSyncing,
				isCoasting: false,
			})
		}
	}, [enablePhysics, isSyncing, maxVelocity, onTelemetryChange])

	useEffect(() => {
		if (!enablePhysics) return

		let isActive = true
		const physicsState = physicsStateReference.current

		function step(currentTime: number) {
			if (!isActive) return

			if (!physicsState.lastTimestamp) {
				physicsState.lastTimestamp = currentTime
			}

			const deltaSeconds = (currentTime - physicsState.lastTimestamp) / 1000
			physicsState.lastTimestamp = currentTime

			const requiresImpulse =
				physicsState.isSyncing ||
				currentTime < physicsState.minimumAnimationEndTime

			physicsState.velocity = calculateNextVelocity({
				currentVelocity: physicsState.velocity,
				requiresImpulse,
				maxVelocity,
				accelerationRate,
				frictionCoefficient,
				deltaSeconds,
			})

			physicsState.angle = calculateNextAngle(
				physicsState.angle,
				physicsState.velocity,
				deltaSeconds,
			)

			if (iconReference.current) {
				iconReference.current.style.transform = `rotate(${physicsState.angle}deg)`
			}

			const isCoasting = !requiresImpulse && physicsState.velocity > 1
			const calculatedPhase = determineMomentumPhase({
				requiresImpulse,
				velocity: physicsState.velocity,
				maxVelocity,
			})

			setCurrentPhase(calculatedPhase)

			onTelemetryChange?.({
				phase: calculatedPhase,
				velocity: Math.round(physicsState.velocity),
				angle: Math.round(physicsState.angle),
				isSyncing: physicsState.isSyncing,
				isCoasting,
			})

			if (!requiresImpulse && physicsState.velocity <= 1) {
				physicsState.velocity = 0
				physicsState.lastTimestamp = 0
				physicsState.animationFrameIdentifier = 0
				setCurrentPhase('idle')
				onTelemetryChange?.({
					phase: 'idle',
					velocity: 0,
					angle: Math.round(physicsState.angle),
					isSyncing: false,
					isCoasting: false,
				})
				return
			}

			physicsState.animationFrameIdentifier = requestAnimationFrame(step)
		}

		const shouldRun =
			isSyncing ||
			physicsState.velocity > 1 ||
			performance.now() < physicsState.minimumAnimationEndTime

		if (shouldRun && !physicsState.animationFrameIdentifier) {
			physicsState.animationFrameIdentifier = requestAnimationFrame(step)
		}

		return () => {
			isActive = false
			if (physicsState.animationFrameIdentifier) {
				cancelAnimationFrame(physicsState.animationFrameIdentifier)
				physicsState.animationFrameIdentifier = 0
			}
		}
	}, [
		isSyncing,
		enablePhysics,
		maxVelocity,
		accelerationRate,
		frictionCoefficient,
		minimumImpulseDuration,
		onTelemetryChange,
	])

	const pixelSize = resolvePixelSize(size)
	const isDotActive = indicatorStyle === 'dot' && isSyncing
	const isColorActive = indicatorStyle === 'color' && isSyncing
	const isPillActive = indicatorStyle === 'pill' && isSyncing
	const isGlowActive =
		indicatorStyle === 'glow' && isSyncing && glowIntensity > 0
	const displayedPhase = enablePhysics
		? currentPhase
		: isSyncing
			? 'cruising'
			: 'idle'

	return (
		<span
			id={id}
			slot={slot}
			className="relative inline-flex items-center justify-center origin-center select-none pointer-events-none"
			style={{
				width: pixelSize ? `${pixelSize}px` : undefined,
				height: pixelSize ? `${pixelSize}px` : undefined,
			}}
		>
			{/* Option 3: Surface Pill / Container Tint */}
			{indicatorStyle === 'pill' && (
				<span
					aria-hidden="true"
					className={`pointer-events-none absolute -inset-2.5 rounded-full border transition-all duration-200 ${
						isPillActive
							? 'bg-purple-500/20 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)] opacity-100 scale-100'
							: 'bg-neutral-800/40 border-neutral-700/60 opacity-60 scale-95'
					}`}
				/>
			)}

			{/* Optional Glow Aura */}
			{indicatorStyle === 'glow' && (
				<span
					aria-hidden="true"
					className={`pointer-events-none absolute inset-0 rounded-full transition-opacity duration-300 ${glowStyle.haloBackground}`}
					style={{
						opacity: isGlowActive ? 0.35 * glowIntensity : 0,
						transform: 'scale(1.4)',
						filter: 'blur(6px)',
					}}
				/>
			)}

			{/* Option 1: Micro Status Pip / Badge Dot */}
			{indicatorStyle === 'dot' && (
				<span
					aria-hidden="true"
					className={`pointer-events-none absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full transition-all duration-200 ${
						isDotActive
							? `opacity-100 scale-100 ${glowStyle.haloBackground} shadow-[0_0_8px_rgba(56,189,248,0.9)]`
							: 'opacity-0 scale-0'
					}`}
				/>
			)}

			<IonIcon
				ref={iconReference}
				icon={syncSharp}
				slot={slot}
				className={`origin-center transition-colors duration-200 ${
					isColorActive ? glowStyle.activeColor : 'text-neutral-400'
				} ${isSyncing ? 'animate-spin' : ''} ${className}`}
				data-testid={testIdentifier}
				data-spinning={isSyncing ? 'true' : 'false'}
				data-phase={displayedPhase}
				data-indicator-style={indicatorStyle}
				data-glow={isGlowActive ? 'true' : 'false'}
				style={{
					animation: enablePhysics ? 'none' : undefined,
					filter: isGlowActive ? glowStyle.dropShadow : 'none',
					fontSize: pixelSize ? `${pixelSize}px` : undefined,
					willChange: enablePhysics ? 'transform' : undefined,
					...style,
				}}
			/>
		</span>
	)
}
