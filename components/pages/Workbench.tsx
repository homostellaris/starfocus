'use client'

import React, { useState, useMemo } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import {
	IonBackButton,
	IonBadge,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonMenu,
	IonMenuButton,
	IonRange,
	IonSplitPane,
	IonTitle,
	IonToggle,
	IonToolbar,
} from '@ionic/react'
import { menuController } from '@ionic/core/components'
import {
	flashSharp,
	optionsSharp,
	chevronBackOutline,
	chevronForwardOutline,
	syncSharp,
	cloudDoneSharp,
	documentTextSharp,
	starSharp,
	sparklesSharp,
	rocketSharp,
	pulseSharp,
	musicalNotesSharp,
	closeSharp,
	layersSharp,
} from 'ionicons/icons'
import dayjs from 'dayjs'
import { MarkdownExportProvider } from '../export/MarkdownExportContext'
import SyncStatus from '../common/SyncStatus'
import CloudSyncDetails from '../db/cloud/CloudSyncDetails'
import CloudSyncStatus from '../db/cloud/CloudSyncStatus'
import MarkdownSyncDetails from '../export/MarkdownSyncDetails'
import MarkdownSyncStatus from '../export/MarkdownSyncStatus'
import { StarRoleIcon } from '../common/StarRoleIcon'
import StarPoints from '../common/StarPoints'
import Starship from '../common/Starship'
import Tracjectory from '../starship/Trajectory'
import PulseGraph from '../todos/PulseGraph'
import Mood from '../mood'
import { MoodProvider, useMood } from '../mood/MoodContext'
import type { ExportStatus } from '../export/useMarkdownExport'
import type { Visit } from '../db'

type ComponentKey =
	| 'sync-status'
	| 'cloud-sync'
	| 'markdown-sync'
	| 'star-roles'
	| 'star-points'
	| 'starship-trajectory'
	| 'pulse-graph'
	| 'mood-player'

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
]

const VALID_COMPONENTS: ComponentKey[] = CATALOG_ITEMS.map((item) => item.key)

const COMPONENT_TITLES: Record<ComponentKey, string> = Object.fromEntries(
	CATALOG_ITEMS.map((item) => [item.key, item.title])
) as Record<ComponentKey, string>

const COMPONENT_DESCRIPTIONS: Record<ComponentKey, string> = Object.fromEntries(
	CATALOG_ITEMS.map((item) => [item.key, item.description])
) as Record<ComponentKey, string>

