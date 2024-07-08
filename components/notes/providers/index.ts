enum NoteProviders {
	Stashpad = 'stashpad',
	Obsidian = 'obsidian',
}

export abstract class NoteProvider {
	abstract create({ content }): Promise<string>
}

export default NoteProviders
