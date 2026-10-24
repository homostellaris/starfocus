import { IonChip, IonIcon, IonLabel } from '@ionic/react'
import { alertCircleOutline } from 'ionicons/icons'
import { CSSProperties } from 'react'
import { DuplicateMatch } from './detector'
import { Todo } from '../../db'
import { cn } from '../../common/cn'

export function DuplicateChips({
	className,
	matches,
	onSelectExisting,
}: {
	className?: string
	matches: DuplicateMatch[]
	onSelectExisting: (existingTodo: Todo) => void
}) {
	if (matches.length === 0) {
		return null
	}

	return (
		<div
			className={cn(
				'flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1',
				className,
			)}
			data-testid="duplicate-chips-bar"
		>
			{matches.map(match => (
				<IonChip
					key={match.todo.id}
					onClick={() => onSelectExisting(match.todo)}
					color="warning"
					outline={true}
					style={
						{
							'--background': 'rgba(245, 158, 11, 0.12)',
							'--color': '#fbbf24',
							border: '1px solid rgba(245, 158, 11, 0.6)',
						} as CSSProperties
					}
					className="cursor-pointer m-0 h-7 text-xs shrink-0 font-medium transition-colors hover:opacity-90 border border-amber-500/60"
					data-testid="duplicate-chip"
				>
					<IonIcon
						icon={alertCircleOutline}
						className="text-amber-400"
					/>
					<IonLabel className="truncate max-w-[110px] sm:max-w-[160px] text-amber-200">
						{match.todo.title}
					</IonLabel>
					<span className="text-[10px] text-amber-400/90 font-mono ml-0.5">
						{Math.round(match.similarityScore * 100)}%
					</span>
				</IonChip>
			))}
		</div>
	)
}

export function DuplicateAlert({
	className,
	matches,
	onSelectExisting,
}: {
	className?: string
	matches: DuplicateMatch[]
	onSelectExisting: (existingTodo: Todo) => void
}) {
	return (
		<DuplicateChips
			className={className}
			matches={matches}
			onSelectExisting={onSelectExisting}
		/>
	)
}
