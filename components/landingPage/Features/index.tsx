import { useMemo } from 'react'
import Feature from './Feature'

export default function Features(props) {
	const tops = useMemo(() => {
		const tops = []
		for (let i = 0; i < props.featuresCount; i++) {
			const top = Math.round(80 / props.featuresCount) * (i + 1)
			tops.push(top + '%')
		}
		return tops
	}, [props.featuresCount])

	return (
		<section
			id="features"
			className="relative"
		>
			<Feature
				id="constellation"
				heading="Constellation"
				top={tops[6]}
			>
				Create a unique constellation of your roles so that you never forget
				what&apos;s important and where you&apos;re headed.
			</Feature>
			<Feature
				id="roles"
				heading="Roles"
				top={tops[6]}
			>
				Assign todos to your important roles in life and easily focus on one at
				any time.
			</Feature>
			<Feature
				id="upcoming"
				heading="Upcoming"
				top={tops[5]}
			>
				See everything you have upcoming at the push of a button.
			</Feature>
			<Feature
				id="today"
				heading="Today"
				top={tops[4]}
			>
				Integrate with your calendar so you never miss a meeting.
			</Feature>
			<Feature
				id="log"
				heading="Log"
				top={tops[3]}
			>
				Easily see what you did yesterday and every day before that.
			</Feature>
			<Feature
				id="notes"
				heading="Notes"
				top={tops[2]}
			>
				Add as much extra information as you like to any todo as Markdown.
			</Feature>
			<Feature
				id="star-points"
				heading="Star Points"
				top={tops[1]}
			>
				Add star points to your todos to distinguish between small chores and
				larger goals.
			</Feature>
		</section>
	)
}
