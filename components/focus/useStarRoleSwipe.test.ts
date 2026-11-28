import { expect, spyOn, test } from 'bun:test'
import type { StarRole } from '../db'
import { buildOrderedStarRoleTargets, type SwipeDirection } from './starRoleSwipe'
import {
	COMMIT_ANIMATION_DURATION_MILLISECONDS,
	createStarRoleSwipeController,
	FADE_OUT_DURATION_MILLISECONDS,
	LOCK_HOLD_DURATION_MILLISECONDS,
	shouldIgnoreSwipeStart,
	type StarRoleSwipeOverlayState,
} from './useStarRoleSwipe'

const sampleRoles: StarRole[] = [
	{
		id: 'role-father',
		title: 'Father',
		icon: { type: 'ionicon', name: 'maleSharp' },
	},
	{
		id: 'role-partner',
		title: 'Partner',
		icon: { type: 'ionicon', name: 'heartSharp' },
	},
	{
		id: 'role-engineer',
		title: 'Engineer',
		icon: { type: 'ionicon', name: 'rocketSharp' },
	},
]

const sampleTargets = buildOrderedStarRoleTargets(sampleRoles, [
	{ starRoleId: 'role-father', order: 0 },
	{ starRoleId: 'role-partner', order: 1 },
	{ starRoleId: 'role-engineer', order: 2 },
])

function createFakeElement({
	identifier = '',
	attributes = {},
	matchedSelectors = [],
}: {
	identifier?: string
	attributes?: Record<string, string>
	matchedSelectors?: string[]
} = {}) {
	return {
		id: identifier,
		getAttribute(name: string) {
			return attributes[name] ?? null
		},
		closest(selector: string) {
			const selectorParts = selector.split(',').map((part) => part.trim())
			return matchedSelectors.some((matched) =>
				selectorParts.includes(matched),
			)
				? this
				: null
		},
	} as unknown as Element
}

function createFakeDocument(activeOverlays: Element[] = []) {
	return {
		querySelectorAll() {
			return activeOverlays
		},
	} as unknown as Document
}

function createFakePointerEvent({
	type,
	clientX = 200,
	clientY = 300,
	pointerId = 1,
	isPrimary = true,
	pointerType = 'touch',
	button = 0,
	target = createFakeElement(),
}: {
	type: string
	clientX?: number
	clientY?: number
	pointerId?: number
	isPrimary?: boolean
	pointerType?: string
	button?: number
	target?: EventTarget | null
}): PointerEvent {
	return {
		type,
		clientX,
		clientY,
		pointerId,
		isPrimary,
		pointerType,
		button,
		target,
		cancelable: true,
		preventDefault() {},
		composedPath() {
			return target ? [target] : []
		},
	} as unknown as PointerEvent
}

