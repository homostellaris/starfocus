import { useIonModal } from '@ionic/react'
import { DuplicateDetectorModal } from './DuplicateDetectorModal'

export function useDuplicateDetectorModal() {
	const [present, dismiss] = useIonModal(DuplicateDetectorModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
	})

	return [
		() => {
			present()
		},
		dismiss,
	] as const
}
