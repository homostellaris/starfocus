import { NoteProvider } from '.'
import { TodoInput } from '../../db'

export default class Stashpad extends NoteProvider {
	apiKey: string

	constructor(apiKey) {
		super()
		this.apiKey = apiKey
	}

	create({ todo }: { todo: TodoInput }) {
		return fetch('https://api.stashpad.live/v1/docs', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': this.apiKey,
			},
			body: JSON.stringify({
				content: todo.noteInitialContent,
				access: 'public',
				permission: 'write',
			}),
		})
			.then(response => response.json())
			.then(responseBody => {
				if (!responseBody.uri) {
					throw new Error(
						`Failed to create note: ${JSON.stringify(responseBody, null, 2)}`,
					)
				}
				return responseBody.uri
			})
	}
}
