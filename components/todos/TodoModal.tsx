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
	useState,
} from 'react'
import { db, Todo } from '../db'
import useNoteProvider from '../notes/useNoteProvider'
import { cn } from '../common/cn'

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
	toolbarSlot?: ({
		starRole,
		starPoints,
	}: {
		starRole?: string
		starPoints?: number
	}) => ReactNode
} & ComponentProps<typeof IonPage>) {
	const [todoDraft, setTodoDraft] = useState<Partial<Todo>>({ ...todo })
	const [titleIsTouched, setTitleIsTouched] = useState(false)
	const [titleIsValid, setTitleIsValid] = useState<boolean>()
	const noteInput = useRef<HTMLIonTextareaElement>(null)

	const starRoles = useLiveQuery(() => db.starRoles.toArray(), [], [])

	const noteProvider = useNoteProvider()
	const emitTodo = useCallback(() => {
		dismiss(
			{
				...todoDraft,
				noteInitialContent: noteInput.current?.value,
			},
			'confirm',
		)
	}, [dismiss, todoDraft])

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
					autocapitalize="sentences"
					className={cn(
						titleIsTouched && 'ion-touched',
						titleIsValid ? 'ion-valid' : 'ion-invalid',
					)}
					errorText="Title is required"
					fill="outline"
					type="text"
					label="Title"
					labelPlacement="floating"
					onIonBlur={() => {
						setTitleIsTouched(true)
					}}
					onIonInput={event => {
						const { value } = event.detail
						const isValid = typeof value === 'string' && value.length > 0
						setTodoDraft(todoDraft => ({
							...todoDraft,
							title: event.detail.value || undefined,
						}))
						setTitleIsValid(isValid)
					}}
					value={todoDraft.title}
				/>
				<IonSelect
					fill="outline"
					label="Star role"
					labelPlacement="floating"
					onIonChange={event => {
						setTodoDraft(todoDraft => ({
							...todoDraft,
							starRole: event.detail.value || undefined,
						}))
					}}
					value={todoDraft.starRole}
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
					onIonChange={event => {
						setTodoDraft(todoDraft => ({
							...todoDraft,
							starPoints: event.detail.value || undefined,
						}))
					}}
					value={todoDraft.starPoints}
				>
					<IonSelectOption value={null}>-</IonSelectOption>
					<IonSelectOption value={1}>1</IonSelectOption>
					<IonSelectOption value={2}>2</IonSelectOption>
					<IonSelectOption value={3}>3</IonSelectOption>
					<IonSelectOption value={5}>5</IonSelectOption>
					<IonSelectOption value={8}>8</IonSelectOption>
					<IonSelectOption value={13}>13</IonSelectOption>
				</IonSelect>
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
						disabled={!noteProvider}
						helperText={
							noteProvider
								? 'A note with this initial content will be created with your note provider and linked to this todo'
								: 'Set a note provider in settings to enable this feature'
						}
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
					{toolbarSlot?.({
						starPoints: todoDraft.starPoints,
						starRole: todoDraft.starRole,
					})}
				</IonToolbar>
			</IonFooter>
		</IonPage>
	)
}
