import AppDemo from './AppDemo';
import Layout from '../components/Layout';
import Button from './Button';
import P from './P';
import StatementLarge from './StatementLarge';
import StatementSmall from './StatementSmall';
import { useEffect } from 'react';
import FeatureSpotlight from './FeatureSpotlight';
import Journey from './Journey';

export default function IndexPage() {
	useEffect(setupAnimations, []);

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
						<img src="/logo.png" className="w-20 mx-4"></img>
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
					<FeatureSpotlight id="what-is-starfocus" heading="What is Starfocus">
						In this age of constant distraction and information overload we need
						more thoughtfully designed apps that learn what is important to us
						and help us to stay focused.
						<br />
						<br />A key design goal of Starfocus is to embrace our imperfect
						human nature. Rigid scheduling of todos is error-prone and
						demotivating. Never-ending backlogs of todos are anxiety-inducing.
						We prefer goal-setting, brain-dumping, and space exploration!
					</FeatureSpotlight>
					<FeatureSpotlight id="star-points" heading="Star Points">
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
	);
}

function setupAnimations() {
	setupWhatIsStarfocusAnimations();
	setupStarPointsAnimations();
	setupAppDemoAnimations();
}

function setupWhatIsStarfocusAnimations() {
	const whatIsStarfocus = document.getElementById('what-is-starfocus');

	let observer = new IntersectionObserver(
		(entries) => {
			const content = document.querySelector('#what-is-starfocus .content');
			const appDemo = document.getElementById('app-demo');
			if (entries[0].isIntersecting) {
				content.classList.remove('off-screen');
				appDemo.classList.add('expanded');
			} else {
				content.classList.add('off-screen');
				appDemo.classList.remove('expanded');
			}
		},
		{
			threshold: 0.9,
		}
	);

	observer.observe(whatIsStarfocus);
}

function setupStarPointsAnimations() {
	const starPoints = document.getElementById('star-points');

	let observer = new IntersectionObserver(
		(entries) => {
			const content = document.querySelector('#star-points .content');
			if (entries[0].isIntersecting) {
				content.classList.remove('off-screen');
			} else {
				content.classList.add('off-screen');
			}
		},
		{
			threshold: 0.9,
		}
	);

	observer.observe(starPoints);
}

function setupAppDemoAnimations() {
	const whatIsStarfocus = document.getElementById('what-is-starfocus');
	let observer = new IntersectionObserver(
		(entries) => {
			const appDemo = document.getElementById('app-demo');
			if (entries[0].isIntersecting) {
				appDemo.classList.add('expanded');
			} else {
				appDemo.classList.remove('expanded');
			}
		},
		{
			threshold: 0,
		}
	);
	observer.observe(whatIsStarfocus);
}
