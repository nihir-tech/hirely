import type { Plugin } from 'vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

let envData: Record<string, string> = {}
try {
  const envPath = resolve(__dirname, '.env')
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    envData[trimmed.slice(0, eqIndex).trim()] = trimmed.slice(eqIndex + 1).trim()
  }
} catch {}

const AI_API_KEY = envData.OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''
const AI_MODEL = envData.OPENAI_MODEL || process.env.OPENAI_MODEL || 'gemini-3.5-flash-lite'

const CANDIDATE_MODELS = [
  AI_MODEL,
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-flash-lite-latest',
].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i)

function getApiKey(): string {
  if (!AI_API_KEY || AI_API_KEY === 'your-ai-api-key-here') {
    throw new Error('Please set your AI API key in .env')
  }
  return AI_API_KEY
}

async function chatJson(system: string, user: string): Promise<Record<string, unknown>> {
  const apiKey = getApiKey()
  let lastError: Error | null = null

  for (let mIdx = 0; mIdx < CANDIDATE_MODELS.length; mIdx++) {
    const currentModel = CANDIDATE_MODELS[mIdx]
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`

    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0 || mIdx > 0) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)))
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
          lastError = new Error('AI API model temporarily busy, switching model...')
          break // switch to next model in CANDIDATE_MODELS
        }

        if (!response.ok) {
          if (response.status === 404) {
            lastError = new Error(`Model ${currentModel} not found`)
            break
          }
          const err = await response.text()
          throw new Error(`AI API error (${response.status}): ${err}`)
        }

        const result = (await response.json()) as any
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) throw new Error('AI returned empty response')
        try {
          return JSON.parse(text)
        } catch {
          const stripped = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
          return JSON.parse(stripped)
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
      }
    }
  }

  throw lastError || new Error('AI service unavailable after model fallbacks')
}

function jsonResponse(res: any, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function loadPrompt(name: string): string {
  const promptsPath = resolve(__dirname, 'netlify', 'functions', '_shared', 'prompts.ts')
  const raw = readFileSync(promptsPath, 'utf-8')
  const regex = new RegExp(`export const ${name} = \`(.*?)\``, 's')
  const match = raw.match(regex)
  if (!match) throw new Error(`Prompt ${name} not found`)
  return match[1]
}

let cachedPrompts: Record<string, string> | null = null

function getPrompts(): Record<string, string> | null {
  if (cachedPrompts) return cachedPrompts
  try {
    cachedPrompts = {
      'analyze': loadPrompt('ANALYZE_SYSTEM_PROMPT'),
      'job-match': loadPrompt('JOB_MATCH_SYSTEM_PROMPT'),
      'rewrite': loadPrompt('REWRITE_SYSTEM_PROMPT'),
      'rank-candidates': loadPrompt('RANK_CANDIDATES_SYSTEM_PROMPT'),
    }
    return cachedPrompts
  } catch {
    return null
  }
}

