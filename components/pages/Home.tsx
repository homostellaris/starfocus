import { menuController } from '@ionic/core/components'
import {
	IonButton,
	IonButtons,
	IonCol,
	IonContent,
	IonFab,
	IonFabButton,
	IonFooter,
	IonGrid,
	IonHeader,
	IonIcon,
	IonInput,
	IonItemDivider,
	IonItemGroup,
	IonLabel,
	IonList,
	IonMenu,
	IonNote,
	IonPage,
	IonReorderGroup,
	IonRow,
	IonSearchbar,
	IonSelect,
	IonSelectOption,
	IonSpinner,
	IonToast,
	IonToolbar,
	isPlatform,
} from '@ionic/react'
import dayjs from 'dayjs'
import { useLiveQuery } from 'dexie-react-hooks'
import {
	add,
	arrowUpSharp,
	checkmarkSharp,
	chevronDownOutline,
	chevronUpOutline,
	filterSharp,
	rocketSharp,
	settingsSharp,
	snowSharp,
	timeSharp,
} from 'ionicons/icons'
import _ from 'lodash'
import {
	ComponentProps,
	forwardRef,
	PropsWithChildren,
	RefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { Header } from '../common/Header'
import Placeholder from '../common/Placeholder'
import Starship from '../common/Starship'
import Title from '../common/Title'
import { cn } from '../common/cn'
import order, { calculateReorderIndices, starMudder } from '../common/order'
import {
	AsteroidFieldTodoListItem,
	db,
	ListType,
	LogTodoListItem,
	Todo,
	TodoListItemBase,
	WayfinderTodoListItem,
} from '../db'
import { ViewMenu } from '../focus/ViewMenu'
import useView, { ViewProvider } from '../focus/view'
import Mood from '../mood'
import { MoodProvider } from '../mood/MoodContext'
import NoteProviders from '../notes/providers'
import { matchesQuery } from '../search/matchesQuery'
import useSettings from '../settings/useSettings'
import Tracjectory from '../starship/Trajectory'
import { useStarshipYPosition } from '../starship/useStarshipYPosition'
import { TodoCard, TodoListItem } from '../todos'
import PulseGraph from '../todos/PulseGraph'
import { useTodoActionSheet } from '../todos/TodoActionSheet'
import useTodoContext, { TodoContextProvider } from '../todos/TodoContext'
import { useCreateTodoModal } from '../todos/create/useCreateTodoModal'
import { groupByCompletedAt } from '../todos/groupTodosByCompletedAt'
import todoRepository from '../todos/repository'
import { useSnoozeTodoModal } from '../todos/snooze/useSnoozeTodoModal'
import { useTodoPopover } from '../todos/useTodoPopover'
import { usePostHog } from 'posthog-js/react'

const Home = () => {
	const posthog = usePostHog()
	const searchbarRef = useRef<HTMLIonSearchbarElement>(null)
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === '/') {
				event.preventDefault()
				searchbarRef.current?.setFocus()
				posthog.capture('keyboard_shortcut_used', {
					shortcut_key: '/',
					action: 'search_focus',
				})
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	})
	useGlobalKeyboardShortcuts()

	return (
		<>
			<MoodProvider>
				<ViewProvider>
					<TodoContextProvider>
						<ViewMenu searchbarRef={searchbarRef} />
						<SettingsMenu />
						<IonPage id="main-content">
							<Header title="Home"></Header>
							<TodoLists />
							<div className="absolute hidden xl:block bottom-4 left-4">
								<Mood />
							</div>
							<IonFooter
								className="lg:w-[calc(100vw/12*6+56*2px+10px)] lg:mx-auto lg:rounded-t-lg overflow-hidden"
								translucent
							>
								<IonToolbar
									className={cn(isPlatform('ios') && 'ion-padding-top')}
								>
									<IonButtons slot="start">
										<IonButton
											id="view-menu-button"
											onClick={() => {
												menuController.toggle('start')
												posthog.capture('view_menu_opened')
											}}
										>
											<IonIcon
												icon={filterSharp}
												slot="icon-only"
											/>
										</IonButton>
									</IonButtons>
									<Searchbar ref={searchbarRef} />
									<IonButtons slot="end">
										<IonButton
											id="settings-menu-button"
											onClick={() => {
												menuController.toggle('end')
												posthog.capture('settings_menu_opened')
											}}
										>
											<IonIcon
												icon={settingsSharp}
												slot="icon-only"
											/>
										</IonButton>
									</IonButtons>
								</IonToolbar>
							</IonFooter>
						</IonPage>
					</TodoContextProvider>
				</ViewProvider>
			</MoodProvider>
		</>
	)
}

export default Home

