import {
	IonContent,
	IonFab,
	IonFabButton,
	IonFabList,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonReorder,
	IonReorderGroup,
	IonSpinner,
} from '@ionic/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { add, layersSharp, starHalfSharp, starOutline } from 'ionicons/icons'
import posthog from 'posthog-js'
import { RefObject, useCallback, useEffect, useRef } from 'react'
import { Header } from '../common/Header'
import { db, StarRole, StarRoleGroup } from '../db'
import { MarkdownExportProvider } from '../export/MarkdownExportContext'
import { useCreateStarRoleGroupModal } from '../starRoleGroups/create/useCreateStarRoleGroupModal'
import { useCreateStarRoleModal } from '../starRoles/create/useCreateStarRoleModal'
import { getIonIcon } from '../starRoles/icons'
import { useStarRoleActionSheet } from '../starRoles/StarRoleActionSheet'

export default function Constellation() {
	const data = useLiveQuery(() =>
		Promise.all([
			db.starRoles.toArray(),
			db.starRoleGroups.toArray(),
			db.starRolesOrder.toArray(),
		]),
	)
	const isLoading = data === undefined

	const fab = useRef<HTMLIonFabElement>(null)

	const [presentCreateStarRoleModal] = useCreateStarRoleModal()
	const openCreateStarRoleModal = useCallback(() => {
		presentCreateStarRoleModal({
			onWillDismiss: () => {
				if (fab.current) fab.current.activated = false
			},
		})
	}, [fab, presentCreateStarRoleModal])

	const [presentCreateStarRoleGroupModal] = useCreateStarRoleGroupModal()
	const openCreateStarRoleGroupModal = useCallback(() => {
		presentCreateStarRoleGroupModal({
			onWillDismiss: () => {
				if (fab.current) fab.current.activated = false
			},
		})
	}, [fab, presentCreateStarRoleGroupModal])

	useGlobalKeyboardShortcuts(fab, openCreateStarRoleModal)

	useEffect(() => {
		posthog.capture('constellation_viewed')
	}, [])

	useSeedMissingStarRoleOrders(data)

	return (
		<MarkdownExportProvider>
			<IonPage>
				<Header title="Constellation" backHref="/home" />
				<IonContent fullscreen>
					{isLoading ? (
						<div className="flex items-center justify-center h-full">
							<IonSpinner
								className="w-20 h-20"
								name="dots"
							/>
						</div>
					) : data[0].length === 0 ? (
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
						<div className="max-w-2xl mx-auto">
							<StarRolesList
								starRoles={data[0]}
								starRoleGroups={data[1]}
								starRolesOrder={data[2]}
							/>
						</div>
					)}
					<IonFab
						ref={fab}
						slot="fixed"
						vertical="bottom"
						horizontal="end"
					>
						<IonFabButton color="success">
							<IonIcon icon={add}></IonIcon>
						</IonFabButton>
						<IonFabList side="top">
							<IonFabButton
								id="create-star-role"
								onClick={openCreateStarRoleModal}
							>
								<IonIcon icon={starHalfSharp}></IonIcon>
							</IonFabButton>
							<IonFabButton id="create-star-role-group">
								<IonIcon
									onClick={openCreateStarRoleGroupModal}
									icon={layersSharp}
								></IonIcon>
							</IonFabButton>
						</IonFabList>
					</IonFab>
				</IonContent>
			</IonPage>
		</MarkdownExportProvider>
	)
}

function StarRolesList({
	starRoles,
	starRoleGroups,
	starRolesOrder,
}: {
	starRoles: StarRole[]
	starRoleGroups: StarRoleGroup[]
	starRolesOrder: { starRoleId: string; order: number }[]
}) {
	const [presentStarRoleActionSheet] = useStarRoleActionSheet()

	const groupTitleById = new Map(starRoleGroups.map(g => [g.id, g.title]))
	const orderByRoleId = new Map(starRolesOrder.map(({ starRoleId, order }) => [starRoleId, order]))

	const sortedRoles = [...starRoles].sort(
		(a, b) => (orderByRoleId.get(a.id) ?? Infinity) - (orderByRoleId.get(b.id) ?? Infinity),
	)

	return (
		<IonList inset>
			<IonReorderGroup
				disabled={false}
				onIonItemReorder={async event => {
					event.detail.complete()
					const reordered = [...sortedRoles]
					const [moved] = reordered.splice(event.detail.from, 1)
					reordered.splice(event.detail.to, 0, moved)
					await db.starRolesOrder.bulkPut(
						reordered.map((role, i) => ({ starRoleId: role.id, order: i })),
					)
				}}
			>
				{sortedRoles.map(starRole => (
					<IonItem
						button
						key={starRole.id}
						onClick={() => presentStarRoleActionSheet(starRole)}
					>
						<IonLabel>
							{starRole.title}
							{starRole.starRoleGroupId && (
								<p>{groupTitleById.get(starRole.starRoleGroupId)}</p>
							)}
						</IonLabel>
						{starRole.icon && (
							<IonIcon
								icon={getIonIcon(starRole.icon.name)}
								slot="end"
							/>
						)}
						<IonReorder slot="end" />
					</IonItem>
				))}
			</IonReorderGroup>
		</IonList>
	)
}

function useSeedMissingStarRoleOrders(
	data: [StarRole[], StarRoleGroup[], { starRoleId: string; order: number }[]] | undefined,
) {
	useEffect(() => {
		if (!data) return
		const [starRoles, , starRolesOrder] = data
		const orderedIds = new Set(starRolesOrder.map(o => o.starRoleId))
		const unordered = starRoles.filter(r => !orderedIds.has(r.id))
		if (unordered.length === 0) return
		const maxOrder = starRolesOrder.reduce((max, o) => Math.max(max, o.order), -1)
		db.starRolesOrder.bulkAdd(
			unordered.map((role, i) => ({ starRoleId: role.id, order: maxOrder + 1 + i })),
		)
	}, [data])
}

function useGlobalKeyboardShortcuts(
	fab: RefObject<HTMLIonFabElement | null>,
	openCreateStarRoleModal: any,
) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.target !== document.body) return

			if (event.key === 'c') {
				event.preventDefault()
				if (fab.current) fab.current.activated = true
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [fab, openCreateStarRoleModal])
}
