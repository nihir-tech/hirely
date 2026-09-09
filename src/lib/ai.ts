import type {
  AnalyzeRequest,
  AnalyzeResponse,
  JobMatchRequest,
  JobMatchResponse,
  RewriteRequest,
  RewriteResponse,
} from '../types'

const API_BASE = '/api'

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

async function callFunction<T>(
  path: string,
  payload: unknown,
  timeoutMs = 120000,
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${API_BASE}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      const message =
        (body as { error?: string }).error ||
        `Request failed with status ${res.status}`
      const code =
        (body as { code?: string }).code ||
        (res.status === 503 ? 'AI_NOT_CONFIGURED' : 'API_ERROR')

      if (res.status === 429) {
        throw new AiError(
          'You\'ve made too many requests. Please wait a moment and try again.',
          'RATE_LIMITED',
          429,
        )
      }
      if (res.status === 504 || res.status === 524) {
        throw new AiError(
          'The request timed out. The analysis may be too complex — try with a shorter resume or job description.',
          'TIMEOUT',
          res.status,
        )
      }

      throw new AiError(message, code, res.status)
    }

    return body as T
  } catch (err) {
    if (err instanceof AiError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new AiError(
        'The request timed out. Please try again.',
        'TIMEOUT',
        408,
      )
    }
    throw new AiError(
      'Unable to reach the analysis service. Please check your connection and try again.',
      'NETWORK_ERROR',
      0,
    )
  } finally {
    clearTimeout(timeout)
  }
}

export async function analyzeResume(
  request: AnalyzeRequest,
): Promise<AnalyzeResponse> {
  return callFunction<AnalyzeResponse>('analyze-resume', request)
}

export async function matchJob(
  request: JobMatchRequest,
): Promise<JobMatchResponse> {
  return callFunction<JobMatchResponse>('job-match', request)
}

export async function rewriteResume(
  request: RewriteRequest,
): Promise<RewriteResponse> {
  return callFunction<RewriteResponse>('rewrite-resume', request, 180000)
}

export { AiError }
