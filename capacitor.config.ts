import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
	appId: 'app.starfocus',
	appName: 'Starfocus',
	bundledWebRuntime: false,
	webDir: 'out',
	plugins: {
		SplashScreen: {
			launchShowDuration: 0,
		},
	},
	cordova: {},
}

export default config