export const TodoLists = () => {
	const posthog = usePostHog()
	// Initial loading & scrolling stuff
	const contentRef = useRef<HTMLIonContentElement>(null)

	// Query stuff
	const [logLimit, setLogLimit] = useState(3)
	console.debug({ logLimit })
	const [databaseLimit, setDatabaseLimit] = useState(30)

	// Creating todo stuff
	const fab = useRef<HTMLIonFabElement>(null)
	const { focusedStarRole } = useView()
	const [presentCreateTodoModal, _dismiss] = useCreateTodoModal()
	const openCreateTodoModal = useCallback(() => {
		presentCreateTodoModal({
			onWillDismiss: () => {
				if (fab.current) fab.current.activated = false
			},
			todo: {
				starRole: focusedStarRole,
			},
		})
	}, [fab, focusedStarRole, presentCreateTodoModal])

	const wayfinderOrderMode = useSettings('#wayfinderOrderMode')
	const { inActiveStarRoles, query } = useView()

	const data = useLiveQuery<{
		log: LogTodoListItem[]
		visits: LogTodoListItem[]
		asteroidField: AsteroidFieldTodoListItem[]
		wayfinder: WayfinderTodoListItem[]
		database: Todo[]
	}>(async () => {
		const logTodosPromise = db.todos
			.orderBy('completedAt')
			.reverse()
			.filter(
				todo =>
					!!todo.completedAt &&
					matchesQuery(query, todo) &&
					inActiveStarRoles(todo),
			)
			.limit(logLimit)
			.toArray()

		const visitsPromise = db.visits
			.orderBy('date')
			.reverse()
			.limit(logLimit)
			.toArray()
			.then(visits => {
				const todoIds = visits.map(({ todoId }) => todoId)
				return db.todos.bulkGet(todoIds).then(todosForvisits => {
					return todosForvisits
						.map((todoForvisit, index) => ({
							...todoForvisit!,
							completedAt: visits[index].date,
							visits: true as const,
						}))
						.filter(
							todo => matchesQuery(query, todo) && inActiveStarRoles(todo),
						)
				})
			})

		const asteroidFieldOrder = await db.asteroidFieldOrder
			.orderBy('order')
			.toArray()
		const asteroidFieldTodoIds = asteroidFieldOrder.map(({ todoId }) => todoId)
		const asteroidFieldTodosPromise = db.todos
			.bulkGet(asteroidFieldTodoIds)
			.then(todos =>
				todos
					.map((todo, index) => ({
						...todo!,
						order: asteroidFieldOrder[index].order,
						snoozedUntil: asteroidFieldOrder[index].snoozedUntil,
					}))
					.filter(todo => matchesQuery(query, todo) && inActiveStarRoles(todo)),
			)

		const wayfinderOrder = await db.wayfinderOrder.orderBy('order').toArray()
		const wayfinderTodoIds = wayfinderOrder.map(({ todoId }) => todoId)
		const wayfinderTodosPromise =
			wayfinderOrderMode === 'star'
				? db.starRoles
						.toArray()
						.then(starRoles =>
							Promise.all(
								starRoles.map(
									starRole =>
										db.todos
											.where('starRole')
											.equals(starRole.id)
											.reverse()
											.limit(1)
											.sortBy('starPoints'),
									// .then(rankedStarRoleTodos =>
									// 	rankedStarRoleTodos.slice(0, 2),
									// ),
								),
							),
						)
						.then(todos =>
							todos
								.filter(todo => !!todo)
								.reduce((acc, curr) => acc.concat(curr), []),
						)
						.then(async starSortTodos => {
							const visits = await db.visits
								.where('todoId')
								.anyOf(wayfinderTodoIds)
								.toArray()
							const visitsByTodoId = _.groupBy(visits, 'todoId')
							return starSortTodos.map((todo, index) => ({
								...todo!,
								visits: visitsByTodoId[todo!.id],
								order: index.toString(),
								snoozedUntil: wayfinderOrder[index].snoozedUntil,
							}))
						})
				: Promise.all([
						db.todos.bulkGet(wayfinderTodoIds),
						db.visits.where('todoId').anyOf(wayfinderTodoIds).toArray(),
					]).then(([wayfinderTodos, visits]) => {
						const visitsByTodoId = _.groupBy(visits, 'todoId')
						return wayfinderTodos
							.map((todo, index) => ({
								...todo!,
								visits: visitsByTodoId[todo!.id],
								order: wayfinderOrder[index].order,
								snoozedUntil: wayfinderOrder[index].snoozedUntil,
							}))
							.filter(
								todo => matchesQuery(query, todo) && inActiveStarRoles(todo),
							)
					})

		const databaseTodosPromise = db.todos
			.where('id')
			.noneOf([...asteroidFieldTodoIds, ...wayfinderTodoIds])
			.and(
				todo =>
					todo.completedAt === undefined &&
					matchesQuery(query, todo) &&
					inActiveStarRoles(todo),
			)
			.reverse()
			.limit(databaseLimit)
			.toArray()

		const [log, visits, asteroidField, wayfinder, database] = await Promise.all(
			[
				logTodosPromise,
				visitsPromise,
				asteroidFieldTodosPromise,
				wayfinderTodosPromise,
				databaseTodosPromise,
			],
		)
		return {
			log: log.reverse(),
			visits: visits,
			asteroidField,
			wayfinder,
			database: database,
		}
	}, [inActiveStarRoles, databaseLimit, logLimit, query, wayfinderOrderMode])

	const loading = data === undefined

	const todosCount = useMemo(
		() =>
			loading
				? 0
				: Object.values(data).reduce((acc, todos) => acc + todos.length, 0),
		[loading, data],
	)

	const [logGroups, todayGroup] = useCompletedTodoGroups(
		data?.log || [],
		data?.visits || [],
		logLimit,
	)

	const starRoles = useLiveQuery(() => db.starRoles.toArray())

	// Its possible for ref not to change when todo is completed because one other than 'next' is completed in which case starship doesn't move
	// Consider using a callback ref instead: https://stackoverflow.com/questions/60881446/receive-dimensions-of-element-via-getboundingclientrect-in-react
	const nextUrgentTodo = useRef<HTMLIonItemElement>(null)
	const nextImportantTodo = useRef<HTMLIonItemElement>(null)
	const nextTodo = nextUrgentTodo || nextImportantTodo
	const {
		nextTodo: {
			position: [nextTodoPosition, setNextTodoPosition],
		},
	} = useTodoContext()

	// TODO: When dev tools aren't open the todo has zero height
	// useLayoutEffect doesn't work
	// setTimeout 0 doesn't work
	// callbackRef doesn't work
	// This person thinks its an Ionic bug but I'm not sure: https://stackoverflow.com/questions/60881446/receive-dimensions-of-element-via-getboundingclientrect-in-react
	useEffect(() => {
		if (nextTodo.current) {
			console.debug('Setting next todo with ID', nextTodo.current.dataset.id)
			const domRect = nextTodo.current.getBoundingClientRect()
			setNextTodoPosition({
				height: domRect.height,
				top: nextTodo.current.offsetTop,
			}) // Send this rather than the current ref as if unchanged then is will be memoised and nothing will happen.
		} else {
			console.debug('No next todo ref')
			setNextTodoPosition(null) // Send this rather than the current ref as if unchanged then is will be memoised and nothing will happen.
		}
	}, [nextTodo, setNextTodoPosition, data]) // The todos dep is used as an imperfect proxy for one the position of the next todo changes

	// Keyboard shortcut stuff
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.target !== document.body) return

			if (event.key === 'c') {
				event.preventDefault()
				openCreateTodoModal()
				if (fab.current) fab.current.activated = true
				posthog.capture('keyboard_shortcut_used', {
					shortcut_key: 'c',
					action: 'create_todo',
				})
			} else if (event.key === 's') {
				event.preventDefault()
				const y = nextTodoPosition ? nextTodoPosition.top + 32 : 0
				contentRef.current?.scrollToPoint(undefined, y, 500)
				posthog.capture('keyboard_shortcut_used', {
					shortcut_key: 's',
					action: 'scroll_to_next_todo',
				})
			} else if (event.key === 'i') {
				event.preventDefault()
				document.getElementById('database')?.scrollIntoView({
					behavior: 'smooth',
				})
				posthog.capture('keyboard_shortcut_used', {
					shortcut_key: 'i',
					action: 'scroll_to_database',
				})
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [contentRef, fab, nextTodoPosition, openCreateTodoModal])

	const [presentTodoActionSheet] = useTodoActionSheet()
	const [presentSnoozeTodoModal] = useSnoozeTodoModal()
	const [presentCompletionPopover] = useTodoPopover()

	return (
		<IonContent
			className="relative"
			ref={contentRef}
		>
			<IonGrid className="h-full ion-no-padding">
				<IonRow className="h-full">
					<IonCol
						className="relative"
						size="auto"
						sizeLg="3"
					>
						<IonFab className="fixed lg:left-[calc(100vw/12*3-40px-18px)] bottom-16">
							<IonFabButton
								color="success"
								onClick={openCreateTodoModal}
								size="small"
							>
								<IonIcon icon={add}></IonIcon>
							</IonFabButton>
						</IonFab>
						<IonButton
							className="fixed left-[calc(23px-10px)] lg:left-[calc(100vw/12*3-40px-6px)] bottom-[calc(64px+52px+34px)] z-10"
							onClick={() => {
								const y = nextTodoPosition ? nextTodoPosition.top + 32 : 0
								contentRef.current?.scrollToPoint(undefined, y, 500)
							}}
							shape="round"
							size="small"
						>
							<IonIcon
								slot="icon-only"
								icon={rocketSharp}
							></IonIcon>
						</IonButton>
						<IonButton
							className="fixed left-[calc(23px-10px)] lg:left-[calc(100vw/12*3-40px-6px)] bottom-[calc(64px+52px)] z-10"
							onClick={() => {
								document.getElementById('database')?.scrollIntoView({
									behavior: 'smooth',
								})
							}}
							shape="round"
							size="small"
							color="secondary"
						>
							<IonIcon
								slot="icon-only"
								icon={snowSharp}
							></IonIcon>
						</IonButton>
						<Journey commonAncestor={contentRef} />
					</IonCol>
					<IonCol sizeLg="6">
						{/* TODO: Use suspense instead */}
						{loading ? (
							<div className="flex items-center justify-center h-full">
								<IonSpinner
									className="w-20 h-20"
									name="dots"
								/>
							</div>
						) : (
							<>
								<IonButton
									aria-label="Load more log todos"
									color="medium"
									expand="full"
									fill="clear"
									onClick={() => {
										setLogLimit(limit => {
											const newLimit = limit + 10
											posthog.capture('load_more_log', { new_limit: newLimit })
											return newLimit
										})
									}}
									size="small"
								>
									<IonIcon
										slot="icon-only"
										icon={chevronUpOutline}
									></IonIcon>
								</IonButton>
								<IonList
									className="relative mr-1 [contain:none] ion-no-padding"
									id="log-and-wayfinder"
								>
									{data.log.length === 0 ? (
										<Placeholder heading="Log">
											A chronological list of your completed objectives. It
											represents your journey up until today and makes it is
											easy to remind yourself what you did in the past.
										</Placeholder>
									) : (
										logGroups.map(group => (
											<IonItemGroup key={group.shortLabel}>
												<JourneyLabel>
													<TimeInfo
														datetime={new Date().toISOString().split('T')[0]}
													>
														<span
															className="inline lg:hidden"
															title={group.shortLabel}
														>
															{group.shortLabel}
														</span>
														<span className="hidden lg:inline">
															{group.longLabel}
														</span>
													</TimeInfo>
												</JourneyLabel>
												<div className="-mt-8">
													{group.todos.map(todo => (
														<TodoListItem
															key={
																todo.visits === true
																	? `${todo.id}-${todo.completedAt}`
																	: todo.id
															}
															onClick={_event => {
																presentTodoActionSheet(todo)
															}}
															onCompletionChange={async _event => {
																if (todo.visits) {
																	alert(
																		'Deletion of visits not implemented yet',
																	)
																} else {
																	await todoRepository.uncomplete(todo)
																	setLogLimit(limit => limit - 1)
																	posthog.capture('todo_uncompleted', {
																		todo_id: todo.id,
																		location: 'log',
																	})
																}
															}}
															starRole={starRoles?.find(
																starRole => todo.starRole === starRole.id,
															)}
															todo={todo}
														>
															<VisitInfo todo={todo} />
														</TodoListItem>
													))}
												</div>
											</IonItemGroup>
										))
									)}
									<IonItemGroup>
										<JourneyLabel>
											<TimeInfo
												datetime={new Date().toISOString().split('T')[0]}
												key="today"
											>
												<span
													className="inline lg:hidden"
													title={todayGroup.shortLabel}
												>
													{todayGroup.shortLabel}
												</span>
												<span className="hidden lg:inline">
													{todayGroup.longLabel}
												</span>
											</TimeInfo>
										</JourneyLabel>
										<div className="-mt-8">
											{todayGroup.todos.map(todo => (
												<TodoListItem
													key={
														todo.visits === true
															? `${todo.id}-${todo.completedAt}`
															: todo.id
													}
													onClick={() => {
														presentTodoActionSheet(todo)
													}}
													onCompletionChange={async _event => {
														if (todo.visits) {
															alert('Deletion of visits not implemented yet')
														} else {
															await todoRepository.uncomplete(todo)
															setLogLimit(limit => limit - 1)
															posthog.capture('todo_uncompleted', {
																todo_id: todo.id,
																location: 'log',
															})
														}
													}}
													starRole={starRoles?.find(
														starRole => todo.starRole === starRole.id,
													)}
													todo={todo}
												>
													<VisitInfo todo={todo} />
												</TodoListItem>
											))}
											<IonReorderGroup
												disabled={false}
												id="asteroid-field"
												onIonItemReorder={async event => {
													console.debug('reorder event', { event })
													// We don't use this to reorder for us because it results in a flash of 'unordered' content.
													// Instead we re-order right away, calculate the new order ourselves, and update the DB.
													event.detail.complete()

													/* If the todo moves down then all the todos after its target location must be nudged up
													 * If the todo moves up then all the todos
													 */
													// TODO: Could make this easier with IDs in the DOM
													const fromTodo = data.asteroidField[event.detail.from]
													const toTodo = data.asteroidField[event.detail.to]

													const asteroidFieldTodos = await db.asteroidFieldOrder
														.orderBy('order')
														.toArray()
													const unfilteredFromIndex =
														asteroidFieldTodos.findIndex(
															({ todoId }) => todoId === fromTodo.id,
														)
													const unfilteredToIndex =
														asteroidFieldTodos.findIndex(
															({ todoId }) => todoId === toTodo.id,
														)

													const [startIndex, endIndex] =
														calculateReorderIndices(
															unfilteredFromIndex,
															unfilteredToIndex,
														)
													const start = asteroidFieldTodos[startIndex]?.order
													const end = asteroidFieldTodos[endIndex]?.order
													const newOrder = order(start, end)

													console.debug('Re-ordering', {
														originalFromIndex: event.detail.from,
														orignialToIndex: event.detail.to,
														unfilteredFromIndex,
														unfilteredToIndex,
														start,
														end,
														newOrder,
													})

													await db.asteroidFieldOrder.update(fromTodo.id, {
														order: newOrder,
													})
													posthog.capture('todo_reordered', {
														location: 'asteroid_field',
														from_index: event.detail.from,
														to_index: event.detail.to,
													})
												}}
											>
												{data.asteroidField.length === 0 ? (
													<Placeholder heading="Asteroid Field">
														Tasks which demand immediate attention. They will
														try to feign &apos;urgency&apos; but are usually
														nothing more than distractions. Delegate, defer, or
														delete where possible to accelerate though this
														treacherous region as fast as possible so you can
														move on to the mission-critical objectives in your
														Wayfinder.
													</Placeholder>
												) : (
													data.asteroidField.map((todo, index) => (
														<TodoListItem
															key={todo.id}
															data-id={todo.id}
															data-next-todo={index === 0}
															onCompletionChange={async event => {
																if (event.detail.checked) {
																	await todoRepository.complete(todo)
																	setLogLimit(limit => limit + 1)
																	posthog.capture('todo_completed', {
																		location: 'asteroid_field',
																		has_star_role: !!todo.starRole,
																		star_points: todo.starPoints,
																	})
																} else {
																	await todoRepository.uncomplete(todo)
																	setLogLimit(limit => limit - 1)
																	posthog.capture('todo_uncompleted', {
																		todo_id: todo.id,
																		location: 'asteroid_field',
																	})
																}
															}}
															onClick={_event => {
																presentTodoActionSheet(todo, {
																	buttons: [
																		{
																			icon: arrowUpSharp,
																			text: 'Move to top',
																			data: {
																				action: 'top',
																			},
																			handler: async () => {
																				const asteroidFieldTodos =
																					await db.asteroidFieldOrder
																						.orderBy('order')
																						.toArray()
																				const newOrder = order(
																					undefined,
																					asteroidFieldTodos[0]?.order,
																				)

																				await db.wayfinderOrder.update(
																					todo.id,
																					{
																						order: newOrder,
																					},
																				)
																			},
																		},
																		{
																			icon: snowSharp,
																			text: 'Move to database',
																			data: {
																				action: 'database',
																			},
																			handler: async () => {
																				db.transaction(
																					'rw',
																					db.asteroidFieldOrder,
																					async () => {
																						await db.asteroidFieldOrder.delete(
																							todo.id,
																						)
																					},
																				)
																				posthog.capture('todo_moved', {
																					from_list: 'asteroid_field',
																					to_list: 'database',
																					has_star_role: !!todo.starRole,
																					star_points: todo.starPoints,
																				})
																			},
																		},
																		{
																			icon: timeSharp,
																			text: 'Snooze',
																			data: {
																				action: 'snooze',
																			},
																			handler: () =>
																				presentSnoozeTodoModal(
																					todo,
																					ListType.asteroidField,
																				),
																		},
																	],
																})
															}}
															ref={
																index === 0
																	? (nextUrgentTodo as any)
																	: undefined
															}
															starRole={starRoles?.find(
																starRole => todo.starRole === starRole.id,
															)}
															todo={{ ...todo }}
														>
															<VisitInfo todo={todo} />
														</TodoListItem>
													))
												)}
											</IonReorderGroup>
											<div className="mx-auto w-full h-[1px] bg-[linear-gradient(to_right,transparent,theme(colors.rose.400),theme(colors.pink.400),theme(colors.fuchsia.400),theme(colors.violet.400),theme(colors.indigo.400),theme(colors.blue.400),transparent)] z-10 absolute"></div>
											<IonReorderGroup
												disabled={false}
												id="wayfinder"
												onIonItemReorder={async event => {
													console.debug('reorder event', { event })
													// We don't use this to reorder for us because it results in a flash of 'unordered' content.
													// Instead we re-order right away, calculate the new order ourselves, and update the DB.
													event.detail.complete()

													/* If the todo moves down then all the todos after its target location must be nudged up
													 * If the todo moves up then all the todos
													 */
													// TODO: Could make this easier with IDs in the DOM
													const fromTodo = data.wayfinder[event.detail.from]
													const toTodo = data.wayfinder[event.detail.to]

													const wayfinderTodos = await db.wayfinderOrder
														.orderBy('order')
														.toArray()
													const unfilteredFromIndex = wayfinderTodos.findIndex(
														({ todoId }) => todoId === fromTodo.id,
													)
													const unfilteredToIndex = wayfinderTodos.findIndex(
														({ todoId }) => todoId === toTodo.id,
													)

													const [startIndex, endIndex] =
														calculateReorderIndices(
															unfilteredFromIndex,
															unfilteredToIndex,
														)
													const start = wayfinderTodos[startIndex]?.order
													const end = wayfinderTodos[endIndex]?.order
													const newOrder = order(start, end)

													console.debug('Re-ordering', {
														originalFromIndex: event.detail.from,
														orignialToIndex: event.detail.to,
														unfilteredFromIndex,
														unfilteredToIndex,
														start,
														end,
														newOrder,
													})

													await db.wayfinderOrder.update(fromTodo.id, {
														order: newOrder,
													})
													posthog.capture('todo_reordered', {
														location: 'wayfinder',
														from_index: event.detail.from,
														to_index: event.detail.to,
													})
												}}
											>
												{data.wayfinder.length === 0 ? (
													<Placeholder heading="Wayfinder">
														Mission-critical objectives. You should aim to do
														these next. Order them manually or use{' '}
														<em>star sort</em> to order them for you ✨
													</Placeholder>
												) : (
													data.wayfinder.map((todo, index) => (
														<TodoListItem
															key={todo.id}
															data-id={todo.id}
															data-next-todo={index === 0}
															onCompletionChange={async checkboxEvent => {
																presentCompletionPopover(checkboxEvent, todo, {
																	onDidDismiss: async overlayEvent => {
																		console.debug(
																			'popover did dismiss',
																			overlayEvent,
																		)
																		if (overlayEvent.detail.role === 'visit') {
																			await db.visits.add({
																				todoId: todo.id,
																				date: new Date(),
																			})
																			posthog.capture('todo_visited', {
																				todo_id: todo.id,
																			})
																		} else if (
																			overlayEvent.detail.role === 'snooze'
																		) {
																			await db.visits.add({
																				todoId: todo.id,
																				date: new Date(),
																			})
																			posthog.capture('todo_visited', {
																				todo_id: todo.id,
																			})
																			presentSnoozeTodoModal(
																				todo,
																				ListType.wayfinder,
																			)
																		} else if (
																			overlayEvent.detail.role === 'complete'
																		) {
																			if (checkboxEvent.detail.checked) {
																				await todoRepository.complete(todo)
																				setLogLimit(limit => limit + 1)
																				posthog.capture('todo_completed', {
																					location: 'wayfinder',
																					has_star_role: !!todo.starRole,
																					star_points: todo.starPoints,
																				})
																			} else {
																				await todoRepository.uncomplete(todo)
																				setLogLimit(limit => limit - 1)
																				posthog.capture('todo_uncompleted', {
																					todo_id: todo.id,
																					location: 'wayfinder',
																				})
																			}
																		}
																	},
																})
															}}
															onClick={event => {
																presentTodoActionSheet(todo, {
																	buttons: [
																		{
																			icon: arrowUpSharp,
																			text: 'Move to top',
																			data: {
																				action: 'top',
																			},
																			handler: async () => {
																				const wayfinderTodos =
																					await db.wayfinderOrder
																						.orderBy('order')
																						.toArray()
																				const newOrder = order(
																					undefined,
																					wayfinderTodos[0]?.order,
																				)

																				await db.wayfinderOrder.update(
																					todo.id,
																					{
																						order: newOrder,
																					},
																				)
																			},
																		},
																		{
																			icon: snowSharp,
																			text: 'Move to database',
																			data: {
																				action: 'database',
																			},
																			handler: async () => {
																				db.transaction(
																					'rw',
																					db.wayfinderOrder,
																					async () => {
																						await db.wayfinderOrder.delete(
																							todo.id,
																						)
																					},
																				)
																				posthog.capture('todo_moved', {
																					from_list: 'wayfinder',
																					to_list: 'database',
																					has_star_role: !!todo.starRole,
																					star_points: todo.starPoints,
																				})
																			},
																		},
																		{
																			icon: timeSharp,
																			text: 'Snooze',
																			data: {
																				action: 'snooze',
																			},
																			handler: () =>
																				presentSnoozeTodoModal(
																					todo,
																					ListType.wayfinder,
																				),
																		},
																	],
																})
															}}
															ref={
																index === 0
																	? (nextImportantTodo as any)
																	: undefined
															}
															starRole={starRoles?.find(
																starRole => todo.starRole === starRole.id,
															)}
															todo={{ ...todo }}
														>
															<VisitInfo todo={todo} />
														</TodoListItem>
													))
												)}
											</IonReorderGroup>
										</div>
									</IonItemGroup>
								</IonList>
								{data.database.length === 0 ? (
									<div className="bg-[--ion-item-background]">
										<Placeholder heading="Database">
											A searchable database of future possible objectives, as
											infinite as the cosmos itself. You will never complete
											them all.
										</Placeholder>
									</div>
								) : (
									<Database todos={data.database} />
								)}
								<IonButton
									aria-label="Load more database todos"
									color="medium"
									expand="full"
									fill="clear"
									onClick={() => {
										setDatabaseLimit(limit => {
											const newLimit = limit + 10
											posthog.capture('load_more_database', {
												new_limit: newLimit,
											})
											return newLimit
										})
									}}
									size="small"
								>
									<IonIcon
										slot="icon-only"
										icon={chevronDownOutline}
									></IonIcon>
								</IonButton>
							</>
						)}
					</IonCol>
					<IonCol
						size="0"
						sizeLg="3"
					>
						<div></div>
					</IonCol>
				</IonRow>
			</IonGrid>
		</IonContent>
	)
}

