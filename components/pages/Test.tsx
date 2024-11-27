import React from 'react'
import {
	IonContent,
	IonHeader,
	IonMenu,
	IonSplitPane,
	IonTitle,
	IonToolbar,
} from '@ionic/react'

function Example() {
	return (
		<IonSplitPane
			when="lg"
			contentId="main"
		>
			<IonMenu contentId="main">
				<IonHeader>
					<IonToolbar color="tertiary">
						<IonTitle>Menu</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding">Menu Content</IonContent>
			</IonMenu>

			<div
				className="ion-page"
				id="main"
			>
				<IonHeader>
					<IonToolbar>
						<IonTitle>Main View</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding">Main View Content</IonContent>
			</div>

			<IonMenu
				contentId="main"
				side="end"
			>
				<IonHeader>
					<IonToolbar color="tertiary">
						<IonTitle>Menu</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding">Menu Content</IonContent>
			</IonMenu>
		</IonSplitPane>
	)
}
export default Example
