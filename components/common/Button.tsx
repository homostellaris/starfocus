export default function Button(props) {
	return (
		<button
			className={
				(props.className || '') +
				' ' +
				'rounded-md border p-2 text-center text-xl font-semibold uppercase text-white'
			}
			title={props.title}
		>
			{props.children}
		</button>
	)
}
