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
	colorPaletteSharp,
	sparklesSharp,
	textSharp,
	planetSharp,
	copyOutline,
	checkmarkOutline,
} from 'ionicons/icons'
import { useState } from 'react'
import { Header } from '../common/Header'

interface ColorToken {
	name: string
	variable: string
	hex: string
	description: string
	textColor?: string
}

const STAR_POINT_COLORS: ColorToken[] = [
	{
		name: '1 Star Point',
		variable: '--star-1',
		hex: '#ff7878',
		description: 'Initial entry tasks, quick habits, low friction items.',
		textColor: '#000000',
	},
	{
		name: '2 Star Points',
		variable: '--star-2',
		hex: '#f77baf',
		description: 'Minor focused tasks, short errands, 15-minute bursts.',
		textColor: '#000000',
	},
	{
		name: '3 Star Points',
		variable: '--star-3',
		hex: '#5fbff7',
		description: 'Standard work units, half-hour commits, daily priorities.',
		textColor: '#000000',
	},
	{
		name: '5 Star Points',
		variable: '--star-5',
		hex: '#e04573',
		description: 'Deep focus milestones, multi-step sub-goals, core deliverables.',
		textColor: '#ffffff',
	},
	{
		name: '8 Star Points',
		variable: '--star-8',
		hex: '#2068ef',
		description: 'Major project milestones, significant creative output.',
		textColor: '#ffffff',
	},
	{
		name: '13 Star Points',
		variable: '--star-13',
		hex: '#9a7bf7',
		description: 'Epic space journeys, transformative life achievements.',
		textColor: '#000000',
	},
]

const SEMANTIC_COLORS: ColorToken[] = [
	{
		name: 'Primary (Blue 400)',
		variable: '--ion-color-primary',
		hex: '#60a5fa',
		description: 'Interactive buttons, active tabs, link highlights.',
		textColor: '#000000',
	},
	{
		name: 'Secondary (Violet 400)',
		variable: '--ion-color-secondary',
		hex: '#a78bfa',
		description: 'Cosmic accents, sub-actions, secondary badges.',
		textColor: '#000000',
	},
	{
		name: 'Tertiary (Fuchsia 400)',
		variable: '--ion-color-tertiary',
		hex: '#e879f9',
		description: 'Gamification highlights, special milestones.',
		textColor: '#000000',
	},
	{
		name: 'Success (Emerald 400)',
		variable: '--ion-color-success',
		hex: '#34d399',
		description: 'Synced indicators, completed goals, online state.',
		textColor: '#000000',
	},
	{
		name: 'Warning (Orange 400)',
		variable: '--ion-color-warning',
		hex: '#fdba74',
		description: 'Reconnection required, attention prompts, snoozed state.',
		textColor: '#000000',
	},
	{
		name: 'Danger (Rose 400)',
		variable: '--ion-color-danger',
		hex: '#f43f5e',
		description: 'Sync errors, destructive operations, connection dropped.',
		textColor: '#000000',
	},
]

