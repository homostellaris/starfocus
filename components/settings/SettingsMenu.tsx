import { menuController } from '@ionic/core/components'
import {
	IonBadge,
	IonButton,
	IonButtons,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonContent,
	IonFooter,
	IonHeader,
	IonIcon,
	IonMenu,
	IonToast,
	IonToolbar,
} from '@ionic/react'
import { duplicateOutline } from 'ionicons/icons'
import { useLiveQuery } from 'dexie-react-hooks'
import _ from 'lodash'
import { useState } from 'react'
import { starMudder } from '../common/order'
import Title from '../common/Title'
import { db } from '../db'
import ExportSettings from '../export/ExportSettings'
import ObsidianSettings from '../obsidian/ObsidianSettings'
import { ObsidianSettings as ObsidianSettingsType } from '../obsidian/useObsidian'
import { detectAllDuplicateClusters } from '../todos/duplicate/detector'
import { useDuplicateDetectorModal } from '../todos/duplicate/useDuplicateDetectorModal'
import useSettings from './useSettings'

export const SettingsMenu = () => {
	const storedObsidianSettings = useSettings('obsidian') as
		| ObsidianSettingsType
		| undefined

	const [localVault, setLocalVault] = useState<string | null>(null)
	const [localFolder, setLocalFolder] = useState<string | null>(null)
	const [showToast, setShowToast] = useState(false)
	const [presentDuplicateDetectorModal] = useDuplicateDetectorModal()

	const duplicateCount = useLiveQuery(
		async () => {
			const [todos, wayfinderEntries, dismissedPairsSetting] =
				await Promise.all([
					db.todos.toArray(),
					db.wayfinderOrder.toArray(),
					db.settings.get('#dismissedDuplicatePairs'),
				])
			const wayfinderIdentifiers = new Set(
				wayfinderEntries.map(entry => entry.todoId),
			)
			const dismissedPairs = new Set<string>(
				Array.isArray(dismissedPairsSetting?.value)
					? dismissedPairsSetting.value
					: [],
			)
			const clusters = detectAllDuplicateClusters(
				todos,
				wayfinderIdentifiers,
				dismissedPairs,
				0.75,
			)
			return clusters.length
		},
		[],
		0,
	)

	const vault = localVault ?? storedObsidianSettings?.vault ?? ''
	const folder = localFolder ?? storedObsidianSettings?.folder ?? ''

	const handleSave = async (event: React.FormEvent) => {
		event.preventDefault()
		await db.settings.put({
			key: 'obsidian',
			value: {
				vault: vault.trim(),
				folder: folder.trim(),
			},
		})
		setLocalVault(null)
		setLocalFolder(null)
		setShowToast(true)
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
				<form
					id="settings-form"
					onSubmit={handleSave}
					className="space-y-4"
				>
					<ExportSettings />
					<ObsidianSettings
						vault={vault}
						folder={folder}
						onVaultChange={setLocalVault}
						onFolderChange={setLocalFolder}
					/>
				</form>
				<IonCard className="m-0 border border-neutral-800 bg-neutral-900/60 backdrop-blur">
					<IonCardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<IonCardTitle className="text-base font-bold text-white">
								Duplicate Detector
							</IonCardTitle>
							{duplicateCount > 0 ? (
								<IonBadge
									color="warning"
									className="font-mono"
								>
									{duplicateCount}{' '}
									{duplicateCount === 1 ? 'cluster' : 'clusters'}
								</IonBadge>
							) : (
								<IonBadge
									color="success"
									className="font-mono"
								>
									0 duplicates
								</IonBadge>
							)}
						</div>
					</IonCardHeader>
					<IonCardContent className="space-y-3 pt-0">
						<p className="text-xs text-neutral-400">
							Scan and resolve similar or duplicate tasks across your
							galaxy.
						</p>
						<IonButton
							expand="block"
							fill="outline"
							color={duplicateCount > 0 ? 'warning' : 'primary'}
							size="small"
							onClick={() => {
								menuController.toggle('end')
								presentDuplicateDetectorModal()
							}}
							data-testid="open-duplicate-detector-btn"
						>
							<IonIcon
								slot="start"
								icon={duplicateOutline}
							/>
							<span>
								{duplicateCount > 0
									? 'Review Duplicates'
									: 'Scan Database'}
							</span>
						</IonButton>
					</IonCardContent>
				</IonCard>
				<IonButton
					id="clean-database"
					className="hidden"
					onClick={async () => {
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
					<IonButtons slot="secondary">
						<IonButton
							onClick={() => {
								menuController.toggle('end')
							}}
						>
							Close
						</IonButton>
					</IonButtons>
					<IonButtons slot="primary">
						<IonButton
							form="settings-form"
							type="submit"
							strong={true}
						>
							Save
						</IonButton>
					</IonButtons>
				</IonToolbar>
				<IonToast
					isOpen={showToast}
					message="Settings saved"
					duration={2000}
					onDidDismiss={() => setShowToast(false)}
				></IonToast>
			</IonFooter>
		</IonMenu>
	)
}
