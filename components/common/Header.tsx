import { useEffect, useState } from 'react'
import { menuController } from '@ionic/core/components'
import {
	IonBackButton,
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonItem,
	IonLabel,
	IonPopover,
	IonToggle,
	IonToolbar,
} from '@ionic/react'
import { useObservable } from 'dexie-react-hooks'
import { DisplaySurveyType } from 'posthog-js'
import { usePostHog } from 'posthog-js/react'
import { LoginModal } from '../auth/dexie'
import { db } from '../db'
import { useHelp } from './HelpContext'
import HelpIcon from './HelpIcon'
import MomentumSettingsIcon from './MomentumSettingsIcon'
import StarPoints from './StarPoints'
import SyncStatus from './SyncStatus'
import Title from './Title'

export const Header = ({
	title,
	backHref,
	hideActions = false,
}: {
	title: string
	backHref?: string
	hideActions?: boolean
}) => {
	const ui = useObservable(db.cloud.userInteraction)
	const user = useObservable(db.cloud.currentUser)

	const posthog = usePostHog()
	const { helpEnabled, toggleHelp } = useHelp()

	const [isHelpOpen, setIsHelpOpen] = useState(false)
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)

	useEffect(() => {
		let isMounted = true
		menuController.isOpen('end').then((open) => {
			if (isMounted) setIsSettingsOpen(open)
		})

		function handleMenuOpen(event: Event) {
			const target = event.target as HTMLElement | null
			if (
				!target ||
				target.id === 'settings-menu' ||
				target.getAttribute('side') === 'end' ||
				target.tagName?.toLowerCase() === 'ion-menu'
			) {
				setIsSettingsOpen(true)
			}
		}

		function handleMenuClose(event: Event) {
			const target = event.target as HTMLElement | null
			if (
				!target ||
				target.id === 'settings-menu' ||
				target.getAttribute('side') === 'end' ||
				target.tagName?.toLowerCase() === 'ion-menu'
			) {
				setIsSettingsOpen(false)
			}
		}

		document.addEventListener('ionWillOpen', handleMenuOpen)
		document.addEventListener('ionDidOpen', handleMenuOpen)
		document.addEventListener('ionWillClose', handleMenuClose)
		document.addEventListener('ionDidClose', handleMenuClose)

		return () => {
			isMounted = false
			document.removeEventListener('ionWillOpen', handleMenuOpen)
			document.removeEventListener('ionDidOpen', handleMenuOpen)
			document.removeEventListener('ionWillClose', handleMenuClose)
			document.removeEventListener('ionDidClose', handleMenuClose)
		}
	}, [])

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
					{!hideActions && (
						<IonButtons
							className="mx-2"
							slot="end"
						>
							<IonButton id="help-popover">
								<HelpIcon
									isOpen={isHelpOpen}
									slot="icon-only"
								/>
							</IonButton>
							<IonPopover
								trigger="help-popover"
								triggerAction="click"
								onWillPresent={() => setIsHelpOpen(true)}
								onWillDismiss={() => setIsHelpOpen(false)}
								onDidDismiss={() => setIsHelpOpen(false)}
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
							<IonButton
								id="settings-menu-button"
								onClick={async () => {
									await menuController.toggle('end')
									const isOpen = await menuController.isOpen('end')
									setIsSettingsOpen(isOpen)
								}}
							>
								<MomentumSettingsIcon
									isOpen={isSettingsOpen}
									slot="icon-only"
								/>
							</IonButton>
						</IonButtons>
					)}
				</IonToolbar>
			</IonHeader>
		</>
	)
}
