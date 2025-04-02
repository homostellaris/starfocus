import dayjs from 'dayjs'
import { cn } from '../common/cn'
import starScale from '../common/starScale'
import { Visit } from '../db'

export default function PulseGraph({
	starPoints,
	visits,
}: {
	starPoints: number
	visits: Visit[]
}) {
	const color = starScale[starPoints].tailwindBgColors
	const last30Days: { date: Date; magnitude: 0 | 1 | 2 }[] = []
	for (let i = 0; i < 14; i++) {
		const date = dayjs().subtract(i, 'day')
		const visitsOnThisDay = visits.filter(c =>
			dayjs(c.date).isSame(date, 'day'),
		)
		console.debug('visitsOnThisDay', visitsOnThisDay.length)
		last30Days.push({
			date: date.toDate(),
			magnitude: Math.min(visitsOnThisDay.length, 2) as 0 | 1 | 2,
		})
	}

	return (
		<div
			className={cn(
				'relative flex items-center gap-1 my-2 justify-evenly w-fit h-4 brightness-50',
			)}
		>
			{last30Days.map(visit => (
				<div
					className={cn(
						'w-1 rounded-full',
						color,
						heightClasses[visit.magnitude],
					)}
					key={visit.date.toDateString()}
				/>
			))}
		</div>
	)
}

const heightClasses = ['h-[2px] w-[2px]', 'h-2', 'h-4']
