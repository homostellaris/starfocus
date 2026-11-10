'use client'

import {
	IonButton,
	IonContent,
	IonIcon,
	IonPopover,
} from '@ionic/react'
import { checkmarkCircleSharp, closeSharp } from 'ionicons/icons'
import React from 'react'
import ModularStarship from '../assets/ModularStarship'
import PlanetAsset from '../assets/PlanetAsset'
import {
	SHIP_ARCHETYPE_IDS,
	SHIP_SKIN_IDS,
	SHIP_SOCKET_MANIFESTS,
} from '../assets/shipAssembler'
import {
	STAR_POINTS_THEMES,
	STAR_POINTS_THEME_IDS,
	STAR_POINT_TIERS,
	useStarPointsTheme,
} from '../theme/starPointsThemes'
import { useStarshipCustomization } from './useStarshipCustomization'

const CELESTIAL_TIER_DETAILS: Record<
	number,
	{ name: string; typeLabel: string }
> = {
	1: { name: 'Asteroid', typeLabel: 'Irregular Rocky Body' },
	2: { name: 'Dwarf Planet', typeLabel: 'Barren Cratered World' },
	3: { name: 'Terrestrial', typeLabel: 'Medium Oceanic Planet' },
	5: { name: 'Gas Giant', typeLabel: 'Banded Jovian World' },
	8: { name: 'Star', typeLabel: 'High-Energy Stellar Furnace' },
	13: { name: 'Black Hole', typeLabel: 'Gravitational Singularity' },
}

export interface StarshipCustomizerPopoverProps {
	id?: string
	isOpen?: boolean
	onDismiss?: () => void
	trigger?: string
}

