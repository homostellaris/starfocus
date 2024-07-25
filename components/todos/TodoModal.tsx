import {
	IonButton,
	IonButtons,
	IonContent,
	IonFooter,
	IonHeader,
	IonIcon,
	IonInput,
	IonPage,
	IonSelect,
	IonSelectOption,
	IonTextarea,
	IonTitle,
	IonToolbar,
} from '@ionic/react'
import { openOutline } from 'ionicons/icons'
import {
	ComponentProps,
	ReactNode,
	useCallback,
	useEffect,
	useRef,
} from 'react'
import { db, Todo } from '../db'
import useNoteProvider from '../notes/useNoteProvider'
import { useLiveQuery } from 'dexie-react-hooks'

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
	const noteInput = useRef<HTMLIonTextareaElement>(null)
	const starRoleInput = useRef<HTMLIonSelectElement>(null)
	const titleInput = useRef<HTMLIonInputElement>(null)

	const starRoles = useLiveQuery(() => db.starRoles.toArray(), [], [])

	// Might cause problems that this runs on every render but seems fine atm...
	useEffect(() => {
		titleInput.current?.setFocus()
	})

	const noteProvider = useNoteProvider()
	const emitTodo = useCallback(() => {
		dismiss(
			{
				...todo,
				note: noteInput.current?.value,
				starRole: starRoleInput.current?.value ?? undefined,
				title: titleInput.current?.value,
			},
			'confirm',
		)
	}, [dismiss, todo])

	return (
		<IonPage
			{...props}
			onKeyDown={event => {
				if (event.key === 'Enter') {
					event.preventDefault()
					emitTodo()
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
					value={todo?.title}
				/>
				<IonSelect
					fill="outline"
					label="Star role"
					labelPlacement="floating"
					ref={starRoleInput}
					value={todo?.starRole}
				>
					<IonSelectOption value={null}>None</IonSelectOption>
					{starRoles.map(starRole => (
						<IonSelectOption
							key={starRole.id}
							value={starRole.id}
						>
							{starRole.title}
						</IonSelectOption>
					))}
				</IonSelect>
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
								emitTodo()
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
