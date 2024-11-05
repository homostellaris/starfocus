import { menuController } from '@ionic/core/components'
import {
	IonButton,
	IonButtons,
	IonCard,
	IonCardHeader,
	IonCardTitle,
	IonCheckbox,
	IonContent,
	IonFab,
	IonFabButton,
	IonFooter,
	IonGrid,
	IonHeader,
	IonIcon,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonMenu,
	IonMenuButton,
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
	checkmarkDoneCircleSharp,
	documentText,
	filterSharp,
	locateOutline,
	rocketSharp,
} from 'ionicons/icons'
import _ from 'lodash'
import {
	forwardRef,
	RefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { Header } from '../common/Header'
import { db, Todo } from '../db'
import NoteProviders from '../notes/providers'
import useSettings from '../settings/useSettings'
import { getIonIcon } from '../starRoles/icons'
import { SelectedTodoProvider } from '../todos/SelectedTodo'
import { useTodoActionSheet } from '../todos/TodoActionSheet'
import { useCreateTodoModal } from '../todos/create/useCreateTodoModal'
import useView, { ViewProvider } from '../view'
import order, { calculateReorderIndices, starMudder } from '../common/order'

const Home = () => {
	useGlobalKeyboardShortcuts()

	return (
		<>
			<ViewProvider>
				<SelectedTodoProvider>
					<MiscMenu />
					<ViewMenu />
					<IonPage id="main-content">
						<Header title="Home" />
						<TodoLists />
						<IonFooter>
							<IonToolbar>
								<IonButtons slot="primary">
									<IonButton
										id="view-menu-button"
										onClick={() => {
											menuController.toggle('end')
										}}
									>
										<IonIcon
											icon={filterSharp}
											slot="icon-only"
										/>
									</IonButton>
								</IonButtons>
								<IonButtons
									id="misc-menu-button"
									slot="start"
								>
									<IonMenuButton></IonMenuButton>
								</IonButtons>
								<Searchbar />
							</IonToolbar>
						</IonFooter>
					</IonPage>
				</SelectedTodoProvider>
			</ViewProvider>
		</>
	)
}

export default Home

export const TodoLists = ({}: {}) => {
	// Initial loading & scrolling stuff
	const contentRef = useRef<HTMLIonContentElement>(null)
	const [enablePagination, setEnablePagination] = useState(false)
	useEffect(() => {
		setTimeout(() => {
			// TODO: See if ionViewDidEnter works better than setTimeout
			console.debug('Scrolling to bottom', contentRef.current)
			contentRef.current?.scrollToBottom(500)
			setTimeout(() => {
				setEnablePagination(true)
			}, 500)
		}, 200)
	}, [])

	// Loading spinner stuff
	const [ready, setReady] = useState<{
		log: boolean
		wayfinder: boolean
		icebox: boolean
	}>({
		log: false,
		wayfinder: false,
		icebox: false,
	})
	const isLoading = useMemo(
		() => Object.values(ready).some(ready => ready === false),
		[ready],
	)

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
				contentRef.current?.scrollToBottom(500)
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [contentRef, fab, openCreateTodoModal])

	return (
		<IonContent
			className="ion-padding"
			fullscreen
			ref={contentRef}
		>
			{isLoading && (
				<div className="flex items-center justify-center h-full">
					<IonSpinner
						className="w-20 h-20"
						name="dots"
					/>
				</div>
			)}
			<>
				<IonInfiniteScroll
					className="h-1"
					disabled={!enablePagination}
					position="top"
					threshold="0px"
					onIonInfinite={event => {
						setLogLimit(limit => limit + 10)
						setTimeout(() => event.target.complete(), 500)
					}}
				>
					<IonInfiniteScrollContent></IonInfiniteScrollContent>
				</IonInfiniteScroll>
				<Log
					limit={logLimit}
					onLoad={() => setReady(state => ({ ...state, log: true }))}
				/>
				<Wayfinder
					onLoad={() => setReady(state => ({ ...state, wayfinder: true }))}
				/>
				<Icebox
					limit={iceboxLimit}
					onLoad={() => setReady(state => ({ ...state, icebox: true }))}
				/>
				<IonInfiniteScroll
					disabled={!enablePagination}
					position="bottom"
					threshold="0px"
					onIonInfinite={event => {
						setIceboxLimit(limit => limit + 10)
						setTimeout(() => event.target.complete(), 500)
					}}
				>
					<IonInfiniteScrollContent></IonInfiniteScrollContent>
				</IonInfiniteScroll>
				<IonFab
					ref={fab}
					slot="fixed"
					vertical="bottom"
					horizontal="end"
				>
					<IonFabButton onClick={openCreateTodoModal}>
						<IonIcon icon={add}></IonIcon>
					</IonFabButton>
				</IonFab>
			</>
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

export const ViewMenu = () => {
	const starRoles = useLiveQuery(() => db.starRoles.toArray())
	const isLoading = starRoles === undefined
	const {
		activateStarRole,
		activeStarRoles,
		deactivateStarRole,
		setActiveStarRoles,
	} = useView()

	return (
		<IonMenu
			contentId="main-content"
			id="view-menu"
			side="end"
			type="push"
		>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Views</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="space-y-4 ion-padding">
				<IonButton routerLink="/constellation">Edit roles</IonButton>
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

export const Log = ({
	limit,
	onLoad,
}: {
	limit: number
	onLoad: () => void
}) => {
	const { inActiveStarRoles, query } = useView()

	const todos = useLiveQuery(async () => {
		console.debug('Re-running log query')
		return db.todos
			.orderBy('completedAt')
			.reverse()
			.filter(
				todo =>
					!!todo.completedAt &&
					matchesQuery(query, todo) &&
					inActiveStarRoles(todo),
			)
			.limit(limit)
			.toArray()
	}, [inActiveStarRoles, limit, query])

	useEffect(() => {
		if (todos !== undefined) {
			onLoad()
		}
	}, [todos])

	const [present] = useTodoActionSheet()

	if (todos === undefined) return null

	return (
		<section id="log">
			<h1>Log</h1>
			{todos?.length ? (
				<IonList inset>
					{todos.sort(byDate).map(todo => (
						<IonItem
							button
							className="todo"
							key={todo.id}
							onClick={_event => {
								present(todo)
							}}
						>
							<IonCheckbox
								aria-label="Uncomplete todo"
								slot="start"
								onClick={event => {
									// Prevents the IonItem onClick from firing when completing a todo
									event.stopPropagation()
								}}
								onIonChange={async event => {
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
													order: order(undefined, wayfinderOrder[0].toString()),
												}),
												db.todos.update(todo.id, {
													completedAt: event.detail.checked
														? new Date()
														: undefined,
												}),
											])
										},
									)
								}}
								checked={!!todo.completedAt}
							/>
							<IonLabel>{todo?.title}</IonLabel>
						</IonItem>
					))}
				</IonList>
			) : (
				<div className="flex flex-col items-center justify-center gap-5 h-fit">
					<IonIcon
						icon={checkmarkDoneCircleSharp}
						size="large"
					/>
					<p>Your completed todos will appear here</p>
				</div>
			)}
		</section>
	)
}

