import { type JSX } from 'react'
import { cn } from '../common/cn'
import { useMood } from '../mood/MoodContext'

export default function Tracjectory({
	className,
	currentPosition = 0,
	orientation = 'vertical',
}: {
	currentPosition: number
	orientation?: 'vertical' | 'horizontal'
} & JSX.IntrinsicElements['div']) {
	const { mode } = useMood()
	const gradientColors = {
		chill:
			'bg-[linear-gradient(theme(colors.rose.400),theme(colors.pink.400),theme(colors.fuchsia.400),theme(colors.violet.400),theme(colors.indigo.400),theme(colors.blue.400))]',
		hype: 'bg-[linear-gradient(theme(colors.blue.400),theme(colors.indigo.400),theme(colors.violet.400),theme(colors.fuchsia.400),theme(colors.pink.400),theme(colors.rose.400))]',
	}
	const shadowColor = {
		chill: 'shadow-cyan-500/80',
		hype: 'shadow-rose-500/80',
	}

	return (
		<>
			<div
				className={cn(
					'bg-[linear-gradient(theme(colors.rose.400),theme(colors.pink.400),theme(colors.fuchsia.400),theme(colors.violet.400),theme(colors.indigo.400),theme(colors.blue.400))]',
					'[mask-image:repeating-linear-gradient(180deg,black_0px,black_4px,transparent_4px,transparent_10px)]',
					orientation === 'vertical'
						? 'top-0 bottom-0 min-h-full h-full w-[2px]'
						: 'left-0 right-0 min-w-full w-full h-[2px]',
					className,
				)}
			></div>
			<div
				className={cn(
					gradientColors[mode],
					orientation === 'vertical' ? 'w-[2px] top-0' : 'h-[2px] left-0',
					'transition-all duration-500 ease-in-out',
					'shadow-[0_10px_10px]',
					shadowColor[mode],
					className,
				)}
				style={
					orientation === 'vertical'
						? {
								top: 0,
								height: `${Math.max(0, currentPosition + 28)}px`,
						  }
						: {
								left: 0,
								width: `${Math.max(0, currentPosition + 28)}px`,
						  }
				}
			></div>
		</>
	)
}
