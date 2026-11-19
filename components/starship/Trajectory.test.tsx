import { expect, test } from 'bun:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MoodProvider } from '../mood/MoodContext'
import Trajectory from './Trajectory'

function renderTrajectory(props: React.ComponentProps<typeof Trajectory>) {
	return renderToStaticMarkup(
		<MoodProvider>
			<Trajectory {...props} />
		</MoodProvider>,
	)
}

test('renders both vertical trajectory line layers with default chill gradient and position', () => {
	const html = renderTrajectory({
		className: 'absolute top-0 bottom-0 right-[27px] min-h-full',
		currentPosition: 120,
	})

	expect(html).toContain('h-full w-[2px]')
	expect(html).toContain('top-0 bottom-0 right-[27px] min-h-full')
	expect(html).toContain('shadow-cyan-500/80')
	expect(html).toContain('translate(0, calc(calc(100% - 140px) * -1))')
})

test('supports horizontal orientation', () => {
	const html = renderTrajectory({
		currentPosition: 50,
		orientation: 'horizontal',
	})

	expect(html).toContain('w-full h-[2px]')
	expect(html).not.toContain('h-full w-[2px]')
})

test('positions active trail for long scrolling list offsets', () => {
	const html = renderTrajectory({
		currentPosition: 2400,
	})

	expect(html).toContain('translate(0, calc(calc(100% - 2420px) * -1))')
})

test('defaults currentPosition to zero when omitted', () => {
	const html = renderTrajectory({
		currentPosition: undefined as unknown as number,
	})

	expect(html).toContain('translate(0, calc(calc(100% - 20px) * -1))')
})

test('handles negative currentPosition without throwing', () => {
	const html = renderTrajectory({
		currentPosition: -10,
	})

	expect(html).toContain('translate(0, calc(calc(100% - 10px) * -1))')
})
