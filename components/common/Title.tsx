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
			{children}
		</IonTitle>
	)
}
