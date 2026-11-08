'use client'

import {
	IonBadge,
	IonButton,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardSubtitle,
	IonCardTitle,
	IonContent,
	IonIcon,
} from '@ionic/react'
import {
	checkmarkOutline,
	colorPaletteSharp,
	copyOutline,
	planetSharp,
	rocketSharp,
	sparklesSharp,
	textSharp,
} from 'ionicons/icons'
import { useState } from 'react'
import ModularStarship from '../assets/ModularStarship'
import PlanetAsset from '../assets/PlanetAsset'
import { CELESTIAL_CLASS_LABELS, resolveCelestialClass } from '../assets/planetGenerator'
import { SHIP_ARCHETYPE_LIST, SHIP_CATALOG } from '../assets/shipAssembler'
import { Header } from '../common/Header'
import {
	STAR_POINTS_THEMES,
	STAR_POINTS_THEME_IDS,
	STAR_POINT_TIERS,
	type StarPointTier,
	useStarPointsTheme,
} from '../theme/starPointsThemes'

interface ColorToken {
	name: string
	variable: string
	hex: string
	description: string
	textColor?: string
}

const STAR_POINT_DESCRIPTIONS: Record<StarPointTier, string> = {
	1: '1pt Asteroid — Quick habits, initial entry tasks, low-friction items.',
	2: '2pt Dwarf Planet — Minor focused tasks, short errands, 15-minute bursts.',
	3: '3pt Medium Planet — Standard work units, half-hour commits, daily priorities.',
	5: '5pt Gas Giant — Deep focus milestones, multi-step sub-goals, core deliverables.',
	8: '8pt Star — Major project milestones, significant creative output.',
	13: '13pt Black Hole — Epic space journeys, transformative achievements.',
}

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
	const { themeId, theme, setThemeId } = useStarPointsTheme()

	const copyToClipboard = (text: string) => {
		navigator.clipboard?.writeText(text)
		setCopiedColor(text)
		setTimeout(() => setCopiedColor(null), 2000)
	}

	return (
		<div className="ion-page" id="main-content">
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
							Experiment with whole-app Star Point theme palettes. Switching a theme updates the 1–13 Star Point color scale, every celestial body’s primary hue, and the starship fleet livery across the app.
						</p>
					</div>

					{/* Interactive Whole-App Theme Switcher */}
					<section className="mb-10" data-testid="app-theme-selector">
						<div className="mb-4 flex items-center justify-between gap-2">
							<div className="flex items-center gap-2">
								<IonIcon icon={sparklesSharp} className="text-sky-400" />
								<h2 className="text-lg font-bold text-white">
									Whole-App Cosmic Theme Palette
								</h2>
							</div>
							<IonBadge color="primary">{theme.name}</IonBadge>
						</div>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{STAR_POINTS_THEME_IDS.map((candidateId) => {
								const candidate = STAR_POINTS_THEMES[candidateId]
								const isSelected = candidateId === themeId
								return (
									<button
										key={candidateId}
										type="button"
										data-testid={`theme-card-${candidateId}`}
										onClick={() => setThemeId(candidateId)}
										className={`flex flex-col justify-between gap-3 rounded-xl border p-4 text-left transition-all ${
											isSelected
												? 'border-sky-400 bg-sky-500/10 shadow-lg'
												: 'border-neutral-800 bg-neutral-900/90 hover:border-neutral-700'
										}`}
									>
										<div>
											<div className="flex items-center justify-between gap-2">
												<span className="text-sm font-bold text-white">
													{candidate.name}
												</span>
												{isSelected && (
													<span className="rounded bg-sky-500/20 px-2 py-0.5 font-mono text-[10px] text-sky-300">
														Active
													</span>
												)}
											</div>
											<p className="mt-0.5 text-[11px] text-neutral-400">
												{candidate.subtitle}
											</p>
										</div>
										<div className="flex items-center gap-1.5 pt-1">
											{STAR_POINT_TIERS.map((tier) => (
												<div
													key={tier}
													className="flex-1 h-5 rounded-md border border-white/15 flex items-center justify-center font-mono text-[10px] font-bold text-black/80"
													style={{
														backgroundColor: candidate.starColors[tier],
													}}
													title={`${tier} pts: ${candidate.starColors[tier]}`}
												>
													{tier}
												</div>
											))}
										</div>
									</button>
								)
							})}
						</div>
					</section>

					{/* Section 1: Star Points Progression Colors & Celestial Bodies */}
					<section className="mb-10" data-testid="theme-star-points-scale">
						<div className="mb-4 flex items-center gap-2">
							<IonIcon icon={planetSharp} className="text-amber-400" />
							<h2 className="text-lg font-bold text-white">
								Star Point Progression Hierarchy & Celestial Bodies
							</h2>
							<IonBadge color="secondary">1 – 13 pts</IonBadge>
						</div>
						<p className="mb-4 text-xs text-neutral-400">
							Each Fibonacci Star Point tier has a distinct celestial body class whose primary hue matches its Star Point color in the active theme ({theme.name}).
						</p>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{STAR_POINT_TIERS.map((tier) => {
								const hex = theme.starColors[tier]
								const variable = `--star-${tier}`
								const celestialClass = resolveCelestialClass(tier)
								return (
									<IonCard
										key={variable}
										button
										onClick={() => copyToClipboard(hex)}
										className="m-0 border border-neutral-800 bg-neutral-900/90 transition hover:border-neutral-700"
									>
										<IonCardContent className="p-4">
											<div className="mb-3 flex items-center justify-between">
												<div className="flex items-center gap-3">
													<PlanetAsset
														todo={{
															id: `theme-preview-${tier}`,
															title: `${tier} Star Points`,
															starPoints: tier,
														}}
														themeId={themeId}
														size={56}
													/>
													<div
														className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg font-mono text-xs font-bold text-black"
														style={{
															backgroundColor: hex,
														}}
													>
														★ {tier}
													</div>
												</div>
												<IonButton
													fill="clear"
													size="small"
													color={copiedColor === hex ? 'success' : 'medium'}
													className="m-0 font-mono text-xs"
													onClick={(e) => {
														e.stopPropagation()
														copyToClipboard(hex)
													}}
												>
													<IonIcon
														slot="start"
														icon={
															copiedColor === hex
																? checkmarkOutline
																: copyOutline
														}
													/>
													<span>{hex}</span>
												</IonButton>
											</div>
											<h3 className="font-semibold text-white">
												{tier} {tier === 1 ? 'Star Point' : 'Star Points'} •{' '}
												{CELESTIAL_CLASS_LABELS[celestialClass]}
											</h3>
											<p className="font-mono text-xs text-neutral-500">
												{variable}
											</p>
											<p className="mt-2 text-xs text-neutral-400">
												{STAR_POINT_DESCRIPTIONS[tier]}
											</p>
										</IonCardContent>
									</IonCard>
								)
							})}
						</div>
					</section>

					{/* Coordinated Starship Fleet Preview */}
					<section className="mb-10" data-testid="theme-starship-preview">
						<div className="mb-4 flex items-center gap-2">
							<IonIcon icon={rocketSharp} className="text-cyan-400" />
							<h2 className="text-lg font-bold text-white">
								Coordinated Starship Livery ({theme.shipPalette.name})
							</h2>
							<IonBadge color="tertiary">{theme.name}</IonBadge>
						</div>
						<p className="mb-4 text-xs text-neutral-400">
							{theme.shipPalette.tagline}
						</p>
						<div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
							{SHIP_ARCHETYPE_LIST.map((hullId) => (
								<div
									key={hullId}
									className="flex flex-col items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/90 p-4"
								>
									<ModularStarship
										loadout={{ hullArchetype: hullId }}
										themeId={themeId}
										size={68}
										thrusterFrame={1}
									/>
									<span className="text-xs font-medium text-neutral-200 text-center">
										{SHIP_CATALOG[hullId].name}
									</span>
								</div>
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
						</div>
					</section>
				</div>
			</IonContent>
		</div>
	)
}
