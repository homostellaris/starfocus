1. Open Android Studio
2. Update version
   1. In `package.json` set a new semantic version
   2. In `build.gradle`
      1. Increment `versionCode` to next integer
      2. Set `versionName` to same as `package.json`
3. Sync latest with `bun run android:dev`
4. Build -> Generated Signed App Bundle or APK...
5. Open the [Play Console bundle explorer](https://play.google.com/console/u/0/developers/6563141138271527895/app/4972186936998342481/bundle-explorer-selector)
6.
