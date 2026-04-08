'use client'

import { createContext, PropsWithChildren, useContext, useState } from 'react'

export type OnboardingStep = 'welcome' | 'star-roles' | 'first-todo' | null

type OnboardingContextValue = {
	step: OnboardingStep
	startOnboarding: () => void
	advanceStep: () => void
	skipOnboarding: () => void
}

const ONBOARDING_STEP_KEY = 'onboarding-step'

function readInitialStep(): OnboardingStep {
	if (typeof window === 'undefined') return 'welcome'
	const stored = localStorage.getItem(ONBOARDING_STEP_KEY)
	if (stored === 'welcome' || stored === 'star-roles' || stored === 'first-todo') return stored
	if (stored === null) return 'welcome'
	return null
}

const OnboardingContext = createContext<OnboardingContextValue>({
	step: null,
	startOnboarding: () => {},
	advanceStep: () => {},
	skipOnboarding: () => {},
})

export function OnboardingProvider({ children }: PropsWithChildren) {
	const [step, setStep] = useState<OnboardingStep>(readInitialStep)

	function saveStep(newStep: OnboardingStep) {
		if (newStep === null) {
			localStorage.setItem(ONBOARDING_STEP_KEY, 'completed')
		} else {
			localStorage.setItem(ONBOARDING_STEP_KEY, newStep)
		}
		setStep(newStep)
	}

	function startOnboarding() {
		saveStep('welcome')
	}

	function advanceStep() {
		if (step === 'welcome') saveStep('star-roles')
		else if (step === 'star-roles') saveStep('first-todo')
		else if (step === 'first-todo') saveStep(null)
	}

	function skipOnboarding() {
		saveStep(null)
	}

	return (
		<OnboardingContext.Provider value={{ step, startOnboarding, advanceStep, skipOnboarding }}>
			{children}
		</OnboardingContext.Provider>
	)
}

export function useOnboarding() {
	return useContext(OnboardingContext)
}
