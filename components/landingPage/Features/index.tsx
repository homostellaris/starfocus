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
	}, [])

	return (
		<section
			id="features"
			className="relative"
		>
			<Feature
				id="roles"
				heading="Roles"
				top={tops[6]}
			>
				What are your goals in life? To answer this question you can think about
				the important roles you fulfill in your life, imagine a beautiful future
				in which you excel in these roles, and write down a mission statement
				for each one to inspire yourself!
				<br />
				<br />
				Every todo in Starfocus can be assigned to a role and you can quickly
				filter everything you see in the app to a particular role when you are
				focusing on that particular area of your life.
				<br />
				<br />
				Roles are also good frames of reference when you are reflecting on your
				progress and we'll surface stats to help you with this. Maybe you've
				gathered a lot of star points in the software creator role but not so
				many in the friend role? Time to re-prioritise!
				<br />
				<br />
				You don't have to write your mission statements right now, but deciding
				on the roles is the first step in your Starfocus journey and we'd like
				you to start it right now!
				<br />
				<br />
				We'll even generate a completely unique constellation from your roles
				and a unique URL to add to your bios.
			</Feature>
			<Feature
				id="upcoming"
				heading="Upcoming"
				top={tops[5]}
			>
				The today view can be expanded at any time to show you everything that's
				upcoming.
				<br />
				<br />
				Not only will events from your calendar show here, but also any dates in
				your todo notes. This flexible system can support a simple deadline or a
				series of milestones.
				<br />
				<br />
				Every morning you'll be prompted to review the next few days in the
				upcoming view so you never miss a deadline.
			</Feature>
			<Feature
				id="today"
				heading="Today"
				top={tops[4]}
			>
				If you choose to integrate Starfocus with your calendar then the today
				view will show your next event so that you never miss a meeting.
				<br />
				<br />A separate area for time-bound tasks reduces noise and allows you
				to stay focused on your loftier goals. You can also add notes to events
				which is useful for itineraries or a reminder to bring up a particular
				issue in a meeting.
			</Feature>
			<Feature
				id="log"
				heading="Log"
				top={tops[3]}
			>
				When a todo is completed it stays on the screen and becomes a part of
				the log which is a record of everything you've done.
				<br />
				<br />
				As you use Starfocus you are building a giant list of your past,
				present, and future todos that you can simply scroll through and look
				at.
				<br />
				<br />
				This is useful when you're asking yourself “what did I do yesterday”?
			</Feature>
			<Feature
				id="notes"
				heading="Notes"
				top={tops[2]}
			>
				Notes allow you to add as much extra information as you like to any todo
				as Markdown.
				<br />
				<br />
				You can expand a todo to view the notes and a summary of the note
				contents is shown on the main todo section.
				<br />
				<br />
				Technical notes are supported using the “STIX Two Text” font which
				includes a Unicode-based collection of mathematical symbols and
				alphabets.
			</Feature>
			<Feature
				id="star-points"
				heading="Star Points"
				top={tops[1]}
			>
				In this age of constant distraction and information overload we need
				more thoughtfully designed apps that learn what is important to us and
				help us to stay focused.
				<br />
				<br />A key design goal of Starfocus is to embrace our imperfect human
				nature. Rigid scheduling of todos is error-prone and demotivating.
				Never-ending backlogs of todos are anxiety-inducing. We prefer
				goal-setting, brain-dumping, and space exploration!
			</Feature>
			<Feature
				id="what-is-starfocus"
				heading="What is Starfocus"
				top={tops[0]}
			>
				In this age of constant distraction and information overload we need
				more thoughtfully designed apps that learn what is important to us and
				help us to stay focused.
				<br />
				<br />A key design goal of Starfocus is to embrace our imperfect human
				nature. Rigid scheduling of todos is error-prone and demotivating.
				Never-ending backlogs of todos are anxiety-inducing. We prefer
				goal-setting, brain-dumping, and space exploration!
			</Feature>
		</section>
	)
}
