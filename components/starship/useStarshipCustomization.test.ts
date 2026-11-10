import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
	getStoredStarshipArchetype,
	getStoredStarshipSkin,
	setStoredStarshipArchetype,
	setStoredStarshipSkin,
} from './useStarshipCustomization'

describe('useStarshipCustomization', () => {
	const store = new Map<string, string>()

	beforeEach(() => {
		store.clear()
		const storageMock = {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => store.set(key, String(value)),
			removeItem: (key: string) => store.delete(key),
			clear: () => store.clear(),
		}
		;(globalThis as any).localStorage = storageMock
	})

	afterEach(() => {
		delete (globalThis as any).localStorage
	})

	test('returns default archetype when localStorage is empty', () => {
		expect(getStoredStarshipArchetype()).toBe('interceptor_vanguard_mk1')
	})

	test('persists and retrieves selected starship archetype', () => {
		setStoredStarshipArchetype('hauler_atlas_mk1')
		expect(getStoredStarshipArchetype()).toBe('hauler_atlas_mk1')

		setStoredStarshipArchetype('striker_wraith_mk1')
		expect(getStoredStarshipArchetype()).toBe('striker_wraith_mk1')
	})

	test('persists and retrieves selected ship skin', () => {
		expect(getStoredStarshipSkin()).toBeUndefined()

		setStoredStarshipSkin('solar_ember')
		expect(getStoredStarshipSkin()).toBe('solar_ember')

		setStoredStarshipSkin(undefined)
		expect(getStoredStarshipSkin()).toBeUndefined()
	})

	test('sanitizes unknown archetypes and skins back to safe values', () => {
		globalThis.localStorage.setItem(
			'starfocus_starship_archetype',
			'alien_saucer_999',
		)
		expect(getStoredStarshipArchetype()).toBe('interceptor_vanguard_mk1')

		globalThis.localStorage.setItem('starfocus_starship_skin', 'invalid_skin_xyz')
		expect(getStoredStarshipSkin()).toBeUndefined()
	})
})
