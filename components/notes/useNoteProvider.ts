import useSettings from '../settings/useSettings'
import NoteProviders from './providers'
import Obsidian from './providers/Obsidian'
import Stashpad from './providers/Stashpad'

export default function useNoteProvider() {
	const noteProviderSettings = useSettings('#noteProvider')

	if (noteProviderSettings?.type === NoteProviders.Stashpad) {
		return new Stashpad(noteProviderSettings.apiKey)
	}
	if (noteProviderSettings?.type === NoteProviders.Obsidian) {
		return new Obsidian(noteProviderSettings.vault, noteProviderSettings.folder)
	}
	return null
}