export default function DevTheme() {
	const [copiedColor, setCopiedColor] = useState<string | null>(null)

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text)
		setCopiedColor(text)
		setTimeout(() => setCopiedColor(null), 2000)
	}

	return (
		<IonPage id="main-content">
				<Header
					title="Theme"
					backHref="/dev"
					hideActions
				/>
				<IonContent fullscreen>
					<div className="mx-auto max-w-4xl px-4 py-8">
						{/* Intro Header */}
						<div className="mb-8">
							<div className="mb-1 flex items-center gap-2">
								<IonIcon icon={colorPaletteSharp} className="text-purple-400" />
								<span className="text-xs font-semibold tracking-wider text-purple-400 uppercase">
									Design System & Tokens
								</span>
							</div>
							<h1 className="text-2xl font-bold tracking-tight text-white">
								StarFocus Theme & Palettes
							</h1>
							<p className="mt-1 text-sm text-neutral-400">
								Inspect color variables, Fibonacci progression hues, custom Honk font palettes, and cosmic design tokens.
							</p>
						</div>

						{/* Section 1: Star Points Progression Colors */}
						<section className="mb-10">
							<div className="mb-4 flex items-center gap-2">
								<IonIcon icon={sparklesSharp} className="text-amber-400" />
								<h2 className="text-lg font-bold text-white">
									Star Point Progression Hierarchy
								</h2>
								<IonBadge color="secondary">Fibonacci Scale</IonBadge>
							</div>
							<p className="mb-4 text-xs text-neutral-400">
								Each todo’s Fibonacci point weight maps to a specialized cosmic hue to visually indicate difficulty and impact.
							</p>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{STAR_POINT_COLORS.map((token) => (
									<IonCard
										key={token.variable}
										button
										onClick={() => copyToClipboard(token.hex)}
										className="m-0 border border-neutral-800 bg-neutral-900/90 transition hover:border-neutral-700"
									>
										<IonCardContent className="p-4">
											<div className="mb-3 flex items-center justify-between">
												<div
													className="flex h-12 w-12 items-center justify-center rounded-xl shadow-lg font-mono text-sm font-bold"
													style={{
														backgroundColor: token.hex,
														color: token.textColor,
													}}
												>
													★ {token.name.split(' ')[0]}
												</div>
												<IonButton
													fill="clear"
													size="small"
													color={copiedColor === token.hex ? 'success' : 'medium'}
													className="m-0 font-mono text-xs"
													onClick={(e) => {
														e.stopPropagation()
														copyToClipboard(token.hex)
													}}
												>
													<IonIcon
														slot="start"
														icon={
															copiedColor === token.hex
																? checkmarkOutline
																: copyOutline
														}
													/>
													<span>{token.hex}</span>
												</IonButton>
											</div>
											<h3 className="font-semibold text-white">{token.name}</h3>
											<p className="font-mono text-xs text-neutral-500">
												{token.variable}
											</p>
											<p className="mt-2 text-xs text-neutral-400">
												{token.description}
											</p>
										</IonCardContent>
									</IonCard>
								))}
							</div>
						</section>

						{/* Section 2: Ionic Semantic Colors */}
						<section className="mb-10">
							<div className="mb-4 flex items-center gap-2">
								<IonIcon icon={colorPaletteSharp} className="text-blue-400" />
								<h2 className="text-lg font-bold text-white">
									Ionic Theme Semantic Colors
								</h2>
								<IonBadge color="primary">Dark Mode</IonBadge>
							</div>
							<p className="mb-4 text-xs text-neutral-400">
								Standard semantic color variables utilized across Ionic controls, badges, buttons, and state indicators.
							</p>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{SEMANTIC_COLORS.map((token) => (
									<IonCard
										key={token.variable}
										button
										onClick={() => copyToClipboard(token.hex)}
										className="m-0 border border-neutral-800 bg-neutral-900/90 transition hover:border-neutral-700"
									>
										<IonCardContent className="p-4">
											<div className="mb-3 flex items-center justify-between">
												<div
													className="h-10 w-10 rounded-xl shadow-lg"
													style={{ backgroundColor: token.hex }}
												/>
												<IonButton
													fill="clear"
													size="small"
													color={copiedColor === token.hex ? 'success' : 'medium'}
													className="m-0 font-mono text-xs"
													onClick={(e) => {
														e.stopPropagation()
														copyToClipboard(token.hex)
													}}
												>
													<IonIcon
														slot="start"
														icon={
															copiedColor === token.hex
																? checkmarkOutline
																: copyOutline
														}
													/>
													<span>{token.hex}</span>
												</IonButton>
											</div>
											<h3 className="font-semibold text-white">{token.name}</h3>
											<p className="font-mono text-xs text-neutral-500">
												{token.variable}
											</p>
											<p className="mt-2 text-xs text-neutral-400">
												{token.description}
											</p>
										</IonCardContent>
									</IonCard>
								))}
							</div>
						</section>

						{/* Section 3: Honk Font Palettes */}
						<section className="mb-10">
							<div className="mb-4 flex items-center gap-2">
								<IonIcon icon={textSharp} className="text-pink-400" />
								<h2 className="text-lg font-bold text-white">
									Font Palettes & Variations
								</h2>
								<IonBadge color="tertiary">Honk Font</IonBadge>
							</div>
							<p className="mb-4 text-xs text-neutral-400">
								Custom @font-palette-values applied to the Honk display font for chromatic headers and title treatments.
							</p>
							<div className="space-y-4">
								<IonCard className="m-0 border border-neutral-800 bg-neutral-900/90">
									<IonCardHeader className="border-b border-neutral-800 pb-3">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div>
												<IonCardTitle className="text-base font-semibold text-white">
													Redshift (Header Title Default)
												</IonCardTitle>
												<IonCardSubtitle className="font-mono text-xs text-neutral-500">
													[font-palette:--redshift]
												</IonCardSubtitle>
											</div>
											<IonBadge color="danger">Active Brand Title</IonBadge>
										</div>
									</IonCardHeader>
									<IonCardContent className="pt-4">
										<div className="py-2">
											<p className="font-display [font-palette:--redshift] text-4xl font-bold tracking-wide">
												StarFocus Deep Space
											</p>
										</div>
										<p className="text-xs text-neutral-400">
											Gradient shifts from blue.400 through violet and fuchsia to deep rose.
										</p>
									</IonCardContent>
								</IonCard>

								<IonCard className="m-0 border border-neutral-800 bg-neutral-900/90">
									<IonCardHeader className="border-b border-neutral-800 pb-3">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div>
												<IonCardTitle className="text-base font-semibold text-white">
													Blue Celestial
												</IonCardTitle>
												<IonCardSubtitle className="font-mono text-xs text-neutral-500">
													[font-palette:--blue]
												</IonCardSubtitle>
											</div>
											<IonBadge color="primary">Palette</IonBadge>
										</div>
									</IonCardHeader>
									<IonCardContent className="pt-4">
										<div className="py-2">
											<p className="font-display [font-palette:--blue] text-4xl font-bold tracking-wide">
												StarFocus Celestial
											</p>
										</div>
										<p className="text-xs text-neutral-400">
											Calm shades from blue.100 to blue.600.
										</p>
									</IonCardContent>
								</IonCard>

								<IonCard className="m-0 border border-neutral-800 bg-neutral-900/90">
									<IonCardHeader className="border-b border-neutral-800 pb-3">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div>
												<IonCardTitle className="text-base font-semibold text-white">
													Purple Nebula
												</IonCardTitle>
												<IonCardSubtitle className="font-mono text-xs text-neutral-500">
													[font-palette:--purple]
												</IonCardSubtitle>
											</div>
											<IonBadge color="secondary">Palette</IonBadge>
										</div>
									</IonCardHeader>
									<IonCardContent className="pt-4">
										<div className="py-2">
											<p className="font-display [font-palette:--purple] text-4xl font-bold tracking-wide">
												StarFocus Nebula
											</p>
										</div>
										<p className="text-xs text-neutral-400">
											Mystic violet spectrum from violet.100 to violet.600.
										</p>
									</IonCardContent>
								</IonCard>

								<IonCard className="m-0 border border-neutral-800 bg-neutral-900/90">
									<IonCardHeader className="border-b border-neutral-800 pb-3">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div>
												<IonCardTitle className="text-base font-semibold text-white">
													Red Supernova
												</IonCardTitle>
												<IonCardSubtitle className="font-mono text-xs text-neutral-500">
													[font-palette:--red]
												</IonCardSubtitle>
											</div>
											<IonBadge color="danger">Palette</IonBadge>
										</div>
									</IonCardHeader>
									<IonCardContent className="pt-4">
										<div className="py-2">
											<p className="font-display [font-palette:--red] text-4xl font-bold tracking-wide">
												StarFocus Supernova
											</p>
										</div>
										<p className="text-xs text-neutral-400">
											Warm stellar burst from rose.100 to rose.600.
										</p>
									</IonCardContent>
								</IonCard>
							</div>
						</section>

						{/* Section 4: Typography Stack */}
						<section className="mb-10">
							<div className="mb-4 flex items-center gap-2">
								<IonIcon icon={planetSharp} className="text-cyan-400" />
								<h2 className="text-lg font-bold text-white">
									Typography System
								</h2>
								<IonBadge color="medium">Fonts</IonBadge>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<IonCard className="m-0 border border-neutral-800 bg-neutral-900/90">
									<IonCardContent className="p-4">
										<p className="text-xs font-semibold text-neutral-400 uppercase">Display Font</p>
										<p className="font-display [font-palette:--redshift] text-2xl font-bold my-2">Honk Variable</p>
										<p className="font-mono text-xs text-neutral-500">font-family: Honk, sans-serif</p>
										<p className="mt-1 text-xs text-neutral-400">Used for brand mark, main page headers, and cosmic badges.</p>
									</IonCardContent>
								</IonCard>
								<IonCard className="m-0 border border-neutral-800 bg-neutral-900/90">
									<IonCardContent className="p-4">
										<p className="text-xs font-semibold text-neutral-400 uppercase">Heading Font</p>
										<p className="text-2xl font-bold my-2 text-white">Funnel Display</p>
										<p className="font-mono text-xs text-neutral-500">var(--font-funnel-display)</p>
										<p className="mt-1 text-xs text-neutral-400">Used for section titles, modal headers, and primary card labels.</p>
									</IonCardContent>
								</IonCard>
								<IonCard className="m-0 border border-neutral-800 bg-neutral-900/90">
									<IonCardContent className="p-4">
										<p className="text-xs font-semibold text-neutral-400 uppercase">Subtitles & Body</p>
										<p className="text-xl my-2 text-neutral-300">Jura Subtitle Font</p>
										<p className="font-mono text-xs text-neutral-500">var(--font-jura)</p>
										<p className="mt-1 text-xs text-neutral-400">Futuristic sans-serif for descriptions, labels, and metadata.</p>
									</IonCardContent>
								</IonCard>
								<IonCard className="m-0 border border-neutral-800 bg-neutral-900/90">
									<IonCardContent className="p-4">
										<p className="text-xs font-semibold text-neutral-400 uppercase">Monospace & Code</p>
										<p className="font-mono text-lg my-2 text-cyan-400">Kode_Mono 0123456789</p>
										<p className="font-mono text-xs text-neutral-500">var(--font-kode)</p>
										<p className="mt-1 text-xs text-neutral-400">Technical font for timings, hashes, numbers, and stats.</p>
									</IonCardContent>
								</IonCard>
							</div>
						</section>
					</div>
				</IonContent>
			</IonPage>
	)
}
