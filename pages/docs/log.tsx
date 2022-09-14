import Layout from '../../components/common/Layout'
import Feature from '../../components/landingPage/Features/Feature'

export default function Log(props) {
	return (
		<Layout title="Log">
			<Feature
				id="log"
				heading="Log"
			>
				When a todo is completed it stays on the screen and becomes a part of
				the log which is a record of everything you&apos;ve done.
				<br />
				<br />
				As you use Starfocus you are building a giant list of your past,
				present, and future todos that you can simply scroll through and look
				at.
				<br />
				<br />
				This is useful when you&apos;re asking yourself “what did I do
				yesterday”?
			</Feature>
		</Layout>
	)
}
