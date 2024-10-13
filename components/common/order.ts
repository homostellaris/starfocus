import mudder from 'mudder'

function order(...args: MudderParameters) {
	return starMudder(...args)[0]
}

/**
 * Its more elegant if the function doesn't care about returning an index that is out of bounds as this results in a
 * number which can be used by the caller more nicely in subsequent operations.
 *
 * For example the index can be used to lookup an element in an array and if it does not exist then undefined will be
 * returned which is accepted by mudder. Overall it avoid lets of horrible conditional code handling falsey values.
 */
export function calculateReorderIndices(
	from: number,
	to: number,
): [number, number] {
	const direction = from > to ? 'UP' : 'DOWN'
	const modifier = direction === 'UP' ? -1 : 0
	const startIndex = to + modifier
	const endIndex = to + 1 + modifier
	return [startIndex, endIndex]
}

export function starMudder(numStrings?: number): string[]
export function starMudder(
	start?: string,
	end?: string,
	numStrings?: number,
	base?: number,
	numDivisions?: number,
	placesToKeep?: number,
): string[]
export function starMudder(
	startOrNumStrings?: string | number,
	end?: string,
	numStrings?: number,
	base?: number,
	numDivisions?: number,
	placesToKeep?: number,
): string[] {
	return mudder.alphabet.mudder(
		startOrNumStrings,
		end,
		numStrings,
		base,
		numDivisions,
		placesToKeep,
	)
}

type MudderParameters = Parameters<typeof starMudder>

export default order
