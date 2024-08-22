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

const Home = () => {
	const [ready, setReady] = useState<{
		log: boolean
		important: boolean
		icebox: boolean
	}>({
		log: false,
		important: false,
		icebox: false,
	})
	const isLoading = useMemo(
		() => Object.values(ready).some(ready => ready === false),
		[ready],
	)

	const [logLimit, setLogLimit] = useState(7)
	const [iceboxLimit, setIceboxLimit] = useState(30)

	// Creating todo stuff
	const fab = useRef<HTMLIonFabElement>(null)
	const [presentCreateTodoModal, dismiss] = useCreateTodoModal()
	const openCreateTodoModal = useCallback(() => {
		presentCreateTodoModal({
			onWillDismiss: () => {
				if (fab.current) fab.current.activated = false
			},
		})
	}, [fab, presentCreateTodoModal])

	const contentRef = useRef<HTMLIonContentElement>(null)
	const searchbarRef = useRef<HTMLIonSearchbarElement>(null)

	useGlobalKeyboardShortcuts(contentRef, searchbarRef, fab, openCreateTodoModal)

	const [enablePagination, setEnablePagination] = useState(false)

	useEffect(() => {
		setTimeout(() => {
			// TODO: See if ionViewDidEnter works better than setTimeout
			console.debug('scrolling to bottom', contentRef.current)
			contentRef.current?.scrollToBottom(500)
			setTimeout(() => {
				setEnablePagination(true)
			}, 500)
		}, 200)
	}, [])

	return (
		<>
			<ViewProvider>
				<MiscMenu />
				<ViewMenu />
				<IonPage id="main-content">
					<Header title="Home" />
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
							<SelectedTodoProvider>
								<Log
									limit={logLimit}
									onLoad={() => setReady(state => ({ ...state, log: true }))}
								/>
								<Important
									onLoad={() =>
										setReady(state => ({ ...state, important: true }))
									}
								/>
								<Icebox
									limit={iceboxLimit}
									onLoad={() => setReady(state => ({ ...state, icebox: true }))}
								/>
							</SelectedTodoProvider>
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
							<Searchbar ref={searchbarRef} />
						</IonToolbar>
					</IonFooter>
				</IonPage>
			</ViewProvider>
		</>
	)
}

export default Home

