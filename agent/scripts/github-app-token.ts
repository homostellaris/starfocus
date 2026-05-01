#!/usr/bin/env bun
/**
 * Generates a GitHub App installation token.
 * Prints the token to stdout so it can be used as: GH_TOKEN=$(bun run github-app-token.ts)
 *
 * Required env vars (loaded from GITHUB_APP_ENV_FILE or ~/.config/github-webhook-bridge.env):
 *   GITHUB_APP_ID
 *   GITHUB_APP_INSTALLATION_ID
 *   GITHUB_APP_PRIVATE_KEY_PATH
 */

import { readFileSync } from 'fs'
import { createSign } from 'crypto'

const envFile = process.env.GITHUB_APP_ENV_FILE ?? `${process.env.HOME}/.config/github-app.env`
for (const line of readFileSync(envFile, 'utf8').split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/)
  if (match) process.env[match[1]] = match[2]
}

const appId = process.env.GITHUB_APP_ID
const installationId = process.env.GITHUB_APP_INSTALLATION_ID
const privateKeyPath = process.env.GITHUB_APP_PRIVATE_KEY_PATH

if (!appId || !installationId || !privateKeyPath) {
  throw new Error('GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID, and GITHUB_APP_PRIVATE_KEY_PATH are required')
}

const privateKey = readFileSync(privateKeyPath, 'utf8')

function generateJwt(): string {
  const now = Math.floor(Date.now() / 1000)
  const payload = { iat: now - 60, exp: now + 540, iss: appId }

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const unsigned = `${header}.${body}`

  const signer = createSign('RSA-SHA256')
  signer.update(unsigned)
  const sig = signer.sign(privateKey, 'base64url')

  return `${unsigned}.${sig}`
}

const jwt = generateJwt()

const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${jwt}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
})

if (!response.ok) {
  const body = await response.text()
  throw new Error(`Failed to get installation token: ${response.status} ${body}`)
}

const { token } = await response.json() as { token: string }
process.stdout.write(token)
