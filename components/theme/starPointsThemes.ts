'use client'

import { useEffect, useState } from 'react'
import type {
	BiomePalette,
	BiomePaletteId,
	ShipColorPalette,
	ShipSkinId,
} from '../assets/types'

export type StarPointsThemeId =
	| 'redshift'
	| 'stellar_spectrum'
	| 'outrun_synthwave'
	| 'bioluminescent_abyss'
	| 'solar_forge'

export type StarPointTier = 1 | 2 | 3 | 5 | 8 | 13

export interface StarPointsThemeDefinition {
	id: StarPointsThemeId
	name: string
	subtitle: string
	description: string
	starColors: Record<StarPointTier, string>
	shipSkinId: ShipSkinId
	shipPalette: ShipColorPalette
}

export const STAR_POINTS_THEME_IDS: StarPointsThemeId[] = [
	'redshift',
	'stellar_spectrum',
	'outrun_synthwave',
	'bioluminescent_abyss',
	'solar_forge',
]

export const STAR_POINT_TIERS: StarPointTier[] = [1, 2, 3, 5, 8, 13]

const STORAGE_KEY = 'starfocus:star-points-theme'
const THEME_EVENT_NAME = 'starfocus-theme-change'

export const STAR_POINTS_THEMES: Record<
	StarPointsThemeId,
	StarPointsThemeDefinition
> = {
	redshift: {
		id: 'redshift',
		name: 'Redshift Classic',
		subtitle: 'Rose Coral → Fuchsia Nebula → Celestial Blue',
		description:
			'Signature StarFocus cosmological redshift spectrum: warm rose-coral entry tasks shifting through magenta and violet into high-energy indigo and celestial blue.',
		starColors: {
			1: '#fb7185',
			2: '#f472b6',
			3: '#e879f9',
			5: '#a78bfa',
			8: '#60a5fa',
			13: '#38bdf8',
		},
		shipSkinId: 'vanguard_cyan',
		shipPalette: {
			id: 'vanguard_cyan',
			name: 'Redshift Command',
			tagline: 'Titanium-slate fleet hull with rose-magenta livery & celestial cyan ion core',
			primaryHullRed: '#e2e8f0',
			secondaryTrimGreen: '#e879f9',
			emissiveCockpitBlue: '#38bdf8',
			outlineDark: '#09090b',
			hullPrimary: '#1e293b',
			hullSecondary: '#475569',
			hullHighlight: '#f1f5f9',
			accentStripe: '#ec4899',
			cockpitGlow: '#38bdf8',
			thrusterPlume: '#38bdf8',
		},
	},
	stellar_spectrum: {
		id: 'stellar_spectrum',
		name: 'Stellar OBAFGKM',
		subtitle: 'M-Class Crimson → Solar Gold → O-Class Violet',
		description:
			'Astrophysical Harvard stellar classification scale: cool M-class red dwarfs for 1pt tasks ascending through solar gold and emerald into supergiant cyan and relativistic violet.',
		starColors: {
			1: '#ef4444',
			2: '#f97316',
			3: '#eab308',
			5: '#10b981',
			8: '#06b6d4',
			13: '#8b5cf6',
		},
		shipSkinId: 'solar_ember',
		shipPalette: {
			id: 'solar_ember',
			name: 'Helios Observatory',
			tagline: 'Obsidian armor with solar gold trim, cyan optics & relativistic plasma',
			primaryHullRed: '#f8fafc',
			secondaryTrimGreen: '#eab308',
			emissiveCockpitBlue: '#06b6d4',
			outlineDark: '#09090b',
			hullPrimary: '#18181b',
			hullSecondary: '#3f3f46',
			hullHighlight: '#f4f4f5',
			accentStripe: '#eab308',
			cockpitGlow: '#06b6d4',
			thrusterPlume: '#8b5cf6',
		},
	},
	outrun_synthwave: {
		id: 'outrun_synthwave',
		name: 'Outrun Synthwave',
		subtitle: 'Arcade Gold → Laser Magenta → Hyper Grid Cyan',
		description:
			'High-contrast 80s arcade horizon palette: sunset gold and tangerine stepping into hot laser rose, neon magenta, ultraviolet, and electric cyan.',
		starColors: {
			1: '#facc15',
			2: '#fb923c',
			3: '#f43f5e',
			5: '#d946ef',
			8: '#8b5cf6',
			13: '#00f5d4',
		},
		shipSkinId: 'nebula_violet',
		shipPalette: {
			id: 'nebula_violet',
			name: 'Outrun Interceptor',
			tagline: 'Midnight synth-indigo hull with laser magenta stripes & hyper-cyan drive',
			primaryHullRed: '#f3e8ff',
			secondaryTrimGreen: '#d946ef',
			emissiveCockpitBlue: '#00f5d4',
			outlineDark: '#09090b',
			hullPrimary: '#1e1b4b',
			hullSecondary: '#3730a3',
			hullHighlight: '#ede9fe',
			accentStripe: '#f43f5e',
			cockpitGlow: '#00f5d4',
			thrusterPlume: '#d946ef',
		},
	},
	bioluminescent_abyss: {
		id: 'bioluminescent_abyss',
		name: 'Bioluminescent Abyss',
		subtitle: 'Spore Lime → Abyssal Teal → Void Orchid',
		description:
			'Deep-space xenobiology palette: glowing chartreuse and emerald flora transitioning into Cerenkov azure, deep sapphire, and luminous orchid.',
		starColors: {
			1: '#a3e635',
			2: '#34d399',
			3: '#2dd4bf',
			5: '#38bdf8',
			8: '#818cf8',
			13: '#e879f9',
		},
		shipSkinId: 'terran_sage',
		shipPalette: {
			id: 'terran_sage',
			name: 'Xenobiology Explorer',
			tagline: 'Deep abyssal composite hull with bioluminescent teal & orchid core',
			primaryHullRed: '#ecfdf5',
			secondaryTrimGreen: '#2dd4bf',
			emissiveCockpitBlue: '#e879f9',
			outlineDark: '#09090b',
			hullPrimary: '#0f2922',
			hullSecondary: '#1f4d3d',
			hullHighlight: '#d1fae5',
			accentStripe: '#34d399',
			cockpitGlow: '#38bdf8',
			thrusterPlume: '#2dd4bf',
		},
	},
	solar_forge: {
		id: 'solar_forge',
		name: 'Solar Forge',
		subtitle: 'Smelted Bronze → Molten Amber → White-Hot Gold',
		description:
			'Industrial stellar forge palette: warm copper and smelted bronze igniting through molten amber, crimson plasma, and blinding white-gold singularity.',
		starColors: {
			1: '#d97706',
			2: '#f97316',
			3: '#fbbf24',
			5: '#ef4444',
			8: '#fb7185',
			13: '#fef08a',
		},
		shipSkinId: 'stealth_obsidian',
		shipPalette: {
			id: 'stealth_obsidian',
			name: 'Obsidian Forge',
			tagline: 'Matte carbon stealth plating with molten amber & solar gold plasma',
			primaryHullRed: '#cbd5e1',
			secondaryTrimGreen: '#f59e0b',
			emissiveCockpitBlue: '#fef08a',
			outlineDark: '#050507',
			hullPrimary: '#090d16',
			hullSecondary: '#1e293b',
			hullHighlight: '#94a3b8',
			accentStripe: '#ef4444',
			cockpitGlow: '#fbbf24',
			thrusterPlume: '#f97316',
		},
	},
}

