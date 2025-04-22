import { IonButton, IonContent, IonPopover } from '@ionic/react'
import dayjs from 'dayjs'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

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
			fill="clear"
			id="star-points"
		>
			<span className="font-mono text-xl">{starPointsEarned}</span>
			<IonPopover
				trigger="star-points"
				triggerAction="click"
			>
				<IonContent class="ion-padding">
					Star points this week: {starPointsEarned}
				</IonContent>
			</IonPopover>
		</IonButton>
	)
}
