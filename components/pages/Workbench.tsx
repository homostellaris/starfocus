'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
	IonBadge,
	IonButton,
	IonButtons,
	IonChip,
	IonContent,
	IonHeader,
	IonIcon,
	IonInput,
	IonLabel,
	IonModal,
	IonRange,
	IonSelect,
	IonSelectOption,
	IonTitle,
	IonToggle,
	IonToolbar,
} from '@ionic/react'
import {
	syncSharp,
	cloudDoneSharp,
	documentTextSharp,
	starSharp,
	sparklesSharp,
	rocketSharp,
	pulseSharp,
	musicalNotesSharp,
	duplicateOutline,
	alertCircleOutline,
	settingsSharp,
	helpCircleSharp,
	planetSharp,
} from 'ionicons/icons'
import dayjs from 'dayjs'
import { Header } from '../common/Header'
import PlanetAsset from '../assets/PlanetAsset'
import {
	CELESTIAL_CLASS_LABELS,
	CELESTIAL_POINT_TIERS,
	generateProceduralPlanetSpec,
} from '../assets/planetGenerator'
import {
	STAR_POINTS_THEMES,
	STAR_POINTS_THEME_IDS,
	type StarPointsThemeId,
	useStarPointsTheme,
} from '../theme/starPointsThemes'
import ModularStarship from '../assets/ModularStarship'
import {
	SHIP_ARCHETYPE_IDS,
	SHIP_ARCHETYPE_LIST,
	SHIP_CATALOG,
	SHIP_COLOR_PALETTES,
	SHIP_SKINS,
	SHIP_SOCKET_MANIFESTS,
} from '../assets/shipAssembler'
import SpaceArcadeCanvas from '../arcade/SpaceArcadeCanvas'
import { calculateSlingshotImpulse } from '../arcade/arcadePhysics'
import type {
	ShipArchetypeId,
	ShipSkinId,
} from '../assets/types'
import SyncStatus, { CloudSyncStatusBadge, MarkdownSyncStatusBadge } from '../common/SyncStatus'
import MomentumSyncIcon, {
	type MomentumTelemetry,
} from '../common/MomentumSyncIcon'
import MomentumSettingsIcon from '../common/MomentumSettingsIcon'
import HelpIcon from '../common/HelpIcon'
import { StarRoleIcon } from '../common/StarRoleIcon'
import StarPoints from '../common/StarPoints'
import Starship from '../common/Starship'
import Tracjectory from '../starship/Trajectory'
import PulseGraph from '../todos/PulseGraph'
import Mood from '../mood'
import { MoodProvider, useMood } from '../mood/MoodContext'
import { DuplicateAlert } from '../todos/duplicate/DuplicateAlert'
import {
	findDuplicatesForTitle,
	type DuplicateMatch,
} from '../todos/duplicate/detector'
import type { ExportStatus } from '../export/useMarkdownExport'
import type { Todo, Visit } from '../db'

const WORKBENCH_SAMPLE_TODOS: Todo[] = [
	{ id: 'sample-1', title: 'Buy oat milk', starPoints: 2 },
	{
		id: 'sample-2',
		title: 'Prepare quarterly goals',
		starPoints: 5,
		noteInitialContent: 'Target 20% expansion',
	},
	{ id: 'sample-3', title: 'Fix critical auth bug', starPoints: 3 },
	{ id: 'sample-4', title: 'Auth critical bug fix', starPoints: 1 },
]

type ComponentKey =
	| 'celestial-body'
	| 'starship'
	| 'sync-status'
	| 'sync-icon'
	| 'settings-icon'
	| 'help-icon'
	| 'cloud-sync'
	| 'markdown-sync'
	| 'star-roles'
	| 'star-points'
	| 'starship-trajectory'
	| 'pulse-graph'
	| 'mood-player'
	| 'duplicate-detector'

interface CatalogItem {
	key: ComponentKey
	title: string
	subtitle: string
	description: string
	icon: any
	iconColor: string
	badge: string
}

const CATALOG_ITEMS: CatalogItem[] = [
	{
		key: 'sync-status',
		title: 'Unified Sync Status Popover',
		subtitle: 'Header Popover & Combined Synchronization',
		description:
			'Consolidates Dexie Cloud database replication and local Markdown folder export into an interactive popover with live phase indicators, sync progress bars, and one-click triggers.',
		icon: syncSharp,
		iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
		badge: 'Core UI',
	},
	{
		key: 'sync-icon',
		title: 'Momentum & Inertia Sync Icon',
		subtitle: 'Physical Flywheel Spinner & Inertial Coasting',
		description:
			'Physical rotational flywheel simulation for synchronization indicators. Features angular acceleration, viscous friction coasting, guaranteed minimum animation impulse, and smooth momentum physics.',
		icon: syncSharp,
		iconColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
		badge: 'Motion',
	},
	{
		key: 'settings-icon',
		title: 'Momentum & Inertia Settings Cog',
		subtitle: 'Physical Flywheel Spinner & Inertial Coasting',
		description:
			'Physical rotational flywheel simulation for the settings cog. Starts spinning when the settings menu opens, cruises with momentum while open, and coasts to a smooth stop with inertia when closed.',
		icon: settingsSharp,
		iconColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
		badge: 'Motion',
	},
	{
		key: 'help-icon',
		title: 'Curious Beacon Help Icon',
		subtitle: 'Inquisitive Wobble & Cosmic Beacon Animation',
		description:
			'Playful, inquisitive animation for the help icon trigger while the popover is active. Features curious tilting, floating hover, and a celestial beacon aura pulse.',
		icon: helpCircleSharp,
		iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
		badge: 'Motion',
	},
	{
		key: 'cloud-sync',
		title: 'Cloud Sync Details & Status',
		subtitle: 'Dexie Cloud Database Replication',
		description:
			'Detailed replication metrics and current sync indicators',
		icon: cloudDoneSharp,
		iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
		badge: 'Database',
	},
	{
		key: 'markdown-sync',
		title: 'Markdown Local Sync Details & Status',
		subtitle: 'Local File System Folder Sync',
		description:
			'Detailed inspector for local Markdown backup and folder export. Displays file sync counters, reconnect states, and full export triggers.',
		icon: documentTextSharp,
		iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
		badge: 'Storage',
	},
	{
		key: 'star-roles',
		title: 'Star Role Icons',
		subtitle: 'Gamified Role Categories',
		description:
			'Visual representation of user-defined star roles (e.g. Captain, Engineer, Navigator, Botanist) with customized Ionic icon mapping, role groups, and color accents.',
		icon: starSharp,
		iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
		badge: 'Identity',
	},
	{
		key: 'star-points',
		title: 'Star Points',
		subtitle: 'Gamified Score & Leveling',
		description:
			'Progression score indicator that displays the user’s accumulated star points. Supports Fibonacci score scaling (1, 2, 3, 5, 8, 13) with cosmic star styling.',
		icon: sparklesSharp,
		iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
		badge: 'Progression',
	},
	{
		key: 'starship-trajectory',
		title: 'Starship & Trajectory Animation',
		subtitle: 'Flight Corridor & Spacecraft Navigation',
		description:
			'Interactive spacecraft position, rotation, and hyperdrive visualization.',
		icon: rocketSharp,
		iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
		badge: 'Animation',
	},
	{
		key: 'pulse-graph',
		title: 'Activity Pulse Graph',
		subtitle: '14-Day Activity Pulse Visualizer',
		description:
			'Inspects user daily task completion intensity and Fibonacci point distribution.',
		icon: pulseSharp,
		iconColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
		badge: 'Analytics',
	},
	{
		key: 'mood-player',
		title: 'Mood Soundtrack Player',
		subtitle: 'Dynamic Soundscapes & Audio Channels',
		description:
			'Ambient background audio stream with dual channels (Chill vs Hype).',
		icon: musicalNotesSharp,
		iconColor: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
		badge: 'Audio',
	},
	{
		key: 'duplicate-detector',
		title: 'Duplicate Todo Detector',
		subtitle: 'Fuzzy Matching & Prevention Interface',
		description:
			'Detects, prevents, and resolves duplicate or similar tasks across active and completed lists using fuzzy token-set Jaccard and edit distance clustering.',
		icon: duplicateOutline,
		iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
		badge: 'Database',
	},
	{
		key: 'celestial-body',
		title: 'Celestial Body',
		subtitle: 'Procedural Todo Planets, Stars & Black Holes',
		description:
			'Deterministic 128×128 celestial bodies seeded by todo ID, tiered by Fibonacci Star Points (1pt Asteroid → 2pt Dwarf Planet → 3pt Medium Planet → 5pt Gas Giant → 8pt Star → 13pt Black Hole), and themed by Star Role.',
		icon: planetSharp,
		iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
		badge: 'Procedural',
	},
	{
		key: 'starship',
		title: 'Starship',
		subtitle: 'Selectable Spacecraft Models, Skins & Slingshot Launch',
		description:
			'High-craft birds-eye spacecraft renderer with whole selectable ship hulls (Vanguard, Phantom, Helios, Atlas, Valkyrie), custom paint skins, animated ion thrusters, and interactive slingshot launch physics.',
		icon: rocketSharp,
		iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
		badge: 'Spacecraft',
	},
]

const VALID_COMPONENTS: ComponentKey[] = CATALOG_ITEMS.map((item) => item.key)

const COMPONENT_TITLES: Record<ComponentKey, string> = Object.fromEntries(
	CATALOG_ITEMS.map((item) => [item.key, item.title])
) as Record<ComponentKey, string>

const COMPONENT_DESCRIPTIONS: Record<ComponentKey, string> = Object.fromEntries(
	CATALOG_ITEMS.map((item) => [item.key, item.description])
) as Record<ComponentKey, string>

const STAR_POINT_TIERS = [
	{ points: 1, shortLabel: '1pt Asteroid', emoji: '🪨' },
	{ points: 2, shortLabel: '2pt Dwarf Planet', emoji: '🌑' },
	{ points: 3, shortLabel: '3pt Medium Planet', emoji: '🌍' },
	{ points: 5, shortLabel: '5pt Gas Giant', emoji: '🪐' },
	{ points: 8, shortLabel: '8pt Star', emoji: '☀️' },
	{ points: 13, shortLabel: '13pt Black Hole', emoji: '🕳️' },
] as const

const WORKBENCH_ARCADE_TODOS: Todo[] = [
	{
		id: 'tds0Q5i__n4r2jYrf8JQB_p2z|ucom',
		title: 'Procedural game-friendly visual assets',
		starPoints: 13,
	},
	{
		id: 'todo-star-8',
		title: 'Ignite stellar fusion core',
		starPoints: 8,
	},
	{
		id: 'todo-gas-giant-5',
		title: 'Chart Jovian ring system',
		starPoints: 5,
	},
	{
		id: 'todo-terrestrial-3',
		title: 'Establish orbital biosphere',
		starPoints: 3,
	},
	{
		id: 'todo-dwarf-2',
		title: 'Survey cratered dwarf world',
		starPoints: 2,
	},
	{
		id: 'todo-asteroid-1',
		title: 'Mine regolith fragment',
		starPoints: 1,
	},
]

