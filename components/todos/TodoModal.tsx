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
	useIonAlert,
} from '@ionic/react'
import { openSharp } from 'ionicons/icons'
import { useLiveQuery } from 'dexie-react-hooks'
import {
	ComponentProps,
	MutableRefObject,
	useCallback,
	useRef,
	useState,
} from 'react'
import { cn } from '../common/cn'
import { db, ListType, Todo } from '../db'
import { useObsidian } from '../obsidian/useObsidian'
import { DuplicateAlert } from './duplicate/DuplicateAlert'
import { useDuplicateDetector } from './duplicate/useDuplicateDetector'

export default function TodoModal({
	dismiss,
	modalTitle,
	titleInput,
	todo = {},
	...props
}: {
	dismiss: (data?: any, role?: string) => void
	modalTitle: string
	titleInput: MutableRefObject<HTMLIonInputElement | null>
	todo?: Partial<Todo>
} & ComponentProps<typeof IonPage>) {
	const { isConfigured: isObsidianConfigured, getOpenUri: getObsidianOpenUri } =
		useObsidian()
	const obsidianUri =
		isObsidianConfigured && todo?.id ? getObsidianOpenUri(todo) : null

	// Certain things don't seem to work unless using controlled inputs unfortunately
	const [title, setTitle] = useState(todo?.title)
	const [titleIsTouched, setTitleIsTouched] = useState(false)
	const [titleIsValid, setTitleIsValid] = useState<boolean>(!!todo?.title)
	const [starPoints, setStarPoints] = useState(todo?.starPoints)
	const [starRole, setStarRole] = useState(todo?.starRole)
	const [noteInitialContent, setNoteInitialContent] = useState<
		string | undefined
	>(todo?.noteInitialContent)
	const locationSelect = useRef<HTMLIonSelectElement>(null)

	const starRoles = useLiveQuery(() => db.starRoles.toArray(), [], [])
	const { matches, highestActiveDuplicate } = useDuplicateDetector(
		title,
		todo?.id,
	)
	const [presentAlert] = useIonAlert()

	const executeDismiss = useCallback(() => {
		dismiss(
			{
				todo: {
					...todo,
					noteInitialContent,
					starPoints,
					starRole,
					title,
				},
				location: locationSelect.current?.value,
			},
			'confirm',
		)
	}, [dismiss, noteInitialContent, starPoints, starRole, todo, title])

	const emitTodo = useCallback(() => {
		if (highestActiveDuplicate) {
			const locationName =
				highestActiveDuplicate.location === 'wayfinder'
					? 'Wayfinder'
					: 'Database'
			const matchPercentage = Math.round(
				highestActiveDuplicate.similarityScore * 100,
			)

			presentAlert({
				header: 'Similar Task Exists',
				subHeader: `${matchPercentage}% match in ${locationName}`,
				message: `"${highestActiveDuplicate.todo.title}" already exists. Would you like to open it instead?`,
				buttons: [
					{
						text: 'Cancel',
						role: 'cancel',
					},
					{
						text: 'Create Anyway',
						handler: () => {
							executeDismiss()
						},
					},
					{
						text: 'Open Existing',
						role: 'confirm',
						handler: () => {
							dismiss(
								{
									action: 'open_existing',
									existingTodo: highestActiveDuplicate.todo,
								},
								'cancel',
							)
						},
					},
				],
			})
			return
		}

		executeDismiss()
	}, [dismiss, executeDismiss, highestActiveDuplicate, presentAlert])

	return (
		<IonPage
			{...props}
			onKeyDown={event => {
				if (event.metaKey) {
					locationSelect.current!.value = ListType.database
				} else if (event.key === 'Enter') {
					event.preventDefault()
					emitTodo()
				}
			}}
			onKeyUp={event => {
				if (!event.metaKey) {
					locationSelect.current!.value = ListType.wayfinder
				}
			}}
		>
			<IonHeader>
				<IonToolbar>
					<IonTitle slot="start">{modalTitle}</IonTitle>
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
					ref={titleInput}
					type="text"
					label="Title"
					labelPlacement="floating"
					onIonBlur={() => {
						setTitleIsTouched(true)
					}}
					onIonInput={event => {
						const { value } = event.detail
						const isValid = typeof value === 'string' && value.length > 0
						setTitleIsValid(isValid)
						setTitle(value ?? undefined)
					}}
					value={title}
				/>
				<DuplicateAlert
					matches={matches}
					onSelectExisting={existingTodo => {
						dismiss(
							{
								action: 'open_existing',
								existingTodo,
							},
							'cancel',
						)
					}}
				/>
				<IonSelect
					fill="outline"
					label="Star role"
					labelPlacement="floating"
					onIonChange={event => {
						setStarRole(event.detail.value)
					}}
					value={starRole}
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
						setStarPoints(event.detail.value)
					}}
					value={starPoints}
				>
					<IonSelectOption value={null}>-</IonSelectOption>
					<IonSelectOption value={1}>1</IonSelectOption>
					<IonSelectOption value={2}>2</IonSelectOption>
					<IonSelectOption value={3}>3</IonSelectOption>
					<IonSelectOption value={5}>5</IonSelectOption>
					<IonSelectOption value={8}>8</IonSelectOption>
					<IonSelectOption value={13}>13</IonSelectOption>
				</IonSelect>
				{todo?.id ? (
					obsidianUri ? (
						<div className="pt-2">
							<a
								className="inline-flex items-center space-x-1.5 text-sm text-[--ion-color-primary] hover:underline"
								href={obsidianUri}
								target="_blank"
								rel="noreferrer"
							>
								<IonIcon icon={openSharp} />
								<span>Open note in Obsidian</span>
							</a>
						</div>
					) : null
				) : (
					<IonTextarea
						autoGrow
						fill="outline"
						helperText={
							isObsidianConfigured
								? 'Initial content for the note in your Obsidian vault'
								: 'Set an Obsidian vault in settings to link notes'
						}
						label="Note (markdown)"
						labelPlacement="floating"
						placeholder="Write markdown here..."
						rows={3}
						value={noteInitialContent}
						onIonInput={event =>
							setNoteInitialContent(event.detail.value ?? undefined)
						}
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
					<IonSelect
						className="p-2"
						fill="outline"
						ref={locationSelect}
						slot="end"
						value={ListType.wayfinder}
					>
						<IonSelectOption value={ListType.database}>
							Database
						</IonSelectOption>
						<IonSelectOption value={ListType.wayfinder}>
							Wayfinder
						</IonSelectOption>
					</IonSelect>
				</IonToolbar>
			</IonFooter>
		</IonPage>
	)
}
