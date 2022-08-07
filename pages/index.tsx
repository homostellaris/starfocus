import AppDemo from './AppDemo'
import Layout from '../components/Layout'
import Button from './Button'
import StatementLarge from './StatementLarge'
import StatementSmall from './StatementSmall'
import FeatureSpotlight from './FeatureSpotlight'
import Journey from './Journey'
import { useEffect } from 'react'

export default function IndexPage() {
	useEffect(() => {
		console.log('Adding event listener')
		document.addEventListener('scroll', e => {
			const top = window.pageYOffset || document.documentElement.scrollTop
			const main = document.getElementById('main')
			const spaceStuff = document.getElementById('space-stuff')
			main.style.bottom = String(top * -1) + 'px'
			spaceStuff.style.bottom = String(top * -0.1) + 'px'
		})
	}, [])

	return (
		<Layout title="Starfocus | The todo app for the future">
			<main
				id="main"
				className="fixed bottom-0 w-screen"
			>
				<div
					id="space-stuff"
					className="fixed bottom-0 h-[500vh] w-screen bg-blue-500"
				></div>
				<div
					id="journey"
					className="sticky top-0"
				>
					<Journey />
				</div>
				<section
					id="features"
					className="relative"
				>
					<FeatureSpotlight
						id="what-is-starfocus"
						heading="What is Starfocus"
					>
						In this age of constant distraction and information overload we need
						more thoughtfully designed apps that learn what is important to us
						and help us to stay focused.
						<br />
						<br />A key design goal of Starfocus is to embrace our imperfect
						human nature. Rigid scheduling of todos is error-prone and
						demotivating. Never-ending backlogs of todos are anxiety-inducing.
						We prefer goal-setting, brain-dumping, and space exploration!
					</FeatureSpotlight>
					<FeatureSpotlight
						id="star-points"
						heading="Star Points"
					>
						In this age of constant distraction and information overload we need
						more thoughtfully designed apps that learn what is important to us
						and help us to stay focused.
						<br />
						<br />A key design goal of Starfocus is to embrace our imperfect
						human nature. Rigid scheduling of todos is error-prone and
						demotivating. Never-ending backlogs of todos are anxiety-inducing.
						We prefer goal-setting, brain-dumping, and space exploration!
					</FeatureSpotlight>
					<FeatureSpotlight
						id="notes"
						heading="Notes"
					>
						Notes allow you to add as much extra information as you like to any
						todo as Markdown.
						<br />
						<br />
						You can expand a todo to view the notes and a summary of the note
						contents is shown on the main todo section.
						<br />
						<br />
						Technical notes are supported using the “STIX Two Text” font which
						includes a Unicode-based collection of mathematical symbols and
						alphabets.
					</FeatureSpotlight>
					<FeatureSpotlight
						id="log"
						heading="Log"
					>
						When a todo is completed it stays on the screen and becomes a part
						of the log which is a record of everything you've done.
						<br />
						<br />
						As you use Starfocus you are building a giant list of your past,
						present, and future todos that you can simply scroll through and
						look at.
						<br />
						<br />
						This is useful when you're asking yourself “what did I do
						yesterday”?
					</FeatureSpotlight>
					<FeatureSpotlight
						id="today"
						heading="Today"
					>
						If you choose to integrate Starfocus with your calendar then the
						today view will show your next event so that you never miss a
						meeting.
						<br />
						<br />A separate area for time-bound tasks reduces noise and allows
						you to stay focused on your loftier goals. You can also add notes to
						events which is useful for itineraries or a reminder to bring up a
						particular issue in a meeting.
					</FeatureSpotlight>
					<FeatureSpotlight
						id="upcoming"
						heading="Upcoming"
					>
						The today view can be expanded at any time to show you everything
						that's upcoming.
						<br />
						<br />
						Not only will events from your calendar show here, but also any
						dates in your todo notes. This flexible system can support a simple
						deadline or a series of milestones.
						<br />
						<br />
						Every morning you'll be prompted to review the next few days in the
						upcoming view so you never miss a deadline.
					</FeatureSpotlight>
					<FeatureSpotlight
						id="roles"
						heading="Roles"
					>
						What are your goals in life? To answer this question you can think
						about the important roles you fulfill in your life, imagine a
						beautiful future in which you excel in these roles, and write down a
						mission statement for each one to inspire yourself!
						<br />
						<br />
						Every todo in Starfocus can be assigned to a role and you can
						quickly filter everything you see in the app to a particular role
						when you are focusing on that particular area of your life.
						<br />
						<br />
						Roles are also good frames of reference when you are reflecting on
						your progress and we'll surface stats to help you with this. Maybe
						you've gathered a lot of star points in the software creator role
						but not so many in the friend role? Time to re-prioritise!
						<br />
						<br />
						You don't have to write your mission statements right now, but
						deciding on the roles is the first step in your Starfocus journey
						and we'd like you to start it right now!
						<br />
						<br />
						We'll even generate a completely unique constellation from your
						roles and a unique URL to add to your bios.
					</FeatureSpotlight>
				</section>
				<section
					id="hello"
					className="h-screen"
				>
					<h1
						id="title"
						className="font-extralight text-6xl text-center text-white tracking-widest uppercase supernova"
					>
						{/* Find out why this has a weird margin. */}
						Starfocus
					</h1>
					<div className="flex justify-center items-center flex-wrap">
						<span className="w-80 text-center border-b">
							<StatementSmall>Avoid earthly distractions</StatementSmall>
						</span>
						<img
							src="/logo.png"
							className="w-20 mx-4"
						></img>
						<span className="w-80 text-center border-b">
							<StatementSmall>Stay focused</StatementSmall>
						</span>
					</div>
					<h2 className="text-center">
						<StatementLarge>Aim for the stars</StatementLarge>
					</h2>
					<div className="text-center m-4">
						{/* <p className="text-slate-400 m-4">Beta coming soon</p> */}
						<Button className="supernova">Register</Button>
					</div>
					{/* <p className="hint font-light text-xl text-white text-center m-4">
						Scroll up or use the arrow keys to learn more
					</p> */}
					<div className="w-10/12 h-[200px] m-auto left-0 right-0">
						{/* Make this sticky too */}
						<AppDemo />
					</div>
				</section>
			</main>
		</Layout>
	)
}
