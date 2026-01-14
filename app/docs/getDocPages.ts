import fs from 'fs'
import path from 'path'

export interface DocPage {
	slug: string
	title: string
	href: string | null
	comingSoon?: boolean
	children?: DocPage[]
}

export function getDocPages(): DocPage[] {
	const docsDirectory = path.join(process.cwd(), 'app/docs')
	const indexPath = path.join(docsDirectory, 'index.mdx')
	const indexContent = fs.readFileSync(indexPath, 'utf-8')

	return parseIndexMdx(indexContent, docsDirectory)
}

function parseIndexMdx(content: string, docsDirectory: string): DocPage[] {
	const lines = content.split('\n').filter(line => line.trim())
	const pages: DocPage[] = []
	let currentParent: DocPage | null = null

	for (const line of lines) {
		const topLevelMatch = line.match(/^- (.+)$/)
		const nestedMatch = line.match(/^  - (.+)$/)

		if (topLevelMatch) {
			const item = topLevelMatch[1]
			const page = parseItem(item, docsDirectory)
			pages.push(page)
			currentParent = page
		} else if (nestedMatch && currentParent) {
			const item = nestedMatch[1]
			const page = parseItem(item, docsDirectory, currentParent.slug)
			if (!currentParent.children) {
				currentParent.children = []
			}
			currentParent.children.push(page)
		}
	}

	return pages
}

function parseItem(item: string, docsDirectory: string, parentSlug?: string): DocPage {
	const comingSoonLinkMatch = item.match(/^\[coming soon\]\s*\[([^\]]+)\]\(([^)]+)\)$/)
	const comingSoonMatch = item.match(/^\[coming soon\]\s*([^[].*)$/)
	const linkMatch = item.match(/^\[([^\]]+)\]\(([^)]+)\)$/)

	if (comingSoonLinkMatch) {
		const title = comingSoonLinkMatch[1]
		const relativePath = comingSoonLinkMatch[2]
		const slug = relativePath.replace(/^\.\//, '').replace(/\/page\.mdx$/, '')
		return {
			slug,
			title,
			href: `/docs/${slug}`,
			comingSoon: true,
		}
	}

	if (comingSoonMatch) {
		const title = comingSoonMatch[1]
		const slug = title.toLowerCase().replace(/\s+/g, '-')
		const pagePath = parentSlug
			? path.join(docsDirectory, parentSlug, slug, 'page.mdx')
			: path.join(docsDirectory, slug, 'page.mdx')
		const hasPage = fs.existsSync(pagePath)
		const href = hasPage
			? `/docs/${parentSlug ? `${parentSlug}/${slug}` : slug}`
			: null
		return { slug, title, href, comingSoon: true }
	}

	if (linkMatch) {
		const title = linkMatch[1]
		const relativePath = linkMatch[2]
		const slug = relativePath.replace(/^\.\//, '').replace(/\/page\.mdx$/, '')
		return {
			slug,
			title,
			href: `/docs/${slug}`,
		}
	}

	const slug = item.toLowerCase().replace(/\s+/g, '-')
	const pagePath = parentSlug
		? path.join(docsDirectory, parentSlug, slug, 'page.mdx')
		: path.join(docsDirectory, slug, 'page.mdx')
	const hasPage = fs.existsSync(pagePath)

	return {
		slug,
		title: item,
		href: hasPage ? `/docs/${parentSlug ? `${parentSlug}/${slug}` : slug}` : null,
	}
}
