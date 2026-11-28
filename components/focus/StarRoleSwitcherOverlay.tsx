'use client'

import { StarRoleIcon } from '../common/StarRoleIcon'
import { type Mode, useMood } from '../mood/MoodContext'
import {
	calculateStarRoleTransitionFrame,
	COMMIT_PROGRESS_THRESHOLD,
	resolveStreakGradientDirection,
	type StarRoleViewTarget,
	type SwipeDirection,
	type SwipePhase,
	type WarpEmblemTransform,
} from './starRoleSwipe'

interface OverlayMoodPalette {
	backdropGlow: string
	warpStreakStops: string
	emblemStreakStops: string
	incomingRingClass: string
	incomingIconClass: string
	allTargetIconColor: 'primary' | 'danger'
	subtitleClass: string
	activeDotClass: string
}

const OVERLAY_MOOD_PALETTES: Record<Mode, OverlayMoodPalette> = {
	chill: {
		backdropGlow:
			'radial-gradient(circle at 50% 48%, rgba(6, 182, 212, 0.24), rgba(96, 165, 250, 0.14) 34%, rgba(9, 9, 11, 0.96) 72%)',
		warpStreakStops:
			'rgba(251, 113, 133, 0.45), rgba(232, 121, 249, 0.55), rgba(96, 165, 250, 0.85)',
		emblemStreakStops: 'rgba(96, 165, 250, 0.9), rgba(167, 139, 250, 0.45)',
		incomingRingClass:
			'border-blue-400/50 bg-zinc-900/90 shadow-cyan-500/40',
		incomingIconClass: 'text-blue-300',
		allTargetIconColor: 'primary',
		subtitleClass: 'text-blue-300/80',
		activeDotClass:
			'w-6 bg-blue-400 shadow-[0_0_8px_rgba(6,182,212,0.85)]',
	},
	hype: {
		backdropGlow:
			'radial-gradient(circle at 50% 48%, rgba(244, 63, 94, 0.24), rgba(232, 121, 249, 0.14) 34%, rgba(9, 9, 11, 0.96) 72%)',
		warpStreakStops:
			'rgba(96, 165, 250, 0.45), rgba(232, 121, 249, 0.55), rgba(251, 113, 133, 0.85)',
		emblemStreakStops: 'rgba(251, 113, 133, 0.9), rgba(232, 121, 249, 0.45)',
		incomingRingClass:
			'border-rose-400/50 bg-zinc-900/90 shadow-rose-500/40',
		incomingIconClass: 'text-rose-300',
		allTargetIconColor: 'danger',
		subtitleClass: 'text-rose-300/80',
		activeDotClass:
			'w-6 bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.85)]',
	},
}

const WARP_STREAK_POSITIONS = [
	{ top: '26%', width: '34%' },
	{ top: '38%', width: '48%' },
	{ top: '50%', width: '58%' },
	{ top: '62%', width: '44%' },
	{ top: '74%', width: '30%' },
]

export default function StarRoleSwitcherOverlay({
	isVisible,
	fromTarget,
	toTarget,
	direction,
	progress,
	phase,
	targets,
	activeTargetIndex,
	targetIndex,
	viewportWidthPixels = 390,
	closingOpacity = 1,
}: {
	isVisible: boolean
	fromTarget: StarRoleViewTarget | null
	toTarget: StarRoleViewTarget | null
	direction: SwipeDirection
	progress: number
	phase: SwipePhase
	targets: StarRoleViewTarget[]
	activeTargetIndex: number
	targetIndex: number
	viewportWidthPixels?: number
	closingOpacity?: number
}) {
	const { mode } = useMood()

	if (!isVisible || !fromTarget || !toTarget) {
		return null
	}

	const moodPalette = OVERLAY_MOOD_PALETTES[mode]
	const frame = calculateStarRoleTransitionFrame(
		progress,
		direction,
		viewportWidthPixels,
	)

	const resolvedClosingOpacity = Number.isFinite(closingOpacity)
		? Math.min(1, Math.max(0, closingOpacity))
		: 1
	const combinedBackdropOpacity =
		frame.backdropOpacity * resolvedClosingOpacity

	return (
		<div
			aria-live="polite"
			className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden pointer-events-none select-none"
			data-direction={direction}
			data-from-role={fromTarget.title}
			data-mood={mode}
			data-phase={phase}
			data-testid="star-role-switcher-overlay"
			data-to-role={toTarget.title}
			style={{ opacity: resolvedClosingOpacity }}
		>
			<div
				className="absolute inset-0 bg-zinc-950 backdrop-blur-md"
				style={{
					opacity: combinedBackdropOpacity,
					backgroundImage: moodPalette.backdropGlow,
				}}
			/>

			<WarpStreaks
				direction={direction}
				moodPalette={moodPalette}
				opacity={frame.warpStreaksOpacity}
				scaleX={frame.warpStreaksScaleX}
			/>

			<div className="relative z-10 flex items-center justify-center w-full max-w-lg px-6 h-72">
				<RoleEmblemCard
					direction={direction}
					moodPalette={moodPalette}
					role="outgoing"
					target={fromTarget}
					testIdentifier="switcher-from-role"
					transform={frame.outgoing}
				/>
				<RoleEmblemCard
					direction={direction}
					moodPalette={moodPalette}
					role="incoming"
					target={toTarget}
					testIdentifier="switcher-to-role"
					transform={frame.incoming}
				/>
			</div>

			{targets.length > 1 && (
				<ConstellationDots
					activeTargetIndex={activeTargetIndex}
					moodPalette={moodPalette}
					progress={progress}
					targetIndex={targetIndex}
					targets={targets}
				/>
			)}
		</div>
	)
}