let activeThemeIdMemory: StarPointsThemeId = 'redshift'

export function isValidStarPointsThemeId(
	candidate: unknown,
): candidate is StarPointsThemeId {
	return (
		typeof candidate === 'string' &&
		STAR_POINTS_THEME_IDS.includes(candidate as StarPointsThemeId)
	)
}

export function getActiveStarPointsThemeId(): StarPointsThemeId {
	if (typeof window !== 'undefined') {
		try {
			const attr = document.documentElement.getAttribute('data-star-theme')
			if (isValidStarPointsThemeId(attr)) {
				activeThemeIdMemory = attr
				return attr
			}
			const stored = window.localStorage.getItem(STORAGE_KEY)
			if (isValidStarPointsThemeId(stored)) {
				activeThemeIdMemory = stored
				return stored
			}
		} catch {}
	}
	return activeThemeIdMemory
}

export function getActiveStarPointsTheme(): StarPointsThemeDefinition {
	return STAR_POINTS_THEMES[getActiveStarPointsThemeId()]
}

export function setActiveStarPointsThemeId(themeId: StarPointsThemeId): void {
	const resolvedId: StarPointsThemeId = isValidStarPointsThemeId(themeId)
		? themeId
		: 'redshift'
	activeThemeIdMemory = resolvedId

	if (typeof window !== 'undefined') {
		try {
			window.localStorage.setItem(STORAGE_KEY, resolvedId)
		} catch {}
		applyStarPointsThemeToDocument(resolvedId)
		window.dispatchEvent(
			new CustomEvent(THEME_EVENT_NAME, { detail: { themeId: resolvedId } }),
		)
	}
}

export function applyStarPointsThemeToDocument(
	themeId: StarPointsThemeId = getActiveStarPointsThemeId(),
): void {
	if (typeof document === 'undefined') return
	const resolvedId: StarPointsThemeId = isValidStarPointsThemeId(themeId)
		? themeId
		: 'redshift'
	const theme = STAR_POINTS_THEMES[resolvedId]
	const root = document.documentElement
	root.setAttribute('data-star-theme', resolvedId)
	root.style.setProperty('--star-1', theme.starColors[1])
	root.style.setProperty('--star-2', theme.starColors[2])
	root.style.setProperty('--star-3', theme.starColors[3])
	root.style.setProperty('--star-5', theme.starColors[5])
	root.style.setProperty('--star-8', theme.starColors[8])
	root.style.setProperty('--star-13', theme.starColors[13])
}

