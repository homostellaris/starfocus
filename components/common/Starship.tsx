import Image from 'next/image'
import { cn } from './cn'

import React, { forwardRef } from 'react'

const Starship = forwardRef<HTMLImageElement, { className?: string }>(
	function Starship({ className }, ref) {
		return (
			<Image
				alt="A starship from a birds-eye view"
				className={cn('starship', className)}
				src="/starship.png"
				layout="fill"
				quality={100}
				ref={ref}
			></Image>
		)
	},
)

export default Starship
