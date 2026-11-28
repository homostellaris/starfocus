import { expect, test } from 'bun:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { StarRole } from '../db'
import { type Mode, MoodProvider } from '../mood/MoodContext'
import StarRoleSwitcherOverlay from './StarRoleSwitcherOverlay'
import { buildOrderedStarRoleTargets } from './starRoleSwipe'

const sampleRoles: StarRole[] = [
	{
		id: 'role-father',
		title: 'Father',
		description: 'Be present and playful',
		icon: { type: 'ionicon', name: 'maleSharp' },
	},
	{
		id: 'role-engineer',
		title: 'Engineer',
		description: 'Ship joyful cosmic software',
		icon: { type: 'ionicon', name: 'rocketSharp' },
	},
]

const sampleTargets = buildOrderedStarRoleTargets(sampleRoles, [
	{ starRoleId: 'role-father', order: 0 },
	{ starRoleId: 'role-engineer', order: 1 },
])

function renderOverlay(
	props: Partial<React.ComponentProps<typeof StarRoleSwitcherOverlay>> = {},
	mode: Mode = 'chill',
) {
	return renderToStaticMarkup(
		<MoodProvider initialMode={mode}>
			<StarRoleSwitcherOverlay
				isVisible={true}
				fromTarget={sampleTargets[0]}
				toTarget={sampleTargets[1]}
				direction="next"
				progress={0.35}
				phase="swiping"
				targets={sampleTargets}
				activeTargetIndex={0}
				targetIndex={1}
				viewportWidthPixels={400}
				{...props}
			/>
		</MoodProvider>,
	)
}

test('renders full-screen switcher overlay with chill mood accent, streaks, dots, and cyan glow by default', () => {
	const html = renderOverlay({
		fromTarget: sampleTargets[0],
		toTarget: sampleTargets[1],
		progress: 0.3,
	})

	expect(html).toContain('data-testid="star-role-switcher-overlay"')
	expect(html).toContain('data-mood="chill"')
	expect(html).toContain('fixed inset-0')
	expect(html).toContain('data-testid="switcher-from-role"')
	expect(html).toContain('data-testid="switcher-to-role"')
	expect(html).toContain('All')
	expect(html).toContain('Father')
	expect(html).toContain('Be present and playful')
	expect(html).toContain('data-class="star-role-icon"')
	expect(html).toContain('data-star-role="Father"')
	expect(html).toContain('border-blue-400/50')
	expect(html).toContain('shadow-cyan-500/40')
	expect(html).toContain('text-blue-300')
	expect(html).toContain('bg-blue-400 shadow-[0_0_8px_rgba(6,182,212,0.85)]')
	expect(html).toContain(
		'rgba(251, 113, 133, 0.45), rgba(232, 121, 249, 0.55), rgba(96, 165, 250, 0.85)',
	)
})

test('drives overlay accent, streaks, dots, and rose glow from hype mood', () => {
	const html = renderOverlay(
		{
			fromTarget: sampleTargets[1],
			toTarget: sampleTargets[0],
			direction: 'previous',
			activeTargetIndex: 1,
			targetIndex: 0,
			progress: 0.55,
		},
		'hype',
	)

	expect(html).toContain('data-mood="hype"')
	expect(html).toContain('border-rose-400/50')
	expect(html).toContain('shadow-rose-500/40')
	expect(html).toContain('text-rose-300')
	expect(html).toContain('text-rose-300/80')
	expect(html).toContain('bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.85)]')
	expect(html).toContain(
		'rgba(96, 165, 250, 0.45), rgba(232, 121, 249, 0.55), rgba(251, 113, 133, 0.85)',
	)
	expect(html).toContain('rgba(251, 113, 133, 0.9)')
	expect(html).toContain('color="danger"')
	expect(html).not.toContain('text-blue-300')
	expect(html).not.toContain('bg-blue-400')
	expect(html).not.toContain('shadow-cyan-500/40')
	expect(html).not.toContain('color="primary"')
})

test('renders warp motion streaks and constellation progress dots for targets', () => {
	const html = renderOverlay({
		fromTarget: sampleTargets[1],
		toTarget: sampleTargets[2],
		activeTargetIndex: 1,
		targetIndex: 2,
		progress: 0.65,
	})

	expect(html).toContain('data-testid="warp-streaks"')
	expect(html).toContain('data-testid="switcher-constellation-dots"')
	expect(html).toContain('Father')
	expect(html).toContain('Engineer')
	expect(html).toContain('data-star-role="Engineer"')
})

test('centers incoming Star Role with full opacity when swipe reaches completion', () => {
	const html = renderOverlay({
		fromTarget: sampleTargets[0],
		toTarget: sampleTargets[1],
		progress: 1,
		phase: 'committing',
	})

	expect(html).toContain('data-phase="committing"')
	expect(html).toContain('translate3d(0px, 0, 0) scale(1)')
})

test('renders nothing when isVisible is false', () => {
	const html = renderOverlay({ isVisible: false })

	expect(html).toBe('')
})

test('handles missing fromTarget or toTarget gracefully without throwing', () => {
	const html = renderOverlay({
		fromTarget: null,
		toTarget: null,
		targets: [],
	})

	expect(html).toBe('')
})

test('clamps out-of-bounds progress values cleanly when rendering', () => {
	const html = renderOverlay({
		progress: 2.5,
	})

	expect(html).toContain('data-testid="star-role-switcher-overlay"')
	expect(html).toContain('translate3d(0px, 0, 0) scale(1)')
})

test('throws when rendered outside MoodProvider', () => {
	expect(() =>
		renderToStaticMarkup(
			<StarRoleSwitcherOverlay
				isVisible={true}
				fromTarget={sampleTargets[0]}
				toTarget={sampleTargets[1]}
				direction="next"
				progress={0.35}
				phase="swiping"
				targets={sampleTargets}
				activeTargetIndex={0}
				targetIndex={1}
			/>,
		),
	).toThrow('useMood must be used within a MoodProvider')
})

test('falls back to full opacity when closingOpacity is not finite', () => {
	const html = renderOverlay({ closingOpacity: Number.NaN })

	expect(html).toContain('opacity:1')
	expect(html).not.toContain('NaN')
})
