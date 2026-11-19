import { expect, test } from 'bun:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MoodProvider } from '../mood/MoodContext'
import { TodoContext } from '../todos/TodoContext'
import { Journey } from './Journey'

function renderJourney() {
	const commonAncestor = { current: null }

	return renderToStaticMarkup(
		<MoodProvider>
			<TodoContext.Provider
				value={{
					nextTodo: {
						position: [null, () => null],
					},
					selectedTodo: [null, () => null],
				}}
			>
				<Journey commonAncestor={commonAncestor} />
			</TodoContext.Provider>
		</MoodProvider>,
	)
}

test('renders journey wrapper with min-h-full and trajectory stretched top to bottom', () => {
	const html = renderJourney()

	expect(html).toContain('relative h-full min-h-full min-w-[56px]')
	expect(html).toContain('absolute top-0 bottom-0 right-[27px] z-0 min-h-full')
	expect(html).toContain('id="starship"')
})
