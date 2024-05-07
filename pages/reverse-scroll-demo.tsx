import { useEffect, useLayoutEffect } from 'react'
import Features from '../components/landingPage/Features'

export default function ReverseScrollDemo() {
	useLayoutEffect(() => {
		const scroller = document.querySelector('.scroller')!
		const thumb = document.querySelector('.left-column') as HTMLElement

		const scrollerVisibleHeight = scroller.getBoundingClientRect().height
		const scrollerTotalHeight = scroller.scrollHeight

		// const fractionOfContentVisible = scrollerVisibleHeight / scrollerTotalHeight
		// thumb.style.height = scrollerVisibleHeight * fractionOfContentVisible + 'px'

		const thumbHeight = 80
		const factor =
			(scrollerVisibleHeight - thumbHeight) /
			(scrollerTotalHeight - scrollerVisibleHeight)

		thumb.style.transform = `
			scale(${1 / factor})
			translateZ(${1 - 1 / factor}px)
			translateX(-30vw)
		`
	}, [])

	const style = `
		.scroller {
			display: flex;
			height: 100vh;
			width: 100vw;

			perspective: 1px;
			perspective-origin: bottom;
			overflow: scroll;
			overflow-x: clip;
		}

		.left-column {
			background-color: blue;
			width: 20vw;
			height: 100vh;
			position: relative;
			// position: absolute;
			bottom: 0;
			// left: 100px;
			flex-shrink: 0;

			transform-origin: bottom;
		}

		.starship {
			position: absolute;
			left: 0;
			right: 0;
			margin-left: auto;
			margin-right: auto;
			bottom: 0;
			width: 50px;
			height: 80px;
			background-color: red;
		}

		#lipsum {
			position: relative;
			color: white;
			margin: 1rem auto;
			flex-grow: 0;
		}

		.right-column {
			background-color: green;
			width: 20vw;
			height: 100vh;
			position: relative;
			// position: absolute;
			bottom: 0;
			// left: 100px;
			flex-shrink: 0;

			transform-origin: bottom;
		}

		.spacer {
			width: 100vw;
			height: 800vh;
			position: absolute;
			top: 0;
			transform:
				matrix3d(
					1, 0, 0, 0,
					0, 1, 0, 0,
					0, 0, 1, 0,
					0, 0, 0, -1
				)
				scale(20)
				translateZ(-10px)
				translateZ(-2px);
		}

		.crosshairs {
			position: fixed;
			width: 100vw;
			height: 100vh;
			background: linear-gradient(#000, #000) no-repeat center/2px 100%, linear-gradient(0.25turn, #000, #000) no-repeat center/100% 2PX;
			z-index: 2;
		}

		p {
			margin: 1rem;
		}
	`

	return (
		<>
			<style>{style}</style>
			<div className="scroller">
				{/* <div className="crosshairs"></div> */}
				<div className="bg-contain spacer bg-planets"></div>
				<div className="left-column">
					<div className="starship"></div>
				</div>
				<div id="lipsum">
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam
						pharetra sodales nibh. Curabitur a rhoncus libero. Integer et
						imperdiet neque. Aenean volutpat fermentum libero commodo eleifend.
						Phasellus non imperdiet felis, sit amet venenatis ante. Nunc ut
						ullamcorper risus. In nibh ex, venenatis ac ipsum eu, euismod
						egestas nisi. Mauris a imperdiet orci. Ut egestas metus dolor, ut
						viverra ipsum consequat blandit. Nunc pretium metus non fringilla
						interdum. Mauris ultrices sem risus, quis imperdiet risus euismod
						at. Pellentesque gravida odio vel nunc dignissim suscipit. Maecenas
						aliquet, mi quis tristique eleifend, nunc nunc laoreet turpis, quis
						faucibus lacus magna suscipit leo. Nunc vestibulum faucibus neque,
						sit amet mollis nisi ullamcorper id.
					</p>
					<p>
						Nam quam lorem, iaculis vel lacinia vel, hendrerit ut turpis.
						Vestibulum in mauris vel ipsum mollis iaculis. Nulla ornare
						ullamcorper pulvinar. Vivamus dignissim risus eu rhoncus semper.
						Orci varius natoque penatibus et magnis dis parturient montes,
						nascetur ridiculus mus. Sed dapibus leo erat, ut laoreet dolor
						tincidunt quis. Morbi quam dolor, bibendum in dolor et, congue
						interdum est. Vestibulum pretium elit nulla, quis accumsan nulla
						ornare ac.
					</p>
					<p>
						Vestibulum convallis dolor ut varius efficitur. Sed commodo, ante
						vitae semper rutrum, risus urna interdum ipsum, nec semper augue dui
						id arcu. Sed molestie sagittis nisl, eu mattis felis auctor id.
						Nulla quis lectus ipsum. Curabitur ullamcorper convallis auctor. Sed
						quis felis luctus, tempor nisi at, convallis diam. Lorem ipsum dolor
						sit amet, consectetur adipiscing elit. Maecenas at velit neque.
						Maecenas rutrum pretium diam, quis venenatis orci sagittis ut. Duis
						accumsan facilisis metus non fermentum. Praesent vel congue sapien,
						at ultricies ex.
					</p>
					<p>
						Aliquam eget neque convallis leo luctus mattis. Praesent ut pretium
						risus, sit amet aliquam lectus. Proin condimentum ex semper
						elementum blandit. In ut elit sed velit porttitor hendrerit quis a
						metus. Nam ac molestie velit. Aliquam ultrices semper nulla in
						aliquet. Integer sit amet tempus erat.
					</p>
					<p>
						Sed interdum ultrices nisi in vestibulum. Lorem ipsum dolor sit
						amet, consectetur adipiscing elit. Donec tempus sapien nec velit
						rhoncus auctor. Curabitur tempus justo vel metus maximus, in dictum
						risus sodales. Suspendisse blandit sodales augue ut dictum.
						Phasellus fermentum porta dui, ac feugiat arcu posuere vel. Sed
						ullamcorper ut nulla eget suscipit. Aenean vel congue justo, eget
						varius metus. Mauris pellentesque nec sem egestas malesuada. Orci
						varius natoque penatibus et magnis dis parturient montes, nascetur
						ridiculus mus.
					</p>
					<p>
						Quisque condimentum suscipit viverra. Vestibulum accumsan tempor
						pellentesque. Aliquam tellus nunc, dictum quis vestibulum in,
						vulputate vitae libero. In vel lectus ut dui finibus faucibus vel
						vitae nisi. Sed et purus vitae nibh egestas efficitur. Nunc in urna
						ante. Duis ac efficitur dolor, nec venenatis arcu. Nam sit amet
						risus quis augue consectetur imperdiet eget vitae nulla. Cras at
						hendrerit lacus. Fusce dignissim nulla sit amet posuere porttitor.
						Donec felis tellus, scelerisque consequat nisl eget, rhoncus
						faucibus elit. Integer efficitur, tortor egestas lacinia
						scelerisque, felis eros vestibulum magna, eget dapibus mauris ipsum
						tristique elit. Proin ut lacus mi. Proin facilisis, nunc quis
						suscipit rutrum, nibh lacus lobortis dolor, vel euismod sem magna
						vel tortor.
					</p>
					<p>
						Maecenas laoreet tristique condimentum. Nulla commodo sagittis quam
						a sagittis. Sed facilisis venenatis ligula non imperdiet. Nam mollis
						imperdiet eros, sed finibus velit ornare a. Donec varius volutpat
						vulputate. Phasellus sit amet odio quam. Duis ultricies et diam vel
						lobortis. Praesent diam turpis, imperdiet eu rhoncus euismod,
						sollicitudin quis nisl. Nullam vel condimentum risus. Morbi vitae
						feugiat odio.
					</p>
					<p>
						Fusce porttitor lobortis bibendum. Curabitur tincidunt condimentum
						augue, et mollis felis varius vel. Donec at sapien vulputate,
						interdum nisl vitae, vehicula libero. Aliquam non molestie urna,
						quis pretium erat. Etiam rhoncus sed orci id posuere. Etiam lacinia
						venenatis tellus ac consectetur. Integer aliquet mi hendrerit arcu
						pretium, non sollicitudin enim volutpat. Pellentesque ornare lacinia
						finibus. Morbi sit amet accumsan nisi, auctor mattis dolor. Aliquam
						vestibulum scelerisque augue ut dictum. Vestibulum non maximus arcu.
						Donec auctor erat in lectus mattis ultrices. Pellentesque tincidunt
						aliquet dui ut scelerisque. In tincidunt vitae eros ut viverra. Sed
						at arcu non velit placerat condimentum sit amet ac enim.
					</p>
					<p>
						Proin id metus rhoncus massa aliquam accumsan. Duis at ornare
						tortor, sit amet egestas ante. Donec in euismod eros. Donec placerat
						mauris porta mi consequat, nec molestie turpis pulvinar. Vivamus
						feugiat elementum ligula. Sed sed justo justo. Duis congue est in
						magna consectetur, ut bibendum eros bibendum. Ut vel lacus tortor.
						Sed luctus sed eros quis laoreet. Nam nec leo eros. Pellentesque
						eros metus, fringilla et cursus eget, condimentum ac odio. Cras
						elementum lacus turpis, a congue nibh finibus vitae. Mauris feugiat
						ultrices diam, nec tempus leo dictum eu. Curabitur sit amet bibendum
						nibh, in auctor ipsum. Fusce pharetra convallis nibh. Pellentesque
						gravida risus quis bibendum vestibulum.
					</p>
					<p>
						Cras vulputate lacus ut vulputate aliquam. Vestibulum ut diam sit
						amet eros ultricies commodo vehicula non nulla. Sed egestas bibendum
						odio, vel feugiat ipsum finibus non. Aliquam feugiat convallis mi
						vitae posuere. Donec consequat, mi in porta ullamcorper, tellus nibh
						rhoncus risus, nec pulvinar mauris orci ut leo. Donec eu lacus
						massa. Aenean a lacus ullamcorper diam ornare accumsan ut
						sollicitudin lacus. Integer viverra dictum mi, at vehicula nunc
						vehicula a. In et lorem metus.
					</p>
					<p>
						Nunc rutrum nunc orci, at pretium augue pellentesque porta. Vivamus
						mollis nisl eu sapien pretium, imperdiet gravida lorem efficitur.
						Proin metus enim, gravida quis quam et, semper venenatis odio.
						Phasellus venenatis fermentum efficitur. Duis eleifend, arcu vitae
						lobortis malesuada, sapien elit suscipit ligula, sed laoreet nisi
						lorem a erat. Donec in tellus justo. Donec scelerisque, felis non
						ullamcorper mollis, urna ante accumsan est, quis volutpat leo leo at
						mi. Nulla convallis odio at sodales commodo. Quisque facilisis
						libero efficitur, malesuada libero at, euismod mauris. Ut posuere,
						nibh nec sagittis porttitor, lacus elit blandit arcu, ut venenatis
						augue ligula et risus. Integer fringilla vulputate est, ut laoreet
						urna tempus pellentesque. Curabitur euismod arcu aliquet felis
						hendrerit maximus eu sit amet ante.
					</p>
					<p>
						In a libero aliquet, laoreet lectus in, feugiat est. Curabitur eu
						posuere orci, a pellentesque dui. Donec porta sapien nec leo
						elementum lobortis. Vivamus eros elit, vestibulum a mi sit amet,
						vehicula luctus nibh. Quisque non sapien interdum, lobortis ligula
						at, faucibus ligula. Class aptent taciti sociosqu ad litora torquent
						per conubia nostra, per inceptos himenaeos. Pellentesque habitant
						morbi tristique senectus et netus et malesuada fames ac turpis
						egestas. Nam placerat tortor non sem egestas, at dapibus mauris
						consequat. Aenean tempus mauris vel posuere dignissim. Suspendisse
						sem tellus, commodo et nibh ut, finibus finibus sapien. Suspendisse
						lobortis pulvinar nunc, feugiat tincidunt velit. Interdum et
						malesuada fames ac ante ipsum primis in faucibus.
					</p>
					<p>
						Pellentesque viverra turpis pharetra nisi auctor ornare. Sed
						scelerisque egestas commodo. Mauris non nisi placerat eros tristique
						mollis ut non leo. Nullam auctor finibus massa id dictum. Interdum
						et malesuada fames ac ante ipsum primis in faucibus. Aenean eu est
						quis odio blandit viverra. Vivamus feugiat pulvinar leo, at
						tincidunt orci lacinia at. Etiam convallis odio justo, eu
						ullamcorper nisi dapibus id.
					</p>
					<p>
						Nunc rutrum sollicitudin ligula at dignissim. Sed pretium feugiat
						leo, a feugiat est consequat et. Fusce lacinia in urna id dictum.
						Nullam ornare venenatis odio ut euismod. Class aptent taciti
						sociosqu ad litora torquent per conubia nostra, per inceptos
						himenaeos. Maecenas augue ante, vulputate malesuada diam eleifend,
						ultrices dapibus turpis. Donec at ligula quis ex cursus lacinia.
					</p>
					<p>
						Integer bibendum condimentum turpis, at congue velit suscipit a. Ut
						malesuada felis quis porttitor euismod. Nullam vitae eleifend metus.
						Sed eu sagittis mauris, eget mattis lorem. Ut euismod mollis quam,
						efficitur finibus libero rutrum nec. Sed nec sapien faucibus,
						rhoncus dui at, rutrum neque. Nam mattis pellentesque massa, id
						vehicula lorem hendrerit nec. Fusce eget nibh posuere diam pulvinar
						aliquam. Aliquam non ultrices risus. Nulla facilisi. Maecenas
						ullamcorper faucibus diam ut suscipit. Ut dui magna, mattis eget
						nunc faucibus, rhoncus venenatis tortor. Ut placerat vel tortor non
						molestie. Vestibulum ante ipsum primis in faucibus orci luctus et
						ultrices posuere cubilia curae; Integer mauris arcu, imperdiet ut
						arcu vel, faucibus vehicula metus. Suspendisse bibendum at tortor ac
						consequat.
					</p>
					<p>
						Duis augue odio, ultrices a efficitur eu, porta id nisi. Morbi dolor
						libero, rhoncus sed lectus ac, mollis aliquam justo. Phasellus ut
						tortor velit. Nunc ut nulla metus. Mauris eget turpis volutpat,
						porttitor arcu sodales, sollicitudin ligula. Vestibulum ac tempus
						mi, eget tincidunt dui. Praesent tempor ante ipsum, vitae elementum
						neque eleifend eu. Nulla facilisi.
					</p>
					<p>
						Pellentesque et auctor augue. Vivamus vel tortor vulputate, porta
						magna ac, condimentum elit. Donec suscipit, nunc non euismod
						elementum, erat nunc aliquam nulla, quis placerat orci lacus in
						nunc. Curabitur in quam lacus. Sed non ultricies tellus. Vestibulum
						ante ipsum primis in faucibus orci luctus et ultrices posuere
						cubilia curae; Nulla ut faucibus diam, ut placerat nulla. Praesent
						quis massa est.
					</p>
					<p>
						Ut mollis libero risus, at rhoncus magna consequat vitae. Maecenas
						iaculis laoreet felis vitae dictum. Fusce bibendum ante lorem, sit
						amet fermentum leo tincidunt vitae. Nunc eu velit ultrices, pharetra
						magna non, interdum nisl. Vestibulum sapien ex, sodales eget mauris
						quis, rhoncus congue orci. Etiam bibendum ligula nec gravida
						imperdiet. Mauris fermentum, enim sed ornare dapibus, lectus risus
						iaculis urna, eget suscipit nunc elit at risus. Integer efficitur
						eleifend diam eget gravida. Phasellus ut nibh ex. Donec vitae lorem
						sollicitudin, vehicula dui tempor, porta dolor. Vivamus eget mi
						imperdiet lorem scelerisque vestibulum a vel lectus.
					</p>
					<p>
						Nunc ullamcorper, odio vel fringilla accumsan, dui enim feugiat
						justo, eget scelerisque metus sapien sed nisi. Vestibulum ac ornare
						nulla. Proin ornare velit quam. Fusce sit amet commodo risus. Aenean
						vulputate magna nibh, eu tristique nulla fringilla ut. Curabitur
						posuere, justo a pharetra commodo, neque metus malesuada nisi,
						finibus rhoncus lorem nulla nec tortor. Phasellus quis placerat leo,
						quis suscipit dolor. Maecenas in urna a neque lobortis pellentesque
						sit amet vitae metus. Pellentesque eget erat accumsan lacus
						hendrerit faucibus egestas non dolor.
					</p>
					<p>
						Suspendisse non dolor nec orci consequat pretium. Sed interdum,
						lectus id dapibus porta, sapien metus iaculis lacus, et laoreet erat
						arcu eu felis. Donec scelerisque ullamcorper mauris eleifend
						consequat. Vivamus metus erat, condimentum sed magna sed, vestibulum
						efficitur neque. Vivamus augue felis, efficitur nec nibh id,
						fringilla ultrices mauris. Nullam elit ex, posuere sed feugiat a,
						blandit a metus. Phasellus mollis facilisis dolor, ut fringilla enim
						rhoncus nec. Donec placerat arcu in nibh pulvinar commodo. Morbi
						dapibus pretium sapien, ultrices sodales ante aliquet vitae. Cras
						quis massa nunc. Ut sollicitudin id dui vel bibendum. Phasellus dui
						nunc, porttitor ac maximus quis, pharetra nec turpis.
					</p>
					<p>
						Fusce justo leo, porta a sapien nec, elementum fringilla magna.
						Aliquam euismod fermentum sapien a auctor. Aenean non enim maximus
						magna pulvinar varius. Mauris hendrerit nibh porttitor leo dapibus
						volutpat. Nullam cursus nec nisi a tristique. Aenean nec placerat
						mauris. Ut finibus vestibulum sem et porttitor. Nulla sit amet justo
						pharetra, lobortis lacus non, egestas augue.
					</p>
					<p>
						Donec pulvinar, odio in blandit suscipit, odio erat molestie leo, ac
						cursus nulla nulla vitae ex. Praesent eget nulla sit amet ligula
						placerat pulvinar. Quisque magna nunc, facilisis commodo porttitor
						quis, pulvinar a ligula. Pellentesque ut magna ante. Cras a felis a
						dui bibendum mollis. Mauris ultrices purus a diam dignissim posuere.
						Suspendisse pretium, ligula non tincidunt imperdiet, lorem elit
						viverra eros, vel pretium ipsum orci sed mi. Nam at nibh sem.
					</p>
					<p>
						Mauris pulvinar lacus vitae arcu ultricies, a mattis nisi feugiat.
						Nulla facilisi. Proin vitae mollis lectus. Ut tincidunt imperdiet
						est, id faucibus sem interdum vel. Morbi non velit in nulla euismod
						ultricies. Integer eleifend mauris mauris, quis aliquam quam pretium
						et. Etiam eget ante lectus. Mauris pharetra vel purus aliquet
						commodo. Donec quis volutpat lorem. Vestibulum id luctus arcu,
						bibendum mollis neque. Praesent aliquet elit in nulla facilisis
						dignissim. Praesent posuere accumsan elit, vel accumsan nibh
						vulputate vel.
					</p>
					<p>
						Pellentesque sit amet elit eu nisl ornare viverra et a tellus.
						Nullam metus nulla, porta nec viverra eget, commodo et dolor. Nullam
						commodo bibendum libero, pharetra dapibus elit dapibus in. Donec
						neque felis, gravida ut nulla ut, tempor vestibulum tortor. Quisque
						elit diam, pulvinar at facilisis non, laoreet sed velit. Sed
						accumsan cursus erat, a rhoncus dui lacinia quis. Lorem ipsum dolor
						sit amet, consectetur adipiscing elit. Duis hendrerit ultrices
						sapien sit amet lobortis. Nunc vestibulum, est ut lacinia
						vestibulum, ligula mi vulputate purus, in tincidunt mauris quam
						varius massa. Nunc at mattis dui. Aliquam erat volutpat. Proin nunc
						leo, posuere eget ultrices eu, maximus et odio. Nam risus felis,
						tempus at vulputate in, pharetra nec libero. Mauris lacus ex, mollis
						non quam in, sollicitudin aliquam ante. Quisque ac ullamcorper
						massa, eu lobortis eros.
					</p>
					<p>
						Vivamus ac nulla leo. Nulla vulputate leo a nisl ornare egestas.
						Aliquam viverra turpis sit amet efficitur dictum. Sed id nisl
						lectus. Maecenas non venenatis turpis, quis molestie lorem. Sed odio
						lectus, rhoncus vel mattis id, feugiat et dui. Pellentesque bibendum
						varius enim, sed dictum nunc pellentesque et. Etiam non justo id
						urna condimentum pretium a vehicula velit. Morbi libero ipsum,
						fringilla sit amet fermentum vitae, tempus vel justo.
					</p>
					<p>
						Sed viverra tortor in massa rutrum ultrices. Maecenas ac vulputate
						quam. Morbi aliquet ligula ut pharetra elementum. Duis consectetur
						ipsum gravida elit pulvinar, vel vestibulum sapien dignissim.
						Vestibulum ante ipsum primis in faucibus orci luctus et ultrices
						posuere cubilia curae; In nec odio nisi. Sed eu turpis vel nibh
						bibendum pulvinar a non tortor. Vivamus tempus mi luctus orci
						pretium, non elementum massa semper. Vestibulum ante ipsum primis in
						faucibus orci luctus et ultrices posuere cubilia curae; Fusce vitae
						mauris vitae lorem iaculis tincidunt eu ac elit.
					</p>
					<p>
						Integer eu cursus tortor. Integer tempor justo a mi ullamcorper, at
						aliquet nibh semper. Mauris dapibus, erat a vestibulum viverra, quam
						urna pulvinar nunc, sed finibus nisl leo eu lacus. Vivamus in nulla
						libero. Donec ac mauris et dolor vulputate aliquam ut et nisl. Fusce
						nec lacinia justo. Nunc non tellus elit. Cras a ex felis. Integer
						sed velit tellus. Fusce tincidunt suscipit turpis, sit amet
						venenatis tortor iaculis eget. Aenean a nulla eu tortor ultricies
						commodo vitae at augue. Vivamus auctor at arcu ac ultricies.
						Curabitur ipsum dui, egestas in nisl et, eleifend condimentum ante.
						Cras cursus augue quis arcu egestas, a fringilla lorem ultricies.
					</p>
					<p>
						Proin finibus faucibus odio nec tempor. Aliquam aliquet ipsum a
						ultricies imperdiet. Nunc eleifend lacus at faucibus luctus. Ut
						ultrices purus et libero dignissim, ut lacinia enim feugiat. Fusce
						semper convallis molestie. Vestibulum id auctor felis. Curabitur eu
						dolor at sem imperdiet maximus ac non enim. Ut iaculis massa mattis
						facilisis cursus. Nam nec tincidunt nunc. Nunc id pellentesque
						lorem. Vivamus id neque lobortis, elementum metus et, consectetur
						turpis. Praesent maximus nisl enim, ac sollicitudin odio facilisis
						non.
					</p>
					<p>
						Suspendisse aliquet felis vitae pellentesque mollis. Quisque euismod
						vulputate aliquam. Duis blandit urna id diam tempus, eget tempor
						tellus commodo. Quisque malesuada aliquet nulla dapibus commodo.
						Etiam feugiat finibus diam non vestibulum. Pellentesque tincidunt
						metus nec est imperdiet, a luctus nisi pellentesque. Interdum et
						malesuada fames ac ante ipsum primis in faucibus. Integer
						sollicitudin sem sem, in tristique lacus tempus ac. Etiam nec erat
						et eros ornare dictum ac sed erat. Praesent eu leo non lorem viverra
						commodo. Praesent justo purus, porttitor sit amet eros sed, porta
						accumsan massa. Nunc semper quam eu nisl convallis hendrerit. Mauris
						laoreet ipsum eu imperdiet mattis. Aenean mollis est ut diam commodo
						euismod.
					</p>
					<p>
						Vestibulum bibendum tellus tristique tincidunt molestie. Suspendisse
						facilisis, velit eu tincidunt rhoncus, lectus quam bibendum ante,
						vitae molestie nisi lorem ac urna. Suspendisse potenti. Proin
						consectetur metus diam, a ultrices nisi pulvinar vel. Nulla sed ante
						ac velit suscipit dictum at sit amet turpis. Pellentesque habitant
						morbi tristique senectus et netus et malesuada fames ac turpis
						egestas. Proin in leo metus. Sed eleifend ultricies velit eu
						hendrerit.
					</p>
				</div>
				<div className="right-column"></div>
			</div>
		</>
	)
}
