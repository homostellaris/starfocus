import React, { forwardRef } from 'react'
import ModularStarship from '../assets/ModularStarship'
import type { ShipLoadoutConfig } from '../assets/types'
import { cn } from './cn'

const Starship = forwardRef<
	HTMLDivElement,
	{
		className?: string
		loadout?: Partial<ShipLoadoutConfig>
		onDoubleClick?: React.MouseEventHandler<HTMLDivElement>
	}
>(function Starship({ className, loadout, onDoubleClick }, ref) {
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
				loadout={loadout}
				size={56}
				onDoubleClick={onDoubleClick}
			/>
		</div>
	)
})

export default Starship
