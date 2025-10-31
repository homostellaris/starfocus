'use client'

import { createContext, useContext, useState, PropsWithChildren } from 'react'

type Mode = 'chill' | 'hype'

interface MoodContextType {
	mode: Mode
	setMode: (mode: Mode) => void
}

const MoodContext = createContext<MoodContextType | undefined>(undefined)

export function MoodProvider({ children }: PropsWithChildren) {
	const [mode, setMode] = useState<Mode>('chill')

	return (
		<MoodContext.Provider value={{ mode, setMode }}>
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
