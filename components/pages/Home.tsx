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
	IonModal,
	IonPage,
	IonReorder,
	IonReorderGroup,
	IonRow,
	IonSearchbar,
	IonSelect,
	IonSelectOption,
	IonSpinner,
	IonTextarea,
	IonTitle,
	IonToast,
	IonToolbar,
	ItemReorderEventDetail,
} from '@ionic/react'
import { useLiveQuery, useObservable } from 'dexie-react-hooks'
import {
	add,
	checkmarkDoneCircleSharp,
	cloudDoneSharp,
	cloudOfflineSharp,
	documentText,
	filterSharp,
	logOutSharp,
	rocketSharp,
} from 'ionicons/icons'
import _ from 'lodash'
import { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreatedTodo, db } from '../db'
import NoteProviders from '../notes/providers'
import useNoteProvider from '../notes/useNoteProvider'
import useSettings from '../settings/useSettings'
import { SelectedTodoProvider } from '../todos/SelectedTodo'
import { useTodoActionSheet } from '../todos/TodoActionSheet'
import { useCreateTodoModal } from '../todos/CreateTodo'

const Home = () => {
	// Search stuff
	const handleInput = (event: Event) => {
		const target = event.target as HTMLIonSearchbarElement
		let query = ''
		if (target?.value) query = target.value.toLowerCase()
		setQuery(query)
	}
	const searchbarRef = useRef<HTMLIonSearchbarElement>(null)
	const [query, setQuery] = useState<string>('')

	// Pagination stuff
	const [iceboxLimit, setIceboxLimit] = useState(30)
	const [logLimit, setLogLimit] = useState(7)

	// Todo lists
	const logTodos = useLiveQuery(async () => {
		console.debug('re-running log query')
		return db.todos
			.orderBy('completedAt')
			.reverse()
			.filter(todo => !!todo.completedAt && matchesQuery(query, todo))
			.limit(logLimit)
			.toArray()
	}, [query, logLimit])
	const importantTodos = useLiveQuery(async () => {
		console.debug('re-running important query')
		const list = await db.lists.get('#important')
		if (list) {
			const todos = await Promise.all(list.order.map(id => db.todos.get(id)))
			return todos.filter(todo => matchesQuery(query, todo))
		}
		return []
	}, [query])
	const iceboxTodos = useLiveQuery(async () => {
		console.debug('re-running icebox query')
		const list = await db.lists.get('#important')
		return db.todos
			.where('id')
			.noneOf(list?.order || [])
			.filter(
				todo => todo.completedAt === undefined && matchesQuery(query, todo),
			)
			.reverse()
			.limit(iceboxLimit)
			.toArray()
	}, [iceboxLimit, query])
	console.debug({ logTodos, importantTodos, iceboxTodos })

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

	useGlobalKeyboardShortcuts(contentRef, searchbarRef, openCreateTodoModal)

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

	const isLoading =
		logTodos === undefined ||
		importantTodos === undefined ||
		iceboxTodos === undefined

	return (
		<>
			<MiscMenu />
			<FilterMenu />
			<IonPage id="main-content">
				<Header />
				<IonContent
					className="ion-padding"
					fullscreen
					ref={contentRef}
				>
					{isLoading ? (
						<div className="flex items-center justify-center h-full">
							<IonSpinner
								className="w-20 h-20"
								name="dots"
							/>
						</div>
					) : (
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
								<Log todos={logTodos!} />
								<Important todos={importantTodos!} />
								<Icebox todos={iceboxTodos!} />
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
					)}
				</IonContent>
				<IonFooter>
					<IonToolbar>
						<IonButtons slot="primary">
							<IonButton
								onClick={() => {
									menuController.toggle('end')
								}}
							>
								<IonIcon
									icon={filterSharp}
									slot="icon-only"
								/>
							</IonButton>
							{/* <IonButton>
								<IonIcon
									icon={searchSharp}
									slot="icon-only"
								/>
							</IonButton> */}
						</IonButtons>
						<IonButtons slot="start">
							<IonMenuButton></IonMenuButton>
						</IonButtons>
						<IonSearchbar
							ref={searchbarRef}
							onKeyDown={event => {
								if (event.key === 'Escape') {
									event.preventDefault()
									searchbarRef.current?.getElementsByTagName('input')[0].blur()
								}
							}}
							debounce={100}
							onIonInput={ev => handleInput(ev)}
						></IonSearchbar>
					</IonToolbar>
				</IonFooter>
			</IonPage>
		</>
	)
}

