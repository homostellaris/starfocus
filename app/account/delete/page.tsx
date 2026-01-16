import Link from 'next/link'
import Nav from '../../../components/common/Nav'

export default function Page() {
	return (
		<div className="bg-[radial-gradient(circle_700px_at_50%_250px,#4453a9,#000000)] min-h-screen">
			<header>
				<h1 className="pt-4 mb-12 text-center text-white font-bold uppercase text-9xl font-display [font-palette:--redshift]">
					Account deletion
				</h1>
			</header>
			<main className="pt-4 mx-auto space-y-4 font-sans text-lg text-white max-w-prose">
				<p>
					Email{' '}
					<a
						className="text-blue-300 underline"
						href="mailto:mrdanielmetcalfe+starfocus@gmail.com"
					>
						mrdanielmetcalfe+starfocus@gmail.com
					</a>{' '}
					from the email of the account you wish to be deleted and it will be
					processed promptly.
				</p>
			</main>
			<footer>
				<Nav />
			</footer>
		</div>
	)
}
