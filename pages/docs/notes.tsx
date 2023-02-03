import Layout from '../../components/landingPage/Layout'
import Feature from '../../components/landingPage/Features/Feature'

export default function Notes(props) {
	return (
		<Layout title="Notes">
			<Feature
				id="notes"
				heading="Notes"
				previews={[]}
				top={0}
			>
				Notes allow you to add as much extra information as you like to any todo
				as Markdown.
				<br />
				<br />
				You can expand a todo to view the notes and a summary of the note
				contents is shown on the main todo section.
				<br />
				<br />
				Technical notes are supported using the “STIX Two Text” font which
				includes a Unicode-based collection of mathematical symbols and
				alphabets.
			</Feature>
		</Layout>
	)
}
