import { cn } from '../common/cn'

export default function Tracjectory({
	className,
	orientation = 'vertical',
}: {
	orientation?: 'vertical' | 'horizontal'
} & JSX.IntrinsicElements['div']) {
	return (
		<div
			className={cn(
				'trajectory bg-supernova',
				orientation === 'vertical' ? 'h-full w-[2px]' : 'w-full h-[2px]',
				className,
			)}
			// Make the mask solid behind the rocket for a 'completed' effect
			style={{
				maskImage: `repeating-linear-gradient(${orientation === 'vertical' ? '180' : '90'}deg, black, transparent 10px)`,
				// maskSize: '10px 100%',
			}}
		></div>
	)
}
