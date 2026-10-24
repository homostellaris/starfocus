'use client'

import { useEffect, useRef, useState } from 'react'
import { IonIcon } from '@ionic/react'
import { menuController } from '@ionic/core/components'
import { settingsSharp } from 'ionicons/icons'
import {
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
	stepIncrement?: number
	stepDuration?: number
	holdDuration?: number
	maxVelocity?: number
	accelerationRate?: number
	frictionCoefficient?: number
	minimumImpulseDuration?: number
	enablePhysics?: boolean
	onTelemetryChange?: (telemetry: MomentumTelemetry) => void
	'data-testid'?: string
}

export function calculateRatchetProgress(
	elapsedMilliseconds: number,
	stepDurationMilliseconds: number,
): number {
	if (stepDurationMilliseconds <= 0 || elapsedMilliseconds >= stepDurationMilliseconds) {
		return 1
	}
	if (elapsedMilliseconds <= 0) {
		return 0
	}
	const progressRatio = Math.max(
		0,
		Math.min(1, elapsedMilliseconds / stepDurationMilliseconds),
	)
	const overshootCoefficient = 1.2
	const decayCoefficient = overshootCoefficient + 1
	return (
		1 +
		decayCoefficient * Math.pow(progressRatio - 1, 3) +
		overshootCoefficient * Math.pow(progressRatio - 1, 2)
	)
}

export default function MomentumSettingsIcon({
	id,
	isOpen: controlledIsOpen,
	className = '',
	style,
	slot,
	size,
	stepIncrement = 60,
	stepDuration = 280,
	holdDuration = 900,
	enablePhysics = true,
	onTelemetryChange,
	'data-testid': testIdentifier = 'settings-icon',
}: MomentumSettingsIconProps) {
	const iconReference = useRef<HTMLIonIconElement | null>(null)
	const [internalIsOpen, setInternalIsOpen] = useState(false)
	const [currentPhase, setCurrentPhase] = useState<MomentumPhase>('idle')

	const isMenuOpen =
		controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen

	const ratchetStateReference = useRef({
		currentAngle: 0,
		startAngle: 0,
		targetAngle: 0,
		state: 'idle' as 'idle' | 'stepping' | 'holding',
		stepStartTime: 0,
		holdStartTime: 0,
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
		if (!enablePhysics) {
			onTelemetryChange?.({
				phase: isMenuOpen ? 'cruising' : 'idle',
				velocity: isMenuOpen ? 60 : 0,
				angle: 0,
				isSyncing: isMenuOpen,
				isCoasting: false,
			})
		}
	}, [enablePhysics, isMenuOpen, onTelemetryChange])

	useEffect(() => {
		if (!enablePhysics) return

		let isActive = true
		const ratchetState = ratchetStateReference.current

		if (isMenuOpen && ratchetState.state === 'idle') {
			ratchetState.state = 'stepping'
			ratchetState.stepStartTime = performance.now()
			ratchetState.startAngle = ratchetState.currentAngle
			ratchetState.targetAngle = ratchetState.startAngle + stepIncrement
		}

		function step(currentTime: number) {
			if (!isActive) return

			if (ratchetState.state === 'stepping') {
				const elapsedMilliseconds = currentTime - ratchetState.stepStartTime
				if (elapsedMilliseconds < stepDuration) {
					const progressRatio = calculateRatchetProgress(
						elapsedMilliseconds,
						stepDuration,
					)
					ratchetState.currentAngle =
						ratchetState.startAngle +
						(ratchetState.targetAngle - ratchetState.startAngle) * progressRatio
					setCurrentPhase('accelerating')
				} else {
					ratchetState.currentAngle = ratchetState.targetAngle
					if (isMenuOpen) {
						ratchetState.state = 'holding'
						ratchetState.holdStartTime = currentTime
						setCurrentPhase('cruising')
					} else {
						ratchetState.state = 'idle'
						setCurrentPhase('idle')
					}
				}
			} else if (ratchetState.state === 'holding') {
				ratchetState.currentAngle = ratchetState.targetAngle
				if (!isMenuOpen) {
					ratchetState.state = 'idle'
					setCurrentPhase('idle')
				} else {
					const holdElapsed = currentTime - ratchetState.holdStartTime
					if (holdElapsed >= holdDuration) {
						ratchetState.state = 'stepping'
						ratchetState.stepStartTime = currentTime
						ratchetState.startAngle = ratchetState.currentAngle
						ratchetState.targetAngle = ratchetState.startAngle + stepIncrement
						setCurrentPhase('accelerating')
					}
				}
			}

			if (iconReference.current) {
				iconReference.current.style.transform = `rotate(${ratchetState.currentAngle}deg)`
			}

			const displayedPhase =
				ratchetState.state === 'idle'
					? 'idle'
					: ratchetState.state === 'stepping'
						? 'accelerating'
						: 'cruising'

			const instantVelocity =
				ratchetState.state === 'stepping'
					? Math.round(stepIncrement / (stepDuration / 1000))
					: 0

			onTelemetryChange?.({
				phase: displayedPhase,
				velocity: instantVelocity,
				angle: Math.round(ratchetState.currentAngle),
				isSyncing: isMenuOpen,
				isCoasting: ratchetState.state === 'stepping' && !isMenuOpen,
			})

			if (ratchetState.state !== 'idle') {
				ratchetState.animationFrameIdentifier = requestAnimationFrame(step)
			} else {
				ratchetState.animationFrameIdentifier = 0
			}
		}

		if (ratchetState.state !== 'idle' && !ratchetState.animationFrameIdentifier) {
			ratchetState.animationFrameIdentifier = requestAnimationFrame(step)
		}

		return () => {
			isActive = false
			if (ratchetState.animationFrameIdentifier) {
				cancelAnimationFrame(ratchetState.animationFrameIdentifier)
				ratchetState.animationFrameIdentifier = 0
			}
		}
	}, [isMenuOpen, enablePhysics, stepIncrement, stepDuration, holdDuration, onTelemetryChange])

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
				isMenuOpen && !enablePhysics ? 'animate-spin' : ''
			} ${className}`}
			data-testid={testIdentifier}
			data-spinning={isMenuOpen ? 'true' : 'false'}
			data-phase={displayedPhase}
			style={{
				fontSize: pixelSize ? `${pixelSize}px` : undefined,
				willChange: enablePhysics ? 'transform' : undefined,
				...style,
			}}
		/>
	)
}
