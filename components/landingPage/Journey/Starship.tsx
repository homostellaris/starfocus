import Image from 'next/image'

export default function Starship() {
	return (
		<Image
			alt="A starship from a birds-eye view"
			className="starship"
			src="/starship.png"
			layout="fill"
			quality={100}
		></Image>
	)
}