export function StarshipCustomizerPopover({
	id = 'starship-customizer-popover',
	isOpen,
	onDismiss,
	trigger,
}: StarshipCustomizerPopoverProps) {
	const { themeId, theme, setThemeId } = useStarPointsTheme()
	const { archetypeId, skinId, setArchetypeId, setSkinId } =
		useStarshipCustomization()

	return (
		<IonPopover
			id={id}
			data-testid={id}
			trigger={trigger}
			triggerAction={trigger ? 'click' : undefined}
			isOpen={isOpen}
			animated={false}
			onDidDismiss={onDismiss}
			className="starship-customizer-popover"
			style={
				{
					'--width': '520px',
					'--max-width': '95vw',
					'--max-height': '88vh',
					'--background': '#0b0f17',
					'--backdrop-opacity': '0.6',
				} as React.CSSProperties
			}
		>
			<IonContent
				className="text-neutral-100"
				style={
					{
						'--background': '#0b0f17',
						'--padding-top': '16px',
						'--padding-bottom': '24px',
						'--padding-start': '18px',
						'--padding-end': '18px',
					} as React.CSSProperties
				}
			>
				{/* Header */}
				<div className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-3 mb-4">
					<div>
						<h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
							<span>Fleet Command & Observatory</span>
						</h2>
						<p className="text-xs text-neutral-400 mt-0.5">
							Customize your starship, theme palette & inspect celestial body
							tiers
						</p>
					</div>
					<IonButton
						fill="clear"
						size="small"
						color="medium"
						onClick={event => {
							const popover = (event.target as HTMLElement).closest('ion-popover')
							if (popover && typeof (popover as any).dismiss === 'function') {
								;(popover as any).dismiss()
							}
							onDismiss?.()
						}}
						aria-label="Close customizer"
						className="m-0 -mr-2"
					>
						<IonIcon icon={closeSharp} slot="icon-only" />
					</IonButton>
				</div>

				{/* Section 1: Celestial Bodies Comparison */}
				<div className="mb-5">
					<div className="flex items-baseline justify-between mb-2">
						<h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
							Celestial Bodies (Comparison Lineup)
						</h3>
						<span className="text-[11px] text-neutral-400">
							Scaled by Star Points
						</span>
					</div>

					<div
						data-testid="celestial-bodies-lineup"
						className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80"
					>
						{STAR_POINT_TIERS.map(tier => {
							const details = CELESTIAL_TIER_DETAILS[tier]
							const tierColor = theme.starColors[tier]
							return (
								<div
									key={tier}
									data-testid={`celestial-tier-card-${tier}`}
									className="flex flex-col items-center justify-between p-2 rounded-lg bg-neutral-900/60 border border-neutral-800/60 hover:border-neutral-700 transition-colors text-center min-h-[110px]"
								>
									<span
										className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-full border mb-1"
										style={{
											color: tierColor,
											borderColor: `${tierColor}55`,
											backgroundColor: `${tierColor}15`,
										}}
									>
										★ {tier} {tier === 1 ? 'pt' : 'pts'}
									</span>

									<div className="my-1 flex items-center justify-center h-12 w-12">
										<PlanetAsset
											size={42}
											themeId={themeId}
											todo={{
												id: `comparison-tier-${tier}`,
												title: details.name,
												starPoints: tier,
											}}
										/>
									</div>

									<div className="w-full">
										<div className="text-[11px] font-semibold text-neutral-200 truncate">
											{details.name}
										</div>
										<div className="text-[9px] text-neutral-500 truncate leading-tight">
											{details.typeLabel}
										</div>
									</div>
								</div>
							)
						})}
					</div>
				</div>

				{/* Section 2: Starship Model Selection */}
				<div className="mb-5">
					<div className="flex items-baseline justify-between mb-2">
						<h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
							Starship Archetype
						</h3>
						<span className="text-[11px] text-neutral-400">
							Choose whole ship
						</span>
					</div>

					<div
						data-testid="starship-archetype-selector"
						className="grid grid-cols-1 sm:grid-cols-2 gap-2"
					>
						{SHIP_ARCHETYPE_IDS.map(shipId => {
							const manifest = SHIP_SOCKET_MANIFESTS[shipId]
							const isSelected = archetypeId === shipId

							return (
								<button
									type="button"
									key={shipId}
									data-testid={`starship-option-${shipId}`}
									data-selected={String(isSelected)}
									onClick={() => setArchetypeId(shipId)}
									className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
										isSelected
											? 'bg-neutral-800/90 border-sky-400/80 shadow-md ring-1 ring-sky-400/30'
											: 'bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-900/60 hover:border-neutral-700'
									}`}
								>
									<div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-neutral-900/80 border border-neutral-800">
										<ModularStarship
											loadout={{
												hullArchetype: shipId,
												...(skinId ? { skinId } : {}),
											}}
											themeId={themeId}
											size={44}
										/>
									</div>

									<div className="min-w-0 flex-1">
										<div className="flex items-center justify-between">
											<span className="text-xs font-semibold text-white truncate">
												{manifest.name}
											</span>
											{isSelected && (
												<IonIcon
													icon={checkmarkCircleSharp}
													className="text-sky-400 text-sm shrink-0"
												/>
											)}
										</div>
										<div className="text-[11px] text-neutral-400 truncate">
											{manifest.roleLabel}
										</div>
									</div>
								</button>
							)
						})}
					</div>
				</div>

				{/* Section 3: App Theme Palette Switcher */}
				<div className="mb-5">
					<div className="flex items-baseline justify-between mb-2">
						<h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
							Star Points Theme Palette
						</h3>
						<span className="text-[11px] text-neutral-400">
							Changes celestial & ship colors
						</span>
					</div>

					<div
						data-testid="theme-palette-selector"
						className="space-y-1.5"
					>
						{STAR_POINTS_THEME_IDS.map(themeKey => {
							const themeDef = STAR_POINTS_THEMES[themeKey]
							const isSelected = themeId === themeKey

							return (
								<button
									type="button"
									key={themeKey}
									data-testid={`theme-option-${themeKey}`}
									data-selected={String(isSelected)}
									onClick={() => setThemeId(themeKey)}
									className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl border text-left transition-all ${
										isSelected
											? 'bg-neutral-800/90 border-sky-400/80 shadow-md ring-1 ring-sky-400/30'
											: 'bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-900/60 hover:border-neutral-700'
									}`}
								>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="text-xs font-semibold text-white">
												{themeDef.name}
											</span>
											{isSelected && (
												<span className="text-[10px] font-medium text-sky-400 bg-sky-950/80 px-1.5 py-0.2 rounded border border-sky-500/30">
													Active
												</span>
											)}
										</div>
										<div className="text-[11px] text-neutral-400 truncate mt-0.5">
											{themeDef.subtitle}
										</div>
									</div>

									{/* Swatch Strip */}
									<div className="flex items-center gap-1 shrink-0 bg-neutral-900/80 p-1 rounded-md border border-neutral-800">
										{STAR_POINT_TIERS.map(tier => (
											<span
												key={tier}
												title={`${tier} pt: ${themeDef.starColors[tier]}`}
												className="w-3 h-5 rounded-sm block"
												style={{ backgroundColor: themeDef.starColors[tier] }}
											/>
										))}
									</div>
								</button>
							)
						})}
					</div>
				</div>

				{/* Section 4: Starship Skin Selection */}
				<div>
					<div className="flex items-baseline justify-between mb-2">
						<h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
							Hull Livery / Skin
						</h3>
						<span className="text-[11px] text-neutral-400">
							Armor finish
						</span>
					</div>

					<div
						data-testid="starship-skin-selector"
						className="flex flex-wrap gap-2"
					>
						<button
							type="button"
							data-testid="skin-option-theme-default"
							onClick={() => setSkinId(undefined)}
							className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
								skinId === undefined
									? 'bg-sky-500/20 border-sky-400 text-sky-200'
									: 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
							}`}
						>
							Theme Default ({theme.shipPalette.name})
						</button>

						{SHIP_SKIN_IDS.map(skinKey => {
							const isSelected = skinId === skinKey
							const label = skinKey.replace(/_/g, ' ')

							return (
								<button
									type="button"
									key={skinKey}
									data-testid={`skin-option-${skinKey}`}
									onClick={() => setSkinId(skinKey)}
									className={`px-3 py-1.5 rounded-lg border text-xs capitalize font-medium transition-all ${
										isSelected
											? 'bg-sky-500/20 border-sky-400 text-sky-200'
											: 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
									}`}
								>
									{label}
								</button>
							)
						})}
					</div>
				</div>
			</IonContent>
		</IonPopover>
	)
}

export default StarshipCustomizerPopover
