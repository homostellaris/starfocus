import { NoteProvider } from '.'

export default class Stashpad extends NoteProvider {
	apiKey: string

	constructor(apiKey) {
		super()
		this.apiKey = apiKey
	}

	create({ content }) {
		return fetch('https://api.stashpad.live/v1/docs', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': this.apiKey,
			},
			body: JSON.stringify({
				content,
				access: 'public',
				permission: 'write',
			}),
		})
			.then(response => response.json())
			.then(({ uri }) => uri)
	}
}
