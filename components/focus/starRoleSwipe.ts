import type { StarRole } from '../db'

export type StarRoleViewTarget =
	| {
			kind: 'all'
			id: null
			title: 'All'
			description?: string
			starRole?: undefined
	  }
	| {
			kind: 'role'
			id: string
			title: string
			description?: string
			starRole: StarRole
	  }

export type SwipeDirection = 'next' | 'previous'

export type SwipePhase =
	| 'idle'
	| 'pending'
	| 'swiping'
	| 'committing'
	| 'cancelling'

export interface WarpEmblemTransform {
	translateXPixels: number
	scale: number
	opacity: number
	streakOpacity: number
	streakLengthPixels: number
	blurPixels: number
}

export interface StarRoleTransitionFrame {
	backdropOpacity: number
	outgoing: WarpEmblemTransform
	incoming: WarpEmblemTransform
	warpStreaksOpacity: number
	warpStreaksScaleX: number
}

const ALL_ROLES_TARGET: StarRoleViewTarget = {
	kind: 'all',
	id: null,
	title: 'All',
}

const DEFAULT_ACTIVATION_THRESHOLD_PIXELS = 10
export const COMMIT_PROGRESS_THRESHOLD = 0.42
const FLICK_DISTANCE_THRESHOLD_PIXELS = 24
const FLICK_VELOCITY_THRESHOLD_PIXELS_PER_MILLISECOND = 0.35

export function buildOrderedStarRoleTargets(
	starRoles: StarRole[],
	starRolesOrder: { starRoleId: string; order: number }[],
): StarRoleViewTarget[] {
	const orderByRoleIdentifier = new Map(
		starRolesOrder.map((entry) => [entry.starRoleId, entry.order]),
	)

	const resolveOrder = (starRole: StarRole) =>
		orderByRoleIdentifier.get(starRole.id) ?? Number.MAX_SAFE_INTEGER

	const sortedStarRoles = [...starRoles].sort(
		(firstRole, secondRole) =>
			resolveOrder(firstRole) - resolveOrder(secondRole),
	)

	const roleTargets: StarRoleViewTarget[] = sortedStarRoles.map((starRole) => ({
		kind: 'role',
		id: starRole.id,
		title: starRole.title,
		description: starRole.description,
		starRole,
	}))

	return [ALL_ROLES_TARGET, ...roleTargets]
}

export function resolveCurrentTargetIndex(
	targets: StarRoleViewTarget[],
	activeStarRoles: string[],
	allStarRolesActive: boolean,
): number {
	if (allStarRolesActive || targets.length <= 1) {
		return 0
	}

	if (activeStarRoles.length === 1) {
		const matchingIndex = targets.findIndex(
			(target) => target.kind === 'role' && target.id === activeStarRoles[0],
		)
		return matchingIndex >= 0 ? matchingIndex : 0
	}

	return 0
}

export function resolveAdjacentTarget(
	targets: StarRoleViewTarget[],
	currentIndex: number,
	direction: SwipeDirection,
): { target: StarRoleViewTarget; index: number } | null {
	if (targets.length <= 1) {
		return null
	}

	const normalizedIndex =
		((Math.trunc(currentIndex) % targets.length) + targets.length) %
		targets.length
	const stepOffset = direction === 'next' ? 1 : -1
	const nextIndex =
		(normalizedIndex + stepOffset + targets.length) % targets.length

	return {
		target: targets[nextIndex],
		index: nextIndex,
	}
}

export function resolveTargetActiveStarRoles(
	target: StarRoleViewTarget,
	starRoles: StarRole[],
): string[] {
	if (target.kind === 'all') {
		return [...starRoles.map((starRole) => starRole.id), '']
	}

	return [target.id]
}

