'use client'

import React, { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
	IonBadge,
	IonButton,
	IonButtons,
	IonChip,
	IonContent,
	IonFooter,
	IonHeader,
	IonIcon,
	IonInput,
	IonLabel,
	IonMenu,
	IonMenuButton,
	IonRange,
	IonSelect,
	IonSelectOption,
	IonSplitPane,
	IonTitle,
	IonToggle,
	IonToolbar,
} from '@ionic/react'
import { menuController } from '@ionic/core/components'
import {
	flashSharp,
	optionsSharp,
	syncSharp,
	cloudDoneSharp,
	documentTextSharp,
	starSharp,
	sparklesSharp,
	rocketSharp,
	pulseSharp,
	musicalNotesSharp,
	closeSharp,
} from 'ionicons/icons'
import dayjs from 'dayjs'
import { Header } from '../common/Header'
import { MarkdownExportProvider } from '../export/MarkdownExportContext'
import SyncStatus, { CloudSyncStatusBadge, MarkdownSyncStatusBadge } from '../common/SyncStatus'
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
	const { mode, setMode } = useMood()

	const activeComponent: ComponentKey =
		params.component &&
		VALID_COMPONENTS.includes(params.component as ComponentKey)
			? (params.component as ComponentKey)
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

	const knobsContent = (
		<div className="space-y-5">
			{/* Quick Scenario Presets */}
			{presetsForActiveComponent.length > 0 && (
				<div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
					<div className="flex items-center gap-1.5 font-semibold text-neutral-300">
						<IonIcon icon={flashSharp} className="text-amber-400" />
						<span>Scenario Presets</span>
					</div>
					<p className="text-[11px] text-neutral-400">
						Select a preset to automatically configure simulator knobs below.
					</p>
					<div
						data-testid="workbench-presets-bar"
						className="flex flex-wrap gap-1.5 pt-1"
					>
						{presetsForActiveComponent.map((p) => (
							<IonChip
								key={p.id}
								onClick={p.action}
								outline={!p.active}
								color={p.active ? 'primary' : 'medium'}
								className="cursor-pointer m-0 text-xs"
							>
								<IonLabel>{p.label}</IonLabel>
							</IonChip>
						))}
					</div>
				</div>
			)}

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
								<IonInput
									type="text"
									value={markdownErrorMessage}
									onIonInput={(e) => setMarkdownErrorMessage((e.detail.value as string) || '')}
									className="w-full rounded border border-red-900/50 bg-neutral-900 px-2 py-1 text-xs text-red-200"
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
				<div className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
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
									outline={pulsePreset !== p.id}
									color={pulsePreset === p.id ? 'primary' : 'medium'}
									className="cursor-pointer m-0 text-xs"
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
			{/* Center Pane: Main Interactive Stage & Canvas */}
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
						className="w-full min-h-[calc(100%-48px)] flex-1 flex flex-col items-center justify-center p-4 md:p-8 select-none"
						style={{
							backgroundColor: 'transparent',
							backgroundImage:
								'radial-gradient(circle, rgba(255, 255, 255, 0.14) 1px, transparent 1px)',
							backgroundSize: '22px 22px',
						}}
					>
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
						</div>
				</IonContent>

				{/* Bottom Toolbar housing the workbench controls */}
				<IonFooter className="border-t border-neutral-800 bg-neutral-950">
					<IonToolbar className="[--background:transparent]">
						{presetsForActiveComponent.length > 0 && (
							<div
								data-testid="workbench-toolbar-presets-bar"
								className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-2 ml-14 sm:ml-2"
							>
								{presetsForActiveComponent.map((p) => (
									<IonChip
										key={p.id}
										onClick={p.action}
										outline={!p.active}
										color={p.active ? 'primary' : 'medium'}
										className="cursor-pointer m-0 text-xs shrink-0 whitespace-nowrap h-7"
									>
										<IonLabel>{p.label}</IonLabel>
									</IonChip>
								))}
							</div>
						)}

						<IonButtons slot="end">
							<span className="text-xs font-medium text-neutral-400 hidden sm:inline mr-1">
								Controls & Knobs
							</span>
							<IonMenuButton
								menu="knobs-menu"
								id="knobs-menu-btn"
							>
								<IonIcon icon={optionsSharp} />
							</IonMenuButton>
						</IonButtons>
					</IonToolbar>
				</IonFooter>
			</div>

			{/* Right Pane: State Simulator & Knobs Menu */}
			<IonMenu
				contentId="workbench-main"
				menuId="knobs-menu"
				side="end"
			>
				<IonHeader>
					<IonToolbar className="border-b border-neutral-800">
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
							<IonButton
								id="close-knobs-btn"
								aria-label="Close knobs menu"
								fill="clear"
								color="light"
								onClick={async () => {
									const menu = document.querySelector('ion-menu[menu-id="knobs-menu"]') as any
									if (menu?.close) {
										await menu.close()
									} else {
										await menuController.close('knobs-menu')
									}
								}}
							>
								<IonIcon slot="icon-only" icon={closeSharp} />
							</IonButton>
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
