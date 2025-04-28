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
import { db, StarRole, StarRoleGroup } from '../db'
import Icons, { getIonIcon } from './icons'
import { useLiveQuery } from 'dexie-react-hooks'

export default function StarRoleModal({
	dismiss,
	title,
	titleInput,
	starRole,
	toolbarSlot,
	...props
}: {
	dismiss: (data?: any, role?: string) => void
	starRole?: Partial<StarRole>
	starRoleGroup?: StarRoleGroup
	title: string
	titleInput: MutableRefObject<HTMLIonInputElement | null>
	toolbarSlot?: ReactNode
} & ComponentProps<typeof IonPage>) {
	const starRoleGroups = useLiveQuery(() => db.starRoleGroups.toArray())
	const [starRoleTitleInput, setStarRoleTitleInput] = useState<string>(
		starRole?.title || '',
	) // TODO: Figure out why this becomes necessary due to other states resetting the title input value when its uncontrolled.
	const [starRoleGroupId, setStarRoleGroupId] = useState<string | null>(
		starRole?.starRoleGroupId ?? null,
	)
	const [iconInput, setIconInput] = useState<{
		name: string
		value: string
	} | null>()
	const [iconQuery, setIconQuery] = useState<string>('')

	const initialIcon = starRole?.icon
		? { name: starRole.icon.name, value: getIonIcon(starRole?.icon.name) }
		: null
	const icon = iconInput || initialIcon
	const starRoleTitle = starRoleTitleInput || starRole?.title

	const emitStarRole = useCallback(() => {
		if (!starRoleTitle || !icon) {
			throw new TypeError('Star role title and icon are required')
		}
		dismiss(
			{
				icon: {
					type: 'ionicon',
					name: icon.name,
				},
				starRoleGroupId,
				title: starRoleTitle,
			},
			'confirm',
		)
	}, [dismiss, icon, starRoleGroupId, starRoleTitle])

	return (
		<IonPage
			{...props}
			onKeyDown={event => {
				if (event.key === 'Enter') {
					event.preventDefault()
					emitStarRole()
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
					onIonInput={event => {
						setStarRoleTitleInput(event.detail.value || '')
					}}
					value={starRoleTitleInput || starRole?.title}
				/>
				<IonSelect
					label="Group"
					labelPlacement="floating"
					fill="outline"
					onIonChange={event => {
						setStarRoleGroupId(event.detail.value)
					}}
					value={starRoleGroupId}
				>
					<IonSelectOption value={null}>No star role group</IonSelectOption>
					{starRoleGroups?.map(group => (
						<IonSelectOption
							key={group.id}
							value={group.id}
						>
							{group.title}
						</IonSelectOption>
					))}
				</IonSelect>
				<IonInput
					debounce={200}
					fill="outline"
					helperText="Type a search query and select an icon from the list that appears below"
					label="Icon"
					labelPlacement="floating"
					onIonInput={event => {
						setIconQuery(event.detail.value || '')
					}}
					placeholder="Rocket"
					type="text"
					// value={iconQuery}
				>
					{/* Conditionally rendering this  caused React errors, must be due to implemenation */}
					<IonIcon
						icon={icon?.value}
						id="selected-icon"
						slot="end"
					/>
				</IonInput>
				{/* TODO: Refactor to radio group or select to avoid too many event listeners */}
				<Icons
					query={iconQuery}
					onClick={icon => {
						setIconInput(icon)
					}}
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
								emitStarRole()
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