function WarpStreaks({
	direction,
	moodPalette,
	opacity,
	scaleX,
}: {
	direction: SwipeDirection
	moodPalette: OverlayMoodPalette
	opacity: number
	scaleX: number
}) {
	const gradientDirection = resolveStreakGradientDirection(direction)

	return (
		<div
			aria-hidden="true"
			className="absolute inset-0 pointer-events-none"
			data-testid="warp-streaks"
			style={{ opacity }}
		>
			{WARP_STREAK_POSITIONS.map((streak, index) => (
				<div
					key={index}
					className="absolute left-1/2 h-[2px] -translate-x-1/2 rounded-full"
					style={{
						top: streak.top,
						width: streak.width,
						transform: `translateX(-50%) scaleX(${scaleX})`,
						background: `linear-gradient(${gradientDirection}, transparent, ${moodPalette.warpStreakStops}, transparent)`,
					}}
				/>
			))}
		</div>
	)
}

function RoleEmblemCard({
	target,
	transform,
	direction,
	moodPalette,
	role,
	testIdentifier,
}: {
	target: StarRoleViewTarget
	transform: WarpEmblemTransform
	direction: SwipeDirection
	moodPalette: OverlayMoodPalette
	role: 'outgoing' | 'incoming'
	testIdentifier: string
}) {
	const isIncoming = role === 'incoming'
	const streakSideClass =
		direction === 'next' ? 'left-full ml-3' : 'right-full mr-3'
	const streakGradientDirection = resolveStreakGradientDirection(direction)

	return (
		<div
			className="absolute inset-0 flex flex-col items-center justify-center text-center will-change-transform"
			data-testid={testIdentifier}
			style={{
				opacity: transform.opacity,
				transform: `translate3d(${transform.translateXPixels}px, 0, 0) scale(${transform.scale})`,
				filter:
					transform.blurPixels > 0.1
						? `blur(${transform.blurPixels}px)`
						: undefined,
			}}
		>
			<div className="relative flex items-center justify-center mb-5">
				{transform.streakLengthPixels > 0 && transform.streakOpacity > 0.02 && (
					<div
						aria-hidden="true"
						className={`absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full pointer-events-none ${streakSideClass}`}
						style={{
							width: `${transform.streakLengthPixels}px`,
							opacity: transform.streakOpacity,
							background: `linear-gradient(${streakGradientDirection}, ${moodPalette.emblemStreakStops}, transparent)`,
						}}
					/>
				)}

				<div
					className={`flex items-center justify-center rounded-full border shadow-2xl ${
						isIncoming
							? `w-28 h-28 md:w-32 md:h-32 ${moodPalette.incomingRingClass}`
							: 'w-24 h-24 md:w-28 md:h-28 border-zinc-700/70 bg-zinc-900/70 shadow-black/50'
					}`}
				>
					<StarRoleIcon
						className={
							isIncoming
								? `text-6xl md:text-7xl ${moodPalette.incomingIconClass}`
								: 'text-5xl md:text-6xl text-zinc-200'
						}
						color={
							target.kind === 'all'
								? moodPalette.allTargetIconColor
								: undefined
						}
						starRole={target.starRole}
					/>
				</div>
			</div>

			<span
				className={`mb-1.5 font-mono text-[11px] font-semibold tracking-[0.26em] uppercase ${moodPalette.subtitleClass}`}
			>
				{target.kind === 'all' ? 'All Roles' : 'Star Role'}
			</span>

			<h2
				className={`font-bold tracking-tight text-white drop-shadow-sm ${
					isIncoming ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'
				}`}
			>
				{target.title}
			</h2>

			{target.description && (
				<p className="max-w-xs mt-2 text-sm text-zinc-400 line-clamp-2">
					{target.description}
				</p>
			)}
		</div>
	)
}

function ConstellationDots({
	targets,
	activeTargetIndex,
	targetIndex,
	progress,
	moodPalette,
}: {
	targets: StarRoleViewTarget[]
	activeTargetIndex: number
	targetIndex: number
	progress: number
	moodPalette: OverlayMoodPalette
}) {
	const highlightedIndex = progress >= COMMIT_PROGRESS_THRESHOLD ? targetIndex : activeTargetIndex

	return (
		<div
			className="relative z-10 flex items-center gap-2 px-3 py-1.5 mt-4 rounded-full border border-zinc-800/80 bg-zinc-900/75"
			data-testid="switcher-constellation-dots"
		>
			{targets.map((target, index) => {
				const isHighlighted = index === highlightedIndex
				return (
					<span
						key={target.id ?? 'all'}
						aria-label={target.title}
						className={`h-2 rounded-full transition-all duration-150 ${
							isHighlighted ? moodPalette.activeDotClass : 'w-2 bg-zinc-600'
						}`}
					/>
				)
			})}
		</div>
	)
}
