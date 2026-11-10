'use client'

import {
	IonBackButton,
	IonButton,
	IonButtons,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardSubtitle,
	IonCardTitle,
	IonContent,
	IonFooter,
	IonHeader,
	IonIcon,
	IonPage,
	IonTitle,
	IonToolbar,
	useIonToast,
} from '@ionic/react'
import { checkmarkCircleSharp, closeSharp, rocketSharp } from 'ionicons/icons'
import React, { useEffect, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'
import ModularStarship from '../assets/ModularStarship'
import PlanetAsset from '../assets/PlanetAsset'
import {
	SHIP_ARCHETYPE_IDS,
	SHIP_SOCKET_MANIFESTS,
} from '../assets/shipAssembler'
import type { ShipArchetypeId } from '../assets/types'
import {
	STAR_POINTS_THEMES,
	STAR_POINTS_THEME_IDS,
	STAR_POINT_TIERS,
	type StarPointsThemeId,
	useStarPointsTheme,
} from '../theme/starPointsThemes'
import { useStarshipCustomization } from '../starship/useStarshipCustomization'

export const CELESTIAL_SHOWCASE_TIERS: Array<{
	tier: 1 | 2 | 3 | 5 | 8 | 13
	name: string
	typeLabel: string
}> = [
	{ tier: 1, name: 'Asteroid', typeLabel: 'Rocky Irregular Body' },
	{ tier: 2, name: 'Dwarf Planet', typeLabel: 'Cratered Barren World' },
	{ tier: 3, name: 'Terrestrial', typeLabel: 'Oceanic Medium Planet' },
	{ tier: 5, name: 'Gas Giant', typeLabel: 'Banded Ringed Giant' },
	{ tier: 8, name: 'Star', typeLabel: 'High-Energy Solar Furnace' },
	{ tier: 13, name: 'Black Hole', typeLabel: 'Gravitational Singularity' },
]

export function calculateClosestCarouselIndex(
	centerPosition: number,
	itemPositions: ReadonlyArray<{ offsetLeft: number; offsetWidth: number }>,
): number {
	if (itemPositions.length === 0) return 0
	let closestIndex = 0
	let minimumDistance = Infinity

	for (let itemIndex = 0; itemIndex < itemPositions.length; itemIndex++) {
		const item = itemPositions[itemIndex]
		if (!item) continue
		const itemCenterPosition = item.offsetLeft + item.offsetWidth / 2
		const distance = Math.abs(centerPosition - itemCenterPosition)
		if (distance < minimumDistance) {
			minimumDistance = distance
			closestIndex = itemIndex
		}
	}

	return closestIndex
}

export function Shipyard() {
	const history = useHistory()
	const [presentToast] = useIonToast()
	const { themeId: activeThemeId, setThemeId } = useStarPointsTheme()
	const { archetypeId: activeArchetypeId, setArchetypeId } =
		useStarshipCustomization()

	const [selectedThemeId, setSelectedThemeId] =
		useState<StarPointsThemeId>(activeThemeId)
	const [selectedShipId, setSelectedShipId] =
		useState<ShipArchetypeId>(activeArchetypeId)

	const themeCarouselRef = useRef<HTMLDivElement>(null)
	const shipCarouselRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		setSelectedThemeId(activeThemeId)
	}, [activeThemeId])

	useEffect(() => {
		setSelectedShipId(activeArchetypeId)
	}, [activeArchetypeId])

	useEffect(() => {
		const themeIndex = STAR_POINTS_THEME_IDS.indexOf(activeThemeId)
		if (themeIndex >= 0 && themeCarouselRef.current) {
			const childElement = themeCarouselRef.current.children[themeIndex] as HTMLElement
			childElement?.scrollIntoView({ inline: 'center', block: 'nearest' })
		}

		const shipIndex = SHIP_ARCHETYPE_IDS.indexOf(activeArchetypeId)
		if (shipIndex >= 0 && shipCarouselRef.current) {
			const childElement = shipCarouselRef.current.children[shipIndex] as HTMLElement
			childElement?.scrollIntoView({ inline: 'center', block: 'nearest' })
		}
	}, [activeThemeId, activeArchetypeId])

	const handleCarouselScroll = <T extends string>(
		container: HTMLDivElement | null,
		itemIdentifiers: readonly T[],
		onSelect: (identifier: T) => void,
	) => {
		if (!container) return
		const centerPosition = container.scrollLeft + container.clientWidth / 2
		const itemPositions = Array.from(container.children).map(childElement => {
			const htmlElement = childElement as HTMLElement
			return {
				offsetLeft: htmlElement.offsetLeft,
				offsetWidth: htmlElement.offsetWidth,
			}
		})
		const closestIndex = calculateClosestCarouselIndex(centerPosition, itemPositions)
		const closestIdentifier = itemIdentifiers[closestIndex]
		if (closestIdentifier) {
			onSelect(closestIdentifier)
		}
	}

	const handleCardClick = <T extends string>(
		container: HTMLDivElement | null,
		itemIndex: number,
		identifier: T,
		onSelect: (identifier: T) => void,
	) => {
		onSelect(identifier)
		if (!container) return
		const childElement = container.children[itemIndex] as HTMLElement | undefined
		childElement?.scrollIntoView({
			behavior: 'smooth',
			inline: 'center',
			block: 'nearest',
		})
	}

	const handleSave = () => {
		setThemeId(selectedThemeId)
		setArchetypeId(selectedShipId)

		presentToast({
			message: `Shipyard loadout saved: ${STAR_POINTS_THEMES[selectedThemeId].name} • ${SHIP_SOCKET_MANIFESTS[selectedShipId]?.name ?? 'Starship'}`,
			duration: 2200,
			position: 'bottom',
			color: 'success',
		})

		history.push('/home')
	}

	const previewTheme = STAR_POINTS_THEMES[selectedThemeId]

	return (
		<IonPage id="shipyard-page" data-testid="shipyard-page" className="bg-[#070b12]">
			<IonHeader className="ion-no-border border-b border-neutral-800 bg-[#070b12]">
				<IonToolbar className="[--background:#070b12] text-white">
					<IonButtons slot="start">
						<IonBackButton defaultHref="/home" />
					</IonButtons>
					<IonTitle className="font-bold tracking-wide">Shipyard</IonTitle>
					<IonButtons slot="end">
						<IonButton
							routerLink="/home"
							routerDirection="back"
							aria-label="Close shipyard"
							color="medium"
						>
							<IonIcon icon={closeSharp} slot="icon-only" />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="[--background:#070b12] text-neutral-100 select-none">
				<div className="py-6 space-y-8 max-w-5xl mx-auto overflow-x-hidden">
					<section data-testid="shipyard-theme-row" className="space-y-2">
						<div className="px-6 flex items-baseline justify-between">
							<div>
								<h2 className="text-sm font-bold uppercase tracking-wider text-sky-400">
									Theme Palette
								</h2>
								<p className="text-xs text-neutral-400 mt-0.5">
									Scroll to center to select your celestial and cockpit colorway
								</p>
							</div>
							<span className="text-xs font-mono font-semibold text-neutral-300">
								{previewTheme.name}
							</span>
						</div>

						<div
							ref={themeCarouselRef}
							data-testid="theme-card-carousel"
							onScroll={() =>
								handleCarouselScroll(
									themeCarouselRef.current,
									STAR_POINTS_THEME_IDS,
									selectedId => setSelectedThemeId(selectedId),
								)
							}
							className="flex gap-4 overflow-x-auto snap-x snap-mandatory py-4 px-[calc(50vw-140px)] no-scrollbar scroll-smooth"
						>
							{STAR_POINTS_THEME_IDS.map((themeIdentifier, themeIndex) => {
								const themeDefinition = STAR_POINTS_THEMES[themeIdentifier]
								const isSelected = selectedThemeId === themeIdentifier

								return (
									<IonCard
										key={themeIdentifier}
										data-testid={`theme-card-${themeIdentifier}`}
										data-selected={String(isSelected)}
										button={true}
										onClick={() =>
											handleCardClick(
												themeCarouselRef.current,
												themeIndex,
												themeIdentifier,
												selectedId => setSelectedThemeId(selectedId),
											)
										}
										className={`w-[280px] shrink-0 snap-center m-0 rounded-2xl transition-all duration-300 ${
											isSelected
												? 'border-2 border-sky-400 bg-neutral-900 shadow-2xl scale-100 ring-4 ring-sky-500/20'
												: 'border border-neutral-800 bg-neutral-950/70 opacity-60 scale-95 hover:opacity-90'
										}`}
									>
										<IonCardHeader className="pb-2">
											<div className="flex items-center justify-between">
												<IonCardTitle className="text-base font-bold text-white tracking-wide">
													{themeDefinition.name}
												</IonCardTitle>
												{isSelected && (
													<span className="text-[10px] font-mono font-semibold text-sky-300 bg-sky-950/90 border border-sky-400/40 px-2 py-0.5 rounded-full flex items-center gap-1">
														<IonIcon icon={checkmarkCircleSharp} className="text-xs" />
														Selected
													</span>
												)}
											</div>
											<IonCardSubtitle className="text-xs text-neutral-400 mt-1">
												{themeDefinition.subtitle}
											</IonCardSubtitle>
										</IonCardHeader>

										<IonCardContent className="pt-0">
											<div className="grid grid-cols-6 gap-1.5 my-2">
												{STAR_POINT_TIERS.map(starTier => (
													<div key={starTier} className="flex flex-col items-center">
														<span
															className="w-full h-8 rounded-md shadow-sm border border-white/10"
															style={{
																backgroundColor: themeDefinition.starColors[starTier],
															}}
														/>
														<span className="text-[10px] font-mono mt-1 text-neutral-300 font-semibold">
															★{starTier}
														</span>
													</div>
												))}
											</div>

											<div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs">
												<span className="text-neutral-400">Hull Palette:</span>
												<span className="text-neutral-200 font-medium flex items-center gap-1.5">
													<span
														className="w-2.5 h-2.5 rounded-full"
														style={{
															backgroundColor:
																themeDefinition.shipPalette.secondaryTrimGreen,
														}}
													/>
													{themeDefinition.shipPalette.name}
												</span>
											</div>
										</IonCardContent>
									</IonCard>
								)
							})}
						</div>
					</section>

					<section data-testid="shipyard-ship-row" className="space-y-2">
						<div className="px-6 flex items-baseline justify-between">
							<div>
								<h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
									Starship Archetype
								</h2>
								<p className="text-xs text-neutral-400 mt-0.5">
									Scroll to center to select your whole starship hull
								</p>
							</div>
							<span className="text-xs font-mono font-semibold text-neutral-300">
								{SHIP_SOCKET_MANIFESTS[selectedShipId]?.name}
							</span>
						</div>

						<div
							ref={shipCarouselRef}
							data-testid="ship-card-carousel"
							onScroll={() =>
								handleCarouselScroll(
									shipCarouselRef.current,
									SHIP_ARCHETYPE_IDS,
									selectedId => setSelectedShipId(selectedId),
								)
							}
							className="flex gap-4 overflow-x-auto snap-x snap-mandatory py-4 px-[calc(50vw-140px)] no-scrollbar scroll-smooth"
						>
							{SHIP_ARCHETYPE_IDS.map((shipIdentifier, shipIndex) => {
								const shipDefinition = SHIP_SOCKET_MANIFESTS[shipIdentifier]
								const isSelected = selectedShipId === shipIdentifier

								return (
									<IonCard
										key={shipIdentifier}
										data-testid={`ship-card-${shipIdentifier}`}
										data-selected={String(isSelected)}
										button={true}
										onClick={() =>
											handleCardClick(
												shipCarouselRef.current,
												shipIndex,
												shipIdentifier,
												selectedId => setSelectedShipId(selectedId),
											)
										}
										className={`w-[280px] shrink-0 snap-center m-0 rounded-2xl transition-all duration-300 ${
											isSelected
												? 'border-2 border-amber-400 bg-neutral-900 shadow-2xl scale-100 ring-4 ring-amber-500/20'
												: 'border border-neutral-800 bg-neutral-950/70 opacity-60 scale-95 hover:opacity-90'
										}`}
									>
										<IonCardHeader className="pb-1">
											<div className="flex items-center justify-between">
												<IonCardTitle className="text-base font-bold text-white tracking-wide">
													{shipDefinition.name}
												</IonCardTitle>
												{isSelected && (
													<span className="text-[10px] font-mono font-semibold text-amber-300 bg-amber-950/90 border border-amber-400/40 px-2 py-0.5 rounded-full flex items-center gap-1">
														<IonIcon icon={checkmarkCircleSharp} className="text-xs" />
														Selected
													</span>
												)}
											</div>
											<IonCardSubtitle className="text-xs text-amber-300/80 mt-0.5 font-medium">
												{shipDefinition.roleLabel}
											</IonCardSubtitle>
										</IonCardHeader>

										<IonCardContent className="pt-2">
											<div className="flex items-center justify-center py-2 h-28 rounded-xl bg-gradient-to-b from-[#050b14] to-[#020509] border border-neutral-800/80 mb-2">
												<ModularStarship
													loadout={{
														hullArchetype: shipIdentifier,
													}}
													themeId={selectedThemeId}
													size={80}
												/>
											</div>

											<p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
												{shipDefinition.description}
											</p>
										</IonCardContent>
									</IonCard>
								)
							})}
						</div>
					</section>

					<section data-testid="shipyard-celestial-row" className="space-y-3 pt-2">
						<div className="px-6 flex items-baseline justify-between">
							<div>
								<h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
									Celestial Hierarchy
								</h2>
								<p className="text-xs text-neutral-400 mt-0.5">
									Infinitely scrolling cosmic bodies scaled by Star Points (Display only)
								</p>
							</div>
							<span className="text-[11px] font-mono text-neutral-400">
								★ 1 to ★ 13 pts
							</span>
						</div>

						<div className="relative w-full overflow-hidden py-3 bg-neutral-950/40 border-y border-neutral-900 pointer-events-none select-none">
							<div className="flex w-max animate-marquee gap-10">
								{[...CELESTIAL_SHOWCASE_TIERS, ...CELESTIAL_SHOWCASE_TIERS].map(
									(celestialItem, showcaseIndex) => {
										const tierColor = previewTheme.starColors[celestialItem.tier]

										return (
											<div
												key={`${celestialItem.tier}-${showcaseIndex}`}
												data-testid={`celestial-marquee-item-${celestialItem.tier}`}
												className="flex flex-col items-center justify-center shrink-0 w-32 text-center"
											>
												<div className="h-16 w-16 flex items-center justify-center drop-shadow-md mb-2">
													<PlanetAsset
														size={52}
														themeId={selectedThemeId}
														todo={{
															id: `marquee-planet-${celestialItem.tier}-${showcaseIndex}`,
															title: celestialItem.name,
															starPoints: celestialItem.tier,
														}}
													/>
												</div>
												<span
													className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border mb-1"
													style={{
														color: tierColor,
														borderColor: `${tierColor}55`,
														backgroundColor: `${tierColor}15`,
													}}
												>
													★ {celestialItem.tier} {celestialItem.tier === 1 ? 'pt' : 'pts'}
												</span>
												<span className="text-xs font-semibold text-neutral-200">
													{celestialItem.name}
												</span>
												<span className="text-[10px] text-neutral-500 truncate max-w-[120px]">
													{celestialItem.typeLabel}
												</span>
											</div>
										)
									},
								)}
							</div>
						</div>
					</section>
				</div>
			</IonContent>

			<IonFooter className="ion-no-border bg-[#070b12] border-t border-neutral-800">
				<IonToolbar className="[--background:#070b12] px-4 py-1.5">
					<div className="flex items-center justify-between gap-3 max-w-5xl mx-auto w-full">
						<IonButton
							routerLink="/home"
							routerDirection="back"
							fill="clear"
							color="medium"
							size="default"
						>
							Cancel
						</IonButton>

						<IonButton
							data-testid="shipyard-save-button"
							color="success"
							size="default"
							onClick={handleSave}
							className="font-bold tracking-wide"
						>
							<IonIcon icon={rocketSharp} slot="start" />
							Save Loadout
						</IonButton>
					</div>
				</IonToolbar>
			</IonFooter>
		</IonPage>
	)
}

export default Shipyard
