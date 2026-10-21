import {
	IonBadge,
	IonButton,
	IonButtons,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonContent,
	IonHeader,
	IonIcon,
	IonPage,
	IonSegment,
	IonSegmentButton,
	IonTitle,
	IonToolbar,
	useIonAlert,
	useIonToast,
} from '@ionic/react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
	closeSharp,
	eyeOffOutline,
	gitMergeOutline,
	sparklesSharp,
} from 'ionicons/icons'
import { useMemo, useState } from 'react'
import { StarRoleIcon } from '../../common/StarRoleIcon'
import starScale from '../../common/starScale'
import { db, StarRole, Todo } from '../../db'
import {
	dismissDuplicatePair,
	mergeAllDuplicateClusters,
	mergeDuplicateTodos,
} from './actions'
import {
	detectAllDuplicateClusters,
	DuplicateCluster,
	TodoLocation,
} from './detector'

export function DuplicateDetectorModal({
	dismiss,
}: {
	dismiss: (data?: any, role?: string) => void
}) {
	const [selectedSegment, setSelectedSegment] = useState<
		'all' | 'exact' | 'similar'
	>('all')
	const [presentAlert] = useIonAlert()
	const [presentToast] = useIonToast()

	const queryData = useLiveQuery(
		async () => {
			const [todos, wayfinderEntries, starRoles, dismissedPairsSetting] =
				await Promise.all([
					db.todos.toArray(),
					db.wayfinderOrder.toArray(),
					db.starRoles.toArray(),
					db.settings.get('#dismissedDuplicatePairs'),
				])

			const wayfinderIdentifiers = new Set(
				wayfinderEntries.map(entry => entry.todoId),
			)
			const dismissedPairs = new Set<string>(
				Array.isArray(dismissedPairsSetting?.value)
					? dismissedPairsSetting.value
					: [],
			)
			const starRoleMap = new Map<string, StarRole>(
				starRoles.map(role => [role.id, role]),
			)

			const clusters = detectAllDuplicateClusters(
				todos,
				wayfinderIdentifiers,
				dismissedPairs,
				0.75,
			)

			return {
				clusters,
				starRoleMap,
			}
		},
		[],
		{
			clusters: [] as DuplicateCluster[],
			starRoleMap: new Map<string, StarRole>(),
		},
	)

	const filteredClusters = useMemo(() => {
		if (selectedSegment === 'exact') {
			return queryData.clusters.filter(
				cluster => cluster.matchType === 'exact',
			)
		}
		if (selectedSegment === 'similar') {
			return queryData.clusters.filter(
				cluster => cluster.matchType !== 'exact',
			)
		}
		return queryData.clusters
	}, [queryData.clusters, selectedSegment])

	const exactClusterCount = useMemo(() => {
		return queryData.clusters.filter(cluster => cluster.matchType === 'exact')
			.length
	}, [queryData.clusters])

	const similarClusterCount = useMemo(() => {
		return queryData.clusters.filter(cluster => cluster.matchType !== 'exact')
			.length
	}, [queryData.clusters])

	async function handleMergeCluster(cluster: DuplicateCluster) {
		const duplicateIdentifiers = cluster.duplicateTodos.map(
			duplicate => duplicate.todo.id,
		)
		await mergeDuplicateTodos(
			cluster.canonicalTodo.id,
			duplicateIdentifiers,
		)
		presentToast({
			message: `Merged duplicates into "${cluster.canonicalTodo.title}"`,
			duration: 2000,
			position: 'bottom',
		})
	}

	async function handleDismissCluster(cluster: DuplicateCluster) {
		for (const duplicate of cluster.duplicateTodos) {
			await dismissDuplicatePair(
				cluster.canonicalTodo.id,
				duplicate.todo.id,
			)
		}
		presentToast({
			message: 'Duplicate match dismissed',
			duration: 2000,
			position: 'bottom',
		})
	}

	function confirmMergeAllExact() {
		const exactClusters = queryData.clusters.filter(
			cluster => cluster.matchType === 'exact',
		)
		if (exactClusters.length === 0) {
			return
		}

		presentAlert({
			header: 'Merge All Exact Duplicates?',
			message: `This will automatically merge ${exactClusters.length} exact duplicate groups into their canonical active tasks.`,
			buttons: [
				{
					text: 'Cancel',
					role: 'cancel',
				},
				{
					text: 'Merge All',
					role: 'confirm',
					handler: async () => {
						await mergeAllDuplicateClusters(exactClusters)
						presentToast({
							message: `Merged ${exactClusters.length} exact duplicate groups`,
							duration: 2500,
							position: 'bottom',
						})
					},
				},
			],
		})
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonButton
							onClick={() => dismiss(null, 'cancel')}
							aria-label="Close duplicate detector"
						>
							<IonIcon
								slot="icon-only"
								icon={closeSharp}
							/>
						</IonButton>
					</IonButtons>
					<IonTitle slot="start">
						<span className="font-display [font-palette:--redshift] text-xl">
							Duplicate Detector
						</span>
					</IonTitle>
					{exactClusterCount > 0 ? (
						<IonButtons slot="end">
							<IonButton
								fill="solid"
								color="primary"
								size="small"
								onClick={confirmMergeAllExact}
							>
								<IonIcon
									slot="start"
									icon={gitMergeOutline}
								/>
								<span>Merge All Exact ({exactClusterCount})</span>
							</IonButton>
						</IonButtons>
					) : null}
				</IonToolbar>
				<IonToolbar className="px-2">
					<IonSegment
						value={selectedSegment}
						onIonChange={event => {
							setSelectedSegment(
								(event.detail.value as 'all' | 'exact' | 'similar') ??
									'all',
							)
						}}
					>
						<IonSegmentButton value="all">
							All ({queryData.clusters.length})
						</IonSegmentButton>
						<IonSegmentButton value="exact">
							Exact ({exactClusterCount})
						</IonSegmentButton>
						<IonSegmentButton value="similar">
							Similar ({similarClusterCount})
						</IonSegmentButton>
					</IonSegment>
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding space-y-4">
				{filteredClusters.length === 0 ? (
					<div
						className="flex flex-col items-center justify-center py-16 text-center"
						data-testid="no-duplicates-placeholder"
					>
						<div className="rounded-full bg-emerald-500/10 p-4 border border-emerald-500/20 text-emerald-400">
							<IonIcon
								icon={sparklesSharp}
								className="text-4xl"
							/>
						</div>
						<h2 className="mt-4 text-lg font-bold text-white">
							Orbit Clear
						</h2>
						<p className="mt-1 max-w-sm text-sm text-neutral-400">
							No duplicate or conflicting tasks detected in this view.
							Your celestial database is clean and organized.
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{filteredClusters.map(cluster => (
							<IonCard
								key={cluster.identifier}
								className="m-0 border border-neutral-800 bg-neutral-900/60 backdrop-blur"
								data-testid="duplicate-cluster-card"
							>
								<IonCardHeader className="pb-2">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<IonBadge
												color={
													cluster.matchType === 'exact'
														? 'success'
														: 'warning'
												}
												className="font-medium"
											>
												{cluster.matchType === 'exact'
													? 'Exact Match'
													: `${Math.round(cluster.highestSimilarityScore * 100)}% Match`}
											</IonBadge>
											<span className="text-xs text-neutral-400">
												{cluster.duplicateTodos.length + 1} tasks in group
											</span>
										</div>
										<IonButton
											fill="clear"
											size="small"
											color="medium"
											onClick={() => handleDismissCluster(cluster)}
											title="Ignore this pair"
										>
											<IonIcon
												slot="start"
												icon={eyeOffOutline}
											/>
											<span>Dismiss</span>
										</IonButton>
									</div>
								</IonCardHeader>

								<IonCardContent className="space-y-3 pt-0">
									<div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
										<div className="flex items-center justify-between mb-1.5">
											<span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
												Suggested Primary
											</span>
											<LocationBadge
												location={cluster.canonicalLocation}
											/>
										</div>
										<TodoDetailRow
											todo={cluster.canonicalTodo}
											starRole={queryData.starRoleMap.get(
												cluster.canonicalTodo.starRole ?? '',
											)}
										/>
									</div>

									<div className="space-y-2">
										<span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
											Duplicates ({cluster.duplicateTodos.length})
										</span>
										{cluster.duplicateTodos.map(
											({ todo, location, similarityScore }) => (
												<div
													key={todo.id}
													className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-3"
												>
													<div className="flex items-center justify-between mb-1.5">
														<span className="text-[10px] font-mono text-neutral-400">
															{Math.round(similarityScore * 100)}% similarity
														</span>
														<LocationBadge location={location} />
													</div>
													<TodoDetailRow
														todo={todo}
														starRole={queryData.starRoleMap.get(
															todo.starRole ?? '',
														)}
													/>
												</div>
											),
										)}
									</div>

									<div className="pt-2 flex justify-end gap-2 border-t border-neutral-800/60">
										<IonButton
											fill="solid"
											color="primary"
											size="small"
											onClick={() => handleMergeCluster(cluster)}
										>
											<IonIcon
												slot="start"
												icon={gitMergeOutline}
											/>
											<span>Merge into Primary</span>
										</IonButton>
									</div>
								</IonCardContent>
							</IonCard>
						))}
					</div>
				)}
			</IonContent>
		</IonPage>
	)
}

