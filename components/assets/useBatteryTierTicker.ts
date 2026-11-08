'use client'

import { useEffect, useRef, useState } from 'react'
import type {
	BatteryPerformanceTier,
	BatteryTickerTelemetry,
	PooledParticle,
} from './types'

export const MAX_PARTICLE_POOL_SIZE = 40
export const DEFAULT_IDLE_SLEEP_THRESHOLD_MS = 4000

export function determineBatteryTier({
	isArcadeActive,
	batterySaverEnabled,
	idleElapsedMs,
	idleThresholdMs = DEFAULT_IDLE_SLEEP_THRESHOLD_MS,
}: {
	isArcadeActive: boolean
	batterySaverEnabled: boolean
	idleElapsedMs: number
	idleThresholdMs?: number
}): BatteryPerformanceTier {
	if (batterySaverEnabled) {
		return 'battery_saver'
	}
	const safeIdleElapsed = Number.isFinite(idleElapsedMs)
		? Math.max(0, idleElapsedMs)
		: 0
	const safeThreshold = Number.isFinite(idleThresholdMs)
		? Math.max(500, idleThresholdMs)
		: DEFAULT_IDLE_SLEEP_THRESHOLD_MS

	if (!isArcadeActive && safeIdleElapsed >= safeThreshold) {
		return 'idle'
	}
	return 'active'
}

export function resolveTargetFrameIntervalMs(
	tier: BatteryPerformanceTier,
): number {
	if (tier === 'active') {
		return 1000 / 60
	}
	if (tier === 'battery_saver') {
		return 1000 / 30
	}
	return 0
}

export function resolveTargetFps(tier: BatteryPerformanceTier): number {
	if (tier === 'active') return 60
	if (tier === 'battery_saver') return 30
	return 0
}

export interface ParticleRingPool {
	getCapacity: () => number
	getActiveCount: () => number
	getParticles: () => PooledParticle[]
	spawn: (params: {
		x: number
		y: number
		velocityX: number
		velocityY: number
		maxLife: number
		size: number
		color: string
	}) => void
	step: (deltaSeconds: number) => void
	clear: () => void
}

export function createParticleRingPool(
	capacity = MAX_PARTICLE_POOL_SIZE,
): ParticleRingPool {
	const safeCapacity = Math.max(
		1,
		Math.min(MAX_PARTICLE_POOL_SIZE, Math.trunc(capacity)),
	)
	const slots: PooledParticle[] = Array.from({ length: safeCapacity }, () => ({
		active: false,
		x: 0,
		y: 0,
		velocityX: 0,
		velocityY: 0,
		lifeRemaining: 0,
		maxLife: 1,
		size: 2,
		color: '#38bdf8',
	}))
	let writeCursor = 0

	return {
		getCapacity() {
			return safeCapacity
		},
		getActiveCount() {
			let activeCount = 0
			for (let index = 0; index < safeCapacity; index++) {
				if (slots[index].active) {
					activeCount++
				}
			}
			return activeCount
		},
		getParticles() {
			return slots
		},
		spawn({ x, y, velocityX, velocityY, maxLife, size, color }) {
			if (writeCursor < 0 || writeCursor >= safeCapacity) {
				writeCursor = 0
			}
			const slot = slots[writeCursor]
			writeCursor = (writeCursor + 1) % safeCapacity

			const safeMaxLife =
				Number.isFinite(maxLife) && maxLife > 0.01 ? maxLife : 0.5
			slot.active = true
			slot.x = Number.isFinite(x) ? x : 0
			slot.y = Number.isFinite(y) ? y : 0
			slot.velocityX = Number.isFinite(velocityX) ? velocityX : 0
			slot.velocityY = Number.isFinite(velocityY) ? velocityY : 0
			slot.maxLife = safeMaxLife
			slot.lifeRemaining = safeMaxLife
			slot.size = Number.isFinite(size) && size > 0 ? size : 2
			slot.color = color || '#38bdf8'
		},
		step(deltaSeconds: number) {
			if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
				return
			}
			const clampedDelta = Math.min(1.0, deltaSeconds)
			for (let index = 0; index < safeCapacity; index++) {
				const slot = slots[index]
				if (!slot.active) continue
				slot.lifeRemaining -= clampedDelta
				if (slot.lifeRemaining <= 0) {
					slot.active = false
					slot.lifeRemaining = 0
					continue
				}
				slot.x += slot.velocityX * clampedDelta
				slot.y += slot.velocityY * clampedDelta
			}
		},
		clear() {
			for (let index = 0; index < safeCapacity; index++) {
				slots[index].active = false
				slots[index].lifeRemaining = 0
			}
			writeCursor = 0
		},
	}
}

