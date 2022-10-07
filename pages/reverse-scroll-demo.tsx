import { useEffect } from 'react'

export default function ReverseScrollDemo() {
	const style = `
		.box, .container {
			position: relative;
			height: 500px;
			width: 500px;
			border: 1px solid black;
			perspective-origin: top right;
		}

		.box {
			width: 20px;
			background-color: red;
			position: absolute;
			top: 0;

			transform-origin: top right;
			transform:
				matrix3d(
					1, 0, 0, 0,
					0, 1, 0, 0,
					0, 0, 1, 0,
					0, 0, 0, -1
				)
				translateZ(-2px);
			z-index: 1;
		}
		.container {
			perspective: 1px;
			overflow: scroll;
		}
		.spacer {
			height: 1300px;
		}
	`
	useEffect(() => {
		const scroller = document.querySelector('.container')
		const thumb = document.querySelector('.box')
		const scrollerHeight = scroller.getBoundingClientRect().height
		thumb.style.height =
			(scrollerHeight * scrollerHeight) / scroller.scrollHeight + 'px'
		thumb.style.right =
			scroller.clientWidth - scroller.getBoundingClientRect().width + 'px'
	}, [])
	return (
		<>
			<style>{style}</style>
			<div className="container">
				<div className="box"></div>
				<div className="spacer"></div>
			</div>
		</>
	)
}
