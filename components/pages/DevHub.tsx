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
} from '@ionic/react'
import {
	colorPaletteSharp,
	cubeSharp,
	arrowForwardSharp,
	syncSharp,
	cloudDoneSharp,
	documentTextSharp,
	bookOutline,
} from 'ionicons/icons'
import { Link } from 'react-router-dom'
import { Header } from '../common/Header'
import { MarkdownExportProvider } from '../export/MarkdownExportContext'

export default function DevHub() {
	return (
		<MarkdownExportProvider>
			<IonPage id="main-content">
				<Header
					title="Developer Hub"
					backHref="/home"
				/>
				<IonContent fullscreen>
					<div className="mx-auto max-w-4xl px-4 py-8">
						{/* Welcome Banner */}
						<div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur">
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
									<Link
										to="/dev/components"
										className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
									>
										<IonIcon icon={cubeSharp} />
										<span>Workbench</span>
									</Link>
									<Link
										to="/dev/theme"
										className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:bg-neutral-700 hover:text-white"
									>
										<IonIcon icon={colorPaletteSharp} />
										<span>Theme</span>
									</Link>
								</div>
							</div>
						</div>

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
											<IonBadge color="primary">5 Components</IonBadge>
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
											Inspect and interact with StarFocus components in isolation. Test upload phases, network failures, and responsive layouts with dedicated controls.
										</p>
										<div className="space-y-2 border-t border-neutral-800/80 pt-3">
											<Link
												to="/dev/components/sync-status"
												className="flex items-center justify-between rounded-md p-2 text-xs text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
											>
												<span className="flex items-center gap-2">
													<IonIcon icon={syncSharp} className="text-blue-400" />
													<span>Unified Sync Status Popover</span>
												</span>
												<IonIcon icon={arrowForwardSharp} className="text-neutral-500" />
											</Link>
											<Link
												to="/dev/components/cloud-sync"
												className="flex items-center justify-between rounded-md p-2 text-xs text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
											>
												<span className="flex items-center gap-2">
													<IonIcon icon={cloudDoneSharp} className="text-emerald-400" />
													<span>Cloud Sync Details</span>
												</span>
												<IonIcon icon={arrowForwardSharp} className="text-neutral-500" />
											</Link>
											<Link
												to="/dev/components/markdown-sync"
												className="flex items-center justify-between rounded-md p-2 text-xs text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
											>
												<span className="flex items-center gap-2">
													<IonIcon icon={documentTextSharp} className="text-purple-400" />
													<span>Markdown Sync Details</span>
												</span>
												<IonIcon icon={arrowForwardSharp} className="text-neutral-500" />
											</Link>
										</div>
									</IonCardContent>
								</div>
								<div className="border-t border-neutral-800/80 p-4">
									<Link
										to="/dev/components"
										className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600/20 py-2.5 text-xs font-semibold text-blue-400 border border-blue-500/30 transition hover:bg-blue-600/30 hover:text-blue-300"
									>
										<span>View All Components</span>
										<IonIcon icon={arrowForwardSharp} />
									</Link>
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
									<Link
										to="/dev/theme"
										className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600/20 py-2.5 text-xs font-semibold text-purple-400 border border-purple-500/30 transition hover:bg-purple-600/30 hover:text-purple-300"
									>
										<span>Explore Theme Showcase</span>
										<IonIcon icon={arrowForwardSharp} />
									</Link>
								</div>
							</IonCard>
						</div>

						{/* Quick Feedback Note */}
						<div className="mt-8 flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 text-xs text-neutral-400">
							<div className="flex items-center gap-2">
								<IonIcon icon={bookOutline} className="text-base text-neutral-400" />
								<span>Vercel Toolbar is active in development and preview environments for direct comments and feedback.</span>
							</div>
							<Link
								to="/home"
								className="text-blue-400 hover:underline"
							>
								Back to App →
							</Link>
						</div>
					</div>
				</IonContent>
			</IonPage>
		</MarkdownExportProvider>
	)
}
