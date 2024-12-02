import {
	CheckboxChangeEventDetail,
	IonCard,
	IonCardHeader,
	IonCardTitle,
	IonCheckbox,
	IonIcon,
	IonItem,
	IonLabel,
} from '@ionic/react'
import Todo from './Todo'
import type { StarRole, Todo as TodoType } from '../db'
import { Todo as TodoInterface } from './interfaces'
import {
	ComponentProps,
	forwardRef,
	MouseEventHandler,
	PropsWithChildren,
	RefObject,
	useMemo,
} from 'react'
import { useDebug } from '../useDebug'
import { getIonIcon } from '../starRoles/icons'
import { documentText, rocketSharp } from 'ionicons/icons'

export function Todos({
	currentTodoRef,
	listRef,
	todos,
}: {
	currentTodoRef?: RefObject<HTMLDivElement>
	listRef?: RefObject<HTMLDivElement>
	todos: TodoInterface[]
}) {
	const sortedTodos = useMemo(
		() =>
			todos.sort((a, b) => {
				if (a.completedAt || b.completedAt) {
					return (
						(a.completedAt?.getTime() || 0) - (b.completedAt?.getTime() || 0)
					)
				}
				return Number(b.rank) - Number(a.rank)
			}),
		[todos],
	)
	const completedCount = useMemo(
		() => todos.filter(todo => todo.completedAt).length,
		[todos],
	)

	return (
		// Without overflow-auto there is no margin between the bottom todo and the edge of the list 🤷‍♂️
		<div
			className="flex flex-wrap pt-2 todos"
			ref={listRef}
		>
			{sortedTodos.map((todo, index) => (
				<Todo
					todo={todo}
					key={todo.id}
					reference={
						index + 1 === todos.length - completedCount
							? currentTodoRef
							: undefined
					}
					compact={index < sortedTodos.length - 7 - completedCount}
				/>
			))}
		</div>
	)
}

export const TodoListItem = forwardRef<
	HTMLDivElement,
	PropsWithChildren<
		{
			starRole?: StarRole
			todo: TodoType & { order?: string }
			onCompletionChange: ComponentProps<typeof IonCheckbox>['onIonChange']
			onSelect: MouseEventHandler<HTMLIonItemElement>
		} & JSX.IntrinsicElements['div']
	>
>(function TodoListItem(
	{ children, starRole, todo, onCompletionChange, onSelect, ...props },
	ref,
) {
	const [debug] = useDebug()

	return (
		<div
			key={todo.id}
			ref={ref}
			{...props}
		>
			<IonItem
				button
				className="todo"
				onClick={onSelect}
			>
				<IonCheckbox
					aria-label="Complete todo"
					checked={!!todo.completedAt}
					slot="start"
					onClick={event => {
						// Prevents the IonItem onClick from firing when completing a todo
						event.stopPropagation()
					}}
					onIonChange={onCompletionChange}
				/>
				<IonLabel>{todo?.title}</IonLabel>
				{debug && (
					<span className="space-x-2">
						<data className="text-xs text-gray-500">{todo.id}</data>
						{todo.order ? (
							<data className="text-xs text-gray-500">{todo.order}</data>
						) : null}
						{todo.completedAt ? (
							<data className="text-xs text-gray-500">
								{todo.completedAt?.toISOString()}
							</data>
						) : null}
					</span>
				)}
				<IonIcon
					className={starRole ? '' : 'invisible'}
					icon={starRole ? getIonIcon(starRole.icon.name) : rocketSharp}
					slot="end"
				/>
				{todo.note && (
					<a
						href={todo.note.uri}
						target="_blank"
					>
						<IonIcon icon={documentText}></IonIcon>
					</a>
				)}
				{children}
			</IonItem>
		</div>
	)
})

export function TodoCard({
	todo,
	...props
}: { todo: TodoType } & ComponentProps<typeof IonCard>) {
	return (
		<IonCard
			className="cursor-pointer todo ion-no-margin"
			{...props}
		>
			<IonCardHeader>
				<IonCardTitle className="text-sm">{todo.title}</IonCardTitle>
			</IonCardHeader>
		</IonCard>
	)
}
