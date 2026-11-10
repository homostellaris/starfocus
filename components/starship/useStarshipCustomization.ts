'use client'

import { useEffect, useState } from 'react'
import {
	SHIP_ARCHETYPE_IDS,
	SHIP_SKIN_IDS,
} from '../assets/shipAssembler'
import type {
	ShipArchetypeId,
	ShipLoadoutConfig,
	ShipSkinId,
} from '../assets/types'
import {
	FLIGHT_STAGING_MODES,
	type FlightStagingMode,
} from './orbitalMechanics'

const ARCHETYPE_STORAGE_KEY = 'starfocus_starship_archetype'
const SKIN_STORAGE_KEY = 'starfocus_starship_skin'
const STAGING_STORAGE_KEY = 'starfocus_flight_staging_mode'
const CUSTOMIZATION_EVENT_NAME = 'starfocus-starship-change'

export function getStoredFlightStagingMode(): FlightStagingMode {
	if (typeof localStorage === 'undefined') {
		return 'kepler_orbit'
	}
	try {
		const stored = localStorage.getItem(STAGING_STORAGE_KEY)
		if (
			stored &&
			FLIGHT_STAGING_MODES.some(mode => mode.id === stored)
		) {
			return stored as FlightStagingMode
		}
	} catch {
		// Ignore local storage errors
	}
	return 'kepler_orbit'
}

export function setStoredFlightStagingMode(mode: FlightStagingMode): void {
	if (typeof localStorage !== 'undefined') {
		try {
			localStorage.setItem(STAGING_STORAGE_KEY, mode)
		} catch {
			// Ignore local storage errors
		}
	}
	if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
		window.dispatchEvent(
			new CustomEvent(CUSTOMIZATION_EVENT_NAME, {
				detail: { stagingMode: mode },
			}),
		)
	}
}

export function getStoredStarshipArchetype(): ShipArchetypeId {
	if (typeof localStorage === 'undefined') {
		return 'interceptor_vanguard_mk1'
	}
	try {
		const stored = localStorage.getItem(ARCHETYPE_STORAGE_KEY)
		if (stored && (SHIP_ARCHETYPE_IDS as string[]).includes(stored)) {
			return stored as ShipArchetypeId
		}
	} catch {
		// Ignore local storage errors
	}
	return 'interceptor_vanguard_mk1'
}

export function getStoredStarshipSkin(): ShipSkinId | undefined {
	if (typeof localStorage === 'undefined') {
		return undefined
	}
	try {
		const stored = localStorage.getItem(SKIN_STORAGE_KEY)
		if (stored && (SHIP_SKIN_IDS as string[]).includes(stored)) {
			return stored as ShipSkinId
		}
	} catch {
		// Ignore local storage errors
	}
	return undefined
}

export function setStoredStarshipArchetype(archetypeId: ShipArchetypeId): void {
	if (typeof localStorage !== 'undefined') {
		try {
			localStorage.setItem(ARCHETYPE_STORAGE_KEY, archetypeId)
		} catch {
			// Ignore local storage errors
		}
	}
	if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
		window.dispatchEvent(
			new CustomEvent(CUSTOMIZATION_EVENT_NAME, {
				detail: { archetypeId },
			}),
		)
	}
}

export function setStoredStarshipSkin(skinId: ShipSkinId | undefined): void {
	if (typeof localStorage !== 'undefined') {
		try {
			if (skinId) {
				localStorage.setItem(SKIN_STORAGE_KEY, skinId)
			} else {
				localStorage.removeItem(SKIN_STORAGE_KEY)
			}
		} catch {
			// Ignore local storage errors
		}
	}
	if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
		window.dispatchEvent(
			new CustomEvent(CUSTOMIZATION_EVENT_NAME, {
				detail: { skinId },
			}),
		)
	}
}

export function useStarshipCustomization(): {
	archetypeId: ShipArchetypeId
	skinId: ShipSkinId | undefined
	stagingMode: FlightStagingMode
	setArchetypeId: (id: ShipArchetypeId) => void
	setSkinId: (id: ShipSkinId | undefined) => void
	setStagingMode: (mode: FlightStagingMode) => void
	loadout: Partial<ShipLoadoutConfig>
} {
	const [archetypeId, setArchetypeIdState] = useState<ShipArchetypeId>(() =>
		getStoredStarshipArchetype(),
	)
	const [skinId, setSkinIdState] = useState<ShipSkinId | undefined>(() =>
		getStoredStarshipSkin(),
	)
	const [stagingMode, setStagingModeState] = useState<FlightStagingMode>(() =>
		getStoredFlightStagingMode(),
	)

	useEffect(() => {
		const handleCustomizationChange = () => {
			setArchetypeIdState(getStoredStarshipArchetype())
			setSkinIdState(getStoredStarshipSkin())
			setStagingModeState(getStoredFlightStagingMode())
		}

		window.addEventListener(CUSTOMIZATION_EVENT_NAME, handleCustomizationChange)
		window.addEventListener('storage', handleCustomizationChange)

		return () => {
			window.removeEventListener(
				CUSTOMIZATION_EVENT_NAME,
				handleCustomizationChange,
			)
			window.removeEventListener('storage', handleCustomizationChange)
		}
	}, [])

	const handleSetArchetypeId = (id: ShipArchetypeId) => {
		setStoredStarshipArchetype(id)
		setArchetypeIdState(id)
	}

	const handleSetSkinId = (id: ShipSkinId | undefined) => {
		setStoredStarshipSkin(id)
		setSkinIdState(id)
	}

	const handleSetStagingMode = (mode: FlightStagingMode) => {
		setStoredFlightStagingMode(mode)
		setStagingModeState(mode)
	}

	const loadout: Partial<ShipLoadoutConfig> = {
		hullArchetype: archetypeId,
		...(skinId ? { skinId } : {}),
	}

	return {
		archetypeId,
		skinId,
		stagingMode,
		setArchetypeId: handleSetArchetypeId,
		setSkinId: handleSetSkinId,
		setStagingMode: handleSetStagingMode,
		loadout,
	}
}
