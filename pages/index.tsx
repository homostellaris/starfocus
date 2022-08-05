import AppDemo from './AppDemo'
import Layout from '../components/Layout'
import Button from './Button'
import StatementLarge from './StatementLarge'
import StatementSmall from './StatementSmall'
import FeatureSpotlight from './FeatureSpotlight'
import Journey from './Journey'

export default function IndexPage() {
	return (
		<Layout title="Starfocus | The todo app for the future">
			<main>
				<section>
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
				</section>
				<section className="relative">
					<div className="absolute w-10/12 h-screen m-auto left-0 right-0">
						{/* Make this sticky too */}
						<AppDemo />
					</div>
					<div className="sticky top-0">
						<Journey />
					</div>
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
				</section>
			</main>
		</Layout>
	)
}
