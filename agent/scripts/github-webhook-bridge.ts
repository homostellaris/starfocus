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
const GITHUB_BOT_LOGIN = process.env.GITHUB_BOT_LOGIN
const PORT = parseInt(process.env.PORT ?? '18790')

if (!GITHUB_WEBHOOK_SECRET) throw new Error('GITHUB_WEBHOOK_SECRET is required')
if (!GITHUB_BOT_LOGIN) throw new Error('GITHUB_BOT_LOGIN is required')

function isMentioningBot(body: string, senderLogin: string): boolean {
  if (senderLogin === GITHUB_BOT_LOGIN) return false
  const botHandle = '@' + GITHUB_BOT_LOGIN!.replace('[bot]', '')
  return body.toLowerCase().includes(botHandle.toLowerCase())
}

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
  const body = comment.body as string

  if (!isMentioningBot(body, sender)) return null

  const repo = (payload.repository as Record<string, unknown>).full_name as string
  const prNumber = issue.number as number
  const prTitle = issue.title as string
  const commentUrl = comment.html_url as string

  return `GitHub PR comment from @${sender} on ${repo}#${prNumber} "${prTitle}":\n\n${body}\n\n${commentUrl}`
}

function formatReviewComment(payload: Record<string, unknown>): string | null {
  const comment = payload.comment as Record<string, unknown>
  const pr = payload.pull_request as Record<string, unknown>
  const sender = (payload.sender as Record<string, unknown>).login as string
  const body = comment.body as string

  if (!isMentioningBot(body, sender)) return null

  const repo = (payload.repository as Record<string, unknown>).full_name as string
  const prNumber = pr.number as number
  const prTitle = pr.title as string
  const branch = (pr.head as Record<string, unknown>).ref as string
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

  const sender = (payload.sender as Record<string, unknown>).login as string

  if (!isMentioningBot(body, sender)) return null

  const pr = payload.pull_request as Record<string, unknown>
  const repo = (payload.repository as Record<string, unknown>).full_name as string
  const prNumber = pr.number as number
  const prTitle = pr.title as string
  const branch = (pr.head as Record<string, unknown>).ref as string
  const state = review.state as string
  const reviewUrl = review.html_url as string

  return `GitHub review (${state}) from @${sender} on ${repo}#${prNumber} "${prTitle}" (branch: ${branch}):\n\n${body}\n\n${reviewUrl}`
}

function formatPullRequestNotification(payload: Record<string, unknown>): string | null {
  const pr = payload.pull_request as Record<string, unknown>
  const action = payload.action as string
  const sender = (payload.sender as Record<string, unknown>).login as string
  if (sender === GITHUB_BOT_LOGIN) return null

  const prNumber = pr.number as number
  const prTitle = pr.title as string
  const branch = (pr.head as Record<string, unknown>).ref as string
  const prUrl = pr.html_url as string

  if (action === 'opened') {
    return `🆕 GitHub PR #${prNumber} "${prTitle}" opened by @${sender} (branch: ${branch}):\n\nLink: ${prUrl}`
  } else if (action === 'synchronize') {
    return `🔄 GitHub PR #${prNumber} "${prTitle}" updated (synchronized) by @${sender} (branch: ${branch}):\n\nLink: ${prUrl}`
  } else if (action === 'review_requested') {
    const requestedReviewer = (payload.requested_reviewer as Record<string, unknown>)?.login as string
    return `👀 GitHub PR #${prNumber} "${prTitle}": review requested from @${requestedReviewer} by @${sender}:\n\nLink: ${prUrl}`
  }

  return null
}

function formatReviewNotification(payload: Record<string, unknown>): string | null {
  const review = payload.review as Record<string, unknown>
  const sender = (payload.sender as Record<string, unknown>).login as string
  if (sender === GITHUB_BOT_LOGIN) return null

  const pr = payload.pull_request as Record<string, unknown>
  const prNumber = pr.number as number
  const prTitle = pr.title as string
  const state = review.state as string
  const reviewUrl = review.html_url as string
  const body = review.body as string | null

  let msg = `💬 GitHub Review (${state.toUpperCase()}) by @${sender} on PR #${prNumber} "${prTitle}":\n`
  if (body) {
    msg += `\n"${body}"\n`
  }
  msg += `\nLink: ${reviewUrl}`
  return msg
}

function formatWorkflowRunNotification(payload: Record<string, unknown>): string | null {
  const action = payload.action as string
  if (action !== 'completed') return null

  const run = payload.workflow_run as Record<string, unknown>
  const name = run.name as string
  const conclusion = run.conclusion as string
  const branch = run.head_branch as string
  const repo = (payload.repository as Record<string, unknown>).full_name as string
  const runUrl = run.html_url as string

  const pullRequests = run.pull_requests as Array<Record<string, unknown>> | undefined
  let prLink = ''
  if (pullRequests && pullRequests.length > 0) {
    const prNumber = pullRequests[0].number as number
    prLink = `\nPR Link: https://github.com/${repo}/pull/${prNumber}`
  }

  const statusIcon = conclusion === 'success' ? '✅' : '❌'
  return `${statusIcon} GitHub Actions: Workflow "${name}" ${conclusion.toUpperCase()} on ${repo} (branch: ${branch})${prLink}\n\nRun Details: ${runUrl}`
}

async function sendDirectNotification(message: string): Promise<void> {
  const channel = process.env.OPENCLAW_CHANNEL || 'whatsapp'
  const target = process.env.OPENCLAW_TARGET
  if (!target) {
    console.warn('Skipping direct notification: OPENCLAW_TARGET is not configured')
    return
  }

  console.log(`Sending direct notification via ${channel} to ${target}...`)
  const proc = Bun.spawn(
    ['openclaw', 'message', 'send', '--channel', channel, '--target', target, '--message', message],
    { stderr: 'pipe' },
  )
  const exitCode = await proc.exited
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text()
    throw new Error(`openclaw message send exited ${exitCode}: ${stderr}`)
  }
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

    // 1. Direct Notification check
    if (event === 'pull_request') {
      const notification = formatPullRequestNotification(payload)
      if (notification) {
        try {
          await sendDirectNotification(notification)
          return new Response('OK', { status: 200 })
        } catch (error) {
          console.error('Failed to send PR direct notification:', error)
          return new Response('Internal server error', { status: 500 })
        }
      }
    } else if (event === 'pull_request_review' && action === 'submitted') {
      const notification = formatReviewNotification(payload)
      if (notification) {
        try {
          await sendDirectNotification(notification)
        } catch (error) {
          console.error('Failed to send Review direct notification:', error)
        }
      }
    } else if (event === 'workflow_run') {
      const notification = formatWorkflowRunNotification(payload)
      if (notification) {
        try {
          await sendDirectNotification(notification)
          return new Response('OK', { status: 200 })
        } catch (error) {
          console.error('Failed to send workflow_run direct notification:', error)
          return new Response('Internal server error', { status: 500 })
        }
      }
    }

    // 2. OpenClaw Agent Mention check (existing logic)
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
