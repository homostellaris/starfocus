export default function Button(props) {
	return (
		<button
			className={
				(props.className || '') +
				' ' +
				'text-white text-center text-xl uppercase border p-2 rounded-md font-semibold'
			}
		>
			{props.children}
		</button>
	);
}