export const SyncState = () => {}

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
				<IonButton href="/constellation">Edit roles</IonButton>
				{isLoading ? (
					<IonSpinner
						className="w-20 h-20"
						name="dots"
					/>
				) : (
					<div className="space-y-2">
						<IonList>
							<IonItem>
								<IonToggle
									checked={starRoles.length + 1 === activeStarRoles.length}
									color="success"
									className="font-bold"
									onIonChange={event => {
										if (event.detail.checked) {
											setActiveStarRoles([...starRoles.map(({ id }) => id), ''])
										} else {
											setActiveStarRoles([])
										}
									}}
								>
									All
								</IonToggle>
							</IonItem>
							<IonItem>
								<IonToggle
									checked={activeStarRoles.includes('')}
									color="success"
									onIonChange={event => {
										if (event.detail.checked) {
											activateStarRole('')
										} else {
											deactivateStarRole('')
										}
									}}
								>
									None
								</IonToggle>
							</IonItem>
							{starRoles.map(starRole => (
								<IonItem key={starRole.id}>
									<IonToggle
										checked={activeStarRoles.includes(starRole.id)}
										color="success"
										onIonChange={event => {
											event.detail.checked
												? activateStarRole(starRole.id)
												: deactivateStarRole(starRole.id)
										}}
									>
										{starRole?.title}
									</IonToggle>
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
		console.debug('re-running log query')
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
			console.log('READY')
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
									db.transaction('rw', db.todos, db.lists, async () => {
										const list = await db.lists.get('#important')
										await Promise.all([
											db.lists.update('#important', {
												order: [todo.id, ...list!.order],
											}),
											db.todos.update(todo.id, {
												completedAt: event.detail.checked
													? new Date()
													: undefined,
											}),
										])
									})
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

export const Important = ({ onLoad }: { onLoad: () => void }) => {
	const { inActiveStarRoles, query } = useView()

	const importantList = useLiveQuery(() => db.lists.get('#important'))
	const todos = useLiveQuery(async () => {
		console.debug('re-running important query')
		if (importantList === undefined) return
		return (await db.todos.bulkGet(importantList!.order)).filter(
			todo => matchesQuery(query, todo!) && inActiveStarRoles(todo!),
		) as Todo[]
	}, [importantList, inActiveStarRoles, query])

	const starRoles = useLiveQuery(() => db.starRoles.toArray())

	useEffect(() => {
		if (todos !== undefined) {
			setTimeout(onLoad, 2000)
		}
	}, [todos])

	const [present] = useTodoActionSheet()

	if (todos === undefined) return null

	return (
		<section id="important">
			<h1>Important</h1>
			{todos?.length && importantList ? (
				<IonList inset>
					<IonReorderGroup
						disabled={false}
						onIonItemReorder={async event => {
							console.log({ event })
							// We don't use this to reorder for us because it results in a flash of 'unordered' content.
							// Instead we re-order right away, calculate the new order ourselves, and update the DB.
							event.detail.complete()

							const fromIndex = importantList.order.indexOf(
								todos[event.detail.from].id,
							)
							const toIndex = importantList.order.indexOf(
								todos[event.detail.to].id,
							)
							const reorderedTodoIds = moveItemInArray(
								importantList.order,
								fromIndex,
								toIndex,
							)
							await db.lists.put({
								type: '#important',
								order: reorderedTodoIds,
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
													db.transaction('rw', db.lists, async () => {
														const list = await db.lists.get('#important')
														await db.lists.update('#important', {
															order: removeItemFromArray(
																list!.order,
																list!.order.indexOf(todo.id),
															),
														})
													})
												},
											},
										],
									})
								}}
								key={todo.id}
							>
								<IonCheckbox
									aria-label="Uncomplete todo"
									slot="start"
									onClick={event => {
										// Prevents the IonItem onClick from firing when completing a todo
										event.stopPropagation()
									}}
									onIonChange={async event => {
										const todoIds = [...todos.map(i => i.id)]
										const orderWithoutItem = removeItemFromArray(
											todoIds,
											todoIds.indexOf(todo.id),
										)
										db.transaction('rw', db.lists, db.todos, async () => {
											await Promise.all([
												db.lists.put({
													type: '#important',
													order: orderWithoutItem,
												}),
												db.todos.update(todo.id, {
													completedAt: event.detail.checked
														? new Date()
														: undefined,
												}),
											])
										})
									}}
								/>
								<IonLabel>{todo?.title}</IonLabel>
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
		console.debug('re-running icebox query')
		const importantList = await db.lists.get('#important')
		return db.todos
			.where('id')
			.noneOf(importantList!.order)
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
						text: 'Move to important',
						data: {
							action: 'important',
						},
						handler: async () => {
							db.transaction('rw', db.lists, async () => {
								const list = await db.lists.get('#important')
								db.lists.update('#important', {
									order: [...list!.order, todo.id],
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

export const Searchbar = forwardRef<HTMLIonSearchbarElement>(
	function Searchbar(_props, searchbarRef) {
		const { setQuery } = useView()

		return (
			<IonSearchbar
				ref={searchbarRef}
				debounce={100}
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

function moveItemInArray<T>(
	array: T[],
	fromIndex: number,
	toIndex: number,
): T[] {
	const newArray = [...array]
	const item = newArray.splice(fromIndex, 1)[0]
	newArray.splice(toIndex, 0, item)
	return newArray
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

function useGlobalKeyboardShortcuts(
	contentRef: RefObject<HTMLIonContentElement>,
	searchbarRef: RefObject<HTMLIonSearchbarElement>,
	fab: RefObject<HTMLIonFabElement>,
	openCreateTodoModal: any,
) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === '/') {
				event.preventDefault()
				searchbarRef.current?.setFocus()
			} else if (event.key === '[') {
				event.preventDefault()
				menuController.toggle('start')
			} else if (event.key === ']') {
				event.preventDefault()
				menuController.toggle('end')
			}

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
	}, [contentRef, fab, openCreateTodoModal, searchbarRef])
}
