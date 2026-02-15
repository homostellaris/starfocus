import matter from 'gray-matter'

export interface FileOperations {
	readFile(filename: string): Promise<string | null>
	writeFile(filename: string, content: string): Promise<boolean>
	deleteFile(filename: string): Promise<boolean>
	listFiles(): Promise<string[]>
}

export interface TodoFile {
	todoId: string
	filename: string
	content: string
	frontMatterData: Record<string, unknown>
}

export interface UpsertResult {
	created: number
	updated: number
	deleted: number
	failed: number
}

export async function upsertTodoFiles(
	currentTodos: TodoFile[],
	ops: FileOperations,
): Promise<UpsertResult> {
	let created = 0
	let updated = 0
	let deleted = 0
	let failed = 0

	const expectedFilenames = new Set(currentTodos.map(t => t.filename))
	const currentTodoIds = new Set(currentTodos.map(t => t.todoId))

	const diskFiles = await ops.listFiles()

	const diskFilesByTodoId = new Map<
		string,
		{ filename: string; body: string }
	>()
	for (const filename of diskFiles) {
		if (expectedFilenames.has(filename)) continue

		const content = await ops.readFile(filename)
		if (!content) continue

		try {
			const parsed = matter(content)
			const id = parsed.data?.id
			if (typeof id === 'string') {
				diskFilesByTodoId.set(id, { filename, body: parsed.content })
			}
		} catch {
			// Not a valid front matter file — skip
		}
	}

	for (const todo of currentTodos) {
		const existingContent = await ops.readFile(todo.filename)

		if (existingContent !== null) {
			const { content: body } = matter(existingContent)
			const updatedContent = matter.stringify(body, todo.frontMatterData)
			const success = await ops.writeFile(todo.filename, updatedContent)
			if (success) {
				updated++
			} else {
				failed++
			}
			continue
		}

		const renamedFile = diskFilesByTodoId.get(todo.todoId)
		if (renamedFile) {
			const deleteSuccess = await ops.deleteFile(renamedFile.filename)
			if (!deleteSuccess) {
				failed++
			}
			const content = matter.stringify(renamedFile.body, todo.frontMatterData)
			const success = await ops.writeFile(todo.filename, content)
			if (success) {
				created++
			} else {
				failed++
			}
			continue
		}

		const success = await ops.writeFile(todo.filename, todo.content)
		if (success) {
			created++
		} else {
			failed++
		}
	}

	const diskEntries = Array.from(diskFilesByTodoId.entries())
	for (const [todoId, { filename }] of diskEntries) {
		if (!currentTodoIds.has(todoId)) {
			const success = await ops.deleteFile(filename)
			if (success) {
				deleted++
			} else {
				failed++
			}
		}
	}

	return { created, updated, deleted, failed }
}
