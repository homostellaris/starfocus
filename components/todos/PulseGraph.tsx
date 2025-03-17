import dayjs from 'dayjs'
import { cn } from '../common/cn'
import starScale from '../common/starScale'
import { Checkin } from '../db'

export default function PulseGraph({
	starPoints,
	checkins,
}: {
	starPoints: number
	checkins: Checkin[]
}) {
	const color = starScale[starPoints].tailwindBgColors
	const last30Days: { date: Date; magnitude: 0 | 1 | 2 }[] = []
	for (let i = 0; i < 14; i++) {
		const date = dayjs().subtract(i, 'day')
		const checkinsOnThisDay = checkins.filter(c =>
			dayjs(c.date).isSame(date, 'day'),
		)
		console.debug('checkinsOnThisDay', checkinsOnThisDay.length)
		last30Days.push({
			date: date.toDate(),
			magnitude: Math.min(checkinsOnThisDay.length, 2) as 0 | 1 | 2,
		})
	}

	return (
		<div
			className={cn(
				'relative flex items-center gap-1 my-2 justify-evenly w-fit h-4 brightness-50',
			)}
		>
			{last30Days.map(checkin => (
				<div
					className={cn(
						'w-1 rounded-full',
						color,
						heightClasses[checkin.magnitude],
					)}
					key={checkin.date.toDateString()}
				/>
			))}
		</div>
	)
}

const heightClasses = ['h-[2px] w-[2px]', 'h-2', 'h-4']
