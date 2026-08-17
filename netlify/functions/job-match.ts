import { chatJson } from './_shared/ai'
import { JOB_MATCH_SYSTEM_PROMPT } from './_shared/prompts'

const MAX_RESUME = 30000
const MAX_JD = 20000

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

    if (!jobDescription || jobDescription.length < 50) {
      return new Response(
        JSON.stringify({ error: 'Job description is too short. Please paste the complete posting.', code: 'JD_TOO_SHORT' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const truncResume = resumeText.length > MAX_RESUME ? resumeText.slice(0, MAX_RESUME) : resumeText
    const truncJD = jobDescription.length > MAX_JD ? jobDescription.slice(0, MAX_JD) : jobDescription

    let context = `RESUME:\n${truncResume}\n\nJOB DESCRIPTION:\n${truncJD}`
    if (company) context += `\n\nCOMPANY: ${company}`
    if (jobTitle) context += `\n\nJOB TITLE: ${jobTitle}`

    const result = await chatJson({
      system: JOB_MATCH_SYSTEM_PROMPT,
      user: context,
      maxTokens: 6000,
    })

    return new Response(
      JSON.stringify({ jobMatch: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    if (err instanceof Error && err.name === 'AiConfigError') {
      return new Response(
        JSON.stringify({ error: err.message, code: 'AI_NOT_CONFIGURED' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const message = err instanceof Error ? err.message : 'Job match analysis failed'
    const isTimeout = message.toLowerCase().includes('timeout') || message.toLowerCase().includes('deadline')

    return new Response(
      JSON.stringify({
        error: isTimeout
          ? 'The job match analysis timed out. Try with a shorter job description.'
          : 'Failed to analyze job match. Please try again.',
        code: isTimeout ? 'TIMEOUT' : 'MATCH_FAILED',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

export const config = {
  path: '/api/job-match',
}
