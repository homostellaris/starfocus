'use client'

import React, { useState } from 'react'
import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonPage,
	IonTitle,
	IonToolbar,
	IonCard,
	IonCardHeader,
	IonCardTitle,
	IonCardContent,
	IonBadge,
	IonRange,
	IonToggle,
} from '@ionic/react'
import {
	arrowBackSharp,
	syncSharp,
	cloudDoneSharp,
	documentTextSharp,
	starSharp,
	sparklesSharp,
	optionsSharp,
} from 'ionicons/icons'
import SyncStatus from '../common/SyncStatus'
import CloudSyncDetails from '../db/cloud/CloudSyncDetails'
import CloudSyncStatus from '../db/cloud/CloudSyncStatus'
import MarkdownSyncDetails from '../export/MarkdownSyncDetails'
import MarkdownSyncStatus from '../export/MarkdownSyncStatus'
import { StarRoleIcon } from '../common/StarRoleIcon'
import StarPoints from '../common/StarPoints'
import type { ExportStatus } from '../export/useMarkdownExport'

type ComponentKey =
	| 'sync-status'
	| 'cloud-sync'
	| 'markdown-sync'
	| 'star-roles'
	| 'star-points'

export default function Workbench() {
	const [activeComponent, setActiveComponent] = useState<ComponentKey>('sync-status')
	const [mobileKnobsOpen, setMobileKnobsOpen] = useState(false)

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

	// Construct simulated states
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

	// Presets
	const applyPreset = (preset: 'synced' | 'cloud-pushing' | 'markdown-syncing' | 'cloud-error' | 'markdown-error' | 'logged-out') => {
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
		}
	}

	const knobsContent = (
		<div className="space-y-5">
			{/* Quick Presets */}
			<div>
				<span className="mb-2 block text-xs font-medium text-neutral-400">Quick Presets</span>
				<div className="grid grid-cols-2 gap-2 text-xs">
					<button
						onClick={() => applyPreset('synced')}
						className="rounded border border-emerald-800/40 bg-emerald-950/40 p-2 text-left text-emerald-300 hover:bg-emerald-900/50 transition active:scale-95"
					>
						🟢 All Synced
					</button>
					<button
						onClick={() => applyPreset('cloud-pushing')}
						className="rounded border border-blue-800/40 bg-blue-950/40 p-2 text-left text-blue-300 hover:bg-blue-900/50 transition active:scale-95"
					>
						🔵 Cloud Uploading
					</button>
					<button
						onClick={() => applyPreset('markdown-syncing')}
						className="rounded border border-purple-800/40 bg-purple-950/40 p-2 text-left text-purple-300 hover:bg-purple-900/50 transition active:scale-95"
					>
						🟣 Full Markdown Sync
					</button>
					<button
						onClick={() => applyPreset('cloud-error')}
						className="rounded border border-red-800/40 bg-red-950/40 p-2 text-left text-red-300 hover:bg-red-900/50 transition active:scale-95"
					>
						🔴 Cloud Error
					</button>
					<button
						onClick={() => applyPreset('markdown-error')}
						className="rounded border border-amber-800/40 bg-amber-950/40 p-2 text-left text-amber-300 hover:bg-amber-900/50 transition active:scale-95"
					>
						🟡 Reconnect Needed
					</button>
					<button
						onClick={() => applyPreset('logged-out')}
						className="rounded border border-neutral-700 bg-neutral-800 p-2 text-left text-neutral-300 hover:bg-neutral-700 transition active:scale-95"
					>
						⚪ Signed Out
					</button>
				</div>
			</div>

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
		</div>
	)

	return (

		<IonPage>
			<IonHeader>
				<IonToolbar color="dark">
					<IonButtons slot="start">
						<IonButton href="/home">
							<IonIcon
								icon={arrowBackSharp}
								slot="start"
							/>
							Back to App
						</IonButton>
					</IonButtons>
					<IonTitle className="font-display [font-palette:--redshift] text-xl">
						StarFocus Component Workbench
					</IonTitle>
					<IonButtons slot="end">
						<IonBadge color="secondary" className="mr-2">Preview Mode</IonBadge>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="bg-neutral-950 text-neutral-100">
				{/* Mobile Component Selector Bar */}
				<div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/90 px-4 py-2.5 lg:hidden">
					<span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Component</span>
					<select
						value={activeComponent}
						onChange={(e) => setActiveComponent(e.target.value as ComponentKey)}
						className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
						data-testid="mobile-component-select"
					>
						<option value="sync-status">Sync Status (Unified)</option>
						<option value="cloud-sync">Cloud Sync Details</option>
						<option value="markdown-sync">Markdown Sync Details</option>
						<option value="star-roles">Star Role Icons</option>
						<option value="star-points">Star Points</option>
					</select>
				</div>

				<div className="flex h-full flex-col lg:flex-row">
					{/* Desktop Navigation Sidebar */}
					<div className="hidden w-64 shrink-0 border-r border-neutral-800 bg-neutral-900/60 p-4 lg:block overflow-y-auto">
						<h2 className="mb-3 text-xs font-bold tracking-wider text-neutral-400 uppercase">
							Components
						</h2>
						<nav className="flex flex-col gap-1">
							<button
								onClick={() => setActiveComponent('sync-status')}
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
								onClick={() => setActiveComponent('cloud-sync')}
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
								onClick={() => setActiveComponent('markdown-sync')}
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
								onClick={() => setActiveComponent('star-roles')}
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
								onClick={() => setActiveComponent('star-points')}
								className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
									activeComponent === 'star-points'
										? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
										: 'text-neutral-300 hover:bg-neutral-800'
								}`}
							>
								<IonIcon icon={sparklesSharp} />
								<span>Star Points</span>
							</button>
						</nav>
					</div>

					{/* Main Interactive Stage */}
					<div className="flex-1 overflow-y-auto p-4 pb-28 lg:p-6 lg:pb-6">
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
										<div className="max-w-md rounded-lg border border-neutral-800 bg-neutral-950 p-2 shadow-lg">
											<SyncStatus
												inline={true}
												syncState={simulatedSyncState}
												exportStatus={simulatedExportStatus}
												user={simulatedUser}
												onRunFullSync={() => {
													setMarkdownFullSyncPhase('in-progress')
													setMarkdownCompletedFiles(1)
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
					</div>

					{/* Desktop State Controls & Knobs Panel */}
					<div className="hidden w-96 shrink-0 border-l border-neutral-800 bg-neutral-900/80 p-4 lg:block overflow-y-auto">
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

			{/* Mobile Sticky Bottom Bar (Quick Presets + Knobs Toggle) */}
			<div className="fixed bottom-0 inset-x-0 z-30 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur pl-14 pr-3 py-2 lg:hidden">
				<div className="flex items-center gap-2">
					<div className="flex flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
						<button
							onClick={() => applyPreset('synced')}
							className="shrink-0 rounded-full border border-emerald-800/60 bg-emerald-950/80 px-2.5 py-1 text-[11px] font-medium text-emerald-300 active:scale-95"
						>
							🟢 Synced
						</button>
						<button
							onClick={() => applyPreset('cloud-pushing')}
							className="shrink-0 rounded-full border border-blue-800/60 bg-blue-950/80 px-2.5 py-1 text-[11px] font-medium text-blue-300 active:scale-95"
						>
							🔵 Uploading
						</button>
						<button
							onClick={() => applyPreset('markdown-syncing')}
							className="shrink-0 rounded-full border border-purple-800/60 bg-purple-950/80 px-2.5 py-1 text-[11px] font-medium text-purple-300 active:scale-95"
						>
							🟣 MD Sync
						</button>
						<button
							onClick={() => applyPreset('cloud-error')}
							className="shrink-0 rounded-full border border-red-800/60 bg-red-950/80 px-2.5 py-1 text-[11px] font-medium text-red-300 active:scale-95"
						>
							🔴 Error
						</button>
						<button
							onClick={() => applyPreset('markdown-error')}
							className="shrink-0 rounded-full border border-amber-800/60 bg-amber-950/80 px-2.5 py-1 text-[11px] font-medium text-amber-300 active:scale-95"
						>
							🟡 Reconnect
						</button>
						<button
							onClick={() => applyPreset('logged-out')}
							className="shrink-0 rounded-full border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-[11px] font-medium text-neutral-300 active:scale-95"
						>
							⚪ Out
						</button>
					</div>
					<button
						onClick={() => setMobileKnobsOpen(!mobileKnobsOpen)}
						id="mobile-knobs-toggle-btn"
						className={`shrink-0 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
							mobileKnobsOpen
								? 'bg-blue-600 text-white'
								: 'bg-neutral-800 text-neutral-200 border border-neutral-700 hover:bg-neutral-700'
						}`}
					>
						<IonIcon icon={optionsSharp} />
						<span>Knobs</span>
					</button>
				</div>
			</div>

			{/* Mobile Knobs Bottom Sheet Drawer */}
			{mobileKnobsOpen && (
				<>
					<div
						className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
						onClick={() => setMobileKnobsOpen(false)}
					/>
					<div
						id="mobile-knobs-drawer"
						className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-neutral-700 bg-neutral-900 p-4 pb-12 shadow-2xl lg:hidden"
					>
						<div className="mb-3 flex items-center justify-between border-b border-neutral-800 pb-2">
							<h3 className="flex items-center gap-2 text-sm font-semibold text-white">
								<IonIcon icon={optionsSharp} />
								State Simulator & Knobs
							</h3>
							<button
								onClick={() => setMobileKnobsOpen(false)}
								className="rounded-md bg-neutral-800 px-3 py-1 text-xs font-semibold text-neutral-300 hover:bg-neutral-700"
							>
								Done ✕
							</button>
						</div>
						{knobsContent}
					</div>
				</>
			)}
		</IonPage>

	)
}

