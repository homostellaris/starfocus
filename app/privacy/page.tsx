export default function Page() {
	return (
		<div className="bg-[radial-gradient(circle_700px_at_50%_250px,#4453a9,#000000)] min-h-screen">
			<header>
				<h1 className="pt-4 mb-12 text-center text-white font-bold uppercase text-9xl font-display [font-palette:--redshift]">
					Privacy
				</h1>
			</header>
			<main className="pt-4 mx-auto space-y-4 font-sans text-lg text-white max-w-prose">
				<p>We collect anonymised usage data such as page views.</p>
				<p>
					We store your data locally and sync it to Dexie Cloud servers if you
					opt-in to it.
				</p>
			</main>
		</div>
	)
}
