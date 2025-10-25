import {
	IonButton,
	IonButtons,
	IonContent,
	IonFooter,
	IonHeader,
	IonIcon,
	IonInput,
	IonInputOtp,
	IonLabel,
	IonModal,
	IonText,
	IonTitle,
	IonToolbar,
} from '@ionic/react'
import {
	DXCInputField,
	DXCUserInteraction,
	resolveText,
} from 'dexie-cloud-addon'
import {
	alertCircleSharp,
	cloudDoneSharp,
	cloudOfflineSharp,
} from 'ionicons/icons'
import { useRef, useState } from 'react'

/**
 * This component showcases how to provide a custom login GUI for login dialog.
 *
 * The principle is simple:
 *   * We use useObservable() to observe `db.cloud.userInteraction` into local variable ui.
 *   * If it is undefined, the system does not need to show any dialog (which is the most common case)
 *   * Else if ui is truthy, it will have the following properties:
 *     * ui.type = type of dialog ('email', 'otp', 'message-alert' or 'logout-confirmation')
 *     * ui.title = the suggested title of the dialog. You can use it or use your own based on ui.type.
 *     * ui.alerts = array of alerts (warnings, errors or information messages to show to user). This array
 *       may be present in any type of dialog.
 *     * ui.fields = input fields to collect from user. This is an object where key is the field name and
 *       value is a field description (DXCInputField)
 *     * ui.submitLabel = A suggested text for the submit / OK button
 *     * ui.cancelLabel = undefined if no cancel button is appropriate, or a suggested text for the cancel button.
 *     * ui.onSubmit = callback to call when fields have been collected from user. Accepts an object where
 *       key is the field name and value is the collected value.
 *     * ui.onCancel = callback to call if user clicks cancel button.
 */
export function LoginModal({ ui }: { ui?: DXCUserInteraction }) {
	const [params, setParams] = useState<{ [param: string]: string }>({})
	const textInput = useRef<HTMLIonInputElement>(null)
	const otpInput = useRef<HTMLIonInputOtpElement>(null)

	return (
		<IonModal
			isOpen={!!ui}
			onDidPresent={_event => {
				textInput.current?.setFocus()
				otpInput.current?.setFocus()
			}}
			onWillDismiss={event => {
				console.log({ event })
				if (event.detail.role !== 'confirm') {
					ui?.onCancel()
				}
			}}
		>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Sync</IonTitle>
				</IonToolbar>
			</IonHeader>
			{ui ? (
				<>
					<IonContent className="space-y-4 ion-padding">
						{/* <IonLabel>{ui.title}</IonLabel> */}
						{ui.alerts?.map((alert, i) => (
							<p
								key={i}
								className={`dxcdlg-alert-${alert.type}`}
							>
								{resolveText(alert)}
							</p>
						))}
						{(Object.entries(ui.fields) as [string, DXCInputField][]).map(
							([fieldName, { type, label, placeholder }], idx) =>
								type === 'otp' ? (
									<IonInputOtp
										autoFocus
										key={idx}
										length={8}
										onIonChange={event => {
											const value = event.target.value
											let updatedParams = {
												...params,
												[fieldName]: value as string,
											}
											setParams(updatedParams)
										}}
										ref={otpInput}
										type="text"
									></IonInputOtp>
								) : (
									<div
										className="space-y-4"
										key={idx}
									>
										<IonInput
											autoFocus
											fill="outline"
											label={type === 'email' ? 'Email' : 'Unknown'}
											labelPlacement="floating"
											placeholder={placeholder}
											type={type}
											onIonChange={event => {
												const value = event.target.value
												let updatedParams = {
													...params,
													[fieldName]: value as string,
												}
												setParams(updatedParams)
											}}
											ref={textInput}
											name={fieldName}
										/>
										<ul className="space-y-2 text-gray-700">
											<li className="flex items-start gap-4">
												<IonIcon
													className="shrink-0 pt-[0.2lh] h-5 w-5"
													icon={cloudOfflineSharp}
												/>
												<IonText color="medium">
													At the moment your data is stored on this device only.
												</IonText>
											</li>
											<li className="flex items-start gap-4">
												<IonIcon
													className="shrink-0 pt-[0.2lh] h-5 w-5"
													color="success"
													icon={cloudDoneSharp}
												/>
												<IonText color="medium">
													Syncing makes it available on all devices you log in
													to with your email address.
												</IonText>
											</li>
											<li className="flex items-start gap-4">
												<IonIcon
													className="shrink-0 pt-[0.2lh] h-5 w-5"
													color="warning"
													icon={alertCircleSharp}
												/>
												<IonText color="medium">
													After syncing, the current data becomes associated
													with your email address. Unsyncing will clear all data
													on this device until you log in again.
												</IonText>
											</li>
										</ul>
									</div>
								),
						)}
					</IonContent>
					<IonFooter>
						<IonToolbar>
							<IonButtons slot="secondary">
								<IonButton
									role="cancel"
									onClick={ui.onCancel}
								>
									{ui.cancelLabel}
								</IonButton>
							</IonButtons>
							<IonButtons slot="primary">
								<IonButton
									onClick={() => {
										console.log
										ui.onSubmit(params)
									}}
									strong={true}
								>
									{ui.submitLabel}
								</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonFooter>
				</>
			) : (
				<p>Something went wrong</p>
			)}
		</IonModal>
	)
}
