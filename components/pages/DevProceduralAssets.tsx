'use client'

import {
	IonBadge,
	IonButton,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardSubtitle,
	IonCardTitle,
	IonChip,
	IonContent,
	IonIcon,
	IonInput,
	IonLabel,
	IonPage,
} from '@ionic/react'
import {
	flashSharp,
	gameControllerSharp,
	layersSharp,
	planetSharp,
	refreshSharp,
	rocketSharp,
	sparklesSharp,
	speedometerSharp,
} from 'ionicons/icons'
import React, { useMemo, useState } from 'react'
import SpaceArcadeCanvas from '../arcade/SpaceArcadeCanvas'
import ModularStarship from '../assets/ModularStarship'
import PlanetAsset from '../assets/PlanetAsset'
import {
	BIOME_PALETTES,
	generateProceduralPlanetSpec,
} from '../assets/planetGenerator'
import {
	SHIP_COLOR_PALETTES,
	SHIP_SOCKET_MANIFESTS,
	THRUSTER_PLUME_TYPES,
	assembleShipLayers,
	resolveShipLoadout,
} from '../assets/shipAssembler'
import type {
	BatteryPerformanceTier,
	BiomePaletteId,
	ShipArchetypeId,
	ThrusterPlumeType,
} from '../assets/types'
import { useBatteryTierTicker } from '../assets/useBatteryTierTicker'
import { Header } from '../common/Header'
import type { StarRole, Todo } from '../db'

export interface TestTodoShowcaseItem {
	todo: Todo
	starRoleId: string
	starRoleGroupTitle: string
	visitCount: number
	notes: string
}

export const TEST_STAR_ROLES: StarRole[] = [
	{
		id: 'role-engineering',
		title: 'Starfocuser Engineer',
		description: 'Deep Work, Systems & Reality Sculpting',
		icon: { type: 'ionicon', name: 'code' },
	},
	{
		id: 'role-urgent',
		title: 'Urgent Ops & Bug Hunter',
		description: 'Critical Hotfixes, Incidents & Admin',
		icon: { type: 'ionicon', name: 'flameSharp' },
	},
	{
		id: 'role-growth',
		title: 'Botanist & Personal Growth',
		description: 'Health, Family, Fitness & Mindful Habits',
		icon: { type: 'ionicon', name: 'leafSharp' },
	},
	{
		id: 'role-strategy',
		title: 'Fleet Navigator & Strategy',
		description: 'Architecture, Vision & Long-Horizon Planning',
		icon: { type: 'ionicon', name: 'compassSharp' },
	},
]

const BIOME_TO_ROLE_ID: Record<BiomePaletteId, string> = {
	engineering: 'role-engineering',
	urgent: 'role-urgent',
	growth: 'role-growth',
	strategy: 'role-strategy',
}

const BIOME_TO_GROUP_TITLE: Record<BiomePaletteId, string> = {
	engineering: 'Reality sculptor',
	urgent: 'Urgent Operations',
	growth: 'Personal Vitality',
	strategy: 'Strategic Command',
}

