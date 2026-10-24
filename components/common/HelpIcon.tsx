'use client'

import React from 'react'
import { IonIcon } from '@ionic/react'
import { helpCircleSharp } from 'ionicons/icons'
import { resolvePixelSize } from './MomentumSyncIcon'

export interface HelpIconProps {
	id?: string
	isOpen?: boolean
	className?: string
	style?: React.CSSProperties
	slot?: string
	size?: 'sm' | 'md' | 'lg' | 'xl' | number
	'data-testid'?: string
}

export default function HelpIcon({
	id,
	isOpen = false,
	className = '',
	style,
	slot,
	size,
	'data-testid': testIdentifier = 'help-icon',
}: HelpIconProps) {
	const pixelSize = resolvePixelSize(size)

	return (
		<IonIcon
			id={id}
			icon={helpCircleSharp}
			slot={slot}
			className={`origin-center select-none transition-all duration-300 ${
				isOpen
					? 'animate-curious-beacon text-sky-400'
					: 'text-neutral-400 hover:text-neutral-200'
			} ${className}`}
			data-testid={testIdentifier}
			data-active={isOpen ? 'true' : 'false'}
			data-animation={isOpen ? 'curious-beacon' : 'none'}
			style={{
				fontSize: pixelSize ? `${pixelSize}px` : undefined,
				...style,
			}}
		/>
	)
}
