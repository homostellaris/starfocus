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
					locationSelect.current!.value = ListType.asteroidField
				}
			}}
			toolbarSlot={({ starRole, starPoints }) => {
				const eligibleForWayfinder = starRole && starPoints
				console.log({ starRole, starPoints, eligibleForWayfinder })
				return (
					<IonSelect
						className="p-2"
						fill="outline"
						ref={locationSelect}
						slot="end"
						value={
							eligibleForWayfinder ? ListType.wayfinder : ListType.asteroidField
						}
					>
						<IonSelectOption value={ListType.icebox}>Icebox</IonSelectOption>
						<IonSelectOption
							disabled={!!eligibleForWayfinder}
							value={ListType.asteroidField}
						>
							Asteroid Field
						</IonSelectOption>
						<IonSelectOption
							disabled={!eligibleForWayfinder}
							value={ListType.wayfinder}
						>
							Wayfinder
						</IonSelectOption>
					</IonSelect>
				)
			}}
			{...props}
		/>
	)
}
