import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
	appId: 'app.starfocus',
	appName: 'Starfocus',
	android: {
		adjustMarginsForEdgeToEdge: 'auto',
	},
	cordova: {},
	plugins: {
		SplashScreen: {
			launchShowDuration: 0,
		},
		StatusBar: {
			overlaysWebView: false,
		},
	},
	webDir: 'out',
}

export default config
