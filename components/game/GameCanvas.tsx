'use client'

import {
	useRef,
	useEffect,
	useState,
	useCallback,
	forwardRef,
	useImperativeHandle,
} from 'react'
import { cn } from '../common/cn'
import { useGameContext } from './GameContext'

interface Star {
	x: number
	y: number
	size: number
	speed: number
	brightness: number
}

interface Particle {
	x: number
	y: number
	vx: number
	vy: number
	size: number
	life: number
	maxLife: number
	color: string
}

export interface GameCanvasHandle {
	getContext: () => CanvasRenderingContext2D | null
	getCanvas: () => HTMLCanvasElement | null
}

interface GameCanvasProps {
	className?: string
	starshipY?: number
}

const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
	function GameCanvas({ className, starshipY = 0 }, ref) {
		const canvasRef = useRef<HTMLCanvasElement>(null)
		const starsRef = useRef<Star[]>([])
		const particlesRef = useRef<Particle[]>([])
		const animationIdRef = useRef<number>(0)
		const shipImageRef = useRef<HTMLImageElement | null>(null)
		const shipLoadedRef = useRef(false)

		const { isGameMode, shipPosition, setShipPosition, speedMultiplier } =
			useGameContext()

		const [dimensions, setDimensions] = useState({ width: 56, height: 0 })

		// Expose canvas methods via ref
		useImperativeHandle(ref, () => ({
			getContext: () => canvasRef.current?.getContext('2d') ?? null,
			getCanvas: () => canvasRef.current,
		}))

		// Load spaceship image
		useEffect(() => {
			const img = new Image()
			img.src = '/starship.png'
			img.onload = () => {
				shipImageRef.current = img
				shipLoadedRef.current = true
			}
		}, [])

		// Create starfield
		const createStarfield = useCallback(
			(width: number, height: number, count = 100) => {
				return Array.from({ length: count }, () => ({
					x: Math.random() * width,
					y: Math.random() * height,
					size: Math.random() * 2 + 0.5,
					speed: Math.random() * 0.5 + 0.1,
					brightness: Math.random() * 0.5 + 0.5,
				}))
			},
			[],
		)

		// Handle resize
		useEffect(() => {
			const handleResize = () => {
				const canvas = canvasRef.current
				if (!canvas) return

				const parent = canvas.parentElement
				if (!parent) return

				const rect = parent.getBoundingClientRect()
				const dpr = window.devicePixelRatio || 1

				// In gutter mode, width is fixed at 56px
				// In game mode, take full viewport
				const width = isGameMode ? window.innerWidth : 56
				const height = isGameMode ? window.innerHeight : rect.height

				setDimensions({ width, height })

				// Set canvas resolution accounting for device pixel ratio
				canvas.width = width * dpr
				canvas.height = height * dpr

				// Scale context to match
				const ctx = canvas.getContext('2d')
				if (ctx) {
					ctx.scale(dpr, dpr)
				}

				// Recreate starfield with new dimensions
				const starCount = isGameMode ? 300 : 100
				starsRef.current = createStarfield(width, height, starCount)
			}

			window.addEventListener('resize', handleResize)
			handleResize()

			return () => window.removeEventListener('resize', handleResize)
		}, [isGameMode, createStarfield])

		// Add thruster particles helper
		const addThrusterParticles = useCallback((x: number, y: number) => {
			const colors = ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3'] // Rose colors
			for (let i = 0; i < 3; i++) {
				particlesRef.current.push({
					x: x + (Math.random() - 0.5) * 10,
					y: y,
					vx: (Math.random() - 0.5) * 2,
					vy: Math.random() * 3 + 1,
					size: Math.random() * 3 + 1,
					life: 1,
					maxLife: 1,
					color: colors[Math.floor(Math.random() * colors.length)],
				})
			}
		}, [])

		// Update ship position in game mode based on keyboard input
		useEffect(() => {
			if (!isGameMode) return

			const keys: Record<string, boolean> = {}
			const shipSpeed = 5

			const handleKeyDown = (e: KeyboardEvent) => {
				keys[e.key.toLowerCase()] = true
				// Prevent default for arrow keys and WASD to avoid scrolling
				if (
					['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(
						e.key.toLowerCase(),
					)
				) {
					e.preventDefault()
				}
			}

			const handleKeyUp = (e: KeyboardEvent) => {
				keys[e.key.toLowerCase()] = false
			}

			const updatePosition = () => {
				let dx = 0
				let dy = 0

				if (keys['w'] || keys['arrowup']) dy -= shipSpeed
				if (keys['s'] || keys['arrowdown']) dy += shipSpeed
				if (keys['a'] || keys['arrowleft']) dx -= shipSpeed
				if (keys['d'] || keys['arrowright']) dx += shipSpeed

				if (dx !== 0 || dy !== 0) {
					setShipPosition(prev => {
						const newX = Math.max(
							28,
							Math.min(dimensions.width - 28, prev.x + dx),
						)
						const newY = Math.max(
							28,
							Math.min(dimensions.height - 28, prev.y + dy),
						)

						// Add thruster particles when moving
						if (dy < 0) {
							// Moving up, add particles behind
							addThrusterParticles(newX, newY + 28)
						}

						return { x: newX, y: newY }
					})
				}
			}

			window.addEventListener('keydown', handleKeyDown)
			window.addEventListener('keyup', handleKeyUp)

			const interval = setInterval(updatePosition, 16) // ~60fps

			return () => {
				window.removeEventListener('keydown', handleKeyDown)
				window.removeEventListener('keyup', handleKeyUp)
				clearInterval(interval)
			}
		}, [isGameMode, dimensions, setShipPosition, addThrusterParticles])

		// Main game loop
		useEffect(() => {
			const canvas = canvasRef.current
			if (!canvas) return

			const ctx = canvas.getContext('2d')
			if (!ctx) return

			const render = () => {
				const { width, height } = dimensions

				// Clear canvas
				ctx.clearRect(0, 0, width, height)

				// Draw background gradient
				const gradient = ctx.createLinearGradient(0, 0, 0, height)
				gradient.addColorStop(0, '#0a0a1a')
				gradient.addColorStop(0.5, '#0d1033')
				gradient.addColorStop(1, '#0a0a1a')
				ctx.fillStyle = gradient
				ctx.fillRect(0, 0, width, height)

				// Draw and update stars
				starsRef.current.forEach(star => {
					ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`
					ctx.fillRect(star.x, star.y, star.size, star.size)

					// Move star (faster in game mode or during transition)
					star.y += star.speed * speedMultiplier

					// Add star streaking effect when speed is high
					if (speedMultiplier > 2) {
						const streakLength = Math.min(star.speed * speedMultiplier * 2, 20)
						const streakGradient = ctx.createLinearGradient(
							star.x,
							star.y - streakLength,
							star.x,
							star.y,
						)
						streakGradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
						streakGradient.addColorStop(1, `rgba(255, 255, 255, ${star.brightness * 0.5})`)
						ctx.fillStyle = streakGradient
						ctx.fillRect(star.x, star.y - streakLength, star.size, streakLength)
					}

					// Wrap around
					if (star.y > height) {
						star.y = 0
						star.x = Math.random() * width
					}
				})

				// Draw particles
				particlesRef.current = particlesRef.current.filter(particle => {
					particle.x += particle.vx
					particle.y += particle.vy
					particle.life -= 0.02

					if (particle.life <= 0) return false

					const alpha = particle.life / particle.maxLife
					ctx.fillStyle = particle.color.replace(')', `, ${alpha})`)
						.replace('rgb', 'rgba')
						.replace('#', '')

					// Convert hex to rgba for alpha support
					const hex = particle.color
					const r = parseInt(hex.slice(1, 3), 16)
					const g = parseInt(hex.slice(3, 5), 16)
					const b = parseInt(hex.slice(5, 7), 16)
					ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`

					ctx.beginPath()
					ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2)
					ctx.fill()

					return true
				})

				// Draw spaceship
				if (shipLoadedRef.current && shipImageRef.current) {
					const shipSize = 56
					let shipX: number
					let shipY: number

					if (isGameMode) {
						// In game mode, use controlled position
						shipX = shipPosition.x - shipSize / 2
						shipY = shipPosition.y - shipSize / 2
					} else {
						// In gutter mode, position based on starshipY prop
						shipX = 0
						shipY = starshipY
					}

					// Save context for rotation
					ctx.save()

					// Translate to ship center, rotate 180deg (facing up), then draw
					ctx.translate(shipX + shipSize / 2, shipY + shipSize / 2)
					ctx.rotate(Math.PI) // 180 degrees

					// Draw ship
					ctx.drawImage(
						shipImageRef.current,
						-shipSize / 2,
						-shipSize / 2,
						shipSize,
						shipSize,
					)

					ctx.restore()

					// Add subtle thruster glow in gutter mode
					if (!isGameMode) {
						const glowGradient = ctx.createRadialGradient(
							shipX + shipSize / 2,
							shipY + shipSize - 5,
							0,
							shipX + shipSize / 2,
							shipY + shipSize + 10,
							20,
						)
						glowGradient.addColorStop(0, 'rgba(244, 63, 94, 0.3)')
						glowGradient.addColorStop(0.5, 'rgba(244, 63, 94, 0.1)')
						glowGradient.addColorStop(1, 'rgba(244, 63, 94, 0)')
						ctx.fillStyle = glowGradient
						ctx.fillRect(shipX, shipY + shipSize - 10, shipSize, 30)
					}
				}

				animationIdRef.current = requestAnimationFrame(render)
			}

			render()

			return () => cancelAnimationFrame(animationIdRef.current)
		}, [dimensions, isGameMode, shipPosition, starshipY, speedMultiplier])

		return (
			<canvas
				ref={canvasRef}
				className={cn(
					'transition-all duration-500 ease-in-out',
					isGameMode ? 'fixed inset-0 z-50' : 'absolute top-0 left-0',
					className,
				)}
				style={{
					width: dimensions.width,
					height: dimensions.height,
				}}
			/>
		)
	},
)

export default GameCanvas
