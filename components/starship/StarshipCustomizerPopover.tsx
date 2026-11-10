'use client'

import { IonButton, IonIcon, IonPopover } from '@ionic/react'
import { constructSharp } from 'ionicons/icons'
import React from 'react'
import { useHistory } from 'react-router-dom'
import {
	SHIP_SOCKET_MANIFESTS,
} from '../assets/shipAssembler'
import type { ShipArchetypeId } from '../assets/types'
import {
	STAR_POINTS_THEMES,
	type StarPointsThemeId,
	useStarPointsTheme,
} from '../theme/starPointsThemes'
import { useStarshipCustomization } from './useStarshipCustomization'

export interface StarshipCustomizerPopoverProps {
	id?: string
	isOpen?: boolean
	onDismiss?: () => void
	trigger?: string
}

export function resolveActiveLoadoutSummary(
	archetypeId: ShipArchetypeId,
	themeId: StarPointsThemeId,
): { shipName: string; themeName: string } {
	const shipManifest = SHIP_SOCKET_MANIFESTS[archetypeId]
	const themeDefinition = STAR_POINTS_THEMES[themeId]
	return {
		shipName: shipManifest?.name ?? 'Starship',
		themeName: themeDefinition?.name ?? 'Standard',
	}
}

export function StarshipCustomizerPopover({
	id = 'starship-customizer-popover',
	isOpen,
	onDismiss,
	trigger,
}: StarshipCustomizerPopoverProps) {
	const history = useHistory()
	const { themeId } = useStarPointsTheme()
	const { archetypeId } = useStarshipCustomization()

	const { shipName, themeName } = resolveActiveLoadoutSummary(
		archetypeId,
		themeId,
	)

	const handleNavigateToShipyard = (event: React.MouseEvent) => {
		const popover = (event.target as HTMLElement).closest('ion-popover')
		if (popover && typeof (popover as any).dismiss === 'function') {
			;(popover as any).dismiss()
		}
		onDismiss?.()
		history.push('/shipyard')
	}

	return (
		<IonPopover
			id={id}
			data-testid={id}
			trigger={trigger}
			triggerAction={trigger ? 'click' : undefined}
			isOpen={isOpen}
			animated={false}
			onDidDismiss={onDismiss}
			className="starship-customizer-popover"
			style={
				{
					'--width': '280px',
					'--max-width': '90vw',
					'--background': '#0b0f17',
					'--backdrop-opacity': '0.5',
				} as React.CSSProperties
			}
		>
			<div
				className="text-neutral-100 p-4 space-y-3.5 select-none"
				style={{ background: '#0b0f17' }}
			>
				<div>
					<div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
						Active Loadout
					</div>
					<div className="mt-1 space-y-1">
						<div className="flex items-center justify-between text-sm">
							<span className="text-neutral-400 text-xs">Ship</span>
							<span
								data-testid="popover-ship-name"
								className="font-bold text-white tracking-wide"
							>
								{shipName}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="text-neutral-400 text-xs">Theme</span>
							<span
								data-testid="popover-theme-name"
								className="font-bold text-sky-300 tracking-wide"
							>
								{themeName}
							</span>
						</div>
					</div>
				</div>

				<IonButton
					data-testid="popover-customise-button"
					expand="block"
					size="small"
					color="primary"
					onClick={handleNavigateToShipyard}
					className="font-semibold tracking-wide m-0"
				>
					<IonIcon icon={constructSharp} slot="start" />
					Customise
				</IonButton>
			</div>
		</IonPopover>
	)
}

export default StarshipCustomizerPopover
