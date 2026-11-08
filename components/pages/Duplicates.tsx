import {
	IonBadge,
	IonButton,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonContent,
	IonIcon,
	IonPage,
	useIonToast,
} from '@ionic/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { gitMergeOutline, sparklesSharp } from 'ionicons/icons'
import { Header } from '../common/Header'
import { StarRoleIcon } from '../common/StarRoleIcon'
import { cn } from '../common/cn'
import starScale from '../common/starScale'
import { db, StarRole } from '../db'
import { TodoChip } from '../todos/TodoChip'
import { useTodoActionSheet } from '../todos/TodoActionSheet'
import { mergeDuplicateTodos } from '../todos/duplicate/actions'
import {
	detectAllDuplicateClusters,
	DuplicateCluster,
} from '../todos/duplicate/detector'

export default function Duplicates() {
	const [presentActionSheet] = useTodoActionSheet()
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

	return (
		<IonPage id="main-content">
			<Header
				title="Duplicates"
				backHref="/home"
				hideActions
			/>
			<IonContent className="ion-padding">
				<div className="max-w-2xl mx-auto space-y-4 pb-16">
					<div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 text-xs text-neutral-400 space-y-1.5 backdrop-blur">
						<div className="flex items-center gap-2 font-medium text-neutral-200">
							<IonIcon
								icon={sparklesSharp}
								className="text-amber-400"
							/>
							<span>How Merging Works</span>
						</div>
						<p className="leading-relaxed">
							Merging keeps the card&apos;s{' '}
							<strong className="text-primary font-semibold">
								Primary
							</strong>{' '}
							task and combines any notes, retains the highest star
							points and star role, and reassigns check-in visits before
							removing the duplicate tasks shown as chips.
						</p>
					</div>

					{queryData.clusters.length === 0 ? (
						<div
							className="flex flex-col items-center justify-center py-20 text-center"
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
							<p className="mt-1 max-w-sm text-xs text-neutral-400">
								No duplicate tasks detected in your database.
							</p>
							<IonButton
								routerLink="/home"
								routerDirection="back"
								fill="outline"
								size="small"
								className="mt-6"
							>
								Return to Home
							</IonButton>
						</div>
					) : (
						queryData.clusters.map(cluster => {
							const primaryStarPoints =
								cluster.canonicalTodo.starPoints ?? 0
							const primaryStarRole = queryData.starRoleMap.get(
								cluster.canonicalTodo.starRole ?? '',
							)

							return (
								<IonCard
									key={cluster.identifier}
									className="m-0 border border-neutral-800 bg-neutral-900/60 backdrop-blur overflow-hidden"
									data-testid="duplicate-cluster-card"
								>
									<IonCardHeader className="pb-2">
										<div className="flex items-center justify-between gap-3">
											<div
												className="flex items-center gap-2 grow min-w-0 cursor-pointer"
												onClick={() =>
													presentActionSheet(cluster.canonicalTodo)
												}
												data-testid="primary-todo-header"
											>
												{primaryStarPoints > 0 ? (
													<span
														className={cn(
															'!font-mono text-sm font-semibold shrink-0',
															starScale[primaryStarPoints]?.textColor,
														)}
													>
														{primaryStarPoints}
													</span>
												) : null}
												<IonCardTitle className="text-base font-semibold text-white truncate">
													{cluster.canonicalTodo.title}
												</IonCardTitle>
												<StarRoleIcon
													starRole={primaryStarRole}
													className="shrink-0 text-sm"
												/>
												<IonBadge
													color="primary"
													className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 shrink-0"
													data-testid="primary-indicator"
												>
													Primary
												</IonBadge>
											</div>

											<IonButton
												fill="solid"
												color="primary"
												size="small"
												onClick={() => handleMergeCluster(cluster)}
												data-testid="merge-cluster-btn"
												className="shrink-0"
											>
												<IonIcon
													slot="start"
													icon={gitMergeOutline}
												/>
												<span>Merge</span>
											</IonButton>
										</div>
									</IonCardHeader>

									<IonCardContent className="pt-1">
										<div className="flex flex-wrap gap-2 pt-1">
											{cluster.duplicateTodos.map(({ todo }) => (
												<TodoChip
													key={todo.id}
													todo={todo}
													starRole={queryData.starRoleMap.get(
														todo.starRole ?? '',
													)}
													onClick={() => presentActionSheet(todo)}
												/>
											))}
										</div>
									</IonCardContent>
								</IonCard>
							)
						})
					)}
				</div>
			</IonContent>
		</IonPage>
	)
}