function TodoDetailRow({
	todo,
	starRole,
}: {
	todo: Todo
	starRole?: StarRole
}) {
	const starPoints = todo.starPoints ?? 0

	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 grow min-w-0">
					{starPoints > 0 ? (
						<span
							className={`font-mono text-xs font-semibold ${starScale[starPoints]?.textColor ?? 'text-neutral-300'}`}
						>
							{starPoints}★
						</span>
					) : null}
					<span className="text-sm font-medium text-white truncate">
						{todo.title}
					</span>
				</div>
				{starRole ? (
					<StarRoleIcon
						starRole={starRole}
						className="shrink-0"
					/>
				) : null}
			</div>

			{todo.noteInitialContent ? (
				<p className="text-xs text-neutral-400 line-clamp-2 italic font-mono">
					{todo.noteInitialContent}
				</p>
			) : null}
		</div>
	)
}

function LocationBadge({
	location,
}: {
	location: TodoLocation
}) {
	if (location === 'wayfinder') {
		return (
			<IonBadge
				color="primary"
				className="text-[10px]"
			>
				Wayfinder
			</IonBadge>
		)
	}
	if (location === 'database') {
		return (
			<IonBadge
				color="secondary"
				className="text-[10px]"
			>
				Database
			</IonBadge>
		)
	}
	return (
		<IonBadge
			color="medium"
			className="text-[10px]"
		>
			Completed
		</IonBadge>
	)
}
