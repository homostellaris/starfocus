import { getImageSize } from 'next/dist/server/image-optimizer'
import Image, { StaticImageData } from 'next/image'
import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'

export default function Feature(props: {
	children: ReactNode
	heading: string
	id: string
	previews: {
		image: StaticImageData
		caption: string
	}[]
	top: number
}) {
	const [imageIndex, setImageIndex] = useState<number>(0)
	useEffect(() => {
		setTimeout(
			() => setImageIndex((imageIndex + 1) % props.previews.length),
			2000
		)
	})

	useEffect(() => {
		setupAnimations(props.id)
	}, [props.id])

	return (
		<section
			id={props.id}
			className="relative h-screen"
		>
			<div
				className={`content absolute left-0 right-0 top-[${props.top}] mx-auto my-2 max-w-prose p-4 transition-all`}
			>
				<h1 className="supernova text-4xl font-black uppercase text-white md:text-5xl">
					{props.heading}
				</h1>
				<div className="glass my-4 rounded-2xl p-4">
					<p className="text-justify text-white">{props.children}</p>
					<div className="text-right">
						<Link href={'/docs/' + props.id}>
							<a className="text-blue-400">Learn more</a>
						</Link>
					</div>
				</div>
				<div className="relative my-4">
					{props.previews.map(({ image, caption }, index) => (
						<div
							className={`absolute top-0 transition-opacity duration-1000 ${
								index === imageIndex ? 'opacity-100' : 'opacity-0'
							}`}
							key={index}
						>
							<h5 className="m-2 text-sm font-medium text-slate-400">
								{caption}
							</h5>
							<Image
								src={image}
								alt="A todo with 0 star points"
							/>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}

function setupAnimations(id) {
	const element = document.getElementById(id)
	const content = document.querySelector(`#${id} .content`)
	;(content as HTMLElement).style.opacity = '0.5'

	let observer = new IntersectionObserver(
		entries => {
			if (entries[0].isIntersecting) {
				;(content as HTMLElement).style.opacity = '1'
			}
		},
		{
			threshold: 0.9,
			// root: document.getElementById('starship'),
		}
	)

	observer.observe(element)
}
