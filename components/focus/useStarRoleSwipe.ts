'use client'

import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { useLiveQuery } from 'dexie-react-hooks'
import { usePostHog } from 'posthog-js/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { db, type StarRole } from '../db'
import {
	buildOrderedStarRoleTargets,
	calculateSwipeProgress,
	classifySwipeAxis,
	resolveAdjacentTarget,
	resolveCurrentTargetIndex,
	resolveHomeHeaderTitle,
	resolveTargetActiveStarRoles,
	shouldCommitSwipe,
	type StarRoleViewTarget,
	type SwipeDirection,
	type SwipePhase,
} from './starRoleSwipe'
import useView from './view'

export interface StarRoleSwipeOverlayState {
	isVisible: boolean
	phase: SwipePhase
	direction: SwipeDirection
	progress: number
	fromTarget: StarRoleViewTarget | null
	toTarget: StarRoleViewTarget | null
	activeTargetIndex: number
	targetIndex: number
	closingOpacity: number
}

const INITIAL_OVERLAY_STATE: StarRoleSwipeOverlayState = {
	isVisible: false,
	phase: 'idle',
	direction: 'next',
	progress: 0,
	fromTarget: null,
	toTarget: null,
	activeTargetIndex: 0,
	targetIndex: 0,
	closingOpacity: 1,
}

export const COMMIT_ANIMATION_DURATION_MILLISECONDS = 160
export const CANCEL_ANIMATION_DURATION_MILLISECONDS = 160
export const LOCK_HOLD_DURATION_MILLISECONDS = 130
export const FADE_OUT_DURATION_MILLISECONDS = 160

const EXCLUDED_ELEMENT_SELECTOR =
	'ion-reorder, ion-checkbox, ion-toggle, ion-range, ion-select, ion-fab, ion-fab-button, input, textarea, select, [contenteditable="true"], [data-no-swipe="true"]'

const ACTIVE_IONIC_OVERLAY_SELECTOR =
	'ion-modal.show-modal:not(.overlay-hidden), ion-action-sheet:not(.overlay-hidden), ion-popover:not(.overlay-hidden), ion-alert:not(.overlay-hidden), ion-menu.show-menu:not(.overlay-hidden)'

export function useStarRoleSwipe(starRoles: StarRole[] | undefined) {
	const posthog = usePostHog()
	const { activeStarRoles, allStarRolesActive, setActiveStarRoles } = useView()
	const starRolesOrder = useLiveQuery(() => db.starRolesOrder.toArray())

	const [overlayState, setOverlayState] = useState<StarRoleSwipeOverlayState>(
		INITIAL_OVERLAY_STATE,
	)

	const resolvedStarRoles = useMemo(() => starRoles ?? [], [starRoles])
	const resolvedStarRolesOrder = useMemo(
		() => starRolesOrder ?? [],
		[starRolesOrder],
	)

	const targets = useMemo(
		() =>
			buildOrderedStarRoleTargets(resolvedStarRoles, resolvedStarRolesOrder),
		[resolvedStarRoles, resolvedStarRolesOrder],
	)

	const currentTargetIndex = useMemo(
		() =>
			resolveCurrentTargetIndex(targets, activeStarRoles, allStarRolesActive),
		[targets, activeStarRoles, allStarRolesActive],
	)

	const headerTitle = useMemo(
		() =>
			resolveHomeHeaderTitle(targets, activeStarRoles, allStarRolesActive),
		[targets, activeStarRoles, allStarRolesActive],
	)

	const posthogReference = useRef(posthog)
	const controllerReference = useRef<ReturnType<
		typeof createStarRoleSwipeController
	> | null>(null)

	const getController = useCallback(() => {
		if (!controllerReference.current) {
			controllerReference.current = createStarRoleSwipeController({
				onOverlayStateChange: setOverlayState,
				applyActiveStarRoles: setActiveStarRoles,
				triggerLightHaptic,
				captureSwipeAnalytics: (direction, target) => {
					posthogReference.current?.capture('star_role_swiped', {
						direction,
						to_role: target.kind === 'all' ? 'all' : target.title,
					})
				},
			})
		}
		return controllerReference.current
	}, [setActiveStarRoles])

	useEffect(() => {
		posthogReference.current = posthog
	}, [posthog])

	useEffect(() => {
		getController().syncViewState({
			targets,
			starRoles: resolvedStarRoles,
			currentTargetIndex,
			activeStarRoles,
		})
	}, [
		activeStarRoles,
		currentTargetIndex,
		getController,
		resolvedStarRoles,
		targets,
	])

	useEffect(() => {
		return () => {
			controllerReference.current?.dispose()
			controllerReference.current = null
		}
	}, [])

	const onPointerDown = useCallback(
		(event: PointerEvent) => {
			getController().onPointerDown(event)
		},
		[getController],
	)

	const viewportWidthPixels =
		typeof window !== 'undefined' ? window.innerWidth : 390

	return {
		headerTitle,
		onPointerDown,
		overlayProps: {
			isVisible: overlayState.isVisible,
			fromTarget: overlayState.fromTarget,
			toTarget: overlayState.toTarget,
			direction: overlayState.direction,
			progress: overlayState.progress,
			phase: overlayState.phase,
			targets,
			activeTargetIndex: overlayState.activeTargetIndex,
			targetIndex: overlayState.targetIndex,
			viewportWidthPixels,
			closingOpacity: overlayState.closingOpacity,
		},
	}
}

