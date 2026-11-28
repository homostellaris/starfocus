import { expect, test } from 'bun:test'
import type { StarRole } from '../db'
import {
	buildOrderedStarRoleTargets,
	calculateStarRoleTransitionFrame,
	calculateSwipeProgress,
	classifySwipeAxis,
	resolveAdjacentTarget,
	resolveCurrentTargetIndex,
	resolveHomeHeaderTitle,
	resolveTargetActiveStarRoles,
	shouldCommitSwipe,
} from './starRoleSwipe'

const sampleRoles: StarRole[] = [
	{
		id: 'role-partner',
		title: 'Partner',
		description: 'Build shared adventures together',
		icon: { type: 'ionicon', name: 'heartSharp' },
	},
	{
		id: 'role-father',
		title: 'Father',
		description: 'Be present and playful',
		icon: { type: 'ionicon', name: 'maleSharp' },
	},
	{
		id: 'role-engineer',
		title: 'Engineer',
		icon: { type: 'ionicon', name: 'rocketSharp' },
	},
]

test('buildOrderedStarRoleTargets prepends All and sorts roles by starRolesOrder', () => {
	const targets = buildOrderedStarRoleTargets(sampleRoles, [
		{ starRoleId: 'role-father', order: 0 },
		{ starRoleId: 'role-engineer', order: 1 },
		{ starRoleId: 'role-partner', order: 2 },
	])

	expect(targets.map((target) => target.title)).toEqual([
		'All',
		'Father',
		'Engineer',
		'Partner',
	])
	expect(targets[0]).toEqual({
		kind: 'all',
		id: null,
		title: 'All',
	})
	expect(targets[1].kind).toBe('role')
	expect(targets[1].id).toBe('role-father')
})

test('resolveCurrentTargetIndex returns 0 when all roles are active and matching index for a focused role', () => {
	const targets = buildOrderedStarRoleTargets(sampleRoles, [
		{ starRoleId: 'role-father', order: 0 },
		{ starRoleId: 'role-partner', order: 1 },
	])

	expect(
		resolveCurrentTargetIndex(
			targets,
			['role-father', 'role-partner', 'role-engineer', ''],
			true,
		),
	).toBe(0)
	expect(resolveCurrentTargetIndex(targets, ['role-partner'], false)).toBe(2)
})

test('resolveAdjacentTarget steps forward and backward with circular wrapping', () => {
	const targets = buildOrderedStarRoleTargets(sampleRoles, [
		{ starRoleId: 'role-father', order: 0 },
		{ starRoleId: 'role-partner', order: 1 },
		{ starRoleId: 'role-engineer', order: 2 },
	])

	expect(resolveAdjacentTarget(targets, 0, 'next')?.target.title).toBe('Father')
	expect(resolveAdjacentTarget(targets, 3, 'next')?.target.title).toBe('All')
	expect(resolveAdjacentTarget(targets, 0, 'previous')?.target.title).toBe(
		'Engineer',
	)
	expect(resolveAdjacentTarget(targets, 2, 'previous')?.target.title).toBe(
		'Father',
	)
})

test('resolveTargetActiveStarRoles returns all role identifiers plus unassigned for All and single identifier for a role', () => {
	const targets = buildOrderedStarRoleTargets(sampleRoles, [])

	expect(resolveTargetActiveStarRoles(targets[0], sampleRoles)).toEqual([
		'role-partner',
		'role-father',
		'role-engineer',
		'',
	])
	expect(resolveTargetActiveStarRoles(targets[2], sampleRoles)).toEqual([
		'role-father',
	])
})

