import { TodoInput, Todo } from '../../db'

enum NoteProviders {
	Stashpad = 'stashpad',
	Obsidian = 'obsidian',
}

export abstract class NoteProvider {
	abstract create({ todo }: { todo: TodoInput }): Promise<string>
}

export default NoteProviders