function WorkbenchContent() {
	const params = useParams<{ component?: string }>()
	const { mode, setMode } = useMood()

	const resolvedComponentParam =
		params.component === 'procedural-assets'
			? 'celestial-body'
			: params.component

	const activeComponent: ComponentKey =
		resolvedComponentParam &&
		VALID_COMPONENTS.includes(resolvedComponentParam as ComponentKey)
			? (resolvedComponentParam as ComponentKey)
			: 'sync-status'

	// --- State Simulator Knobs for Sync Menu ---
	const [cloudLoggedIn, setCloudLoggedIn] = useState(true)
	const [cloudPhase, setCloudPhase] = useState<'in-sync' | 'pushing' | 'pulling' | 'offline' | 'error'>('in-sync')
	const [cloudProgress, setCloudProgress] = useState(0.65)
	const [cloudHasError, setCloudHasError] = useState(false)
	const [cloudErrorMessage, setCloudErrorMessage] = useState('Network request timed out')
	const [userEmail] = useState('astronomer@starfocus.app')

	const [markdownEnabled, setMarkdownEnabled] = useState(true)
	const [markdownNeedsReconnect, setMarkdownNeedsReconnect] = useState(false)
	const [markdownIsSyncing, setMarkdownIsSyncing] = useState(false)
	const [markdownFullSyncPhase, setMarkdownFullSyncPhase] = useState<'idle' | 'in-progress' | 'complete'>('idle')
	const [markdownCompletedFiles, setMarkdownCompletedFiles] = useState(14)
	const [markdownTotalFiles, setMarkdownTotalFiles] = useState(38)
	const [markdownHasError, setMarkdownHasError] = useState(false)
	const [markdownErrorMessage, setMarkdownErrorMessage] = useState('File permission not granted')
	const [createdCount] = useState(2)
	const [updatedCount] = useState(5)
	const [deletedCount] = useState(0)

	// --- Momentum & Inertia Knobs ---
	const [momentumEnabled, setMomentumEnabled] = useState(true)
	const [momentumMaxVelocity, setMomentumMaxVelocity] = useState(540)
	const [momentumAcceleration, setMomentumAcceleration] = useState(960)
	const [momentumFriction, setMomentumFriction] = useState(2.4)
	const [momentumMinImpulseDuration, setMomentumMinImpulseDuration] = useState(650)
	const [momentumTelemetry, setMomentumTelemetry] = useState<MomentumTelemetry>({
		phase: 'idle',
		velocity: 0,
		angle: 0,
		isSyncing: false,
		isCoasting: false,
	})

	const controlsSheetRef = useRef<HTMLIonModalElement | null>(null)

	const triggerPulseSync = (durationMilliseconds: number) => {
		setCloudLoggedIn(true)
		setCloudHasError(false)
		setCloudPhase('pushing')
		setCloudProgress(0.5)
		setTimeout(() => {
			setCloudPhase('in-sync')
		}, durationMilliseconds)
	}

	// --- Settings Cog Ratchet Knobs ---
	const [settingsMenuOpen, setSettingsMenuOpen] = useState(false)
	const [settingsPhysicsEnabled, setSettingsPhysicsEnabled] = useState(true)
	const [settingsStepIncrement, setSettingsStepIncrement] = useState(60)
	const [settingsStepDuration, setSettingsStepDuration] = useState(280)
	const [settingsHoldDuration, setSettingsHoldDuration] = useState(900)
	const [settingsTelemetry, setSettingsTelemetry] = useState<MomentumTelemetry>({
		phase: 'idle',
		velocity: 0,
		angle: 0,
		isSyncing: false,
		isCoasting: false,
	})

	const triggerPulseSettings = (durationMilliseconds: number) => {
		setSettingsMenuOpen(true)
		setTimeout(() => {
			setSettingsMenuOpen(false)
		}, durationMilliseconds)
	}

	// --- Help Icon Knobs ---
	const [helpPopoverOpen, setHelpPopoverOpen] = useState(true)
	const [helpIconSize, setHelpIconSize] = useState<any>('xl')

	// --- Sync Status Presentation Knobs ---
	const [syncStatusInline, setSyncStatusInline] = useState(false)

	// --- Star Role Knobs ---
	const [selectedIcon, setSelectedIcon] = useState('starSharp')
	const [selectedColor, setSelectedColor] = useState('#f59e0b')
	const [selectedRoleTitle, setSelectedRoleTitle] = useState('Captain')

	// --- Starship & Trajectory Knobs ---
	const [starshipPosition, setStarshipPosition] = useState(120)
	const [starshipRotation, setStarshipRotation] = useState(180)

	// --- Celestial Body & Whole-App Star Points Theme Knobs ---
	const {
		themeId: activeStarThemeId,
		theme: activeStarTheme,
		setThemeId: setActiveStarThemeId,
	} = useStarPointsTheme()
	const [workbenchPlanetPoints, setWorkbenchPlanetPoints] = useState(13)
	const [workbenchPlanetSeed, setWorkbenchPlanetSeed] = useState(
		'tds0Q5i__n4r2jYrf8JQB_p2z|ucom',
	)
	const [workbenchPlanetSize, setWorkbenchPlanetSize] = useState(148)
	const [workbenchPlanetDithering, setWorkbenchPlanetDithering] = useState(true)
	const [workbenchPlanetGlow, setWorkbenchPlanetGlow] = useState(true)
	const [workbenchShowTierLineup, setWorkbenchShowTierLineup] = useState(true)

	// --- Starship Knobs ---
	const [workbenchShipArchetype, setWorkbenchShipArchetype] =
		useState<ShipArchetypeId>('interceptor_vanguard_mk1')
	const [workbenchShipSkin, setWorkbenchShipSkin] =
		useState<ShipSkinId>('vanguard_cyan')
	const [workbenchShipSize, setWorkbenchShipSize] = useState(144)
	const [workbenchShipRotation, setWorkbenchShipRotation] = useState(0)
	const [workbenchShipThrusterActive, setWorkbenchShipThrusterActive] =
		useState(true)
	const [workbenchShipFlightMode, setWorkbenchShipFlightMode] = useState(false)
	const [workbenchShipLaunchVelocity, setWorkbenchShipLaunchVelocity] =
		useState<{ vx: number; vy: number } | undefined>(undefined)
	const [workbenchSlingshotDrag, setWorkbenchSlingshotDrag] = useState<{
		startX: number
		startY: number
		currentX: number
		currentY: number
	} | null>(null)
	const workbenchSlingshotDragRef = useRef<{
		startX: number
		startY: number
		currentX: number
		currentY: number
	} | null>(null)

	const handleSelectStarTheme = (nextThemeId: StarPointsThemeId) => {
		setActiveStarThemeId(nextThemeId)
		setWorkbenchShipSkin(STAR_POINTS_THEMES[nextThemeId].shipSkinId)
	}

	const startWorkbenchSlingshot = (clientX: number, clientY: number) => {
		const initialDrag = {
			startX: clientX,
			startY: clientY,
			currentX: clientX,
			currentY: clientY,
		}
		workbenchSlingshotDragRef.current = initialDrag
		setWorkbenchSlingshotDrag(initialDrag)
	}

	useEffect(() => {
		if (typeof window === 'undefined') return

		const handlePointerMove = (event: PointerEvent) => {
			if (!workbenchSlingshotDragRef.current) return
			const nextDrag = {
				...workbenchSlingshotDragRef.current,
				currentX: event.clientX,
				currentY: event.clientY,
			}
			workbenchSlingshotDragRef.current = nextDrag
			setWorkbenchSlingshotDrag(nextDrag)
		}

		const handlePointerUp = (event: PointerEvent) => {
			const activeDrag = workbenchSlingshotDragRef.current
			if (!activeDrag) return
			workbenchSlingshotDragRef.current = null
			setWorkbenchSlingshotDrag(null)

			const impulse = calculateSlingshotImpulse(
				{ startX: activeDrag.startX, startY: activeDrag.startY },
				{ currentX: event.clientX, currentY: event.clientY },
			)
			if (impulse) {
				setWorkbenchShipRotation(Math.round(impulse.angleDegrees))
				setWorkbenchShipLaunchVelocity({ vx: impulse.vx, vy: impulse.vy })
				if (activeComponent === 'starship-trajectory') {
					setStarshipRotation(Math.round(impulse.angleDegrees))
					setStarshipPosition(previous =>
						Math.max(10, Math.min(280, Math.round(previous + impulse.vy * 0.35))),
					)
				} else {
					setWorkbenchShipFlightMode(true)
				}
			}
		}

		window.addEventListener('pointermove', handlePointerMove)
		window.addEventListener('pointerup', handlePointerUp)
		window.addEventListener('pointercancel', handlePointerUp)
		return () => {
			window.removeEventListener('pointermove', handlePointerMove)
			window.removeEventListener('pointerup', handlePointerUp)
			window.removeEventListener('pointercancel', handlePointerUp)
		}
	}, [activeComponent])

	const workbenchPlanetSpec = useMemo(
		() =>
			generateProceduralPlanetSpec({
				todo: {
					id: workbenchPlanetSeed,
					title: 'Procedural Celestial Body',
					starPoints: workbenchPlanetPoints,
				},
				themeId: activeStarThemeId,
			}),
		[activeStarThemeId, workbenchPlanetPoints, workbenchPlanetSeed],
	)

	const workbenchSlingshotPull = useMemo(() => {
		if (!workbenchSlingshotDrag) return null
		const dx = workbenchSlingshotDrag.currentX - workbenchSlingshotDrag.startX
		const dy = workbenchSlingshotDrag.currentY - workbenchSlingshotDrag.startY
		const distance = Math.hypot(dx, dy)
		return { dx, dy, distance }
	}, [workbenchSlingshotDrag])

	// --- Pulse Graph Knobs ---
	const [pulseStarPoints, setPulseStarPoints] = useState(5)
	const [pulsePreset, setPulsePreset] = useState<'streak' | 'recent' | 'sporadic' | 'empty'>('streak')

	// --- Duplicate Detector Knobs ---
	const [duplicateSimulatedTitle, setDuplicateSimulatedTitle] = useState('Buy oatmilk')
	const [duplicatePreset, setDuplicatePreset] = useState<'fuzzy' | 'exact' | 'mixed' | 'clean'>('fuzzy')
	const [duplicatePreventionActive, setDuplicatePreventionActive] = useState(true)

	const workbenchSimulatedMatches: DuplicateMatch[] = useMemo(() => {
		if (!duplicateSimulatedTitle.trim()) return []
		return findDuplicatesForTitle(
			duplicateSimulatedTitle,
			WORKBENCH_SAMPLE_TODOS,
			undefined,
			new Set(['sample-1', 'sample-2']),
			0.7,
		)
	}, [duplicateSimulatedTitle])

	const simulatedVisits: Visit[] = useMemo(() => {
		const list: Visit[] = []
		for (let i = 0; i < 14; i++) {
			const d = dayjs().subtract(i, 'day').toDate()
			if (pulsePreset === 'streak') {
				list.push({ todoId: 'bench-1', date: d }, { todoId: 'bench-1', date: d })
			} else if (pulsePreset === 'recent') {
				if (i < 4) {
					list.push({ todoId: 'bench-1', date: d }, { todoId: 'bench-1', date: d })
				}
			} else if (pulsePreset === 'sporadic') {
				if (i % 2 === 0) {
					list.push({ todoId: 'bench-1', date: d })
				}
			}
		}
		return list
	}, [pulsePreset])

	// Construct simulated states for sync
	const simulatedUser = cloudLoggedIn
		? { email: userEmail, isLoggedIn: true, name: 'Pilot' }
		: null

	const simulatedSyncState = {
		phase: cloudPhase,
		progress: cloudProgress,
		license: 'Pro License (Active)',
		status: cloudPhase === 'in-sync' ? 'Connected' : cloudPhase,
		error: cloudHasError ? { message: cloudErrorMessage } : undefined,
	}

	const simulatedExportStatus: ExportStatus = {
		isEnabled: markdownEnabled,
		isSupported: true,
		directoryName: 'Todos/StarVault',
		totalFiles: markdownTotalFiles,
		needsReconnect: markdownNeedsReconnect,
		isSyncing: markdownIsSyncing,
		lastSyncAt: new Date(),
		lastSyncResult: {
			created: createdCount,
			updated: updatedCount,
			deleted: deletedCount,
			failed: 0,
		},
		error: markdownHasError ? markdownErrorMessage : null,
		fullSync: {
			phase: markdownFullSyncPhase,
			progress:
				markdownFullSyncPhase === 'in-progress'
					? { completed: markdownCompletedFiles, total: markdownTotalFiles }
					: null,
			error: null,
		},
	}

	// Presets dispatcher
	const applyPreset = (
		preset:
			| 'synced'
			| 'cloud-pushing'
			| 'markdown-syncing'
			| 'cloud-error'
			| 'markdown-error'
			| 'logged-out'
			| 'ship-launch'
			| 'ship-cruise'
			| 'ship-dock'
			| 'pulse-streak'
			| 'pulse-recent'
			| 'pulse-cold'
			| 'mood-chill'
			| 'mood-hype'
	) => {
		switch (preset) {
			case 'synced':
				setCloudLoggedIn(true)
				setCloudPhase('in-sync')
				setCloudHasError(false)
				setMarkdownEnabled(true)
				setMarkdownNeedsReconnect(false)
				setMarkdownIsSyncing(false)
				setMarkdownFullSyncPhase('idle')
				setMarkdownHasError(false)
				break
			case 'cloud-pushing':
				setCloudLoggedIn(true)
				setCloudPhase('pushing')
				setCloudProgress(0.72)
				setCloudHasError(false)
				setMarkdownFullSyncPhase('idle')
				setMarkdownIsSyncing(false)
				setMarkdownNeedsReconnect(false)
				setMarkdownHasError(false)
				break
			case 'markdown-syncing':
				setCloudLoggedIn(true)
				setCloudPhase('in-sync')
				setCloudHasError(false)
				setMarkdownEnabled(true)
				setMarkdownNeedsReconnect(false)
				setMarkdownFullSyncPhase('in-progress')
				setMarkdownCompletedFiles(18)
				setMarkdownTotalFiles(45)
				setMarkdownHasError(false)
				break
			case 'cloud-error':
				setCloudLoggedIn(true)
				setCloudPhase('error')
				setCloudHasError(true)
				setCloudErrorMessage('WebSocket connection closed unexpectedly (503)')
				setMarkdownFullSyncPhase('idle')
				setMarkdownHasError(false)
				break
			case 'markdown-error':
				setCloudLoggedIn(true)
				setCloudPhase('in-sync')
				setCloudHasError(false)
				setMarkdownEnabled(true)
				setMarkdownNeedsReconnect(true)
				setMarkdownFullSyncPhase('idle')
				setMarkdownHasError(true)
				setMarkdownErrorMessage('User denied directory handle permission')
				break
			case 'logged-out':
				setCloudLoggedIn(false)
				setCloudPhase('offline')
				setCloudHasError(false)
				setMarkdownFullSyncPhase('idle')
				break
			case 'ship-launch':
				setStarshipPosition(260)
				setStarshipRotation(180)
				setMode('hype')
				break
			case 'ship-cruise':
				setStarshipPosition(120)
				setStarshipRotation(180)
				setMode('chill')
				break
			case 'ship-dock':
				setStarshipPosition(15)
				setStarshipRotation(180)
				setMode('chill')
				break
			case 'pulse-streak':
				setPulseStarPoints(13)
				setPulsePreset('streak')
				break
			case 'pulse-recent':
				setPulseStarPoints(5)
				setPulsePreset('recent')
				break
			case 'pulse-cold':
				setPulseStarPoints(1)
				setPulsePreset('empty')
				break
			case 'mood-chill':
				setMode('chill')
				break
			case 'mood-hype':
				setMode('hype')
				break
		}
	}

	const isSyncComponent =
		activeComponent === 'sync-status' ||
		activeComponent === 'cloud-sync' ||
		activeComponent === 'markdown-sync'

	const presetsForActiveComponent = (() => {
		if (activeComponent === 'sync-icon') {
			return [
				{
					id: 'pulse-quick',
					label: '⚡ 150ms Pulse',
					action: () => triggerPulseSync(150),
					active: false,
				},
				{
					id: 'pulse-standard',
					label: '⏱️ Standard Sync (1.5s)',
					action: () => triggerPulseSync(1500),
					active: false,
				},
				{
					id: 'pulse-long',
					label: '🚀 Long Transfer (4.0s)',
					action: () => triggerPulseSync(4000),
					active: false,
				},
				{
					id: 'toggle-continuous',
					label: cloudPhase === 'pushing' ? '⏹ Stop Continuous' : '▶ Continuous Sync',
					action: () => {
						if (cloudPhase === 'pushing') {
							setCloudPhase('in-sync')
						} else {
							setCloudLoggedIn(true)
							setCloudHasError(false)
							setCloudPhase('pushing')
						}
					},
					active: cloudPhase === 'pushing',
				},
				{
					id: 'preset-heavy',
					label: '🛸 Heavy Flywheel',
					action: () => {
						setMomentumMaxVelocity(360)
						setMomentumAcceleration(450)
						setMomentumFriction(1.4)
						setMomentumMinImpulseDuration(800)
					},
					active: momentumMaxVelocity === 360 && momentumFriction === 1.4,
				},
				{
					id: 'preset-hyper',
					label: '⚡ Hyper Drive',
					action: () => {
						setMomentumMaxVelocity(720)
						setMomentumAcceleration(1400)
						setMomentumFriction(3.0)
						setMomentumMinImpulseDuration(500)
					},
					active: momentumMaxVelocity === 720 && momentumFriction === 3.0,
				},
			]
		}
		if (activeComponent === 'settings-icon') {
			return [
				{
					id: 'settings-open',
					label: settingsMenuOpen ? '⏹ Close Menu (Coast)' : '▶ Open Menu (Cruise)',
					action: () => setSettingsMenuOpen(!settingsMenuOpen),
					active: settingsMenuOpen,
				},
				{
					id: 'settings-tap',
					label: '⚡ 500ms Tap',
					action: () => triggerPulseSettings(500),
					active: false,
				},
				{
					id: 'settings-standard',
					label: '⏱️ 1.5s Open',
					action: () => triggerPulseSettings(1500),
					active: false,
				},
				{
					id: 'settings-heavy',
					label: '🛸 Heavy Ratchet (45° / 1.2s)',
					action: () => {
						setSettingsStepIncrement(45)
						setSettingsStepDuration(360)
						setSettingsHoldDuration(1200)
					},
					active: settingsStepIncrement === 45 && settingsHoldDuration === 1200,
				},
				{
					id: 'settings-precision',
					label: '⏱️ Escapement Tick (60° / 0.8s)',
					action: () => {
						setSettingsStepIncrement(60)
						setSettingsStepDuration(240)
						setSettingsHoldDuration(800)
					},
					active: settingsStepIncrement === 60 && settingsHoldDuration === 800,
				},
			]
		}
		if (activeComponent === 'help-icon') {
			return [
				{
					id: 'help-toggle',
					label: helpPopoverOpen ? '⏹ Close Popover (Resting)' : '✨ Open Popover (Beacon)',
					action: () => setHelpPopoverOpen(!helpPopoverOpen),
					active: helpPopoverOpen,
				},
				{
					id: 'help-size-sm',
					label: 'Size sm (16px)',
					action: () => setHelpIconSize('sm'),
					active: helpIconSize === 'sm',
				},
				{
					id: 'help-size-md',
					label: 'Size md (20px)',
					action: () => setHelpIconSize('md'),
					active: helpIconSize === 'md',
				},
				{
					id: 'help-size-lg',
					label: 'Size lg (32px)',
					action: () => setHelpIconSize('lg'),
					active: helpIconSize === 'lg',
				},
				{
					id: 'help-size-xl',
					label: 'Size xl (48px)',
					action: () => setHelpIconSize('xl'),
					active: helpIconSize === 'xl',
				},
			]
		}
		if (isSyncComponent) {
			return [
				{
					id: 'synced',
					label: '🟢 All Synced',
					action: () => applyPreset('synced'),
					active:
						cloudPhase === 'in-sync' &&
						!cloudHasError &&
						!markdownNeedsReconnect &&
						!markdownHasError &&
						!markdownIsSyncing &&
						markdownFullSyncPhase === 'idle',
				},
				{
					id: 'cloud-pushing',
					label: '🔵 Cloud Uploading',
					action: () => applyPreset('cloud-pushing'),
					active: cloudPhase === 'pushing',
				},
				{
					id: 'markdown-syncing',
					label: '🟣 Full MD Sync',
					action: () => applyPreset('markdown-syncing'),
					active: markdownFullSyncPhase === 'in-progress',
				},
				{
					id: 'cloud-error',
					label: '🔴 Cloud Error',
					action: () => applyPreset('cloud-error'),
					active: cloudHasError,
				},
				{
					id: 'markdown-error',
					label: '🟡 Reconnect Needed',
					action: () => applyPreset('markdown-error'),
					active: markdownNeedsReconnect,
				},
				{
					id: 'logged-out',
					label: '⚪ Signed Out',
					action: () => applyPreset('logged-out'),
					active: !cloudLoggedIn,
				},
			]
		}
		if (activeComponent === 'star-roles') {
			return [
				{
					id: 'role-star',
					label: '⭐ Captain',
					action: () => {
						setSelectedIcon('starSharp')
						setSelectedColor('#f59e0b')
						setSelectedRoleTitle('Captain')
					},
					active: selectedIcon === 'starSharp',
				},
				{
					id: 'role-planet',
					label: '🪐 Navigator',
					action: () => {
						setSelectedIcon('planetSharp')
						setSelectedColor('#3b82f6')
						setSelectedRoleTitle('Navigator')
					},
					active: selectedIcon === 'planetSharp',
				},
				{
					id: 'role-rocket',
					label: '🚀 Pilot',
					action: () => {
						setSelectedIcon('rocketSharp')
						setSelectedColor('#ec4899')
						setSelectedRoleTitle('Pilot')
					},
					active: selectedIcon === 'rocketSharp',
				},
				{
					id: 'role-energy',
					label: '⚡ Engineer',
					action: () => {
						setSelectedIcon('flashSharp')
						setSelectedColor('#eab308')
						setSelectedRoleTitle('Engineer')
					},
					active: selectedIcon === 'flashSharp',
				},
				{
					id: 'role-sparkles',
					label: '✨ Botanist',
					action: () => {
						setSelectedIcon('sparklesSharp')
						setSelectedColor('#10b981')
						setSelectedRoleTitle('Botanist')
					},
					active: selectedIcon === 'sparklesSharp',
				},
			]
		}
		if (activeComponent === 'starship-trajectory') {
			return [
				{
					id: 'ship-launch',
					label: '🚀 Launch',
					action: () => applyPreset('ship-launch'),
					active: starshipPosition === 260 && mode === 'hype',
				},
				{
					id: 'ship-cruise',
					label: '🛸 Cruise',
					action: () => applyPreset('ship-cruise'),
					active: starshipPosition === 120 && mode === 'chill',
				},
				{
					id: 'ship-dock',
					label: '🎯 Dock',
					action: () => applyPreset('ship-dock'),
					active: starshipPosition === 15,
				},
				{
					id: 'ship-warp',
					label: mode === 'chill' ? '⚡ Warp Drive' : '🌌 Cruise Drive',
					action: () => setMode(mode === 'chill' ? 'hype' : 'chill'),
					active: mode === 'hype',
				},
			]
		}
		if (activeComponent === 'pulse-graph') {
			return [
				{
					id: 'pulse-streak',
					label: '🔥 14d Streak',
					action: () => applyPreset('pulse-streak'),
					active: pulsePreset === 'streak',
				},
				{
					id: 'pulse-recent',
					label: '⚡ Recent Spark',
					action: () => applyPreset('pulse-recent'),
					active: pulsePreset === 'recent',
				},
				{
					id: 'pulse-cold',
					label: '💤 Inactive',
					action: () => applyPreset('pulse-cold'),
					active: pulsePreset === 'empty',
				},
			]
		}
		if (activeComponent === 'mood-player') {
			return [
				{
					id: 'mood-chill',
					label: '🌌 Chill Ambient',
					action: () => applyPreset('mood-chill'),
					active: mode === 'chill',
				},
				{
					id: 'mood-hype',
					label: '⚡ Hype Synthwave',
					action: () => applyPreset('mood-hype'),
					active: mode === 'hype',
				},
			]
		}
		if (activeComponent === 'duplicate-detector') {
			return [
				{
					id: 'dup-fuzzy',
					label: '🔍 Fuzzy Match (91%)',
					action: () => {
						setDuplicatePreset('fuzzy')
						setDuplicateSimulatedTitle('Buy oatmilk')
					},
					active: duplicatePreset === 'fuzzy',
				},
				{
					id: 'dup-exact',
					label: '🎯 Exact Match (100%)',
					action: () => {
						setDuplicatePreset('exact')
						setDuplicateSimulatedTitle('Prepare quarterly goals')
					},
					active: duplicatePreset === 'exact',
				},
				{
					id: 'dup-mixed',
					label: '🌌 Multiple Matches',
					action: () => {
						setDuplicatePreset('mixed')
						setDuplicateSimulatedTitle('Fix critical auth bug')
					},
					active: duplicatePreset === 'mixed',
				},
				{
					id: 'dup-clean',
					label: '✨ Orbit Clear (0 Matches)',
					action: () => {
						setDuplicatePreset('clean')
						setDuplicateSimulatedTitle('Embark to Alpha Centauri')
					},
					active: duplicatePreset === 'clean',
				},
			]
		}
		if (activeComponent === 'celestial-body') {
			return [
				...STAR_POINT_TIERS.map(tier => ({
					id: `celestial-pts-${tier.points}`,
					label: `${tier.emoji} ${tier.shortLabel}`,
					action: () => setWorkbenchPlanetPoints(tier.points),
					active: workbenchPlanetPoints === tier.points,
				})),
				{
					id: 'celestial-random-seed',
					label: '🎲 Randomize Seed',
					action: () =>
						setWorkbenchPlanetSeed(
							`todo-seed-${Math.random().toString(36).slice(2, 10)}`,
						),
					active: false,
				},
			]
		}
		if (activeComponent === 'starship') {
			return [
				...SHIP_ARCHETYPE_IDS.map(archetypeId => ({
					id: `ship-preset-${archetypeId}`,
					label: `🚀 ${SHIP_SOCKET_MANIFESTS[archetypeId].name}`,
					action: () => {
						setWorkbenchShipArchetype(archetypeId)
					},
					active: workbenchShipArchetype === archetypeId && !workbenchShipFlightMode,
				})),
				{
					id: 'ship-toggle-flight',
					label: workbenchShipFlightMode
						? '🛑 Exit Flight Arena'
						: '🎯 Slingshot Flight Arena',
					action: () => setWorkbenchShipFlightMode(previous => !previous),
					active: workbenchShipFlightMode,
				},
			]
		}
		return []
	})()

	const knobsContent = (
		<div className="space-y-5">
			{/* Sync Status Presentation Knobs */}
			{activeComponent === 'sync-status' && (
				<div className="space-y-3 pt-1 text-xs">
					<h4 className="font-semibold text-neutral-300">Presentation Mode</h4>
					<div className="flex items-center justify-between">
						<span>Inline List Embed</span>
						<IonToggle
							checked={syncStatusInline}
							onIonChange={(e) => setSyncStatusInline(e.detail.checked)}
						/>
					</div>
				</div>
			)}

			{/* Component-Specific Knobs */}
			{isSyncComponent && (
				<>
					{/* Cloud Sync Knobs */}
					<div className="space-y-3 pt-3 border-t border-neutral-800/60 text-xs">
						<h4 className="font-semibold text-neutral-300">Cloud Sync Controls</h4>
						<div className="flex items-center justify-between">
							<span>User Logged In</span>
							<IonToggle
								checked={cloudLoggedIn}
								onIonChange={(e) => setCloudLoggedIn(e.detail.checked)}
							/>
						</div>
						<div>
							<span className="block mb-1 text-neutral-400">Replication Phase</span>
							<IonSelect
								id="cloud-phase-select"
								interface="popover"
								value={cloudPhase}
								onIonChange={(e) =>
									setCloudPhase(
										e.detail.value as
											| 'in-sync'
											| 'pushing'
											| 'pulling'
											| 'offline'
											| 'error'
									)
								}
								className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200"
							>
								<IonSelectOption value="in-sync">In-Sync (Connected)</IonSelectOption>
								<IonSelectOption value="pushing">Pushing (Uploading changes)</IonSelectOption>
								<IonSelectOption value="pulling">Pulling (Downloading changes)</IonSelectOption>
								<IonSelectOption value="offline">Offline</IonSelectOption>
								<IonSelectOption value="error">Error</IonSelectOption>
							</IonSelect>
						</div>

						{cloudPhase === 'pushing' && (
							<div>
								<div className="flex justify-between text-neutral-400">
									<span>Progress</span>
									<span>{Math.round(cloudProgress * 100)}%</span>
								</div>
								<IonRange
									min={0}
									max={1}
									step={0.05}
									value={cloudProgress}
									onIonChange={(e) => setCloudProgress(e.detail.value as number)}
								/>
							</div>
						)}

						<div className="flex items-center justify-between">
							<span>Simulate Error</span>
							<IonToggle
								checked={cloudHasError}
								onIonChange={(e) => setCloudHasError(e.detail.checked)}
							/>
						</div>

						{cloudHasError && (
							<div>
								<span className="block mb-1 text-neutral-400">Error Message</span>
								<div className="text-xs text-red-400 mb-1.5 font-mono">{cloudErrorMessage}</div>
								<IonInput
									type="text"
									value={cloudErrorMessage}
									onIonInput={(e) => setCloudErrorMessage((e.detail.value as string) || '')}
									className="w-full rounded border border-red-900/50 bg-neutral-900 px-2 py-1 text-xs text-red-200"
								/>
							</div>
						)}
					</div>

					{/* Markdown Sync Knobs */}
					<div className="space-y-3 pt-3 border-t border-neutral-800/60 text-xs">
						<h4 className="font-semibold text-neutral-300">Markdown Export Controls</h4>
						<div className="flex items-center justify-between">
							<span>Export Enabled</span>
							<IonToggle
								checked={markdownEnabled}
								onIonChange={(e) => setMarkdownEnabled(e.detail.checked)}
							/>
						</div>
						<div className="flex items-center justify-between">
							<span>Directory Needs Reconnect</span>
							<IonToggle
								checked={markdownNeedsReconnect}
								onIonChange={(e) => setMarkdownNeedsReconnect(e.detail.checked)}
							/>
						</div>
						<div className="flex items-center justify-between">
							<span>Background Syncing</span>
							<IonToggle
								checked={markdownIsSyncing}
								onIonChange={(e) => setMarkdownIsSyncing(e.detail.checked)}
							/>
						</div>

						<div>
							<span className="block mb-1 text-neutral-400">Full Sync Phase</span>
							<IonSelect
								id="md-phase-select"
								interface="popover"
								value={markdownFullSyncPhase}
								onIonChange={(e) =>
									setMarkdownFullSyncPhase(
										e.detail.value as 'idle' | 'in-progress' | 'complete'
									)
								}
								className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200"
							>
								<IonSelectOption value="idle">Idle</IonSelectOption>
								<IonSelectOption value="in-progress">In-Progress</IonSelectOption>
								<IonSelectOption value="complete">Complete</IonSelectOption>
							</IonSelect>
						</div>

						{markdownFullSyncPhase === 'in-progress' && (
							<div>
								<div className="flex justify-between text-neutral-400">
									<span>Sync Progress</span>
									<span>
										{markdownCompletedFiles} / {markdownTotalFiles} files
									</span>
								</div>
								<IonRange
									min={0}
									max={markdownTotalFiles}
									value={markdownCompletedFiles}
									onIonChange={(e) => setMarkdownCompletedFiles(e.detail.value as number)}
								/>
							</div>
						)}

						<div className="flex items-center justify-between">
							<span>Simulate Error</span>
							<IonToggle
								checked={markdownHasError}
								onIonChange={(e) => setMarkdownHasError(e.detail.checked)}
							/>
						</div>

						{markdownHasError && (
							<div>
								<span className="block mb-1 text-neutral-400">Error Message</span>
								<div className="text-xs text-red-400 mb-1.5 font-mono">{markdownErrorMessage}</div>
								<IonInput
									type="text"
									value={markdownErrorMessage}
									onIonInput={(e) => setMarkdownErrorMessage((e.detail.value as string) || '')}
									className="w-full rounded border border-red-900/50 bg-neutral-900 px-2 py-1 text-xs text-red-200"
								/>
							</div>
						)}

						<div className="space-y-2 pt-2 border-t border-neutral-800/60">
							<IonButton
								expand="block"
								fill="outline"
								size="small"
								onClick={() => {
									setMarkdownFullSyncPhase('in-progress')
									setMarkdownCompletedFiles(1)
								}}
								disabled={simulatedExportStatus.fullSync?.phase === 'in-progress'}
							>
								Trigger Full Sync
							</IonButton>
							{simulatedExportStatus.needsReconnect && (
								<IonButton
									expand="block"
									fill="solid"
									color="warning"
									size="small"
									onClick={() => {
										setMarkdownNeedsReconnect(false)
										setMarkdownHasError(false)
									}}
								>
									Reconnect Folder
								</IonButton>
							)}
						</div>
					</div>
				</>
			)}

			{/* Momentum & Inertia Physics Knobs for Sync Icon */}
			{activeComponent === 'sync-icon' && (
				<div className="space-y-4 pt-1 text-xs">
					<div className="flex items-center justify-between">
						<h4 className="font-semibold text-neutral-300">Simulation Triggers</h4>
						<IonBadge color="primary" className="text-[10px]">Triggers</IonBadge>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<IonButton
							size="small"
							fill="outline"
							color="primary"
							className="text-xs h-8"
							onClick={() => triggerPulseSync(150)}
						>
							⚡ Quick 150ms
						</IonButton>
						<IonButton
							size="small"
							fill="outline"
							color="primary"
							className="text-xs h-8"
							onClick={() => triggerPulseSync(1500)}
						>
							⏱️ 1.5s Sync
						</IonButton>
						<IonButton
							size="small"
							fill="outline"
							color="primary"
							className="text-xs h-8"
							onClick={() => triggerPulseSync(4000)}
						>
							🚀 4.0s Long
						</IonButton>
						<IonButton
							size="small"
							fill={simulatedSyncState.phase === 'pushing' ? 'solid' : 'outline'}
							color={simulatedSyncState.phase === 'pushing' ? 'danger' : 'medium'}
							className="text-xs h-8"
							onClick={() => {
								if (simulatedSyncState.phase === 'pushing') {
									setCloudPhase('in-sync')
								} else {
									setCloudLoggedIn(true)
									setCloudHasError(false)
									setCloudPhase('pushing')
								}
							}}
						>
							{simulatedSyncState.phase === 'pushing' ? '⏹ Stop' : '▶ Continuous'}
						</IonButton>
					</div>

					{/* Live Telemetry Readout in Knobs */}
					<div className="rounded-lg bg-neutral-800/50 p-2.5 border border-neutral-700/50 font-mono space-y-1.5">
						<div className="flex justify-between items-center text-[11px]">
							<span className="text-neutral-400">Phase:</span>
							<span className="font-semibold text-sky-400 capitalize">{momentumTelemetry.phase}</span>
						</div>
						<div className="flex justify-between items-center text-[11px]">
							<span className="text-neutral-400">Velocity:</span>
							<span className="font-semibold text-neutral-200">{momentumTelemetry.velocity}°/s</span>
						</div>
						<div className="flex justify-between items-center text-[11px]">
							<span className="text-neutral-400">Angle:</span>
							<span className="font-semibold text-neutral-200">{momentumTelemetry.angle}°</span>
						</div>
						<div className="flex justify-between items-center text-[11px]">
							<span className="text-neutral-400">Active State:</span>
							<span className={`font-semibold ${momentumTelemetry.isSyncing ? 'text-sky-400' : 'text-neutral-500'}`}>
								{momentumTelemetry.isSyncing ? 'TRANSMITTING' : momentumTelemetry.isCoasting ? 'COASTING' : 'AT REST'}
							</span>
						</div>
					</div>

					<div className="pt-2 border-t border-neutral-800/60 space-y-3">
						<div className="flex items-center justify-between">
							<h4 className="font-semibold text-neutral-300">Sync Flywheel & Physics</h4>
							<IonBadge color="primary" className="text-[10px]">Controls</IonBadge>
						</div>
						<div className="flex items-center justify-between">
							<span>Enable Momentum Physics</span>
							<IonToggle
								checked={momentumEnabled}
								onIonChange={(event) => setMomentumEnabled(event.detail.checked)}
							/>
						</div>
						<div>
							<div className="flex justify-between text-neutral-400">
								<span>Max Velocity (Top Speed)</span>
								<span>
									{Math.round(momentumMaxVelocity / 6)} RPM ({momentumMaxVelocity}°/s)
								</span>
							</div>
							<IonRange
								min={180}
								max={1080}
								step={60}
								value={momentumMaxVelocity}
								onIonChange={(event) =>
									setMomentumMaxVelocity(event.detail.value as number)
								}
							/>
						</div>
						<div>
							<div className="flex justify-between text-neutral-400">
								<span>Acceleration Rate</span>
								<span>{momentumAcceleration}°/s²</span>
							</div>
							<IonRange
								min={300}
								max={2000}
								step={100}
								value={momentumAcceleration}
								onIonChange={(event) =>
									setMomentumAcceleration(event.detail.value as number)
								}
							/>
						</div>
						<div>
							<div className="flex justify-between text-neutral-400">
								<span>Coasting Drag (Inertial Friction)</span>
								<span>{momentumFriction.toFixed(1)}</span>
							</div>
							<IonRange
								min={1.0}
								max={5.0}
								step={0.2}
								value={momentumFriction}
								onIonChange={(event) =>
									setMomentumFriction(event.detail.value as number)
								}
							/>
						</div>
						<div>
							<div className="flex justify-between text-neutral-400">
								<span>Minimum Animation Duration</span>
								<span>{momentumMinImpulseDuration} ms</span>
							</div>
							<IonRange
								min={200}
								max={1500}
								step={50}
								value={momentumMinImpulseDuration}
								onIonChange={(event) =>
									setMomentumMinImpulseDuration(event.detail.value as number)
								}
							/>
						</div>
					</div>
				</div>
			)}

			{/* Momentum & Inertia Physics Knobs for Settings Cog */}
			{activeComponent === 'settings-icon' && (
				<div className="space-y-4 pt-1 text-xs">
					<div className="flex items-center justify-between">
						<h4 className="font-semibold text-neutral-300">Simulation Triggers</h4>
						<IonBadge color="primary" className="text-[10px]">Triggers</IonBadge>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<IonButton
							size="small"
							fill="outline"
							color="primary"
							className="text-xs h-8"
							onClick={() => triggerPulseSettings(500)}
						>
							⚡ Quick 500ms
						</IonButton>
						<IonButton
							size="small"
							fill="outline"
							color="primary"
							className="text-xs h-8"
							onClick={() => triggerPulseSettings(1500)}
						>
							⏱️ 1.5s Open
						</IonButton>
						<IonButton
							size="small"
							fill="outline"
							color="primary"
							className="text-xs h-8"
							onClick={() => triggerPulseSettings(4000)}
						>
							🚀 4.0s Open
						</IonButton>
						<IonButton
							size="small"
							fill={settingsMenuOpen ? 'solid' : 'outline'}
							color={settingsMenuOpen ? 'danger' : 'medium'}
							className="text-xs h-8"
							onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
						>
							{settingsMenuOpen ? '⏹ Close Menu' : '▶ Open Menu'}
						</IonButton>
					</div>

					{/* Live Telemetry Readout in Knobs */}
					<div className="rounded-lg bg-neutral-800/50 p-2.5 border border-neutral-700/50 font-mono space-y-1.5">
						<div className="flex justify-between items-center text-[11px]">
							<span className="text-neutral-400">Phase:</span>
							<span className="font-semibold text-violet-400 capitalize">{settingsTelemetry.phase}</span>
						</div>
						<div className="flex justify-between items-center text-[11px]">
							<span className="text-neutral-400">Velocity:</span>
							<span className="font-semibold text-neutral-200">{settingsTelemetry.velocity}°/s</span>
						</div>
						<div className="flex justify-between items-center text-[11px]">
							<span className="text-neutral-400">Angle:</span>
							<span className="font-semibold text-neutral-200">{settingsTelemetry.angle}°</span>
						</div>
						<div className="flex justify-between items-center text-[11px]">
							<span className="text-neutral-400">Active State:</span>
							<span className={`font-semibold ${settingsTelemetry.isSyncing ? 'text-violet-400' : 'text-neutral-500'}`}>
								{settingsTelemetry.isSyncing ? 'MOTOR DRIVEN' : settingsTelemetry.isCoasting ? 'COASTING' : 'AT REST'}
							</span>
						</div>
					</div>

					<div className="pt-2 border-t border-neutral-800/60 space-y-3">
						<div className="flex items-center justify-between">
							<h4 className="font-semibold text-neutral-300">Settings Flywheel & Physics</h4>
							<IonBadge color="primary" className="text-[10px]">Controls</IonBadge>
						</div>
						<div className="flex items-center justify-between">
							<span>Enable Momentum Physics</span>
							<IonToggle
								checked={settingsPhysicsEnabled}
								onIonChange={(event) => setSettingsPhysicsEnabled(event.detail.checked)}
							/>
						</div>
						<div>
							<div className="flex justify-between text-neutral-400">
								<span>Ratchet Increment (Angle per Tooth)</span>
								<span>{settingsStepIncrement}°</span>
							</div>
							<IonRange
								min={30}
								max={120}
								step={15}
								value={settingsStepIncrement}
								onIonChange={(event) =>
									setSettingsStepIncrement(event.detail.value as number)
								}
							/>
						</div>
						<div>
							<div className="flex justify-between text-neutral-400">
								<span>Step Snap Duration</span>
								<span>{settingsStepDuration} ms</span>
							</div>
							<IonRange
								min={150}
								max={600}
								step={25}
								value={settingsStepDuration}
								onIonChange={(event) =>
									setSettingsStepDuration(event.detail.value as number)
								}
							/>
						</div>
						<div>
							<div className="flex justify-between text-neutral-400">
								<span>Hold / Pause Between Clicks</span>
								<span>{settingsHoldDuration} ms</span>
							</div>
							<IonRange
								min={300}
								max={2000}
								step={100}
								value={settingsHoldDuration}
								onIonChange={(event) =>
									setSettingsHoldDuration(event.detail.value as number)
								}
							/>
						</div>
					</div>
				</div>
			)}

			{/* Animation Knobs for Help Icon */}
			{activeComponent === 'help-icon' && (
				<div className="space-y-4 pt-1 text-xs">
					<div className="flex items-center justify-between">
						<h4 className="font-semibold text-neutral-300">Popover Trigger State</h4>
						<IonBadge color="secondary" className="text-[10px]">Active Loop</IonBadge>
					</div>
					<div className="flex items-center justify-between">
						<span>Help Popover Open</span>
						<IonToggle
							checked={helpPopoverOpen}
							onIonChange={(event) => setHelpPopoverOpen(event.detail.checked)}
						/>
					</div>

					<div className="rounded-lg bg-neutral-800/50 p-2.5 border border-neutral-700/50 font-mono space-y-1.5">
						<div className="flex justify-between items-center text-[11px]">
							<span className="text-neutral-400">Animation:</span>
							<span className="font-semibold text-cyan-400">
								{helpPopoverOpen ? 'curious-beacon (1.8s loop)' : 'resting'}
							</span>
						</div>
						<div className="flex justify-between items-center text-[11px]">
							<span className="text-neutral-400">Motion Mode:</span>
							<span className="font-semibold text-neutral-200">
								{helpPopoverOpen ? 'Tilt (-14°..+14°) + Hover + Aura' : 'Stationary'}
							</span>
						</div>
					</div>

					<div className="pt-2 border-t border-neutral-800/60 space-y-3">
						<div className="flex items-center justify-between">
							<h4 className="font-semibold text-neutral-300">Display Size</h4>
							<IonBadge color="primary" className="text-[10px]">Controls</IonBadge>
						</div>
						<div className="flex items-center justify-between">
							<span>Icon Dimension</span>
							<IonSelect
								value={helpIconSize}
								interface="popover"
								onIonChange={(e) => setHelpIconSize(e.detail.value)}
							>
								<IonSelectOption value="sm">Small (16px)</IonSelectOption>
								<IonSelectOption value="md">Medium (20px)</IonSelectOption>
								<IonSelectOption value="lg">Large (32px)</IonSelectOption>
								<IonSelectOption value="xl">Extra Large (48px)</IonSelectOption>
								<IonSelectOption value={72}>Hero (72px)</IonSelectOption>
							</IonSelect>
						</div>
					</div>
				</div>
			)}

			{/* Starship & Trajectory Knobs */}
			{activeComponent === 'starship-trajectory' && (
				<div className="space-y-4 pt-1 text-xs">
					<h4 className="font-semibold text-neutral-300">Starship Flight Controls</h4>
					<div>
						<div className="flex justify-between text-neutral-400">
							<span>Points / Distance</span>
							<span>{starshipPosition} pts</span>
						</div>
						<IonRange
							min={0}
							max={300}
							value={starshipPosition}
							onIonChange={(e) => setStarshipPosition(e.detail.value as number)}
						/>
					</div>

					<div>
						<div className="flex justify-between text-neutral-400">
							<span>Thruster Rotation</span>
							<span>{starshipRotation}°</span>
						</div>
						<IonRange
							min={0}
							max={360}
							value={starshipRotation}
							onIonChange={(e) => setStarshipRotation(e.detail.value as number)}
						/>
					</div>

					<div className="flex items-center justify-between">
						<span>Drive Mode (Warp / Cruise)</span>
						<IonButton
							size="small"
							fill={mode === 'hype' ? 'solid' : 'outline'}
							color={mode === 'hype' ? 'danger' : 'primary'}
							onClick={() => setMode(mode === 'chill' ? 'hype' : 'chill')}
						>
							{mode.toUpperCase()}
						</IonButton>
					</div>
				</div>
			)}

			{/* Pulse Graph Knobs */}
			{activeComponent === 'pulse-graph' && (
				<div className="space-y-4 pt-1 text-xs">
					<h4 className="font-semibold text-neutral-300">Pulse Activity Controls</h4>
					<div>
						<div className="flex justify-between text-neutral-400">
							<span>Activity Pattern Preset</span>
							<span className="capitalize">{pulsePreset}</span>
						</div>
						<div className="flex flex-wrap gap-1.5 mt-2">
							{(
								[
									{ id: 'streak', label: '14d Streak' },
									{ id: 'recent', label: 'Recent Spark' },
									{ id: 'sporadic', label: 'Alternate Days' },
									{ id: 'empty', label: 'Empty' },
								] as const
							).map((p) => (
								<IonChip
									key={p.id}
									onClick={() => setPulsePreset(p.id)}
									style={
										{
											'--background':
												pulsePreset === p.id
													? 'rgba(56, 189, 248, 0.18)'
													: 'rgba(255, 255, 255, 0.08)',
											'--color': pulsePreset === p.id ? '#38bdf8' : '#e5e5e5',
											border:
												pulsePreset === p.id
													? '1px solid rgba(56, 189, 248, 0.45)'
													: '1px solid rgba(255, 255, 255, 0.12)',
										} as React.CSSProperties
									}
									className="cursor-pointer m-0 text-xs font-medium"
								>
									<IonLabel>{p.label}</IonLabel>
								</IonChip>
							))}
						</div>
					</div>

					<div>
						<div className="flex justify-between text-neutral-400">
							<span>Todo Star Points Value</span>
							<span>{pulseStarPoints} pts</span>
						</div>
						<IonRange
							min={1}
							max={13}
							value={pulseStarPoints}
							onIonChange={(e) => setPulseStarPoints(e.detail.value as number)}
						/>
					</div>
				</div>
			)}

			{/* Mood Player Knobs */}
			{activeComponent === 'mood-player' && (
				<div className="space-y-4 pt-1 text-xs">
					<h4 className="font-semibold text-neutral-300">Soundtrack Stream Mode</h4>
					<div className="flex items-center justify-between">
						<span>Active Channel</span>
						<IonButton
							size="small"
							fill={mode === 'hype' ? 'solid' : 'outline'}
							color={mode === 'hype' ? 'danger' : 'primary'}
							onClick={() => setMode(mode === 'chill' ? 'hype' : 'chill')}
						>
							{mode === 'chill' ? '🌌 CHILL (Melodysheep)' : '⚡ HYPE (Karl Casey)'}
						</IonButton>
					</div>
					<div className="text-[11px] text-neutral-400 space-y-1">
						<p>• Press <kbd className="font-mono text-neutral-200">Z</kbd> for Chill Mode</p>
						<p>• Press <kbd className="font-mono text-neutral-200">X</kbd> for Hype Mode</p>
						<p>• Press <kbd className="font-mono text-neutral-200">Space</kbd> to Play / Pause</p>
					</div>
				</div>
			)}

			{/* Duplicate Detector Knobs */}
			{activeComponent === 'duplicate-detector' && (
				<div className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
					<h4 className="font-semibold text-neutral-300">Duplicate Simulator Controls</h4>
					<div>
						<IonLabel className="text-neutral-400">Candidate Todo Title</IonLabel>
						<IonInput
							className="mt-1 border border-neutral-800 rounded bg-neutral-900 px-2 text-white"
							value={duplicateSimulatedTitle}
							onIonInput={(e) => setDuplicateSimulatedTitle(e.detail.value ?? '')}
							placeholder="Type todo title..."
						/>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-neutral-400">Creation Intercept Prevention</span>
						<IonToggle
							checked={duplicatePreventionActive}
							onIonChange={(e) => setDuplicatePreventionActive(e.detail.checked)}
						/>
					</div>
					<div className="text-[11px] text-neutral-400 space-y-1">
						<p>• High-confidence matches (≥82%) trigger prevention</p>
						<p>• Ambient hints appear when similarity ≥70%</p>
					</div>
				</div>
			)}

			{/* Celestial Body Knobs */}
			{activeComponent === 'celestial-body' && (
				<div className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
					<h4 className="font-semibold text-neutral-300">
						Celestial Body Controls
					</h4>
					<div>
						<span className="mb-1.5 block text-neutral-400">
							Star Points Tier (1–13 pts)
						</span>
						<div className="flex flex-wrap gap-1.5">
							{STAR_POINT_TIERS.map(tier => (
								<IonChip
									key={tier.points}
									data-testid={`celestial-points-chip-${tier.points}`}
									onClick={() => setWorkbenchPlanetPoints(tier.points)}
									color={
										workbenchPlanetPoints === tier.points ? 'primary' : 'medium'
									}
									outline={workbenchPlanetPoints !== tier.points}
									className="m-0 cursor-pointer font-mono text-xs"
								>
									<IonLabel>{tier.shortLabel}</IonLabel>
								</IonChip>
							))}
						</div>
					</div>
					<div>
						<span className="mb-1.5 block text-neutral-400">
							Whole-App Star Points Theme Palette
						</span>
						<div className="flex flex-wrap gap-1.5">
							{STAR_POINTS_THEME_IDS.map(candidateId => {
								const candidate = STAR_POINTS_THEMES[candidateId]
								return (
									<IonChip
										key={candidateId}
										data-testid={`celestial-theme-chip-${candidateId}`}
										onClick={() => handleSelectStarTheme(candidateId)}
										color={
											activeStarThemeId === candidateId ? 'secondary' : 'medium'
										}
										outline={activeStarThemeId !== candidateId}
										className="m-0 cursor-pointer text-xs"
									>
										<IonLabel>{candidate.name}</IonLabel>
									</IonChip>
								)
							})}
						</div>
					</div>
					<div>
						<div className="flex items-center justify-between">
							<span className="text-neutral-400">Todo Seed ID</span>
							<IonButton
								size="small"
								fill="clear"
								data-testid="celestial-randomize-seed"
								onClick={() =>
									setWorkbenchPlanetSeed(
										`todo-seed-${Math.random().toString(36).slice(2, 10)}`,
									)
								}
							>
								Randomize
							</IonButton>
						</div>
						<IonInput
							data-testid="celestial-seed-input"
							className="mt-1 rounded border border-neutral-800 bg-neutral-900 px-2 font-mono text-white"
							value={workbenchPlanetSeed}
							onIonInput={event =>
								setWorkbenchPlanetSeed(String(event.detail.value ?? ''))
							}
						/>
					</div>
					<div>
						<div className="flex justify-between text-neutral-400">
							<span>Display Size</span>
							<span>{workbenchPlanetSize}px</span>
						</div>
						<IonRange
							min={48}
							max={200}
							value={workbenchPlanetSize}
							onIonChange={event =>
								setWorkbenchPlanetSize(event.detail.value as number)
							}
						/>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-neutral-400">4×4 Bayer Ordered Dithering</span>
						<IonToggle
							data-testid="celestial-dither-toggle"
							checked={workbenchPlanetDithering}
							onIonChange={event =>
								setWorkbenchPlanetDithering(event.detail.checked)
							}
						/>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-neutral-400">Atmosphere & Corona Glow</span>
						<IonToggle
							data-testid="celestial-glow-toggle"
							checked={workbenchPlanetGlow}
							onIonChange={event =>
								setWorkbenchPlanetGlow(event.detail.checked)
							}
						/>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-neutral-400">
							Show All 6 Star Point Tiers (1–13 pts)
						</span>
						<IonToggle
							data-testid="celestial-lineup-toggle"
							checked={workbenchShowTierLineup}
							onIonChange={event =>
								setWorkbenchShowTierLineup(event.detail.checked)
							}
						/>
					</div>
				</div>
			)}

			{/* Starship Knobs */}
			{activeComponent === 'starship' && (
				<div className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
					<h4 className="font-semibold text-neutral-300">
						Starship Model & Skin Controls
					</h4>
					<div>
						<span className="mb-1.5 block text-neutral-400">
							Starship Hull Model (Whole Ship)
						</span>
						<div className="flex flex-wrap gap-1.5">
							{SHIP_ARCHETYPE_IDS.map(archetypeId => (
								<IonChip
									key={archetypeId}
									data-testid={`starship-model-chip-${archetypeId}`}
									onClick={() => setWorkbenchShipArchetype(archetypeId)}
									color={
										workbenchShipArchetype === archetypeId
											? 'primary'
											: 'medium'
									}
									outline={workbenchShipArchetype !== archetypeId}
									className="m-0 cursor-pointer text-xs"
								>
									<IonLabel>
										{SHIP_SOCKET_MANIFESTS[archetypeId].name}
									</IonLabel>
								</IonChip>
							))}
						</div>
					</div>
					<div>
						<span className="mb-1.5 block text-neutral-400">
							Ship Skin / Livery Theme
						</span>
						<div className="flex flex-wrap gap-1.5">
							{SHIP_COLOR_PALETTES.map(skin => (
								<IonChip
									key={skin.id}
									data-testid={`starship-skin-chip-${skin.id}`}
									onClick={() => setWorkbenchShipSkin(skin.id)}
									color={
										workbenchShipSkin === skin.id ? 'secondary' : 'medium'
									}
									outline={workbenchShipSkin !== skin.id}
									className="m-0 cursor-pointer text-xs"
								>
									<span
										className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
										style={{ backgroundColor: skin.accentStripe }}
									/>
									<IonLabel>{skin.name}</IonLabel>
								</IonChip>
							))}
						</div>
					</div>
					<div>
						<div className="flex justify-between text-neutral-400">
							<span>Ship Heading / Rotation</span>
							<span>{workbenchShipRotation}°</span>
						</div>
						<IonRange
							min={0}
							max={360}
							value={workbenchShipRotation}
							onIonChange={event =>
								setWorkbenchShipRotation(event.detail.value as number)
							}
						/>
					</div>
					<div>
						<div className="flex justify-between text-neutral-400">
							<span>Display Size</span>
							<span>{workbenchShipSize}px</span>
						</div>
						<IonRange
							min={56}
							max={200}
							value={workbenchShipSize}
							onIonChange={event =>
								setWorkbenchShipSize(event.detail.value as number)
							}
						/>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-neutral-400">Active Thruster Plumes</span>
						<IonToggle
							data-testid="starship-thruster-toggle"
							checked={workbenchShipThrusterActive}
							onIonChange={event =>
								setWorkbenchShipThrusterActive(event.detail.checked)
							}
						/>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-neutral-400">
							Playable Slingshot & Flight Arena
						</span>
						<IonToggle
							data-testid="starship-flight-mode-toggle"
							checked={workbenchShipFlightMode}
							onIonChange={event =>
								setWorkbenchShipFlightMode(event.detail.checked)
							}
						/>
					</div>
				</div>
			)}

			{/* Star Roles Knobs */}
			{activeComponent === 'star-roles' && (
				<div className="space-y-4 pt-1 text-xs">
					<h4 className="font-semibold text-neutral-300">Star Role Configuration</h4>
					<div>
						<span className="block mb-1 text-neutral-400">Role Icon</span>
						<IonSelect
							interface="popover"
							value={selectedIcon}
							onIonChange={(e) => setSelectedIcon(e.detail.value)}
							className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200"
						>
							<IonSelectOption value="starSharp">Star (Captain)</IonSelectOption>
							<IonSelectOption value="planetSharp">Planet (Navigator)</IonSelectOption>
							<IonSelectOption value="rocketSharp">Rocket (Pilot)</IonSelectOption>
							<IonSelectOption value="flashSharp">Energy (Engineer)</IonSelectOption>
							<IonSelectOption value="sparklesSharp">Sparkles (Botanist)</IonSelectOption>
						</IonSelect>
					</div>
					<div>
						<span className="block mb-1 text-neutral-400">Accent Color</span>
						<IonSelect
							interface="popover"
							value={selectedColor}
							onIonChange={(e) => setSelectedColor(e.detail.value)}
							className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200"
						>
							<IonSelectOption value="#f59e0b">Amber (#f59e0b)</IonSelectOption>
							<IonSelectOption value="#3b82f6">Blue (#3b82f6)</IonSelectOption>
							<IonSelectOption value="#ec4899">Pink (#ec4899)</IonSelectOption>
							<IonSelectOption value="#eab308">Yellow (#eab308)</IonSelectOption>
							<IonSelectOption value="#10b981">Emerald (#10b981)</IonSelectOption>
							<IonSelectOption value="#a855f7">Purple (#a855f7)</IonSelectOption>
						</IonSelect>
					</div>
				</div>
			)}

			{/* Star Points Knobs */}
			{activeComponent === 'star-points' && (
				<div className="space-y-3 pt-1 text-xs">
					<h4 className="font-semibold text-neutral-300">Star Points Widget</h4>
					<p className="text-neutral-400">
						Inspects the live header score counter tracking completed achievements.
					</p>
				</div>
			)}
		</div>
	)

	return (
		<div
			className="ion-page"
			id="workbench-main"
		>
			<Header
				title={COMPONENT_TITLES[activeComponent] || 'Workbench'}
				backHref="/dev/components"
				hideActions
			/>

				<IonContent
					className="text-neutral-100"
					style={{
						'--background':
							'#09090b radial-gradient(circle, rgba(255, 255, 255, 0.14) 1px, transparent 1px) 0 0 / 22px 22px',
					}}
				>
					{/* Description */}
					<div className="px-4 py-2 md:px-6 md:py-2.5 border-b border-neutral-800/60 bg-neutral-950/70 backdrop-blur-sm">
						<p className="text-xs text-neutral-400 max-w-2xl">
							{COMPONENT_DESCRIPTIONS[activeComponent]}
						</p>
					</div>

					{/* Canvas Area: Edge-to-edge dot-grid taking up the whole content */}
					<div
						data-testid="workbench-canvas"
						className="w-full min-h-[calc(100%-48px)] flex-1 flex flex-col items-center justify-start p-4 md:p-8 select-none pt-8 md:pt-12 pb-44"
						style={{
							backgroundColor: 'transparent',
							backgroundImage:
								'radial-gradient(circle, rgba(255, 255, 255, 0.14) 1px, transparent 1px)',
							backgroundSize: '22px 22px',
						}}
					>
							{/* Component on Canvas (top-aligned for expanded sheet visibility) */}
							<div className="w-full flex items-center justify-center">
								{activeComponent === 'sync-status' && (
									<div className="flex flex-col items-center gap-6 max-w-md w-full">
										{/* Interactive Popover Header Trigger Bar */}
										<div className="w-full rounded-xl border border-neutral-800/80 bg-neutral-900/90 p-3.5 shadow-2xl backdrop-blur-md">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<StarPoints />
													<span className="font-display [font-palette:--redshift] text-xl font-bold">
														StarFocus
													</span>
												</div>
												<div className="flex items-center gap-2">
													<SyncStatus
														id="workbench-sync-status-btn"
														syncState={simulatedSyncState}
														exportStatus={simulatedExportStatus}
														user={simulatedUser}
														enableMomentum={momentumEnabled}
														maxVelocity={momentumMaxVelocity}
														accelerationRate={momentumAcceleration}
														frictionCoefficient={momentumFriction}
														minimumImpulseDuration={momentumMinImpulseDuration}
														onRunFullSync={() => {
															setMarkdownFullSyncPhase('in-progress')
															setMarkdownCompletedFiles(1)
														}}
														onReconnect={() => {
															setMarkdownNeedsReconnect(false)
															setMarkdownHasError(false)
														}}
														onLogin={() => setCloudLoggedIn(true)}
														onOpenSettings={() => setMarkdownEnabled(true)}
													/>
												</div>
											</div>
										</div>

										{/* Inline Direct Inspection View */}
										<div className="w-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/95 shadow-2xl">
											<SyncStatus
												inline={true}
												syncState={simulatedSyncState}
												exportStatus={simulatedExportStatus}
												user={simulatedUser}
												enableMomentum={momentumEnabled}
												maxVelocity={momentumMaxVelocity}
												accelerationRate={momentumAcceleration}
												frictionCoefficient={momentumFriction}
												minimumImpulseDuration={momentumMinImpulseDuration}
												onRunFullSync={() => {
													setMarkdownFullSyncPhase('in-progress')
													setMarkdownCompletedFiles(1)
												}}
												onReconnect={() => {
													setMarkdownNeedsReconnect(false)
													setMarkdownHasError(false)
												}}
												onLogin={() => setCloudLoggedIn(true)}
												onOpenSettings={() => setMarkdownEnabled(true)}
											/>
										</div>
									</div>
								)}

								{activeComponent === 'sync-icon' && (
									<div className="flex items-center justify-center py-4 px-4">
										<MomentumSyncIcon
											id="workbench-sync-status-btn"
											size={72}
											isSyncing={
												simulatedSyncState.phase === 'pushing' ||
												simulatedSyncState.phase === 'pulling' ||
												markdownIsSyncing ||
												markdownFullSyncPhase === 'in-progress'
											}
											enablePhysics={momentumEnabled}
											maxVelocity={momentumMaxVelocity}
											accelerationRate={momentumAcceleration}
											frictionCoefficient={momentumFriction}
											minimumImpulseDuration={momentumMinImpulseDuration}
											onTelemetryChange={setMomentumTelemetry}
										/>
									</div>
								)}

								{activeComponent === 'settings-icon' && (
									<div className="flex items-center justify-center py-4 px-4">
										<MomentumSettingsIcon
											id="workbench-settings-btn"
											size={72}
											isOpen={settingsMenuOpen}
											enablePhysics={settingsPhysicsEnabled}
											stepIncrement={settingsStepIncrement}
											stepDuration={settingsStepDuration}
											holdDuration={settingsHoldDuration}
											onTelemetryChange={setSettingsTelemetry}
										/>
									</div>
								)}

								{activeComponent === 'help-icon' && (
									<div className="flex items-center justify-center py-4 px-4">
										<HelpIcon
											id="workbench-help-btn"
											size={
												helpIconSize === 'sm'
													? 16
													: helpIconSize === 'md'
														? 20
														: helpIconSize === 'lg'
															? 32
															: helpIconSize === 'xl'
																? 48
																: 72
											}
											isOpen={helpPopoverOpen}
										/>
									</div>
								)}

								{activeComponent === 'cloud-sync' && (
									<div className="w-full max-w-md space-y-4">
										<div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/90 p-4 shadow-xl">
											<span className="text-sm font-medium text-neutral-300">
												Status Indicator
											</span>
											<div className="rounded-lg border border-neutral-700 bg-neutral-800 p-2 text-2xl">
												<CloudSyncStatusBadge
													user={simulatedUser}
													syncState={simulatedSyncState}
												/>
											</div>
										</div>
										<div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 shadow-2xl">
											{!simulatedUser ? (
												<div className="p-4 text-center text-neutral-400">
													<p>Not signed in to Dexie Cloud</p>
												</div>
											) : (
												<>
													<IonHeader>
														<IonToolbar>
															<IonTitle
																className="text-base font-semibold"
																slot="start"
															>
																Cloud database sync
															</IonTitle>
															<IonButtons slot="end">
																<IonButton
																	color="danger"
																	fill="solid"
																	onClick={() => setCloudLoggedIn(false)}
																	size="small"
																>
																	Unsync
																</IonButton>
															</IonButtons>
														</IonToolbar>
													</IonHeader>
													<IonContent className="text-xs">
														{simulatedSyncState.error ? (
															<p className="p-2 text-red-500">
																Sync error: {simulatedSyncState.error.message}
															</p>
														) : (
															<div className="space-y-2 p-2">
																<IonInput
																	label="Email"
																	labelPlacement="floating"
																	readonly
																	value={simulatedUser.email}
																/>
																<IonInput
																	label="License"
																	labelPlacement="floating"
																	readonly
																	value={simulatedSyncState.license}
																/>
																<IonInput
																	label="Status"
																	labelPlacement="floating"
																	readonly
																	value={simulatedSyncState.status}
																/>
																<IonInput
																	label="Phase"
																	labelPlacement="floating"
																	readonly
																	value={simulatedSyncState.phase}
																/>
																<IonInput
																	label="Progress"
																	labelPlacement="floating"
																	readonly
																	value={simulatedSyncState.progress || '-'}
																/>
															</div>
														)}
													</IonContent>
												</>
											)}
										</div>
									</div>
								)}

								{activeComponent === 'markdown-sync' && (
									<div className="w-full max-w-md space-y-4">
										<div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/90 p-4 shadow-xl">
											<span className="text-sm font-medium text-neutral-300">
												Status Indicator
											</span>
											<div className="rounded-lg border border-neutral-700 bg-neutral-800 p-2 text-2xl">
												<MarkdownSyncStatusBadge exportStatus={simulatedExportStatus} />
											</div>
										</div>
										<div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 shadow-2xl">
											<IonHeader>
												<IonToolbar>
													<IonTitle
														className="text-base font-semibold"
														slot="start"
													>
														Local markdown sync
													</IonTitle>
												</IonToolbar>
											</IonHeader>
											<div className="p-4 space-y-3 text-xs">
												<p className="text-sm text-neutral-400">
													{simulatedExportStatus.directoryName}
												</p>
												{simulatedExportStatus.needsReconnect ? (
													<div className="rounded-lg border border-amber-800/40 bg-amber-950/30 p-3">
														<p className="text-sm font-medium text-amber-400">
															Folder reconnect needed
														</p>
														<p className="mt-1 text-xs text-neutral-400">
															Permission to access the markdown export folder has expired.
														</p>
														<IonButton
															expand="block"
															fill="outline"
															color="warning"
															size="small"
															className="mt-3"
															onClick={() => {
																setMarkdownNeedsReconnect(false)
																setMarkdownHasError(false)
															}}
														>
															Reconnect Folder
														</IonButton>
													</div>
												) : (
													<>
														<p className="text-sm">
															{simulatedExportStatus.fullSync?.phase === 'in-progress' &&
															simulatedExportStatus.fullSync.progress
																? `${simulatedExportStatus.fullSync.progress.completed} of ${simulatedExportStatus.fullSync.progress.total} files synced`
																: `${simulatedExportStatus.totalFiles ?? 0} files synced`}
															{simulatedExportStatus.lastSyncAt &&
																` \u00b7 ${simulatedExportStatus.lastSyncAt.toLocaleTimeString()}`}
														</p>
														{simulatedExportStatus.isSyncing &&
															simulatedExportStatus.fullSync?.phase !== 'in-progress' && (
																<p className="text-sm text-neutral-400">Syncing...</p>
															)}
														{simulatedExportStatus.error && (
															<p className="text-sm text-red-500">
																{simulatedExportStatus.error}
															</p>
														)}
														<IonButton
															expand="block"
															fill="outline"
															size="small"
															className="mt-2"
															onClick={() => {
																setMarkdownFullSyncPhase('in-progress')
																setMarkdownCompletedFiles(1)
															}}
															disabled={
																simulatedExportStatus.needsReconnect ||
																simulatedExportStatus.fullSync?.phase === 'in-progress'
															}
														>
															<IonIcon icon={syncSharp} slot="start" />
															Full Sync
														</IonButton>
													</>
												)}
											</div>
										</div>
									</div>
								)}

								{activeComponent === 'star-roles' && (
									<div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-xl backdrop-blur-md">
										<div className="flex flex-col items-center gap-2">
											<StarRoleIcon
												starRole={{
													id: '1',
													title: selectedRoleTitle,
													icon: { type: 'ionicon', name: selectedIcon },
												}}
												style={{ color: selectedColor, fontSize: '36px' }}
											/>
											<span className="text-xs text-neutral-300 font-medium">{selectedRoleTitle}</span>
										</div>

										<div className="flex flex-col items-center gap-2">
											<StarRoleIcon
												starRole={{
													id: '2',
													title: 'Planet',
													icon: { type: 'ionicon', name: 'planetSharp' },
												}}
												style={{ color: '#3b82f6', fontSize: '36px' }}
											/>
											<span className="text-xs text-neutral-400">Planet</span>
										</div>

										<div className="flex flex-col items-center gap-2">
											<StarRoleIcon
												starRole={{
													id: '3',
													title: 'Rocket',
													icon: { type: 'ionicon', name: 'rocketSharp' },
												}}
												style={{ color: '#ec4899', fontSize: '36px' }}
											/>
											<span className="text-xs text-neutral-400">Rocket</span>
										</div>

										<div className="flex flex-col items-center gap-2">
											<StarRoleIcon
												starRole={{
													id: '4',
													title: 'Energy',
													icon: { type: 'ionicon', name: 'flashSharp' },
												}}
												style={{ color: '#eab308', fontSize: '36px' }}
											/>
											<span className="text-xs text-neutral-400">Energy</span>
										</div>
									</div>
								)}

								{activeComponent === 'star-points' && (
									<div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-8 shadow-2xl backdrop-blur-md">
										<span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
											Progression Score
										</span>
										<div className="transform scale-150 py-4">
											<StarPoints />
										</div>
										<span className="text-xs text-neutral-500">
											Live header score counter
										</span>
									</div>
								)}

								{activeComponent === 'starship-trajectory' && (
									<div className="flex flex-col items-center justify-center gap-4 p-8">
										{workbenchShipFlightMode ? (
											<div className="w-full max-w-2xl">
												<SpaceArcadeCanvas
													active={true}
													todos={WORKBENCH_ARCADE_TODOS}
													shipLoadout={{
														hullArchetype: workbenchShipArchetype,
														skinId: workbenchShipSkin,
													}}
													initialVelocity={workbenchShipLaunchVelocity}
													onExitArcade={() => setWorkbenchShipFlightMode(false)}
												/>
											</div>
										) : (
											<>
												<div
													id="workbench-starship"
													data-testid="workbench-starship-slingshot"
													onPointerDown={(event) => {
														startWorkbenchSlingshot(event.clientX, event.clientY)
													}}
													className="relative h-[320px] w-[140px] flex justify-center cursor-grab active:cursor-grabbing select-none touch-none"
												>
													<Tracjectory
														currentPosition={starshipPosition}
														orientation="vertical"
													/>
													{workbenchSlingshotPull && (
														<svg
															className="pointer-events-none absolute inset-0 overflow-visible z-20"
															width="140"
															height="320"
															viewBox="0 0 140 320"
														>
															<line
																x1={70}
																y1={starshipPosition + 28}
																x2={70 + workbenchSlingshotPull.dx}
																y2={starshipPosition + 28 + workbenchSlingshotPull.dy}
																stroke="#f59e0b"
																strokeWidth="2.5"
																strokeDasharray="4 4"
															/>
															<line
																x1={70}
																y1={starshipPosition + 28}
																x2={70 - workbenchSlingshotPull.dx * 1.4}
																y2={starshipPosition + 28 - workbenchSlingshotPull.dy * 1.4}
																stroke="#38bdf8"
																strokeWidth="2.5"
															/>
														</svg>
													)}
													<div
														className="absolute left-1/2 -translate-x-1/2 transition-transform duration-150 ease-out w-[64px] h-[64px]"
														style={{
															transform: `translate(calc(-50% + ${workbenchSlingshotPull ? workbenchSlingshotPull.dx * 0.25 : 0}px), ${starshipPosition + (workbenchSlingshotPull ? workbenchSlingshotPull.dy * 0.25 : 0)}px) rotate(${
																workbenchSlingshotPull && workbenchSlingshotPull.distance >= 18
																	? (Math.atan2(-workbenchSlingshotPull.dy, -workbenchSlingshotPull.dx) * 180) / Math.PI + 90
																	: starshipRotation
															}deg)`,
														}}
													>
														<Starship
															loadout={{
																hullArchetype: workbenchShipArchetype,
																skinId: workbenchShipSkin,
															}}
															size={64}
														/>
													</div>
												</div>
												<span className="text-[11px] text-neutral-400">
													Pull back on the starship to slingshot launch into flight mode
												</span>
											</>
										)}
									</div>
								)}

								{activeComponent === 'pulse-graph' && (
									<div id="workbench-pulse-graph" className="flex items-center justify-center p-8">
										<PulseGraph starPoints={pulseStarPoints} visits={simulatedVisits} />
									</div>
								)}

								{activeComponent === 'mood-player' && (
									<div id="workbench-mood-player" className="flex items-center justify-center p-12">
										<Mood />
									</div>
								)}

								{activeComponent === 'duplicate-detector' && (
									<div className="w-full max-w-xl space-y-6">
										<div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-2xl backdrop-blur-md space-y-4">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<IonIcon icon={alertCircleOutline} className="text-amber-400 text-lg" />
													<h3 className="font-semibold text-white text-sm">
														Real-Time Creation & Prevention
													</h3>
												</div>
												<IonBadge color="primary">In-Flight Detection</IonBadge>
											</div>

											<div className="space-y-2">
												<label className="text-xs text-neutral-400">Todo Title Input (Type to test)</label>
												<IonInput
													fill="outline"
													value={duplicateSimulatedTitle}
													onIonInput={(e) => setDuplicateSimulatedTitle(e.detail.value ?? '')}
													className="bg-neutral-950/60"
													placeholder="e.g. Buy oatmilk..."
												/>
											</div>

											<DuplicateAlert
												matches={workbenchSimulatedMatches}
												onSelectExisting={(todo) => {
													window.alert(`[Workbench] Navigate to existing task: "${todo.title}"`)
												}}
											/>

											{workbenchSimulatedMatches.length === 0 && duplicateSimulatedTitle.trim().length > 0 && (
												<div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
													<IonIcon icon={sparklesSharp} className="text-emerald-400" />
													<span>Title is unique. No duplicates detected in database.</span>
												</div>
											)}
										</div>
									</div>
								)}

								{activeComponent === 'celestial-body' && (
									<div
										id="workbench-celestial-body"
										data-testid="workbench-celestial-body"
										className="flex flex-col items-center justify-center gap-6 w-full max-w-3xl"
									>
										<div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/90 p-8 shadow-2xl backdrop-blur-md">
											<PlanetAsset
												todo={{
													id: workbenchPlanetSeed,
													title: 'Procedural Celestial Body',
													starPoints: workbenchPlanetPoints,
												}}
												themeId={activeStarThemeId}
												size={workbenchPlanetSize}
												enableDithering={workbenchPlanetDithering}
												enableAtmosphereGlow={workbenchPlanetGlow}
											/>
											<div className="flex items-center gap-2 text-xs text-neutral-300 font-medium">
												<span
													className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-2 py-0.5 font-mono text-black font-bold"
													style={{
														backgroundColor: workbenchPlanetSpec.palette.highlight,
													}}
												>
													★ {workbenchPlanetPoints} {workbenchPlanetPoints === 1 ? 'pt' : 'pts'}
												</span>
												<span>{CELESTIAL_CLASS_LABELS[workbenchPlanetSpec.celestialClass]}</span>
												<span className="text-neutral-600">•</span>
												<span className="font-mono text-neutral-400">
													{workbenchPlanetSpec.palette.highlight} ({activeStarTheme.name})
												</span>
											</div>
										</div>

										<div
											data-testid="celestial-theme-switcher"
											className="flex flex-wrap items-center justify-center gap-2"
										>
											{STAR_POINTS_THEME_IDS.map((candidateId) => {
												const candidate = STAR_POINTS_THEMES[candidateId]
												const isSelected = candidateId === activeStarThemeId
												return (
													<button
														key={candidateId}
														type="button"
														data-testid={`workbench-theme-btn-${candidateId}`}
														onClick={() => handleSelectStarTheme(candidateId)}
														className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
															isSelected
																? 'border-sky-400 bg-sky-500/15 text-sky-300 shadow'
																: 'border-neutral-800 bg-neutral-950/80 text-neutral-300 hover:border-neutral-700'
														}`}
													>
														<span className="flex items-center gap-0.5">
															{CELESTIAL_POINT_TIERS.map((tier) => (
																<span
																	key={tier}
																	className="h-2.5 w-2.5 rounded-full"
																	style={{
																		backgroundColor: candidate.starColors[tier],
																	}}
																/>
															))}
														</span>
														<span>{candidate.name}</span>
													</button>
												)
											})}
										</div>

										{workbenchShowTierLineup && (
											<div
												data-testid="celestial-tier-lineup"
												className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 w-full"
											>
												{CELESTIAL_POINT_TIERS.map((tierPoints) => {
													const tierSpec = generateProceduralPlanetSpec({
														todo: {
															id: `${workbenchPlanetSeed}-tier-${tierPoints}`,
															title: 'Procedural Celestial Body',
															starPoints: tierPoints,
														},
														themeId: activeStarThemeId,
													})
													const isSelected = workbenchPlanetPoints === tierPoints
													return (
														<button
															key={tierPoints}
															type="button"
															data-testid={`celestial-tier-card-${tierPoints}`}
															onClick={() => setWorkbenchPlanetPoints(tierPoints)}
															className={`flex flex-col items-center justify-between gap-2 rounded-xl border p-3 transition-all ${
																isSelected
																	? 'border-sky-400/60 bg-sky-500/10 shadow-lg'
																	: 'border-neutral-800 bg-neutral-950/75 hover:border-neutral-700'
															}`}
														>
															<span
																className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-mono font-bold text-black"
																style={{
																	backgroundColor: tierSpec.palette.highlight,
																}}
															>
																★ {tierPoints} {tierPoints === 1 ? 'pt' : 'pts'}
															</span>
															<div className="flex items-center justify-center h-[88px]">
																<PlanetAsset
																	todo={{
																		id: `${workbenchPlanetSeed}-tier-${tierPoints}`,
																		title: 'Procedural Celestial Body',
																		starPoints: tierPoints,
																	}}
																	themeId={activeStarThemeId}
																	size={tierPoints >= 8 ? 84 : tierPoints >= 5 ? 78 : 68}
																	enableDithering={workbenchPlanetDithering}
																	enableAtmosphereGlow={workbenchPlanetGlow}
																/>
															</div>
															<span className="text-[11px] text-neutral-300 font-medium text-center leading-tight">
																{CELESTIAL_CLASS_LABELS[tierSpec.celestialClass]}
															</span>
														</button>
													)
												})}
											</div>
										)}
									</div>
								)}

								{activeComponent === 'starship' && (
									<div
										id="workbench-starship-showcase"
										data-testid="workbench-starship-showcase"
										className="flex flex-col items-center justify-center gap-6 w-full max-w-3xl"
									>
										{workbenchShipFlightMode ? (
											<div className="w-full">
												<SpaceArcadeCanvas
													active={true}
													todos={WORKBENCH_ARCADE_TODOS}
													shipLoadout={{
														hullArchetype: workbenchShipArchetype,
														skinId: workbenchShipSkin,
													}}
													initialVelocity={workbenchShipLaunchVelocity}
													onExitArcade={() => setWorkbenchShipFlightMode(false)}
												/>
											</div>
										) : (
											<>
												<div
													data-testid="starship-slingshot-stage"
													onPointerDown={(event) => {
														startWorkbenchSlingshot(event.clientX, event.clientY)
													}}
													className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/90 p-10 shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing select-none touch-none"
												>
													{workbenchSlingshotPull && (
														<svg
															className="pointer-events-none absolute inset-0 overflow-visible z-20"
															width="100%"
															height="100%"
														>
															<line
																x1="50%"
																y1="45%"
																x2={`calc(50% + ${workbenchSlingshotPull.dx}px)`}
																y2={`calc(45% + ${workbenchSlingshotPull.dy}px)`}
																stroke="#f59e0b"
																strokeWidth="2.5"
																strokeDasharray="5 4"
															/>
															<line
																x1="50%"
																y1="45%"
																x2={`calc(50% - ${workbenchSlingshotPull.dx * 1.35}px)`}
																y2={`calc(45% - ${workbenchSlingshotPull.dy * 1.35}px)`}
																stroke="#38bdf8"
																strokeWidth="3"
															/>
														</svg>
													)}
													<div
														style={{
															transform: `translate(${workbenchSlingshotPull ? workbenchSlingshotPull.dx * 0.28 : 0}px, ${workbenchSlingshotPull ? workbenchSlingshotPull.dy * 0.28 : 0}px) rotate(${
																workbenchSlingshotPull && workbenchSlingshotPull.distance >= 18
																	? (Math.atan2(-workbenchSlingshotPull.dy, -workbenchSlingshotPull.dx) * 180) / Math.PI + 90
																	: workbenchShipRotation
															}deg)`,
														}}
														className="transition-transform duration-75"
													>
														<ModularStarship
															loadout={{
																hullArchetype: workbenchShipArchetype,
																skinId: workbenchShipSkin,
															}}
															themeId={activeStarThemeId}
															size={workbenchShipSize}
															thrusterFrame={workbenchShipThrusterActive ? 1 : 0}
														/>
													</div>
													<div className="flex flex-col items-center gap-1 mt-2">
														<div className="flex items-center gap-2 text-xs text-neutral-200 font-semibold">
															<span>{SHIP_CATALOG[workbenchShipArchetype].name}</span>
															<span className="text-neutral-600">•</span>
															<span className="text-sky-300">{SHIP_SKINS[workbenchShipSkin].name}</span>
														</div>
														<span className="text-[11px] text-neutral-400">
															Drag & release ship to slingshot into interactive flight arena
														</span>
													</div>
												</div>

												<div
													data-testid="starship-theme-switcher"
													className="flex flex-wrap items-center justify-center gap-2"
												>
													{STAR_POINTS_THEME_IDS.map((candidateId) => {
														const candidate = STAR_POINTS_THEMES[candidateId]
														const isSelected = candidateId === activeStarThemeId
														return (
															<button
																key={candidateId}
																type="button"
																data-testid={`starship-theme-btn-${candidateId}`}
																onClick={() => handleSelectStarTheme(candidateId)}
																className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
																	isSelected
																		? 'border-sky-400 bg-sky-500/15 text-sky-300 shadow'
																		: 'border-neutral-800 bg-neutral-950/80 text-neutral-300 hover:border-neutral-700'
																}`}
															>
																<span
																	className="h-2.5 w-2.5 rounded-full"
																	style={{
																		backgroundColor: candidate.shipPalette.cockpitGlow,
																	}}
																/>
																<span>{candidate.name}</span>
															</button>
														)
													})}
												</div>

												<div
													data-testid="starship-hull-lineup"
													className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 w-full"
												>
													{SHIP_ARCHETYPE_LIST.map((hullId) => {
														const shipDef = SHIP_CATALOG[hullId]
														const isSelected = workbenchShipArchetype === hullId
														return (
															<button
																key={hullId}
																type="button"
																data-testid={`starship-hull-card-${hullId}`}
																onClick={() => setWorkbenchShipArchetype(hullId)}
																className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${
																	isSelected
																		? 'border-sky-400/60 bg-sky-500/10 shadow-lg'
																		: 'border-neutral-800 bg-neutral-950/75 hover:border-neutral-700'
																}`}
															>
																<ModularStarship
																	loadout={{
																		hullArchetype: hullId,
																		skinId: workbenchShipSkin,
																	}}
																	themeId={activeStarThemeId}
																	size={64}
																	thrusterFrame={workbenchShipThrusterActive ? 1 : 0}
																/>
																<span className="text-[11px] font-medium text-neutral-200 text-center leading-tight">
																	{shipDef.name}
																</span>
															</button>
														)
													})}
												</div>
											</>
										)}
									</div>
								)}
							</div>
						</div>
				</IonContent>

				{/* Sheet Modal: Presets in peek mode by default, expandable to Knobs */}
				<IonModal
					ref={controlsSheetRef}
					isOpen={true}
					canDismiss={false}
					breakpoints={[0.08, 0.65, 0.95]}
					initialBreakpoint={0.08}
					backdropBreakpoint={0.65}
					handle={true}
					handleBehavior="cycle"
					id="workbench-controls-sheet"
					data-testid="workbench-controls-sheet"
					style={
						{
							'--background': '#1f1f1f',
							'--border-color': 'rgba(255, 255, 255, 0.08)',
							'--border-radius': '16px 16px 0 0',
							'--box-shadow': '0 -10px 25px -5px rgba(0, 0, 0, 0.5)',
						} as React.CSSProperties
					}
				>
					<div className="flex flex-col h-full bg-[#1f1f1f] text-neutral-100 select-none">
						{/* Presets Bar */}
						{presetsForActiveComponent.length > 0 && (
							<div
								data-testid="workbench-presets-bar"
								className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-3 pt-4 pb-2.5 shrink-0 bg-[#1f1f1f]"
							>
								<div
									data-testid="workbench-toolbar-presets-bar"
									className="contents"
								>
									{presetsForActiveComponent.map((preset) => (
										<IonChip
											key={preset.id}
											onClick={preset.action}
											style={
												{
													'--background': preset.active
														? 'rgba(56, 189, 248, 0.2)'
														: 'rgba(255, 255, 255, 0.08)',
													'--color': preset.active ? '#38bdf8' : '#e5e5e5',
													border: preset.active
														? '1px solid rgba(56, 189, 248, 0.5)'
														: '1px solid rgba(255, 255, 255, 0.12)',
												} as React.CSSProperties
											}
											className="cursor-pointer m-0 text-xs shrink-0 whitespace-nowrap h-7 font-medium transition-colors hover:opacity-90"
										>
											<IonLabel>{preset.label}</IonLabel>
										</IonChip>
									))}
								</div>
							</div>
						)}

						{/* Expanded Surface: Knobs & Controls */}
						<IonContent
							className="ion-padding text-neutral-100"
							scrollY={true}
							style={{ '--background': '#1f1f1f' } as React.CSSProperties}
						>
							<div className="space-y-4 pb-12">{knobsContent}</div>
						</IonContent>
					</div>
				</IonModal>
			</div>
	)
}

export default function Workbench() {
	return (
		<MoodProvider>
			<WorkbenchContent />
		</MoodProvider>
	)
}
