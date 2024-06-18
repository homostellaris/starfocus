import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
	appId: 'app.starfocus',
	appName: 'Starfocus',
	bundledWebRuntime: false,
	cordova: {},
	plugins: {
		SplashScreen: {
			launchShowDuration: 0,
		},
	},
	webDir: 'out',
}

export default config
