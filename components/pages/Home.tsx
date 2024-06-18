import { add, checkmarkDoneCircleSharp, rocketSharp } from 'ionicons/icons'
import { menuController } from '@ionic/core/components'
import {
	ActionSheetButton,
	IonActionSheet,
	IonButton,
	IonButtons,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonCheckbox,
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
	IonLabel,
	IonList,
	IonListHeader,
	IonMenu,
	IonMenuButton,
	IonModal,
	IonPage,
	IonReorder,
	IonReorderGroup,
	IonRow,
	IonSearchbar,
	IonTitle,
	IonToolbar,
	ItemReorderEventDetail,
} from '@ionic/react'
import { filterSharp } from 'ionicons/icons'
import {
	PropsWithChildren,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { OverlayEventDetail } from '@ionic/react/dist/types/components/react-component-lib/interfaces'
import { Todo, db } from '../db'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'

const Home = () => {
	// const data = [
	// 	{ id: 1, title: 'Amsterdam' },
	// 	{ id: 2, title: 'Buenos Aires' },
	// 	{ id: 3, title: 'Cairo' },
	// 	{ id: 4, title: 'Geneva' },
	// 	{ id: 5, title: 'Hong Kong' },
	// 	{ id: 6, title: 'Istanbul' },
	// 	{ id: 7, title: 'London' },
	// 	{ id: 8, title: 'Madrid' },
	// 	{ id: 9, title: 'New York' },
	// 	{ id: 10, title: 'Panama City' },
	// ]
	// const [iceboxTodos, setIceboxTodos] = useState(data)

	// Should we just query all todos and split them up? How would this work with pagination?
	const [query, setQuery] = useState<string>('')
	const logTodos = useLiveQuery(
		async () => {
			console.log('re-running log query')
			return db.todos.filter(todo => !!todo.completedAt).toArray()
		},
		[],
		[],
	)
	const importantTodos = useLiveQuery(
		async () => {
			console.log('re-running important query')
			const list = await db.lists.get('important')
			if (list) {
				const todos = await Promise.all(list.order.map(id => db.todos.get(id)))
				if (query) {
					return todos.filter(todo => todo?.title.toLowerCase().includes(query))
				}
				return todos
			}
			return []
		},
		[query],
		[],
	)
	const iceboxTodos = useLiveQuery(
		async () => {
			console.log('re-running icebox query')
			const list = await db.lists.get('important')
			return db.todos
				.where('id')
				.noneOf(list?.order || [])
				.filter(todo => todo.completedAt === undefined)
				.toArray()
		},
		[],
		[],
	)

	const openCreateTodoModal = useCallback(() => {
		modal.current?.present()
		if (fab.current) fab.current.activated = true
	}, [])
	const handleInput = (event: Event) => {
		const target = event.target as HTMLIonSearchbarElement
		let query = ''
		if (target?.value) query = target.value.toLowerCase()
		setQuery(query)
	}
	const modal = useRef<HTMLIonModalElement>(null)
	const fab = useRef<HTMLIonFabElement>(null)
	const input = useRef<HTMLIonInputElement>(null)
	const createTodo = useCallback(
		async title => {
			const newTodoId = await db.todos.add({
				title,
			})
			await db.lists.put({
				type: 'important',
				order: [...importantTodos.map(i => i?.id), newTodoId],
			})
		},
		[importantTodos],
	)
	function onWillDismiss(ev: CustomEvent<OverlayEventDetail>) {
		if (ev.detail.role === 'confirm') {
			createTodo(input.current?.value)
		}
	}
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Enter') {
				event.preventDefault()
				createTodo(input.current?.value)
				modal.current?.dismiss()
			}
		}
		modal.current?.addEventListener('keydown', handleKeyDown)
		return () => {
			modal.current?.removeEventListener('keydown', handleKeyDown)
		}
	}, [createTodo, openCreateTodoModal])

	const searchbarRef = useRef<HTMLIonSearchbarElement>(null)
	async function toggleStartMenu() {
		await menuController.toggle('start')
	}
	async function toggleEndMenu() {
		await menuController.toggle('end')
	}
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === '/') {
				event.preventDefault()
				searchbarRef.current?.setFocus()
			} else if (event.key === '[') {
				event.preventDefault()
				toggleStartMenu()
			} else if (event.key === ']') {
				event.preventDefault()
				toggleEndMenu()
			} else if (event.key === 'c') {
				event.preventDefault()
				openCreateTodoModal()
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [openCreateTodoModal])

	return (
		<>
			<MiscMenu />
			<FilterMenu />
			<IonPage id="main-content">
				<IonHeader>
					<IonToolbar>
						<IonTitle>Today & upcoming</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding">
					<Log todos={logTodos} />
					<Important todos={importantTodos} />
					<Icebox todos={iceboxTodos} />
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
					<IonModal
						ref={modal}
						trigger="open-modal"
						onDidPresent={() => input.current?.setFocus()}
						onWillDismiss={event => {
							onWillDismiss(event)
							if (fab.current) fab.current.activated = false
						}}
					>
						<IonHeader>
							<IonToolbar>
								<IonTitle>Create todo</IonTitle>
								<IonButtons slot="secondary">
									<IonButton onClick={() => modal.current?.dismiss()}>
										Cancel
									</IonButton>
								</IonButtons>
								<IonButtons slot="primary">
									<IonButton
										onClick={() => {
											createTodo(input.current?.value)
											modal.current?.dismiss()
										}}
										strong={true}
									>
										Confirm
									</IonButton>
								</IonButtons>
							</IonToolbar>
						</IonHeader>
						<IonContent className="ion-padding">
							<IonItem>
								<IonInput
									ref={input}
									type="text"
								/>
							</IonItem>
						</IonContent>
					</IonModal>
				</IonContent>
				<IonFooter>
					<IonToolbar>
						<IonButtons slot="primary">
							<IonButton onClick={toggleEndMenu}>
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

export const MiscMenu = () => {
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
			<IonContent className="ion-padding">
				<p>Menu items coming soon...</p>
			</IonContent>
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
	return (
		<>
			<h1>Log</h1>
			{todos.length ? (
				<IonList inset>
					{todos.sort(byDate).map(todo => (
						<IonItem key={todo.id}>
							<IonCheckbox
								slot="start"
								onIonChange={async event => {
									const list = await db.lists.get('important')
									await Promise.all([
										db.lists.update('important', {
											order: [todo.id, ...list!.order],
										}),
										db.todos.update(todo.id, {
											completedAt: event.detail.checked
												? new Date()
												: undefined,
										}),
									])
								}}
								checked={!!todo.completedAt}
							/>
							<TodoItem
								actionButtons={[
									{
										text: 'Nothing',
									},
								]}
								todo={todo}
							>
								<IonLabel>{todo?.title}</IonLabel>
							</TodoItem>
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
			type: 'important',
			order: reorderedTodoIds,
		})
		// setTodos(event.detail.complete(important))
	}

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
								key={todo.id}
							>
								<IonCheckbox
									slot="start"
									onIonChange={async event => {
										const todoIds = [...todos.map(i => i.id)]
										const orderWithoutItem = removeItemFromArray(
											todoIds,
											todoIds.indexOf(todo.id),
										)
										await Promise.all([
											db.lists.put({
												type: 'important',
												order: orderWithoutItem,
											}),
											db.todos.update(todo.id, {
												completedAt: event.detail.checked
													? new Date()
													: undefined,
											}),
										])
									}}
								/>
								{/* For some reason we need an input rather than a label to prevent the whole item updating the checkbox */}
								{/* <IonInput
									aria-label="Task name"
									value={item?.title}
									readonly
								></IonInput> */}
								<TodoItem
									actionButtons={[
										{
											text: 'Move to icebox',
											data: {
												action: 'icebox',
											},
											handler: async () => {
												const list = await db.lists.get('important')
												await db.lists.update('important', {
													order: removeItemFromArray(
														list!.order,
														list!.order.indexOf(todo.id),
													),
												})
											},
										},
									]}
									todo={todo}
								>
									<IonLabel>{todo?.title}</IonLabel>
								</TodoItem>
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
	return (
		<>
			<IonGrid>
				<h1>Icebox</h1>
				<IonRow>
					{todos.map(todo => (
						<IceboxItem
							key={todo.id}
							todo={todo}
						/>
					))}
				</IonRow>
			</IonGrid>
		</>
	)
}

export const IceboxItem = ({
	todo,
}: {
	todo: {
		id: string
		title: string
	}
}) => {
	return (
		<IonCard className="cursor-pointer">
			<TodoItem
				actionButtons={[
					{
						text: 'Move to ranked',
						data: {
							action: 'ranked',
						},
						handler: async () => {
							const list = await db.lists.get('important')
							db.lists.update('important', {
								order: [...list!.order, todo.id],
							})
						},
					},
				]}
				todo={todo}
			>
				<IonCardHeader>
					<IonCardTitle className="text-sm">{todo.title}</IonCardTitle>
				</IonCardHeader>
			</TodoItem>
		</IonCard>
	)
}

export const TodoItem = ({
	actionButtons,
	children,
	todo,
}: PropsWithChildren<{
	actionButtons: ActionSheetButton[]
	todo: {
		id: string
		title: string
	}
}>) => {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<div
			className="w-full"
			onClick={() => {
				setIsOpen(true)
			}}
		>
			{children}
			<IonActionSheet
				buttons={actionButtons}
				header={todo.title}
				isOpen={isOpen}
				onDidDismiss={() => setIsOpen(false)}
			></IonActionSheet>
		</div>
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
