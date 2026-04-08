import {
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
	IonModal,
	IonPage,
	IonTitle,
	IonToolbar,
} from '@ionic/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { sparklesSharp, starHalfSharp, checkmarkCircleSharp } from 'ionicons/icons'
import { useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import { db } from '../db'
import { useOnboarding } from './OnboardingContext'

export function Onboarding() {
	const { step, advanceStep, skipOnboarding } = useOnboarding()
	const history = useHistory()

	const starRoleCount = useLiveQuery(() => db.starRoles.count()) ?? 0
	const todoCount = useLiveQuery(() => db.todos.count()) ?? 0

	useEffect(() => {
		if (step === 'star-roles') {
			history.replace('/constellation')
		} else if (step === 'first-todo') {
			history.replace('/home')
		}
	}, [step, history])

	if (step === null) return null

	if (step === 'welcome') {
		return <WelcomeModal onStart={advanceStep} onSkip={skipOnboarding} />
	}

	if (step === 'star-roles') {
		return (
			<GuidancePanel
				icon={starHalfSharp}
				title="Create your star roles"
				continueLabel={starRoleCount > 0 ? `Continue (${starRoleCount} created)` : undefined}
				onContinue={starRoleCount > 0 ? advanceStep : undefined}
				onSkip={skipOnboarding}
			>
				<p>
					Star roles are the key areas of your life you want to focus on — things like Health,
					Career, or Family.
				</p>
				<p className="mt-2">
					For each role, add a <strong>description</strong>: write your vision for this role, why
					it matters to you, and what mastery looks like. This becomes the north star for all the
					tasks you create here.
				</p>
				<p className="mt-2 text-sm text-gray-400">
					Start with one to three roles. You can always add more later.
				</p>
				<p className="mt-2 text-sm text-gray-400">
					Tap the <strong>+</strong> button in the bottom-right corner to create a star role.
				</p>
			</GuidancePanel>
		)
	}

	return (
		<GuidancePanel
			icon={sparklesSharp}
			title="Create your first task"
			continueLabel={todoCount > 0 ? 'Finish' : undefined}
			onContinue={todoCount > 0 ? advanceStep : undefined}
			onSkip={skipOnboarding}
		>
			<p>Now create a task for one of your star roles.</p>
			<p className="mt-2">
				When creating a task you can assign <strong>star points</strong> — a Fibonacci-style
				estimate (1, 2, 3, 5, 8, 13) of how impactful the task is. Higher points = more impact.
			</p>
			<p className="mt-2">
				You also choose where it lives:
			</p>
			<ul className="mt-1 ml-4 list-disc text-sm">
				<li><strong>Asteroid Field</strong> — urgent tasks demanding immediate attention</li>
				<li><strong>Wayfinder</strong> — mission-critical objectives (requires star points)</li>
				<li><strong>Database</strong> — future tasks to consider later</li>
			</ul>
			<p className="mt-2 text-sm text-gray-400">
				Tap the <strong>+</strong> button in the bottom-right corner to create a task.
			</p>
		</GuidancePanel>
	)
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

function GuidancePanel({
	icon,
	title,
	children,
	continueLabel,
	onContinue,
	onSkip,
}: {
	icon: string
	title: string
	children: React.ReactNode
	continueLabel?: string
	onContinue?: () => void
	onSkip: () => void
}) {
	return (
		<div
			style={{
				position: 'fixed',
				bottom: 0,
				left: 0,
				right: 0,
				zIndex: 1000,
				padding: '0 16px 16px',
			}}
		>
			<IonCard className="m-0 shadow-2xl">
				<IonCardHeader>
					<IonCardTitle className="flex items-center gap-2 text-base">
						<IonIcon icon={icon} />
						{title}
					</IonCardTitle>
				</IonCardHeader>
				<IonCardContent className="text-sm">{children}</IonCardContent>
				<div className="flex justify-between items-center px-4 pb-4">
					<IonButton
						fill="clear"
						size="small"
						color="medium"
						onClick={onSkip}
					>
						Skip setup
					</IonButton>
					{onContinue && continueLabel && (
						<IonButton
							fill="solid"
							color="success"
							size="small"
							onClick={onContinue}
						>
							<IonIcon
								icon={checkmarkCircleSharp}
								slot="start"
							/>
							{continueLabel}
						</IonButton>
					)}
				</div>
			</IonCard>
		</div>
	)
}
