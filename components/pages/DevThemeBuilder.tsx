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
	IonHeader,
	IonIcon,
	IonPage,
	IonTitle,
	IonToolbar,
	useIonToast,
} from '@ionic/react'
import {
	clipboardOutline,
	colorPaletteSharp,
	flashSharp,
	refreshSharp,
} from 'ionicons/icons'
import React, { useState } from 'react'
import ModularStarship from '../assets/ModularStarship'
import PlanetAsset from '../assets/PlanetAsset'
import {
	SHIP_ARCHETYPE_IDS,
	SHIP_SKIN_IDS,
	SHIP_SOCKET_MANIFESTS,
} from '../assets/shipAssembler'
import type { ShipArchetypeId, ShipSkinId } from '../assets/types'
import {
	STAR_POINTS_THEMES,
	STAR_POINTS_THEME_IDS,
	STAR_POINT_TIERS,
	type StarPointTier,
	type StarPointsThemeDefinition,
	type StarPointsThemeId,
	applyThemeColorsToDocument,
	registerRuntimeStarPointsTheme,
} from '../theme/starPointsThemes'

export interface BuilderThemeConfig {
	id: string
	name: string
	subtitle: string
	description: string
	starColors: Record<StarPointTier, string>
	shipSkinId: ShipSkinId
	shipSecondaryTrim: string
}

export const TIER_METADATA: Record<
	StarPointTier,
	{ label: string; celestialName: string }
> = {
	1: { label: '1 pt', celestialName: 'Asteroid' },
	2: { label: '2 pts', celestialName: 'Dwarf Planet' },
	3: { label: '3 pts', celestialName: 'Terrestrial World' },
	5: { label: '5 pts', celestialName: 'Gas Giant' },
	8: { label: '8 pts', celestialName: 'Star' },
	13: { label: '13 pts', celestialName: 'Black Hole' },
}

