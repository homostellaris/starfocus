import { IonSelect, IonSelectOption } from '@ionic/react'
import { ComponentProps, useRef } from 'react'
import { ListType } from '../../db'
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
			id="create-todo-modal"
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
					locationSelect.current!.value = ListType.icebox
				}
			}}
			onKeyUp={event => {
				if (!event.metaKey) {
					locationSelect.current!.value = ListType.wayfinder
				}
			}}
			toolbarSlot={
				<IonSelect
					className="p-2"
					fill="outline"
					ref={locationSelect}
					slot="end"
					value={ListType.wayfinder}
				>
					<IonSelectOption value={ListType.icebox}>Icebox</IonSelectOption>
					<IonSelectOption value={ListType.wayfinder}>
						Wayfinder
					</IonSelectOption>
				</IonSelect>
			}
			{...props}
		/>
	)
}
