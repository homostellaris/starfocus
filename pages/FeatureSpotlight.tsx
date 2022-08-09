import { useEffect } from 'react'

export default function FeatureSpotlight(props) {
	// useEffect(() => setupAnimations(props.id), [])

	return (
		<section
			id={props.id}
			className="relative h-screen"
		>
			<div className="content absolute top-56 left-0 right-0 mx-auto my-2 max-w-prose transition-all">
				<h1 className="supernova text-5xl font-black uppercase text-white">
					{props.heading}
				</h1>
				<p className="text-justify text-white">{props.children}</p>
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
