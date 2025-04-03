import { NoteProvider } from '.'
import { TodoInput, Todo } from '../../db'

export default class Obsidian extends NoteProvider {
	vault?: string
	folder?: string

	constructor(vault?: string, folder?: string) {
		super()
		this.vault = vault
		this.folder = folder
	}

	create({ todo }) {
		open(this.getCreateNoteUri(todo))
		return Promise.resolve(this.getOpenNoteUri(todo))
	}

	getCreateNoteUri(todo: TodoInput) {
		let createNoteUri = 'obsidian://new?'
		const file = this.folder
			? encodeURIComponent(this.folder) + '%2F' + encodeURIComponent(todo.title)
			: encodeURIComponent(todo.title)
		createNoteUri += 'file=' + file
		if (this.vault) {
			createNoteUri += '&vault=' + encodeURIComponent(this.vault)
		}
		if (todo.noteInitialContent) {
			createNoteUri += '&content=' + encodeURIComponent(todo.noteInitialContent)
		}
		return createNoteUri
	}

	getOpenNoteUri(todo: Todo) {
		let openNoteUri = 'obsidian://open?'
		const file = this.folder
			? encodeURIComponent(this.folder) + '%2F' + encodeURIComponent(todo.title)
			: encodeURIComponent(todo.title)
		openNoteUri += 'file=' + file
		if (this.vault) {
			openNoteUri += '&vault=' + encodeURIComponent(this.vault)
		}
		return openNoteUri.toString()
	}
}
