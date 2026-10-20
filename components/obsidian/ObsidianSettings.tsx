import {
	IonIcon,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
} from '@ionic/react'
import { openSharp } from 'ionicons/icons'

export interface ObsidianSettingsProps {
	vault: string
	folder: string
	onVaultChange: (vault: string) => void
	onFolderChange: (folder: string) => void
}

export default function ObsidianSettingsComponent({
	vault,
	folder,
	onVaultChange,
	onFolderChange,
}: ObsidianSettingsProps) {
	return (
		<IonList>
			<IonListHeader>
				<IonLabel>Obsidian Deep Linking</IonLabel>
			</IonListHeader>

			<IonItem lines="none">
				<IonIcon
					icon={openSharp}
					slot="start"
					color="primary"
				/>
				<IonLabel className="ion-text-wrap">
					<h3>Obsidian Vault</h3>
					<p>
						Connect directly to your Obsidian vault via URI deep linking. Notes
						match your exported markdown filenames.
					</p>
				</IonLabel>
			</IonItem>

			<div className="px-4 pt-3 pb-2 flex flex-col gap-4">
				<IonInput
					fill="outline"
					label="Vault name"
					labelPlacement="floating"
					placeholder="e.g. reality-sculptor"
					helperText="The name of your Obsidian vault"
					value={vault}
					onIonInput={event => {
						onVaultChange(event.detail.value ?? '')
					}}
				/>

				<IonInput
					fill="outline"
					label="Folder (optional)"
					labelPlacement="floating"
					placeholder="e.g. todos"
					helperText="Subfolder inside your vault where todo files live"
					value={folder}
					onIonInput={event => {
						onFolderChange(event.detail.value ?? '')
					}}
				/>
			</div>
		</IonList>
	)
}