export const SettingsMenu = () => {
	const posthog = usePostHog()
	const settings = useSettings()
	const [noteProvider, setNoteProvider] = useState<{
		type?: string
		apiKey?: string
		vault?: string
		folder?: string
	}>({})
	const noteProviderSettings = settings['#noteProvider']
	// Gross hack required because settings is initially undefined until the query resolves which doesn't re-trigger the state
	useEffect(() => {
		if (noteProviderSettings) {
			setNoteProvider(noteProviderSettings)
		}
	}, [noteProviderSettings])

	return (
		<IonMenu
			contentId="main-content"
			id="settings-menu"
			side="end"
			type="push"
		>
			<IonHeader>
				<IonToolbar>
					<Title>Settings</Title>
				</IonToolbar>
			</IonHeader>
			<IonContent className="space-y-4 ion-padding">
				<form
					id="settings"
					onSubmit={async event => {
						event.preventDefault()
						if (noteProvider.type === null) {
							setNoteProvider({})
							return db.settings.delete('#noteProvider')
						}
						await db.settings.put({
							key: '#noteProvider',
							value: noteProvider,
						})
						posthog.capture('settings_saved', {
							note_provider_type: noteProvider.type,
							has_vault: !!noteProvider.vault,
							has_folder: !!noteProvider.folder,
						})
					}}
				>
					<fieldset className="space-y-2">
						<IonSelect
							fill="outline"
							label="Note provider"
							labelPlacement="floating"
							onIonChange={event => {
								setNoteProvider(noteProvider => ({
									...noteProvider,
									type: event.detail.value,
								}))
							}}
							value={noteProvider.type || null} // defaultValue doesn't seem to work so have to make this a controlled component
						>
							<IonSelectOption value={null}>None</IonSelectOption>
							<IonSelectOption value="obsidian">Obsidian</IonSelectOption>
						</IonSelect>
						{noteProvider.type === NoteProviders.Stashpad && (
							<IonInput
								fill="outline"
								helperText="Notes are created with public permissions. API key is stored unencrypted in your database which is synced to our servers if you enable it."
								label="API key"
								labelPlacement="floating"
								onIonChange={event => {
									setNoteProvider(noteProvider => ({
										...noteProvider,
										apiKey: event.detail.value?.toString(),
									}))
								}}
								placeholder="Enter text"
								required
								value={noteProvider?.apiKey}
							></IonInput>
						)}
						{noteProvider.type === NoteProviders.Obsidian && (
							<>
								<IonInput
									fill="outline"
									helperText="The vault to use for new notes. If none is specified Obsidian will use the currently open vault."
									label="Vault"
									labelPlacement="floating"
									onIonChange={event => {
										setNoteProvider(noteProvider => ({
											...noteProvider,
											vault: event.detail.value?.toString(),
										}))
									}}
									placeholder="My Vault"
									value={noteProvider?.vault}
								></IonInput>
								<IonInput
									autocapitalize="sentences"
									fill="outline"
									helperText="The folder where the todo notes will be created. This is a path relative to the vault root. If no folder is specified the vault's default location for new notes will be used."
									label="Folder"
									labelPlacement="floating"
									onIonChange={event => {
										setNoteProvider(noteProvider => ({
											...noteProvider,
											folder: event.detail.value?.toString(),
										}))
									}}
									placeholder="My Todo Notes"
									value={noteProvider?.folder}
								></IonInput>
							</>
						)}
					</fieldset>
				</form>
				<IonButton
					id="clean-database"
					className="hidden"
					onClick={async () => {
						// Remove invalid notes from todos
						await db.todos.toCollection().modify(todo => {
							delete todo['uri']
							if (todo.note && !todo.note.uri) {
								delete todo.note
							}
						})

						// Remove empty todos
						await db.todos.where('title').equals('').delete()

						// Remove todos from important list that don't exist
						const important = await db.lists.get('#important')
						const todos = await db.todos.bulkGet(important?.order || [])
						const cleanedImportantOrder = _.zip(important!.order, todos)
							.filter(([_id, todo]) => todo !== undefined)
							.map(([id, _todo]) => id) as string[]
						await db.lists.update('#important', {
							order: cleanedImportantOrder,
						})

						// Migrate to new important order
						const wayfinderOrder = await db.wayfinderOrder
							.orderBy('order')
							.keys()
						if (wayfinderOrder.length === 0) {
							const oldOrder = await db.lists.get('#important')
							const orderKeys = starMudder(oldOrder?.order.length)
							const records = oldOrder?.order.map(todoId => ({
								todoId,
								order: orderKeys.shift(),
							}))
							db.wayfinderOrder.bulkAdd(records as any)
						}
					}}
				>
					Clean database
				</IonButton>
				<IonToast
					trigger="clean-database"
					message="Database cleaned"
					duration={2000}
				></IonToast>
			</IonContent>
			<IonFooter>
				<IonToolbar>
					<IonButtons slot="primary">
						<IonButton
							form="settings"
							id="save-settings"
							type="submit"
						>
							Save
						</IonButton>
					</IonButtons>
					<IonButtons slot="secondary">
						<IonButton
							onClick={() => {
								menuController.toggle('end')
							}}
						>
							Cancel
						</IonButton>
					</IonButtons>
				</IonToolbar>
				<IonToast
					trigger="save-settings"
					message="Settings saved"
					duration={2000}
				></IonToast>
			</IonFooter>
		</IonMenu>
	)
}

