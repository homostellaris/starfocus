import { IonChip, IonLabel } from '@ionic/react'
import { CSSProperties } from 'react'
import { StarRoleIcon } from '../common/StarRoleIcon'
import starScale from '../common/starScale'
import { StarRole, Todo } from '../db'
import { cn } from '../common/cn'

export interface TodoChipProps {
	className?: string
	onClick?: () => void
	starRole?: StarRole
	todo: Todo
}

export function TodoChip({
	className,
	onClick,
	starRole,
	todo,
}: TodoChipProps) {
	const starPoints = todo.starPoints
	const hasStarPoints = typeof starPoints === 'number' && starPoints > 0
	const starColorClass = hasStarPoints
		? (starScale[starPoints as keyof typeof starScale]?.textColor ??
			'text-neutral-300')
		: ''

	return (
		<IonChip
			onClick={onClick}
			style={
				{
					'--background': 'rgba(255, 255, 255, 0.08)',
					'--color': '#e5e5e5',
					border: '1px solid rgba(255, 255, 255, 0.16)',
				} as CSSProperties
			}
			className={cn(
				'cursor-pointer m-0 h-7 text-xs shrink-0 font-medium transition-colors hover:bg-white/15 border border-neutral-700/60 flex items-center gap-1.5 px-2.5',
				className,
			)}
			data-testid="todo-chip"
		>
			<IonLabel className="truncate max-w-[110px] sm:max-w-[160px] text-neutral-200">
				{todo.title}
			</IonLabel>

			{hasStarPoints ? (
				<span
					className={cn(
						'text-[11px] font-mono font-semibold shrink-0',
						starColorClass,
					)}
					data-testid="todo-chip-star-points"
				>
					{starPoints}★
				</span>
			) : null}

			{starRole ? (
				<StarRoleIcon
					starRole={starRole}
					className="text-xs shrink-0 text-neutral-300"
				/>
			) : null}
		</IonChip>
	)
}
