This repo was originally created from [nextjs-tailwind-ionic-capacitor-starter](https://github.com/mlynch/nextjs-tailwind-ionic-capacitor-starter).

# Stack overview

1. NextJS produces a web bundle with the static export.
2. GitHub Actions deploys the web bundle to Vercel which serves them at [starfocus.app](https://starfocus.app) along with a manifest for PWA support.
3. Capacitor syncs the web bundle to the ios and android folders where they can be packaged and deployed as appropriate.

# Routing overview

1. NextJS routing occurs between the `/` route and the `[...all]` route. The 'all' routes are statically generated using `generateStaticParams`
