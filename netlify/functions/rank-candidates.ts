import { chatJson } from './_shared/ai'
import { RANK_CANDIDATES_SYSTEM_PROMPT } from './_shared/prompts'

const MAX_RESUMES = 25
const MAX_RESUME_CHARS = 2200
const MAX_JD = 20000

interface RankInput {
  jobTitle?: string
  company?: string
  jobDescription: string
  resumes: { id: string; fileName: string; text: string }[]
}

interface RankedCandidate {
  id: string
  fileName?: string
  name?: string | null
  email?: string | null
  phone?: string | null
  location?: string | null
  linkedin?: string | null
  headline?: string | null
  score?: unknown
  priority?: unknown
  yearsExperience?: string | null
  matchSummary?: string | null
  strengths?: unknown
  gaps?: unknown
  notableProjects?: unknown
}

function clampScore(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function normalize(text: unknown): string {
  return typeof text === 'string' ? text.trim() : ''
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, 4)
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = (await request.json()) as Partial<RankInput>
    const jobDescription = normalize(body.jobDescription)
    const jobTitle = normalize(body.jobTitle) || undefined
    const company = normalize(body.company) || undefined

    if (jobDescription.length < 50) {
      return new Response(
        JSON.stringify({ error: 'Job description is too short. Please paste the complete posting.', code: 'JD_TOO_SHORT' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const resumes = Array.isArray(body.resumes) ? body.resumes.slice(0, MAX_RESUMES) : []
    if (resumes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Please provide at least one resume to rank.', code: 'NO_RESUMES' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const truncatedJD = jobDescription.length > MAX_JD ? jobDescription.slice(0, MAX_JD) : jobDescription

    const parts: string[] = []
    parts.push(`JOB DESCRIPTION:\n${truncatedJD}`)
    if (jobTitle) parts.push(`\nJOB TITLE: ${jobTitle}`)
    if (company) parts.push(`COMPANY: ${company}`)
    parts.push('')
    resumes.forEach((r, i) => {
      const text = typeof r.text === 'string' ? r.text.trim() : ''
      const truncated = text.length > MAX_RESUME_CHARS ? text.slice(0, MAX_RESUME_CHARS) : text
      parts.push(`CANDIDATE ${i + 1} — id: "${r.id}", fileName: "${r.fileName}"\n${truncated}`)
    })

    const result = await chatJson({
      system: RANK_CANDIDATES_SYSTEM_PROMPT,
      user: parts.join('\n\n'),
      maxTokens: 8000,
    })

    const raw = Array.isArray((result as { ranking?: unknown }).ranking)
      ? (result as { ranking: RankedCandidate[] }).ranking
      : Array.isArray((result as { candidates?: unknown }).candidates)
        ? (result as { candidates: RankedCandidate[] }).candidates
        : []

    const validIds = new Set(resumes.map((r) => r.id))
    const ranking = raw
      .filter((c) => c && validIds.has(String(c.id ?? '')))
      .map((c, index) => {
        const priority = typeof c.priority === 'number' ? c.priority : index + 1
        return {
          id: String(c.id),
          fileName: normalize(c.fileName) || '',
          name: normalize(c.name) || undefined,
          email: normalize(c.email) || undefined,
          phone: normalize(c.phone) || undefined,
          location: normalize(c.location) || undefined,
          linkedin: normalize(c.linkedin) || undefined,
          headline: normalize(c.headline) || undefined,
          score: clampScore(c.score),
          priority,
          yearsExperience: normalize(c.yearsExperience) || undefined,
          matchSummary: normalize(c.matchSummary) || '',
          strengths: asStringArray(c.strengths),
          gaps: asStringArray(c.gaps),
          notableProjects: asStringArray(c.notableProjects),
        }
      })
      .sort((a, b) => a.priority - b.priority)

    if (ranking.length === 0) {
      return new Response(
        JSON.stringify({ error: 'The AI did not return a usable ranking. Please try again.', code: 'EMPTY_RANKING' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ ranking }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    if (err instanceof Error && err.name === 'AiConfigError') {
      return new Response(
        JSON.stringify({ error: err.message, code: 'AI_NOT_CONFIGURED' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const message = err instanceof Error ? err.message : 'Candidate ranking failed'
    const isTimeout = message.toLowerCase().includes('timeout') || message.toLowerCase().includes('deadline')

    return new Response(
      JSON.stringify({
        error: isTimeout
          ? 'The ranking request timed out. Try with fewer resumes or a shorter job description.'
          : 'Failed to rank candidates. Please try again.',
        code: isTimeout ? 'TIMEOUT' : 'RANK_FAILED',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

export const config = {
  path: '/api/rank-candidates',
}