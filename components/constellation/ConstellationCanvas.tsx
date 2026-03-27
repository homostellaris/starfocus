import { forwardRef } from 'react'
import { ConstellationData } from './generateConstellation'

interface Props {
	data: ConstellationData
	size?: number
}

export const ConstellationCanvas = forwardRef<SVGSVGElement, Props>(
	function ConstellationCanvas({ data, size = 280 }, ref) {
		const { nodes, edges, bgStars, nebulaHue, nebulaX, nebulaY } = data

		return (
			<svg
				ref={ref}
				viewBox="0 0 100 100"
				width={size}
				height={size}
				xmlns="http://www.w3.org/2000/svg"
				style={{ borderRadius: '50%', background: '#080818' }}
			>
				<defs>
					<filter
						id="star-glow"
						x="-100%"
						y="-100%"
						width="300%"
						height="300%"
					>
						<feGaussianBlur
							stdDeviation="1.2"
							result="blur"
						/>
						<feMerge>
							<feMergeNode in="blur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
					<radialGradient
						id="nebula-grad"
						cx="50%"
						cy="50%"
						r="50%"
					>
						<stop
							offset="0%"
							stopColor={`hsl(${nebulaHue}, 65%, 35%)`}
							stopOpacity="0.22"
						/>
						<stop
							offset="100%"
							stopColor={`hsl(${nebulaHue}, 65%, 10%)`}
							stopOpacity="0"
						/>
					</radialGradient>
				</defs>

				{/* Nebula */}
				<ellipse
					cx={nebulaX}
					cy={nebulaY}
					rx="28"
					ry="22"
					fill="url(#nebula-grad)"
				/>

				{/* Background micro-stars */}
				{bgStars.map((star, i) => (
					<circle
						key={i}
						cx={star.x}
						cy={star.y}
						r={star.r}
						fill="white"
						opacity={star.opacity}
					/>
				))}

				{/* Constellation lines */}
				{edges.map(([fromId, toId], i) => {
					const from = nodes.find(n => n.id === fromId)
					const to = nodes.find(n => n.id === toId)
					if (!from || !to) return null
					return (
						<line
							key={i}
							x1={from.x}
							y1={from.y}
							x2={to.x}
							y2={to.y}
							stroke="white"
							strokeOpacity="0.2"
							strokeWidth="0.4"
						/>
					)
				})}

				{/* Star nodes */}
				{nodes.map(node => (
					<g
						key={node.id}
						filter="url(#star-glow)"
					>
						<circle
							cx={node.x}
							cy={node.y}
							r="2.2"
							fill="white"
							opacity="0.95"
						/>
						<text
							x={node.x}
							y={node.y + 5.5}
							textAnchor="middle"
							fill="white"
							fillOpacity="0.6"
							fontSize="2.8"
							fontFamily="monospace"
						>
							{node.title.length > 9
								? node.title.slice(0, 8) + '\u2026'
								: node.title}
						</text>
					</g>
				))}
			</svg>
		)
	},
)
