'use client'

import {
	createContext,
	PropsWithChildren,
	RefObject,
	useCallback,
	useContext,
	useRef,
	useState,
} from 'react'

export type Mode = 'chill' | 'hype'

const MUSIC_FILES: Record<Mode, string[]> = {
	chill: [
		'/music/chill/Melodysheep - Water Worlds.mp3',
		'/music/chill/Melodysheep - Sights of Space Bside - 01.mp3',
		'/music/chill/Melodysheep - Sights of Space Bside - 02.mp3',
		'/music/chill/Melodysheep - Sights of Space Bside - 03.mp3',
		'/music/chill/Melodysheep - Sights of Space Bside - 04.mp3',
		'/music/chill/Melodysheep - Sights of Space Bside - 05.mp3',
		'/music/chill/Melodysheep - Sights of Space Bside - 06.mp3',
	],
	hype: [
		'/music/hype/Karl Casey - Black Lotus.mp3',
		'/music/hype/Karl Casey - Lucid Dream.mp3',
		'/music/hype/Karl Casey - Radiation Sickness.mp3',
		'/music/hype/Karl Casey - Replicant Hunter.mp3',
	],
}

interface MoodContextType {
	mode: Mode
	setMode: (mode: Mode) => void
	playing: boolean
	togglePlayback: () => boolean
	currentTrack: string | null
	handleTrackEnd: () => void
	audioReference: RefObject<HTMLAudioElement | null>
	audioHostIdentifier: string | null
	claimAudioHost: (instanceIdentifier: string) => void
	releaseAudioHost: (instanceIdentifier: string) => void
}

const MoodContext = createContext<MoodContextType | undefined>(undefined)

export function MoodProvider({
	children,
	initialMode = 'chill',
}: PropsWithChildren<{ initialMode?: Mode }>) {
	const [mode, setModeState] = useState<Mode>(initialMode)
	const modeReference = useRef<Mode>(initialMode)
	const [playing, setPlaying] = useState<boolean>(false)
	const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0)
	const [audioHostIdentifier, setAudioHostIdentifier] = useState<string | null>(
		null,
	)
	const audioReference = useRef<HTMLAudioElement | null>(null)

	const currentPlaylist = MUSIC_FILES[mode]
	const currentTrack = currentPlaylist[currentTrackIndex] || null

	const setMode = useCallback((nextMode: Mode) => {
		if (modeReference.current !== nextMode) {
			modeReference.current = nextMode
			setModeState(nextMode)
			setCurrentTrackIndex(0)
		}
	}, [])

	const togglePlayback = useCallback(() => {
		const willPlay = !playing
		setPlaying(willPlay)
		const audioElement = audioReference.current
		if (audioElement) {
			if (audioElement.paused) {
				audioElement.play()?.catch(() => {})
			} else {
				audioElement.pause()
			}
		}
		return willPlay
	}, [playing])

	const handleTrackEnd = useCallback(() => {
		setCurrentTrackIndex(
			(previousIndex) => (previousIndex + 1) % currentPlaylist.length,
		)
	}, [currentPlaylist.length])

	const claimAudioHost = useCallback((instanceIdentifier: string) => {
		setAudioHostIdentifier((currentHost) => currentHost ?? instanceIdentifier)
	}, [])

	const releaseAudioHost = useCallback((instanceIdentifier: string) => {
		setAudioHostIdentifier((currentHost) =>
			currentHost === instanceIdentifier ? null : currentHost,
		)
	}, [])

	return (
		<MoodContext.Provider
			value={{
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
			}}
		>
			{children}
		</MoodContext.Provider>
	)
}

export function useMood() {
	const context = useContext(MoodContext)
	if (context === undefined) {
		throw new Error('useMood must be used within a MoodProvider')
	}
	return context
}
