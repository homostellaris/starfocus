import { IonTitle } from '@ionic/react'
import { ComponentProps, PropsWithChildren } from 'react'

export default function Title({
	children,
}: PropsWithChildren<ComponentProps<typeof IonTitle>>) {
	return (
		<IonTitle
			className="font-display [font-palette:--redshift] text-3xl"
			slot="start"
		>
			<h1 className="inline m-0 p-0 text-inherit font-inherit text-xl sm:text-2xl font-bold">
				{children}
			</h1>
		</IonTitle>
	)
}