test('buildOrderedStarRoleTargets iterates only All and individual star roles, skipping star role groups', () => {
	const groupedRoles: StarRole[] = [
		{
			id: 'role-father',
			title: 'Father',
			starRoleGroupId: 'group-family',
			icon: { type: 'ionicon', name: 'maleSharp' },
		},
		{
			id: 'role-partner',
			title: 'Partner',
			starRoleGroupId: 'group-family',
			icon: { type: 'ionicon', name: 'heartSharp' },
		},
		{
			id: 'role-engineer',
			title: 'Engineer',
			starRoleGroupId: 'group-craft',
			icon: { type: 'ionicon', name: 'rocketSharp' },
		},
	]

	const targets = buildOrderedStarRoleTargets(groupedRoles, [
		{ starRoleId: 'role-father', order: 0 },
		{ starRoleId: 'role-partner', order: 1 },
		{ starRoleId: 'role-engineer', order: 2 },
	])

	expect(targets.map((target) => target.title)).toEqual([
		'All',
		'Father',
		'Partner',
		'Engineer',
	])
	expect(targets.every((target) => target.kind === 'all' || target.kind === 'role')).toBe(
		true,
	)
})

test('resolveHomeHeaderTitle returns current star role title or All when all roles are active', () => {
	const targets = buildOrderedStarRoleTargets(sampleRoles, [
		{ starRoleId: 'role-father', order: 0 },
		{ starRoleId: 'role-partner', order: 1 },
		{ starRoleId: 'role-engineer', order: 2 },
	])

	expect(
		resolveHomeHeaderTitle(
			targets,
			['role-father', 'role-partner', 'role-engineer', ''],
			true,
		),
	).toBe('All')
	expect(resolveHomeHeaderTitle(targets, ['role-partner'], false)).toBe(
		'Partner',
	)
	expect(
		resolveHomeHeaderTitle(targets, ['role-father', 'role-partner'], false),
	).toBe('Home')
	expect(resolveHomeHeaderTitle(targets, ['missing-role'], false)).toBe('Home')
})

test('classifySwipeAxis identifies horizontal swipes, vertical scrolls, and pending dead zone', () => {
	expect(classifySwipeAxis(4, 3, 10)).toBe('pending')
	expect(classifySwipeAxis(-28, 6, 10)).toBe('horizontal')
	expect(classifySwipeAxis(32, -8, 10)).toBe('horizontal')
	expect(classifySwipeAxis(5, 24, 10)).toBe('vertical')
})

test('calculateSwipeProgress maps horizontal delta to direction and clamped progress', () => {
	expect(calculateSwipeProgress(-90, 180)).toEqual({
		direction: 'next',
		progress: 0.5,
	})
	expect(calculateSwipeProgress(135, 180)).toEqual({
		direction: 'previous',
		progress: 0.75,
	})
	expect(calculateSwipeProgress(-400, 180)).toEqual({
		direction: 'next',
		progress: 1,
	})
})

test('shouldCommitSwipe commits when drag passes threshold or on a fast directional flick', () => {
	expect(shouldCommitSwipe(0.5, -0.05, 'next', -90)).toBe(true)
	expect(shouldCommitSwipe(0.2, -0.6, 'next', -40)).toBe(true)
	expect(shouldCommitSwipe(0.2, 0.55, 'previous', 36)).toBe(true)
})

test('calculateStarRoleTransitionFrame keeps outgoing centered at 0 and blasts incoming into center at 1', () => {
	const startFrame = calculateStarRoleTransitionFrame(0, 'next', 400)
	expect(startFrame.backdropOpacity).toBe(0)
	expect(startFrame.outgoing.translateXPixels).toBe(0)
	expect(startFrame.outgoing.opacity).toBe(1)
	expect(startFrame.incoming.opacity).toBe(0)

	const earlyFrame = calculateStarRoleTransitionFrame(0.1, 'next', 400)
	expect(earlyFrame.backdropOpacity).toBeGreaterThan(0.35)
	expect(earlyFrame.outgoing.translateXPixels).toBeLessThan(0)
	expect(earlyFrame.incoming.translateXPixels).toBeGreaterThan(0)
	expect(earlyFrame.incoming.opacity).toBeGreaterThan(0.35)

	const midFrame = calculateStarRoleTransitionFrame(0.55, 'next', 400)
	expect(midFrame.incoming.translateXPixels).toBeLessThan(
		earlyFrame.incoming.translateXPixels,
	)
	expect(midFrame.incoming.translateXPixels).toBeGreaterThan(0)

	const endFrame = calculateStarRoleTransitionFrame(1, 'next', 400)
	expect(endFrame.backdropOpacity).toBeGreaterThan(0.75)
	expect(endFrame.outgoing.opacity).toBe(0)
	expect(endFrame.incoming.translateXPixels).toBe(0)
	expect(endFrame.incoming.scale).toBe(1)
	expect(endFrame.incoming.opacity).toBe(1)
})