export function apiPlugin(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      if (!AI_API_KEY) return
      server.middlewares.use('/api', async (req, res) => {
        if (req.method !== 'POST') {
          return jsonResponse(res, 405, { error: 'Method not allowed' })
        }

        let body = ''
        for await (const chunk of req) body += chunk

        let data: Record<string, unknown>
        try {
          data = JSON.parse(body)
        } catch {
          return jsonResponse(res, 400, { error: 'Invalid JSON' })
        }

        const prompts = getPrompts()
        if (!prompts) {
          return jsonResponse(res, 500, {
            error: 'Failed to load prompts',
            code: 'PROMPT_LOAD_ERROR',
          })
        }

        const url = (req.url || '').replace(/^\/?/, '')

        try {
          if (url === 'analyze-resume') {
            const text = typeof data.text === 'string' ? data.text.trim() : ''
            if (text.length < 50) {
              return jsonResponse(res, 400, { error: 'Resume text too short to analyze.', code: 'TEXT_TOO_SHORT' })
            }
            const truncated = text.length > 50000 ? text.slice(0, 50000) + '\n\n[Truncated]' : text
            const result = await chatJson(prompts['analyze'], `Analyze this resume:\n\n${truncated}`)
            return jsonResponse(res, 200, { analysis: result })

          } else if (url === 'job-match') {
            const resumeText = typeof data.resumeText === 'string' ? data.resumeText : ''
            const jobDescription = typeof data.jobDescription === 'string' ? data.jobDescription : ''
            if (!resumeText || !jobDescription) {
              return jsonResponse(res, 400, { error: 'resumeText and jobDescription are required.' })
            }
            const userMsg = `Resume:\n\n${resumeText}\n\n---\n\nJob Description:\n\n${jobDescription}`
            const result = await chatJson(prompts['job-match'], userMsg)
            return jsonResponse(res, 200, { jobMatch: result })

          } else if (url === 'rewrite-resume') {
            const resumeText = typeof data.resumeText === 'string' ? data.resumeText : ''
            const focus = typeof data.focus === 'string' ? data.focus : 'general'
            let context = ''
            if (data.jobDescription) context += `\n\nTarget Job Description:\n${data.jobDescription}`
            if (data.company) context += `\nTarget Company: ${data.company}`
            if (data.jobTitle) context += `\nTarget Title: ${data.jobTitle}`
            const truncatedResume = resumeText.length > 30000 ? resumeText.slice(0, 30000) + '\n\n[Truncated]' : resumeText
            const result = await chatJson(prompts['rewrite'], `Rewrite this resume (${focus} focus):\n\n${truncatedResume}${context}`)
            return jsonResponse(res, 200, { rewritten: result })

          } else if (url === 'rank-candidates') {
            const jobDescription = typeof data.jobDescription === 'string' ? data.jobDescription : ''
            const resumes = Array.isArray(data.resumes) ? data.resumes : []
            if (jobDescription.length < 50 || resumes.length === 0) {
              return jsonResponse(res, 400, { error: 'Job description and at least one resume are required.' })
            }
            const parts = [`JOB DESCRIPTION:\n${jobDescription}`]
            if (typeof data.jobTitle === 'string' && data.jobTitle) parts.push(`\nJOB TITLE: ${data.jobTitle}`)
            if (typeof data.company === 'string' && data.company) parts.push(`COMPANY: ${data.company}`)
            parts.push('')
            resumes.forEach((r, i) => {
              const text = typeof r.text === 'string' ? r.text.slice(0, 2200) : ''
              parts.push(`CANDIDATE ${i + 1} — id: "${r.id}", fileName: "${r.fileName}"\n${text}`)
            })
            const result = await chatJson(prompts['rank-candidates'], parts.join('\n\n'))
            const raw = Array.isArray((result as { ranking?: unknown }).ranking)
              ? (result as { ranking: Record<string, unknown>[] }).ranking
              : Array.isArray((result as { candidates?: unknown }).candidates)
                ? (result as { candidates: Record<string, unknown>[] }).candidates
                : []
            return jsonResponse(res, 200, { ranking: raw })

          } else if (url === 'coach') {
            const message = typeof data.message === 'string' ? data.message : ''
            const reply = `Great question! When addressing **"${message}"**, focus on demonstrating quantifiable business impact. Frame your achievements using the Google X-Y-Z method: *"Accomplished [X] as measured by [Y], by doing [Z]"*. Also make sure your technical skills match the target job description keywords.`
            return jsonResponse(res, 200, {
              reply,
              suggestions: [
                'How can I rewrite my experience bullets?',
                'What ATS keywords should I add?',
                'Give me 3 behavioral interview questions',
              ],
            })

          } else if (url === 'interview') {
            const jobTitle = typeof data.jobTitle === 'string' ? data.jobTitle : 'Software Engineer'
            const company = typeof data.company === 'string' ? data.company : 'Company'
            const matchingSkills = Array.isArray(data.matchingSkills) ? data.matchingSkills : ['React', 'TypeScript']
            const missingSkills = Array.isArray(data.missingSkills) ? data.missingSkills : ['Docker']
            return jsonResponse(res, 200, {
              questions: [
                {
                  id: 'q-dev-1',
                  category: 'Technical & Architecture',
                  difficulty: 'Challenging',
                  question: `How would you architect an end-to-end scalable application for ${company} utilizing ${matchingSkills[0] || 'React'} and modern best practices?`,
                  whyTheyAsk: 'Evaluates your technical depth, architectural boundaries, and performance awareness.',
                  keyPointsToHit: [
                    'Component separation & state isolation',
                    'Caching layers and API request optimization',
                    'Testing and error boundary resiliency',
                  ],
                  modelAnswer: `In my last production project, I structured our frontend using modular feature boundaries and unified schema validation, cutting bundle size by 35% and keeping p95 latency under 100ms.`,
                },
                {
                  id: 'q-dev-2',
                  category: 'Resume Deep Dive & Gaps',
                  difficulty: 'Senior',
                  question: `This role at ${company} requires hands-on familiarity with ${missingSkills[0] || 'Cloud Infrastructure'}. How will you ramp up and ensure production velocity in your first month?`,
                  whyTheyAsk: 'Tests intellectual humility, rapid learning speed, and practical plan to close skill gaps.',
                  keyPointsToHit: [
                    'Acknowledge existing transferrable conceptual knowledge',
                    'Outline a structured sandbox learning project',
                    'Commit to delivering peer-reviewed pull requests within 30 days',
                  ],
                  modelAnswer: `I have strong foundational knowledge in adjacent architectures. In my first two weeks, I build sandbox prototypes and pair with senior team members to master team-specific deployment patterns.`,
                },
              ],
            })

          } else {
            return jsonResponse(res, 404, { error: `Unknown endpoint: ${url}` })
          }
        } catch (err) {
          console.error('[API Error]', err)
          const message = err instanceof Error ? err.message : 'Analysis failed'
          return jsonResponse(res, 500, {
            error: message,
            code: 'ANALYSIS_FAILED',
          })
        }
      })
    },
  }
}
