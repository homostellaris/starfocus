import { StarRole, StarRoleGroup } from '../db'
import { mulberry32 } from './mulberry32'

export interface StarNode {
	id: string
	x: number
	y: number
	title: string
	groupId?: string
}

export interface BgStar {
	x: number
	y: number
	r: number
	opacity: number
}

export interface ConstellationData {
	nodes: StarNode[]
	edges: [string, string][]
	bgStars: BgStar[]
	nebulaHue: number
	nebulaX: number
	nebulaY: number
}

export function generateConstellation(
	emailSeed: number,
	starRoles: StarRole[],
	_starRoleGroups: StarRoleGroup[],
): ConstellationData {
	const rand = mulberry32(emailSeed)

	// Background stars — stable regardless of role changes
	const bgStars: BgStar[] = Array.from({ length: 55 }, () => ({
		x: rand() * 100,
		y: rand() * 100,
		r: rand() * 1.1 + 0.3,
		opacity: rand() * 0.45 + 0.15,
	}))

	// Nebula colour and position
	const nebulaHue = Math.floor(rand() * 360)
	const nebulaX = rand() * 60 + 20
	const nebulaY = rand() * 60 + 20

	if (starRoles.length === 0) {
		return { nodes: [], edges: [], bgStars, nebulaHue, nebulaX, nebulaY }
	}

	// Cluster roles by group
	const groups = new Map<string, StarRole[]>()
	for (const role of starRoles) {
		const key = role.starRoleGroupId ?? '__ungrouped__'
		if (!groups.has(key)) groups.set(key, [])
		groups.get(key)!.push(role)
	}

	// Assign a centroid to each group using the seeded RNG
	const groupCentroids = new Map<string, { x: number; y: number }>()
	Array.from(groups.keys()).forEach(key => {
		groupCentroids.set(key, {
			x: rand() * 70 + 15,
			y: rand() * 70 + 15,
		})
	})

	// Place each star near its group centroid
	const nodes: StarNode[] = []
	Array.from(groups.entries()).forEach(([groupKey, roles]) => {
		const centroid = groupCentroids.get(groupKey)!
		roles.forEach(role => {
			const angle = rand() * Math.PI * 2
			const distance = rand() * 14 + 5
			nodes.push({
				id: role.id,
				x: clamp(centroid.x + Math.cos(angle) * distance, 5, 95),
				y: clamp(centroid.y + Math.sin(angle) * distance, 5, 95),
				title: role.title,
				groupId: role.starRoleGroupId,
			})
		})
	})

	// Repulsion: prevent nodes overlapping
	for (let iter = 0; iter < 40; iter++) {
		for (let i = 0; i < nodes.length; i++) {
			for (let j = i + 1; j < nodes.length; j++) {
				const dx = nodes[j].x - nodes[i].x
				const dy = nodes[j].y - nodes[i].y
				const dist = Math.sqrt(dx * dx + dy * dy) || 0.001
				if (dist < 13) {
					const push = (13 - dist) / 2 / dist
					nodes[i].x = clamp(nodes[i].x - dx * push, 5, 95)
					nodes[i].y = clamp(nodes[i].y - dy * push, 5, 95)
					nodes[j].x = clamp(nodes[j].x + dx * push, 5, 95)
					nodes[j].y = clamp(nodes[j].y + dy * push, 5, 95)
				}
			}
		}
	}

	// Edges: connect roles within the same named group as a path
	const edges: [string, string][] = []
	Array.from(groups.entries()).forEach(([groupKey, roles]) => {
		if (groupKey === '__ungrouped__' || roles.length < 2) return
		for (let i = 0; i < roles.length - 1; i++) {
			edges.push([roles[i].id, roles[i + 1].id])
		}
	})

	return { nodes, edges, bgStars, nebulaHue, nebulaX, nebulaY }
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value))
}