interface TransitionSnapshot {
	initialProgress: number
	fromTarget: StarRoleViewTarget
	toTarget: StarRoleViewTarget
	fromIndex: number
	toIndex: number
	direction: SwipeDirection
}

interface SwipeControllerCallbacks {
	onOverlayStateChange: (state: StarRoleSwipeOverlayState) => void
	applyActiveStarRoles: (activeStarRoles: string[]) => void
	triggerLightHaptic: () => void
	captureSwipeAnalytics: (
		direction: SwipeDirection,
		target: StarRoleViewTarget,
	) => void
}

interface SwipeControllerEnvironment {
	now: () => number
	requestAnimationFrame: (callback: (timestamp: number) => void) => number
	cancelAnimationFrame: (identifier: number) => void
	setTimeout: (callback: () => void, delayMilliseconds: number) => number
	clearTimeout: (identifier: number) => void
	getViewportWidthPixels: () => number
	documentReference: Document | null
	addWindowListener: (
		type: 'pointermove' | 'pointerup' | 'pointercancel',
		listener: (event: PointerEvent) => void,
		options?: AddEventListenerOptions,
	) => void
	removeWindowListener: (
		type: 'pointermove' | 'pointerup' | 'pointercancel',
		listener: (event: PointerEvent) => void,
	) => void
	getBodyUserSelect: () => string
	setBodyUserSelect: (value: string) => void
	suppressNextClick: () => void
}

