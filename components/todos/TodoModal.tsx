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
import { useLiveQuery } from 'dexie-react-hooks'
import { openOutline } from 'ionicons/icons'
import {
	ComponentProps,
	MutableRefObject,
	ReactNode,
	useCallback,
	useRef,
} from 'react'
import { db, Todo } from '../db'
import useNoteProvider from '../notes/useNoteProvider'

export default function TodoModal({
	dismiss,
	title,
	titleInput,
	todo = {},
	toolbarSlot,
	...props
}: {
	dismiss: (data?: any, role?: string) => void
	title: string
	titleInput: MutableRefObject<HTMLIonInputElement | null>
	todo?: Partial<Todo>
	toolbarSlot?: ReactNode
} & ComponentProps<typeof IonPage>) {
	const noteInput = useRef<HTMLIonTextareaElement>(null)
	const starPointsInput = useRef<HTMLIonSelectElement>(null)
	const starRoleInput = useRef<HTMLIonSelectElement>(null)

	const starRoles = useLiveQuery(() => db.starRoles.toArray(), [], [])

	const noteProvider = useNoteProvider()
	const emitTodo = useCallback(() => {
		dismiss(
			{
				...todo,
				noteInitialContent: noteInput.current?.value,
				starPoints: starPointsInput.current?.value,
				starRole: starRoleInput.current?.value ?? undefined,
				title: titleInput.current?.value,
			},
			'confirm',
		)
	}, [dismiss, todo, titleInput])

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
					autoCapitalize="sentences"
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
					<IonSelectOption value={null}>No star role</IonSelectOption>
					{starRoles.map(starRole => (
						<IonSelectOption
							key={starRole.id}
							value={starRole.id}
						>
							{starRole.title}
						</IonSelectOption>
					))}
				</IonSelect>
				<IonSelect
					fill="outline"
					label="Star points"
					labelPlacement="floating"
					interface="popover"
					ref={starPointsInput}
					value={todo?.starPoints}
				>
					<IonSelectOption value={0}>0</IonSelectOption>
					<IonSelectOption value={1}>1</IonSelectOption>
					<IonSelectOption value={2}>2</IonSelectOption>
					<IonSelectOption value={3}>3</IonSelectOption>
					<IonSelectOption value={5}>5</IonSelectOption>
					<IonSelectOption value={8}>8</IonSelectOption>
					<IonSelectOption value={13}>13</IonSelectOption>
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
