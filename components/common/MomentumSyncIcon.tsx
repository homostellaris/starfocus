'use client'

import { useEffect, useRef, useState } from 'react'
import { IonIcon } from '@ionic/react'
import { syncSharp } from 'ionicons/icons'

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
	maxVelocity?: number
	accelerationRate?: number
	frictionCoefficient?: number
	minimumImpulseDuration?: number
	enablePhysics?: boolean
	onTelemetryChange?: (telemetry: MomentumTelemetry) => void
	'data-testid'?: string
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
	size?: 'sm' | 'md' | 'lg' | 'xl' | number,
): number | undefined {
	if (!size) {
		return undefined
	}
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
	size,
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
	const displayedPhase = enablePhysics
		? currentPhase
		: isSyncing
			? 'cruising'
			: 'idle'

	return (
		<IonIcon
			id={id}
			ref={iconReference}
			icon={syncSharp}
			slot={slot}
			className={`origin-center text-neutral-400 transition-colors duration-200 select-none ${
				isSyncing ? 'animate-spin' : ''
			} ${className}`}
			data-testid={testIdentifier}
			data-spinning={isSyncing ? 'true' : 'false'}
			data-phase={displayedPhase}
			style={{
				animation: enablePhysics ? 'none' : undefined,
				fontSize: pixelSize ? `${pixelSize}px` : undefined,
				willChange: enablePhysics ? 'transform' : undefined,
				...style,
			}}
		/>
	)
}
