'use client'
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react'
import { StatusBar, Style } from '@capacitor/status-bar'
import { IonReactRouter } from '@ionic/react-router'
import { Redirect, Route } from 'react-router-dom'
import Home from './pages/Home'
import Constellation from './pages/Constellation'
import ErrorBoundary from './ErrorBoundary'
import Test from './pages/Test'
import { db } from './db'
import { useEffect } from 'react'
import todoRepository from './todos/repository'

setupIonicReact({})

window
	.matchMedia('(prefers-color-scheme: dark)')
	.addEventListener('change', async status => {
		try {
			await StatusBar.setStyle({
				style: status.matches ? Style.Dark : Style.Light,
			})
		} catch {}
	})

const App = () => {
	useEffect(() => {
		window.db = db
		window.todoRepository = todoRepository
	}, [])
	return (
		<IonApp>
			<IonReactRouter>
				<IonRouterOutlet id="main">
					<ErrorBoundary>
						<Route
							exact
							path="/"
						>
							<Redirect to="/home" />
						</Route>
						<Route
							path="/constellation"
							render={() => <Constellation />}
						/>
						<Route
							path="/home"
							render={() => <Home />}
						/>
						<Route
							path="/test"
							render={() => <Test />}
						/>
						<Route
							render={params => {
								console.warn('Rendering fallback route', params)
								return <p>Fallback route</p>
							}}
						/>
					</ErrorBoundary>
				</IonRouterOutlet>
			</IonReactRouter>
		</IonApp>
	)
}

export default App
