'use client'

import {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
	ReactNode,
	Dispatch,
	SetStateAction,
} from 'react'

interface ShipPosition {
	x: number
	y: number
}

interface GameContextValue {
	isGameMode: boolean
	setIsGameMode: Dispatch<SetStateAction<boolean>>
	enterGameMode: () => void
	exitGameMode: () => void
	shipPosition: ShipPosition
	setShipPosition: Dispatch<SetStateAction<ShipPosition>>
	speedMultiplier: number
	isTransitioning: boolean
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
	const [isGameMode, setIsGameMode] = useState(false)
	const [isTransitioning, setIsTransitioning] = useState(false)
	const [speedMultiplier, setSpeedMultiplier] = useState(1)
	const [shipPosition, setShipPosition] = useState<ShipPosition>({
		x: 28, // Center of 56px gutter
		y: 100,
	})

	// Handle transition animation
	const enterGameMode = useCallback(() => {
		setIsTransitioning(true)

		// Start speed ramp up for hyperspace effect
		let speed = 1
		const speedInterval = setInterval(() => {
			speed = Math.min(speed + 0.5, 10)
			setSpeedMultiplier(speed)
			if (speed >= 10) {
				clearInterval(speedInterval)
			}
		}, 50)

		// Delay the actual mode switch to allow for animation
		setTimeout(() => {
			setIsGameMode(true)

			// Center ship on screen when entering game mode
			setShipPosition({
				x: window.innerWidth / 2,
				y: window.innerHeight / 2,
			})

			// Slow down stars after entering game mode
			setTimeout(() => {
				setSpeedMultiplier(2)
				setIsTransitioning(false)
			}, 500)
		}, 500)
	}, [])

	const exitGameMode = useCallback(() => {
		setIsTransitioning(true)

		// Speed up briefly before exiting
		setSpeedMultiplier(5)

		setTimeout(() => {
			setIsGameMode(false)
			setSpeedMultiplier(1)
			setIsTransitioning(false)
		}, 300)
	}, [])

	// Handle escape key to exit game mode
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isGameMode) {
				exitGameMode()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isGameMode, exitGameMode])

	return (
		<GameContext.Provider
			value={{
				isGameMode,
				setIsGameMode,
				enterGameMode,
				exitGameMode,
				shipPosition,
				setShipPosition,
				speedMultiplier,
				isTransitioning,
			}}
		>
			{children}
		</GameContext.Provider>
	)
}

export function useGameContext() {
	const context = useContext(GameContext)
	if (!context) {
		throw new Error('useGameContext must be used within a GameProvider')
	}
	return context
}
