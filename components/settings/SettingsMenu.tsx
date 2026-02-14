import { menuController } from '@ionic/core/components'
import {
	IonButton,
	IonButtons,
	IonContent,
	IonFooter,
	IonHeader,
	IonInput,
	IonMenu,
	IonSelect,
	IonSelectOption,
	IonToast,
	IonToolbar,
} from '@ionic/react'
import _ from 'lodash'
import { usePostHog } from 'posthog-js/react'
import { useRef, useState } from 'react'
import { starMudder } from '../common/order'
import Title from '../common/Title'
import { db } from '../db'
import ExportSettings from '../export/ExportSettings'
import useSettings from './useSettings'

export const SettingsMenu = () => {
	const posthog = usePostHog()
	const settings = useSettings()
	const [noteProvider, setNoteProvider] = useState<{
		type?: string
		apiKey?: string
		vault?: string
		folder?: string
	}>({})
	const noteProviderSettings = settings['#noteProvider']
	const prevNoteProviderRef = useRef(noteProviderSettings)
	// eslint-disable-next-line react-hooks/refs -- React-recommended "adjust state during render" pattern
	if (noteProviderSettings && prevNoteProviderRef.current !== noteProviderSettings) {
		// eslint-disable-next-line react-hooks/refs -- React-recommended "adjust state during render" pattern
		prevNoteProviderRef.current = noteProviderSettings
		setNoteProvider(noteProviderSettings)
	}

	return (
		<IonMenu
			contentId="main-content"
			id="settings-menu"
			side="end"
			type="push"
		>
			<IonHeader>
				<IonToolbar>
					<Title>Settings</Title>
				</IonToolbar>
			</IonHeader>
			<IonContent className="space-y-4 ion-padding">
				<ExportSettings />
				<form
					hidden
					id="settings"
					onSubmit={async event => {
						event.preventDefault()
						if (noteProvider.type === null) {
							setNoteProvider({})
							return db.settings.delete('#noteProvider')
						}
						await db.settings.put({
							key: '#noteProvider',
							value: noteProvider,
						})
						posthog.capture('settings_saved', {
							note_provider_type: noteProvider.type,
							has_vault: !!noteProvider.vault,
							has_folder: !!noteProvider.folder,
						})
					}}
				>
					<fieldset className="space-y-2">
						<IonSelect
							fill="outline"
							label="Note provider"
							labelPlacement="floating"
							onIonChange={event => {
								setNoteProvider(noteProvider => ({
									...noteProvider,
									type: event.detail.value,
								}))
							}}
							value={noteProvider.type || null} // defaultValue doesn't seem to work so have to make this a controlled component
						>
							<IonSelectOption value={null}>None</IonSelectOption>
							<IonSelectOption value="obsidian">Obsidian</IonSelectOption>
						</IonSelect>
						{noteProvider.type === 'obsidian' && (
							<>
								<IonInput
									fill="outline"
									helperText="The vault to use for new notes. If none is specified Obsidian will use the currently open vault."
									label="Vault"
									labelPlacement="floating"
									onIonChange={event => {
										setNoteProvider(noteProvider => ({
											...noteProvider,
											vault: event.detail.value?.toString(),
										}))
									}}
									placeholder="My Vault"
									value={noteProvider?.vault}
								></IonInput>
								<IonInput
									autocapitalize="sentences"
									fill="outline"
									helperText="The folder where the todo notes will be created. This is a path relative to the vault root. If no folder is specified the vault's default location for new notes will be used."
									label="Folder"
									labelPlacement="floating"
									onIonChange={event => {
										setNoteProvider(noteProvider => ({
											...noteProvider,
											folder: event.detail.value?.toString(),
										}))
									}}
									placeholder="My Todo Notes"
									value={noteProvider?.folder}
								></IonInput>
							</>
						)}
					</fieldset>
				</form>
				<IonButton
					id="clean-database"
					className="hidden"
					onClick={async () => {
						// Remove invalid notes from todos
						await db.todos.toCollection().modify(todo => {
							delete todo['uri']
							if (todo.note && !todo.note.uri) {
								delete todo.note
							}
						})

						// Remove empty todos
						await db.todos.where('title').equals('').delete()

						// Remove todos from important list that don't exist
						const important = await db.lists.get('#important')
						const todos = await db.todos.bulkGet(important?.order || [])
						const cleanedImportantOrder = _.zip(important!.order, todos)
							.filter(([_id, todo]) => todo !== undefined)
							.map(([id, _todo]) => id) as string[]
						await db.lists.update('#important', {
							order: cleanedImportantOrder,
						})

						// Migrate to new important order
						const wayfinderOrder = await db.wayfinderOrder
							.orderBy('order')
							.keys()
						if (wayfinderOrder.length === 0) {
							const oldOrder = await db.lists.get('#important')
							const orderKeys = starMudder(oldOrder?.order.length)
							const records = oldOrder?.order.map(todoId => ({
								todoId,
								order: orderKeys.shift(),
							}))
							db.wayfinderOrder.bulkAdd(records as any)
						}
					}}
				>
					Clean database
				</IonButton>
				<IonToast
					trigger="clean-database"
					message="Database cleaned"
					duration={2000}
				></IonToast>
			</IonContent>
			<IonFooter>
				<IonToolbar>
					<IonButtons slot="primary">
						<IonButton
							onClick={() => {
								menuController.toggle('end')
							}}
						>
							Close
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonFooter>
		</IonMenu>
	)
}