export function resolveHomeHeaderTitle(
	targets: StarRoleViewTarget[],
	activeStarRoles: string[],
	allStarRolesActive: boolean,
): string {
	if (allStarRolesActive) {
		return 'All'
	}

	if (activeStarRoles.length === 1) {
		const matchingTarget = targets.find(
			(target) => target.kind === 'role' && target.id === activeStarRoles[0],
		)
		if (matchingTarget) {
			return matchingTarget.title
		}
	}

	return 'Home'
}

export function classifySwipeAxis(
	deltaX: number,
	deltaY: number,
	activationThresholdPixels = DEFAULT_ACTIVATION_THRESHOLD_PIXELS,
): 'pending' | 'horizontal' | 'vertical' {
	const distance = Math.hypot(deltaX, deltaY)
	if (distance < activationThresholdPixels) {
		return 'pending'
	}

	if (Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
		return 'horizontal'
	}

	return 'vertical'
}

export function resolveStreakGradientDirection(
	direction: SwipeDirection,
): 'to right' | 'to left' {
	return direction === 'next' ? 'to right' : 'to left'
}

export function calculateSwipeProgress(
	deltaX: number,
	swipeSpanPixels: number,
): { direction: SwipeDirection; progress: number } {
	const safeDeltaX = Number.isFinite(deltaX) ? deltaX : 0
	const direction: SwipeDirection = safeDeltaX <= 0 ? 'next' : 'previous'

	if (!Number.isFinite(swipeSpanPixels) || swipeSpanPixels <= 0) {
		return { direction, progress: 0 }
	}

	const rawProgress = Math.abs(safeDeltaX) / swipeSpanPixels
	return {
		direction,
		progress: clampNumber(rawProgress, 0, 1),
	}
}

export function shouldCommitSwipe(
	progress: number,
	velocityPixelsPerMillisecond: number,
	direction: SwipeDirection,
	deltaX: number,
): boolean {
	if (!Number.isFinite(progress) || progress <= 0 || deltaX === 0) {
		return false
	}

	if (progress >= COMMIT_PROGRESS_THRESHOLD) {
		return true
	}

	const isFlickInDirection =
		direction === 'next'
			? deltaX <= -FLICK_DISTANCE_THRESHOLD_PIXELS &&
				velocityPixelsPerMillisecond <=
					-FLICK_VELOCITY_THRESHOLD_PIXELS_PER_MILLISECOND
			: deltaX >= FLICK_DISTANCE_THRESHOLD_PIXELS &&
				velocityPixelsPerMillisecond >=
					FLICK_VELOCITY_THRESHOLD_PIXELS_PER_MILLISECOND

	return isFlickInDirection
}

export function calculateStarRoleTransitionFrame(
	progress: number,
	direction: SwipeDirection,
	viewportWidthPixels: number,
): StarRoleTransitionFrame {
	const clampedProgress = clampNumber(
		Number.isFinite(progress) ? progress : 0,
		0,
		1,
	)
	const safeViewportWidth =
		Number.isFinite(viewportWidthPixels) && viewportWidthPixels > 0
			? viewportWidthPixels
			: 390
	const halfViewport = Math.max(160, safeViewportWidth * 0.55)
	const travelSign = direction === 'next' ? -1 : 1

	const backdropOpacity =
		clampedProgress <= 0
			? 0
			: roundToThreeDecimals(
					Math.min(0.84, 0.36 + Math.pow(clampedProgress, 0.65) * 0.48),
				)

	const outgoing = calculateOutgoingTransform(
		clampedProgress,
		travelSign,
		halfViewport,
	)
	const incoming = calculateIncomingTransform(
		clampedProgress,
		travelSign,
		halfViewport,
	)

	const warpStreaksOpacity =
		clampedProgress <= 0 || clampedProgress >= 1
			? 0
			: roundToThreeDecimals(Math.sin(clampedProgress * Math.PI) * 0.65)
	const warpStreaksScaleX = roundToThreeDecimals(
		0.4 + Math.pow(clampedProgress, 0.8) * 1.1,
	)

	return {
		backdropOpacity,
		outgoing,
		incoming,
		warpStreaksOpacity,
		warpStreaksScaleX,
	}
}

