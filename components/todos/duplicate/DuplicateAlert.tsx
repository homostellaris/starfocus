import { IonIcon } from '@ionic/react'
import { alertCircleOutline, arrowForwardOutline } from 'ionicons/icons'
import { DuplicateMatch } from './detector'
import { Todo } from '../../db'
import { cn } from '../../common/cn'

export function DuplicateAlert({
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

	const topMatch = matches[0]

	return (
		<div
			className={cn(
				'flex items-center justify-between border-t border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 transition-colors hover:bg-amber-500/15 cursor-pointer',
				className,
			)}
			data-testid="duplicate-alert"
			onClick={() => onSelectExisting(topMatch.todo)}
		>
			<div className="flex items-center gap-2 min-w-0 mr-3">
				<IonIcon
					icon={alertCircleOutline}
					className="text-base text-amber-400 shrink-0"
				/>
				<div className="truncate">
					<span className="text-neutral-400">Similar: </span>
					<span className="font-medium text-white">
						&ldquo;{topMatch.todo.title}&rdquo;
					</span>
					<span className="text-neutral-400 ml-1.5">
						({Math.round(topMatch.similarityScore * 100)}% in{' '}
						{formatLocationLabel(topMatch.location)})
					</span>
				</div>
			</div>
			<div className="flex items-center gap-1 font-medium text-amber-300 shrink-0 whitespace-nowrap text-[11px]">
				<span>Open existing</span>
				<IonIcon
					icon={arrowForwardOutline}
					className="text-xs"
				/>
			</div>
		</div>
	)
}

function formatLocationLabel(
	location: 'wayfinder' | 'database' | 'completed',
): string {
	if (location === 'wayfinder') {
		return 'Wayfinder'
	}
	if (location === 'database') {
		return 'Database'
	}
	return 'Completed'
}
