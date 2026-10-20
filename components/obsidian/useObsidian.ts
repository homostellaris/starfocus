import { useCallback } from 'react'
import useSettings from '../settings/useSettings'
import {
	getObsidianNewUri,
	getObsidianOpenUri,
	ObsidianNoteTarget,
	openObsidianUri,
} from './obsidian'

export interface ObsidianSettings {
	vault?: string
	folder?: string
}

export function useObsidian() {
	const settings = useSettings('obsidian') as ObsidianSettings | undefined
	const vault = settings?.vault?.trim() || ''
	const folder = settings?.folder?.trim() || ''

	const isConfigured = Boolean(vault)

	const getOpenUri = useCallback(
		(todo: ObsidianNoteTarget): string | null => {
			if (!vault) return null
			return getObsidianOpenUri({ vault, folder, todo })
		},
		[vault, folder],
	)

	const getNewUri = useCallback(
		(todo: ObsidianNoteTarget, content?: string): string | null => {
			if (!vault) return null
			return getObsidianNewUri({ vault, folder, todo, content })
		},
		[vault, folder],
	)

	const openNote = useCallback(
		(todo: ObsidianNoteTarget): void => {
			if (!vault) return
			const uri = getObsidianOpenUri({ vault, folder, todo })
			openObsidianUri(uri)
		},
		[vault, folder],
	)

	const createAndOpenNote = useCallback(
		(todo: ObsidianNoteTarget, content?: string): void => {
			if (!vault) return
			const uri = getObsidianNewUri({ vault, folder, todo, content })
			openObsidianUri(uri)
		},
		[vault, folder],
	)

	return {
		vault,
		folder,
		isConfigured,
		getOpenUri,
		getNewUri,
		openNote,
		createAndOpenNote,
	}
}
