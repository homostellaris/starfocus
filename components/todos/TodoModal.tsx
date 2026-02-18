import {
	IonButton,
	IonButtons,
	IonContent,
	IonFooter,
	IonHeader,
	IonInput,
	IonPage,
	IonSelect,
	IonSelectOption,
	IonTitle,
	IonToolbar,
} from '@ionic/react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
	ComponentProps,
	MutableRefObject,
	useCallback,
	useMemo,
	useRef,
	useState,
} from 'react'
import { cn } from '../common/cn'
import { db, ListType, Todo } from '../db'

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
	// Certain things don't seem to work unless using controlled inputs unfortunately
	const [title, setTitle] = useState(todo?.title)
	const [titleIsTouched, setTitleIsTouched] = useState(false)
	const [titleIsValid, setTitleIsValid] = useState<boolean>(!!todo?.title)
	const [starPoints, setStarPoints] = useState(todo?.starPoints)
	const [starRole, setStarRole] = useState(todo?.starRole)
	const locationSelect = useRef<HTMLIonSelectElement>(null)
	const eligibleForWayfinder = useMemo(() => !!starPoints, [starPoints])

	const starRoles = useLiveQuery(() => db.starRoles.toArray(), [], [])

	const emitTodo = useCallback(() => {
		dismiss(
			{
				todo: {
					...todo,
					starPoints,
					starRole,
					title,
				},
				location: locationSelect.current?.value,
			},
			'confirm',
		)
	}, [dismiss, starPoints, starRole, todo, title])

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
					locationSelect.current!.value = ListType.asteroidField
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
						value={
							eligibleForWayfinder ? ListType.wayfinder : ListType.asteroidField
						}
					>
						<IonSelectOption value={ListType.database}>
							Database
						</IonSelectOption>
						<IonSelectOption
							disabled={!!eligibleForWayfinder}
							value={ListType.asteroidField}
						>
							Asteroid Field
						</IonSelectOption>
						<IonSelectOption
							disabled={!eligibleForWayfinder}
							value={ListType.wayfinder}
						>
							Wayfinder
						</IonSelectOption>
					</IonSelect>
				</IonToolbar>
			</IonFooter>
		</IonPage>
	)
}
