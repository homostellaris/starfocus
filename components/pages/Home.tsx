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
	IonItem,
	IonItemDivider,
	IonItemGroup,
	IonLabel,
	IonList,
	IonMenu,
	IonPage,
	IonReorder,
	IonReorderGroup,
	IonRow,
	IonSearchbar,
	IonSelect,
	IonSelectOption,
	IonSpinner,
	IonTitle,
	IonToast,
	IonToggle,
	IonToolbar,
} from '@ionic/react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
	add,
	calendarSharp,
	chevronDownOutline,
	chevronUpOutline,
	cogSharp,
	filterSharp,
	locateOutline,
	rocketSharp,
	settingsSharp,
	timeSharp,
} from 'ionicons/icons'
import _ from 'lodash'
import {
	ComponentProps,
	forwardRef,
	RefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { Header } from '../common/Header'
import Starship from '../common/Starship'
import order, { calculateReorderIndices, starMudder } from '../common/order'
import { db, Todo } from '../db'
import { useStarshipYPosition } from '../demo/Journey'
import Tracjectory from '../landingPage/Journey/Trajectory'
import NoteProviders from '../notes/providers'
import useSettings from '../settings/useSettings'
import { TodoCard, TodoListItem } from '../todos'
import { useTodoActionSheet } from '../todos/TodoActionSheet'
import useTodoContext, { TodoContextProvider } from '../todos/TodoContext'
import { useCreateTodoModal } from '../todos/create/useCreateTodoModal'
import { groupTodosByCompletedAt } from '../todos/groupTodosByCompletedAt'
import { useSnoozeTodoModal } from '../todos/snooze/useSnoozeTodoModal'
import useView, { ViewProvider } from '../view'
import { StarRoleIcon } from '../common/StarRoleIcon'

const Home = () => {
	const searchbarRef = useRef<HTMLIonSearchbarElement>(null)
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === '/') {
				event.preventDefault()
				searchbarRef.current?.setFocus()
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
			<ViewProvider>
				<TodoContextProvider>
					<ViewMenu searchbarRef={searchbarRef} />
					<IonPage id="main-content">
						<Header title="Home" />
						<TodoLists />
						<IonFooter
							className="min-[992px]:w-[calc(66.67%+56*2px)] min-[992px]:mx-auto min-[992px]:rounded-t-lg overflow-hidden"
							translucent
						>
							<IonToolbar>
								<IonButtons slot="start">
									<IonButton
										id="view-menu-button"
										onClick={() => {
											menuController.toggle('start')
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
										id="view-menu-button"
										onClick={() => {
											menuController.toggle('start')
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
		</>
	)
}

export default Home

export const TodoLists = ({}: {}) => {
	// Initial loading & scrolling stuff
	const contentRef = useRef<HTMLIonContentElement>(null)

	// Query stuff
	const [logLimit, setLogLimit] = useState(7)
	const [iceboxLimit, setIceboxLimit] = useState(30)

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

	const { inActiveStarRoles, query } = useView()

	const todos = useLiveQuery(async () => {
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

		const todoOrderItems = await db.wayfinderOrder.orderBy('order').toArray()
		const todoIds = todoOrderItems.map(({ todoId }) => todoId)
		const wayfinderTodosPromise = db.todos.bulkGet(todoIds).then(todoIds => {
			return todoIds
				.map((todo, index) => ({
					...todo!,
					order: todoOrderItems[index].order,
					snoozedUntil: todoOrderItems[index].snoozedUntil,
				}))
				.filter(todo => matchesQuery(query, todo) && inActiveStarRoles(todo))
		})

		const iceboxTodosPromise = db.todos
			.where('id')
			.noneOf(todoOrderItems.map(({ todoId }) => todoId))
			.and(
				todo =>
					todo.completedAt === undefined &&
					matchesQuery(query, todo) &&
					inActiveStarRoles(todo),
			)
			.reverse()
			.limit(iceboxLimit)
			.toArray()

		const todos = await Promise.all([
			logTodosPromise,
			wayfinderTodosPromise,
			iceboxTodosPromise,
		])
		return {
			log: todos[0].reverse(),
			wayfinder: todos[1],
			icebox: todos[2],
		}
	}, [inActiveStarRoles, iceboxLimit, logLimit, query])

	const loading = todos === undefined
	const todosCount = useMemo(
		() =>
			todos === undefined
				? 0
				: Object.values(todos).reduce((acc, todos) => acc + todos.length, 0),
		[todos],
	)

	const starRoles = useLiveQuery(() => db.starRoles.toArray())

	// Its possible for ref not to change when todo is completed because one other than 'next' is completed in which case starship doesn't move
	// Consider using a callback ref instead: https://stackoverflow.com/questions/60881446/receive-dimensions-of-element-via-getboundingclientrect-in-react
	const nextTodoRef = useRef<HTMLIonItemElement>(null)
	const {
		nextTodo: {
			position: [nextTodoPosition, setNextTodoPosition],
		},
	} = useTodoContext()
	// console.debug({ todos })

	// TODO: When dev tools aren't open the todo has zero height
	// useLayoutEffect doesn't work
	// setTimeout 0 doesn't work
	// callbackRef doesn't work
	// This person thinks its an Ionic bug but I'm not sure: https://stackoverflow.com/questions/60881446/receive-dimensions-of-element-via-getboundingclientrect-in-react
	useEffect(() => {
		if (nextTodoRef.current) {
			console.debug('Setting next todo with ID', nextTodoRef.current.dataset.id)
			const domRect = nextTodoRef.current.getBoundingClientRect()
			setNextTodoPosition({
				height: domRect.height,
				top: nextTodoRef.current.offsetTop,
			}) // Send this rather than the current ref as if unchanged then is will be memoised and nothing will happen.
		} else {
			console.debug('No next todo ref')
			setNextTodoPosition(null) // Send this rather than the current ref as if unchanged then is will be memoised and nothing will happen.
		}
	}, [nextTodoRef, setNextTodoPosition, todos]) // The todos dep is used as an imperfect proxy for one the position of the next todo changes

	// Keyboard shortcut stuff
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.target !== document.body) return

			if (event.key === 'c') {
				event.preventDefault()
				openCreateTodoModal()
				if (fab.current) fab.current.activated = true
			} else if (event.key === 's') {
				event.preventDefault()
				const y = nextTodoPosition ? nextTodoPosition.top + 32 : 0
				contentRef.current?.scrollToPoint(undefined, y, 500)
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [contentRef, fab, nextTodoPosition, openCreateTodoModal])

	const [present] = useTodoActionSheet()
	const [presentSnoozeTodoModal] = useSnoozeTodoModal()

	const [logGroups, todayCompletedTodos] = useMemo(() => {
		if (!todos?.log) return [[], []]
		const groups = groupTodosByCompletedAt(todos.log)
		const todayGroup = groups[groups.length - 1]
		const logGroups = groups.slice(0, -1)
		return [logGroups, todayGroup.todos]
	}, [todos?.log])

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
						sizeLg="2"
					>
						<IonFab className="fixed min-[992px]:left-[calc(100vw/12*2-40px-18px)] bottom-16">
							<IonFabButton
								color="success"
								onClick={openCreateTodoModal}
								size="small"
							>
								<IonIcon icon={add}></IonIcon>
							</IonFabButton>
						</IonFab>
						<IonButton
							className="fixed left-[calc(23px-10px)] min-[992px]:left-[calc(100vw/12*2-40px-6px)] bottom-[calc(64px+52px)] z-10"
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
						<Journey commonAncestor={contentRef} />
					</IonCol>
					<IonCol sizeLg="8">
						{/* TODO: Use suspense instead */}
						{loading ? (
							<div className="flex items-center justify-center h-full">
								<IonSpinner
									className="w-20 h-20"
									name="dots"
								/>
							</div>
						) : todosCount === 0 ? (
							<div className="flex flex-col items-center justify-center gap-5 m-4 h-fit">
								<IonIcon
									icon={rocketSharp}
									size="large"
								/>
								<p>Create some todos to get started</p>
							</div>
						) : (
							<>
								<IonButton
									aria-label="Load more log todos"
									color="medium"
									expand="full"
									fill="clear"
									onClick={() => setLogLimit(limit => limit + 10)}
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
									{logGroups.map(group => (
										<IonItemGroup key={group.label}>
											<JourneyLabel>
												<TimeInfo
													datetime={new Date().toISOString().split('T')[0]}
													label={group.label}
												/>
											</JourneyLabel>
											<div className="-mt-8">
												{group.todos.map(todo => (
													<TodoListItem
														key={todo.id}
														onSelect={_event => {
															present(todo)
														}}
														onCompletionChange={event => {
															db.transaction(
																'rw',
																db.wayfinderOrder,
																db.todos,
																async () => {
																	const wayfinderOrder = await db.wayfinderOrder
																		.orderBy('order')
																		.limit(1)
																		.keys()
																	await Promise.all([
																		db.wayfinderOrder.add({
																			todoId: todo.id,
																			order: order(
																				undefined,
																				wayfinderOrder[0]?.toString(),
																			),
																		}),
																		db.todos.update(todo.id, {
																			completedAt: event.detail.checked
																				? new Date()
																				: undefined,
																		}),
																	])
																},
															)
															setLogLimit(limit => limit - 1)
														}}
														starRole={starRoles?.find(
															starRole => todo.starRole === starRole.id,
														)}
														todo={todo}
													>
														<IonIcon
															color="medium"
															icon={calendarSharp}
															slot="end"
															title={`Completed on ${todo.completedAt?.toDateString()}`}
														></IonIcon>
													</TodoListItem>
												))}
											</div>
										</IonItemGroup>
									))}
									<IonItemGroup>
										<JourneyLabel>
											<TimeInfo
												datetime={new Date().toISOString().split('T')[0]}
												label="Today"
												key="today"
											/>
										</JourneyLabel>
										<div className="-mt-8">
											{todayCompletedTodos.map(todo => (
												<TodoListItem
													key={todo.id}
													onSelect={_event => {
														present(todo)
													}}
													onCompletionChange={event => {
														db.transaction(
															'rw',
															db.wayfinderOrder,
															db.todos,
															async () => {
																const wayfinderOrder = await db.wayfinderOrder
																	.orderBy('order')
																	.limit(1)
																	.keys()
																await Promise.all([
																	db.wayfinderOrder.add({
																		todoId: todo.id,
																		order: order(
																			undefined,
																			wayfinderOrder[0]?.toString(),
																		),
																	}),
																	db.todos.update(todo.id, {
																		completedAt: event.detail.checked
																			? new Date()
																			: undefined,
																	}),
																])
															},
														)
														setLogLimit(limit => limit - 1)
													}}
													starRole={starRoles?.find(
														starRole => todo.starRole === starRole.id,
													)}
													todo={todo}
												>
													<IonIcon
														color="medium"
														icon={calendarSharp}
														slot="end"
														title={`Completed on ${todo.completedAt?.toDateString()}`}
													></IonIcon>
												</TodoListItem>
											))}
											<IonReorderGroup
												disabled={false}
												onIonItemReorder={async event => {
													console.debug('reorder event', { event })
													// We don't use this to reorder for us because it results in a flash of 'unordered' content.
													// Instead we re-order right away, calculate the new order ourselves, and update the DB.
													event.detail.complete()

													/* If the todo moves down then all the todos after its target location must be nudged up
													 * If the todo moves up then all the todos
													 */
													// TODO: Could make this easier with IDs in the DOM
													const fromTodo = todos.wayfinder[event.detail.from]
													const toTodo = todos.wayfinder[event.detail.to]

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
												}}
											>
												{todos.wayfinder.map((todo, index) => (
													<TodoListItem
														key={todo.id}
														data-id={todo.id}
														data-next-todo={index === 0}
														onCompletionChange={async event => {
															db.transaction(
																'rw',
																db.wayfinderOrder,
																db.todos,
																async () => {
																	await Promise.all([
																		db.wayfinderOrder.delete(todo.id),
																		db.todos.update(todo.id, {
																			completedAt: event.detail.checked
																				? new Date()
																				: undefined,
																		}),
																	])
																},
															)
															setLogLimit(limit => limit + 1)
														}}
														onSelect={event => {
															// Prevent the action sheet from opening when reordering
															if (event.target['localName'] === 'ion-item')
																return

															present(todo, {
																buttons: [
																	{
																		text: 'Move to icebox',
																		data: {
																			action: 'icebox',
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
																		},
																	},
																	{
																		text: 'Snooze',
																		data: {
																			action: 'snooze',
																		},
																		handler: () => presentSnoozeTodoModal(todo),
																	},
																],
															})
														}}
														ref={index === 0 ? (nextTodoRef as any) : undefined}
														starRole={starRoles?.find(
															starRole => todo.starRole === starRole.id,
														)}
														todo={{ ...todo }}
													>
														<IonReorder
															slot="end"
															title={`Rank ${index + 1}`}
														></IonReorder>
													</TodoListItem>
												))}
											</IonReorderGroup>
										</div>
									</IonItemGroup>
								</IonList>
								<Icebox todos={todos.icebox} />
								<IonButton
									aria-label="Load more icebox todos"
									color="medium"
									expand="full"
									fill="clear"
									onClick={() => setIceboxLimit(limit => limit + 10)}
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
						sizeLg="2"
					>
						<div></div>
					</IonCol>
				</IonRow>
			</IonGrid>
		</IonContent>
	)
}

export const MiscMenu = () => {
	const settings = useSettings()
	const [noteProvider, setNoteProvider] = useState<{
		type?: string
		apiKey?: string
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
			id="misc-menu"
			type="push"
		>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Misc</IonTitle>
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
						if (!noteProvider.type || !noteProvider.apiKey) {
							throw new TypeError('Note provider but no API key!')
						}
						await db.settings.put({
							key: '#noteProvider',
							value: {
								type: noteProvider?.type,
								apiKey: noteProvider?.apiKey,
							},
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
							<IonSelectOption value="stashpad">Stashpad</IonSelectOption>
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
					</fieldset>
				</form>
				<IonButton
					id="clean-database"
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
						<IonButton>Cancel</IonButton>
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

export const ViewMenu = ({
	searchbarRef,
}: {
	searchbarRef: RefObject<HTMLIonSearchbarElement>
}) => {
	const starRoles = useLiveQuery(() => db.starRoles.toArray())
	const isLoading = starRoles === undefined
	const {
		activateStarRole,
		activeStarRoles,
		deactivateStarRole,
		setActiveStarRoles,
		setQuery,
	} = useView()

	return (
		<IonMenu
			contentId="main-content"
			id="view-menu"
			side="start"
			type="push"
		>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Views</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="space-y-4 ion-padding">
				<IonButton
					color="warning"
					expand="block"
					onClick={() => {
						if (searchbarRef.current) {
							searchbarRef.current.value = 'is:snoozed'
							// Setting the value doesn't trigger ionic searchbar events so need to also set query ourselves
							setQuery('is:snoozed')
						}
					}}
				>
					View snoozed
					<IonIcon
						slot="end"
						icon={timeSharp}
					></IonIcon>
				</IonButton>
				<IonButton
					expand="block"
					routerLink="/constellation"
				>
					Edit roles
					<IonIcon
						slot="end"
						icon={rocketSharp}
					></IonIcon>
				</IonButton>
				{isLoading ? (
					<IonSpinner
						className="w-20 h-20"
						name="dots"
					/>
				) : (
					<div className="space-y-2">
						<IonList>
							<IonItem>
								All
								<IonToggle
									checked={starRoles.length + 1 === activeStarRoles.length}
									color="secondary"
									className="font-bold"
									onIonChange={event => {
										if (event.detail.checked) {
											setActiveStarRoles([...starRoles.map(({ id }) => id), ''])
										} else {
											setActiveStarRoles([])
										}
									}}
									slot="end"
								></IonToggle>
							</IonItem>
							<IonItem>
								None
								<IonButton
									fill="clear"
									onClick={() => {
										setActiveStarRoles([''])
									}}
									shape="round"
									slot="end"
									size="small"
								>
									<IonIcon
										icon={locateOutline}
										slot="icon-only"
									></IonIcon>
								</IonButton>
								<IonToggle
									checked={activeStarRoles.includes('')}
									color="secondary"
									onIonChange={event => {
										if (event.detail.checked) {
											activateStarRole('')
										} else {
											deactivateStarRole('')
										}
									}}
									slot="end"
								></IonToggle>
							</IonItem>
							{starRoles.map(starRole => (
								<IonItem key={starRole.id}>
									<StarRoleIcon starRole={starRole} />
									{starRole?.title}
									<IonButton
										fill="clear"
										onClick={() => {
											setActiveStarRoles([starRole.id])
										}}
										shape="round"
										slot="end"
										size="small"
									>
										<IonIcon
											icon={locateOutline}
											slot="icon-only"
										></IonIcon>
									</IonButton>
									<IonToggle
										checked={activeStarRoles.includes(starRole.id)}
										color="secondary"
										onIonChange={event => {
											event.detail.checked
												? activateStarRole(starRole.id)
												: deactivateStarRole(starRole.id)
										}}
										slot="end"
									></IonToggle>
								</IonItem>
							))}
						</IonList>
					</div>
				)}
			</IonContent>
		</IonMenu>
	)
}

export const Journey = ({
	commonAncestor,
}: {
	commonAncestor: RefObject<HTMLElement>
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
			<Tracjectory className="absolute right-[27px]" />
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

export const Icebox = ({ todos }: { todos: Todo[] }) => {
	const [present] = useTodoActionSheet()
	const onClick = useCallback(
		todo => {
			present(todo as Todo, {
				buttons: [
					{
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
						},
					},
					{
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
					...(todo.note
						? [
								{
									text: 'Open note',
									data: {
										action: 'open-note',
									},
									handler: () => {
										window.open(todo.note.uri)
									},
								},
							]
						: []),
				],
			})
		},
		[present],
	)

	if (todos === undefined) return null

	return (
		<section id="icebox">
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
		const { setQuery } = useView()

		return (
			<IonSearchbar
				ref={ref}
				className="mx-auto [--background:#121212]"
				debounce={100}
				/* Binding to the capture phase allows the searchbar to complete its native behaviour of clearing the input.
				 * Without this the input would blur but the input would still have a value and the todos would still be filtered. */
				onKeyDownCapture={event => {
					if (event.key === 'Escape') {
						// TS complains unless we narrow the type
						if (document.activeElement instanceof HTMLElement)
							document.activeElement.blur()
					}
				}}
				onIonInput={event => {
					const target = event.target as HTMLIonSearchbarElement
					let query = ''
					if (target?.value) query = target.value.toLowerCase()
					setQuery(query)
				}}
			></IonSearchbar>
		)
	},
)

function JourneyLabel({ children }: ComponentProps<typeof IonItemDivider>) {
	return (
		<IonItemDivider
			className="top-4 h-8 -translate-x-[calc(100%+56px)] -translate-y-1/2 w-fit [--background:none] [--inner-padding-end:none]"
			sticky
		>
			{children}
		</IonItemDivider>
	)
}

function TimeInfo({ datetime, label }: { datetime: string; label: string }) {
	return (
		<IonLabel color="medium">
			<time dateTime={datetime}>{label}</time>
		</IonLabel>
	)
}

function matchesQuery(query: string, todo: Todo & { snoozedUntil?: Date }) {
	if (!query && todo.snoozedUntil && todo.snoozedUntil > new Date()) {
		return false
	}
	if (!query) {
		return true
	}
	if (todo.snoozedUntil && query === 'is:snoozed') {
		return true
	}
	return todo?.title.toLowerCase().includes(query)
}

function useGlobalKeyboardShortcuts() {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === '[') {
				event.preventDefault()
				menuController.toggle('start')
			} else if (event.key === ']') {
				event.preventDefault()
				menuController.toggle('end')
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [])
}