function createControllerHarness({
	throwOnFeedback = false,
	throwOnApply = false,
}: { throwOnFeedback?: boolean; throwOnApply?: boolean } = {}) {
	let currentTimeMilliseconds = 1000
	let nextAnimationFrameIdentifier = 1
	let nextTimeoutIdentifier = 1
	let bodyUserSelect = ''
	let clickSuppressionCount = 0

	const animationFrameCallbacks = new Map<number, (time: number) => void>()
	const timeoutCallbacks = new Map<
		number,
		{ callback: () => void; triggerAtMilliseconds: number }
	>()
	const windowListeners: Record<
		'pointermove' | 'pointerup' | 'pointercancel',
		Set<(event: PointerEvent) => void>
	> = {
		pointermove: new Set(),
		pointerup: new Set(),
		pointercancel: new Set(),
	}

	const overlayStates: StarRoleSwipeOverlayState[] = []
	const appliedRoleSelections: string[][] = []
	let hapticCount = 0
	const analyticsEvents: Array<{
		direction: SwipeDirection
		targetTitle: string
	}> = []

	const controller = createStarRoleSwipeController(
		{
			onOverlayStateChange(state) {
				overlayStates.push(state)
			},
			applyActiveStarRoles(activeStarRoles) {
				if (throwOnApply) {
					throw new Error('apply failed')
				}
				appliedRoleSelections.push(activeStarRoles)
			},
			triggerLightHaptic() {
				if (throwOnFeedback) {
					throw new Error('haptics unavailable')
				}
				hapticCount += 1
			},
			captureSwipeAnalytics(direction, target) {
				analyticsEvents.push({ direction, targetTitle: target.title })
			},
		},
		{
			now: () => currentTimeMilliseconds,
			requestAnimationFrame(callback) {
				const identifier = nextAnimationFrameIdentifier
				nextAnimationFrameIdentifier += 1
				animationFrameCallbacks.set(identifier, callback)
				return identifier
			},
			cancelAnimationFrame(identifier) {
				animationFrameCallbacks.delete(identifier)
			},
			setTimeout(callback, delayMilliseconds) {
				const identifier = nextTimeoutIdentifier
				nextTimeoutIdentifier += 1
				timeoutCallbacks.set(identifier, {
					callback,
					triggerAtMilliseconds: currentTimeMilliseconds + delayMilliseconds,
				})
				return identifier
			},
			clearTimeout(identifier) {
				timeoutCallbacks.delete(identifier)
			},
			getViewportWidthPixels: () => 400,
			documentReference: createFakeDocument(),
			addWindowListener(type, listener) {
				windowListeners[type].add(listener)
			},
			removeWindowListener(type, listener) {
				windowListeners[type].delete(listener)
			},
			getBodyUserSelect: () => bodyUserSelect,
			setBodyUserSelect(value) {
				bodyUserSelect = value
			},
			suppressNextClick() {
				clickSuppressionCount += 1
			},
		},
	)

	controller.syncViewState({
		targets: sampleTargets,
		starRoles: sampleRoles,
		currentTargetIndex: 0,
		activeStarRoles: [...sampleRoles.map((role) => role.id), ''],
	})

	function dispatchWindowPointerEvent(event: PointerEvent) {
		const listeners = Array.from(
			windowListeners[
				event.type as 'pointermove' | 'pointerup' | 'pointercancel'
			],
		)
		for (const listener of listeners) {
			listener(event)
		}
	}

	function advanceTime(deltaMilliseconds: number) {
		currentTimeMilliseconds += deltaMilliseconds

		const readyFrames = Array.from(animationFrameCallbacks.entries())
		animationFrameCallbacks.clear()
		for (const [, callback] of readyFrames) {
			callback(currentTimeMilliseconds)
		}

		for (const [identifier, scheduled] of Array.from(
			timeoutCallbacks.entries(),
		)) {
			if (scheduled.triggerAtMilliseconds <= currentTimeMilliseconds) {
				timeoutCallbacks.delete(identifier)
				scheduled.callback()
			}
		}
	}

	function performHorizontalSwipe({
		startX = 240,
		deltaX,
		pointerId = 1,
		release = true,
	}: {
		startX?: number
		deltaX: number
		pointerId?: number
		release?: boolean
	}) {
		controller.onPointerDown(
			createFakePointerEvent({
				type: 'pointerdown',
				clientX: startX,
				clientY: 300,
				pointerId,
			}),
		)
		advanceTime(16)
		dispatchWindowPointerEvent(
			createFakePointerEvent({
				type: 'pointermove',
				clientX: startX + deltaX,
				clientY: 300,
				pointerId,
			}),
		)
		if (release) {
			advanceTime(16)
			dispatchWindowPointerEvent(
				createFakePointerEvent({
					type: 'pointerup',
					clientX: startX + deltaX,
					clientY: 300,
					pointerId,
				}),
			)
		}
	}

	return {
		controller,
		overlayStates,
		appliedRoleSelections,
		analyticsEvents,
		getHapticCount: () => hapticCount,
		getClickSuppressionCount: () => clickSuppressionCount,
		getBodyUserSelect: () => bodyUserSelect,
		getListenerCount: () =>
			Object.values(windowListeners).reduce(
				(total, listeners) => total + listeners.size,
				0,
			),
		getLatestOverlayState: () => overlayStates[overlayStates.length - 1],
		dispatchWindowPointerEvent,
		advanceTime,
		performHorizontalSwipe,
	}
}

test('allows swipe start on regular list elements when no blocking overlays are active', () => {
	const listElement = createFakeElement()
	const documentReference = createFakeDocument()

	expect(shouldIgnoreSwipeStart(listElement, documentReference)).toBe(false)
})