export function parseHexToRgb(hexColor: string): [number, number, number] {
	const sanitized = hexColor.replace(/^#/, '').trim()
	const normalized =
		sanitized.length === 3
			? sanitized
					.split('')
					.map(char => char + char)
					.join('')
			: sanitized.padEnd(6, '0').slice(0, 6)
	const parsedNumber = parseInt(normalized, 16)
	if (Number.isNaN(parsedNumber)) return [255, 255, 255]
	return [
		(parsedNumber >> 16) & 255,
		(parsedNumber >> 8) & 255,
		parsedNumber & 255,
	]
}

export function formatRgbToHex(red: number, green: number, blue: number): string {
	const clampByte = (value: number) =>
		Math.max(0, Math.min(255, Math.round(value)))
	const redHex = clampByte(red).toString(16).padStart(2, '0')
	const greenHex = clampByte(green).toString(16).padStart(2, '0')
	const blueHex = clampByte(blue).toString(16).padStart(2, '0')
	return `#${redHex}${greenHex}${blueHex}`
}

export function interpolateTierColors(
	startHexColor: string,
	endHexColor: string,
): Record<StarPointTier, string> {
	const [startRed, startGreen, startBlue] = parseHexToRgb(startHexColor)
	const [endRed, endGreen, endBlue] = parseHexToRgb(endHexColor)

	const tierSteps: Record<StarPointTier, number> = {
		1: 0.0,
		2: 0.2,
		3: 0.4,
		5: 0.6,
		8: 0.8,
		13: 1.0,
	}

	const result: Partial<Record<StarPointTier, string>> = {}
	for (const tier of STAR_POINT_TIERS) {
		const step = tierSteps[tier]
		const currentRed = startRed + (endRed - startRed) * step
		const currentGreen = startGreen + (endGreen - startGreen) * step
		const currentBlue = startBlue + (endBlue - startBlue) * step
		result[tier] = formatRgbToHex(currentRed, currentGreen, currentBlue)
	}

	return result as Record<StarPointTier, string>
}

export function generateThemePromptMarkdown(config: BuilderThemeConfig): string {
	return [
		`Please add this new theme to StarFocus:`,
		``,
		`**Theme ID**: \`${config.id}\``,
		`**Name**: ${config.name}`,
		`**Subtitle**: ${config.subtitle}`,
		`**Description**: ${config.description}`,
		``,
		`**Star Point Colors**:`,
		`- ★ 1 pt (Asteroid): \`${config.starColors[1]}\``,
		`- ★ 2 pts (Dwarf Planet): \`${config.starColors[2]}\``,
		`- ★ 3 pts (Terrestrial): \`${config.starColors[3]}\``,
		`- ★ 5 pts (Gas Giant): \`${config.starColors[5]}\``,
		`- ★ 8 pts (Star): \`${config.starColors[8]}\``,
		`- ★ 13 pts (Black Hole): \`${config.starColors[13]}\``,
		``,
		`**Ship Skin**: \`${config.shipSkinId}\``,
		`**Secondary Trim**: \`${config.shipSecondaryTrim}\``,
	].join('\n')
}

export function generateThemeTypeScript(config: BuilderThemeConfig): string {
	return [
		`\t${config.id}: {`,
		`\t\tid: '${config.id}',`,
		`\t\tname: '${config.name}',`,
		`\t\tsubtitle: '${config.subtitle}',`,
		`\t\tdescription: '${config.description.replace(/'/g, "\\'")}',`,
		`\t\tstarColors: {`,
		`\t\t\t1: '${config.starColors[1]}',`,
		`\t\t\t2: '${config.starColors[2]}',`,
		`\t\t\t3: '${config.starColors[3]}',`,
		`\t\t\t5: '${config.starColors[5]}',`,
		`\t\t\t8: '${config.starColors[8]}',`,
		`\t\t\t13: '${config.starColors[13]}',`,
		`\t\t},`,
		`\t\tshipSkinId: '${config.shipSkinId}',`,
		`\t\tshipPalette: {`,
		`\t\t\tid: '${config.shipSkinId}',`,
		`\t\t\tname: '${config.name} Livery',`,
		`\t\t\ttagline: '${config.subtitle}',`,
		`\t\t\tprimaryHullRed: '#f1f5f9',`,
		`\t\t\tsecondaryTrimGreen: '${config.shipSecondaryTrim}',`,
		`\t\t\temissiveCockpitBlue: '${config.starColors[13]}',`,
		`\t\t\toutlineDark: '#09090b',`,
		`\t\t\thullPrimary: '#1e293b',`,
		`\t\t\thullSecondary: '#334155',`,
		`\t\t\thullHighlight: '#ffffff',`,
		`\t\t\taccentStripe: '${config.shipSecondaryTrim}',`,
		`\t\t\tcockpitGlow: '${config.starColors[13]}',`,
		`\t\t\tthrusterPlume: '${config.starColors[8]}',`,
		`\t\t},`,
		`\t},`,
	].join('\n')
}

export function generateThemeJson(config: BuilderThemeConfig): string {
	return JSON.stringify(
		{
			id: config.id,
			name: config.name,
			subtitle: config.subtitle,
			description: config.description,
			starColors: config.starColors,
			shipSkinId: config.shipSkinId,
			shipPalette: {
				id: config.shipSkinId,
				name: `${config.name} Livery`,
				tagline: config.subtitle,
				primaryHullRed: '#f1f5f9',
				secondaryTrimGreen: config.shipSecondaryTrim,
				emissiveCockpitBlue: config.starColors[13],
				outlineDark: '#09090b',
				hullPrimary: '#1e293b',
				hullSecondary: '#334155',
				hullHighlight: '#ffffff',
				accentStripe: config.shipSecondaryTrim,
				cockpitGlow: config.starColors[13],
				thrusterPlume: config.starColors[8],
			},
		},
		null,
		2,
	)
}

export function DevThemeBuilder() {
	const [presentToast] = useIonToast()

	const [config, setConfig] = useState<BuilderThemeConfig>({
		id: 'custom_aurora',
		name: 'Aurora Borealis',
		subtitle: 'Emerald Ray → Cyan Zenith → Magnetosphere Violet',
		description:
			'Ionized atmospheric geomagnetic storm spectrum: luminous emerald ribbons ascending into deep polar cyan and high-altitude violet singularity.',
		starColors: {
			1: '#34d399',
			2: '#2dd4bf',
			3: '#38bdf8',
			5: '#818cf8',
			8: '#a78bfa',
			13: '#c084fc',
		},
		shipSkinId: 'terran_sage',
		shipSecondaryTrim: '#2dd4bf',
	})

	const [previewArchetypeId, setPreviewArchetypeId] =
		useState<ShipArchetypeId>('interceptor_vanguard_mk1')
	const [activeExportTab, setActiveExportTab] = useState<'prompt' | 'ts' | 'json'>('prompt')

	const loadPreset = (presetThemeId: StarPointsThemeId) => {
		const targetTheme = STAR_POINTS_THEMES[presetThemeId]
		if (!targetTheme) return
		setConfig({
			id: `${targetTheme.id}_custom`,
			name: `${targetTheme.name} (Custom)`,
			subtitle: targetTheme.subtitle,
			description: targetTheme.description,
			starColors: { ...targetTheme.starColors },
			shipSkinId: targetTheme.shipSkinId,
			shipSecondaryTrim: targetTheme.shipPalette.secondaryTrimGreen,
		})

		presentToast({
			message: `Loaded preset: ${targetTheme.name}`,
			duration: 1600,
			color: 'primary',
		})
	}

	const handleColorChange = (tier: StarPointTier, hexColor: string) => {
		setConfig(previousConfig => ({
			...previousConfig,
			starColors: {
				...previousConfig.starColors,
				[tier]: hexColor,
			},
		}))
	}

	const handleAutoInterpolate = () => {
		const interpolated = interpolateTierColors(
			config.starColors[1],
			config.starColors[13],
		)
		setConfig(previousConfig => ({
			...previousConfig,
			starColors: interpolated,
		}))
		presentToast({
			message: 'Auto-interpolated scale from ★1 to ★13',
			duration: 1500,
			color: 'secondary',
		})
	}

	const handleInvertScale = () => {
		setConfig(previousConfig => ({
			...previousConfig,
			starColors: {
				1: previousConfig.starColors[13],
				2: previousConfig.starColors[8],
				3: previousConfig.starColors[5],
				5: previousConfig.starColors[3],
				8: previousConfig.starColors[2],
				13: previousConfig.starColors[1],
			},
		}))
		presentToast({
			message: 'Inverted star points color order',
			duration: 1500,
			color: 'secondary',
		})
	}

	const handleCopyToClipboard = async (content: string, label: string) => {
		try {
			if (typeof navigator !== 'undefined' && navigator.clipboard) {
				await navigator.clipboard.writeText(content)
			}
			presentToast({
				message: `Copied ${label} to clipboard! Paste in chat to apply.`,
				duration: 2500,
				color: 'success',
			})
		} catch {
			presentToast({
				message: 'Clipboard permission unavailable. Select code below to copy manually.',
				duration: 2500,
				color: 'warning',
			})
		}
	}

	const handleApplyLiveSession = () => {
		const fullThemeDefinition: StarPointsThemeDefinition = {
			id: config.id as StarPointsThemeId,
			name: config.name,
			subtitle: config.subtitle,
			description: config.description,
			starColors: config.starColors,
			shipSkinId: config.shipSkinId,
			shipPalette: {
				id: config.shipSkinId,
				name: `${config.name} Livery`,
				tagline: config.subtitle,
				primaryHullRed: '#f1f5f9',
				secondaryTrimGreen: config.shipSecondaryTrim,
				emissiveCockpitBlue: config.starColors[13],
				outlineDark: '#09090b',
				hullPrimary: '#1e293b',
				hullSecondary: '#334155',
				hullHighlight: '#ffffff',
				accentStripe: config.shipSecondaryTrim,
				cockpitGlow: config.starColors[13],
				thrusterPlume: config.starColors[8],
			},
		}

		registerRuntimeStarPointsTheme(fullThemeDefinition)
		applyThemeColorsToDocument(config.starColors, config.id)

		presentToast({
			message: `Theme applied to current session! Visit /home or /loadout to inspect.`,
			duration: 3000,
			color: 'success',
		})
	}

	const exportPromptText = generateThemePromptMarkdown(config)
	const exportTypeScriptText = generateThemeTypeScript(config)
	const exportJsonText = generateThemeJson(config)

	const activeExportText =
		activeExportTab === 'prompt'
			? exportPromptText
			: activeExportTab === 'ts'
				? exportTypeScriptText
				: exportJsonText

	return (
		<IonPage id="dev-theme-builder-page" data-testid="dev-theme-builder-page" className="bg-[#070b12]">
			<IonHeader className="ion-no-border border-b border-neutral-800 bg-[#070b12]">
				<IonToolbar className="[--background:#070b12] text-white">
					<IonButtons slot="start">
						<IonBackButton defaultHref="/dev/theme" />
					</IonButtons>
					<IonTitle className="font-bold tracking-wide">
						StarFocus Theme Builder
					</IonTitle>
					<IonButtons slot="end">
						<IonButton
							onClick={handleApplyLiveSession}
							color="success"
							size="small"
							className="font-semibold"
						>
							<IonIcon icon={flashSharp} slot="start" />
							Test Live
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="[--background:#070b12] text-neutral-100">
				<div className="py-6 px-4 max-w-5xl mx-auto space-y-8">
					{/* Presets Quick-Loader */}
					<section className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">
								Start from a Preset
							</span>
							<span className="text-xs text-neutral-500">
								Choose a baseline or tweak custom values below
							</span>
						</div>
						<div className="flex flex-wrap gap-2">
							{STAR_POINTS_THEME_IDS.map(presetId => (
								<IonButton
									key={presetId}
									size="small"
									fill="outline"
									color="medium"
									onClick={() => loadPreset(presetId)}
									className="text-xs font-mono"
								>
									{STAR_POINTS_THEMES[presetId]?.name ?? presetId}
								</IonButton>
							))}
						</div>
					</section>

					{/* Section 1: Theme Identity & Metadata */}
					<IonCard className="m-0 border border-neutral-800 bg-neutral-900/60 rounded-2xl">
						<IonCardHeader className="pb-3 border-b border-neutral-800/80">
							<div className="flex items-center gap-2">
								<IonIcon icon={colorPaletteSharp} className="text-sky-400 text-lg" />
								<IonCardTitle className="text-base text-white font-bold">
									Theme Metadata
								</IonCardTitle>
							</div>
							<IonCardSubtitle className="text-xs text-neutral-400">
								Define theme identifiers and astronomical lore
							</IonCardSubtitle>
						</IonCardHeader>

						<IonCardContent className="pt-4 space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-xs font-semibold text-neutral-300 mb-1">
										Theme Slug / ID
									</label>
									<input
										data-testid="theme-builder-id-input"
										type="text"
										value={config.id}
										onChange={event =>
											setConfig({ ...config, id: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })
										}
										className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-sky-400 focus:outline-none"
										placeholder="e.g. quantum_nebula"
									/>
								</div>

								<div>
									<label className="block text-xs font-semibold text-neutral-300 mb-1">
										Display Name
									</label>
									<input
										data-testid="theme-builder-name-input"
										type="text"
										value={config.name}
										onChange={event =>
											setConfig({ ...config, name: event.target.value })
										}
										className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
										placeholder="e.g. Quantum Nebula"
									/>
								</div>
							</div>

							<div>
								<label className="block text-xs font-semibold text-neutral-300 mb-1">
									Gradient Subtitle
								</label>
								<input
									type="text"
									value={config.subtitle}
									onChange={event =>
										setConfig({ ...config, subtitle: event.target.value })
									}
									className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
									placeholder="e.g. Amber Flare → Cyber Emerald → Deep Void"
								/>
							</div>

							<div>
								<label className="block text-xs font-semibold text-neutral-300 mb-1">
									Theme Lore / Description
								</label>
								<textarea
									rows={2}
									value={config.description}
									onChange={event =>
										setConfig({ ...config, description: event.target.value })
									}
									className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
									placeholder="Describe the cosmological aesthetic and focus vibe..."
								/>
							</div>
						</IonCardContent>
					</IonCard>

					{/* Section 2: Star Points Scale (6 Tiers) */}
					<IonCard className="m-0 border border-neutral-800 bg-neutral-900/60 rounded-2xl">
						<IonCardHeader className="pb-3 border-b border-neutral-800/80">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div>
									<IonCardTitle className="text-base text-white font-bold">
										Star Points Scale Palette
									</IonCardTitle>
									<IonCardSubtitle className="text-xs text-neutral-400">
										Configure hex colors for all 6 celestial body tiers
									</IonCardSubtitle>
								</div>
								<div className="flex items-center gap-2">
									<IonButton
										size="small"
										fill="outline"
										color="secondary"
										onClick={handleAutoInterpolate}
										className="text-xs"
									>
										Interpolate Scale (1 → 13)
									</IonButton>
									<IonButton
										size="small"
										fill="outline"
										color="medium"
										onClick={handleInvertScale}
										className="text-xs"
									>
										<IonIcon icon={refreshSharp} slot="icon-only" />
									</IonButton>
								</div>
							</div>
						</IonCardHeader>

						<IonCardContent className="pt-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
								{STAR_POINT_TIERS.map(tier => {
									const metadata = TIER_METADATA[tier]
									const currentColor = config.starColors[tier]

									return (
										<div
											key={tier}
											data-testid={`builder-tier-row-${tier}`}
											className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-3"
										>
											<div className="flex items-center gap-2.5 min-w-0">
												<div className="h-10 w-10 shrink-0 flex items-center justify-center drop-shadow">
													<PlanetAsset
														size={36}
														todo={{
															id: `builder-preview-${tier}`,
															title: metadata.celestialName,
															starPoints: tier,
														}}
													/>
												</div>
												<div className="min-w-0">
													<div className="text-xs font-bold text-white flex items-center gap-1.5">
														<span
															className="w-2 h-2 rounded-full inline-block shrink-0"
															style={{ backgroundColor: currentColor }}
														/>
														<span>★ {metadata.label}</span>
													</div>
													<div className="text-[11px] text-neutral-400 truncate">
														{metadata.celestialName}
													</div>
												</div>
											</div>

											<div className="flex items-center gap-1.5 shrink-0">
												<input
													type="color"
													aria-label={`Color for ${metadata.label}`}
													value={currentColor}
													onChange={event => handleColorChange(tier, event.target.value)}
													className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
												/>
												<input
													data-testid={`builder-color-input-${tier}`}
													type="text"
													value={currentColor}
													onChange={event => handleColorChange(tier, event.target.value)}
													className="w-20 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-xs text-white font-mono text-center uppercase focus:border-sky-400 focus:outline-none"
												/>
											</div>
										</div>
									)
								})}
							</div>

							{/* Gradient Strip Preview */}
							<div className="mt-4 pt-3 border-t border-neutral-800/60">
								<div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
									<span>Gradient Scale Preview:</span>
									<span className="font-mono">{config.starColors[1]} → {config.starColors[13]}</span>
								</div>
								<div className="grid grid-cols-6 h-4 rounded-md overflow-hidden border border-neutral-800">
									{STAR_POINT_TIERS.map(tier => (
										<div
											key={tier}
											style={{ backgroundColor: config.starColors[tier] }}
											title={`★ ${tier} pts: ${config.starColors[tier]}`}
										/>
									))}
								</div>
							</div>
						</IonCardContent>
					</IonCard>

					{/* Section 3: Starship Hull Coordination */}
					<IonCard className="m-0 border border-neutral-800 bg-neutral-900/60 rounded-2xl">
						<IonCardHeader className="pb-3 border-b border-neutral-800/80">
							<div className="flex items-center justify-between">
								<div>
									<IonCardTitle className="text-base text-white font-bold">
										Starship Hull Coordination
									</IonCardTitle>
									<IonCardSubtitle className="text-xs text-neutral-400">
										Tune cockpit trim and base fleet skin
									</IonCardSubtitle>
								</div>
								<div className="flex gap-1.5">
									{SHIP_ARCHETYPE_IDS.map(archetypeKey => (
										<button
											key={archetypeKey}
											type="button"
											onClick={() => setPreviewArchetypeId(archetypeKey)}
											className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors ${
												previewArchetypeId === archetypeKey
													? 'bg-amber-400 text-neutral-950 font-bold'
													: 'bg-neutral-800 text-neutral-400 hover:text-white'
											}`}
										>
											{archetypeKey.replace(/_mk1/g, '').replace(/_/g, ' ')}
										</button>
									))}
								</div>
							</div>
						</IonCardHeader>

						<IonCardContent className="pt-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
								<div className="space-y-4">
									<div>
										<label className="block text-xs font-semibold text-neutral-300 mb-1.5">
											Base Ship Skin
										</label>
										<div className="grid grid-cols-2 gap-2">
											{SHIP_SKIN_IDS.map(skinId => {
												const isSelected = config.shipSkinId === skinId
												return (
													<button
														key={skinId}
														type="button"
														onClick={() => setConfig({ ...config, shipSkinId: skinId })}
														className={`px-3 py-2 rounded-xl text-left border text-xs capitalize transition-all ${
															isSelected
																? 'border-amber-400 bg-amber-950/40 text-amber-200 font-bold'
																: 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
														}`}
													>
														{skinId.replace(/_/g, ' ')}
													</button>
												)
											})}
										</div>
									</div>

									<div>
										<label className="block text-xs font-semibold text-neutral-300 mb-1.5">
											Secondary Trim Accent
										</label>
										<div className="flex items-center gap-2">
											<input
												type="color"
												aria-label="Secondary trim accent color"
												value={config.shipSecondaryTrim}
												onChange={event =>
													setConfig({
														...config,
														shipSecondaryTrim: event.target.value,
													})
												}
												className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
											/>
											<input
												type="text"
												value={config.shipSecondaryTrim}
												onChange={event =>
													setConfig({
														...config,
														shipSecondaryTrim: event.target.value,
													})
												}
												className="w-28 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-white font-mono uppercase focus:border-amber-400 focus:outline-none"
											/>
										</div>
									</div>
								</div>

								<div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-[#050b14] to-[#020509] border border-neutral-800/80">
									<div className="h-32 flex items-center justify-center">
										<ModularStarship
											loadout={{
												hullArchetype: previewArchetypeId,
												skinId: config.shipSkinId,
											}}
											size={96}
										/>
									</div>
									<span className="text-xs font-mono text-neutral-400 mt-2">
										{SHIP_SOCKET_MANIFESTS[previewArchetypeId]?.name}
									</span>
								</div>
							</div>
						</IonCardContent>
					</IonCard>

					{/* Section 4: Communication & Export Output */}
					<IonCard className="m-0 border border-neutral-800 bg-neutral-900/60 rounded-2xl">
						<IonCardHeader className="pb-3 border-b border-neutral-800/80">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div>
									<IonCardTitle className="text-base text-white font-bold">
										Communicate / Export Theme
									</IonCardTitle>
									<IonCardSubtitle className="text-xs text-neutral-400">
										Copy ready-to-paste prompt or code to send to the assistant
									</IonCardSubtitle>
								</div>

								{/* Export Tab Switcher */}
								<div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
									<button
										type="button"
										onClick={() => setActiveExportTab('prompt')}
										className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
											activeExportTab === 'prompt'
												? 'bg-sky-500 text-white shadow'
												: 'text-neutral-400 hover:text-white'
										}`}
									>
										Chat Prompt
									</button>
									<button
										type="button"
										onClick={() => setActiveExportTab('ts')}
										className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
											activeExportTab === 'ts'
												? 'bg-sky-500 text-white shadow'
												: 'text-neutral-400 hover:text-white'
										}`}
									>
										TypeScript
									</button>
									<button
										type="button"
										onClick={() => setActiveExportTab('json')}
										className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
											activeExportTab === 'json'
												? 'bg-sky-500 text-white shadow'
												: 'text-neutral-400 hover:text-white'
										}`}
									>
										JSON
									</button>
								</div>
							</div>
						</IonCardHeader>

						<IonCardContent className="pt-4 space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-xs text-neutral-400">
									{activeExportTab === 'prompt' &&
										'Copy this text and paste it directly into our chat conversation to integrate this theme.'}
									{activeExportTab === 'ts' &&
										'Copy this TypeScript object to paste into components/theme/starPointsThemes.ts.'}
									{activeExportTab === 'json' &&
										'Copy standard JSON format for external tooling or backup.'}
								</span>

								<IonButton
									data-testid="theme-builder-copy-button"
									size="small"
									color="primary"
									onClick={() =>
										handleCopyToClipboard(
											activeExportText,
											activeExportTab === 'prompt'
												? 'AI Assistant Prompt'
												: activeExportTab === 'ts'
													? 'TypeScript Definition'
													: 'JSON Definition',
										)
									}
									className="font-bold shrink-0"
								>
									<IonIcon icon={clipboardOutline} slot="start" />
									Copy {activeExportTab.toUpperCase()}
								</IonButton>
							</div>

							<div className="relative">
								<pre
									data-testid="theme-builder-export-preview"
									className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs text-neutral-200 font-mono overflow-x-auto max-h-72 select-all leading-relaxed"
								>
									{activeExportText}
								</pre>
							</div>

							<div className="pt-2 flex items-center justify-between border-t border-neutral-800/80">
								<div className="text-xs text-neutral-400">
									Want to see it in action across the whole app right now?
								</div>
								<IonButton
									data-testid="theme-builder-test-live-button"
									fill="clear"
									color="success"
									size="small"
									onClick={handleApplyLiveSession}
									className="font-bold"
								>
									<IonIcon icon={flashSharp} slot="start" />
									Apply Live to Current App Session
								</IonButton>
							</div>
						</IonCardContent>
					</IonCard>
				</div>
			</IonContent>
		</IonPage>
	)
}

export default DevThemeBuilder
