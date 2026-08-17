import { chatJson, errorResponse, buildJsonResponse } from './_shared/ai'
import { ANALYZE_SYSTEM_PROMPT } from './_shared/prompts'

const MAX_TEXT = 50000
const MIN_TEXT = 50

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()
    const text = typeof body.text === 'string' ? body.text.trim() : ''

    if (text.length < MIN_TEXT) {
      return new Response(
        JSON.stringify({ error: 'Resume text is too short to analyze. Please upload a clearer file.', code: 'TEXT_TOO_SHORT' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const truncated = text.length > MAX_TEXT ? text.slice(0, MAX_TEXT) + '\n\n[Truncated for analysis]' : text

    const result = await chatJson({
      system: ANALYZE_SYSTEM_PROMPT,
      user: `Analyze this resume:\n\n${truncated}`,
    })

    return new Response(
      JSON.stringify({ analysis: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    if (err instanceof Error && err.name === 'AiConfigError') {
      return new Response(
        JSON.stringify({ error: err.message, code: 'AI_NOT_CONFIGURED' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const message = err instanceof Error ? err.message : 'Analysis failed'
    const isTimeout = message.toLowerCase().includes('timeout') || message.toLowerCase().includes('deadline')
    const isRateLimit = message.toLowerCase().includes('rate') || message.toLowerCase().includes('429')

    return new Response(
      JSON.stringify({
        error: isRateLimit
          ? 'Rate limit reached. Please wait a moment and try again.'
          : isTimeout
            ? 'The analysis timed out. Try with a shorter resume.'
            : 'Failed to analyze resume. Please try again.',
        code: isRateLimit ? 'RATE_LIMITED' : isTimeout ? 'TIMEOUT' : 'ANALYSIS_FAILED',
      }),
      { status: isRateLimit ? 429 : 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

export const config = {
  path: '/api/analyze-resume',
}
