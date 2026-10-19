'use client'

import {
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardSubtitle,
	IonCardTitle,
	IonContent,
	IonIcon,
	IonPage,
	IonBadge,
	IonButton,
} from '@ionic/react'
import {
	arrowForwardSharp,
	cloudDoneSharp,
	documentTextSharp,
	sparklesSharp,
	starSharp,
	syncSharp,
	cubeSharp,
	rocketSharp,
	pulseSharp,
	musicalNotesSharp,
} from 'ionicons/icons'
import { Header } from '../common/Header'

interface ComponentCatalogItem {
	key: string
	title: string
	subtitle: string
	description: string
	icon: any
	iconColor: string
	badge: string
	tags: string[]
}

const CATALOG_ITEMS: ComponentCatalogItem[] = [
	{
		key: 'sync-status',
		title: 'Unified Sync Status Popover',
		subtitle: 'Header Popover & Combined Synchronization',
		description:
			'Consolidates Dexie Cloud database replication and local Markdown folder export into an interactive popover with live phase indicators, sync progress bars, and one-click triggers.',
		icon: syncSharp,
		iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
		badge: 'Core UI',
		tags: ['Popover', 'Dexie Cloud', 'Markdown Export', 'Interactive'],
	},
	{
		key: 'cloud-sync',
		title: 'Cloud Sync Details & Status',
		subtitle: 'Dexie Cloud Database Replication',
		description:
			'Dedicated inspector for Dexie Cloud database sync. Shows active user account email, connection status, replication phase, live progress percentages, and account disconnect controls.',
		icon: cloudDoneSharp,
		iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
		badge: 'Database',
		tags: ['Cloud Sync', 'Authentication', 'Replication', 'Modal View'],
	},
	{
		key: 'markdown-sync',
		title: 'Markdown Sync Details & Status',
		subtitle: 'Local File System Folder Sync',
		description:
			'Detailed inspector for local Markdown backup and folder export. Displays file sync counters (created, updated, deleted), directory permission reconnect states, and full export triggers.',
		icon: documentTextSharp,
		iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
		badge: 'Storage',
		tags: ['File System Access', 'Markdown', 'Local Export', 'Backup'],
	},
	{
		key: 'star-roles',
		title: 'Star Role Icons & Badges',
		subtitle: 'Gamified Role Categories',
		description:
			'Visual representation of user-defined star roles (e.g. Captain, Engineer, Navigator, Botanist) with customized Ionic icon mapping, role groups, and color accents.',
		icon: starSharp,
		iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
		badge: 'Identity',
		tags: ['Star Roles', 'IonIcon', 'Grouping', 'Badges'],
	},
	{
		key: 'star-points',
		title: 'Star Points Progression',
		subtitle: 'Gamified Score & Leveling',
		description:
			'Progression score indicator that displays the user’s accumulated star points. Supports Fibonacci score scaling (1, 2, 3, 5, 8, 13) with cosmic star styling.',
		icon: sparklesSharp,
		iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
		badge: 'Gamification',
		tags: ['Fibonacci Points', 'Progression', 'Header Widget', 'Scores'],
	},
	{
		key: 'starship-trajectory',
		title: 'Starship & Trajectory Animation',
		subtitle: 'Flight Corridor & Spacecraft Navigation',
		description:
			'Cosmic flight path visualizer and spacecraft position tracker. Simulates vertical and horizontal flight corridors with dynamic mood-based warp gradients (chill/hype) and responsive coordinates.',
		icon: rocketSharp,
		iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
		badge: 'Animation',
		tags: ['Space Metaphor', 'CSS Gradients', 'Trajectory', 'Motion'],
	},
	{
		key: 'pulse-graph',
		title: 'Activity Pulse Graph',
		subtitle: 'Task Visit Frequency & Streak Sparkline',
		description:
			'Compact 14-day activity pulse graph displaying task engagement magnitude (0, 1, 2 visits) with color-matched Fibonacci tier star points scaling.',
		icon: pulseSharp,
		iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
		badge: 'Data Viz',
		tags: ['Activity Sparkline', '14-Day History', 'Fibonacci Scale', 'Gamification'],
	},
	{
		key: 'mood-player',
		title: 'Mood Soundtrack Player',
		subtitle: 'Ambient Space Audio & State Switcher',
		description:
			'Cosmic soundtrack audio player and theme mood controller. Toggles between Chill (Melodysheep ambient) and Hype (Karl Casey synthwave) modes with keyboard shortcuts (Z/X/Space).',
		icon: musicalNotesSharp,
		iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
		badge: 'Audio',
		tags: ['Audio Player', 'Ambient Music', 'Chill / Hype', 'Keyboard Shortcuts'],
	},
]

export default function DevComponentsList() {
	return (
		<IonPage id="main-content">
				<Header
					title="Components"
					backHref="/dev"
					hideActions
				/>
				<IonContent fullscreen>
					<div className="mx-auto max-w-4xl px-4 py-8">
						{/* Intro Section */}
						<div className="mb-6">
							<div className="mb-1 flex items-center gap-2">
								<IonIcon icon={cubeSharp} className="text-blue-400" />
								<span className="text-xs font-semibold tracking-wider text-blue-400 uppercase">
									Design System & Catalog
								</span>
							</div>
							<h1 className="text-2xl font-bold tracking-tight text-white">
								Component Catalog
							</h1>
							<p className="mt-1 text-sm text-neutral-400">
								Select a component below to open its dedicated interactive workbench with live state controls, simulation knobs, and viewport testing.
							</p>
						</div>

						{/* Component List */}
						<div className="space-y-4">
							{CATALOG_ITEMS.map((item) => (
								<IonCard
									key={item.key}
									className="m-0 border border-neutral-800 bg-neutral-900/90 transition hover:border-neutral-700"
								>
									<IonCardHeader className="pb-2">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div className="flex items-center gap-3">
												<div
													className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${item.iconColor}`}
												>
													<IonIcon icon={item.icon} className="text-xl" />
												</div>
												<div>
													<IonCardTitle className="text-base font-bold text-white sm:text-lg">
														{item.title}
													</IonCardTitle>
													<IonCardSubtitle className="text-xs text-neutral-400">
														{item.subtitle}
													</IonCardSubtitle>
												</div>
											</div>
											<IonBadge color="primary">{item.badge}</IonBadge>
										</div>
									</IonCardHeader>
									<IonCardContent>
										<p className="mb-3 text-sm text-neutral-300">
											{item.description}
										</p>
										<div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800/80 pt-3">
											<div className="flex flex-wrap items-center gap-1.5">
												{item.tags.map((tag) => (
													<IonBadge
														key={tag}
														color="medium"
														className="text-[10px] font-mono px-2 py-0.5"
													>
														{tag}
													</IonBadge>
												))}
											</div>
											<IonButton
												routerLink={`/dev/components/${item.key}`}
												fill="outline"
												size="small"
												color="primary"
											>
												<span>Open in Workbench</span>
												<IonIcon slot="end" icon={arrowForwardSharp} />
											</IonButton>
										</div>
									</IonCardContent>
								</IonCard>
							))}
						</div>
					</div>
				</IonContent>
			</IonPage>
	)
}
