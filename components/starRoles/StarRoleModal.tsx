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
import { ComponentProps, MutableRefObject, ReactNode } from 'react'
import { StarRole } from '../db'

export default function StarRoleModal({
	dismiss,
	title,
	titleInput,
	starRole = {},
	toolbarSlot,
	...props
}: {
	dismiss: (data?: any, role?: string) => void
	title: string
	starRole?: Partial<StarRole>
	titleInput: MutableRefObject<HTMLIonInputElement | null>
	toolbarSlot?: ReactNode
} & ComponentProps<typeof IonPage>) {
	return (
		<IonPage
			{...props}
			onKeyDown={event => {
				if (event.key === 'Enter') {
					event.preventDefault()
					dismiss(
						{
							...starRole,
							title: titleInput.current?.value,
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
					ref={titleInput}
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
										title: titleInput.current?.value,
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