function calculateOutgoingTransform(
	clampedProgress: number,
	travelSign: number,
	halfViewport: number,
): WarpEmblemTransform {
	const exitProgress = Math.pow(clampedProgress, 1.35)
	const translateXPixels =
		clampedProgress <= 0
			? 0
			: roundToTwoDecimals(travelSign * exitProgress * halfViewport * 1.15)
	const scale = roundToThreeDecimals(1 - exitProgress * 0.32)
	const opacity = roundToThreeDecimals(
		Math.max(0, 1 - Math.pow(clampedProgress / 0.72, 1.4)),
	)
	const streakOpacity =
		clampedProgress <= 0 || clampedProgress >= 0.72
			? 0
			: roundToThreeDecimals(
					Math.sin((clampedProgress / 0.72) * Math.PI) * 0.85,
				)
	const streakLengthPixels =
		clampedProgress <= 0
			? 0
			: roundToTwoDecimals(24 + exitProgress * 140)
	const blurPixels = roundToTwoDecimals(exitProgress * 3)

	return {
		translateXPixels,
		scale,
		opacity,
		streakOpacity,
		streakLengthPixels,
		blurPixels,
	}
}

function calculateIncomingTransform(
	clampedProgress: number,
	travelSign: number,
	halfViewport: number,
): WarpEmblemTransform {
	const entranceSplit = 0.55
	let offsetMultiplier: number
	let scale: number

	if (clampedProgress <= entranceSplit) {
		const approachProgress = clampedProgress / entranceSplit
		const easedApproach = 1 - Math.pow(1 - approachProgress, 1.4)
		offsetMultiplier = 0.92 - 0.44 * easedApproach
		scale = 0.78 + 0.1 * easedApproach
	} else {
		// Accelerates rapidly into dead center during the second half so it feels like a ship blasting into view
		const blastProgress =
			(clampedProgress - entranceSplit) / (1 - entranceSplit)
		const easedBlast = 1 - Math.pow(1 - blastProgress, 2.4)
		offsetMultiplier = 0.48 * (1 - easedBlast)
		const overshoot = Math.sin(blastProgress * Math.PI) * 0.08
		scale = 0.88 + 0.12 * easedBlast + overshoot
	}

	const translateXPixels =
		clampedProgress >= 1
			? 0
			: roundToTwoDecimals(-travelSign * halfViewport * offsetMultiplier)

	const opacity =
		clampedProgress <= 0
			? 0
			: roundToThreeDecimals(
					Math.min(1, 0.22 + Math.pow(clampedProgress / 0.65, 0.65) * 0.78),
				)

	const blastFlare =
		clampedProgress <= 0 || clampedProgress >= 1
			? 0
			: Math.pow(clampedProgress, 1.4) *
				Math.sin(Math.pow(clampedProgress, 1.2) * Math.PI)
	const streakOpacity = roundToThreeDecimals(Math.min(0.95, blastFlare * 1.4))
	const streakLengthPixels =
		clampedProgress <= 0 || clampedProgress >= 1
			? 0
			: roundToTwoDecimals(18 + blastFlare * 280)
	const blurPixels =
		clampedProgress <= 0 || clampedProgress >= 1
			? 0
			: roundToTwoDecimals(blastFlare * 2.5)

	return {
		translateXPixels,
		scale: roundToThreeDecimals(scale),
		opacity,
		streakOpacity,
		streakLengthPixels,
		blurPixels,
	}
}

function clampNumber(value: number, minimum: number, maximum: number): number {
	return Math.min(maximum, Math.max(minimum, value))
}

function roundToTwoDecimals(value: number): number {
	const rounded = Math.round(value * 100) / 100
	return Object.is(rounded, -0) ? 0 : rounded
}

function roundToThreeDecimals(value: number): number {
	const rounded = Math.round(value * 1000) / 1000
	return Object.is(rounded, -0) ? 0 : rounded
}
