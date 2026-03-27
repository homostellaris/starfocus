import { IonButton, IonIcon, IonInput, IonText } from '@ionic/react'
import { useObservable } from 'dexie-react-hooks'
import { cloudUploadSharp, downloadSharp } from 'ionicons/icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import { db, StarRole, StarRoleGroup } from '../db'
import useSettings from '../settings/useSettings'
import { ConstellationCanvas } from './ConstellationCanvas'
import { constellationCode } from './constellationCode'
import { generateConstellation } from './generateConstellation'
import { seedFromString } from './seedFromString'

interface Props {
	starRoles: StarRole[]
	starRoleGroups: StarRoleGroup[]
}

export function ConstellationSigil({ starRoles, starRoleGroups }: Props) {
	const user = useObservable(db.cloud.currentUser)
	const isLoggedIn = user?.isLoggedIn
	const cloudEmail = isLoggedIn ? (user?.email ?? undefined) : undefined

	const storedEmail = useSettings('constellationEmail') as string | undefined
	const [inputEmail, setInputEmail] = useState('')
	const [ngcCode, setNgcCode] = useState<string>()
	const svgRef = useRef<SVGSVGElement>(null)

	// Resolved email: cloud account > previously stored > currently typed
	const email = cloudEmail ?? storedEmail ?? (inputEmail || undefined)

	// Persist a newly typed email so it survives page reloads
	useEffect(() => {
		if (inputEmail && !cloudEmail && !storedEmail) {
			db.settings.put({ key: 'constellationEmail', value: inputEmail })
		}
	}, [inputEmail, cloudEmail, storedEmail])

	const seed = seedFromString(email ?? 'starfocus-demo')
	const data = useMemo(
		() => generateConstellation(seed, starRoles, starRoleGroups),
		[seed, starRoles, starRoleGroups],
	)

	useEffect(() => {
		if (!email) return
		let cancelled = false
		constellationCode(
			email,
			starRoles.map(r => r.id),
		).then(code => {
			if (!cancelled) setNgcCode(code)
		})
		return () => {
			cancelled = true
		}
	}, [email, starRoles])

	function handleSyncClick() {
		// Persist the email before triggering login so the modal can pre-fill it
		if (email) {
			db.settings.put({ key: 'constellationEmail', value: email })
		}
		db.cloud.login()
	}

	function handleDownload() {
		const svg = svgRef.current
		if (!svg) return
		const serializer = new XMLSerializer()
		const svgStr = serializer.serializeToString(svg)
		const blob = new Blob([svgStr], { type: 'image/svg+xml' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `constellation-${ngcCode ?? 'starfocus'}.svg`
		a.click()
		URL.revokeObjectURL(url)
	}

	return (
		<div className="flex flex-col items-center gap-4 py-6 px-4">
			<ConstellationCanvas
				ref={svgRef}
				data={data}
				size={280}
			/>

			<div className="flex flex-col items-center gap-1">
				{email && ngcCode ? (
					<p className="font-mono text-sm tracking-widest opacity-60">
						{ngcCode}
					</p>
				) : (
					<p className="font-mono text-xs tracking-widest opacity-30">
						YOUR CONSTELLATION
					</p>
				)}
				{!email && (
					<IonText
						color="medium"
						className="text-xs"
					>
						Enter your email below to personalise it
					</IonText>
				)}
			</div>

			{!email && (
				<div className="w-full max-w-xs space-y-1">
					<IonInput
						fill="outline"
						label="Email"
						labelPlacement="floating"
						placeholder="you@example.com"
						type="email"
						value={inputEmail}
						onIonChange={e => setInputEmail((e.detail.value as string) ?? '')}
					/>
					<p className="text-xs opacity-40 text-center px-2">
						Hashed locally to generate your constellation. Never sent anywhere.
					</p>
				</div>
			)}

			<div className="flex gap-2">
				{!isLoggedIn && email && (
					<IonButton
						fill="outline"
						size="small"
						onClick={handleSyncClick}
					>
						<IonIcon
							icon={cloudUploadSharp}
							slot="start"
						/>
						Sync across devices
					</IonButton>
				)}
				{email && (
					<IonButton
						fill="outline"
						size="small"
						onClick={handleDownload}
					>
						<IonIcon
							icon={downloadSharp}
							slot="start"
						/>
						Save
					</IonButton>
				)}
			</div>
		</div>
	)
}
