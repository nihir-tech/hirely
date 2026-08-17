import type { Plugin } from 'vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(__dirname, '.env')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIndex = trimmed.indexOf('=')
  if (eqIndex === -1) continue
  const key = trimmed.slice(0, eqIndex).trim()
  const value = trimmed.slice(eqIndex + 1).trim()
  if (!process.env[key]) process.env[key] = value
}

const GEMINI_API_KEY = process.env.OPENAI_API_KEY
const GEMINI_MODEL = process.env.OPENAI_MODEL || 'gemini-3.5-flash'

function getApiKey(): string {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here') {
    throw new Error('Please set your Gemini API key in .env')
  }
  return GEMINI_API_KEY
}

async function chatJson(system: string, user: string): Promise<Record<string, unknown>> {
  const apiKey = getApiKey()
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  let lastError: Error | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      const delay = Math.pow(2, attempt) * 5000
      await new Promise(r => setTimeout(r, delay))
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
        const errText = await response.text()
        lastError = new Error(`Gemini API (${response.status}): ${errText}`)
        continue
      }

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`Gemini API error (${response.status}): ${err}`)
      }

      const result = await response.json()
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Gemini returned empty response')
      return JSON.parse(text)
    } catch (err) {
      if (err instanceof Error && (err.message.includes('503') || err.message.includes('429'))) {
        lastError = err
        continue
      }
      throw err
    }
  }
  throw lastError || new Error('Gemini API unavailable after retries')
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

function getPrompts(): Record<string, string> {
  if (cachedPrompts) return cachedPrompts
  cachedPrompts = {
    'analyze': loadPrompt('ANALYZE_SYSTEM_PROMPT'),
    'job-match': loadPrompt('JOB_MATCH_SYSTEM_PROMPT'),
    'rewrite': loadPrompt('REWRITE_SYSTEM_PROMPT'),
  }
  return cachedPrompts
}

export function apiPlugin(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
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

        let prompts: Record<string, string>
        try {
          prompts = getPrompts()
        } catch (err) {
          return jsonResponse(res, 500, {
            error: 'Failed to load prompts: ' + (err instanceof Error ? err.message : String(err)),
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
