import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import _ from 'lodash'

export default function useSettings(key?: string): Record<string, any> | any {
	const settings = useLiveQuery(() => db.settings.toArray(), [], [])
	const settingsByKey = _(settings)
		.keyBy('key')
		.mapValues(setting => setting.value)
		.value()
	return key ? settingsByKey[key] : settingsByKey
}
