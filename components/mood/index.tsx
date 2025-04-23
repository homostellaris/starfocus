'use client'

import {
	IonButton,
	IonIcon,
	IonLabel,
	IonSegment,
	IonSegmentButton,
	setupIonicReact,
} from '@ionic/react'
import { pauseCircleSharp, playCircleSharp } from 'ionicons/icons'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../common/cn'

setupIonicReact({})

type mode = 'chill' | 'hype'

export default function Mood() {
	const audio = useRef<HTMLAudioElement>(null)
	const [playing, setPlaying] = useState<boolean>(false)
	const [mode, setMode] = useState<'chill' | 'hype'>('chill')

	// useEffect(() => {
	// 	const handleKeyDown = (event: KeyboardEvent) => {
	// 		if (event.key === 'z') {
	// 			event.preventDefault()
	// 			setMode('chill')
	// 		} else if (event.key === 'x') {
	// 			event.preventDefault()
	// 			setMode('hype')
	// 		} else if (event.code === 'Space') {
	// 			event.preventDefault()
	// 			setPlaying(playing => !playing)
	// 			if (audio.current?.paused) {
	// 				audio.current?.play()
	// 			} else {
	// 				audio.current?.pause()
	// 			}
	// 		}
	// 	}
	// 	document.addEventListener('keydown', handleKeyDown)
	// 	return () => {
	// 		document.removeEventListener('keydown', handleKeyDown)
	// 	}
	// }, [])

	return (
		<div
			className={cn(
				'flex items-center justify-center border-2 rounded shadow-lg w-min bg-blue-600/15',
				mode === 'hype'
					? 'border-red-500 bg-red-600/15'
					: 'border-blue-500 bg-blue-600/15',
			)}
		>
			<audio ref={audio}>
				<source
					src="Melodysheep - Water Worlds.mp3"
					type="audio/mpeg"
				/>
			</audio>
			<IonButton
				fill="clear"
				onClick={() => {
					setPlaying(playing => !playing)
					if (audio.current?.paused) {
						audio.current?.play()
					} else {
						audio.current?.pause()
					}
				}}
			>
				<IonIcon
					color={mode === 'hype' ? 'danger' : 'primary'}
					icon={playing ? pauseCircleSharp : playCircleSharp}
					slot="icon-only"
				></IonIcon>
			</IonButton>
			<IonSegment
				color={mode === 'hype' ? 'danger' : 'primary'}
				value={mode}
				onIonChange={event => {
					setMode(event.detail.value as mode)
				}}
			>
				<IonSegmentButton value="chill">
					<IonLabel className="font-display [font-palette:--blue]">
						Chill
					</IonLabel>
				</IonSegmentButton>
				<IonSegmentButton value="hype">
					<IonLabel className="font-display [font-palette:--red]">
						Hype
					</IonLabel>
				</IonSegmentButton>
			</IonSegment>
		</div>
	)
}
