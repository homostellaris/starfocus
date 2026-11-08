'use client'

import {
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardSubtitle,
	IonCardTitle,
	IonContent,
	IonPage,
} from '@ionic/react'
import React, { useMemo, useState } from 'react'
import ModularStarship from '../assets/ModularStarship'
import PlanetAsset from '../assets/PlanetAsset'
import {
	BIOME_PALETTES,
	CELESTIAL_CLASS_LABELS,
	CELESTIAL_POINT_TIERS,
	generateProceduralPlanetSpec,
} from '../assets/planetGenerator'
import {
	SHIP_ARCHETYPE_LIST,
	SHIP_CATALOG,
	SHIP_SKIN_LIST,
	SHIP_SKINS,
} from '../assets/shipAssembler'
import type {
	BiomePaletteId,
	ShipArchetypeId,
	ShipSkinId,
} from '../assets/types'
import { Header } from '../common/Header'
import type { StarRole, Todo } from '../db'

export interface TestTodoShowcaseItem {
	todo: Todo
	starRoleId: string
	starRoleGroupTitle: string
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
			id: 'todo-quick-chore-01',
			title: 'Reply to crew telemetry ping',
			starPoints: 1,
			starRole: 'role-urgent',
		},
		starRoleId: 'role-urgent',
		starRoleGroupTitle: 'Urgent Operations',
		notes: '1pt Task -> Asteroid',
	},
	{
		todo: {
			id: 'todo-dwarf-planet-02',
			title: 'Prune stale branch worktrees',
			starPoints: 2,
			starRole: 'role-engineering',
		},
		starRoleId: 'role-engineering',
		starRoleGroupTitle: 'Reality sculptor',
		notes: '2pt Task -> Small Rocky / Dwarf Planet',
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
		notes: '3pt Task -> Medium Planet',
	},
	{
		todo: {
			id: 'todo-gas-giant-roadmap-05',
			title: 'Draft Q4 StarFocus product roadmap',
			starPoints: 5,
			starRole: 'role-strategy',
		},
		starRoleId: 'role-strategy',
		starRoleGroupTitle: 'Strategic Command',
		notes: '5pt Task -> Ringed Gas Giant',
	},
	{
		todo: {
			id: 'todo-star-08',
			title: 'Implement offscreen 128x128 LRU planet bitmap cache',
			starPoints: 8,
			starRole: 'role-engineering',
		},
		starRoleId: 'role-engineering',
		starRoleGroupTitle: 'Reality sculptor',
		notes: '8pt Task -> Star with solar corona',
	},
	{
		todo: {
			id: 'tds0Q5i__n4r2jYrf8JQB_p2z|ucom',
			title: 'Procedural game-friendly visual assets',
			starPoints: 13,
			starRole: 'role-engineering',
		},
		starRoleId: 'role-engineering',
		starRoleGroupTitle: 'Reality sculptor',
		notes: '13pt Task -> Black Hole with accretion disk',
	},
]

export function createCustomTestTodoItem({
	id,
	title,
	starPoints,
	biomeId,
}: {
	id: string
	title: string
	starPoints: number
	biomeId: BiomePaletteId
}): TestTodoShowcaseItem {
	const safeId =
		typeof id === 'string' && id.trim().length > 0
			? id.trim()
			: `custom-seed-${Math.abs(starPoints || 1)}`
	const safeTitle =
		typeof title === 'string' && title.trim().length > 0
			? title.trim()
			: 'Untitled Test Objective'
	const clampedPoints = Number.isFinite(starPoints)
		? Math.max(1, Math.min(13, Math.trunc(starPoints)))
		: 1
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
		notes: `Custom generated ${clampedPoints}pt task (${BIOME_PALETTES[validBiome].label})`,
	}
}

