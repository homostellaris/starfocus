import { IonBadge, IonButton, IonIcon } from '@ionic/react'
import { alertCircleOutline, arrowForwardOutline } from 'ionicons/icons'
import { DuplicateMatch } from './detector'
import { Todo } from '../../db'

export function DuplicateAlert({
	matches,
	onSelectExisting,
}: {
	matches: DuplicateMatch[]
	onSelectExisting: (existingTodo: Todo) => void
}) {
	if (matches.length === 0) {
		return null
	}

	const topMatch = matches[0]

	return (
		<div
			className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm transition-all"
			data-testid="duplicate-alert"
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-start gap-2">
					<IonIcon
						icon={alertCircleOutline}
						className="mt-0.5 text-base text-amber-400 shrink-0"
					/>
					<div>
						<div className="font-medium text-amber-200">
							{matches.length === 1
								? 'Similar task found'
								: `${matches.length} similar tasks found`}
						</div>
						<div className="mt-1 text-xs text-neutral-300">
							&ldquo;{topMatch.todo.title}&rdquo;
						</div>
						<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
							<IonBadge
								color={getLocationBadgeColor(topMatch.location)}
								className="text-[10px] font-medium"
							>
								{formatLocationLabel(topMatch.location)}
							</IonBadge>
							{topMatch.todo.starPoints ? (
								<IonBadge
									color="tertiary"
									className="text-[10px] font-mono font-medium"
								>
									{topMatch.todo.starPoints} ★
								</IonBadge>
							) : null}
							<span className="text-[10px] text-neutral-400 font-mono">
								{Math.round(topMatch.similarityScore * 100)}% match
							</span>
						</div>
					</div>
				</div>
				<IonButton
					size="small"
					fill="outline"
					color="warning"
					className="shrink-0"
					onClick={() => onSelectExisting(topMatch.todo)}
				>
					<span>Open</span>
					<IonIcon
						slot="end"
						icon={arrowForwardOutline}
					/>
				</IonButton>
			</div>
		</div>
	)
}

function getLocationBadgeColor(
	location: 'wayfinder' | 'database' | 'completed',
): 'primary' | 'secondary' | 'medium' {
	if (location === 'wayfinder') {
		return 'primary'
	}
	if (location === 'database') {
		return 'secondary'
	}
	return 'medium'
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
