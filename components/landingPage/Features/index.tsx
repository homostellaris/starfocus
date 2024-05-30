import { useMemo } from 'react'
import logNoTodosCompleted from './log - no todos completed.png'
import logOneTodoCompleted from './log - one todo completed.png'
import constellationNoRoles from './constellation - no roles.png'
import constellationEightRoles from './constellation - eight roles.png'
import notesHidden from './notes - hidden.png'
import notesEditing from './notes - editing.png'
import notesReading from './notes - reading.png'
import rolesNoFilter from './roles - no filter.png'
import rolesSoftwareEngineerFilter from './roles - software engineer filter.png'
import starPointsZero from './star points - zero.png'
import starPointsFive from './star points - five.png'
import todayThirtyMinutes from './today - 30m.png'
import todayFifteenMinutes from './today - 15m.png'
import upcomingCollapsed from './upcoming - collapsed.png'
import upcomingExpanded from './upcoming - expanded.png'
import Feature from './Feature'

export default function Features(props) {
	const tops = useMemo(() => {
		const tops: number[] = []
		for (let i = 0; i < props.featuresCount; i++) {
			const top = Math.round(80 / props.featuresCount) * (i + 1)
			tops.push(top)
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
				previews={[
					{
						image: constellationNoRoles,
						caption: 'No roles',
					},
					{
						image: constellationEightRoles,
						caption: 'Eight roles',
					},
				]}
				heading="Constellation"
				top={tops[6]}
			>
				Create a unique constellation of your roles so that you never forget
				what&apos;s important and where you&apos;re headed.
			</Feature>
			<Feature
				id="roles"
				previews={[
					{
						image: rolesNoFilter,
						caption: 'No filter',
					},
					{
						image: rolesSoftwareEngineerFilter,
						caption: 'Software engineer filter',
					},
				]}
				heading="Roles"
				top={tops[6]}
			>
				Assign todos to your important roles in life and easily focus on one at
				any time.
			</Feature>
			<Feature
				id="upcoming"
				previews={[
					{
						image: upcomingCollapsed,
						caption: 'Collapsed',
					},
					{
						image: upcomingExpanded,
						caption: 'Expanded',
					},
				]}
				heading="Upcoming"
				top={tops[5]}
			>
				See everything you have upcoming at the push of a button.
			</Feature>
			<Feature
				id="today"
				previews={[
					{
						image: todayThirtyMinutes,
						caption: 'Thirty minutes until next event',
					},
					{
						image: todayFifteenMinutes,
						caption: 'Fifteen minutes until next event',
					},
				]}
				heading="Today"
				top={tops[4]}
			>
				Integrate with your calendar so you never miss a meeting.
			</Feature>
			<Feature
				id="log"
				previews={[
					{
						image: logNoTodosCompleted,
						caption: 'No todos completed',
					},
					{
						image: logOneTodoCompleted,
						caption: 'One todo completed',
					},
				]}
				heading="Log"
				top={tops[3]}
			>
				Easily see what you did yesterday and every day before that.
			</Feature>
			<Feature
				id="notes"
				previews={[
					{
						image: notesHidden,
						caption: 'Notes hidden',
					},
					{
						image: notesEditing,
						caption: 'Editing notes',
					},
					{
						image: notesReading,
						caption: 'Reading notes',
					},
				]}
				heading="Notes"
				top={tops[2]}
			>
				Add as much extra information as you like to any todo as Markdown.
			</Feature>
			<Feature
				heading="Star Points"
				id="star-points"
				previews={[
					{
						image: starPointsZero,
						caption: 'Zero star points',
					},
					{
						image: starPointsFive,
						caption: 'Five star points',
					},
				]}
				top={tops[1]}
			>
				Add star points to your todos to distinguish between small chores and
				larger goals.
			</Feature>
		</section>
	)
}
