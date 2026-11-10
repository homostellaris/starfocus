import React, { forwardRef } from 'react'
import ModularStarship from '../assets/ModularStarship'
import type { ShipLoadoutConfig } from '../assets/types'
import { useStarPointsTheme } from '../theme/starPointsThemes'
import { useStarshipCustomization } from '../starship/useStarshipCustomization'
import { cn } from './cn'

const Starship = forwardRef<
	HTMLDivElement,
	{
		className?: string
		size?: number
		rotationDegrees?: number
		thrusterActive?: boolean
		loadout?: Partial<ShipLoadoutConfig>
		onDoubleClick?: React.MouseEventHandler<HTMLDivElement>
	}
>(function Starship(
	{
		className,
		size = 56,
		rotationDegrees = 0,
		thrusterActive = true,
		loadout,
		onDoubleClick,
	},
	ref,
) {
	const { themeId } = useStarPointsTheme()
	const { loadout: defaultLoadout } = useStarshipCustomization()
	const effectiveLoadout = {
		...defaultLoadout,
		...loadout,
	}

	return (
		<div
			ref={ref}
			role="img"
			aria-label="A starship from a birds-eye view"
			className={cn(
				'starship inline-flex h-full w-full items-center justify-center',
				className,
			)}
		>
			<ModularStarship
				loadout={effectiveLoadout}
				themeId={themeId}
				size={size}
				rotationDegrees={rotationDegrees}
				thrusterActive={thrusterActive}
				onDoubleClick={onDoubleClick}
			/>
		</div>
	)
})

export default Starship
