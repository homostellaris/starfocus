import {
	IonContent,
	IonFab,
	IonFabButton,
	IonHeader,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonReorder,
	IonReorderGroup,
	IonSpinner,
	IonTitle,
	IonToolbar,
} from '@ionic/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { add, starOutline } from 'ionicons/icons'
import { RefObject, useCallback, useEffect, useRef } from 'react'
import { db } from '../db'
import { useCreateStarRoleModal } from '../starRoles/create/useCreateStarRoleModal'
import { getIonIcon } from '../starRoles/icons'
import { useStarRoleActionSheet } from '../starRoles/StarRoleActionSheet'

export default function Constellation() {
	const starRoles = useLiveQuery(() => db.starRoles.toArray())
	const isLoading = starRoles === undefined

	const fab = useRef<HTMLIonFabElement>(null)
	const [presentCreateStarRoleModal, _dismiss] = useCreateStarRoleModal()
	const openCreateStarRoleModal = useCallback(() => {
		presentCreateStarRoleModal({
			onWillDismiss: () => {
				if (fab.current) fab.current.activated = false
			},
		})
	}, [fab, presentCreateStarRoleModal])

	const [present] = useStarRoleActionSheet()

	useGlobalKeyboardShortcuts(fab, openCreateStarRoleModal)

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Constellation</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				{isLoading ? (
					<div className="flex items-center justify-center h-full">
						<IonSpinner
							className="w-20 h-20"
							name="dots"
						/>
					</div>
				) : starRoles.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full gap-5">
						<IonIcon
							icon={starOutline}
							size="large"
						/>
						<p>
							Create some roles to focus on what matters in different areas of
							your life
						</p>
					</div>
				) : (
					<IonList inset>
						{/* <IonReorderGroup
							disabled={false}
							onIonItemReorder={handleReorder}
						> */}
						{starRoles.map(starRole => (
							<IonItem
								button
								key={starRole.id}
								onClick={() => {
									present(starRole)
								}}
							>
								<IonLabel>{starRole?.title}</IonLabel>
								{starRole?.icon && (
									<IonIcon
										icon={getIonIcon(starRole.icon.name)}
										slot="end"
									/>
								)}
								<IonReorder slot="end"></IonReorder>
							</IonItem>
						))}
						{/* </IonReorderGroup> */}
					</IonList>
				)}
				<IonFab
					ref={fab}
					slot="fixed"
					vertical="bottom"
					horizontal="end"
				>
					<IonFabButton onClick={openCreateStarRoleModal}>
						<IonIcon icon={add}></IonIcon>
					</IonFabButton>
				</IonFab>
			</IonContent>
		</IonPage>
	)
}

function useGlobalKeyboardShortcuts(
	fab: RefObject<HTMLIonFabElement>,
	openCreateStarRoleModal: any,
) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.target !== document.body) return

			if (event.key === 'c') {
				event.preventDefault()
				openCreateStarRoleModal()
				if (fab.current) fab.current.activated = true
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [fab, openCreateStarRoleModal])
}
