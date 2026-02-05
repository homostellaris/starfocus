# PostHog post-wizard report

The wizard has completed a deep integration of your Starfocus project. PostHog was already initialized in your `instrumentation-client.ts` file using the recommended Next.js 15+ approach with cookieless mode and EU hosting. We've extended the tracking coverage by adding 12 new events across key user journeys including onboarding, authentication, feature adoption, and engagement metrics.

## Events Added

| Event Name | Description | File |
|------------|-------------|------|
| `cta_clicked` | User clicked the 'Try it' call-to-action button on the landing page - top of conversion funnel | `app/page.tsx` |
| `star_role_group_edited` | User edited an existing star role group (name change) | `components/starRoleGroups/edit/useEditStarRoleGroupModal.ts` |
| `star_role_group_deleted` | User deleted a star role group | `components/starRoleGroups/StarRoleGroupActionSheet.tsx` |
| `markdown_export_enabled` | User enabled continuous markdown export sync | `components/export/useMarkdownExport.ts` |
| `markdown_export_disabled` | User disabled continuous markdown export sync | `components/export/useMarkdownExport.ts` |
| `markdown_exported` | User performed a one-time markdown export | `components/export/useMarkdownExport.ts` |
| `music_played` | User started playing background music | `components/mood/index.tsx` |
| `music_mode_changed` | User changed music mode between chill and hype | `components/mood/index.tsx` |
| `login_started` | User opened the login modal to begin authentication | `components/auth/dexie.tsx` |
| `otp_requested` | User submitted email and requested OTP code | `components/auth/dexie.tsx` |
| `user_logged_in` | User successfully completed login/sync process | `app/identify.ts` |
| `constellation_viewed` | User navigated to the constellation (star roles) page - key feature adoption | `components/pages/Constellation.tsx` |

## Environment Variables

The PostHog API key has been added to `.env.local`:
- `NEXT_PUBLIC_POSTHOG_KEY` - Your PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST` - EU PostHog instance (https://eu.i.posthog.com)

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://eu.posthog.com/project/117050/dashboard/513825) - Core analytics dashboard tracking key user behaviors and conversion funnels

### Insights
- [Onboarding Conversion Funnel](https://eu.posthog.com/project/117050/insights/wXDgzfr2) - Tracks user journey from landing page CTA click through creating and completing their first todo
- [Todo Activity Trend](https://eu.posthog.com/project/117050/insights/qnfajhN0) - Daily trend of todos created vs completed to measure productivity
- [Login Funnel](https://eu.posthog.com/project/117050/insights/B5lsIQW6) - Tracks user authentication flow from login modal open through OTP to successful login
- [Star Role Feature Adoption](https://eu.posthog.com/project/117050/insights/5AlNa39v) - Weekly breakdown of constellation page views and star role/group creation events
- [Weekly Active Users](https://eu.posthog.com/project/117050/insights/hyTgTP3z) - Track unique active users over time to monitor growth and retention

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