export function createStarRoleSwipeController(
	callbacks: SwipeControllerCallbacks,
	environmentOverrides: Partial<SwipeControllerEnvironment> = {},
) {
	const environment = resolveSwipeControllerEnvironment(environmentOverrides)

	let isDisposed = false

	const viewState: {
		targets: StarRoleViewTarget[]
		starRoles: StarRole[]
		resolvedCurrentTargetIndex: number
		expectedActiveStarRoles: string[] | null
	} = {
		targets: [],
		starRoles: [],
		resolvedCurrentTargetIndex: 0,
		expectedActiveStarRoles: null,
	}

	const gestureState: {
		pointerIdentifier: number | null
		phase: 'idle' | 'pending' | 'swiping'
		startX: number
		startY: number
		lastX: number
		lastTime: number
		velocityPixelsPerMillisecond: number
		direction: SwipeDirection
		progress: number
		activeTargetIndex: number
		targetIndex: number
		fromTarget: StarRoleViewTarget | null
		toTarget: StarRoleViewTarget | null
		cleanupWindowListeners: (() => void) | null
	} = {
		pointerIdentifier: null,
		phase: 'idle',
		startX: 0,
		startY: 0,
		lastX: 0,
		lastTime: 0,
		velocityPixelsPerMillisecond: 0,
		direction: 'next',
		progress: 0,
		activeTargetIndex: 0,
		targetIndex: 0,
		fromTarget: null,
		toTarget: null,
		cleanupWindowListeners: null,
	}

	const overlayAnimationState: {
		animationFrameIdentifier: number
		timeoutIdentifier: number | null
		pendingCommit: {
			target: StarRoleViewTarget
			direction: SwipeDirection
		} | null
	} = {
		animationFrameIdentifier: 0,
		timeoutIdentifier: null,
		pendingCommit: null,
	}

	function syncViewState({
		targets,
		starRoles,
		currentTargetIndex,
		activeStarRoles,
	}: {
		targets: StarRoleViewTarget[]
		starRoles: StarRole[]
		currentTargetIndex: number
		activeStarRoles: string[]
	}) {
		const targetsChanged = viewState.targets !== targets
		viewState.targets = targets
		viewState.starRoles = starRoles

		if (targetsChanged) {
			viewState.expectedActiveStarRoles = null
			viewState.resolvedCurrentTargetIndex = currentTargetIndex
			return
		}

		if (viewState.expectedActiveStarRoles !== null) {
			if (
				areStringArraysEqual(
					activeStarRoles,
					viewState.expectedActiveStarRoles,
				)
			) {
				viewState.expectedActiveStarRoles = null
				viewState.resolvedCurrentTargetIndex = currentTargetIndex
			}
			return
		}

		viewState.resolvedCurrentTargetIndex = currentTargetIndex
	}

	function clearPendingOverlayTimers() {
		if (overlayAnimationState.animationFrameIdentifier) {
			environment.cancelAnimationFrame(
				overlayAnimationState.animationFrameIdentifier,
			)
			overlayAnimationState.animationFrameIdentifier = 0
		}
		if (overlayAnimationState.timeoutIdentifier !== null) {
			environment.clearTimeout(overlayAnimationState.timeoutIdentifier)
			overlayAnimationState.timeoutIdentifier = null
		}
	}

	function flushPendingCommitFeedback() {
		const pending = overlayAnimationState.pendingCommit
		if (!pending) {
			return
		}

		overlayAnimationState.pendingCommit = null
		// Feedback is best-effort: a throwing haptic or analytics call must not stall the fade-out and leave the overlay stuck on screen.
		try {
			callbacks.triggerLightHaptic()
			callbacks.captureSwipeAnalytics(pending.direction, pending.target)
		} catch (error) {
			console.error('Star role swipe feedback failed:', error)
		}
	}

	// Only called once a new gesture engages horizontal swiping (or another transition starts),
	// so taps or vertical scrolls never abruptly abort an in-flight feedback animation or haptic.
	function interruptOverlayAnimationForNewSwipe() {
		clearPendingOverlayTimers()
		flushPendingCommitFeedback()
	}

	function runFadeOut(snapshot: TransitionSnapshot) {
		const startTime = environment.now()

		function stepFadeOut(currentTime: number) {
			if (isDisposed) {
				return
			}

			const elapsedMilliseconds = Math.max(0, currentTime - startTime)
			const ratio = Math.min(
				1,
				elapsedMilliseconds / FADE_OUT_DURATION_MILLISECONDS,
			)
			const closingOpacity = 1 - Math.pow(ratio, 1.5)

			callbacks.onOverlayStateChange({
				isVisible: true,
				phase: 'committing',
				direction: snapshot.direction,
				progress: 1,
				fromTarget: snapshot.fromTarget,
				toTarget: snapshot.toTarget,
				activeTargetIndex: snapshot.fromIndex,
				targetIndex: snapshot.toIndex,
				closingOpacity,
			})

			if (ratio < 1) {
				overlayAnimationState.animationFrameIdentifier =
					environment.requestAnimationFrame(stepFadeOut)
			} else {
				overlayAnimationState.animationFrameIdentifier = 0
				callbacks.onOverlayStateChange(INITIAL_OVERLAY_STATE)
			}
		}

		overlayAnimationState.animationFrameIdentifier =
			environment.requestAnimationFrame(stepFadeOut)
	}

	function startCommitAnimation(snapshot: TransitionSnapshot) {
		interruptOverlayAnimationForNewSwipe()

		// Advance the logical current role immediately on release so any pointerdown during
		// the commit animation, lock hold, or fade-out starts from this newly committed role.
		viewState.resolvedCurrentTargetIndex = snapshot.toIndex
		const nextActiveStarRoles = resolveTargetActiveStarRoles(
			snapshot.toTarget,
			viewState.starRoles,
		)
		viewState.expectedActiveStarRoles = nextActiveStarRoles
		callbacks.applyActiveStarRoles(nextActiveStarRoles)

		overlayAnimationState.pendingCommit = {
			target: snapshot.toTarget,
			direction: snapshot.direction,
		}

		const startTime = environment.now()
		const duration = Math.max(
			80,
			COMMIT_ANIMATION_DURATION_MILLISECONDS *
				(1 - snapshot.initialProgress * 0.5),
		)

		function stepCommit(currentTime: number) {
			if (isDisposed) {
				return
			}

			const elapsedMilliseconds = Math.max(0, currentTime - startTime)
			const ratio = Math.min(1, elapsedMilliseconds / duration)
			const easedRatio = 1 - Math.pow(1 - ratio, 2.5)
			const nextProgress =
				snapshot.initialProgress + (1 - snapshot.initialProgress) * easedRatio

			callbacks.onOverlayStateChange({
				isVisible: true,
				phase: 'committing',
				direction: snapshot.direction,
				progress: nextProgress,
				fromTarget: snapshot.fromTarget,
				toTarget: snapshot.toTarget,
				activeTargetIndex: snapshot.fromIndex,
				targetIndex: snapshot.toIndex,
				closingOpacity: 1,
			})

			if (ratio < 1) {
				overlayAnimationState.animationFrameIdentifier =
					environment.requestAnimationFrame(stepCommit)
				return
			}

			overlayAnimationState.animationFrameIdentifier = 0
			flushPendingCommitFeedback()

			overlayAnimationState.timeoutIdentifier = environment.setTimeout(() => {
				if (isDisposed) {
					return
				}
				overlayAnimationState.timeoutIdentifier = null
				runFadeOut(snapshot)
			}, LOCK_HOLD_DURATION_MILLISECONDS)
		}

		stepCommit(startTime)
	}

	function startCancelAnimation(snapshot: TransitionSnapshot) {
		interruptOverlayAnimationForNewSwipe()

		const startTime = environment.now()
		const duration = Math.max(
			80,
			CANCEL_ANIMATION_DURATION_MILLISECONDS *
				Math.max(0.4, snapshot.initialProgress),
		)

		function stepCancel(currentTime: number) {
			if (isDisposed) {
				return
			}

			const elapsedMilliseconds = Math.max(0, currentTime - startTime)
			const ratio = Math.min(1, elapsedMilliseconds / duration)
			const easedRatio = 1 - Math.pow(1 - ratio, 2.2)
			const nextProgress = snapshot.initialProgress * (1 - easedRatio)

			callbacks.onOverlayStateChange({
				isVisible: ratio < 1,
				phase: 'cancelling',
				direction: snapshot.direction,
				progress: nextProgress,
				fromTarget: snapshot.fromTarget,
				toTarget: snapshot.toTarget,
				activeTargetIndex: snapshot.fromIndex,
				targetIndex: snapshot.toIndex,
				closingOpacity: 1 - ratio * 0.4,
			})

			if (ratio < 1) {
				overlayAnimationState.animationFrameIdentifier =
					environment.requestAnimationFrame(stepCancel)
			} else {
				overlayAnimationState.animationFrameIdentifier = 0
				callbacks.onOverlayStateChange(INITIAL_OVERLAY_STATE)
			}
		}

		stepCancel(startTime)
	}

	function abortGestureAfterError(error: unknown) {
		console.error('Star role swipe gesture failed:', error)
		clearPendingOverlayTimers()
		overlayAnimationState.pendingCommit = null
		gestureState.pointerIdentifier = null
		gestureState.phase = 'idle'
		try {
			gestureState.cleanupWindowListeners?.()
			callbacks.onOverlayStateChange(INITIAL_OVERLAY_STATE)
		} catch (cleanupError) {
			console.error('Star role swipe cleanup failed:', cleanupError)
		}
	}

	function guardGesture(handler: (event: PointerEvent) => void) {
		return (event: PointerEvent) => {
			try {
				handler(event)
			} catch (error) {
				abortGestureAfterError(error)
			}
		}
	}

	function startGesture(event: PointerEvent) {
		if (isDisposed) {
			return
		}
		if (!event.isPrimary) {
			return
		}
		if (event.pointerType === 'mouse' && event.button !== 0) {
			return
		}
		if (viewState.targets.length <= 1) {
			return
		}

		const eventPath =
			typeof event.composedPath === 'function'
				? (event.composedPath() as EventTarget[])
				: []
		if (
			environment.documentReference &&
			shouldIgnoreSwipeStart(
				event.target,
				environment.documentReference,
				eventPath,
			)
		) {
			return
		}

		gestureState.cleanupWindowListeners?.()

		const startIndex = clampTargetIndex(
			viewState.resolvedCurrentTargetIndex,
			viewState.targets.length,
		)

		gestureState.pointerIdentifier = event.pointerId
		gestureState.phase = 'pending'
		gestureState.startX = event.clientX
		gestureState.startY = event.clientY
		gestureState.lastX = event.clientX
		gestureState.lastTime = environment.now()
		gestureState.velocityPixelsPerMillisecond = 0
		gestureState.progress = 0
		gestureState.activeTargetIndex = startIndex
		gestureState.targetIndex = startIndex
		gestureState.fromTarget = viewState.targets[startIndex] ?? viewState.targets[0]
		gestureState.toTarget = null

		const swipeSpanPixels = resolveSwipeSpanPixels(
			environment.getViewportWidthPixels(),
		)
		const previousBodyUserSelect = environment.getBodyUserSelect()
		let hasDisabledUserSelect = false

		const handlePointerMove = guardGesture((moveEvent: PointerEvent) => {
			if (moveEvent.pointerId !== gestureState.pointerIdentifier) {
				return
			}

			const deltaX = moveEvent.clientX - gestureState.startX
			const deltaY = moveEvent.clientY - gestureState.startY
			const moveTime = environment.now()
			const elapsedMilliseconds = moveTime - gestureState.lastTime

			if (elapsedMilliseconds > 4) {
				const instantVelocity =
					(moveEvent.clientX - gestureState.lastX) / elapsedMilliseconds
				gestureState.velocityPixelsPerMillisecond =
					gestureState.velocityPixelsPerMillisecond * 0.4 +
					instantVelocity * 0.6
				gestureState.lastX = moveEvent.clientX
				gestureState.lastTime = moveTime
			}

			if (gestureState.phase === 'pending') {
				const axis = classifySwipeAxis(deltaX, deltaY)
				if (axis === 'pending') {
					return
				}
				if (axis === 'vertical') {
					gestureState.phase = 'idle'
					gestureState.pointerIdentifier = null
					gestureState.cleanupWindowListeners?.()
					return
				}
				gestureState.phase = 'swiping'
				interruptOverlayAnimationForNewSwipe()
				if (!hasDisabledUserSelect) {
					environment.setBodyUserSelect('none')
					hasDisabledUserSelect = true
				}
			}

			if (gestureState.phase === 'swiping') {
				if (moveEvent.cancelable) {
					moveEvent.preventDefault()
				}

				const { direction, progress } = calculateSwipeProgress(
					deltaX,
					swipeSpanPixels,
				)
				const currentTargets = viewState.targets
				const resolvedFromTarget =
					currentTargets[gestureState.activeTargetIndex] ??
					gestureState.fromTarget
				const adjacent = resolveAdjacentTarget(
					currentTargets,
					gestureState.activeTargetIndex,
					direction,
				)
				if (!adjacent || !resolvedFromTarget) {
					gestureState.cleanupWindowListeners?.()
					gestureState.pointerIdentifier = null
					gestureState.phase = 'idle'
					callbacks.onOverlayStateChange(INITIAL_OVERLAY_STATE)
					return
				}

				gestureState.direction = direction
				gestureState.progress = progress
				gestureState.fromTarget = resolvedFromTarget
				gestureState.toTarget = adjacent.target
				gestureState.targetIndex = adjacent.index

				callbacks.onOverlayStateChange({
					isVisible: true,
					phase: 'swiping',
					direction,
					progress,
					fromTarget: resolvedFromTarget,
					toTarget: adjacent.target,
					activeTargetIndex: gestureState.activeTargetIndex,
					targetIndex: adjacent.index,
					closingOpacity: 1,
				})
			}
		})

		const handlePointerEnd = guardGesture((endEvent: PointerEvent) => {
			if (endEvent.pointerId !== gestureState.pointerIdentifier) {
				return
			}

			gestureState.cleanupWindowListeners?.()
			gestureState.pointerIdentifier = null

			if (
				gestureState.phase !== 'swiping' ||
				!gestureState.toTarget ||
				!gestureState.fromTarget
			) {
				gestureState.phase = 'idle'
				return
			}

			gestureState.phase = 'idle'

			if (endEvent.type !== 'pointercancel') {
				environment.suppressNextClick()
			}

			const deltaX = endEvent.clientX - gestureState.startX
			const shouldCommit =
				endEvent.type !== 'pointercancel' &&
				shouldCommitSwipe(
					gestureState.progress,
					gestureState.velocityPixelsPerMillisecond,
					gestureState.direction,
					deltaX,
				)

			const transitionSnapshot: TransitionSnapshot = {
				initialProgress: gestureState.progress,
				fromTarget: gestureState.fromTarget,
				toTarget: gestureState.toTarget,
				fromIndex: gestureState.activeTargetIndex,
				toIndex: gestureState.targetIndex,
				direction: gestureState.direction,
			}

			if (shouldCommit) {
				startCommitAnimation(transitionSnapshot)
			} else {
				startCancelAnimation(transitionSnapshot)
			}
		})

		environment.addWindowListener('pointermove', handlePointerMove, {
			passive: false,
		})
		environment.addWindowListener('pointerup', handlePointerEnd)
		environment.addWindowListener('pointercancel', handlePointerEnd)

		gestureState.cleanupWindowListeners = () => {
			environment.removeWindowListener('pointermove', handlePointerMove)
			environment.removeWindowListener('pointerup', handlePointerEnd)
			environment.removeWindowListener('pointercancel', handlePointerEnd)
			if (hasDisabledUserSelect) {
				environment.setBodyUserSelect(previousBodyUserSelect)
				hasDisabledUserSelect = false
			}
			gestureState.cleanupWindowListeners = null
		}
	}

	function dispose() {
		isDisposed = true
		clearPendingOverlayTimers()
		overlayAnimationState.pendingCommit = null
		gestureState.cleanupWindowListeners?.()
		gestureState.pointerIdentifier = null
		gestureState.phase = 'idle'
	}

	return {
		syncViewState,
		onPointerDown: guardGesture(startGesture),
		dispose,
	}
}

