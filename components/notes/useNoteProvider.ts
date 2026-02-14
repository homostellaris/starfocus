import useSettings from '../settings/useSettings'
import NoteProviders from './providers'
import Obsidian from './providers/Obsidian'

export default function useNoteProvider() {
	const noteProviderSettings = useSettings('#noteProvider')

	if (noteProviderSettings?.type === NoteProviders.Obsidian) {
		return new Obsidian(noteProviderSettings.vault, noteProviderSettings.folder)
	}
	return null
}
