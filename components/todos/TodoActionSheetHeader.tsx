'use client'

import React from 'react'
import PlanetAsset from '../assets/PlanetAsset'
import { cn } from '../common/cn'
import { StarRoleIcon } from '../common/StarRoleIcon'
import starScale from '../common/starScale'
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

	const customPointColor =
		starPoints > 0 && starPoints in theme.starColors
			? theme.starColors[starPoints as keyof typeof theme.starColors]
			: undefined

	const starScaleClass =
		starPoints in starScale
			? starScale[starPoints as keyof typeof starScale]?.textColor
			: 'text-neutral-400'

	return (
		<div
			data-testid="todo-action-sheet-header"
			className="flex items-center gap-2.5 w-full py-1 text-left select-none overflow-hidden"
		>
			<div className="shrink-0 flex items-center justify-center">
				<PlanetAsset
					size={36}
					todo={todo}
					starRole={starRole}
					themeId={resolvedThemeId}
					className="drop-shadow-md"
				/>
			</div>

			<span
				data-testid="todo-action-sheet-star-points"
				className={cn(
					'!font-mono shrink-0 min-w-[2ch] text-base font-semibold',
					starScaleClass,
				)}
				style={customPointColor ? { color: customPointColor } : undefined}
			>
				{starPoints}
			</span>

			<span
				data-testid="todo-action-sheet-title"
				className="text-base font-medium leading-snug text-neutral-100 flex-1 min-w-0 truncate"
			>
				{todo.title}
			</span>

			{starRole ? (
				<div className="shrink-0 ml-auto flex items-center justify-center">
					<StarRoleIcon
						data-testid="todo-action-sheet-star-role"
						starRole={starRole}
						className="text-base shrink-0 opacity-90"
						style={{
							margin: 0,
							marginInlineStart: 0,
							marginInlineEnd: 0,
						}}
					/>
				</div>
			) : null}
		</div>
	)
}

export default TodoActionSheetHeader
