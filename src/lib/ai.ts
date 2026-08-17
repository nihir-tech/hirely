import type {
  AnalyzeRequest,
  AnalyzeResponse,
  JobMatchRequest,
  JobMatchResponse,
  RewriteRequest,
  RewriteResponse,
} from '../types'
import { ANALYZE_SYSTEM_PROMPT, JOB_MATCH_SYSTEM_PROMPT, REWRITE_SYSTEM_PROMPT } from './prompts'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash-lite'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

class AiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message)
    this.name = 'AiError'
  }
}

async function chatJson(system: string, user: string, timeoutMs = 120000): Promise<Record<string, unknown>> {
  if (!GEMINI_API_KEY) {
    throw new AiError('AI is not configured. Set VITE_GEMINI_API_KEY in your environment.', 'AI_NOT_CONFIGURED', 503)
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 5000))
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${system}\n\n${user}` }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4000,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      })

      if (response.status === 503 || response.status === 429) {
        const errText = await response.text()
        lastError = new AiError(
          response.status === 429
            ? 'Too many requests. Please wait a moment and try again.'
            : 'AI service is temporarily overloaded. Retrying...',
          response.status === 429 ? 'RATE_LIMITED' : 'OVERLOADED',
          response.status,
        )
        continue
      }

      if (!response.ok) {
        const errText = await response.text()
        throw new AiError(`AI error (${response.status}): ${errText}`, 'API_ERROR', response.status)
      }

      const result = await response.json()
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new AiError('AI returned empty response', 'EMPTY_RESPONSE', 500)

      return JSON.parse(text)
    } catch (err) {
      if (err instanceof AiError) {
        if (err.status === 503 || err.status === 429) {
          lastError = err
          continue
        }
        throw err
      }
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new AiError('The request timed out. Please try again.', 'TIMEOUT', 408)
      }
      throw new AiError(
        'Unable to reach AI service. Check your connection and try again.',
        'NETWORK_ERROR',
        0,
      )
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError || new AiError('AI service unavailable. Please try again later.', 'UNAVAILABLE', 503)
}

export async function analyzeResume(
  request: AnalyzeRequest,
): Promise<AnalyzeResponse> {
  const text = request.text.trim()
  const truncated = text.length > 50000 ? text.slice(0, 50000) + '\n\n[Truncated]' : text
  const result = await chatJson(ANALYZE_SYSTEM_PROMPT, `Analyze this resume:\n\n${truncated}`)
  return { analysis: result } as unknown as AnalyzeResponse
}

export async function matchJob(
  request: JobMatchRequest,
): Promise<JobMatchResponse> {
  const userMsg = `Resume:\n\n${request.resumeText}\n\n---\n\nJob Description:\n\n${request.jobDescription}`
  const result = await chatJson(JOB_MATCH_SYSTEM_PROMPT, userMsg)
  return { jobMatch: result } as unknown as JobMatchResponse
}

export async function rewriteResume(
  request: RewriteRequest,
): Promise<RewriteResponse> {
  let context = ''
  if (request.jobDescription) context += `\n\nTarget Job Description:\n${request.jobDescription}`
  if (request.company) context += `\nTarget Company: ${request.company}`
  if (request.jobTitle) context += `\nTarget Title: ${request.jobTitle}`
  const truncated = request.resumeText.length > 30000 ? request.resumeText.slice(0, 30000) + '\n\n[Truncated]' : request.resumeText
  const result = await chatJson(REWRITE_SYSTEM_PROMPT, `Rewrite this resume (${request.focus} focus):\n\n${truncated}${context}`, 180000)
  return { rewritten: result } as unknown as RewriteResponse
}

export { AiError }
