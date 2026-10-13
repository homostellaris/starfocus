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
	IonList,
	IonItem,
	IonLabel,
} from '@ionic/react'
import {
	colorPaletteSharp,
	cubeSharp,
	arrowForwardSharp,
	syncSharp,
	bookOutline,
	sparklesSharp,
} from 'ionicons/icons'
import { Header } from '../common/Header'
import { MarkdownExportProvider } from '../export/MarkdownExportContext'

export default function DevHub() {
	return (
		<MarkdownExportProvider>
			<IonPage id="main-content">
				<Header
					title="Developer Hub"
					backHref="/home"
					hideActions
				/>
				<IonContent fullscreen>
					<div className="mx-auto max-w-4xl px-4 py-8">
						{/* Welcome Banner */}
						<IonCard className="m-0 mb-8 border border-neutral-800 bg-neutral-900/60 backdrop-blur">
							<IonCardContent className="p-6">
								<div className="flex flex-wrap items-center justify-between gap-4">
									<div>
										<div className="mb-2 flex items-center gap-2">
											<span className="font-display [font-palette:--redshift] text-2xl font-bold">
												StarFocus
											</span>
											<IonBadge color="primary">Dev Portal</IonBadge>
										</div>
										<h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
											Developer Tools & Design System
										</h1>
										<p className="mt-1 text-sm text-neutral-400">
											Explore and test isolated components, inspect design tokens, and review application architecture.
										</p>
									</div>
									<div className="flex items-center gap-2">
										<IonButton
											routerLink="/dev/components"
											color="primary"
											fill="solid"
											size="small"
										>
											<IonIcon slot="start" icon={cubeSharp} />
											Workbench
										</IonButton>
										<IonButton
											routerLink="/dev/theme"
											color="medium"
											fill="outline"
											size="small"
										>
											<IonIcon slot="start" icon={colorPaletteSharp} />
											Theme
										</IonButton>
									</div>
								</div>
							</IonCardContent>
						</IonCard>

						{/* Primary Feature Sections */}
						<div className="grid gap-6 md:grid-cols-2">
							{/* Component Library Card */}
							<IonCard className="m-0 flex flex-col justify-between border border-neutral-800 bg-neutral-900/90 transition hover:border-neutral-700">
								<div>
									<IonCardHeader>
										<div className="mb-3 flex items-center justify-between">
											<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
												<IonIcon
													icon={cubeSharp}
													className="text-xl"
												/>
											</div>
											<IonBadge color="primary">8 Components</IonBadge>
										</div>
										<IonCardTitle className="text-lg font-bold text-white">
											Component Library
										</IonCardTitle>
										<IonCardSubtitle className="text-xs text-neutral-400">
											Interactive workbench & state simulator
										</IonCardSubtitle>
									</IonCardHeader>
									<IonCardContent>
										<p className="mb-4 text-sm text-neutral-300">
											Inspect and interact with StarFocus components in isolation. Test upload phases, network failures, motion trajectories, and responsive layouts with dedicated controls.
										</p>
										<div className="border-t border-neutral-800/80 pt-3">
											<IonList lines="none" className="bg-transparent space-y-1 p-0">
												<IonItem
													routerLink="/dev/components/sync-status"
													button
													detail={false}
													className="[--background:transparent] hover:[--background:rgba(255,255,255,0.05)] rounded-lg text-xs"
												>
													<IonIcon slot="start" icon={syncSharp} className="text-blue-400 text-sm" />
													<IonLabel className="text-xs text-neutral-300">Unified Sync Status Popover</IonLabel>
													<IonIcon slot="end" icon={arrowForwardSharp} className="text-neutral-500 text-xs" />
												</IonItem>
												<IonItem
													routerLink="/dev/components/starship-trajectory"
													button
													detail={false}
													className="[--background:transparent] hover:[--background:rgba(255,255,255,0.05)] rounded-lg text-xs"
												>
													<IonIcon slot="start" icon={cubeSharp} className="text-cyan-400 text-sm" />
													<IonLabel className="text-xs text-neutral-300">Starship & Trajectory</IonLabel>
													<IonIcon slot="end" icon={arrowForwardSharp} className="text-neutral-500 text-xs" />
												</IonItem>
												<IonItem
													routerLink="/dev/components/pulse-graph"
													button
													detail={false}
													className="[--background:transparent] hover:[--background:rgba(255,255,255,0.05)] rounded-lg text-xs"
												>
													<IonIcon slot="start" icon={sparklesSharp} className="text-rose-400 text-sm" />
													<IonLabel className="text-xs text-neutral-300">Activity Pulse Graph</IonLabel>
													<IonIcon slot="end" icon={arrowForwardSharp} className="text-neutral-500 text-xs" />
												</IonItem>
											</IonList>
										</div>
									</IonCardContent>
								</div>
								<div className="border-t border-neutral-800/80 p-4">
									<IonButton
										routerLink="/dev/components"
										expand="block"
										fill="outline"
										color="primary"
										size="small"
									>
										<span>View All Components</span>
										<IonIcon slot="end" icon={arrowForwardSharp} />
									</IonButton>
								</div>
							</IonCard>

							{/* Theme & Design System Card */}
							<IonCard className="m-0 flex flex-col justify-between border border-neutral-800 bg-neutral-900/90 transition hover:border-neutral-700">
								<div>
									<IonCardHeader>
										<div className="mb-3 flex items-center justify-between">
											<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
												<IonIcon
													icon={colorPaletteSharp}
													className="text-xl"
												/>
											</div>
											<IonBadge color="secondary">Design Tokens</IonBadge>
										</div>
										<IonCardTitle className="text-lg font-bold text-white">
											Theme & Tokens
										</IonCardTitle>
										<IonCardSubtitle className="text-xs text-neutral-400">
											Palettes, typography & space atmosphere
										</IonCardSubtitle>
									</IonCardHeader>
									<IonCardContent>
										<p className="mb-4 text-sm text-neutral-300">
											Browse the color hierarchy for Star Points progression, Ionic semantic states, custom font-palette variations, and cosmic display backgrounds.
										</p>
										{/* Color Preview Swatches */}
										<div className="mb-4 flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 p-3">
											<div className="h-6 w-6 rounded-full bg-[#ff7878]" title="1 Point (#ff7878)" />
											<div className="h-6 w-6 rounded-full bg-[#f77baf]" title="2 Points (#f77baf)" />
											<div className="h-6 w-6 rounded-full bg-[#5fbff7]" title="3 Points (#5fbff7)" />
											<div className="h-6 w-6 rounded-full bg-[#e04573]" title="5 Points (#e04573)" />
											<div className="h-6 w-6 rounded-full bg-[#2068ef]" title="8 Points (#2068ef)" />
											<div className="h-6 w-6 rounded-full bg-[#9a7bf7]" title="13 Points (#9a7bf7)" />
										</div>
										<div className="space-y-1 text-xs text-neutral-400">
											<p>• Star Point Progression Colors (Fibonacci 1-13)</p>
											<p>• Honk Font Palettes (--redshift, --blue, --purple)</p>
											<p>• Ionic Semantic Palette (Primary, Secondary, Success)</p>
										</div>
									</IonCardContent>
								</div>
								<div className="border-t border-neutral-800/80 p-4">
									<IonButton
										routerLink="/dev/theme"
										expand="block"
										fill="outline"
										color="secondary"
										size="small"
									>
										<span>Explore Theme Showcase</span>
										<IonIcon slot="end" icon={arrowForwardSharp} />
									</IonButton>
								</div>
							</IonCard>
						</div>

						{/* Quick Feedback Note */}
						<IonCard className="m-0 mt-8 border border-neutral-800 bg-neutral-950/60">
							<IonCardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-neutral-400">
								<div className="flex items-center gap-2">
									<IonIcon icon={bookOutline} className="text-base text-neutral-400 shrink-0" />
									<span>Vercel Toolbar is active in development and preview environments for direct comments and feedback.</span>
								</div>
								<IonButton
									routerLink="/home"
									fill="clear"
									size="small"
									color="primary"
									className="m-0"
								>
									Back to App →
								</IonButton>
							</IonCardContent>
						</IonCard>
					</div>
				</IonContent>
			</IonPage>
		</MarkdownExportProvider>
	)
}