export const Journey = ({
	commonAncestor,
}: {
	commonAncestor: RefObject<HTMLElement | null>
}) => {
	const {
		nextTodo: {
			position: [nextTodoPosition],
		},
	} = useTodoContext()
	const starship = useRef<HTMLImageElement>(null)
	const [starshipY] = useStarshipYPosition(
		starship?.current,
		nextTodoPosition,
		commonAncestor.current,
	)

	return (
		<div className="min-w-[56px]">
			<Tracjectory
				className="absolute right-[27px]"
				currentPosition={starshipY}
			/>
			<div
				id="starship"
				className="absolute right-0 transition-transform duration-500 ease-in-out w-[56px] h-[56px]"
				style={{ transform: `translateY(${starshipY}px)` }}
			>
				<Starship
					className="rotate-180"
					ref={starship}
				/>
			</div>
		</div>
	)
}

export const Database = ({ todos }: { todos: Todo[] }) => {
	const posthog = usePostHog()
	const [present] = useTodoActionSheet()
	const onClick = useCallback(
		todo => {
			present(todo as Todo, {
				buttons: [
					{
						icon: rocketSharp,
						text: 'Move to wayfinder',
						data: {
							action: 'wayfinder',
						},
						handler: async () => {
							db.transaction('rw', db.wayfinderOrder, async () => {
								const wayfinderOrder = await db.wayfinderOrder
									.orderBy('order')
									.limit(1)
									.keys()
								await db.wayfinderOrder.add({
									todoId: todo.id,
									order: order(undefined, wayfinderOrder[0]?.toString()),
								})
							})
							posthog.capture('todo_moved', {
								from_list: 'database',
								to_list: 'wayfinder',
								has_star_role: !!todo.starRole,
								star_points: todo.starPoints,
							})
						},
					},
					{
						icon: checkmarkSharp,
						text: 'Complete',
						data: {
							action: 'complete',
						},
						handler: async () => {
							await db.todos.update(todo.id, {
								completedAt: new Date(),
							})
						},
					},
				],
			})
		},
		[present, posthog],
	)

	if (todos === undefined) return null

	return (
		<section id="database">
			<IonGrid className="ion-no-padding ion-margin-vertical">
				<IonRow className="gap-2">
					{todos.map(todo => (
						<TodoCard
							key={todo.id}
							onClick={_event => {
								onClick(todo)
							}}
							todo={todo}
						/>
					))}
				</IonRow>
			</IonGrid>
		</section>
	)
}

