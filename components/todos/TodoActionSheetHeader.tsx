'use client'

import React from 'react'
import PlanetAsset from '../assets/PlanetAsset'
import { StarRoleIcon } from '../common/StarRoleIcon'
import type { StarRole, Todo } from '../db'
import {
	getActiveStarPointsThemeId,
	STAR_POINTS_THEMES,
	StarPointsThemeId,
} from '../theme/starPointsThemes'

export interface TodoActionSheetHeaderProps {
	todo: Todo
	starRole?: StarRole
	themeId?: StarPointsThemeId
}

export function TodoActionSheetHeader({
	todo,
	starRole,
	themeId,
}: TodoActionSheetHeaderProps) {
	const resolvedThemeId = themeId ?? getActiveStarPointsThemeId()
	const theme = STAR_POINTS_THEMES[resolvedThemeId]
	const starPoints =
		typeof todo.starPoints === 'number' && Number.isFinite(todo.starPoints)
			? Math.max(0, Math.round(todo.starPoints))
			: 0

	const pointColor =
		starPoints > 0 && starPoints in theme.starColors
			? theme.starColors[starPoints as keyof typeof theme.starColors]
			: '#94a3b8'

	return (
		<div
			data-testid="todo-action-sheet-header"
			className="flex items-center gap-3 w-full py-1 text-left select-none"
		>
			<div className="shrink-0 flex items-center justify-center">
				<PlanetAsset
					size={44}
					todo={todo}
					starRole={starRole}
					themeId={resolvedThemeId}
					className="drop-shadow-md"
				/>
			</div>

			<div className="flex flex-col min-w-0 flex-1 gap-1">
				<div
					data-testid="todo-action-sheet-title"
					className="text-base font-semibold leading-snug text-neutral-100 line-clamp-2 select-text"
				>
					{todo.title}
				</div>

				<div className="flex items-center gap-2 flex-wrap text-xs">
					<span
						data-testid="todo-action-sheet-star-points"
						className="inline-flex items-center gap-1 font-mono font-medium px-2 py-0.5 rounded-full bg-neutral-800/80 border border-neutral-700/70"
						style={{ color: pointColor }}
					>
						★ {starPoints} {starPoints === 1 ? 'pt' : 'pts'}
					</span>

					{starRole ? (
						<span
							data-testid="todo-action-sheet-star-role"
							className="inline-flex items-center gap-1.5 text-neutral-300 font-medium px-2 py-0.5 rounded-full bg-neutral-800/60 border border-neutral-700/50"
						>
							<StarRoleIcon
								starRole={starRole}
								className="text-xs shrink-0"
								style={{
									margin: 0,
									marginInlineStart: 0,
									marginInlineEnd: 0,
								}}
							/>
							<span className="truncate max-w-[150px]">{starRole.title}</span>
						</span>
					) : null}
				</div>
			</div>
		</div>
	)
}

export default TodoActionSheetHeader
