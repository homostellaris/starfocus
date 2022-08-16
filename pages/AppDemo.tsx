export default function AppDemo() {
	// useEffect(setupAnimations, [])
	return (
		<div
			id="app-demo"
			className="h-full rounded-md border transition-all"
		>
			{/* <p>hello</p> */}
		</div>
	)
}

function setupAnimations() {
	const whatIsStarfocus = document.getElementById('what-is-starfocus')

	let observer = new IntersectionObserver(
		entries => {
			const appDemo = document.getElementById('app-demo')
			if (entries[0].isIntersecting) {
				appDemo.classList.add('expanded')
			} else {
				appDemo.classList.remove('expanded')
			}
		},
		{
			threshold: 0,
		}
	)

	observer.observe(whatIsStarfocus)
}