test('allows swipe start when search-modal is only peeking at the bottom', () => {
	const listElement = createFakeElement()
	const peekingSearchModal = createFakeElement({
		identifier: 'search-modal',
		attributes: { 'data-breakpoint': '0.1436' },
	})
	const documentReference = createFakeDocument([peekingSearchModal])

	expect(shouldIgnoreSwipeStart(listElement, documentReference)).toBe(false)
})

test('plays commit animation, triggers light haptic once, holds lock, and fades out to idle', () => {
	const harness = createControllerHarness()

	harness.performHorizontalSwipe({ deltaX: -140 })

	expect(harness.appliedRoleSelections).toEqual([['role-father']])
	expect(harness.getLatestOverlayState().phase).toBe('committing')
	expect(harness.getHapticCount()).toBe(0)

	harness.advanceTime(COMMIT_ANIMATION_DURATION_MILLISECONDS)
	expect(harness.getHapticCount()).toBe(1)
	expect(harness.analyticsEvents).toEqual([
		{ direction: 'next', targetTitle: 'Father' },
	])
	expect(harness.getLatestOverlayState().phase).toBe('committing')
	expect(harness.getLatestOverlayState().closingOpacity).toBe(1)

	harness.advanceTime(LOCK_HOLD_DURATION_MILLISECONDS)
	harness.advanceTime(FADE_OUT_DURATION_MILLISECONDS / 2)
	expect(harness.getLatestOverlayState().isVisible).toBe(true)
	expect(harness.getLatestOverlayState().closingOpacity).toBeLessThan(1)

	harness.advanceTime(FADE_OUT_DURATION_MILLISECONDS)
	expect(harness.getLatestOverlayState().isVisible).toBe(false)
	expect(harness.getLatestOverlayState().phase).toBe('idle')
})

test('accepts a new pointerdown during commit animation and starts from the newly committed role', () => {
	const harness = createControllerHarness()

	harness.performHorizontalSwipe({ deltaX: -140, pointerId: 1 })
	expect(harness.appliedRoleSelections).toEqual([['role-father']])
	expect(harness.getLatestOverlayState().phase).toBe('committing')

	harness.advanceTime(25)
	expect(harness.getHapticCount()).toBe(0)

	harness.performHorizontalSwipe({
		deltaX: -140,
		pointerId: 2,
		release: false,
	})

	expect(harness.getHapticCount()).toBe(1)
	const activeSwipeOverlay = harness.getLatestOverlayState()
	expect(activeSwipeOverlay.isVisible).toBe(true)
	expect(activeSwipeOverlay.phase).toBe('swiping')
	expect(activeSwipeOverlay.fromTarget?.title).toBe('Father')
	expect(activeSwipeOverlay.toTarget?.title).toBe('Partner')
	expect(activeSwipeOverlay.closingOpacity).toBe(1)

	harness.dispatchWindowPointerEvent(
		createFakePointerEvent({
			type: 'pointerup',
			clientX: 100,
			clientY: 300,
			pointerId: 2,
		}),
	)

	expect(harness.appliedRoleSelections).toEqual([
		['role-father'],
		['role-partner'],
	])

	harness.advanceTime(COMMIT_ANIMATION_DURATION_MILLISECONDS)
	expect(harness.getHapticCount()).toBe(2)
})

test('accepts a new pointerdown during lock hold without dropping input', () => {
	const harness = createControllerHarness()

	harness.performHorizontalSwipe({ deltaX: -140, pointerId: 1 })
	harness.advanceTime(COMMIT_ANIMATION_DURATION_MILLISECONDS)
	expect(harness.getHapticCount()).toBe(1)

	harness.advanceTime(LOCK_HOLD_DURATION_MILLISECONDS / 2)
	expect(harness.getLatestOverlayState().phase).toBe('committing')

	harness.performHorizontalSwipe({ deltaX: -140, pointerId: 2 })

	expect(harness.appliedRoleSelections).toEqual([
		['role-father'],
		['role-partner'],
	])

	harness.advanceTime(COMMIT_ANIMATION_DURATION_MILLISECONDS)
	expect(harness.getHapticCount()).toBe(2)
})

