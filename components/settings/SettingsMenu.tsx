import { menuController } from '@ionic/core/components'
import {
	IonButton,
	IonButtons,
	IonContent,
	IonFooter,
	IonHeader,
	IonMenu,
	IonToast,
	IonToolbar,
} from '@ionic/react'
import { useObservable } from 'dexie-react-hooks'
import _ from 'lodash'
import { DisplaySurveyType } from 'posthog-js'
import { usePostHog } from 'posthog-js/react'
import { starMudder } from '../common/order'
import Title from '../common/Title'
import { db } from '../db'
import ExportSettings from '../export/ExportSettings'

export const SettingsMenu = () => {
	const posthog = usePostHog()
	const user = useObservable(db.cloud.currentUser)

	return (
		<IonMenu
			contentId="main-content"
			id="settings-menu"
			side="end"
			type="push"
		>
			<IonHeader>
				<IonToolbar>
					<Title>Settings</Title>
				</IonToolbar>
			</IonHeader>
			<IonContent className="space-y-4 ion-padding">
				<ExportSettings />
				{user?.isLoggedIn && (
					<IonButton
						onClick={async () => {
							await menuController.close('settings-menu')
							posthog.displaySurvey('019c2fed-d45c-0000-8e90-9ededf867e7c', {
								displayType: DisplaySurveyType.Popover,
								ignoreConditions: true,
								ignoreDelay: true,
							})
						}}
					>
						Send feedback
					</IonButton>
				)}
				<IonButton
					id="clean-database"
					className="hidden"
					onClick={async () => {
						// Remove empty todos
						await db.todos.where('title').equals('').delete()

						// Remove todos from important list that don't exist
						const important = await db.lists.get('#important')
						const todos = await db.todos.bulkGet(important?.order || [])
						const cleanedImportantOrder = _.zip(important!.order, todos)
							.filter(([_id, todo]) => todo !== undefined)
							.map(([id, _todo]) => id) as string[]
						await db.lists.update('#important', {
							order: cleanedImportantOrder,
						})

						// Migrate to new important order
						const wayfinderOrder = await db.wayfinderOrder
							.orderBy('order')
							.keys()
						if (wayfinderOrder.length === 0) {
							const oldOrder = await db.lists.get('#important')
							const orderKeys = starMudder(oldOrder?.order.length)
							const records = oldOrder?.order.map(todoId => ({
								todoId,
								order: orderKeys.shift(),
							}))
							db.wayfinderOrder.bulkAdd(records as any)
						}
					}}
				>
					Clean database
				</IonButton>
				<IonToast
					trigger="clean-database"
					message="Database cleaned"
					duration={2000}
				></IonToast>
			</IonContent>
			<IonFooter>
				<IonToolbar>
					<IonButtons slot="primary">
						<IonButton
							onClick={() => {
								menuController.toggle('end')
							}}
						>
							Close
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonFooter>
		</IonMenu>
	)
}
