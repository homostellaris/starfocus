I tried enabling SSR but the build failed with

> window is not defined

After removing some references to `window` in my own code the new error was

> Invariant failed

I couldn't figure out how to debug this but I believe its because IonicRouter uses React Router's BrowserRouter under the hood which does not support [server-side rendering](https://v5.reactrouter.com/web/guides/server-rendering) which is effectively what the build-time pre-rendering is attempting to do.

The implication is that proper static rendering is not possible for Ionic which prohibits rendering of Ionic components on the landing page which I'd hoped to do.