export default Home

export const Header = () => {
	const user = useObservable(db.cloud.currentUser)
	const syncState = useObservable(db.cloud.syncState)
	const isLoggedIn = user?.isLoggedIn

	return (
		<IonHeader>
			<IonToolbar>
				<IonTitle>Today & upcoming</IonTitle>
				{isLoggedIn ? (
					<>
						<div
							className="hidden mx-2 space-x-2 lg:block"
							slot="secondary"
						>
							<span>email: {user.email}</span>
							<span>license: {syncState?.license}</span>
							<span>status: {syncState?.status}</span>
							<span>phase: {syncState?.phase}</span>
							<span>{syncState?.progress}</span>
							<span>{syncState?.error?.message}</span>
						</div>
						<IonButtons slot="secondary">
							<IonButton fill="solid">
								<IonIcon
									icon={cloudDoneSharp}
									slot="start"
								></IonIcon>
								<span>Sync</span>
							</IonButton>
							<IonButton
								onClick={() => {
									db.cloud.logout()
								}}
							>
								<IonIcon
									icon={logOutSharp}
									slot="start"
								></IonIcon>
							</IonButton>
						</IonButtons>
					</>
				) : (
					<>
						<IonButtons slot="secondary">
							<IonButton
								fill="solid"
								onClick={() => {
									db.cloud.login()
								}}
							>
								<IonIcon
									icon={cloudOfflineSharp}
									slot="start"
								></IonIcon>
								<span>Sync</span>
							</IonButton>
						</IonButtons>
					</>
				)}
			</IonToolbar>
		</IonHeader>
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
			type="push"
			contentId="main-content"
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

export const FilterMenu = () => {
	return (
		<IonMenu
			type="push"
			side="end"
			contentId="main-content"
		>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Views</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<Link to="/constellation">Constellation</Link>
				<p>Filters coming soon...</p>
			</IonContent>
		</IonMenu>
	)
}

export const Log = ({ todos }: { todos: any[] }) => {
	const [present] = useTodoActionSheet()

	return (
		<>
			<h1>Log</h1>
			{todos.length ? (
				<IonList inset>
					{todos.sort(byDate).map(todo => (
						<IonItem
							button
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
		</>
	)
}

export const Important = ({ todos }: { todos: any[] }) => {
	async function handleReorder(event: CustomEvent<ItemReorderEventDetail>) {
		// We don't use this to reorder for us because it results in a flash of 'unordered' content.
		// Instead we re-order right away, calculate the new order ourselves, and update the DB.
		event.detail.complete()

		const todoIds = [...todos.map(i => i.id)]
		const reorderedTodoIds = moveItemInArray(
			todoIds,
			event.detail.from,
			event.detail.to,
		)
		await db.lists.put({
			type: '#important',
			order: reorderedTodoIds,
		})
	}
	const [present] = useTodoActionSheet()

	return (
		<>
			<h1>Important</h1>
			{todos.length ? (
				<IonList inset>
					<IonReorderGroup
						disabled={false}
						onIonItemReorder={handleReorder}
					>
						{todos.map(todo => (
							<IonItem
								button
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
		</>
	)
}

export const Icebox = ({ todos }: { todos: any[] }) => {
	const [present] = useTodoActionSheet()
	const onClick = useCallback(
		todo => {
			present(todo as CreatedTodo, {
				buttons: [
					{
						text: 'Move to ranked',
						data: {
							action: 'ranked',
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

	return (
		<>
			<IonGrid>
				<h1>Icebox</h1>
				<IonRow>
					{todos.map(todo => (
						<IceboxItem
							key={todo.id}
							onClick={onClick}
							todo={todo}
						/>
					))}
				</IonRow>
			</IonGrid>
		</>
	)
}

export const IceboxItem = ({
	onClick,
	todo,
}: {
	onClick: (todo: CreatedTodo) => void
	todo: CreatedTodo
}) => {
	return (
		<IonCard
			className="cursor-pointer"
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

function matchesQuery(query, todo) {
	if (!query) return true
	return todo?.title.toLowerCase().includes(query)
}

function useGlobalKeyboardShortcuts(
	contentRef: RefObject<HTMLIonContentElement>,
	searchbarRef: RefObject<HTMLIonSearchbarElement>,
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
			} else if (event.key === 's') {
				event.preventDefault()
				contentRef.current?.scrollToBottom(500)
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [contentRef, openCreateTodoModal, searchbarRef])
}
