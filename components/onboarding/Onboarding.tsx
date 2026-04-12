import {
	IonButton,
	IonButtons,
	IonContent,
	IonFooter,
	IonHeader,
	IonIcon,
	IonModal,
	IonPage,
	IonTitle,
	IonToolbar,
} from '@ionic/react'
import { sparklesSharp } from 'ionicons/icons'
import { useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import { useOnboarding } from './OnboardingContext'

export function Onboarding() {
	const { step, advanceStep, skipOnboarding } = useOnboarding()
	const history = useHistory()

	useEffect(() => {
		if (step === 'star-roles') {
			history.replace('/constellation')
		} else if (step === 'first-todo') {
			history.replace('/home')
		}
	}, [step, history])

	if (step !== 'welcome') return null

	return <WelcomeModal onStart={advanceStep} onSkip={skipOnboarding} />
}

function WelcomeModal({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
	const modal = useRef<HTMLIonModalElement>(null)

	return (
		<IonModal
			ref={modal}
			isOpen={true}
			backdropDismiss={false}
		>
			<IonPage>
				<IonHeader>
					<IonToolbar>
						<IonTitle slot="start">Welcome to Starfocus</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding">
					<div className="flex flex-col gap-4 max-w-lg mx-auto py-4">
						<div className="flex justify-center">
							<IonIcon
								icon={sparklesSharp}
								className="text-6xl"
								color="warning"
							/>
						</div>
						<p className="text-lg">
							Starfocus helps you stay aligned with what matters most across every area of your life.
						</p>
						<p>
							It&apos;s built around <strong>star roles</strong> — the key domains you care about,
							like Health, Career, or Creative Work. Each role gets a vision: what does mastery look
							like for you? What would change if you truly showed up here?
						</p>
						<p>
							From there, you create <strong>tasks</strong> tied to those roles and assign them{' '}
							<strong>star points</strong> to reflect their impact. The app helps you focus on
							high-leverage work, not just busy work.
						</p>
						<p>This short setup will walk you through:</p>
						<ol className="list-decimal ml-5 space-y-1">
							<li>Creating one or more star roles with a vision description</li>
							<li>Adding your first task for a star role</li>
						</ol>
						<p className="text-sm text-gray-400">It only takes a few minutes.</p>
					</div>
				</IonContent>
				<IonFooter>
					<IonToolbar>
						<IonButtons slot="secondary">
							<IonButton
								fill="clear"
								onClick={onSkip}
							>
								Skip
							</IonButton>
						</IonButtons>
						<IonButtons slot="primary">
							<IonButton
								fill="solid"
								color="success"
								strong={true}
								onClick={onStart}
							>
								Get started
							</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonFooter>
			</IonPage>
		</IonModal>
	)
}
