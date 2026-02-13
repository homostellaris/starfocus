import {
	IonButton,
	IonButtons,
	IonContent,
	IonDatetime,
	IonFooter,
	IonHeader,
	IonPage,
	IonTitle,
	IonToolbar,
} from '@ionic/react'
import { ComponentProps, useRef } from 'react'
import dayjs from 'dayjs'
import { Todo } from '../../db'

export default function SnoozeModal({
	dismiss,
	title: _title,
	todo,
	...props
}: {
	dismiss: (data?: any, role?: string) => void
	todo?: (Todo & { snoozedUntil?: Date }) | null
} & ComponentProps<typeof IonPage>) {
	const datetime = useRef<HTMLIonDatetimeElement>(null)

	return (
		<IonPage {...props}>
			<IonHeader>
				<IonToolbar>
					<IonTitle slot="start">Snooze todo</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="space-y-4 ion-padding">
				<IonDatetime
					className="mx-auto"
					min={dayjs().add(1, 'day').toISOString()}
					max={dayjs().add(10, 'year').toISOString()}
					presentation="date"
					ref={datetime}
					showClearButton
					value={
						todo?.snoozedUntil ? dayjs(todo?.snoozedUntil).toISOString() : null
					}
				></IonDatetime>
			</IonContent>
			<IonFooter>
				<IonToolbar>
					<IonButtons slot="secondary">
						<IonButton
							role="cancel"
							onClick={() => dismiss(null, 'cancel')}
						>
							Cancel
						</IonButton>
					</IonButtons>
					<IonButtons slot="primary">
						<IonButton
							onClick={() => {
								const selectedDate = datetime.current?.value
								const snoozedUntil =
									typeof selectedDate === 'string'
										? dayjs(selectedDate).startOf('day').toDate()
										: undefined
								dismiss(
									{
										todoId: todo?.id,
										snoozedUntil,
									},
									'confirm',
								)
							}}
							strong={true}
						>
							Confirm
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonFooter>
		</IonPage>
	)
}
