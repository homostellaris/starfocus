import { IonCol, IonGrid, IonIcon, IonRow } from '@ionic/react'
import * as icons from 'ionicons/icons'
import { useMemo } from 'react'

export default function Icons({
	query,
	onClick,
}: {
	query: string
	onClick: (icon: { name: string; value: string }) => void
}) {
	const matchingIcons = useMemo(() => {
		return Object.entries(icons).filter(([name]) =>
			name.includes('Sharp') && (query ? name.includes(query) : true),
		)
	}, [query])

	return (
		<div className="relative p-2 border rounded">
			<a
				className="absolute p-1 space-x-1 text-xs bg-white right-2 -top-3"
				href="https://ionic.io/ionicons"
				target="_blank"
			>
				<span>View all icons</span>
				<IonIcon icon={icons.openSharp} />
			</a>
			<IonGrid id="icons">
				<IonRow>
					{matchingIcons.length ? (
						matchingIcons.map(([name, value]) => (
							<IonCol
								key={name}
								size="1"
							>
								<IonIcon
									className="cursor-pointer"
									onClick={() => onClick({ name, value })}
									icon={value}
								></IonIcon>
							</IonCol>
						))
					) : (
						<p className="w-full m-2 text-center text-gray-300">
							No matching icons
						</p>
					)}
				</IonRow>
			</IonGrid>
		</div>
	)
}

export function getIonIcon(name) {
	return icons[name]
}
