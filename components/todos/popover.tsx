import { IonContent, IonIcon, IonItem, IonLabel, IonList } from '@ionic/react'
import { db, Todo } from '../db'
import { checkmarkDoneSharp, pulseSharp, timeSharp } from 'ionicons/icons'

export const Popover = ({
	dismiss,
	todo,
}: {
	dismiss: (data?: any, role?: string) => void
	todo: Todo
}) => (
	<IonContent>
		<IonList className="ion-no-padding">
			<IonItem
				button={true}
				onClick={() => {
					dismiss(null, 'visit')
				}}
			>
				<IonLabel>Check-in</IonLabel>
				<IonIcon
					slot="end"
					icon={pulseSharp}
				/>
			</IonItem>
			<IonItem
				button={true}
				onClick={() => {
					dismiss(null, 'snooze')
				}}
			>
				<IonLabel>Check-in & snooze</IonLabel>
				<IonIcon
					slot="end"
					icon={timeSharp}
				/>
			</IonItem>
			<IonItem
				button={true}
				onClick={() => {
					dismiss(null, 'complete')
				}}
			>
				<IonLabel>Complete forever</IonLabel>
				<IonIcon
					slot="end"
					icon={checkmarkDoneSharp}
				/>
			</IonItem>
		</IonList>
	</IonContent>
)
