'use client'

import React from 'react'
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

const CIRCLE_PATH =
	'M256 64C150 64 64 150 64 256s86 192 192 192 192-86 192-192S362 64 256 64z'

const QUESTION_MARK_DOT =
	'M266.44 366h-30.21a2.57 2.57 0 01-2.56-2.57v-30.2a2.57 2.57 0 012.56-2.57h30.21a2.57 2.57 0 012.56 2.57v30.2a2.57 2.57 0 01-2.56 2.57z'

const QUESTION_MARK_HOOK =
	'M283.44 267C267.23 277.88 265 287.85 265 297v11a3 3 0 01-3 3h-22a3 3 0 01-3-3v-11c0-21.91 10.08-39.33 30.82-53.26C287.1 230.8 298 222.6 298 204.57c0-12.26-7-21.57-21.49-28.46-3.41-1.62-11-3.2-20.34-3.09-11.72.15-20.82 2.95-27.83 8.59C215.12 192.25 214 203.84 214 204a65.7 65.7 0 00-.84 10.28 3 3 0 01-3 3h-21.25a3 3 0 01-3-2.69 61.69 61.69 0 01.09-12c.22-2.43 1.8-24.32 24.77-42.8 11.91-9.58 27.06-14.56 45-14.78 12.7-.15 24.63 2 32.72 5.82 24.21 11.51 37.51 30.6 37.51 53.74 0 33.83-22.61 49.02-42.56 62.43z'

export default function HelpIcon({
	id,
	isOpen = false,
	className = '',
	style,
	slot,
	size,
	'data-testid': testIdentifier = 'help-icon',
}: HelpIconProps) {
	const maskIdentifier = id ? `help-mask-${id}` : `help-icon-mask`
	const pixelSize = resolvePixelSize(size)

	return (
		<svg
			id={id}
			slot={slot}
			viewBox="0 0 512 512"
			aria-hidden="true"
			className={`inline-block origin-center select-none fill-current transition-colors duration-200 text-neutral-400 hover:text-neutral-200 ${
				isOpen ? 'animate-curious-beacon' : ''
			} ${className}`}
			data-testid={testIdentifier}
			data-active={isOpen ? 'true' : 'false'}
			data-animation={isOpen ? 'curious-beacon' : 'none'}
			style={{
				width: pixelSize ? `${pixelSize}px` : '1.45rem',
				height: pixelSize ? `${pixelSize}px` : '1.45rem',
				fontSize: pixelSize ? `${pixelSize}px` : undefined,
				verticalAlign: 'middle',
				...style,
			}}
		>
			<defs>
				<mask id={maskIdentifier} maskContentUnits="userSpaceOnUse">
					<rect width="512" height="512" fill="white" />
					<g
						className="curious-question-mark"
						style={{
							transformOrigin: '256px 256px',
						}}
					>
						<path d={QUESTION_MARK_DOT} fill="black" />
						<path d={QUESTION_MARK_HOOK} fill="black" />
					</g>
				</mask>
			</defs>
			<path
				d={CIRCLE_PATH}
				fill="currentColor"
				mask={`url(#${maskIdentifier})`}
			/>
		</svg>
	)
}
