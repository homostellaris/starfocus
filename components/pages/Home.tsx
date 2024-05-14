import { add, rocketSharp } from 'ionicons/icons'
import { menuController } from '@ionic/core/components'
import {
	IonButton,
	IonButtons,
	IonContent,
	IonFab,
	IonFabButton,
	IonFooter,
	IonHeader,
	IonIcon,
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
	IonSearchbar,
	IonTitle,
	IonToolbar,
	ItemReorderEventDetail,
} from '@ionic/react'
import { filterSharp } from 'ionicons/icons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { OverlayEventDetail } from '@ionic/react/dist/types/components/react-component-lib/interfaces'
import { Todo, db } from '../db'
import { useLiveQuery } from 'dexie-react-hooks'

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
	// const [important, setTodos] = useState(data)
	const [query, setQuery] = useState<string>('')
	const important = useLiveQuery(
		async () => {
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
				order: [...important.map(i => i?.id), newTodoId],
			})
		},
		[important],
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
			<IonPage>
				<IonHeader>
					<IonToolbar>
						<IonTitle>Today & upcoming</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent
					className="ion-padding"
					id="main-content"
				>
					{important.length ? (
						<Important todos={important} />
					) : (
						<div className="flex flex-col items-center justify-center h-full gap-5">
							<IonIcon
								icon={rocketSharp}
								size="large"
							/>
							<p>Create some todos to get started</p>
						</div>
					)}
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
						onWillDismiss={ev => {
							onWillDismiss(ev)
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
									<IonButton strong={true}>Confirm</IonButton>
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

export const MiscMenu = () => {}

export const FilterMenu = () => {
	return (
		<IonMenu
			type="push"
			side="end"
			contentId="main-content"
		>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Menu Content</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<p>Filters coming soon...</p>
			</IonContent>
		</IonMenu>
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
		<IonList
			style={{
				maxWidth: '900px',
				margin: '0 auto',
			}}
		>
			<IonReorderGroup
				disabled={false}
				onIonItemReorder={handleReorder}
			>
				{todos.map(item => (
					<IonItem key={item.id}>
						<IonLabel>{item?.title}</IonLabel>
						<IonReorder slot="end"></IonReorder>
					</IonItem>
				))}
			</IonReorderGroup>
		</IonList>
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