export const Wayfinder = ({ onLoad }: { onLoad: () => void }) => {
	const { inActiveStarRoles, query } = useView()

	const todos = useLiveQuery(async () => {
		const todoOrderItems = await db.wayfinderOrder.orderBy('order').toArray()
		const todoIds = todoOrderItems.map(({ todoId }) => todoId)
		return (await db.todos.bulkGet(todoIds))
			.map((todo, index) => ({ ...todo!, order: todoOrderItems[index].order }))
			.filter(
				todo => matchesQuery(query, todo) && inActiveStarRoles(todo),
			) as (Todo & { order: string })[]
	}, [inActiveStarRoles, query])

	const starRoles = useLiveQuery(() => db.starRoles.toArray())

	useEffect(() => {
		if (todos !== undefined) {
			setTimeout(onLoad, 2000)
		}
	}, [todos])

	const [debug, setDebug] = useState('')
	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const searchQuery = params.get('debug')
		if (searchQuery) {
			setDebug(searchQuery)
		}
	}, [])

	const [present] = useTodoActionSheet()

	if (todos === undefined) return null

	return (
		<section id="wayfinder">
			<h1>Wayfinder</h1>
			{todos?.length ? (
				<IonList inset>
					<IonReorderGroup
						disabled={false}
						onIonItemReorder={async event => {
							// We don't use this to reorder for us because it results in a flash of 'unordered' content.
							// Instead we re-order right away, calculate the new order ourselves, and update the DB.
							event.detail.complete()

							const wayfinderTodos = await db.wayfinderOrder
								.orderBy('order')
								.toArray()
							/* If the todo moves down then all the todos after its target location must be nudged up
							 * If the todo moves up then all the todos
							 */
							// TODO: Could make this easier with IDs in the DOM
							const fromTodo = todos[event.detail.from]
							const toTodo = todos[event.detail.to]
							const unfilteredFromIndex = wayfinderTodos.findIndex(
								({ todoId }) => todoId === fromTodo.id,
							)
							const unfilteredToIndex = wayfinderTodos.findIndex(
								({ todoId }) => todoId === toTodo.id,
							)

							const [startIndex, endIndex] = calculateReorderIndices(
								unfilteredFromIndex,
								unfilteredToIndex,
							)
							const start = wayfinderTodos[startIndex]?.order
							const end = wayfinderTodos[endIndex]?.order
							const newOrder = order(start, end)

							console.debug('Re-ordering', {
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
						{todos.map(todo => (
							<IonItem
								button
								className="todo"
								onClick={event => {
									// Prevent the action sheet from opening when reordering
									if (event.target['localName'] === 'ion-item') return

									present(todo, {
										buttons: [
											{
												text: 'Move to icebox',
												data: {
													action: 'icebox',
												},
												handler: async () => {
													db.transaction('rw', db.wayfinderOrder, async () => {
														await db.wayfinderOrder.delete(todo.id)
													})
												},
											},
										],
									})
								}}
								key={todo.id}
							>
								<IonCheckbox
									aria-label="Complete todo"
									slot="start"
									onClick={event => {
										// Prevents the IonItem onClick from firing when completing a todo
										event.stopPropagation()
									}}
									onIonChange={async event => {
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
									}}
								/>
								<IonLabel>{todo?.title}</IonLabel>
								{debug && (
									<span className="space-x-2">
										<data className="text-gray-500">{todo.id}</data>
										<data className="text-gray-500">{todo.order}</data>
									</span>
								)}
								{todo.starRole && (
									<IonIcon
										icon={getIonIcon(
											starRoles?.find(starRole => starRole.id === todo.starRole)
												?.icon?.name,
										)}
										slot="end"
									/>
								)}
								{todo.note && (
									<a
										href={todo.note.uri}
										target="_blank"
									>
										<IonIcon icon={documentText}></IonIcon>
									</a>
								)}
								<IonReorder slot="end"></IonReorder>
							</IonItem>
						))}
					</IonReorderGroup>
				</IonList>
			) : (
				<div className="flex flex-col items-center justify-center gap-5 h-fit">
					<IonIcon
						icon={rocketSharp}
						size="large"
					/>
					<p>Create some todos to get started</p>
				</div>
			)}
		</section>
	)
}

export const Icebox = ({
	limit,
	onLoad,
}: {
	limit: number
	onLoad: () => void
}) => {
	const { inActiveStarRoles, query } = useView()

	const todos = useLiveQuery(async () => {
		console.debug('Re-running icebox query')
		const todoOrderItems = await db.wayfinderOrder.orderBy('order').toArray()
		return db.todos
			.where('id')
			.noneOf(todoOrderItems.map(({ todoId }) => todoId))
			.and(
				todo =>
					todo.completedAt === undefined &&
					matchesQuery(query, todo) &&
					inActiveStarRoles(todo),
			)
			.reverse()
			.limit(limit)
			.toArray()
	}, [limit, inActiveStarRoles, query])

	useEffect(() => {
		if (todos !== undefined) onLoad()
	}, [todos])

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
			<IonGrid>
				<h1>Icebox</h1>
				<IonRow>
					{todos === undefined ? (
						<IonSpinner
							className="w-20 h-20"
							name="dots"
						/>
					) : (
						todos.map(todo => (
							<IceboxItem
								key={todo.id}
								onClick={onClick}
								todo={todo}
							/>
						))
					)}
				</IonRow>
			</IonGrid>
		</section>
	)
}

export const IceboxItem = ({
	onClick,
	todo,
}: {
	onClick: (todo: Todo) => void
	todo: Todo
}) => {
	return (
		<IonCard
			className="cursor-pointer todo"
			onClick={_event => {
				onClick(todo)
			}}
		>
			<IonCardHeader>
				<IonCardTitle className="text-sm">{todo.title}</IonCardTitle>
			</IonCardHeader>
		</IonCard>
	)
}

export const Searchbar = () => {
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
	const { setQuery } = useView()

	return (
		<IonSearchbar
			ref={searchbarRef}
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
}

const removeItemFromArray = (array: any[], index: number): any[] => {
	const newArray = [...array]
	newArray.splice(index, 1)
	return newArray
}

const byDate = (a: any, b: any) => {
	const dateA = new Date(a.completedAt)
	const dateB = new Date(b.completedAt)
	return dateA.getTime() - dateB.getTime()
}

function matchesQuery(query: string, todo: Todo) {
	if (!query) return true
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