test('calculateStarRoleTransitionFrame mirrors travel direction for previous swipes and accelerates toward the end', () => {
	const earlyPrevious = calculateStarRoleTransitionFrame(0.2, 'previous', 400)
	const midPrevious = calculateStarRoleTransitionFrame(0.55, 'previous', 400)
	const latePrevious = calculateStarRoleTransitionFrame(0.9, 'previous', 400)

	expect(earlyPrevious.outgoing.translateXPixels).toBeGreaterThan(0)
	expect(earlyPrevious.incoming.translateXPixels).toBeLessThan(0)
	expect(midPrevious.incoming.translateXPixels).toBeGreaterThan(
		earlyPrevious.incoming.translateXPixels,
	)
	expect(latePrevious.incoming.translateXPixels).toBeGreaterThan(
		midPrevious.incoming.translateXPixels,
	)
	expect(latePrevious.incoming.streakLengthPixels).toBeGreaterThan(
		earlyPrevious.incoming.streakLengthPixels,
	)
})

test('resolveAdjacentTarget returns null when there are no star roles beyond All', () => {
	const targets = buildOrderedStarRoleTargets([], [])

	expect(targets).toHaveLength(1)
	expect(resolveAdjacentTarget(targets, 0, 'next')).toBeNull()
	expect(resolveAdjacentTarget(targets, 0, 'previous')).toBeNull()
})

test('resolveCurrentTargetIndex falls back to 0 when custom multi-selection is active or role is missing', () => {
	const targets = buildOrderedStarRoleTargets(sampleRoles, [])

	expect(
		resolveCurrentTargetIndex(targets, ['role-father', 'role-partner'], false),
	).toBe(0)
	expect(resolveCurrentTargetIndex(targets, ['unknown-role'], false)).toBe(0)
})

test('shouldCommitSwipe returns false for short slow drags, zero movement, or opposing velocity', () => {
	expect(shouldCommitSwipe(0.25, -0.1, 'next', -45)).toBe(false)
	expect(shouldCommitSwipe(0, 0, 'next', 0)).toBe(false)
	expect(shouldCommitSwipe(0.15, 0.8, 'next', -28)).toBe(false)
})

test('classifySwipeAxis treats diagonal motion favoring Y as vertical scroll', () => {
	expect(classifySwipeAxis(18, 20, 10)).toBe('vertical')
})

test('functions handle bad or out-of-bounds inputs safely without NaN or throwing', () => {
	expect(calculateSwipeProgress(-50, 0)).toEqual({
		direction: 'next',
		progress: 0,
	})
	expect(calculateSwipeProgress(Number.NaN, 180)).toEqual({
		direction: 'next',
		progress: 0,
	})

	const clampedLow = calculateStarRoleTransitionFrame(-2, 'next', 0)
	const clampedHigh = calculateStarRoleTransitionFrame(5, 'previous', -100)
	expect(Number.isNaN(clampedLow.incoming.translateXPixels)).toBe(false)
	expect(Number.isNaN(clampedHigh.incoming.translateXPixels)).toBe(false)
	expect(clampedHigh.incoming.translateXPixels).toBe(0)
	expect(clampedHigh.incoming.opacity).toBe(1)

	expect(resolveAdjacentTarget([], 0, 'next')).toBeNull()
	expect(resolveAdjacentTarget(buildOrderedStarRoleTargets(sampleRoles, []), -1, 'next')).not.toBeNull()
})

test('buildOrderedStarRoleTargets keeps unordered roles after ordered ones in their original order', () => {
	const targets = buildOrderedStarRoleTargets(sampleRoles, [
		{ starRoleId: 'role-engineer', order: 0 },
	])

	expect(targets.map(target => target.id)).toEqual([
		null,
		'role-engineer',
		'role-partner',
		'role-father',
	])
})
