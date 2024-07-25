import {
	IonButton,
	IonButtons,
	IonContent,
	IonFooter,
	IonHeader,
	IonInput,
	IonPage,
	IonTitle,
	IonToolbar,
} from '@ionic/react'
import { ComponentProps, ReactNode, useEffect, useRef } from 'react'
import { StarRole } from '../db'

export default function StarRoleModal({
	dismiss,
	title,
	starRole = {},
	toolbarSlot,
	...props
}: {
	dismiss: (data?: any, role?: string) => void
	title: string
	starRole?: Partial<StarRole>
	toolbarSlot?: ReactNode
} & ComponentProps<typeof IonPage>) {
	const input = useRef<HTMLIonInputElement>(null)

	// Might cause problems that this runs on every render but seems fine atm...
	useEffect(() => {
		input.current?.setFocus()
	})

	return (
		<IonPage
			{...props}
			onKeyDown={event => {
				if (event.key === 'Enter') {
					event.preventDefault()
					dismiss(
						{
							...starRole,
							title: input.current?.value,
						},
						'confirm',
					)
				}
				props.onKeyDown?.(event)
			}}
		>
			<IonHeader>
				<IonToolbar>
					<IonTitle slot="start">{title}</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="space-y-4 ion-padding">
				<IonInput
					fill="outline"
					ref={input}
					type="text"
					label="Title"
					labelPlacement="floating"
					value={starRole?.title}
				/>
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
								dismiss(
									{
										...starRole,
										title: input.current?.value,
									},
									'confirm',
								)
							}}
							strong={true}
						>
							Confirm
						</IonButton>
					</IonButtons>
					{toolbarSlot}
				</IonToolbar>
			</IonFooter>
		</IonPage>
	)
}
