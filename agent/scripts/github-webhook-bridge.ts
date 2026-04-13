#!/usr/bin/env bun
/**
 * Receives GitHub webhook events for PR comments and forwards them to
 * OpenClaw's main agent via CLI for immediate trusted processing.
 *
 * Required env vars:
 *   GITHUB_WEBHOOK_SECRET  - shared secret configured in GitHub webhook settings
 *   PORT                   - port to listen on (default: 18790)
 */

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET
const PORT = parseInt(process.env.PORT ?? '18790')

if (!GITHUB_WEBHOOK_SECRET) throw new Error('GITHUB_WEBHOOK_SECRET is required')

async function verifySignature(body: string, signature: string | null): Promise<boolean> {
  if (!signature?.startsWith('sha256=')) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(GITHUB_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  const expected = 'sha256=' + Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('')

  return expected === signature
}

function formatIssueComment(payload: Record<string, unknown>): string | null {
  const issue = payload.issue as Record<string, unknown>
  if (!issue?.pull_request) return null

  const comment = payload.comment as Record<string, unknown>
  const sender = (payload.sender as Record<string, unknown>).login as string
  const repo = (payload.repository as Record<string, unknown>).full_name as string
  const prNumber = issue.number as number
  const prTitle = issue.title as string
  const body = comment.body as string
  const commentUrl = comment.html_url as string

  return `GitHub PR comment from @${sender} on ${repo}#${prNumber} "${prTitle}":\n\n${body}\n\n${commentUrl}`
}

function formatReviewComment(payload: Record<string, unknown>): string {
  const comment = payload.comment as Record<string, unknown>
  const pr = payload.pull_request as Record<string, unknown>
  const sender = (payload.sender as Record<string, unknown>).login as string
  const repo = (payload.repository as Record<string, unknown>).full_name as string
  const prNumber = pr.number as number
  const prTitle = pr.title as string
  const branch = (pr.head as Record<string, unknown>).ref as string
  const body = comment.body as string
  const path = comment.path as string
  const line = comment.line as number | null
  const commentUrl = comment.html_url as string

  const location = line ? `${path} line ${line}` : path
  return `GitHub inline comment from @${sender} on ${repo}#${prNumber} "${prTitle}" (branch: ${branch}) at ${location}:\n\n${body}\n\n${commentUrl}`
}

function formatReviewSubmitted(payload: Record<string, unknown>): string | null {
  const review = payload.review as Record<string, unknown>
  const body = review.body as string | null
  if (!body) return null

  const pr = payload.pull_request as Record<string, unknown>
  const sender = (payload.sender as Record<string, unknown>).login as string
  const repo = (payload.repository as Record<string, unknown>).full_name as string
  const prNumber = pr.number as number
  const prTitle = pr.title as string
  const branch = (pr.head as Record<string, unknown>).ref as string
  const state = review.state as string
  const reviewUrl = review.html_url as string

  return `GitHub review (${state}) from @${sender} on ${repo}#${prNumber} "${prTitle}" (branch: ${branch}):\n\n${body}\n\n${reviewUrl}`
}

async function forwardToOpenClaw(message: string): Promise<void> {
  const proc = Bun.spawn(
    ['openclaw', 'agent', '--agent', 'main', '--message', message],
    { stderr: 'pipe' },
  )
  const exitCode = await proc.exited
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text()
    throw new Error(`openclaw agent exited ${exitCode}: ${stderr}`)
  }
}

Bun.serve({
  port: PORT,
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const body = await request.text()
    const signature = request.headers.get('x-hub-signature-256')

    if (!await verifySignature(body, signature)) {
      console.error('Invalid signature')
      return new Response('Unauthorized', { status: 401 })
    }

    const event = request.headers.get('x-github-event')
    const payload = JSON.parse(body) as Record<string, unknown>
    const action = payload.action as string

    let message: string | null = null

    if (event === 'issue_comment' && action === 'created') {
      message = formatIssueComment(payload)
    } else if (event === 'pull_request_review_comment' && action === 'created') {
      message = formatReviewComment(payload)
    } else if (event === 'pull_request_review' && action === 'submitted') {
      message = formatReviewSubmitted(payload)
    }

    if (!message) {
      return new Response('Ignored', { status: 200 })
    }

    console.log(`Forwarding ${event} to OpenClaw: ${message.slice(0, 80)}...`)

    try {
      await forwardToOpenClaw(message)
      return new Response('OK', { status: 200 })
    } catch (error) {
      console.error('Failed to forward to OpenClaw:', error)
      return new Response('Internal server error', { status: 500 })
    }
  },
})

console.log(`GitHub webhook bridge listening on :${PORT}`)
