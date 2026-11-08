import { IonIcon } from '@ionic/react'
import { alertCircleOutline } from 'ionicons/icons'
import { DuplicateMatch } from './detector'
import { StarRole, Todo } from '../../db'
import { TodoChip } from '../TodoChip'
import { cn } from '../../common/cn'

export function DuplicateChips({
	className,
	matches,
	onSelectExisting,
	starRoles = [],
}: {
	className?: string
	matches: DuplicateMatch[]
	onSelectExisting: (existingTodo: Todo) => void
	starRoles?: StarRole[]
}) {
	if (matches.length === 0) {
		return null
	}

	return (
		<div
			className={cn(
				'flex items-center gap-2 overflow-x-auto no-scrollbar py-1',
				className,
			)}
			data-testid="duplicate-chips-bar"
		>
			<div className="flex items-center gap-1 text-xs font-semibold text-amber-400 shrink-0 select-none">
				<IonIcon
					icon={alertCircleOutline}
					className="text-sm"
				/>
				<span>Duplicates</span>
			</div>
			{matches.map(match => (
				<TodoChip
					key={match.todo.id}
					todo={match.todo}
					starRole={starRoles.find(role => role.id === match.todo.starRole)}
					onClick={() => onSelectExisting(match.todo)}
				/>
			))}
		</div>
	)
}

export function DuplicateAlert({
	className,
	matches,
	onSelectExisting,
	starRoles = [],
}: {
	className?: string
	matches: DuplicateMatch[]
	onSelectExisting: (existingTodo: Todo) => void
	starRoles?: StarRole[]
}) {
	return (
		<DuplicateChips
			className={className}
			matches={matches}
			onSelectExisting={onSelectExisting}
			starRoles={starRoles}
		/>
	)
}
