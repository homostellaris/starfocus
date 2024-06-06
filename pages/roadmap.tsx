import Link from 'next/link'
import Layout from '../components/landingPage/Layout'

export default function Roadmap() {
	return (
		<Layout>
			<div className="flex flex-col items-center h-screen gap-8 p-20">
				<h1 className="text-5xl font-bold text-white">Roadmap</h1>
				<ol className="text-xl text-white list-decimal">
					<li>
						Web app MVP - local data only (
						<Link
							className="underline"
							href="/home"
						>
							in progress
						</Link>
						)
					</li>
					<li>Login & sync to other devices</li>
					<li>Roles</li>
					<li>Android app</li>
					<li>Notes</li>
					<li>Today & upcoming - Google Calendar integration</li>
					<li>Constellations</li>
					<li>iPhone app</li>
					<li>Desktop app</li>
					<li>Sharing</li>
				</ol>
			</div>
		</Layout>
	)
}
