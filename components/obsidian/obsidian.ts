import { generateFilename } from '../export/markdown'

export interface ObsidianNoteTarget {
	title?: string
	id?: string
}

export interface ObsidianUriOptions {
	vault: string
	folder?: string
	todo: ObsidianNoteTarget
	content?: string
}

export function formatObsidianFilePath(
	todo: ObsidianNoteTarget,
	folder?: string,
): string {
	const filenameWithoutExtension = generateFilename(todo).replace(/\.md$/, '')
	const trimmedFolder = folder?.trim().replace(/^\/+|\/+$/g, '')

	if (trimmedFolder) {
		return `${trimmedFolder}/${filenameWithoutExtension}`
	}

	return filenameWithoutExtension
}

export function getObsidianOpenUri(
	options: Omit<ObsidianUriOptions, 'content'>,
): string {
	const filePath = formatObsidianFilePath(options.todo, options.folder)
	const encodedVault = encodeURIComponent(options.vault.trim())
	const encodedFilePath = encodeURIComponent(filePath)

	return `obsidian://open?vault=${encodedVault}&file=${encodedFilePath}`
}

export function getObsidianNewUri(options: ObsidianUriOptions): string {
	const filePath = formatObsidianFilePath(options.todo, options.folder)
	const encodedVault = encodeURIComponent(options.vault.trim())
	const encodedFilePath = encodeURIComponent(filePath)

	let uri = `obsidian://new?vault=${encodedVault}&file=${encodedFilePath}`

	if (options.content) {
		uri += `&content=${encodeURIComponent(options.content)}`
	}

	return uri
}

export function openObsidianUri(uri: string): void {
	if (typeof window !== 'undefined') {
		window.open(uri, '_self')
	}
}
