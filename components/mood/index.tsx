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
import { useEffect, useRef, useState } from 'react'
import { cn } from '../common/cn'
import { useMood } from './MoodContext'

setupIonicReact({})

type mode = 'chill' | 'hype'

const MUSIC_FILES = {
	chill: [
		'/music/chill/Melodysheep - Water Worlds.mp3',
		'/music/chill/Melodysheep - Sights of Space 1.mp3',
		'/music/chill/Melodysheep - Sights of Space 2.mp3',
		'/music/chill/Melodysheep - Sights of Space 3.mp3',
		'/music/chill/Melodysheep - Sights of Space 4.mp3',
		'/music/chill/Melodysheep - Sights of Space 5.mp3',
		'/music/chill/Melodysheep - Sights of Space 6.mp3',
	],
	hype: [
		'music/hype/Karl Casey - Black Lotus.mp3',
		'music/hype/Karl Casey - Lucid Dream.mp3',
		'music/hype/Karl Casey - Radiation Sickness.mp3',
		'music/hype/Karl Casey - Replicant Hunter.mp3',
	],
}

export default function Mood() {
	const audio = useRef<HTMLAudioElement>(null)
	const [playing, setPlaying] = useState<boolean>(false)
	const { mode, setMode } = useMood()
	const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0)

	const currentPlaylist = MUSIC_FILES[mode]
	const currentTrack = currentPlaylist[currentTrackIndex] || null

	const prevModeRef = useRef(mode)
	// eslint-disable-next-line react-hooks/refs -- React-recommended "adjust state during render" pattern
	if (prevModeRef.current !== mode) {
		// eslint-disable-next-line react-hooks/refs -- React-recommended "adjust state during render" pattern
		prevModeRef.current = mode
		setCurrentTrackIndex(0)
	}

	useEffect(() => {
		if (audio.current && currentTrack) {
			audio.current.load()
			if (playing) {
				audio.current.play()
			}
		}
	}, [currentTrack, playing])

	useEffect(() => {
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
				setPlaying(playing => !playing)
				if (audio.current?.paused) {
					audio.current?.play()
				} else {
					audio.current?.pause()
				}
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [setMode])

	const handleTrackEnd = () => {
		const nextIndex = (currentTrackIndex + 1) % currentPlaylist.length
		setCurrentTrackIndex(nextIndex)
	}

	return (
		<div
			className={cn(
				'flex items-center justify-center border-2 rounded shadow-lg w-min bg-blue-600/15',
				mode === 'hype'
					? 'border-red-500 bg-red-600/15'
					: 'border-blue-500 bg-blue-600/15',
			)}
		>
			{currentTrack && (
				<audio
					ref={audio}
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
					const wasPlaying = playing
					setPlaying(playing => !playing)
					if (audio.current?.paused) {
						audio.current?.play()
						if (!wasPlaying) {
							posthog.capture('music_played', { mode })
						}
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
					const newMode = event.detail.value as mode
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
