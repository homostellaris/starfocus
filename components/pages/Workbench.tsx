'use client'

import React, { useState, useMemo } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import {
	IonContent,
	IonIcon,
	IonPage,
	IonCard,
	IonCardHeader,
	IonCardTitle,
	IonCardContent,
	IonBadge,
	IonRange,
	IonToggle,
	IonFooter,
	IonToolbar,
	IonButtons,
	IonButton,
	IonTitle,
	IonModal,
	IonHeader,
} from '@ionic/react'
import {
	syncSharp,
	cloudDoneSharp,
	documentTextSharp,
	starSharp,
	sparklesSharp,
	optionsSharp,
	rocketSharp,
	pulseSharp,
	musicalNotesSharp,
	flashSharp,
} from 'ionicons/icons'
import dayjs from 'dayjs'
import { Header } from '../common/Header'
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
import starScale from '../common/starScale'
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

const VALID_COMPONENTS: ComponentKey[] = [
	'sync-status',
	'cloud-sync',
	'markdown-sync',
	'star-roles',
	'star-points',
	'starship-trajectory',
	'pulse-graph',
	'mood-player',
]

function WorkbenchContent() {
	const params = useParams<{ component?: string }>()
	const history = useHistory()
	const { mode, setMode } = useMood()

	const [fallbackComponent, setFallbackComponent] =
		useState<ComponentKey>('sync-status')
	const [mobileKnobsOpen, setMobileKnobsOpen] = useState(false)

	const activeComponent: ComponentKey =
		params.component &&
		VALID_COMPONENTS.includes(params.component as ComponentKey)
			? (params.component as ComponentKey)
			: fallbackComponent

	const selectComponent = (key: ComponentKey) => {
		setFallbackComponent(key)
		history.push(`/dev/components/${key}`)
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
	const [starshipOrientation, setStarshipOrientation] = useState<'vertical' | 'horizontal'>('vertical')
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
				setMarkdownFullSyncPhase('complete')
				setMarkdownHasError(false)
				break
			case 'cloud-pushing':
				setCloudLoggedIn(true)
				setCloudPhase('pushing')
				setCloudProgress(0.72)
				setCloudHasError(false)
				break
			case 'markdown-syncing':
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
				break
			case 'markdown-error':
				setMarkdownEnabled(true)
				setMarkdownNeedsReconnect(true)
				setMarkdownHasError(true)
				setMarkdownErrorMessage('User denied directory handle permission')
				break
			case 'logged-out':
				setCloudLoggedIn(false)
				setCloudPhase('offline')
				setCloudHasError(false)
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

	const presetsBar = presetsForActiveComponent.length > 0 && (
		<div
			data-testid="workbench-presets-bar"
			className="sticky top-0 z-20 flex items-center gap-2 overflow-x-auto border-b border-neutral-800 bg-neutral-950/95 px-4 py-2 backdrop-blur-md lg:px-6"
		>
			<span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400 mr-1">
				<IonIcon icon={flashSharp} className="text-amber-400 text-sm" />
				Presets
			</span>
			<div className="flex items-center gap-2">
				{presetsForActiveComponent.map((p) => (
					<button
						key={p.id}
						onClick={p.action}
						className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95 flex items-center gap-1.5 ${
							p.active
								? 'border-blue-500/70 bg-blue-950/60 text-blue-200 ring-1 ring-blue-500/50 shadow-sm'
								: 'border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800/80'
						}`}
					>
						{p.label}
					</button>
				))}
			</div>
		</div>
	)

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
								onChange={(e) => setCloudPhase(e.target.value as any)}
								className="w-full rounded border border-neutral-700 bg-neutral-900 p-1.5 text-xs text-white"
							>
								<option value="in-sync">in-sync</option>
								<option value="pushing">pushing (upload)</option>
								<option value="pulling">pulling (download)</option>
								<option value="offline">offline</option>
								<option value="error">error</option>
							</select>
						</div>
						{(cloudPhase === 'pushing' || cloudPhase === 'pulling') && (
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
							<span>Simulate Cloud Error</span>
							<IonToggle
								checked={cloudHasError}
								onIonChange={(e) => setCloudHasError(e.detail.checked)}
							/>
						</div>
					</div>

					{/* Markdown Sync Knobs */}
					<div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
						<h4 className="font-semibold text-neutral-300">Local Markdown Controls</h4>
						<div className="flex items-center justify-between">
							<span>Export Enabled</span>
							<IonToggle
								checked={markdownEnabled}
								onIonChange={(e) => setMarkdownEnabled(e.detail.checked)}
							/>
						</div>
						<div className="flex items-center justify-between">
							<span>Needs Reconnect</span>
							<IonToggle
								checked={markdownNeedsReconnect}
								onIonChange={(e) => setMarkdownNeedsReconnect(e.detail.checked)}
							/>
						</div>
						<div className="flex items-center justify-between">
							<span>Incremental Syncing</span>
							<IonToggle
								checked={markdownIsSyncing}
								onIonChange={(e) => setMarkdownIsSyncing(e.detail.checked)}
							/>
						</div>
						<div>
							<span className="block mb-1 text-neutral-400">Full Sync Phase</span>
							<select
								value={markdownFullSyncPhase}
								onChange={(e) => setMarkdownFullSyncPhase(e.target.value as any)}
								className="w-full rounded border border-neutral-700 bg-neutral-900 p-1.5 text-xs text-white"
							>
								<option value="idle">idle</option>
								<option value="in-progress">in-progress</option>
								<option value="complete">complete</option>
							</select>
						</div>
						{markdownFullSyncPhase === 'in-progress' && (
							<div>
								<div className="flex justify-between text-neutral-400">
									<span>Files Synced</span>
									<span>{markdownCompletedFiles} / {markdownTotalFiles}</span>
								</div>
								<IonRange
									min={0}
									max={markdownTotalFiles}
									step={1}
									value={markdownCompletedFiles}
									onIonChange={(e) => setMarkdownCompletedFiles(e.detail.value as number)}
								/>
							</div>
						)}
						<div className="flex items-center justify-between">
							<span>Simulate Markdown Error</span>
							<IonToggle
								checked={markdownHasError}
								onIonChange={(e) => setMarkdownHasError(e.detail.checked)}
							/>
						</div>
					</div>
				</>
			)}

			{/* Starship & Trajectory Knobs */}
			{activeComponent === 'starship-trajectory' && (
				<>
					<div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
						<h4 className="font-semibold text-neutral-300">Flight Telemetry Controls</h4>

						<div>
							<div className="flex justify-between text-neutral-400 mb-1">
								<span>Trajectory Position</span>
								<span className="font-mono text-cyan-400">{starshipPosition}px</span>
							</div>
							<IonRange
								min={0}
								max={280}
								step={5}
								value={starshipPosition}
								onIonChange={(e) => setStarshipPosition(e.detail.value as number)}
							/>
						</div>

						<div>
							<span className="block mb-1 text-neutral-400">Flight Orientation</span>
							<div className="grid grid-cols-2 gap-2">
								<button
									onClick={() => setStarshipOrientation('vertical')}
									className={`rounded p-1.5 text-xs font-medium transition ${
										starshipOrientation === 'vertical'
											? 'bg-blue-600 text-white'
											: 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
									}`}
								>
									Vertical Corridor
								</button>
								<button
									onClick={() => setStarshipOrientation('horizontal')}
									className={`rounded p-1.5 text-xs font-medium transition ${
										starshipOrientation === 'horizontal'
											? 'bg-blue-600 text-white'
											: 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
									}`}
								>
									Horizontal Corridor
								</button>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<div>
								<span className="block font-medium">Warp Drive Mode</span>
								<span className="text-[11px] text-neutral-400">
									{mode === 'hype' ? '⚡ Hype (Red Warp)' : '🌌 Chill (Cosmic Cyan)'}
								</span>
							</div>
							<IonToggle
								checked={mode === 'hype'}
								onIonChange={(e) => setMode(e.detail.checked ? 'hype' : 'chill')}
							/>
						</div>

						<div>
							<span className="block mb-1 text-neutral-400">Sprite Rotation Angle</span>
							<div className="grid grid-cols-4 gap-1.5">
								{[0, 90, 180, 270].map((deg) => (
									<button
										key={deg}
										onClick={() => setStarshipRotation(deg)}
										className={`rounded py-1 text-xs font-mono transition ${
											starshipRotation === deg
												? 'bg-blue-600 text-white'
												: 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
										}`}
									>
										{deg}°
									</button>
								))}
							</div>
						</div>
					</div>
				</>
			)}

			{/* Pulse Graph Knobs */}
			{activeComponent === 'pulse-graph' && (
				<>
					<div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
						<h4 className="font-semibold text-neutral-300">Fibonacci Star Points Tier</h4>
						<div className="grid grid-cols-3 gap-1.5">
							{[1, 2, 3, 5, 8, 13].map((pt) => {
								const scale = starScale[pt as keyof typeof starScale]
								return (
									<button
										key={pt}
										onClick={() => setPulseStarPoints(pt)}
										className={`flex flex-col items-center rounded border p-2 transition ${
											pulseStarPoints === pt
												? 'border-blue-500 bg-blue-500/10 font-bold'
												: 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
										}`}
									>
										<span className={scale.textColor}>{pt}★</span>
										<span className="text-[10px] text-neutral-500 capitalize">{scale.ionicColor}</span>
									</button>
								)
							})}
						</div>

						<div>
							<span className="block mb-1 text-neutral-400">Streak Pattern</span>
							<select
								value={pulsePreset}
								onChange={(e) => setPulsePreset(e.target.value as any)}
								className="w-full rounded border border-neutral-700 bg-neutral-900 p-1.5 text-xs text-white"
							>
								<option value="streak">Daily Consistent (2 visits/day)</option>
								<option value="recent">Recent Surge (Past 4 days)</option>
								<option value="sporadic">Sporadic (Every other day)</option>
								<option value="empty">Inactive (0 visits)</option>
							</select>
						</div>
					</div>
				</>
			)}

			{/* Mood Player Knobs */}
			{activeComponent === 'mood-player' && (
				<>
					<div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
						<h4 className="font-semibold text-neutral-300">Soundtrack Controls</h4>
						<div className="flex items-center justify-between">
							<div>
								<span className="block font-medium">Active Atmosphere</span>
								<span className="text-[11px] text-neutral-400 capitalize">Mode: {mode}</span>
							</div>
							<IonToggle
								checked={mode === 'hype'}
								onIonChange={(e) => setMode(e.detail.checked ? 'hype' : 'chill')}
							/>
						</div>

						<div className="rounded border border-neutral-800 bg-neutral-900/80 p-2 text-[11px] text-neutral-400 space-y-1">
							<p className="font-semibold text-neutral-300">Keyboard Triggers:</p>
							<p>• Press <kbd className="font-mono text-neutral-200">Z</kbd> for Chill Mode</p>
							<p>• Press <kbd className="font-mono text-neutral-200">X</kbd> for Hype Mode</p>
							<p>• Press <kbd className="font-mono text-neutral-200">Space</kbd> to Play / Pause</p>
						</div>
					</div>
				</>
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
		<IonPage id="main-content">
			<Header
				title="Workbench"
				backHref="/dev/components"
				hideActions
			/>

			<IonContent className="bg-neutral-950 text-neutral-100">
				{/* Subtitle / Breadcrumbs & Mobile Component Selector */}
				<div className="shrink-0 flex flex-wrap items-center justify-between border-b border-neutral-800 bg-neutral-900/90 px-4 py-2.5">
					<div className="flex items-center gap-2">
						<span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
							StarFocus Component Workbench
						</span>
						<IonBadge color="secondary" className="hidden sm:inline-block text-[10px]">
							Interactive Stage
						</IonBadge>
					</div>
					<div className="lg:hidden">
						<select
							value={activeComponent}
							onChange={(e) => selectComponent(e.target.value as ComponentKey)}
							className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
							data-testid="mobile-component-select"
						>
							<option value="sync-status">Sync Status (Unified)</option>
							<option value="cloud-sync">Cloud Sync Details</option>
							<option value="markdown-sync">Markdown Sync Details</option>
							<option value="star-roles">Star Role Icons</option>
							<option value="star-points">Star Points</option>
							<option value="starship-trajectory">Starship & Trajectory</option>
							<option value="pulse-graph">Activity Pulse Graph</option>
							<option value="mood-player">Mood Soundtrack Player</option>
						</select>
					</div>
				</div>

				<div className="flex min-h-full flex-col lg:flex-row">
					{/* Desktop Navigation Sidebar */}
					<div className="hidden w-64 shrink-0 border-r border-neutral-800 bg-neutral-900/60 p-4 lg:block lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">
						<h2 className="mb-3 text-xs font-bold tracking-wider text-neutral-400 uppercase">
							Components
						</h2>
						<nav className="flex flex-col gap-1">
							<button
								onClick={() => selectComponent('sync-status')}
								className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
									activeComponent === 'sync-status'
										? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
										: 'text-neutral-300 hover:bg-neutral-800'
								}`}
							>
								<IonIcon icon={syncSharp} />
								<span>Sync Status (Unified)</span>
							</button>

							<button
								onClick={() => selectComponent('cloud-sync')}
								className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
									activeComponent === 'cloud-sync'
										? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
										: 'text-neutral-300 hover:bg-neutral-800'
								}`}
							>
								<IonIcon icon={cloudDoneSharp} />
								<span>Cloud Sync Details</span>
							</button>

							<button
								onClick={() => selectComponent('markdown-sync')}
								className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
									activeComponent === 'markdown-sync'
										? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
										: 'text-neutral-300 hover:bg-neutral-800'
								}`}
							>
								<IonIcon icon={documentTextSharp} />
								<span>Markdown Sync Details</span>
							</button>

							<button
								onClick={() => selectComponent('star-roles')}
								className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
									activeComponent === 'star-roles'
										? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
										: 'text-neutral-300 hover:bg-neutral-800'
								}`}
							>
								<IonIcon icon={starSharp} />
								<span>Star Role Icons</span>
							</button>

							<button
								onClick={() => selectComponent('star-points')}
								className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
									activeComponent === 'star-points'
										? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
										: 'text-neutral-300 hover:bg-neutral-800'
								}`}
							>
								<IonIcon icon={sparklesSharp} />
								<span>Star Points</span>
							</button>

							<button
								onClick={() => selectComponent('starship-trajectory')}
								className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
									activeComponent === 'starship-trajectory'
										? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
										: 'text-neutral-300 hover:bg-neutral-800'
								}`}
							>
								<IonIcon icon={rocketSharp} />
								<span>Starship & Trajectory</span>
							</button>

							<button
								onClick={() => selectComponent('pulse-graph')}
								className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
									activeComponent === 'pulse-graph'
										? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
										: 'text-neutral-300 hover:bg-neutral-800'
								}`}
							>
								<IonIcon icon={pulseSharp} />
								<span>Activity Pulse Graph</span>
							</button>

							<button
								onClick={() => selectComponent('mood-player')}
								className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
									activeComponent === 'mood-player'
										? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
										: 'text-neutral-300 hover:bg-neutral-800'
								}`}
							>
								<IonIcon icon={musicalNotesSharp} />
								<span>Mood Soundtrack Player</span>
							</button>
						</nav>
					</div>

					{/* Main Interactive Stage Column */}
					<div className="flex-1 min-w-0">
						{presetsBar}
						<div className="p-4 pb-28 lg:p-6 lg:pb-12">
							{activeComponent === 'sync-status' && (
							<div className="space-y-6">
								<div>
									<h1 className="text-2xl font-bold tracking-tight text-white">
										Unified Sync Status Popover
									</h1>
									<p className="text-sm text-neutral-400">
										Consolidates Dexie Cloud database replication and local Markdown folder export into an interactive popover.
									</p>
								</div>

								{/* Toolbar Simulation */}
								<IonCard className="m-0 border border-neutral-800 bg-neutral-900">
									<IonCardHeader>
										<IonCardTitle className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
											In-Header Appearance (Interactive Popover)
										</IonCardTitle>
									</IonCardHeader>
									<IonCardContent>
										<div className="rounded-lg border border-neutral-700 bg-neutral-950 p-3">
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
										<p className="mt-2 text-xs text-neutral-500">
											👉 Click the sync icon button above to trigger the live popover with simulated state.
										</p>
									</IonCardContent>
								</IonCard>

								{/* Inline Full View */}
								<IonCard className="m-0 border border-neutral-800 bg-neutral-900">
									<IonCardHeader>
										<IonCardTitle className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
											Always-Expanded View (Direct Inspection)
										</IonCardTitle>
									</IonCardHeader>
									<IonCardContent>
										<div className="max-w-md overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 shadow-lg">
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
									</IonCardContent>
								</IonCard>
							</div>
						)}

						{activeComponent === 'cloud-sync' && (
							<div className="space-y-6">
								<div>
									<h1 className="text-2xl font-bold tracking-tight text-white">
										Cloud Sync Details & Status
									</h1>
									<p className="text-sm text-neutral-400">
										Detailed replication metrics and current sync indicators for Dexie Cloud.
									</p>
								</div>

								<div className="grid gap-6 md:grid-cols-2">
									<IonCard className="m-0 border border-neutral-800 bg-neutral-900">
										<IonCardHeader>
											<IonCardTitle className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
												Status Icon
											</IonCardTitle>
										</IonCardHeader>
										<IonCardContent className="flex items-center gap-3">
											<span className="text-sm text-neutral-300">Current Icon:</span>
											<div className="rounded border border-neutral-700 bg-neutral-800 p-2 text-2xl">
												<CloudSyncStatus
													user={simulatedUser}
													syncState={simulatedSyncState}
												/>
											</div>
										</IonCardContent>
									</IonCard>

									<IonCard className="m-0 border border-neutral-800 bg-neutral-900">
										<IonCardHeader>
											<IonCardTitle className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
												Full Details Pane
											</IonCardTitle>
										</IonCardHeader>
										<IonCardContent>
											<div className="rounded border border-neutral-800 bg-neutral-950 p-2">
												<CloudSyncDetails
													user={simulatedUser}
													syncState={simulatedSyncState}
													onLogout={() => setCloudLoggedIn(false)}
												/>
											</div>
										</IonCardContent>
									</IonCard>
								</div>
							</div>
						)}

						{activeComponent === 'markdown-sync' && (
							<div className="space-y-6">
								<div>
									<h1 className="text-2xl font-bold tracking-tight text-white">
										Markdown Local Sync Details & Status
									</h1>
									<p className="text-sm text-neutral-400">
										Direct filesystem export status, file counters, and full sync controls.
									</p>
								</div>

								<div className="grid gap-6 md:grid-cols-2">
									<IonCard className="m-0 border border-neutral-800 bg-neutral-900">
										<IonCardHeader>
											<IonCardTitle className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
												Status Icon
											</IonCardTitle>
										</IonCardHeader>
										<IonCardContent className="flex items-center gap-3">
											<span className="text-sm text-neutral-300">Current Icon:</span>
											<div className="rounded border border-neutral-700 bg-neutral-800 p-2 text-2xl">
												<MarkdownSyncStatus exportStatus={simulatedExportStatus} />
											</div>
										</IonCardContent>
									</IonCard>

									<IonCard className="m-0 border border-neutral-800 bg-neutral-900">
										<IonCardHeader>
											<IonCardTitle className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
												Full Details Pane
											</IonCardTitle>
										</IonCardHeader>
										<IonCardContent>
											<div className="rounded border border-neutral-800 bg-neutral-950 p-2">
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
										</IonCardContent>
									</IonCard>
								</div>
							</div>
						)}

						{activeComponent === 'star-roles' && (
							<div className="space-y-6">
								<div>
									<h1 className="text-2xl font-bold tracking-tight text-white">
										Star Role Icons
									</h1>
									<p className="text-sm text-neutral-400">
										Category and role badge visualizers.
									</p>
								</div>

								<IonCard className="m-0 border border-neutral-800 bg-neutral-900">
									<IonCardContent className="flex flex-wrap items-center gap-6 p-6">
										<div className="flex flex-col items-center gap-2">
											<StarRoleIcon
												starRole={{
													id: '1',
													title: 'Selected',
													icon: { type: 'ionicon', name: selectedIcon },
												}}
												style={{ color: selectedColor, fontSize: '28px' }}
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
												style={{ color: '#3b82f6', fontSize: '28px' }}
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
												style={{ color: '#ec4899', fontSize: '28px' }}
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
												style={{ color: '#10b981', fontSize: '28px' }}
											/>
											<span className="text-xs text-neutral-400">Energy</span>
										</div>
									</IonCardContent>
								</IonCard>
							</div>
						)}

						{activeComponent === 'star-points' && (
							<div className="space-y-6">
								<div>
									<h1 className="text-2xl font-bold tracking-tight text-white">
										Star Points
									</h1>
									<p className="text-sm text-neutral-400">
										Experience and progression score badge.
									</p>
								</div>

								<IonCard className="m-0 border border-neutral-800 bg-neutral-900">
									<IonCardContent className="p-6">
										<StarPoints />
									</IonCardContent>
								</IonCard>
							</div>
						)}

						{/* Starship & Trajectory Stage */}
						{activeComponent === 'starship-trajectory' && (
							<div className="space-y-6">
								<div>
									<h1 className="text-2xl font-bold tracking-tight text-white">
										Starship & Trajectory Animation
									</h1>
									<p className="text-sm text-neutral-400">
										Cosmic flight corridor visualizer and spacecraft position tracker with mood-reactive warp gradients.
									</p>
								</div>

								<div className="grid gap-6 md:grid-cols-2">
									{/* Flight Corridor Viewport */}
									<IonCard className="m-0 border border-neutral-800 bg-neutral-900">
										<IonCardHeader>
											<div className="flex items-center justify-between">
												<IonCardTitle className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
													Flight Corridor ({starshipOrientation})
												</IonCardTitle>
												<IonBadge color={mode === 'hype' ? 'danger' : 'primary'}>
													{mode.toUpperCase()} WARP
												</IonBadge>
											</div>
										</IonCardHeader>
										<IonCardContent>
											<div className="relative h-[360px] w-full rounded-xl border border-neutral-800 bg-neutral-950 p-4 flex items-center justify-center overflow-hidden">
												{/* Background Starfield Pattern */}
												<div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

												{starshipOrientation === 'vertical' ? (
													<div className="relative h-[300px] w-[60px] flex justify-center">
														<Tracjectory
															className="absolute left-1/2 -translate-x-1/2"
															currentPosition={starshipPosition}
															orientation="vertical"
														/>
														<div
															id="workbench-starship"
															className="absolute left-1/2 -translate-x-1/2 transition-transform duration-300 ease-out w-[56px] h-[56px]"
															style={{
																transform: `translate(-50%, ${starshipPosition}px) rotate(${starshipRotation}deg)`,
															}}
														>
															<Starship />
														</div>
													</div>
												) : (
													<div className="relative w-[300px] h-[60px] flex items-center">
														<Tracjectory
															className="absolute top-1/2 -translate-y-1/2"
															currentPosition={starshipPosition}
															orientation="horizontal"
														/>
														<div
															id="workbench-starship"
															className="absolute top-1/2 -translate-y-1/2 transition-transform duration-300 ease-out w-[56px] h-[56px]"
															style={{
																transform: `translate(${starshipPosition}px, -50%) rotate(${starshipRotation}deg)`,
															}}
														>
															<Starship />
														</div>
													</div>
												)}
											</div>
											<div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
												<span>Position: <strong className="text-white">{starshipPosition}px</strong></span>
												<span>Heading: <strong className="text-white">{starshipRotation}°</strong></span>
												<span>Mode: <strong className={mode === 'hype' ? 'text-rose-400' : 'text-cyan-400'}>{mode}</strong></span>
											</div>
										</IonCardContent>
									</IonCard>

									{/* Telemetry & Context */}
									<IonCard className="m-0 border border-neutral-800 bg-neutral-900">
										<IonCardHeader>
											<IonCardTitle className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
												Navigational Telemetry & State
											</IonCardTitle>
										</IonCardHeader>
										<IonCardContent className="space-y-4">
											<div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 space-y-2">
												<div className="flex justify-between text-xs">
													<span className="text-neutral-400">Warp Drive Status:</span>
													<span className={mode === 'hype' ? 'text-red-400 font-bold' : 'text-cyan-400 font-bold'}>
														{mode === 'hype' ? '⚡ HYPE (Overclocked)' : '🌌 CHILL (Cruising)'}
													</span>
												</div>
												<div className="flex justify-between text-xs">
													<span className="text-neutral-400">Corridor Orientation:</span>
													<span className="text-white capitalize">{starshipOrientation}</span>
												</div>
												<div className="flex justify-between text-xs">
													<span className="text-neutral-400">Waypoint Coordinate:</span>
													<span className="font-mono text-cyan-400">{starshipPosition}px</span>
												</div>
												<div className="flex justify-between text-xs">
													<span className="text-neutral-400">Sprite Heading:</span>
													<span className="font-mono text-white">{starshipRotation}°</span>
												</div>
											</div>

											<div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-400">
												<p className="font-semibold text-neutral-300 mb-1">🎮 Flight Controls in Production:</p>
												<p>
													In the real app, <code className="text-cyan-400">Journey.tsx</code> dynamically calculates <code className="text-cyan-400">starshipY</code> using a bounding box ref over the active Todo Wayfinder item. Here in the workbench, use the slider to test beam stretch, coordinate clipping, and gradient shading.
												</p>
											</div>
										</IonCardContent>
									</IonCard>
								</div>
							</div>
						)}

						{/* Pulse Graph Stage */}
						{activeComponent === 'pulse-graph' && (
							<div className="space-y-6">
								<div>
									<h1 className="text-2xl font-bold tracking-tight text-white">
										Activity Pulse Graph
									</h1>
									<p className="text-sm text-neutral-400">
										Compact 14-day engagement sparkline indicating visit frequency and task momentum with Fibonacci star point color tiers.
									</p>
								</div>

								<div className="grid gap-6 md:grid-cols-2">
									{/* Pulse Sparkline Preview */}
									<IonCard className="m-0 border border-neutral-800 bg-neutral-900">
										<IonCardHeader>
											<div className="flex items-center justify-between">
												<IonCardTitle className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
													Pulse Sparkline (Native Scale)
												</IonCardTitle>
												<IonBadge color={starScale[pulseStarPoints as keyof typeof starScale]?.ionicColor || 'primary'}>
													Tier {pulseStarPoints}
												</IonBadge>
											</div>
										</IonCardHeader>
										<IonCardContent className="space-y-4">
											<div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 flex flex-col items-center justify-center">
												<span className="text-xs text-neutral-500 mb-2 font-mono uppercase tracking-wider">14-Day Activity Pulse</span>
												<div id="workbench-pulse-graph" className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
													<PulseGraph starPoints={pulseStarPoints} visits={simulatedVisits} />
												</div>
												<div className="mt-4 flex items-center gap-4 text-xs text-neutral-400">
													<span className="flex items-center gap-1.5">
														<span className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-600" />
														0 Visits (Dot)
													</span>
													<span className="flex items-center gap-1.5">
														<span className="inline-block h-2 w-1 rounded-full bg-neutral-400" />
														1 Visit (Mid)
													</span>
													<span className="flex items-center gap-1.5">
														<span className="inline-block h-4 w-1 rounded-full bg-white" />
														2+ Visits (Full)
													</span>
												</div>
											</div>

											{/* Simulated Todo Item Header Context */}
											<div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
												<span className="text-xs font-semibold text-neutral-400 block mb-2">In-App Context (Todo Item Header)</span>
												<div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-3">
													<div className="flex items-center gap-2.5">
														<div className="h-4 w-4 rounded-full border border-neutral-600" />
														<div>
															<span className="text-sm font-medium text-white">Review Orbital Mechanics Specs</span>
															<span className="block text-xs text-neutral-500">Wayfinder • Priority Task</span>
														</div>
													</div>
													<PulseGraph starPoints={pulseStarPoints} visits={simulatedVisits} />
												</div>
											</div>
										</IonCardContent>
									</IonCard>

									{/* Color Mapping & Metrics */}
									<IonCard className="m-0 border border-neutral-800 bg-neutral-900">
										<IonCardHeader>
											<IonCardTitle className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
												Fibonacci Color Mapping & Metrics
											</IonCardTitle>
										</IonCardHeader>
										<IonCardContent className="space-y-4">
											<div className="grid grid-cols-3 gap-2">
												{[1, 2, 3, 5, 8, 13].map((pt) => {
													const scale = starScale[pt as keyof typeof starScale]
													const isSelected = pulseStarPoints === pt
													return (
														<button
															key={pt}
															onClick={() => setPulseStarPoints(pt)}
															className={`flex flex-col items-center rounded-lg border p-2.5 transition text-xs ${
																isSelected
																	? 'border-blue-500 bg-blue-500/10 text-white font-bold'
																	: 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
															}`}
														>
															<span className={`text-base font-bold ${scale.textColor}`}>{pt}★</span>
															<span className="text-[10px] text-neutral-500 capitalize">{scale.ionicColor}</span>
														</button>
													)
												})}
											</div>

											<div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-xs space-y-2">
												<div className="flex justify-between">
													<span className="text-neutral-400">Active Preset:</span>
													<span className="font-semibold text-white capitalize">{pulsePreset}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-neutral-400">Total Visits (14d):</span>
													<span className="font-mono text-cyan-400 font-bold">{simulatedVisits.length}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-neutral-400">Tailwind Color:</span>
													<span className="font-mono text-neutral-300">{starScale[pulseStarPoints as keyof typeof starScale]?.tailwindBgColors}</span>
												</div>
											</div>
										</IonCardContent>
									</IonCard>
								</div>
							</div>
						)}

						{/* Mood Player Stage */}
						{activeComponent === 'mood-player' && (
							<div className="space-y-6">
								<div>
									<h1 className="text-2xl font-bold tracking-tight text-white">
										Mood Soundtrack Player
									</h1>
									<p className="text-sm text-neutral-400">
										Ambient soundtrack audio controller with Chill (Melodysheep) and Hype (Karl Casey) audio streams and keyboard shortcuts.
									</p>
								</div>

								<div className="grid gap-6 md:grid-cols-2">
									{/* Player Widget */}
									<IonCard className="m-0 border border-neutral-800 bg-neutral-900">
										<IonCardHeader>
											<div className="flex items-center justify-between">
												<IonCardTitle className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
													Player Widget
												</IonCardTitle>
												<IonBadge color={mode === 'hype' ? 'danger' : 'primary'}>
													{mode.toUpperCase()} ACTIVE
												</IonBadge>
											</div>
										</IonCardHeader>
										<IonCardContent className="space-y-4">
											<div className="rounded-xl border border-neutral-800 bg-neutral-950 p-8 flex flex-col items-center justify-center">
												<div id="workbench-mood-player">
													<Mood />
												</div>
												<p className="mt-4 text-xs text-neutral-400 text-center">
													Click play to stream audio or toggle between Chill and Hype modes.
												</p>
											</div>

											<div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
												<span className="text-xs font-semibold text-neutral-400 block mb-2">⌨️ Global Keyboard Shortcuts</span>
												<div className="grid grid-cols-3 gap-2 text-center text-xs">
													<div className="rounded border border-neutral-800 bg-neutral-900 p-2">
														<kbd className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-neutral-200">Z</kbd>
														<span className="block mt-1 text-[11px] text-neutral-400">Chill Mode</span>
													</div>
													<div className="rounded border border-neutral-800 bg-neutral-900 p-2">
														<kbd className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-neutral-200">X</kbd>
														<span className="block mt-1 text-[11px] text-neutral-400">Hype Mode</span>
													</div>
													<div className="rounded border border-neutral-800 bg-neutral-900 p-2">
														<kbd className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-neutral-200">Space</kbd>
														<span className="block mt-1 text-[11px] text-neutral-400">Play / Pause</span>
													</div>
												</div>
											</div>
										</IonCardContent>
									</IonCard>

									{/* Soundtrack Playlist Inspector */}
									<IonCard className="m-0 border border-neutral-800 bg-neutral-900">
										<IonCardHeader>
											<IonCardTitle className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
												Soundtrack Playlist ({mode === 'chill' ? 'Melodysheep Ambient' : 'Karl Casey Synthwave'})
											</IonCardTitle>
										</IonCardHeader>
										<IonCardContent className="space-y-3">
											<div className="space-y-1.5">
												{(mode === 'chill'
													? [
															'Melodysheep - Water Worlds.mp3',
															'Melodysheep - Sights of Space 1.mp3',
															'Melodysheep - Sights of Space 2.mp3',
															'Melodysheep - Sights of Space 3.mp3',
															'Melodysheep - Sights of Space 4.mp3',
															'Melodysheep - Sights of Space 5.mp3',
															'Melodysheep - Sights of Space 6.mp3',
													  ]
													: [
															'Karl Casey - Black Lotus.mp3',
															'Karl Casey - Lucid Dream.mp3',
															'Karl Casey - Radiation Sickness.mp3',
															'Karl Casey - Replicant Hunter.mp3',
													  ]
												).map((track, i) => (
													<div
														key={track}
														className="flex items-center justify-between rounded-md border border-neutral-800/80 bg-neutral-950 p-2 text-xs text-neutral-300"
													>
														<span className="flex items-center gap-2">
															<span className="font-mono text-neutral-500">{i + 1}</span>
															<span>{track}</span>
														</span>
														<IonBadge color={mode === 'hype' ? 'danger' : 'primary'} className="text-[10px]">
															{mode}
														</IonBadge>
													</div>
												))}
											</div>
										</IonCardContent>
									</IonCard>
								</div>
							</div>
						)}
					</div>
				</div>

					{/* Desktop State Controls & Knobs Panel */}
					<div className="hidden w-96 shrink-0 border-l border-neutral-800 bg-neutral-900/80 p-4 lg:block lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">
						<div className="mb-4 flex items-center justify-between">
							<h3 className="flex items-center gap-2 text-sm font-semibold text-white">
								<IonIcon icon={optionsSharp} />
								State Simulator & Knobs
							</h3>
						</div>
						{knobsContent}
					</div>
				</div>
		</IonContent>

			{/* Mobile Bottom Footer Bar (Safe Areas Handled by Ionic) */}
			<IonFooter className="lg:hidden border-t border-neutral-800 bg-neutral-950">
				<IonToolbar color="dark" className="ion-no-border px-2">
					<div className="px-3 py-1.5">
						<IonButton
							expand="block"
							fill="solid"
							color="primary"
							size="default"
							onClick={() => setMobileKnobsOpen(true)}
							id="mobile-knobs-toggle-btn"
							data-testid="mobile-knobs-toggle-btn"
							className="font-semibold text-xs"
						>
							<IonIcon slot="start" icon={optionsSharp} />
							Fine-Grained Knobs & Simulator Controls
						</IonButton>
					</div>
				</IonToolbar>
			</IonFooter>

			{/* Knobs Sheet Modal for Mobile (Native Safe Areas & Drag to Dismiss) */}
			<IonModal
				isOpen={mobileKnobsOpen}
				onDidDismiss={() => setMobileKnobsOpen(false)}
				initialBreakpoint={0.75}
				breakpoints={[0, 0.4, 0.75, 1]}
				handle={true}
				id="mobile-knobs-drawer"
			>
				<IonHeader>
					<IonToolbar color="dark">
						<IonTitle size="small">State Simulator & Knobs</IonTitle>
						<IonButtons slot="end">
							<IonButton
								onClick={() => setMobileKnobsOpen(false)}
								className="font-semibold text-blue-400"
							>
								Done
							</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding bg-neutral-900 text-neutral-100">
					<div className="pb-10">
						{knobsContent}
					</div>
				</IonContent>
			</IonModal>
		</IonPage>
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
