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
import {
	ComponentProps,
	MutableRefObject,
	ReactNode,
	useCallback,
	useState,
} from 'react'
import { StarRole } from '../db'

export default function StarRoleGroupModal({
	dismiss,
	title,
	titleInput,
	starRoleGroup: starRole,
	toolbarSlot,
	...props
}: {
	dismiss: (data?: any, role?: string) => void
	starRoleGroup?: Partial<StarRole>
	title: string
	titleInput: MutableRefObject<HTMLIonInputElement | null>
	toolbarSlot?: ReactNode
} & ComponentProps<typeof IonPage>) {
	const [starRoleGroupTitleInput, setStarRoleGroupTitleInput] =
		useState<string>(starRole?.title || '') // TODO: Figure out why this becomes necessary due to other states resetting the title input value when its uncontrolled.

	const starRoleGroupTitle = starRoleGroupTitleInput || starRole?.title

	const emitStarRoleGroup = useCallback(() => {
		dismiss(
			{
				title: starRoleGroupTitle,
			},
			'confirm',
		)
	}, [dismiss, starRoleGroupTitle])

	return (
		<IonPage
			{...props}
			onKeyDown={event => {
				if (event.key === 'Enter') {
					event.preventDefault()
					emitStarRoleGroup()
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
					autocapitalize="sentences"
					fill="outline"
					ref={titleInput}
					type="text"
					label="Title"
					labelPlacement="floating"
					onIonInput={event => {
						setStarRoleGroupTitleInput(event.detail.value || '')
					}}
					value={starRoleGroupTitleInput || starRole?.title}
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
								emitStarRoleGroup()
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
