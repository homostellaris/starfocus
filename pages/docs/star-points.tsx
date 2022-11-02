import Layout from '../../components/common/Layout'
import Feature from '../../components/landingPage/Features/Feature'

export default function StarPoints(props) {
	return (
		<Layout title="Star Points">
			<Feature
				id="star-points"
				heading={'Star Points'}
				images={[]}
				top={0}
			>
				You can see Starfocus as a game in which the objective is to collect as
				many star points as possible. Star points are earned by completing todos
				which move you closer to your loftiest goals. For example, a simple todo
				like “Take the bins out” should earn you 0 star points whereas something
				like “Learn to code” might earn you 5!
			</Feature>
		</Layout>
	)
}
