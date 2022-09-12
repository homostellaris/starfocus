import Contact from './Contact'

export default function Footer(props) {
	return (
		<footer
			id="calls-to-action"
			className="glass sticky bottom-0 m-auto flex h-[4rem] w-[90vw] items-center justify-center gap-4 rounded-t-2xl p-4"
		>
			<Contact />
		</footer>
	)
}
