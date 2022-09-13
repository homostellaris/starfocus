import Link from 'next/link'
import Layout from '../components/common/Layout'

const AboutPage = () => (
	<Layout title="About | Next.js + TypeScript Example">
		<h1>About</h1>
		<p>
			In this age of constant distraction and information overload we need more
			thoughtfully designed apps that learn what is important to us and help us
			to stay focused.
			<br />
			<br />A key design goal of Starfocus is to embrace our imperfect human
			nature. Rigid scheduling of todos is error-prone and demotivating.
			Never-ending backlogs of todos are anxiety-inducing. We prefer
			goal-setting, brain-dumping, and space exploration!
		</p>
		<p>
			<Link href="/">
				<a>Go home</a>
			</Link>
		</p>
	</Layout>
)

export default AboutPage