export function snapToStarPointTier(starPoints?: number): StarPointTier {
	if (
		starPoints === undefined ||
		!Number.isFinite(starPoints) ||
		starPoints <= 1
	) {
		return 1
	}
	const clamped = Math.min(13, Math.max(1, Math.round(starPoints)))
	if (clamped === 2) return 2
	if (clamped <= 4) return 3
	if (clamped <= 7) return 5
	if (clamped <= 10) return 8
	return 13
}

export function resolveStarPointsColor(
	starPoints?: number,
	themeId?: StarPointsThemeId,
): string {
	const resolvedThemeId =
		themeId && isValidStarPointsThemeId(themeId)
			? themeId
			: getActiveStarPointsThemeId()
	const tier = snapToStarPointTier(starPoints)
	return STAR_POINTS_THEMES[resolvedThemeId].starColors[tier]
}

export function resolveStarPointCelestialPalette(
	starPoints?: number,
	themeId?: StarPointsThemeId,
): BiomePalette {
	const resolvedThemeId =
		themeId && isValidStarPointsThemeId(themeId)
			? themeId
			: getActiveStarPointsThemeId()
	const tier = snapToStarPointTier(starPoints)
	const primaryHex = STAR_POINTS_THEMES[resolvedThemeId].starColors[tier]
	const [red, green, blue] = parseHexRgb(primaryHex)

	const deepShadow = formatRgbHex(
		Math.round(red * 0.16 + 7),
		Math.round(green * 0.16 + 9),
		Math.round(blue * 0.2 + 19),
	)
	const midtone = formatRgbHex(
		Math.round(red * 0.56 + 12),
		Math.round(green * 0.54 + 14),
		Math.round(blue * 0.58 + 24),
	)
	const highlight = primaryHex
	const emissiveOrAtmos = formatRgbHex(
		Math.min(255, Math.round(red * 0.48 + 255 * 0.52)),
		Math.min(255, Math.round(green * 0.48 + 252 * 0.52)),
		Math.min(255, Math.round(blue * 0.48 + 255 * 0.52)),
	)

	const legacyBiomeMap: Record<StarPointTier, BiomePaletteId> = {
		1: 'urgent',
		2: 'urgent',
		3: 'growth',
		5: 'strategy',
		8: 'engineering',
		13: 'engineering',
	}

	return {
		id: legacyBiomeMap[tier],
		label: `${tier} ${tier === 1 ? 'pt' : 'pts'} (${STAR_POINTS_THEMES[resolvedThemeId].name})`,
		categoryDescription: `${STAR_POINTS_THEMES[resolvedThemeId].name} • ${tier} Star ${tier === 1 ? 'Point' : 'Points'}`,
		deepShadow,
		midtone,
		highlight,
		emissiveOrAtmos,
	}
}

export function useStarPointsTheme(): {
	themeId: StarPointsThemeId
	theme: StarPointsThemeDefinition
	setThemeId: (nextThemeId: StarPointsThemeId) => void
} {
	const [themeId, setThemeIdState] = useState<StarPointsThemeId>(() =>
		getActiveStarPointsThemeId(),
	)

	useEffect(() => {
		const initialTheme = getActiveStarPointsThemeId()
		applyStarPointsThemeToDocument(initialTheme)

		const handleThemeChange = (event: Event) => {
			const customEvent = event as CustomEvent<{ themeId?: StarPointsThemeId }>
			const nextId = customEvent.detail?.themeId ?? getActiveStarPointsThemeId()
			if (isValidStarPointsThemeId(nextId)) {
				setThemeIdState(nextId)
			}
		}

		window.addEventListener(THEME_EVENT_NAME, handleThemeChange)
		return () => {
			window.removeEventListener(THEME_EVENT_NAME, handleThemeChange)
		}
	}, [])

	return {
		themeId,
		theme: STAR_POINTS_THEMES[themeId],
		setThemeId: setActiveStarPointsThemeId,
	}
}

function parseHexRgb(hex: string): [number, number, number] {
	const normalized = hex.replace('#', '').trim()
	if (normalized.length !== 6) {
		return [56, 189, 248]
	}
	const numeric = Number.parseInt(normalized, 16)
	if (Number.isNaN(numeric)) {
		return [56, 189, 248]
	}
	return [(numeric >> 16) & 255, (numeric >> 8) & 255, numeric & 255]
}

function formatRgbHex(red: number, green: number, blue: number): string {
	const clampByte = (value: number) =>
		Math.max(0, Math.min(255, Math.round(value)))
			.toString(16)
			.padStart(2, '0')
	return `#${clampByte(red)}${clampByte(green)}${clampByte(blue)}`
}
