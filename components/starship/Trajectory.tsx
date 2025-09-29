import { cn } from '../common/cn'

export default function Tracjectory({
	className,
	currentPosition = 0,
	orientation = 'vertical',
}: {
	currentPosition: number
	orientation?: 'vertical' | 'horizontal'
} & JSX.IntrinsicElements['div']) {
	return (
		<>
			<div
				className={cn(
					'bg-[linear-gradient(theme(colors.rose.400),theme(colors.pink.400),theme(colors.fuchsia.400),theme(colors.violet.400),theme(colors.indigo.400),theme(colors.blue.400))]',
					"[mask-image:repeating-linear-gradient(180deg,black,transparent_10px),url('/black-rectangle-svgrepo-com.svg')] [mask-repeat:no-repeat] [mask-position:left_top,left_top]",
					orientation === 'vertical' ? 'h-full w-[2px]' : 'w-full h-[2px]',
					className,
				)}
			></div>
			<div
				className={cn(
					'bg-[linear-gradient(theme(colors.rose.400),theme(colors.pink.400),theme(colors.fuchsia.400),theme(colors.violet.400),theme(colors.indigo.400),theme(colors.blue.400))]',
					orientation === 'vertical' ? 'h-full w-[2px]' : 'w-full h-[2px]',
					'transition-transform duration-500 ease-in-out',
					'shadow-[0_10px_10px] shadow-cyan-500/80',
					className,
				)}
				style={{
					transform: `translate(0, calc(calc(100% - ${currentPosition + 20}px) * -1))`,
				}}
			></div>
		</>
	)
}
