import { IonButton, IonContent, IonIcon, IonPopover } from '@ionic/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { starSharp } from 'ionicons/icons'
import { db } from '../db'
import dayjs from 'dayjs'

export default function StarPoints() {
	const starPointsEarned = useLiveQuery(async () => {
		const thisWeeksCompletedTodos = await db.todos
			.where('completedAt')
			.aboveOrEqual(dayjs().startOf('week').toDate()) // Monday in the UK
			.toArray()
		return thisWeeksCompletedTodos.reduce(
			(totalStarPointsEarned, todo) =>
				totalStarPointsEarned + (todo?.starPoints || 0),
			0,
		)
	})

	return (
		<IonButton
			className="ml-4"
			fill="clear"
			id="star-points"
		>
			<IonIcon
				icon={starSharp}
				slot="icon-only"
			></IonIcon>
			<IonPopover
				trigger="star-points"
				triggerAction="click"
			>
				<IonContent class="ion-padding">
					Star points this week: {starPointsEarned}
				</IonContent>
			</IonPopover>
			<span className="ml-3 font-mono text-xl">{starPointsEarned}</span>
		</IonButton>
	)
}
