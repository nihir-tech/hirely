import type { VercelRequest, VercelResponse } from '@vercel/node'

const AI_API_KEY = process.env.OPENAI_API_KEY

const CANDIDATE_MODELS = [
  process.env.OPENAI_MODEL,
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-flash-lite-latest',
].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i)

const COACH_SYSTEM_PROMPT = `You are Hirely Coach, an elite AI career mentor and ATS resume specialist.
Your goal is to help candidates land high-paying job interviews by refining their resume, strengthening bullet points with measurable impact (X-Y-Z formula), preparing for tough interview questions, and closing skill gaps.

Guidelines:
- Be encouraging, concise, and direct.
- When suggesting resume bullet points, make them copy-paste ready with bold action verbs and quantified impact.
- Point out ATS vulnerabilities when relevant.
- Format responses in clean markdown with bullet points and bold highlights.
- End with 2-3 quick follow-up prompt ideas wrapped in [SUGGESTIONS: question 1 | question 2 | question 3].`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { message, resumeContext } = req.body || {}

    if (!message) {
      return res.status(400).json({ error: 'message is required.' })
    }

    if (!AI_API_KEY) {
      return res.status(200).json({
        reply: `Here's my advice on **"${message}"**:\n\n1. **Lead with strong action verbs**: Use words like *Spearheaded, Architected, Accelerated, Reduced*.\n2. **Use the Google X-Y-Z formula**: *"Accomplished [X] as measured by [Y], by doing [Z]"*.\n3. **Tailor keywords**: Align your tech stack with the job description.\n\nWould you like me to rewrite a specific bullet point from your resume?`,
        suggestions: ['Rewrite my top experience bullet', 'What ATS keywords should I add?', 'Mock interview question'],
      })
    }

    const contextStr = resumeContext
      ? `Candidate Resume Context:\nName: ${resumeContext.name || 'Candidate'}\nTitle/Headline: ${resumeContext.title || 'Professional'}\nSkills: ${(resumeContext.skills || []).join(', ')}\nATS Score: ${resumeContext.atsScore || 'N/A'}\nTarget: ${resumeContext.targetJob || 'General Tech'}\n\nResume Excerpt:\n${(resumeContext.resumeSnippet || '').slice(0, 4000)}`
      : 'No specific resume loaded.'

    const promptText = `${COACH_SYSTEM_PROMPT}\n\n${contextStr}\n\nUser Question:\n${message}`

    let rawText = ''

    for (const model of CANDIDATE_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${AI_API_KEY}`
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        })

        if (response.status === 503 || response.status === 429) {
          continue // try next model
        }

        if (response.ok) {
          const data = await response.json()
          rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
          if (rawText) break
        }
      } catch {
        continue
      }
    }

    if (!rawText) {
      return res.status(200).json({
        reply: `Here is a recommendation for **"${message}"**:\n\n- **Quantify Results**: Highlight metrics like percentage improvements or volume processed.\n- **Align with Keywords**: Check the target job description to match exact technologies.\n\nWould you like me to review a specific section?`,
        suggestions: ['Rewrite my top bullet point', 'What are my biggest resume gaps?', 'Mock interview question'],
      })
    }

    // Extract [SUGGESTIONS: ...]
    const match = rawText.match(/\[SUGGESTIONS:\s*(.*?)\]/)
    let suggestions = ['How can I highlight leadership?', 'Review my skills section', 'Give me 3 interview questions']
    let cleanReply = rawText

    if (match) {
      cleanReply = rawText.replace(match[0], '').trim()
      suggestions = match[1].split('|').map((s: string) => s.trim()).filter(Boolean)
    }

    return res.status(200).json({
      reply: cleanReply,
      suggestions,
    })
  } catch (err) {
    console.error('[coach]', err)
    const message = err instanceof Error ? err.message : 'Coach failed to respond'
    return res.status(500).json({ error: message, code: 'COACH_FAILED' })
  }
}
