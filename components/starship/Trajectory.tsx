import { cn } from '../common/cn'

export default function Tracjectory(props: JSX.IntrinsicElements['div']) {
	return (
		<div
			className={cn('trajectory h-full w-[2px] bg-supernova', props.className)}
			// Make the mask solid behind the rocket for a 'completed' effect
			style={{
				maskImage: 'repeating-linear-gradient(180deg, black, transparent 10px)',
				// maskSize: '10px 100%',
			}}
		></div>
	)
}
