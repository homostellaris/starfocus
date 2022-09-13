export default function P(props) {
	return (
		<p
			id={props.id}
			className="absolute top-56 left-0 right-0 mx-auto my-2 max-w-prose text-justify text-white transition-all"
		>
			{props.children}
		</p>
	)
}
