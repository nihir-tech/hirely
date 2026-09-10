import type {
  AnalyzeRequest,
  AnalyzeResponse,
  JobMatchRequest,
  JobMatchResponse,
  RewriteRequest,
  RewriteResponse,
} from '../types'

const API_BASE = '/api'

/* ── Deterministic result cache ──────────────────────
   Same resume → same analysis. Results are cached in localStorage keyed by a
   hash of the normalized input, so re-analyzing an identical resume returns
   the exact same result (and skips the AI call). Bounded + versioned. */

const CACHE_KEY = 'hirely:ai_cache'
const CACHE_VERSION = 1
const CACHE_MAX = 30

function hashInput(value: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

function loadCache(): Record<string, { data: unknown; ts: number }> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, { data: unknown; ts: number }>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveCache(key: string, data: unknown) {
  try {
    const cache = loadCache()
    cache[key] = { data, ts: Date.now() }
    const entries = Object.entries(cache).sort((a, b) => b[1].ts - a[1].ts)
    for (const [k] of entries.slice(CACHE_MAX)) delete cache[k]
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch { /* cache is best-effort */ }
}

function readCache<T>(key: string): T | undefined {
  const entry = loadCache()[key]
  return entry ? (entry.data as T) : undefined
}

function cached<T>(kind: string, input: Record<string, unknown>, produce: () => Promise<T>): Promise<T> {
  const key = `${kind}:${CACHE_VERSION}:${hashInput(JSON.stringify(input))}`
  const hit = readCache<T>(key)
  if (hit) return Promise.resolve(hit)
  return produce().then((res) => {
    saveCache(key, res)
    return res
  })
}

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
  return cached<AnalyzeResponse>('an', request as unknown as Record<string, unknown>, () =>
    callFunction<AnalyzeResponse>('analyze-resume', request),
  )
}

export async function matchJob(
  request: JobMatchRequest,
): Promise<JobMatchResponse> {
  return cached<JobMatchResponse>('jm', request as unknown as Record<string, unknown>, () =>
    callFunction<JobMatchResponse>('job-match', request),
  )
}

export async function rewriteResume(
  request: RewriteRequest,
): Promise<RewriteResponse> {
  return cached<RewriteResponse>('rw', request as unknown as Record<string, unknown>, () =>
    callFunction<RewriteResponse>('rewrite-resume', request, 180000),
  )
}

export { AiError }
