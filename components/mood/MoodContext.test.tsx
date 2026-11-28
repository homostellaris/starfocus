import { expect, test } from 'bun:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MoodProvider, useMood } from './MoodContext'

function MoodProbe() {
	const { mode, currentTrack } = useMood()
	return (
		<div
			data-mode={mode}
			data-track={currentTrack ?? ''}
		/>
	)
}

test('provides chill mode and initial track by default', () => {
	const html = renderToStaticMarkup(
		<MoodProvider>
			<MoodProbe />
		</MoodProvider>,
	)

	expect(html).toContain('data-mode="chill"')
	expect(html).toContain('/music/chill/Melodysheep - Water Worlds.mp3')
})

test('accepts an explicit initialMode', () => {
	const html = renderToStaticMarkup(
		<MoodProvider initialMode="hype">
			<MoodProbe />
		</MoodProvider>,
	)

	expect(html).toContain('data-mode="hype"')
	expect(html).toContain('music/hype/Karl Casey - Black Lotus.mp3')
})

test('throws when useMood is called outside MoodProvider', () => {
	expect(() => renderToStaticMarkup(<MoodProbe />)).toThrow(
		'useMood must be used within a MoodProvider',
	)
})

test('uses root-relative music paths so playback works from nested routes', () => {
	for (const mode of ['chill', 'hype'] as const) {
		const html = renderToStaticMarkup(
			<MoodProvider initialMode={mode}>
				<MoodProbe />
			</MoodProvider>,
		)

		expect(html).toContain(`data-track="/music/${mode}/`)
	}
})
