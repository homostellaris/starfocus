# StarFocus - Claude Code Instructions

## Project Overview

A Next.js todo application with Ionic React UI and Capacitor for mobile.

## Package Manager

Use **Bun** for all commands (not npm/yarn).

## Common Commands

```bash
bun install          # Install dependencies
bun dev              # Start dev server (port 6603)
bun build            # Production build
bun typecheck        # TypeScript checking
bun lint             # ESLint
bun unit             # Unit tests
bun test             # Full test suite (typecheck + lint + unit + integration)
```

## Cypress Testing

### Running Cypress Tests

```bash
# Start the dev server first (in background)
bun dev &

# Run Cypress tests headlessly
bun cypress run

# Run specific test file
bun cypress run --spec "cypress/e2e/home.cy.ts"

# Open Cypress interactive mode (local only)
bun cypress open
```

### Test Structure

- `cypress/e2e/home.cy.ts` - Main feature tests (asteroid field, wayfinder, snooze, search, settings)
- `cypress/e2e/index.cy.ts` - Onboarding/landing page tests
- `cypress/support/commands.ts` - Custom commands including drag-drop support

### Debugging Failed Tests

- Videos are recorded automatically in `cypress/videos/`
- Screenshots on failure in `cypress/screenshots/`

## Investigating GitHub Actions Failures

### View Recent Workflow Runs

```bash
gh run list --limit 10
```

### View Failed Run Details

```bash
gh run view <run-id>
gh run view <run-id> --log-failed
```

### Download Cypress Artifacts (Videos)

```bash
gh run download <run-id> -n cypress-videos
```

### CI Pipeline Steps

The build workflow (`.github/workflows/build.yml`) runs:

1. `bun install`
2. `bun typecheck`
3. `bun lint`
4. `bun unit`
5. `bun run build`
6. Cypress tests (with video upload on failure)

## Code Style

- Use ES modules (import/export)
- Follow existing Gitmoji commit conventions (see `.gitmojirc.json`)
- TypeScript strict mode enabled

## Architecture Notes

- State: Dexie (IndexedDB) with cloud sync addon
- UI Components: Ionic React in `/components/`
- App Router: Next.js App Router in `/app/`
- Database schema: `/components/db.ts`

## Deploynent

Vercel is used as the deployment platform. The Vercel CLI is available for tailing logs and other operations.