function resolveSwipeControllerEnvironment(
	overrides: Partial<SwipeControllerEnvironment>,
): SwipeControllerEnvironment {
	return {
		now: overrides.now ?? (() => performance.now()),
		requestAnimationFrame:
			overrides.requestAnimationFrame ??
			((callback) => window.requestAnimationFrame(callback)),
		cancelAnimationFrame:
			overrides.cancelAnimationFrame ??
			((identifier) => window.cancelAnimationFrame(identifier)),
		setTimeout:
			overrides.setTimeout ??
			((callback, delayMilliseconds) =>
				window.setTimeout(callback, delayMilliseconds)),
		clearTimeout:
			overrides.clearTimeout ??
			((identifier) => window.clearTimeout(identifier)),
		getViewportWidthPixels:
			overrides.getViewportWidthPixels ?? (() => window.innerWidth),
		documentReference:
			overrides.documentReference !== undefined
				? overrides.documentReference
				: typeof document !== 'undefined'
					? document
					: null,
		addWindowListener:
			overrides.addWindowListener ??
			((type, listener, options) =>
				window.addEventListener(type, listener as EventListener, options)),
		removeWindowListener:
			overrides.removeWindowListener ??
			((type, listener) =>
				window.removeEventListener(type, listener as EventListener)),
		getBodyUserSelect:
			overrides.getBodyUserSelect ?? (() => document.body.style.userSelect),
		setBodyUserSelect:
			overrides.setBodyUserSelect ??
			((value) => {
				document.body.style.userSelect = value
			}),
		suppressNextClick: overrides.suppressNextClick ?? suppressNextClick,
	}
}

