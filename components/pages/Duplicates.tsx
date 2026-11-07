import {
	IonBadge,
	IonButton,
	IonCard,
	IonContent,
	IonIcon,
	IonList,
	IonPage,
	useIonToast,
} from '@ionic/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { gitMergeOutline, sparklesSharp } from 'ionicons/icons'
import { Header } from '../common/Header'
import { db, StarRole, Todo } from '../db'
import { TodoListItem } from '../todos'
import { useTodoActionSheet } from '../todos/TodoActionSheet'
import { mergeDuplicateTodos } from '../todos/duplicate/actions'
import {
	detectAllDuplicateClusters,
	DuplicateCluster,
} from '../todos/duplicate/detector'
import todoRepository from '../todos/repository'

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

	async function handleCompletionChange(todo: Todo) {
		if (todo.completedAt) {
			await todoRepository.uncomplete(todo)
		} else {
			await todoRepository.complete(todo)
		}
	}

	return (
		<IonPage id="main-content">
			<Header
				title="Duplicates"
				backHref="/home"
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
							Merging combines duplicates into the marked{' '}
							<strong className="text-primary font-semibold">
								Primary
							</strong>{' '}
							task. Any notes are combined, the highest star points and
							star role are retained, and all check-in visits are reassigned
							before duplicate entries are removed.
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
						queryData.clusters.map(cluster => (
							<IonCard
								key={cluster.identifier}
								className="m-0 border border-neutral-800 bg-neutral-900/60 backdrop-blur overflow-hidden"
								data-testid="duplicate-cluster-card"
							>
								<IonList className="!bg-transparent !py-0">
									<TodoListItem
										key={cluster.canonicalTodo.id}
										todo={cluster.canonicalTodo}
										starRole={queryData.starRoleMap.get(
											cluster.canonicalTodo.starRole ?? '',
										)}
										onClick={() =>
											presentActionSheet(cluster.canonicalTodo)
										}
										onCompletionChange={() =>
											handleCompletionChange(cluster.canonicalTodo)
										}
									>
										<div className="mt-1 flex items-center gap-1.5">
											<IonBadge
												color="primary"
												className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5"
												data-testid="primary-indicator"
											>
												Primary
											</IonBadge>
										</div>
									</TodoListItem>

									{cluster.duplicateTodos.map(({ todo }) => (
										<TodoListItem
											key={todo.id}
											todo={todo}
											starRole={queryData.starRoleMap.get(
												todo.starRole ?? '',
											)}
											onClick={() => presentActionSheet(todo)}
											onCompletionChange={() =>
												handleCompletionChange(todo)
											}
										/>
									))}
								</IonList>

								<div className="flex justify-end p-2 border-t border-neutral-800/60 bg-neutral-950/20">
									<IonButton
										fill="solid"
										color="primary"
										size="small"
										onClick={() => handleMergeCluster(cluster)}
										data-testid="merge-cluster-btn"
									>
										<IonIcon
											slot="start"
											icon={gitMergeOutline}
										/>
										<span>Merge into Primary</span>
									</IonButton>
								</div>
							</IonCard>
						))
					)}
				</div>
			</IonContent>
		</IonPage>
	)
}
