import {
	IonButton,
	IonButtons,
	IonContent,
	IonFooter,
	IonHeader,
	IonInput,
	IonLabel,
	IonModal,
	IonTitle,
	IonToolbar,
} from '@ionic/react'
import {
	DXCInputField,
	DXCUserInteraction,
	resolveText,
} from 'dexie-cloud-addon'
import { useState } from 'react'

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

	return (
		<IonModal isOpen={!!ui}>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Sync</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent>
				{ui ? (
					<>
						<IonLabel>{ui.title}</IonLabel>
						{ui.alerts?.map((alert, i) => (
							<p
								key={i}
								className={`dxcdlg-alert-${alert.type}`}
							>
								{resolveText(alert)}
							</p>
						))}
						<form
							onSubmit={ev => {
								ev.preventDefault()
								ui.onSubmit(params)
							}}
						>
							{(Object.entries(ui.fields) as [string, DXCInputField][]).map(
								([fieldName, { type, label, placeholder }], idx) => (
									<IonInput
										autoFocus
										label={label}
										type="text"
										key={idx}
										name={fieldName}
										placeholder={placeholder}
										value={params[fieldName] || ''}
										onChange={event => {
											const value = event.detail.value
											let updatedParams = {
												...params,
												[fieldName]: value,
											}
											setParams(updatedParams)
										}}
									>
										<input />
									</IonInput>
								),
							)}
						</form>
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
										onClick={() => ui.onSubmit(params)}
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
			</IonContent>
		</IonModal>
	)
}
