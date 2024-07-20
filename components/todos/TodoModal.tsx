import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonInput,
	IonPage,
	IonTextarea,
	IonTitle,
	IonToolbar,
} from '@ionic/react'
import { openOutline } from 'ionicons/icons'
import { ComponentProps, ReactNode, useEffect, useRef } from 'react'
import { Todo } from '../db'
import useNoteProvider from '../notes/useNoteProvider'

export default function TodoModal({
	dismiss,
	title,
	todo = {},
	toolbarSlot,
	...props
}: {
	dismiss: (data?: any, role?: string) => void
	title: string
	todo?: Partial<Todo>
	toolbarSlot?: ReactNode
} & ComponentProps<typeof IonPage>) {
	const page = useRef<HTMLIonModalElement>(null)
	const input = useRef<HTMLIonInputElement>(null)
	const noteInput = useRef<HTMLIonTextareaElement>(null)

	// Might cause problems that this runs on every render but seems fine atm...
	useEffect(() => {
		input.current?.setFocus()
	})

	const noteProvider = useNoteProvider()

	return (
		<IonPage
			{...props}
			ref={page}
			onKeyDown={event => {
				if (event.key === 'Enter') {
					event.preventDefault()
					dismiss(
						{
							...todo,
							title: input.current?.value,
							note: noteInput.current?.value,
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
										...todo,
										title: input.current?.value,
										note: noteInput.current?.value,
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
			</IonHeader>
			<IonContent className="space-y-4 ion-padding">
				<IonInput
					fill="outline"
					ref={input}
					type="text"
					label="Title"
					labelPlacement="floating"
					value={todo?.title}
				/>
				{!noteProvider && (
					<p>Set a note provider in settings to enable this feature.</p>
				)}
				{todo?.note ? (
					<div>
						<a
							className="space-x-1"
							href={todo?.note?.uri}
							target="_blank"
							rel="noreferrer"
						>
							<span>Open note</span>
							<IonIcon icon={openOutline} />
						</a>
					</div>
				) : (
					<IonTextarea
						className="h-48"
						disabled={!noteProvider}
						helperText="A note with this initial content will be created with your note provider and linked to this todo."
						fill="outline"
						label="Note"
						labelPlacement="floating"
						placeholder="Write markdown here..."
						ref={noteInput}
					/>
				)}
			</IonContent>
		</IonPage>
	)
}