export default function DevProceduralAssets() {
	const [selectedBiome] =
		useState<BiomePaletteId>('engineering')
	const [selectedHull, setSelectedHull] = useState<ShipArchetypeId>(
		'interceptor_vanguard_mk1',
	)
	const [selectedSkin, setSelectedSkin] =
		useState<ShipSkinId>('vanguard_cyan')

	const tierSpecs = useMemo(
		() =>
			CELESTIAL_POINT_TIERS.map((points) => {
				const item = createCustomTestTodoItem({
					id: `tier-${points}`,
					title: `${points}pt Celestial Body`,
					starPoints: points,
					biomeId: selectedBiome,
				})
				const role =
					TEST_STAR_ROLES.find((candidate) => candidate.id === item.starRoleId) ??
					TEST_STAR_ROLES[0]
				const spec = generateProceduralPlanetSpec({
					todo: item.todo,
					starRole: role,
					starRoleGroupTitle: item.starRoleGroupTitle,
				})
				return { item, spec }
			}),
		[selectedBiome],
	)

	return (
		<IonPage id="main-content">
			<Header
				title="Procedural Visual Assets"
				backHref="/dev/components"
				hideActions
			/>
			<IonContent fullscreen>
				<div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
					<IonCard className="m-0 border border-neutral-800 bg-neutral-900/70">
						<IonCardHeader>
							<IonCardSubtitle className="text-sky-400">
								1pt - 13pt Celestial Body Progression
							</IonCardSubtitle>
							<IonCardTitle className="text-white">
								Raw Celestial Bodies
							</IonCardTitle>
						</IonCardHeader>
						<IonCardContent>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
								{tierSpecs.map(({ item, spec }) => (
									<div
										key={spec.starPoints}
										className="flex flex-col items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950/80 p-3"
									>
										<PlanetAsset
											todo={item.todo}
											biomeOverride={selectedBiome}
											size={84}
										/>
										<span className="text-xs font-mono text-sky-300">
											{spec.starPoints} pts
										</span>
										<span className="text-xs text-neutral-300 text-center">
											{CELESTIAL_CLASS_LABELS[spec.celestialClass]}
										</span>
									</div>
								))}
							</div>
						</IonCardContent>
					</IonCard>

					<IonCard className="m-0 border border-neutral-800 bg-neutral-900/70">
						<IonCardHeader>
							<IonCardSubtitle className="text-sky-400">
								Assembled Hulls & Skins
							</IonCardSubtitle>
							<IonCardTitle className="text-white">Starships</IonCardTitle>
						</IonCardHeader>
						<IonCardContent className="space-y-4">
							<div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
								{SHIP_ARCHETYPE_LIST.map((hullId) => (
									<button
										key={hullId}
										type="button"
										onClick={() => setSelectedHull(hullId)}
										className={`flex flex-col items-center gap-2 rounded-xl border p-3 ${
											selectedHull === hullId
												? 'border-sky-400 bg-sky-500/10'
												: 'border-neutral-800 bg-neutral-950/80'
										}`}
									>
										<ModularStarship
											loadout={{
												hullArchetype: hullId,
												skinId: selectedSkin,
											}}
											size={72}
										/>
										<span className="text-xs text-neutral-200">
											{SHIP_CATALOG[hullId].name}
										</span>
									</button>
								))}
							</div>
							<div className="flex flex-wrap gap-2">
								{SHIP_SKIN_LIST.map((skinId) => (
									<button
										key={skinId}
										type="button"
										onClick={() => setSelectedSkin(skinId)}
										className={`rounded-lg border px-3 py-1.5 text-xs ${
											selectedSkin === skinId
												? 'border-sky-400 bg-sky-500/15 text-sky-300'
												: 'border-neutral-800 bg-neutral-950 text-neutral-300'
										}`}
									>
										{SHIP_SKINS[skinId].name}
									</button>
								))}
							</div>
						</IonCardContent>
					</IonCard>
				</div>
			</IonContent>
		</IonPage>
	)
}
