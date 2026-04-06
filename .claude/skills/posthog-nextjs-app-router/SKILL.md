---
name: posthog-nextjs-app-router
description: "Set up PostHog analytics, event tracking, user identification, and error tracking in Next.js App Router applications. Configures the PostHog provider, adds capture calls for conversion and engagement events, identifies users on login/signup, and enables error tracking. Use when the user wants to add PostHog to a Next.js App Router project, integrate product analytics, track events, or set up session replay."
metadata:
  author: PostHog
  version: 1.4.1
---

# PostHog integration for Next.js App Router

Set up PostHog product analytics in a Next.js App Router project: event tracking, user identification, error tracking, and session replay.

## Workflow

Follow these steps in order:

1. `basic-integration-1.0-begin.md` — Analyze the project and create an event tracking plan ← **Start here**
2. `basic-integration-1.1-edit.md` — Implement the tracking plan across the codebase
3. `basic-integration-1.2-revise.md` — Review and refine the implementation
4. `basic-integration-1.3-conclude.md` — Final validation and wrap-up

**Validation checkpoint:** After step 2, run `bun typecheck` and `bun build` to verify no type or build errors were introduced.

## Reference files

- `EXAMPLE.md` — Target implementation pattern (PostHog context-mill Next.js App Router example)
- `next-js.md` — Next.js SDK documentation
- `identify-users.md` — User identification patterns and API

## Key principles

- **Environment variables**: Always use `process.env.NEXT_PUBLIC_POSTHOG_KEY` and `process.env.NEXT_PUBLIC_POSTHOG_HOST`. Never hardcode keys.
- **Minimal changes**: Add PostHog code alongside existing integrations. Don't replace or restructure existing code.
- **Match the example**: Follow the patterns in `EXAMPLE.md` as closely as possible.

## Framework guidelines

- Never use `useEffect()` for analytics capture — it causes double-fires and race conditions. Use event handlers or route change callbacks instead.
- The JavaScript SDK package is `posthog-js`. For server-side, use `posthog-node`.
- Run `bun typecheck` after changes to catch type errors early.

## Inline example: PostHog provider setup

```tsx
// app/providers.tsx
'use client'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false, // handled by route change tracking
    })
  }, [])
  return <PHProvider client={posthog}>{children}</PHProvider>
}
```

## Identifying users

Identify users during login and signup events. Refer to `identify-users.md` for the correct pattern. If both frontend and backend code exist, pass the client-side session and distinct ID using `X-POSTHOG-DISTINCT-ID` and `X-POSTHOG-SESSION-ID` headers to maintain correlation.

## Error tracking

Add PostHog error tracking to relevant files, particularly around critical user flows and API boundaries.
