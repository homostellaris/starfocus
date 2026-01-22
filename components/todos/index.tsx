import {
	IonCard,
	IonCardHeader,
	IonCardTitle,
	IonCheckbox,
	IonIcon,
	IonItem,
	IonLabel,
	IonReorder,
	IonText,
	isPlatform,
} from '@ionic/react'
import dayjs from 'dayjs'
import { calendarSharp, documentText, timeSharp } from 'ionicons/icons'
import {
	type ComponentProps,
	forwardRef,
	type JSX,
	type MouseEventHandler,
	type PropsWithChildren,
} from 'react'
import { cn } from '../common/cn'
import { StarRoleIcon } from '../common/StarRoleIcon'
import starScale from '../common/starScale'
import type { StarRole, Todo as TodoType } from '../db'
import { useDebug } from '../useDebug'

export const TodoListItem = forwardRef<
	HTMLDivElement,
	PropsWithChildren<
		{
			starRole?: StarRole
			todo: TodoType & { order?: string; snoozedUntil?: Date }
			onCompletionChange: ComponentProps<typeof IonCheckbox>['onIonChange']
			onClick: MouseEventHandler<HTMLIonItemElement>
		} & JSX.IntrinsicElements['div']
	>
>(function TodoListItem(
	{
		children,
		starRole,
		todo: { starPoints = 0, ...todo },
		onCompletionChange,
		onClick,
		...props
	},
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
				className="[--inner-padding-top:0.5rem] [--inner-padding-bottom:0.5rem]"
				detail={false}
				data-class="todo"
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
				{starPoints ? (
					<span
						className={cn(
							'!font-mono grow-0 min-w-[2ch] text-base',
							starScale[starPoints].textColor,
						)}
						data-star-points={starPoints}
						slot="start"
					>
						{starPoints}
					</span>
				) : (
					<IonText
						className={cn('!font-mono grow-0 min-w-[2ch] text-base')}
						color="light"
						slot="start"
					>
						0
					</IonText>
				)}
				<div
					className="grow"
					onClick={onClick}
				>
					<IonLabel data-class="title">{todo?.title}</IonLabel>
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
					{children}
				</div>
				{todo.note ? (
					<a
						className={cn('ion-hide-sm-down', isPlatform('ios') && 'ml-4')}
						href={todo.note.uri}
						slot="end"
						target="_blank"
						rel="noreferrer"
					>
						<IonIcon icon={documentText}></IonIcon>
					</a>
				) : (
					<IonIcon
						className={cn('ion-hide-sm-down', isPlatform('ios') && 'ml-4')}
						color="light"
						icon={documentText}
						slot="end"
					></IonIcon>
				)}
				<SnoozeIcon
					className={cn('ion-hide-sm-down', isPlatform('ios') && 'ml-4')}
					slot="end"
					todo={todo}
				/>
				<StarRoleIcon
					className={cn(isPlatform('ios') && 'ml-4')}
					slot="end"
					starRole={starRole}
				/>
				{todo.completedAt ? (
					<IonIcon
						className={cn(isPlatform('ios') && 'ml-4')}
						color="medium"
						icon={calendarSharp}
						slot="end"
						title={`Completed on ${todo.completedAt?.toDateString()}`}
					></IonIcon>
				) : (
					<IonReorder
						// -mr-1 is a hack to negate the padding built into the SVG in order to align it with the log todo icons
						className={cn('-mr-1', isPlatform('ios') && 'ml-4')}
						slot="end"
					></IonReorder>
				)}
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
			className="cursor-pointer ion-no-margin"
			data-class="todo"
			{...props}
		>
			<IonCardHeader>
				<IonCardTitle className="text-sm">
					<span
						className={cn(
							'!font-mono grow-0 min-w-[2ch] text-base me-4',
							starScale[todo.starPoints].textColor,
						)}
					>
						{todo.starPoints}
					</span>
					<span data-class="title">{todo.title}</span>
				</IonCardTitle>
			</IonCardHeader>
		</IonCard>
	)
}

export function SnoozeIcon({
	className,
	todo,
	...props
}: {
	todo: TodoType & { order?: string; snoozedUntil?: Date }
} & ComponentProps<typeof IonIcon>) {
	let color = 'light'
	let title = 'Not snoozed'

	if (todo.snoozedUntil) {
		title = `Snoozed until ${todo.snoozedUntil.toDateString()}`

		const today = dayjs()
		const snoozedUntil = dayjs(todo.snoozedUntil)

		if (snoozedUntil.isBefore(today, 'day')) {
			color = 'light'
		} else if (snoozedUntil.isSame(today, 'day')) {
			color = 'primary'
		} else if (snoozedUntil.isAfter(today, 'day')) {
			color = 'warning'
		}
	}

	return (
		<IonIcon
			className={className}
			color={color}
			icon={timeSharp}
			title={title}
			{...props}
		/>
	)
}
