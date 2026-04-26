import { menuController } from '@ionic/core/components'
import {
	IonBackButton,
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonItem,
	IonLabel,
	IonPopover,
	IonToggle,
	IonToolbar,
	useIonModal,
} from '@ionic/react'
import { useObservable } from 'dexie-react-hooks'
import { helpCircleSharp, settingsSharp } from 'ionicons/icons'
import { DisplaySurveyType } from 'posthog-js'
import { usePostHog } from 'posthog-js/react'
import { LoginModal } from '../auth/dexie'
import { db } from '../db'
import { useHelp } from './HelpContext'
import StarPoints from './StarPoints'
import SyncStatus from './SyncStatus'
import Title from './Title'

export const Header = ({
	title,
	backHref,
}: {
	title: string
	backHref?: string
}) => {
	const ui = useObservable(db.cloud.userInteraction)
	const [, dismiss] = useIonModal(LoginModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
	})
	const user = useObservable(db.cloud.currentUser)

	const posthog = usePostHog()
	const { helpEnabled, toggleHelp } = useHelp()

	return (
		<>
			<LoginModal ui={ui} />
			<IonHeader>
				<IonToolbar>
					<div
						className="ml-1"
						slot="start"
					>
						{backHref ? (
							<IonButtons>
								<IonBackButton defaultHref={backHref} />
							</IonButtons>
						) : (
							<StarPoints />
						)}
					</div>
					<Title
						className="font-display [font-palette:--redshift] text-3xl"
						slot="start"
					>
						{title}
					</Title>
					<IonButtons
						className="mx-2"
						slot="end"
					>
						<IonButton id="help-popover">
							<IonIcon
								icon={helpCircleSharp}
								slot="icon-only"
							/>
						</IonButton>
						<IonPopover
							trigger="help-popover"
							triggerAction="click"
						>
							<IonContent class="ion-padding">
								<IonItem lines="none">
									<IonLabel>Help hints</IonLabel>
									<IonToggle
										aria-label="Toggle help"
										checked={helpEnabled}
										onIonChange={toggleHelp}
									/>
								</IonItem>
								<IonButton
									expand="block"
									fill="clear"
									href="/docs/get-started/quickstart"
								>
									Documentation
								</IonButton>
								{user?.isLoggedIn && (
									<IonButton
										expand="block"
										fill="clear"
										onClick={() => {
											posthog.displaySurvey(
												'019c2fed-d45c-0000-8e90-9ededf867e7c',
												{
													displayType: DisplaySurveyType.Popover,
													ignoreConditions: true,
													ignoreDelay: true,
												},
											)
										}}
									>
										Send feedback
									</IonButton>
								)}
							</IonContent>
						</IonPopover>
						<SyncStatus />
						{!user?.isLoggedIn && (
							<IonButton
								color="primary"
								fill="solid"
								onClick={() => {
									db.cloud.login()
								}}
							>
								Sync
							</IonButton>
						)}
						<IonButton onClick={() => menuController.toggle('end')}>
							<IonIcon
								icon={settingsSharp}
								slot="icon-only"
							/>
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
		</>
	)
}