export const DEFAULT_TEST_TODOS: TestTodoShowcaseItem[] = [
	{
		todo: {
			id: 'tds0Q5i__n4r2jYrf8JQB_p2z|ucom',
			title: 'Procedural game-friendly visual assets',
			starPoints: 13,
			starRole: 'role-engineering',
		},
		starRoleId: 'role-engineering',
		starRoleGroupTitle: 'Reality sculptor',
		visitCount: 3,
		notes: 'Spec task: 13pt Deep Work w/ 3 visits promotes to Ringed Gas Giant',
	},
	{
		todo: {
			id: 'todo-quick-chore-01',
			title: 'Reply to crew telemetry ping',
			starPoints: 1,
			starRole: 'role-urgent',
		},
		starRoleId: 'role-urgent',
		starRoleGroupTitle: 'Urgent Operations',
		visitCount: 0,
		notes: '1pt Quick Task -> Cratered Asteroid in Volcanic Magma palette',
	},
	{
		todo: {
			id: 'todo-asteroid-mining-02',
			title: 'Prune stale branch worktrees',
			starPoints: 2,
			starRole: 'role-engineering',
		},
		starRoleId: 'role-engineering',
		starRoleGroupTitle: 'Reality sculptor',
		visitCount: 1,
		notes: '2pt Quick Task -> Faceted Minor Moon with 1 orbiting visit moon',
	},
	{
		todo: {
			id: 'todo-terrestrial-garden-03',
			title: 'Morning 5km trail run & hydration',
			starPoints: 3,
			starRole: 'role-growth',
		},
		starRoleId: 'role-growth',
		starRoleGroupTitle: 'Personal Vitality',
		visitCount: 2,
		notes: '3pt Standard Task -> Terran Emerald continent & ocean biome world',
	},
	{
		todo: {
			id: 'todo-terrestrial-roadmap-05',
			title: 'Draft Q4 StarFocus product roadmap',
			starPoints: 5,
			starRole: 'role-strategy',
		},
		starRoleId: 'role-strategy',
		starRoleGroupTitle: 'Strategic Command',
		visitCount: 1,
		notes: '5pt Standard Task -> Nebula Violet terrestrial world w/ Bayer terminator',
	},
	{
		todo: {
			id: 'todo-emissive-cryo-08',
			title: 'Implement offscreen 128x128 LRU planet bitmap cache',
			starPoints: 8,
			starRole: 'role-engineering',
		},
		starRoleId: 'role-engineering',
		starRoleGroupTitle: 'Reality sculptor',
		visitCount: 2,
		notes: '8pt Deep Work -> Cryo/Bioluminescent fractured world with additive halo',
	},
	{
		todo: {
			id: 'todo-emissive-magma-13',
			title: 'Resolve zero-downtime Dexie sync conflict',
			starPoints: 13,
			starRole: 'role-urgent',
		},
		starRoleId: 'role-urgent',
		starRoleGroupTitle: 'Urgent Operations',
		visitCount: 1,
		notes: '13pt Deep Work -> Volcanic Magma fissure world with glowing tectonic veins',
	},
	{
		todo: {
			id: 'todo-gas-giant-21',
			title: 'Launch StarFocus 1.0 across Desktop & Android',
			starPoints: 21,
			starRole: 'role-strategy',
		},
		starRoleId: 'role-strategy',
		starRoleGroupTitle: 'Strategic Command',
		visitCount: 4,
		notes: '21pt Milestone -> Banded Ringed Gas Giant with z-split front/back rings & 4 moons',
	},
]

export function createCustomTestTodoItem({
	id,
	title,
	starPoints,
	biomeId,
	visitCount,
}: {
	id: string
	title: string
	starPoints: number
	biomeId: BiomePaletteId
	visitCount: number
}): TestTodoShowcaseItem {
	const safeId =
		typeof id === 'string' && id.trim().length > 0
			? id.trim()
			: `custom-seed-${ Math.abs(starPoints || 0)}`
	const safeTitle =
		typeof title === 'string' && title.trim().length > 0
			? title.trim()
			: 'Untitled Test Objective'
	const clampedPoints = Number.isFinite(starPoints)
		? Math.max(0, Math.min(34, Math.trunc(starPoints)))
		: 0
	const clampedVisits = Number.isFinite(visitCount)
		? Math.max(0, Math.min(8, Math.trunc(visitCount)))
		: 0
	const validBiome: BiomePaletteId =
		biomeId in BIOME_PALETTES ? biomeId : 'engineering'
	const starRoleId = BIOME_TO_ROLE_ID[validBiome]
	const starRoleGroupTitle = BIOME_TO_GROUP_TITLE[validBiome]

	return {
		todo: {
			id: safeId,
			title: safeTitle,
			starPoints: clampedPoints,
			starRole: starRoleId,
		},
		starRoleId,
		starRoleGroupTitle,
		visitCount: clampedVisits,
		notes: `Custom generated ${clampedPoints}pt task (${BIOME_PALETTES[validBiome].label})`,
	}
}

