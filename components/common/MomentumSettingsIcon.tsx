'use client'

import { useEffect, useRef, useState } from 'react'
import { IonIcon } from '@ionic/react'
import { menuController } from '@ionic/core/components'
import { settingsSharp } from 'ionicons/icons'
import {
	calculateNextAngle,
	calculateNextVelocity,
	determineMomentumPhase,
	resolvePixelSize,
	type MomentumPhase,
	type MomentumTelemetry,
} from './MomentumSyncIcon'

export interface MomentumSettingsIconProps {
	id?: string
	isOpen?: boolean
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

export default function MomentumSettingsIcon({
	id,
	isOpen: controlledIsOpen,
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
	'data-testid': testIdentifier = 'settings-icon',
}: MomentumSettingsIconProps) {
	const iconReference = useRef<HTMLIonIconElement | null>(null)
	const [internalIsOpen, setInternalIsOpen] = useState(false)
	const [currentPhase, setCurrentPhase] = useState<MomentumPhase>('idle')

	const isMenuOpen =
		controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen

	const physicsStateReference = useRef({
		angle: 0,
		velocity: 0,
		isImpulseActive: false,
		minimumAnimationEndTime: 0,
		lastTimestamp: 0,
		animationFrameIdentifier: 0,
	})

	useEffect(() => {
		if (controlledIsOpen !== undefined) return

		let isMounted = true
		menuController.isOpen('end').then((open) => {
			if (isMounted) setInternalIsOpen(open)
		})

		function handleMenuOpen(event: Event) {
			const target = event.target as HTMLElement | null
			if (
				!target ||
				target.id === 'settings-menu' ||
				target.getAttribute('side') === 'end' ||
				target.tagName?.toLowerCase() === 'ion-menu'
			) {
				setInternalIsOpen(true)
			}
		}

		function handleMenuClose(event: Event) {
			const target = event.target as HTMLElement | null
			if (
				!target ||
				target.id === 'settings-menu' ||
				target.getAttribute('side') === 'end' ||
				target.tagName?.toLowerCase() === 'ion-menu'
			) {
				setInternalIsOpen(false)
			}
		}

		document.addEventListener('ionWillOpen', handleMenuOpen)
		document.addEventListener('ionDidOpen', handleMenuOpen)
		document.addEventListener('ionWillClose', handleMenuClose)
		document.addEventListener('ionDidClose', handleMenuClose)

		return () => {
			isMounted = false
			document.removeEventListener('ionWillOpen', handleMenuOpen)
			document.removeEventListener('ionDidOpen', handleMenuOpen)
			document.removeEventListener('ionWillClose', handleMenuClose)
			document.removeEventListener('ionDidClose', handleMenuClose)
		}
	}, [controlledIsOpen])

	useEffect(() => {
		physicsStateReference.current.isImpulseActive = isMenuOpen

		if (isMenuOpen) {
			const currentTime = performance.now()
			physicsStateReference.current.minimumAnimationEndTime =
				currentTime + minimumImpulseDuration
		}
	}, [isMenuOpen, minimumImpulseDuration])

	useEffect(() => {
		if (!enablePhysics) {
			onTelemetryChange?.({
				phase: isMenuOpen ? 'cruising' : 'idle',
				velocity: isMenuOpen ? maxVelocity : 0,
				angle: 0,
				isSyncing: isMenuOpen,
				isCoasting: false,
			})
		}
	}, [enablePhysics, isMenuOpen, maxVelocity, onTelemetryChange])

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
				physicsState.isImpulseActive ||
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
				isSyncing: physicsState.isImpulseActive,
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
			isMenuOpen ||
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
		isMenuOpen,
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
		: isMenuOpen
			? 'cruising'
			: 'idle'

	return (
		<IonIcon
			id={id}
			ref={iconReference}
			icon={settingsSharp}
			slot={slot}
			className={`origin-center text-neutral-400 transition-colors duration-200 select-none ${
				isMenuOpen ? 'animate-spin' : ''
			} ${className}`}
			data-testid={testIdentifier}
			data-spinning={isMenuOpen ? 'true' : 'false'}
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
