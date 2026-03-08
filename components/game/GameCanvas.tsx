'use client'

import { useRef, useEffect } from 'react'

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

export default function GameCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const starsRef = useRef<Star[]>([])
	const particlesRef = useRef<Particle[]>([])
	const animationIdRef = useRef<number>(0)
	const shipImageRef = useRef<HTMLImageElement | null>(null)
	const shipLoadedRef = useRef(false)

	const isGameModeRef = useRef(false)
	const shipYRef = useRef(100)
	const shipPositionRef = useRef({ x: 0, y: 0 })
	const speedMultiplierRef = useRef(1)
	const widthRef = useRef(0)
	const heightRef = useRef(0)
	const keysRef = useRef<Record<string, boolean>>({})

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const img = new Image()
		img.src = '/starship.png'
		img.onload = () => {
			shipImageRef.current = img
			shipLoadedRef.current = true
		}

		const createStarfield = (width: number, height: number, count: number): Star[] =>
			Array.from({ length: count }, () => ({
				x: Math.random() * width,
				y: Math.random() * height,
				size: Math.random() * 2 + 0.5,
				speed: Math.random() * 0.5 + 0.1,
				brightness: Math.random() * 0.5 + 0.5,
			}))

		const handleResize = () => {
			const dpr = window.devicePixelRatio || 1
			const width = window.innerWidth
			const height = window.innerHeight
			widthRef.current = width
			heightRef.current = height
			canvas.width = width * dpr
			canvas.height = height * dpr
			const ctx = canvas.getContext('2d')
			if (ctx) ctx.scale(dpr, dpr)
			starsRef.current = createStarfield(width, height, 150)
		}

		handleResize()
		window.addEventListener('resize', handleResize)

		const handleShipY = (e: CustomEvent<number>) => {
			shipYRef.current = e.detail
		}

		const handleEnter = () => {
			if (isGameModeRef.current) return
			isGameModeRef.current = true
			document.documentElement.classList.add('game-mode')
			shipPositionRef.current = {
				x: widthRef.current / 2,
				y: heightRef.current / 2,
			}
			let speed = 1
			const interval = setInterval(() => {
				speed = Math.min(speed + 0.5, 10)
				speedMultiplierRef.current = speed
				if (speed >= 10) {
					clearInterval(interval)
					setTimeout(() => {
						speedMultiplierRef.current = 2
					}, 500)
				}
			}, 50)
		}

		const handleExit = () => {
			if (!isGameModeRef.current) return
			speedMultiplierRef.current = 5
			setTimeout(() => {
				isGameModeRef.current = false
				speedMultiplierRef.current = 1
				document.documentElement.classList.remove('game-mode')
			}, 300)
		}

		window.addEventListener('game:shipY', handleShipY as EventListener)
		window.addEventListener('game:enter', handleEnter)
		window.addEventListener('game:exit', handleExit)

		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return

			const key = e.key.toLowerCase()
			keysRef.current[key] = true

			if (key === 'g' && !isGameModeRef.current) {
				window.dispatchEvent(new CustomEvent('game:enter'))
			}
			if (key === 'escape' && isGameModeRef.current) {
				window.dispatchEvent(new CustomEvent('game:exit'))
			}

			if (
				isGameModeRef.current &&
				['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)
			) {
				e.preventDefault()
			}
		}

		const handleKeyUp = (e: KeyboardEvent) => {
			keysRef.current[e.key.toLowerCase()] = false
		}

		window.addEventListener('keydown', handleKeyDown)
		window.addEventListener('keyup', handleKeyUp)

		const addThrusterParticles = (x: number, y: number) => {
			const colors = ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3']
			for (let i = 0; i < 3; i++) {
				particlesRef.current.push({
					x: x + (Math.random() - 0.5) * 10,
					y,
					vx: (Math.random() - 0.5) * 2,
					vy: Math.random() * 3 + 1,
					size: Math.random() * 3 + 1,
					life: 1,
					maxLife: 1,
					color: colors[Math.floor(Math.random() * colors.length)],
				})
			}
		}

		const render = () => {
			const ctx = canvas.getContext('2d')
			if (!ctx) return

			const width = widthRef.current
			const height = heightRef.current
			const isGameMode = isGameModeRef.current
			const speedMultiplier = speedMultiplierRef.current

			if (isGameMode) {
				const shipSpeed = 5
				const keys = keysRef.current
				let dx = 0
				let dy = 0
				if (keys['w'] || keys['arrowup']) dy -= shipSpeed
				if (keys['s'] || keys['arrowdown']) dy += shipSpeed
				if (keys['a'] || keys['arrowleft']) dx -= shipSpeed
				if (keys['d'] || keys['arrowright']) dx += shipSpeed

				if (dx !== 0 || dy !== 0) {
					const prev = shipPositionRef.current
					const newX = Math.max(28, Math.min(width - 28, prev.x + dx))
					const newY = Math.max(28, Math.min(height - 28, prev.y + dy))
					if (dy < 0) addThrusterParticles(newX, newY + 28)
					shipPositionRef.current = { x: newX, y: newY }
				}
			}

			ctx.clearRect(0, 0, width, height)

			const gradient = ctx.createLinearGradient(0, 0, 0, height)
			gradient.addColorStop(0, '#0a0a1a')
			gradient.addColorStop(0.5, '#0d1033')
			gradient.addColorStop(1, '#0a0a1a')
			ctx.fillStyle = gradient
			ctx.fillRect(0, 0, width, height)

			starsRef.current.forEach(star => {
				ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`
				ctx.fillRect(star.x, star.y, star.size, star.size)

				star.y += star.speed * speedMultiplier

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

				if (star.y > height) {
					star.y = 0
					star.x = Math.random() * width
				}
			})

			particlesRef.current = particlesRef.current.filter(particle => {
				particle.x += particle.vx
				particle.y += particle.vy
				particle.life -= 0.02
				if (particle.life <= 0) return false

				const alpha = particle.life / particle.maxLife
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

			if (shipLoadedRef.current && shipImageRef.current) {
				const shipSize = 56
				let shipX: number
				let shipY: number

				if (isGameMode) {
					shipX = shipPositionRef.current.x - shipSize / 2
					shipY = shipPositionRef.current.y - shipSize / 2
				} else {
					shipX = 0
					shipY = shipYRef.current
				}

				ctx.save()
				ctx.translate(shipX + shipSize / 2, shipY + shipSize / 2)
				ctx.rotate(Math.PI)
				ctx.drawImage(shipImageRef.current, -shipSize / 2, -shipSize / 2, shipSize, shipSize)
				ctx.restore()

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

		return () => {
			cancelAnimationFrame(animationIdRef.current)
			window.removeEventListener('resize', handleResize)
			window.removeEventListener('game:shipY', handleShipY as EventListener)
			window.removeEventListener('game:enter', handleEnter)
			window.removeEventListener('game:exit', handleExit)
			window.removeEventListener('keydown', handleKeyDown)
			window.removeEventListener('keyup', handleKeyUp)
		}
	}, [])

	return (
		<canvas
			ref={canvasRef}
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: -1,
				width: '100vw',
				height: '100vh',
			}}
		/>
	)
}