export default function DevProceduralAssets() {
	const [testMatrix, setTestMatrix] =
		useState<TestTodoShowcaseItem[]>(DEFAULT_TEST_TODOS)
	const [matrixHudMode, setMatrixHudMode] = useState<
		'productivity' | 'arcade' | 'none'
	>('productivity')
	const [enableDithering, setEnableDithering] = useState(true)
	const [enableAtmosphereGlow, setEnableAtmosphereGlow] = useState(true)

	// Custom Todo Lab controls
	const [customSeedId, setCustomSeedId] = useState(
		'tds0Q5i__n4r2jYrf8JQB_p2z|ucom',
	)
	const [customTitle, setCustomTitle] = useState(
		'Procedural game-friendly visual assets',
	)
	const [customStarPoints, setCustomStarPoints] = useState(13)
	const [customBiomeId, setCustomBiomeId] =
		useState<BiomePaletteId>('engineering')
	const [customVisitCount, setCustomVisitCount] = useState(2)

	// Modular Starship Paper-Doll Studio controls
	const [hullArchetype, setHullArchetype] = useState<ShipArchetypeId>(
		'interceptor_vanguard_mk1',
	)
	const [wingArchetype, setWingArchetype] = useState<ShipArchetypeId>(
		'interceptor_vanguard_mk1',
	)
	const [cockpitArchetype, setCockpitArchetype] = useState<ShipArchetypeId>(
		'interceptor_vanguard_mk1',
	)
	const [hardpointArchetype, setHardpointArchetype] = useState<ShipArchetypeId>(
		'interceptor_vanguard_mk1',
	)
	const [thrusterType, setThrusterType] =
		useState<ThrusterPlumeType>('cyan_ion')
	const [selectedPaletteIndex, setSelectedPaletteIndex] = useState(0)
	const [recoilOffsetPx, setRecoilOffsetPx] = useState(0)
	const [explodedLayers, setExplodedLayers] = useState(false)

	// Battery & Arcade Sandbox controls
	const [simulatedBatteryTier, setSimulatedBatteryTier] =
		useState<BatteryPerformanceTier>('active')
	const [sandboxArcadeActive, setSandboxArcadeActive] = useState(true)

	const customTestItem = useMemo(
		() =>
			createCustomTestTodoItem({
				id: customSeedId,
				title: customTitle,
				starPoints: customStarPoints,
				biomeId: customBiomeId,
				visitCount: customVisitCount,
			}),
		[
			customSeedId,
			customTitle,
			customStarPoints,
			customBiomeId,
			customVisitCount,
		],
	)

	const customRole = useMemo(
		() =>
			TEST_STAR_ROLES.find(role => role.id === customTestItem.starRoleId) ??
			TEST_STAR_ROLES[0],
		[customTestItem.starRoleId],
	)

	const customPlanetSpec = useMemo(
		() =>
			generateProceduralPlanetSpec({
				todo: customTestItem.todo,
				starRole: customRole,
				starRoleGroupTitle: customTestItem.starRoleGroupTitle,
				visitCount: customTestItem.visitCount,
			}),
		[customRole, customTestItem],
	)

	const currentShipLoadout = useMemo(
		() =>
			resolveShipLoadout({
				hullArchetype,
				wingArchetype,
				cockpitArchetype,
				hardpointArchetype,
				thrusterType,
				palette: SHIP_COLOR_PALETTES[selectedPaletteIndex],
			}),
		[
			hullArchetype,
			wingArchetype,
			cockpitArchetype,
			hardpointArchetype,
			thrusterType,
			selectedPaletteIndex,
		],
	)

	const assembledLayers = useMemo(
		() =>
			assembleShipLayers(currentShipLoadout, {
				recoilOffsetPx,
				thrusterFrame: 1,
			}),
		[currentShipLoadout, recoilOffsetPx],
	)

	const { telemetry, thrusterFrame } = useBatteryTierTicker({
		isArcadeActive: sandboxArcadeActive,
		tierOverride: simulatedBatteryTier,
	})

	const handleSelectArchetypePreset = (archetypeId: ShipArchetypeId) => {
		setHullArchetype(archetypeId)
		setWingArchetype(archetypeId)
		setCockpitArchetype(archetypeId)
		setHardpointArchetype(archetypeId)
		const resolved = resolveShipLoadout({ hullArchetype: archetypeId })
		setThrusterType(resolved.thrusterType)
		const paletteIndex = SHIP_COLOR_PALETTES.findIndex(
			palette => palette.id === resolved.palette.id,
		)
		if (paletteIndex >= 0) {
			setSelectedPaletteIndex(paletteIndex)
		}
	}

	const handleTriggerRecoilPulse = () => {
		setRecoilOffsetPx(2)
	}

	return (
		<IonPage id="main-content">
			<Header
				title="Procedural Visual Assets"
				backHref="/dev"
				hideActions
			/>
			<IonContent fullscreen>
				<div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
					{/* Hero Overview Banner */}
					<IonCard className="m-0 border border-neutral-800 bg-neutral-900/70 backdrop-blur">
						<IonCardContent className="p-6">
							<div className="flex flex-wrap items-center justify-between gap-4">
								<div>
									<div className="mb-2 flex items-center gap-2">
										<IonBadge color="primary">Art Direction & Engine</IonBadge>
										<IonBadge color="secondary">128×128 LRU Cache</IonBadge>
										<IonBadge color="warning">4×4 Bayer Dither</IonBadge>
									</div>
									<h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
										Procedural Game-Friendly Visual Assets Laboratory
									</h1>
									<p className="mt-1 max-w-3xl text-sm text-neutral-400">
										Every StarFocus todo deterministically generates a cached
										128×128 celestial body seeded by{' '}
										<code className="text-sky-300">todo.id</code>, tiered by{' '}
										<code className="text-sky-300">starPoints</code>, and
										colored by{' '}
										<code className="text-sky-300">starRole</code>—paired with
										the 5-layer Paper-Doll Starship socket renderer.
									</p>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									{(
										[
											{ id: 'productivity', label: 'Productivity HUD (Blue)' },
											{ id: 'arcade', label: 'Arcade Reticle (Amber)' },
											{ id: 'none', label: 'Raw Planet Only' },
										] as const
									).map(modeOption => (
										<IonChip
											key={modeOption.id}
											data-testid={`hud-mode-chip-${modeOption.id}`}
											onClick={() => setMatrixHudMode(modeOption.id)}
											color={
												matrixHudMode === modeOption.id ? 'primary' : 'medium'
											}
											outline={matrixHudMode !== modeOption.id}
											className="cursor-pointer text-xs"
										>
											<IonLabel>{modeOption.label}</IonLabel>
										</IonChip>
									))}
								</div>
							</div>
						</IonCardContent>
					</IonCard>

					{/* Section 1: Test Todo Procedural Planet Matrix */}
					<section
						data-testid="test-todo-matrix"
						className="space-y-4"
					>
						<div className="flex flex-wrap items-center justify-between gap-2">
							<div>
								<h2 className="flex items-center gap-2 text-lg font-bold text-white">
									<IonIcon icon={planetSharp} className="text-sky-400" />
									<span>Test Todo Procedural Planet Matrix</span>
								</h2>
								<p className="text-xs text-neutral-400">
									Demonstrating deterministic celestial generation across
									Fibonacci point tiers (0–21 pts), all 4 Celestial Classes, and
									all 4 Biome Palettes.
								</p>
							</div>
							<div className="flex items-center gap-2">
								<IonButton
									size="small"
									fill={enableDithering ? 'solid' : 'outline'}
									color="primary"
									data-testid="toggle-dithering"
									onClick={() => setEnableDithering(previous => !previous)}
								>
									4×4 Bayer Dither: {enableDithering ? 'ON' : 'OFF'}
								</IonButton>
								<IonButton
									size="small"
									fill={enableAtmosphereGlow ? 'solid' : 'outline'}
									color="secondary"
									data-testid="toggle-atmosphere-glow"
									onClick={() =>
										setEnableAtmosphereGlow(previous => !previous)
									}
								>
									Additive Halo: {enableAtmosphereGlow ? 'ON' : 'OFF'}
								</IonButton>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{testMatrix.map(item => {
								const role = TEST_STAR_ROLES.find(
									candidate => candidate.id === item.starRoleId,
								)
								const spec = generateProceduralPlanetSpec({
									todo: item.todo,
									starRole: role,
									starRoleGroupTitle: item.starRoleGroupTitle,
									visitCount: item.visitCount,
								})

								return (
									<IonCard
										key={item.todo.id}
										data-testid={`test-todo-card-${item.todo.id}`}
										className="m-0 flex flex-col justify-between border border-neutral-800 bg-neutral-900/90"
									>
										<IonCardHeader className="pb-2">
											<div className="flex items-center justify-between gap-2">
												<IonBadge color="primary" className="font-mono text-xs">
													{item.todo.starPoints ?? 0} pts
												</IonBadge>
												<span className="font-mono text-[11px] text-neutral-400">
													#{spec.seed.toString(16).slice(0, 8)}
												</span>
											</div>
											<IonCardTitle className="mt-2 line-clamp-2 text-sm font-bold text-white">
												{item.todo.title}
											</IonCardTitle>
											<IonCardSubtitle className="text-[11px] text-neutral-400">
												{role?.title ?? 'Unassigned Role'}
											</IonCardSubtitle>
										</IonCardHeader>
										<IonCardContent className="space-y-3 pt-1">
											<div className="flex items-center justify-center rounded-xl border border-neutral-800/90 bg-[#09090b] py-4">
												<PlanetAsset
													todo={item.todo}
													starRole={role}
													starRoleGroupTitle={item.starRoleGroupTitle}
													visitCount={item.visitCount}
													size={96}
													hudMode={matrixHudMode}
													enableDithering={enableDithering}
													enableAtmosphereGlow={enableAtmosphereGlow}
												/>
											</div>
											<div className="flex flex-wrap items-center gap-1.5">
												<IonBadge
													color="secondary"
													className="font-mono text-[10px]"
												>
													{spec.celestialClass}
												</IonBadge>
												<IonBadge
													color="tertiary"
													className="font-mono text-[10px]"
												>
													{spec.biomeId}
												</IonBadge>
												{spec.orbitingMoonCount > 0 && (
													<IonBadge
														color="warning"
														className="font-mono text-[10px]"
													>
														{spec.orbitingMoonCount} moons
													</IonBadge>
												)}
											</div>
											<p className="text-[11px] leading-relaxed text-neutral-400">
												{item.notes}
											</p>
										</IonCardContent>
									</IonCard>
								)
							})}
						</div>
					</section>

					{/* Section 2: Interactive Custom Test Todo Laboratory */}
					<IonCard
						data-testid="custom-todo-lab"
						className="m-0 border border-neutral-800 bg-neutral-900/90"
					>
						<IonCardHeader>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div>
									<IonCardTitle className="flex items-center gap-2 text-lg font-bold text-white">
										<IonIcon icon={sparklesSharp} className="text-amber-400" />
										<span>Interactive Test Todo Planet Generator</span>
									</IonCardTitle>
									<IonCardSubtitle className="text-xs text-neutral-400">
										Inspect how seed IDs, Fibonacci Star Points, Star Roles, and
										visit counts shape procedural celestial assets.
									</IonCardSubtitle>
								</div>
								<div className="flex items-center gap-2">
									<IonButton
										size="small"
										fill="outline"
										color="secondary"
										data-testid="randomize-seed-button"
										onClick={() =>
											setCustomSeedId(
												`todo-seed-${Math.random().toString(36).slice(2, 10)}`,
											)
										}
									>
										<IonIcon slot="start" icon={refreshSharp} />
										Randomize Seed
									</IonButton>
									<IonButton
										size="small"
										fill="solid"
										color="primary"
										data-testid="add-test-todo-button"
										onClick={() => {
											setTestMatrix(previous => [
												customTestItem,
												...previous.filter(
													entry => entry.todo.id !== customTestItem.todo.id,
												),
											])
										}}
									>
										Add to Test Matrix
									</IonButton>
								</div>
							</div>
						</IonCardHeader>
						<IonCardContent>
							<div className="grid gap-6 md:grid-cols-12">
								<div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-[#09090b] p-6 md:col-span-5">
									<div data-testid="custom-planet-preview">
										<PlanetAsset
											todo={customTestItem.todo}
											starRole={customRole}
											starRoleGroupTitle={customTestItem.starRoleGroupTitle}
											visitCount={customTestItem.visitCount}
											size={140}
											hudMode={matrixHudMode}
											enableDithering={enableDithering}
											enableAtmosphereGlow={enableAtmosphereGlow}
										/>
									</div>
									<div className="mt-4 w-full space-y-1.5 text-center font-mono text-xs">
										<div className="font-bold text-white">
											{customPlanetSpec.title}
										</div>
										<div className="text-sky-400">
											Class:{' '}
											<span data-testid="custom-resolved-class">
												{customPlanetSpec.celestialClass}
											</span>{' '}
											• Biome:{' '}
											<span data-testid="custom-resolved-biome">
												{customPlanetSpec.biomeId}
											</span>
										</div>
										<div className="text-neutral-400">
											Seed: 0x{customPlanetSpec.seed.toString(16)} • Moons:{' '}
											{customPlanetSpec.orbitingMoonCount} • Ring Tilt:{' '}
											{customPlanetSpec.ringTiltDegrees}°
										</div>
										<div className="flex items-center justify-center gap-2 pt-2">
											{[
												customPlanetSpec.palette.deepShadow,
												customPlanetSpec.palette.midtone,
												customPlanetSpec.palette.highlight,
												customPlanetSpec.palette.emissiveOrAtmos,
											].map(hex => (
												<span
													key={hex}
													className="inline-flex items-center gap-1 rounded border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[10px]"
												>
													<span
														className="h-2.5 w-2.5 rounded-full"
														style={{ backgroundColor: hex }}
													/>
													{hex}
												</span>
											))}
										</div>
									</div>
								</div>

								<div className="space-y-4 md:col-span-7">
									<div className="grid gap-3 sm:grid-cols-2">
										<div>
											<label className="mb-1 block text-xs font-medium text-neutral-300">
												Todo ID (Deterministic Seed)
											</label>
											<IonInput
												data-testid="custom-seed-input"
												fill="outline"
												value={customSeedId}
												onIonInput={event =>
													setCustomSeedId(String(event.detail.value ?? ''))
												}
												className="bg-neutral-950 font-mono text-xs"
											/>
										</div>
										<div>
											<label className="mb-1 block text-xs font-medium text-neutral-300">
												Todo Objective Title
											</label>
											<IonInput
												data-testid="custom-title-input"
												fill="outline"
												value={customTitle}
												onIonInput={event =>
													setCustomTitle(String(event.detail.value ?? ''))
												}
												className="bg-neutral-950 text-xs"
											/>
										</div>
									</div>

									<div>
										<label className="mb-1.5 block text-xs font-medium text-neutral-300">
											Star Points Tier (Drives Celestial Class)
										</label>
										<div className="flex flex-wrap gap-1.5">
											{[0, 1, 2, 3, 5, 8, 13, 21].map(points => (
												<IonChip
													key={points}
													data-testid={`custom-points-chip-${points}`}
													color={
														customStarPoints === points ? 'primary' : 'medium'
													}
													outline={customStarPoints !== points}
													onClick={() => setCustomStarPoints(points)}
													className="cursor-pointer font-mono text-xs"
												>
													<IonLabel>{points} pts</IonLabel>
												</IonChip>
											))}
										</div>
									</div>

									<div>
										<label className="mb-1.5 block text-xs font-medium text-neutral-300">
											Star Role / Biome Palette
										</label>
										<div className="flex flex-wrap gap-1.5">
											{(
												['engineering', 'urgent', 'growth', 'strategy'] as const
											).map(biomeKey => (
												<IonChip
													key={biomeKey}
													data-testid={`custom-biome-chip-${biomeKey}`}
													color={
														customBiomeId === biomeKey ? 'secondary' : 'medium'
													}
													outline={customBiomeId !== biomeKey}
													onClick={() => setCustomBiomeId(biomeKey)}
													className="cursor-pointer text-xs"
												>
													<IonLabel>
														{biomeKey}: {BIOME_PALETTES[biomeKey].label}
													</IonLabel>
												</IonChip>
											))}
										</div>
									</div>

									<div>
										<label className="mb-1.5 block text-xs font-medium text-neutral-300">
											Task Visits (Orbiting Moons: {customVisitCount})
										</label>
										<div className="flex flex-wrap gap-1.5">
											{[0, 1, 2, 3, 4, 6].map(visits => (
												<IonChip
													key={visits}
													data-testid={`custom-visits-chip-${visits}`}
													color={
														customVisitCount === visits ? 'warning' : 'medium'
													}
													outline={customVisitCount !== visits}
													onClick={() => setCustomVisitCount(visits)}
													className="cursor-pointer font-mono text-xs"
												>
													<IonLabel>{visits} visits</IonLabel>
												</IonChip>
											))}
										</div>
									</div>
								</div>
							</div>
						</IonCardContent>
					</IonCard>

					{/* Section 3: Modular Spaceship Paper-Doll Studio */}
					<IonCard
						data-testid="ship-paper-doll-studio"
						className="m-0 border border-neutral-800 bg-neutral-900/90"
					>
						<IonCardHeader>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div>
									<IonCardTitle className="flex items-center gap-2 text-lg font-bold text-white">
										<IonIcon icon={rocketSharp} className="text-cyan-400" />
										<span>
											Modular Spaceship &ldquo;Paper-Doll Socket System&rdquo;
										</span>
									</IonCardTitle>
									<IonCardSubtitle className="text-xs text-neutral-400">
										5-layer z-ordered assembly (z:0 Thrusters → z:1 Wings → z:2
										Hardpoints → z:3 Hull → z:4 Cockpit/Dorsal) with RGB mask
										palette swapping.
									</IonCardSubtitle>
								</div>
								<div className="flex items-center gap-2">
									<IonButton
										size="small"
										color="warning"
										data-testid="fire-recoil-button"
										onClick={handleTriggerRecoilPulse}
									>
										<IonIcon slot="start" icon={flashSharp} />
										Fire Hardpoints (y+2px Recoil)
									</IonButton>
									{recoilOffsetPx > 0 && (
										<IonButton
											size="small"
											fill="outline"
											color="medium"
											data-testid="reset-recoil-button"
											onClick={() => setRecoilOffsetPx(0)}
										>
											Reset Recoil
										</IonButton>
									)}
									<IonButton
										size="small"
										fill={explodedLayers ? 'solid' : 'outline'}
										color="tertiary"
										data-testid="toggle-exploded-layers"
										onClick={() => setExplodedLayers(previous => !previous)}
									>
										<IonIcon slot="start" icon={layersSharp} />
										Exploded Z-Layers: {explodedLayers ? 'ON' : 'OFF'}
									</IonButton>
								</div>
							</div>
						</IonCardHeader>
						<IonCardContent>
							<div className="grid gap-6 md:grid-cols-12">
								<div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-[#09090b] p-6 md:col-span-5">
									<ModularStarship
										loadout={currentShipLoadout}
										size={136}
										thrusterActive={true}
										thrusterFrame={thrusterFrame}
										hardpointRecoilOffsetPx={recoilOffsetPx}
										hudMode={matrixHudMode}
										batteryTier={telemetry.tier}
										explodedLayerSpacingPx={explodedLayers ? 8 : 0}
									/>
									<div className="mt-4 text-center font-mono text-xs">
										<div className="font-bold text-white">
											{SHIP_SOCKET_MANIFESTS[hullArchetype].name} —{' '}
											{SHIP_SOCKET_MANIFESTS[hullArchetype].roleLabel}
										</div>
										<p className="mt-1 text-[11px] text-neutral-400">
											{SHIP_SOCKET_MANIFESTS[hullArchetype].description}
										</p>
										<div className="mt-2 text-[11px] text-cyan-300">
											Active Layers: {assembledLayers.length} (z:0..z:4) •
											Hardpoint Recoil: +{recoilOffsetPx}px
										</div>
									</div>
								</div>

								<div className="space-y-4 md:col-span-7">
									<div>
										<label className="mb-1.5 block text-xs font-medium text-neutral-300">
											Canonical Ship Archetype Presets
										</label>
										<div className="flex flex-wrap gap-1.5">
											{(
												[
													'interceptor_vanguard_mk1',
													'hauler_atlas_mk1',
													'science_helios_mk1',
													'striker_wraith_mk1',
												] as const
											).map(archetypeId => (
												<IonChip
													key={archetypeId}
													data-testid={`ship-archetype-${archetypeId}`}
													color={
														hullArchetype === archetypeId
															? 'primary'
															: 'medium'
													}
													outline={hullArchetype !== archetypeId}
													onClick={() =>
														handleSelectArchetypePreset(archetypeId)
													}
													className="cursor-pointer text-xs"
												>
													<IonLabel>
														{SHIP_SOCKET_MANIFESTS[archetypeId].name}
													</IonLabel>
												</IonChip>
											))}
										</div>
									</div>

									<div>
										<label className="mb-1.5 block text-xs font-medium text-neutral-300">
											Mix-and-Match Wing Socket Module (z:1 Mirrored)
										</label>
										<div className="flex flex-wrap gap-1.5">
											{(
												[
													'interceptor_vanguard_mk1',
													'hauler_atlas_mk1',
													'science_helios_mk1',
													'striker_wraith_mk1',
												] as const
											).map(archetypeId => (
												<IonChip
													key={archetypeId}
													data-testid={`wing-socket-${archetypeId}`}
													color={
														wingArchetype === archetypeId
															? 'secondary'
															: 'medium'
													}
													outline={wingArchetype !== archetypeId}
													onClick={() => setWingArchetype(archetypeId)}
													className="cursor-pointer text-xs"
												>
													<IonLabel>
														{SHIP_SOCKET_MANIFESTS[archetypeId].name} Wings
													</IonLabel>
												</IonChip>
											))}
										</div>
									</div>

									<div>
										<label className="mb-1.5 block text-xs font-medium text-neutral-300">
											Thruster Plume Variant (z:0 Additive Blend)
										</label>
										<div className="flex flex-wrap gap-1.5">
											{THRUSTER_PLUME_TYPES.map(plume => (
												<IonChip
													key={plume}
													data-testid={`thruster-type-${plume}`}
													color={thrusterType === plume ? 'warning' : 'medium'}
													outline={thrusterType !== plume}
													onClick={() => setThrusterType(plume)}
													className="cursor-pointer font-mono text-xs"
												>
													<IonLabel>{plume}</IonLabel>
												</IonChip>
											))}
										</div>
									</div>

									<div>
										<label className="mb-1.5 block text-xs font-medium text-neutral-300">
											4-Channel RGB Mask Color Palette
										</label>
										<div className="flex flex-wrap gap-1.5">
											{SHIP_COLOR_PALETTES.map((palette, index) => (
												<IonChip
													key={palette.id}
													data-testid={`ship-palette-${palette.id}`}
													color={
														selectedPaletteIndex === index
															? 'success'
															: 'medium'
													}
													outline={selectedPaletteIndex !== index}
													onClick={() => setSelectedPaletteIndex(index)}
													className="cursor-pointer text-xs"
												>
													<span
														className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
														style={{
															backgroundColor: palette.secondaryTrimGreen,
														}}
													/>
													<IonLabel>{palette.name}</IonLabel>
												</IonChip>
											))}
										</div>
									</div>
								</div>
							</div>
						</IonCardContent>
					</IonCard>

					{/* Section 4: 3-Tier Battery Scheduler & Embedded Arcade Flight Sandbox */}
					<IonCard
						data-testid="battery-and-arcade-sandbox"
						className="m-0 border border-neutral-800 bg-neutral-900/90"
					>
						<IonCardHeader>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div>
									<IonCardTitle className="flex items-center gap-2 text-lg font-bold text-white">
										<IonIcon
											icon={gameControllerSharp}
											className="text-amber-400"
										/>
										<span>
											3-Tier Battery Scheduler & Playable Arcade Sector Sandbox
										</span>
									</IonCardTitle>
									<IonCardSubtitle className="text-xs text-neutral-400">
										Fly your customized modular starship around the generated
										test todo planets and test 60fps Active, 30fps Battery
										Saver, and 0fps Idle Sleep modes.
									</IonCardSubtitle>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									{(
										[
											{ id: 'active', label: 'Active (60fps)' },
											{ id: 'battery_saver', label: 'Battery Saver (30fps)' },
											{ id: 'idle', label: 'Idle Sleep (0fps)' },
										] as const
									).map(tierOption => (
										<IonChip
											key={tierOption.id}
											data-testid={`battery-tier-${tierOption.id}`}
											color={
												simulatedBatteryTier === tierOption.id
													? 'primary'
													: 'medium'
											}
											outline={simulatedBatteryTier !== tierOption.id}
											onClick={() => setSimulatedBatteryTier(tierOption.id)}
											className="cursor-pointer font-mono text-xs"
										>
											<IonIcon icon={speedometerSharp} className="mr-1" />
											<IonLabel>{tierOption.label}</IonLabel>
										</IonChip>
									))}
									<IonButton
										size="small"
										color={sandboxArcadeActive ? 'warning' : 'medium'}
										data-testid="sandbox-arcade-toggle"
										onClick={() =>
											setSandboxArcadeActive(previous => !previous)
										}
									>
										{sandboxArcadeActive
											? 'Pause Arcade Loop'
											: 'Resume Arcade Loop'}
									</IonButton>
								</div>
							</div>
						</IonCardHeader>
						<IonCardContent className="space-y-4">
							<div
								data-testid="battery-telemetry-readout"
								className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 font-mono text-xs text-neutral-300"
							>
								<span>
									Performance Tier:{' '}
									<strong className="text-sky-400">{telemetry.tier}</strong>
								</span>
								<span>
									Target Frame Rate:{' '}
									<strong className="text-emerald-400">
										{telemetry.targetFps} FPS
									</strong>
								</span>
								<span>
									Particle Ring Pool:{' '}
									<strong className="text-amber-400">
										{telemetry.activeParticleCount} /{' '}
										{telemetry.maxParticlePoolSize}
									</strong>
								</span>
							</div>

							<SpaceArcadeCanvas
								active={sandboxArcadeActive}
								todos={testMatrix.map(item => item.todo)}
								starRoles={TEST_STAR_ROLES}
								shipLoadout={currentShipLoadout}
								batteryTierOverride={simulatedBatteryTier}
								className="h-[420px] w-full"
							/>
						</IonCardContent>
					</IonCard>
				</div>
			</IonContent>
		</IonPage>
	)
}