export function useBatteryTierTicker({
	isArcadeActive = false,
	batterySaverEnabled = false,
	tierOverride,
	idleThresholdMs = DEFAULT_IDLE_SLEEP_THRESHOLD_MS,
}: {
	isArcadeActive?: boolean
	batterySaverEnabled?: boolean
	tierOverride?: BatteryPerformanceTier
	idleThresholdMs?: number
} = {}): {
	telemetry: BatteryTickerTelemetry
	thrusterFrame: number
	wakeUp: () => void
} {
	const lastActivityTimestampRef = useRef<number>(0)
	const [idleMilliseconds, setIdleMilliseconds] = useState(0)
	const [thrusterFrame, setThrusterFrame] = useState(0)

	const computedTier =
		tierOverride ??
		determineBatteryTier({
			isArcadeActive,
			batterySaverEnabled,
			idleElapsedMs: idleMilliseconds,
			idleThresholdMs,
		})

	const wakeUp = () => {
		lastActivityTimestampRef.current = Date.now()
		setIdleMilliseconds(0)
	}

	useEffect(() => {
		if (typeof window === 'undefined') return
		lastActivityTimestampRef.current = Date.now()
		const handleUserActivity = () => {
			lastActivityTimestampRef.current = Date.now()
			setIdleMilliseconds(previous =>
				previous >= idleThresholdMs ? 0 : previous,
			)
		}

		window.addEventListener('pointermove', handleUserActivity, {
			passive: true,
		})
		window.addEventListener('pointerdown', handleUserActivity, {
			passive: true,
		})
		window.addEventListener('wheel', handleUserActivity, { passive: true })
		window.addEventListener('keydown', handleUserActivity, { passive: true })

		const activityMonitor = window.setInterval(() => {
			const elapsed = Date.now() - lastActivityTimestampRef.current
			setIdleMilliseconds(previous => {
				const wasIdle = previous >= idleThresholdMs
				const isNowIdle = elapsed >= idleThresholdMs
				return wasIdle !== isNowIdle ? elapsed : previous
			})
		}, 250)

		return () => {
			window.removeEventListener('pointermove', handleUserActivity)
			window.removeEventListener('pointerdown', handleUserActivity)
			window.removeEventListener('wheel', handleUserActivity)
			window.removeEventListener('keydown', handleUserActivity)
			window.clearInterval(activityMonitor)
		}
	}, [idleThresholdMs])

	useEffect(() => {
		if (typeof window === 'undefined') return
		const intervalMs = resolveTargetFrameIntervalMs(computedTier)
		if (intervalMs <= 0) {
			return
		}
		const tickerInterval = window.setInterval(
			() => {
				setThrusterFrame(previous => (previous + 1) % 3)
			},
			computedTier === 'battery_saver' ? 110 : 65,
		)
		return () => window.clearInterval(tickerInterval)
	}, [computedTier])

	const targetFps = resolveTargetFps(computedTier)

	return {
		telemetry: {
			tier: computedTier,
			targetFps,
			measuredFps: targetFps,
			idleMilliseconds,
			activeParticleCount:
				computedTier === 'active' ? (isArcadeActive ? 18 : 6) : 0,
			maxParticlePoolSize: MAX_PARTICLE_POOL_SIZE,
		},
		thrusterFrame,
		wakeUp,
	}
}
