import Image from 'next/image'
import statsIcon from './chart-dynamic-gradient.png'
import roleIcon from './crown-dynamic-gradient.png'
import settingsIcon from './setting-dynamic-gradient.png'
import starIcon from './star-front-gradient.png'
import searchIcon from './zoom-dynamic-gradient.png'
import Footer from '../common/Footer'
import { useEffect, useState } from 'react'

export default function ControlPanel() {
	const [displayControlPanel, setDisplayControlPanel] = useState<boolean>(true)
	useEffect(() => {
		setTimeout(() => {
			setDisplayControlPanel(false)
		}, 3000)
	}, [])

	return (
		<div
			className="fixed bottom-0 w-full h-20"
			onMouseOver={() => {
				setDisplayControlPanel(true)
			}}
			onMouseLeave={() => {
				setDisplayControlPanel(false)
			}}
		>
			<Footer display={displayControlPanel}>
				<Image
					src={statsIcon}
					alt="star icon"
					width="50"
					height="50"
				></Image>
				<Image
					src={searchIcon}
					alt="star icon"
					width="50"
					height="50"
				></Image>
				<Image
					src={starIcon}
					alt="star icon"
					width="50"
					height="50"
				></Image>
				<Image
					src={roleIcon}
					alt="star icon"
					width="50"
					height="50"
				></Image>
				<Image
					src={settingsIcon}
					alt="star icon"
					width="50"
					height="50"
				></Image>
			</Footer>
		</div>
	)
}