function WorkbenchContent() {
	const params = useParams<{ component?: string }>()
	const history = useHistory()
	const { mode, setMode } = useMood()

	const activeComponent: ComponentKey =
		params.component &&
		VALID_COMPONENTS.includes(params.component as ComponentKey)
			? (params.component as ComponentKey)
			: 'sync-status'

	const handleSelectComponent = (key: ComponentKey) => {
		history.push(`/dev/components/${key}`)
		menuController.close('components-menu')
		menuController.close('start')
		menuController.close()
	}

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

	// --- Star Role Knobs ---
	const [selectedIcon] = useState('starSharp')
	const [selectedColor] = useState('#f59e0b')

	// --- Starship & Trajectory Knobs ---
	const [starshipPosition, setStarshipPosition] = useState(120)
	const [starshipRotation, setStarshipRotation] = useState(180)

	// --- Pulse Graph Knobs ---
	const [pulseStarPoints, setPulseStarPoints] = useState(5)
	const [pulsePreset, setPulsePreset] = useState<'streak' | 'recent' | 'sporadic' | 'empty'>('streak')

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
		return []
	})()

	// Active Scenario tracking for Swiping & Indicators
	const activePresetIndex = presetsForActiveComponent.findIndex((p) => p.active)
	const currentScenarioIndex = activePresetIndex >= 0 ? activePresetIndex : 0
	const currentScenario = presetsForActiveComponent[currentScenarioIndex]

	const goToNextScenario = () => {
		if (presetsForActiveComponent.length <= 1) return
		const nextIndex = (currentScenarioIndex + 1) % presetsForActiveComponent.length
		presetsForActiveComponent[nextIndex].action()
	}

	const goToPrevScenario = () => {
		if (presetsForActiveComponent.length <= 1) return
		const prevIndex =
			(currentScenarioIndex - 1 + presetsForActiveComponent.length) %
			presetsForActiveComponent.length
		presetsForActiveComponent[prevIndex].action()
	}

	// Touch swipe tracking on the Canvas
	const [touchStartX, setTouchStartX] = useState<number | null>(null)
	const [touchEndX, setTouchEndX] = useState<number | null>(null)

	const handleTouchStart = (e: React.TouchEvent) => {
		setTouchEndX(null)
		const touch = e.touches?.[0] || e.targetTouches?.[0] || (e as any).changedTouches?.[0]
		if (touch) {
			setTouchStartX(touch.clientX)
		}
	}

	const handleTouchMove = (e: React.TouchEvent) => {
		const touch = e.touches?.[0] || e.targetTouches?.[0] || (e as any).changedTouches?.[0]
		if (touch) {
			setTouchEndX(touch.clientX)
		}
	}

	const handleTouchEnd = (e: React.TouchEvent) => {
		const endX =
			touchEndX !== null
				? touchEndX
				: (e as any).changedTouches?.[0]?.clientX ?? null
		if (touchStartX === null || endX === null) return
		const diff = touchStartX - endX
		if (diff > 40) {
			goToNextScenario()
		} else if (diff < -40) {
			goToPrevScenario()
		}
		setTouchStartX(null)
		setTouchEndX(null)
	}

	const knobsContent = (
		<div className="space-y-5">
			{/* Component-Specific Knobs */}
			{isSyncComponent && (
				<>
					{/* Cloud Sync Knobs */}
					<div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
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
							<select
								id="cloud-phase-select"
								value={cloudPhase}
								onChange={(e) =>
									setCloudPhase(
										e.target.value as
											| 'in-sync'
											| 'pushing'
											| 'pulling'
											| 'offline'
											| 'error'
									)
								}
								className="w-full rounded border border-neutral-700 bg-neutral-800 p-1.5 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
							>
								<option value="in-sync">In-Sync (Connected)</option>
								<option value="pushing">Pushing (Uploading changes)</option>
								<option value="pulling">Pulling (Downloading changes)</option>
								<option value="offline">Offline</option>
								<option value="error">Error</option>
							</select>
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
								<input
									type="text"
									value={cloudErrorMessage}
									onChange={(e) => setCloudErrorMessage(e.target.value)}
									className="w-full rounded border border-red-900/50 bg-neutral-900 p-1.5 text-xs text-red-200"
								/>
							</div>
						)}
					</div>

					{/* Markdown Sync Knobs */}
					<div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
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
							<select
								value={markdownFullSyncPhase}
								onChange={(e) =>
									setMarkdownFullSyncPhase(
										e.target.value as 'idle' | 'in-progress' | 'complete'
									)
								}
								className="w-full rounded border border-neutral-700 bg-neutral-800 p-1.5 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
							>
								<option value="idle">Idle</option>
								<option value="in-progress">In-Progress</option>
								<option value="complete">Complete</option>
							</select>
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
								<input
									type="text"
									value={markdownErrorMessage}
									onChange={(e) => setMarkdownErrorMessage(e.target.value)}
									className="w-full rounded border border-red-900/50 bg-neutral-900 p-1.5 text-xs text-red-200"
								/>
							</div>
						)}
					</div>
				</>
			)}

			{/* Starship & Trajectory Knobs */}
			{activeComponent === 'starship-trajectory' && (
				<div className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
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
						<button
							onClick={() => setMode(mode === 'chill' ? 'hype' : 'chill')}
							className={`rounded px-3 py-1 font-semibold text-xs transition ${
								mode === 'hype'
									? 'bg-red-500/20 text-red-400 border border-red-500/30'
									: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
							}`}
						>
							{mode.toUpperCase()}
						</button>
					</div>
				</div>
			)}

			{/* Pulse Graph Knobs */}
			{activeComponent === 'pulse-graph' && (
				<div className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
					<h4 className="font-semibold text-neutral-300">Pulse Activity Controls</h4>
					<div>
						<div className="flex justify-between text-neutral-400">
							<span>Activity Pattern Preset</span>
							<span className="capitalize">{pulsePreset}</span>
						</div>
						<div className="grid grid-cols-2 gap-2 mt-2">
							<button
								onClick={() => setPulsePreset('streak')}
								className={`rounded p-1.5 text-xs border ${
									pulsePreset === 'streak'
										? 'border-blue-500 bg-blue-950/40 text-blue-200'
										: 'border-neutral-800 bg-neutral-900 text-neutral-300'
								}`}
							>
								14d Streak
							</button>
							<button
								onClick={() => setPulsePreset('recent')}
								className={`rounded p-1.5 text-xs border ${
									pulsePreset === 'recent'
										? 'border-blue-500 bg-blue-950/40 text-blue-200'
										: 'border-neutral-800 bg-neutral-900 text-neutral-300'
								}`}
							>
								Recent Spark
							</button>
							<button
								onClick={() => setPulsePreset('sporadic')}
								className={`rounded p-1.5 text-xs border ${
									pulsePreset === 'sporadic'
										? 'border-blue-500 bg-blue-950/40 text-blue-200'
										: 'border-neutral-800 bg-neutral-900 text-neutral-300'
								}`}
							>
								Alternate Days
							</button>
							<button
								onClick={() => setPulsePreset('empty')}
								className={`rounded p-1.5 text-xs border ${
									pulsePreset === 'empty'
										? 'border-blue-500 bg-blue-950/40 text-blue-200'
										: 'border-neutral-800 bg-neutral-900 text-neutral-300'
								}`}
							>
								Empty
							</button>
						</div>
					</div>

					<div>
						<div className="flex justify-between text-neutral-400">
							<span>Todo Star Points Value</span>
							<span>{pulseStarPoints} pts</span>
						</div>
						<IonRange
							min={1}
							max={21}
							value={pulseStarPoints}
							onIonChange={(e) => setPulseStarPoints(e.detail.value as number)}
						/>
					</div>
				</div>
			)}

			{/* Mood Player Knobs */}
			{activeComponent === 'mood-player' && (
				<div className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
					<h4 className="font-semibold text-neutral-300">Soundtrack Stream Mode</h4>
					<div className="flex items-center justify-between">
						<span>Active Channel</span>
						<button
							onClick={() => setMode(mode === 'chill' ? 'hype' : 'chill')}
							className={`rounded-full px-3 py-1 font-semibold text-xs border transition ${
								mode === 'hype'
									? 'bg-red-500/20 text-red-400 border-red-500/30'
									: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
							}`}
						>
							{mode === 'chill' ? '🌌 CHILL (Melodysheep)' : '⚡ HYPE (Karl Casey)'}
						</button>
					</div>
					<div className="text-[11px] text-neutral-400 space-y-1">
						<p>• Press <kbd className="font-mono text-neutral-200">Z</kbd> for Chill Mode</p>
						<p>• Press <kbd className="font-mono text-neutral-200">X</kbd> for Hype Mode</p>
						<p>• Press <kbd className="font-mono text-neutral-200">Space</kbd> to Play / Pause</p>
					</div>
				</div>
			)}

			{/* Star Roles Knobs */}
			{activeComponent === 'star-roles' && (
				<div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
					<h4 className="font-semibold text-neutral-300">Star Role Visualizer</h4>
					<p className="text-neutral-400">
						Displays role-based classification badges used across todos and wayfinder sequences.
					</p>
				</div>
			)}

			{/* Star Points Knobs */}
			{activeComponent === 'star-points' && (
				<div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
					<h4 className="font-semibold text-neutral-300">Star Points Widget</h4>
					<p className="text-neutral-400">
						Inspects the live header score counter tracking completed achievements.
					</p>
				</div>
			)}
		</div>
	)

	return (
		<IonSplitPane
			when="lg"
			contentId="workbench-main"
			style={
				{
					'--side-min-width': '270px',
					'--side-max-width': '340px',
				} as React.CSSProperties
			}
		>
			{/* Left Pane: Component Catalog Menu */}
			<IonMenu
				contentId="workbench-main"
				menuId="components-menu"
				side="start"
			>
				<IonHeader>
					<IonToolbar color="dark">
						<div className="flex items-center gap-2 px-3 py-1">
							<IonIcon
								icon={layersSharp}
								className="text-blue-400 text-lg"
							/>
							<IonTitle
								size="small"
								className="font-bold text-sm"
							>
								Components
							</IonTitle>
							<span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
								{CATALOG_ITEMS.length}
							</span>
						</div>
						<IonButtons
							slot="end"
							className="lg:hidden"
						>
							<button
								type="button"
								id="close-components-btn"
								aria-label="Close component catalog"
								className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition mr-1"
								onClick={async () => {
									const menu = document.querySelector('ion-menu[menu-id="components-menu"]') as any
									if (menu?.close) {
										await menu.close()
									} else {
										await menuController.close('components-menu')
									}
								}}
							>
								<IonIcon icon={closeSharp} className="text-xl" />
							</button>
						</IonButtons>
					</IonToolbar>
				</IonHeader>
				<IonContent className="bg-neutral-950 text-neutral-100">
					<div className="p-3 space-y-1">
						{CATALOG_ITEMS.map((item) => {
							const isActive = activeComponent === item.key
							return (
								<button
									key={item.key}
									onClick={() => handleSelectComponent(item.key)}
									className={`w-full text-left rounded-xl p-3 transition flex items-start gap-3 border ${
										isActive
											? 'border-blue-500/60 bg-blue-950/50 text-blue-100 shadow-sm'
											: 'border-transparent hover:border-neutral-800 hover:bg-neutral-900/60 text-neutral-300'
									}`}
								>
									<div
										className={`p-2 rounded-lg border text-lg shrink-0 ${item.iconColor}`}
									>
										<IonIcon icon={item.icon} />
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between gap-1">
											<span className="font-semibold text-xs truncate text-white">
												{item.title}
											</span>
											<span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono shrink-0">
												{item.badge}
											</span>
										</div>
										<p className="text-[11px] text-neutral-400 truncate mt-0.5">
											{item.subtitle}
										</p>
									</div>
								</button>
							)
						})}
					</div>
				</IonContent>
			</IonMenu>

			{/* Center Pane: Main Interactive Stage & Canvas */}
			<div
				className="ion-page"
				id="workbench-main"
			>
				<IonHeader className="ion-no-border">
					<IonToolbar color="dark">
						<IonButtons slot="start">
							<IonBackButton defaultHref="/dev/components" />
							<IonMenuButton
								menu="components-menu"
								id="components-menu-btn"
							/>
						</IonButtons>
						<IonTitle className="font-bold text-sm md:text-base">
							{COMPONENT_TITLES[activeComponent] || 'Workbench'}
						</IonTitle>
						<IonButtons slot="end">
							<IonMenuButton
								menu="knobs-menu"
								id="knobs-menu-btn"
							>
								<IonIcon icon={optionsSharp} />
							</IonMenuButton>
						</IonButtons>
					</IonToolbar>

					{/* Presets Bar in Sub-Toolbar: Always visible, never covered by sheets */}
					{presetsForActiveComponent.length > 0 && (
						<IonToolbar
							color="dark"
							className="border-t border-neutral-800"
						>
							<div
								data-testid="workbench-presets-bar"
								className="flex items-center gap-2 overflow-x-auto no-scrollbar px-3 py-1"
							>
								<span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400 shrink-0 mr-1">
									<IonIcon
										icon={flashSharp}
										className="text-amber-400"
									/>
									Scenarios:
								</span>
								{presetsForActiveComponent.map((p) => (
									<button
										key={p.id}
										onClick={p.action}
										className={`rounded-full border px-3 py-1 text-xs font-medium transition active:scale-95 shrink-0 flex items-center gap-1.5 ${
											p.active
												? 'border-blue-500/70 bg-blue-950/70 text-blue-200 ring-1 ring-blue-500/50 shadow-sm'
												: 'border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800'
										}`}
									>
										{p.label}
									</button>
								))}
							</div>
						</IonToolbar>
					)}
				</IonHeader>

				<IonContent className="bg-neutral-950 text-neutral-100">
					{/* Header / Description */}
					<div className="px-4 py-2.5 md:px-6 md:py-3 border-b border-neutral-800/60 bg-neutral-950">
						<h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
							{COMPONENT_TITLES[activeComponent]}
						</h1>
						<p className="text-xs text-neutral-400 mt-0.5 max-w-2xl">
							{COMPONENT_DESCRIPTIONS[activeComponent]}
						</p>
					</div>

					{/* Canvas Area: Centered with subtle dot-grid background and touch swipe navigation */}
					<div className="p-3 md:p-6">
						<div
							data-testid="workbench-canvas"
							className="relative min-h-[340px] rounded-2xl border border-neutral-800/80 p-4 md:p-8 flex flex-col items-center justify-center select-none shadow-2xl"
							style={{
								backgroundColor: '#09090b',
								backgroundImage:
									'radial-gradient(circle, rgba(255, 255, 255, 0.14) 1px, transparent 1px)',
								backgroundSize: '22px 22px',
							}}
							onTouchStart={handleTouchStart}
							onTouchMove={handleTouchMove}
							onTouchEnd={handleTouchEnd}
						>
							{/* Floating Scenario Pill with Swipe Hint */}
							{presetsForActiveComponent.length > 0 && (
								<div
									data-testid="canvas-scenario-pill"
									className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full border border-neutral-800/90 bg-neutral-900/90 px-3 py-1.5 shadow-xl backdrop-blur-md text-xs transition"
								>
									<button
										onClick={goToPrevScenario}
										aria-label="Previous scenario"
										className="text-neutral-400 hover:text-white px-1 text-sm font-bold active:scale-95"
									>
										<IonIcon
											icon={chevronBackOutline}
											className="align-middle"
										/>
									</button>
									<span className="text-neutral-400 text-[11px] hidden sm:inline">
										Story:
									</span>
									<span className="font-semibold text-white">
										{currentScenario?.label || 'Custom'}
									</span>
									<span className="text-neutral-500 text-[10px]">
										({currentScenarioIndex + 1}/{presetsForActiveComponent.length})
									</span>
									<button
										onClick={goToNextScenario}
										aria-label="Next scenario"
										className="text-neutral-400 hover:text-white px-1 text-sm font-bold active:scale-95"
									>
										<IonIcon
											icon={chevronForwardOutline}
											className="align-middle"
										/>
									</button>
								</div>
							)}

							{/* Centered Element on Canvas */}
							<div className="w-full flex items-center justify-center py-6">
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
														onRunFullSync={() => {
															setMarkdownFullSyncPhase('in-progress')
															setMarkdownCompletedFiles(1)
														}}
														onReconnect={() => {
															setMarkdownNeedsReconnect(false)
															setMarkdownHasError(false)
														}}
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
												onRunFullSync={() => {
													setMarkdownFullSyncPhase('in-progress')
													setMarkdownCompletedFiles(1)
												}}
												onReconnect={() => {
													setMarkdownNeedsReconnect(false)
													setMarkdownHasError(false)
												}}
											/>
										</div>
									</div>
								)}

								{activeComponent === 'cloud-sync' && (
									<div className="w-full max-w-md space-y-4">
										<div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/90 p-4 shadow-xl">
											<span className="text-sm font-medium text-neutral-300">
												Status Indicator
											</span>
											<div className="rounded-lg border border-neutral-700 bg-neutral-800 p-2 text-2xl">
												<CloudSyncStatus
													user={simulatedUser}
													syncState={simulatedSyncState}
												/>
											</div>
										</div>
										<div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 shadow-2xl">
											<CloudSyncDetails
												user={simulatedUser}
												syncState={simulatedSyncState}
												onLogout={() => setCloudLoggedIn(false)}
											/>
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
												<MarkdownSyncStatus exportStatus={simulatedExportStatus} />
											</div>
										</div>
										<div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 shadow-2xl">
											<MarkdownSyncDetails
												exportStatus={simulatedExportStatus}
												onRunFullSync={() => {
													setMarkdownFullSyncPhase('in-progress')
													setMarkdownCompletedFiles(1)
												}}
												onReconnect={() => {
													setMarkdownNeedsReconnect(false)
													setMarkdownHasError(false)
												}}
											/>
										</div>
									</div>
								)}

								{activeComponent === 'star-roles' && (
									<div className="flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-8 shadow-2xl backdrop-blur-md">
										<div className="flex flex-col items-center gap-2">
											<StarRoleIcon
												starRole={{
													id: '1',
													title: 'Selected',
													icon: { type: 'ionicon', name: selectedIcon },
												}}
												style={{ color: selectedColor, fontSize: '32px' }}
											/>
											<span className="text-xs text-neutral-400">Selected</span>
										</div>

										<div className="flex flex-col items-center gap-2">
											<StarRoleIcon
												starRole={{
													id: '2',
													title: 'Planet',
													icon: { type: 'ionicon', name: 'planetSharp' },
												}}
												style={{ color: '#3b82f6', fontSize: '32px' }}
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
												style={{ color: '#ec4899', fontSize: '32px' }}
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
												style={{ color: '#eab308', fontSize: '32px' }}
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
									<div className="w-full max-w-lg flex flex-col items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950 p-8 shadow-2xl">
										<div
											id="workbench-starship"
											className="relative h-[300px] w-[60px] flex justify-center"
										>
											<Tracjectory
												currentPosition={starshipPosition}
												orientation="vertical"
											/>
											<div
												className="absolute left-1/2 -translate-x-1/2 transition-transform duration-300 ease-out w-[56px] h-[56px]"
												style={{
													transform: `translate(-50%, ${starshipPosition}px) rotate(${starshipRotation}deg)`,
												}}
											>
												<Starship />
											</div>
										</div>
									</div>
								)}

								{activeComponent === 'pulse-graph' && (
									<div
										className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-8 flex flex-col items-center justify-center shadow-2xl"
									>
										<span className="text-xs text-neutral-500 mb-3 font-mono uppercase tracking-wider">
											14-Day Activity Pulse
										</span>
										<div id="workbench-pulse-graph" className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
											<PulseGraph starPoints={pulseStarPoints} visits={simulatedVisits} />
										</div>
									</div>
								)}

								{activeComponent === 'mood-player' && (
									<div
										className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-8 flex flex-col items-center justify-center shadow-2xl"
										id="workbench-mood-player"
									>
										<Mood />
										<div className="mt-6 flex items-center gap-2">
											<IonBadge color={mode === 'hype' ? 'danger' : 'primary'}>
												{mode.toUpperCase()} ACTIVE
											</IonBadge>
											<span className="text-xs text-neutral-400">
												{mode === 'chill'
													? 'Melodysheep Ambient'
													: 'Karl Casey Synthwave'}
											</span>
										</div>
									</div>
								)}
							</div>

							{/* Subtle Mobile Swipe Hint */}
							{presetsForActiveComponent.length > 1 && (
								<div className="text-[10px] text-neutral-500 mt-2 block sm:hidden">
									👈 Swipe left / right to cycle stories 👉
								</div>
							)}
						</div>
					</div>
				</IonContent>
			</div>

			{/* Right Pane: State Simulator & Knobs Menu */}
			<IonMenu
				contentId="workbench-main"
				menuId="knobs-menu"
				side="end"
			>
				<IonHeader>
					<IonToolbar color="dark">
						<div className="flex items-center gap-2 px-3 py-1">
							<IonIcon
								icon={optionsSharp}
								className="text-blue-400 text-lg"
							/>
							<IonTitle
								size="small"
								className="font-bold text-sm"
							>
								Simulator & Knobs
							</IonTitle>
						</div>
						<IonButtons
							slot="end"
							className="lg:hidden"
						>
							<button
								type="button"
								id="close-knobs-btn"
								aria-label="Close knobs menu"
								className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition mr-1"
								onClick={async () => {
									const menu = document.querySelector('ion-menu[menu-id="knobs-menu"]') as any
									if (menu?.close) {
										await menu.close()
									} else {
										await menuController.close('knobs-menu')
									}
								}}
							>
								<IonIcon icon={closeSharp} className="text-xl" />
							</button>
						</IonButtons>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding bg-neutral-900 text-neutral-100">
					<div className="space-y-4 pb-6">{knobsContent}</div>
				</IonContent>
			</IonMenu>
		</IonSplitPane>
	)
}

export default function Workbench() {
	return (
		<MarkdownExportProvider>
			<MoodProvider>
				<WorkbenchContent />
			</MoodProvider>
		</MarkdownExportProvider>
	)
}
