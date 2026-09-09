import { chatJson } from './_lib/ai'
import { JOB_MATCH_SYSTEM_PROMPT } from './_lib/prompts'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { resumeText, jobDescription, company, jobTitle } = req.body || {}

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: 'resumeText and jobDescription are required.' })
    }

    const userMsg = `Resume:\n\n${resumeText}\n\n---\n\nJob Description:\n\n${jobDescription}`
    const result = await chatJson({ system: JOB_MATCH_SYSTEM_PROMPT, user: userMsg })

    return res.status(200).json({ jobMatch: result })
  } catch (err) {
    console.error('[job-match]', err)
    const message = err instanceof Error ? err.message : 'Job match failed'
    return res.status(500).json({ error: message, code: 'JOB_MATCH_FAILED' })
  }
}
