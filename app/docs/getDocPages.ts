import fs from 'fs'
import path from 'path'

export interface DocPage {
	slug: string
	title: string
	href: string
}

export function getDocPages(): DocPage[] {
	const docsDirectory = path.join(process.cwd(), 'app/docs')
	const entries = fs.readdirSync(docsDirectory, { withFileTypes: true })

	const pages: DocPage[] = []

	for (const entry of entries) {
		if (!entry.isDirectory()) continue

		const mdxPath = path.join(docsDirectory, entry.name, 'page.mdx')
		if (!fs.existsSync(mdxPath)) continue

		const content = fs.readFileSync(mdxPath, 'utf-8')
		const title = extractTitle(content, entry.name)

		pages.push({
			slug: entry.name,
			title,
			href: `/docs/${entry.name}`,
		})
	}

	return pages.sort((a, b) => {
		const order = ['getting-started', 'philosophy', 'constellation', 'asteroid-field', 'advanced']
		const aIndex = order.indexOf(a.slug)
		const bIndex = order.indexOf(b.slug)
		if (aIndex === -1 && bIndex === -1) return a.title.localeCompare(b.title)
		if (aIndex === -1) return 1
		if (bIndex === -1) return -1
		return aIndex - bIndex
	})
}

function extractTitle(content: string, fallbackSlug: string): string {
	const metadataMatch = content.match(/title:\s*['"]([^'"]+)['"]/)
	if (metadataMatch) {
		return metadataMatch[1].replace(/ - Starfocus Docs$/, '')
	}

	const h1Match = content.match(/^#\s+(.+)$/m)
	if (h1Match) {
		return h1Match[1]
	}

	return fallbackSlug
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}