export const Searchbar = forwardRef<HTMLIonSearchbarElement>(
	function Searchbar(_props, ref) {
		const posthog = usePostHog()
		const { setQuery } = useView()

		return (
			<IonSearchbar
				ref={ref}
				className={cn(
					'mx-auto [--background:#121212]',
					!isPlatform('ios') && 'ion-no-padding',
				)}
				debounce={100}
				/* Binding to the capture phase allows the searchbar to complete its native behaviour of clearing the input.
				 * Without this the input would blur but the input would still have a value and the todos would still be filtered. */
				onKeyDownCapture={event => {
					if (event.key === 'Escape') {
						// TS complains unless we narrow the type
						if (document.activeElement instanceof HTMLElement)
							document.activeElement.blur()
						posthog.capture('keyboard_shortcut_used', {
							shortcut_key: 'Escape',
							action: 'blur_search',
						})
					}
				}}
				onIonInput={event => {
					const target = event.target as HTMLIonSearchbarElement
					let query = ''
					if (target?.value) query = target.value.toLowerCase()
					setQuery(query)
					if (query)
						posthog.capture('search_performed', { query_length: query.length })
				}}
				// placeholder="command + k to focus, / to search, is:snoozed"
			></IonSearchbar>
		)
	},
)

function JourneyLabel({ children }: ComponentProps<typeof IonItemDivider>) {
	return (
		// For some reason the dividing line between items sometimes disappears without h-8
		<IonItemDivider
			// IonItemDivider has a minimum height of 30px hence the need for min-h-fit
			// Tried these shadows to blend the background but didn't like them: bg-black shadow-[0_0_6px_6px] shadow-black
			className="h-8 bg-[--ion-background-color] top-4 -translate-x-[calc(100%+(56px-100%)/2)] lg:-translate-x-[calc(100%+56px)] -translate-y-1/2 w-fit [--background:none] [--inner-padding-end:none] ion-no-padding max-w-[56px] lg:max-w-none min-h-fit"
			sticky
		>
			{children}
		</IonItemDivider>
	)
}

