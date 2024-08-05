import { IonSelect, IonSelectOption, useIonModal } from '@ionic/react'
import { HookOverlayOptions } from '@ionic/react/dist/types/hooks/HookOverlayOptions'
import { ComponentProps, useCallback, useRef } from 'react'
import { db, ListType } from '../../db'
import useNoteProvider from '../../notes/useNoteProvider'
import TodoModal from '../TodoModal'

export function CreateTodoModal({
	dismiss,
	...props
}: {
	dismiss: (data?: any, role?: string) => void
} & ComponentProps<typeof TodoModal>) {
	const locationSelect = useRef<HTMLIonSelectElement>(null)

	return (
		<TodoModal
			dismiss={(data?: any, role?: string) => {
				dismiss(
					{
						todo: data,
						location: locationSelect.current?.value,
					},
					role,
				)
			}}
			onKeyDown={event => {
				if (event.metaKey) {
					locationSelect.current!.value = ListType.important
				}
			}}
			onKeyUp={event => {
				if (!event.metaKey) {
					locationSelect.current!.value = ListType.icebox
				}
			}}
			toolbarSlot={
				<IonSelect
					className="p-2"
					fill="outline"
					ref={locationSelect}
					slot="end"
					value={ListType.icebox}
				>
					<IonSelectOption value={ListType.icebox}>Icebox</IonSelectOption>
					<IonSelectOption value={ListType.important}>
						Important
					</IonSelectOption>
				</IonSelect>
			}
			{...props}
		/>
	)
}
