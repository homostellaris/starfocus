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
import posthog from 'posthog-js'
import { useEffect, useId } from 'react'
import { cn } from '../common/cn'
import { type Mode, useMood } from './MoodContext'

setupIonicReact({})

export default function Mood() {
	const instanceIdentifier = useId()
	const {
		mode,
		setMode,
		playing,
		togglePlayback,
		currentTrack,
		handleTrackEnd,
		audioReference,
		audioHostIdentifier,
		claimAudioHost,
		releaseAudioHost,
	} = useMood()

	const isAudioHost = audioHostIdentifier === instanceIdentifier

	useEffect(() => {
		claimAudioHost(instanceIdentifier)
		return () => {
			releaseAudioHost(instanceIdentifier)
		}
	}, [claimAudioHost, instanceIdentifier, releaseAudioHost])

	useEffect(() => {
		if (isAudioHost && audioReference.current && currentTrack) {
			audioReference.current.load()
			if (playing) {
				audioReference.current.play()?.catch(() => {})
			}
		}
	}, [audioReference, currentTrack, isAudioHost, playing])

	useEffect(() => {
		if (!isAudioHost) {
			return
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.target !== document.body) return

			if (event.key === 'z') {
				event.preventDefault()
				setMode('chill')
			} else if (event.key === 'x') {
				event.preventDefault()
				setMode('hype')
			} else if (event.code === 'Space') {
				event.preventDefault()
				togglePlayback()
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [isAudioHost, setMode, togglePlayback])

	return (
		<div
			className={cn(
				'flex items-center justify-center border-2 rounded shadow-lg w-min bg-blue-600/15',
				mode === 'hype'
					? 'border-red-500 bg-red-600/15'
					: 'border-blue-500 bg-blue-600/15',
			)}
			data-mood={mode}
			data-testid="mood-control"
		>
			{isAudioHost && currentTrack && (
				<audio
					ref={audioReference}
					onEnded={handleTrackEnd}
				>
					<source
						src={currentTrack}
						type="audio/mpeg"
					/>
				</audio>
			)}
			<IonButton
				fill="clear"
				onClick={() => {
					const startedPlaying = togglePlayback()
					if (startedPlaying) {
						posthog.capture('music_played', { mode })
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
					const newMode = event.detail.value as Mode
					setMode(newMode)
					posthog.capture('music_mode_changed', { mode: newMode })
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
