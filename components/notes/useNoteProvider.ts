import useSettings from '../settings/useSettings'
import NoteProviders from './providers'
import Stashpad from './providers/Stashpad'

export default function useNoteProvider() {
	const noteProviderSettings = useSettings('#noteProvider')

	if (noteProviderSettings?.type === NoteProviders.Stashpad) {
		return new Stashpad(noteProviderSettings.apiKey)
	}
	return null
}
