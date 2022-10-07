export default function ReverseScrollDemo() {
	const style = `
		.box {
			height: 500px;
			width: 500px;
			background-color: red;
			position: relative;

			transform:
				translateZ(-2px);
			z-index: 1;
		}
		.container {
			perspective: 1px;
			overflow: scroll;
		}
		.spacer {
			display: block;
			height: 800vh;
			width: 100vw;
		}
	`
	return (
		<>
			<style>{style}</style>
			<div className="container h-screen w-screen border">
				<div className="box"></div>
				<div className="spacer bg-planets bg-cover"></div>
			</div>
		</>
	)
}
