import { PropsWithChildren } from 'react'

export default function Placeholder({
	children,
	heading,
}: PropsWithChildren<{ heading: string }>) {
	return (
		<div className="p-4 space-y-2 text-center">
			<h2 className="text-3xl font-display grayscale">{heading}</h2>
			<p className="mx-auto text-gray-400 max-w-prose">{children}</p>
		</div>
	)
}
