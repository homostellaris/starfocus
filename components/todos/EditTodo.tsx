import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonInput,
	IonPage,
	IonTextarea,
	IonTitle,
	IonToolbar,
	useIonModal,
} from '@ionic/react'
import { openOutline } from 'ionicons/icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import useNoteProvider from '../notes/useNoteProvider'
import { CreatedTodo, db } from '../db'
import useSelectedTodo from './SelectedTodo'

export function EditTodoModal({
	dismiss,
	todo,
}: {
	dismiss: (data?: any, role?: string) => void
	todo: CreatedTodo
}) {
	const page = useRef<HTMLIonModalElement>(null)
	const input = useRef<HTMLIonInputElement>(null)
	const noteInput = useRef<HTMLIonTextareaElement>(null)

	useEffect(() => {
		input.current?.setFocus()
	}, [])

	const noteProvider = useNoteProvider()

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Enter') {
				event.preventDefault()
				dismiss(
					{
						title: input.current?.value,
						note: noteInput.current?.value,
					},
					'confirm',
				)
			}
		}
		page.current?.addEventListener('keydown', handleKeyDown)
		return () => {
			page.current?.removeEventListener('keydown', handleKeyDown)
		}
	}, [dismiss])

	return (
		<IonPage ref={page}>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Edit todo</IonTitle>
					<IonButtons slot="secondary">
						<IonButton
							role="cancel"
							onClick={() => dismiss(null, 'cancel')}
						>
							Cancel
						</IonButton>
					</IonButtons>
					<IonButtons slot="primary">
						<IonButton
							onClick={() => {
								dismiss(
									{
										...todo,
										title: input.current?.value,
										note: noteInput.current?.value,
									},
									'confirm',
								)
							}}
							strong={true}
						>
							Confirm
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="space-y-4 ion-padding">
				<IonInput
					fill="outline"
					ref={input}
					type="text"
					label="Title"
					labelPlacement="floating"
					value={todo?.title}
				/>
				{!noteProvider && (
					<p>Set a note provider in settings to enable this feature.</p>
				)}
				{todo?.note ? (
					<div>
						<a
							className="space-x-1"
							href={todo?.note?.uri}
							target="_blank"
							rel="noreferrer"
						>
							<span>Open note</span>
							<IonIcon icon={openOutline} />
						</a>
					</div>
				) : (
					<IonTextarea
						className="h-48"
						disabled={!noteProvider}
						helperText="A note with this initial content will be created with your note provider and linked to this todo."
						fill="outline"
						label="Note"
						labelPlacement="floating"
						placeholder="Write markdown here..."
						ref={noteInput}
					/>
				)}
			</IonContent>
		</IonPage>
	)
}

export function useEditTodoModal() {
	const [todo, setTodo] = useSelectedTodo()
	const [present, dismiss] = useIonModal(EditTodoModal, {
		dismiss: (data: string, role: string) => dismiss(data, role),
		todo,
	})
	const noteProvider = useNoteProvider()
	const editTodo = useCallback(
		async (updatedTodo: CreatedTodo) => {
			let uri
			if (updatedTodo.note && noteProvider) {
				uri = await noteProvider.create({ content: updatedTodo.note })
			}
			await db.todos.update(updatedTodo.id, {
				createdAt: new Date(),
				title: updatedTodo.title,
				...(uri && { note: { uri } }),
			})
		},
		[noteProvider],
	)

	return [
		(todo: CreatedTodo) => {
			present({
				onWillPresent: () => {
					setTodo(todo)
				},
				onWillDismiss: event => {
					const todo = event.detail.data
					if (event.detail.role === 'confirm') editTodo(todo)
					setTodo(null)
				},
			})
		},
		dismiss,
	]
}