function clampTargetIndex(index: number, length: number): number {
	if (length <= 0) {
		return 0
	}
	return ((Math.trunc(index) % length) + length) % length
}

function areStringArraysEqual(
	firstArray: string[],
	secondArray: string[],
): boolean {
	if (firstArray.length !== secondArray.length) {
		return false
	}
	return firstArray.every((value, index) => value === secondArray[index])
}

function resolveSwipeSpanPixels(viewportWidthPixels: number): number {
	return Math.min(240, Math.max(150, viewportWidthPixels * 0.45))
}

export function shouldIgnoreSwipeStart(
	target: EventTarget | null,
	documentReference: Document,
	eventPath: EventTarget[] = [],
): boolean {
	const activeOverlays = Array.from(
		documentReference.querySelectorAll(ACTIVE_IONIC_OVERLAY_SELECTOR),
	)
	for (const overlay of activeOverlays) {
		if (
			overlay.id === 'search-modal' &&
			Number.parseFloat(overlay.getAttribute('data-breakpoint') ?? '1') < 1
		) {
			continue
		}
		return true
	}

	if (isExcludedSwipeTarget(target)) {
		return true
	}

	return eventPath.some((entry) => isExcludedSwipeTarget(entry))
}

function isExcludedSwipeTarget(target: EventTarget | null): boolean {
	if (!target || typeof (target as Element).closest !== 'function') {
		return false
	}

	return Boolean((target as Element).closest(EXCLUDED_ELEMENT_SELECTOR))
}

function suppressNextClick() {
	const handleClick = (clickEvent: MouseEvent) => {
		clickEvent.preventDefault()
		clickEvent.stopPropagation()
		window.clearTimeout(cleanupTimer)
	}
	const cleanupTimer = window.setTimeout(() => {
		window.removeEventListener('click', handleClick, true)
	}, 0)
	window.addEventListener('click', handleClick, { capture: true, once: true })
}

function triggerLightHaptic() {
	try {
		void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
	} catch {}
}