test('accepts a new pointerdown during fade-out and restores full overlay opacity for the next swipe', () => {
	const harness = createControllerHarness()

	harness.performHorizontalSwipe({ deltaX: -140, pointerId: 1 })
	harness.advanceTime(COMMIT_ANIMATION_DURATION_MILLISECONDS)
	harness.advanceTime(LOCK_HOLD_DURATION_MILLISECONDS)
	harness.advanceTime(FADE_OUT_DURATION_MILLISECONDS / 2)

	expect(harness.getLatestOverlayState().closingOpacity).toBeLessThan(1)

	harness.performHorizontalSwipe({
		deltaX: -140,
		pointerId: 2,
		release: false,
	})

	const nextSwipeOverlay = harness.getLatestOverlayState()
	expect(nextSwipeOverlay.phase).toBe('swiping')
	expect(nextSwipeOverlay.fromTarget?.title).toBe('Father')
	expect(nextSwipeOverlay.toTarget?.title).toBe('Partner')
	expect(nextSwipeOverlay.closingOpacity).toBe(1)

	harness.dispatchWindowPointerEvent(
		createFakePointerEvent({
			type: 'pointerup',
			clientX: 100,
			clientY: 300,
			pointerId: 2,
		}),
	)
	expect(harness.appliedRoleSelections).toEqual([
		['role-father'],
		['role-partner'],
	])
})

test('supports rapid triple swipe in quick succession before React re-renders', () => {
	const harness = createControllerHarness()

	harness.performHorizontalSwipe({ deltaX: -140, pointerId: 1 })
	harness.advanceTime(20)
	harness.performHorizontalSwipe({ deltaX: -140, pointerId: 2 })
	harness.advanceTime(20)
	harness.performHorizontalSwipe({ deltaX: -140, pointerId: 3 })

	expect(harness.appliedRoleSelections).toEqual([
		['role-father'],
		['role-partner'],
		['role-engineer'],
	])

	harness.advanceTime(COMMIT_ANIMATION_DURATION_MILLISECONDS)
	expect(harness.getHapticCount()).toBe(3)
	expect(harness.analyticsEvents.map((entry) => entry.targetTitle)).toEqual([
		'Father',
		'Partner',
		'Engineer',
	])
})

test('accepts a new pointerdown during cancelling animation from the current role', () => {
	const harness = createControllerHarness()

	harness.performHorizontalSwipe({ deltaX: -20, pointerId: 1 })
	expect(harness.appliedRoleSelections).toEqual([])
	harness.advanceTime(16)
	expect(harness.getLatestOverlayState().phase).toBe('cancelling')

	harness.performHorizontalSwipe({
		deltaX: -140,
		pointerId: 2,
		release: false,
	})

	const nextSwipeOverlay = harness.getLatestOverlayState()
	expect(nextSwipeOverlay.phase).toBe('swiping')
	expect(nextSwipeOverlay.fromTarget?.title).toBe('All')
	expect(nextSwipeOverlay.toTarget?.title).toBe('Father')
	expect(nextSwipeOverlay.closingOpacity).toBe(1)
})

test('ignores swipe start when a full modal, menu, or overlay is active', () => {
	const listElement = createFakeElement()
	const fullSearchModal = createFakeElement({
		identifier: 'search-modal',
		attributes: { 'data-breakpoint': '1' },
	})
	const activeMenu = createFakeElement()

	expect(
		shouldIgnoreSwipeStart(listElement, createFakeDocument([fullSearchModal])),
	).toBe(true)
	expect(
		shouldIgnoreSwipeStart(listElement, createFakeDocument([activeMenu])),
	).toBe(true)
})

test('ignores swipe start on interactive controls or in composed event path', () => {
	const documentReference = createFakeDocument()
	const reorderHandle = createFakeElement({
		matchedSelectors: ['ion-reorder'],
	})
	const checkboxElement = createFakeElement({
		matchedSelectors: ['ion-checkbox'],
	})
	const floatingActionButton = createFakeElement({
		matchedSelectors: ['ion-fab-button'],
	})
	const shadowChild = createFakeElement()

	expect(shouldIgnoreSwipeStart(reorderHandle, documentReference)).toBe(true)
	expect(shouldIgnoreSwipeStart(checkboxElement, documentReference)).toBe(true)
	expect(
		shouldIgnoreSwipeStart(floatingActionButton, documentReference),
	).toBe(true)
	expect(
		shouldIgnoreSwipeStart(shadowChild, documentReference, [
			shadowChild,
			checkboxElement,
		]),
	).toBe(true)
})

