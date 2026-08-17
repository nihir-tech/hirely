import { chatJson } from './_shared/ai'
import { REWRITE_SYSTEM_PROMPT } from './_shared/prompts'

const MAX_RESUME = 30000
const MAX_JD = 15000

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()
    const resumeText = typeof body.resumeText === 'string' ? body.resumeText.trim() : ''
    const jobDescription = typeof body.jobDescription === 'string' ? body.jobDescription.trim() : ''
    const company = typeof body.company === 'string' ? body.company.trim() : undefined
    const jobTitle = typeof body.jobTitle === 'string' ? body.jobTitle.trim() : undefined
    const focus = body.focus === 'job' ? 'job' : 'general'

    if (!resumeText) {
      return new Response(
        JSON.stringify({ error: 'Resume text is required.', code: 'NO_RESUME' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const truncResume = resumeText.length > MAX_RESUME ? resumeText.slice(0, MAX_RESUME) : resumeText
    const truncJD = jobDescription.length > MAX_JD ? jobDescription.slice(0, MAX_JD) : jobDescription

    let userPrompt = `Rewrite this resume to be clearer, more impactful, and better structured.\n\nRESUME:\n${truncResume}`

    if (focus === 'job' && truncJD) {
      userPrompt += `\n\nTARGET JOB DESCRIPTION:\n${truncJD}`
      if (company) userPrompt += `\n\nCOMPANY: ${company}`
      if (jobTitle) userPrompt += `\n\nJOB TITLE: ${jobTitle}`
      userPrompt += '\n\nOptimize the resume for this specific role while preserving all factual content.'
    } else {
      userPrompt += '\n\nImprove the resume generally. Strengthen wording, improve structure, and enhance clarity.'
    }

    const result = await chatJson({
      system: REWRITE_SYSTEM_PROMPT,
      user: userPrompt,
      maxTokens: 8000,
      temperature: 0.3,
    })

    return new Response(
      JSON.stringify({ rewritten: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    if (err instanceof Error && err.name === 'AiConfigError') {
      return new Response(
        JSON.stringify({ error: err.message, code: 'AI_NOT_CONFIGURED' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const message = err instanceof Error ? err.message : 'Resume rewrite failed'
    const isTimeout = message.toLowerCase().includes('timeout') || message.toLowerCase().includes('deadline')

    return new Response(
      JSON.stringify({
        error: isTimeout
          ? 'The rewrite timed out. Try with a shorter resume.'
          : 'Failed to generate improved resume. Please try again.',
        code: isTimeout ? 'TIMEOUT' : 'REWRITE_FAILED',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

export const config = {
  path: '/api/rewrite-resume',
}