function TimeInfo({
	children,
	datetime,
}: PropsWithChildren<{ datetime: string }>) {
	return (
		<IonLabel
			className="ion-no-margin"
			color="medium"
		>
			<time dateTime={datetime}>{children}</time>
		</IonLabel>
	)
}

function useGlobalKeyboardShortcuts() {
	const posthog = usePostHog()
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.target !== document.body) return

			if (event.key === '[') {
				event.preventDefault()
				menuController.toggle('start')
				posthog.capture('keyboard_shortcut_used', {
					shortcut_key: '[',
					action: 'toggle_start_menu',
				})
			} else if (event.key === ']') {
				event.preventDefault()
				menuController.toggle('end')
				posthog.capture('keyboard_shortcut_used', {
					shortcut_key: ']',
					action: 'toggle_end_menu',
				})
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [])
}

/**
 * Today group needs to be separated out as unlile the others, its rendered amongst uncompleted todos as well
 */
function useCompletedTodoGroups(
	completedTodos: LogTodoListItem[],
	visits: LogTodoListItem[],
	limit: number,
): [TodoGroup[], TodoGroup] {
	return useMemo(() => {
		// Shame we can't rely on the database query order but this is necessary due to mixing in visits.
		const pastTodos = [...completedTodos, ...visits]
			.sort(
				(a, b) =>
					dayjs(a.completedAt).valueOf() - dayjs(b.completedAt).valueOf(),
			)
			.slice(-limit)
		const groups = groupByCompletedAt(pastTodos)
		const todayGroup = groups[groups.length - 1]
		const logGroups = groups.slice(0, -1)
		return [logGroups, todayGroup]
	}, [completedTodos, limit, visits])
}

type TodoGroup = {
	longLabel: string
	shortLabel: string
	// todayDiff: number
	todos: LogTodoListItem[]
}

function VisitInfo({ todo }: { todo: TodoListItemBase }) {
	if (todo.visits === true) {
		return <IonNote>Checked in {todo.completedAt?.toDateString()}</IonNote>
	}
	if (Array.isArray(todo.visits) && todo.starPoints) {
		return (
			<PulseGraph
				visits={todo.visits}
				starPoints={todo.starPoints}
			/>
		)
	}
	return null
}