test('keeps commit overlay and haptic playing when pointerdown during transition is only a tap or vertical scroll', () => {
	const harness = createControllerHarness()

	harness.performHorizontalSwipe({ deltaX: -140, pointerId: 1 })
	harness.advanceTime(30)

	harness.controller.onPointerDown(
		createFakePointerEvent({
			type: 'pointerdown',
			clientX: 200,
			clientY: 300,
			pointerId: 2,
		}),
	)
	harness.advanceTime(16)
	harness.dispatchWindowPointerEvent(
		createFakePointerEvent({
			type: 'pointerup',
			clientX: 202,
			clientY: 301,
			pointerId: 2,
		}),
	)

	expect(harness.getLatestOverlayState().phase).toBe('committing')
	expect(harness.getClickSuppressionCount()).toBe(1)

	harness.advanceTime(COMMIT_ANIMATION_DURATION_MILLISECONDS)
	expect(harness.getHapticCount()).toBe(1)
})

test('preserves the first committed role if a second rapid swipe is cancelled', () => {
	const harness = createControllerHarness()

	harness.performHorizontalSwipe({ deltaX: -140, pointerId: 1 })
	harness.advanceTime(25)
	harness.performHorizontalSwipe({ deltaX: -20, pointerId: 2 })

	expect(harness.appliedRoleSelections).toEqual([['role-father']])
	expect(harness.getLatestOverlayState().phase).toBe('cancelling')
	expect(harness.getLatestOverlayState().fromTarget?.title).toBe('Father')
})

test('handles null or non-element targets safely without throwing', () => {
	const documentReference = createFakeDocument()
	const plainEventTarget = {} as EventTarget

	expect(shouldIgnoreSwipeStart(null, documentReference)).toBe(false)
	expect(shouldIgnoreSwipeStart(plainEventTarget, documentReference)).toBe(
		false,
	)
})

test('ignores secondary pointers, non-primary mouse buttons, single-target views, and events after dispose', () => {
	const harness = createControllerHarness()

	harness.controller.onPointerDown(
		createFakePointerEvent({
			type: 'pointerdown',
			isPrimary: false,
		}),
	)
	harness.controller.onPointerDown(
		createFakePointerEvent({
			type: 'pointerdown',
			pointerType: 'mouse',
			button: 2,
		}),
	)
	expect(harness.overlayStates).toEqual([])

	harness.controller.syncViewState({
		targets: [sampleTargets[0]],
		starRoles: [],
		currentTargetIndex: 0,
		activeStarRoles: [''],
	})
	harness.performHorizontalSwipe({ deltaX: -140 })
	expect(harness.overlayStates).toEqual([])

	harness.controller.dispose()
	harness.controller.syncViewState({
		targets: sampleTargets,
		starRoles: sampleRoles,
		currentTargetIndex: 0,
		activeStarRoles: [...sampleRoles.map((role) => role.id), ''],
	})
	harness.performHorizontalSwipe({ deltaX: -140 })
	expect(harness.overlayStates).toEqual([])
})

test('still fades out the overlay when haptic or analytics feedback throws', () => {
	const consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {})
	const harness = createControllerHarness({ throwOnFeedback: true })

	harness.performHorizontalSwipe({ deltaX: -140 })
	harness.advanceTime(COMMIT_ANIMATION_DURATION_MILLISECONDS)
	harness.advanceTime(LOCK_HOLD_DURATION_MILLISECONDS)
	harness.advanceTime(FADE_OUT_DURATION_MILLISECONDS * 2)

	expect(consoleErrorSpy).toHaveBeenCalled()
	expect(harness.getLatestOverlayState().isVisible).toBe(false)
	expect(harness.getLatestOverlayState().phase).toBe('idle')
	consoleErrorSpy.mockRestore()
})

test('recovers to a clean idle state when applying the role selection throws mid-gesture', () => {
	const consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {})
	const harness = createControllerHarness({ throwOnApply: true })

	expect(() => harness.performHorizontalSwipe({ deltaX: -140 })).not.toThrow()

	expect(harness.getLatestOverlayState().isVisible).toBe(false)
	expect(harness.getListenerCount()).toBe(0)
	expect(harness.getBodyUserSelect()).toBe('')
	expect(consoleErrorSpy).toHaveBeenCalled()
	consoleErrorSpy.mockRestore()
})
