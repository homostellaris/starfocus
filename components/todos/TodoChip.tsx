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
	const starPoints = todo.starPoints ?? 0
	const starColorClass =
		starPoints > 0 && starPoints in starScale
			? starScale[starPoints as keyof typeof starScale]?.textColor
			: 'text-neutral-400'

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
				'cursor-pointer m-0 h-7 text-xs shrink-0 font-medium transition-colors hover:bg-white/15 border border-neutral-700/60 flex items-center gap-1.5 pl-2.5 pr-3',
				className,
			)}
			data-testid="todo-chip"
		>
			<span
				className={cn(
					'!font-mono shrink-0 text-xs font-semibold',
					starColorClass,
				)}
				data-testid="todo-chip-star-points"
			>
				{starPoints}
			</span>

			<IonLabel className="truncate max-w-[110px] sm:max-w-[160px] text-neutral-200">
				{todo.title}
			</IonLabel>

			<StarRoleIcon
				starRole={starRole}
				className="text-xs shrink-0 text-neutral-300"
				style={{ margin: 0, marginInlineStart: '-2px', marginInlineEnd: 0 }}
			/>
		</IonChip>
	)
}
