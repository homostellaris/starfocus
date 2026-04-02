'use client'

import { createContext, PropsWithChildren, useContext, useState } from 'react'

const HELP_STORAGE_KEY = 'help-enabled'

type HelpContextValue = {
	helpEnabled: boolean
	toggleHelp: () => void
}

const HelpContext = createContext<HelpContextValue>({
	helpEnabled: true,
	toggleHelp: () => {},
})

function readInitialState() {
	if (typeof window === 'undefined') return { helpEnabled: true }
	const stored = localStorage.getItem(HELP_STORAGE_KEY)
	if (stored === null) {
		localStorage.setItem(HELP_STORAGE_KEY, 'true')
		return { helpEnabled: true }
	}
	return { helpEnabled: stored === 'true' }
}

export function HelpProvider({ children }: PropsWithChildren) {
	const initial = readInitialState()
	const [helpEnabled, setHelpEnabled] = useState(initial.helpEnabled)

	function toggleHelp() {
		setHelpEnabled(v => {
			const next = !v
			localStorage.setItem(HELP_STORAGE_KEY, String(next))
			return next
		})
	}

	return (
		<HelpContext.Provider value={{ helpEnabled, toggleHelp }}>
			{children}
		</HelpContext.Provider>
	)
}

export function useHelp() {
	return useContext(HelpContext)
}
