import { TodoInput } from '../../db'

enum NoteProviders {
	Obsidian = 'obsidian',
}

export abstract class NoteProvider {
	abstract create({ todo }: { todo: TodoInput }): Promise<string>
}

export default NoteProviders
