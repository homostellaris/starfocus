import { useEffect } from 'react'

export default function FeatureSpotlight(props) {
	useEffect(() => setupAnimations(props.id), [])

	return (
		<section
			id={props.id}
			className="h-screen relative"
		>
			<div className="content off-screen transition-all mx-auto my-2 max-w-prose absolute top-56 left-0 right-0">
				<h1 className="text-white uppercase supernova text-5xl font-black">
					{props.heading}
				</h1>
				<p className="text-white text-justify">{props.children}</p>
			</div>
		</section>
	)
}

function setupAnimations(id) {
	const element = document.getElementById(id)

	let observer = new IntersectionObserver(
		entries => {
			const content = document.querySelector(`#${id} .content`)
			if (entries[0].isIntersecting) {
				content.classList.remove('off-screen')
			} else {
				content.classList.add('off-screen')
			}
		},
		{
			threshold: 0.9,
		}
	)

	observer.observe(element)
}
