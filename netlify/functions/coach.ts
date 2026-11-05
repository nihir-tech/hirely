import type { Handler } from '@netlify/functions'

const AI_API_KEY = process.env.OPENAI_API_KEY

const CANDIDATE_MODELS = [
  process.env.OPENAI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i)

const COACH_SYSTEM_PROMPT = `You are Hirely Coach, an elite multi-disciplinary AI career mentor, software engineering lead, and technical interview specialist.
You can answer ANY question the user asks with deep expertise, clarity, and actionable guidance.

Capabilities:
- Career & Job Hunt: Resume crafting, ATS optimization, LinkedIn positioning, portfolio critiques, career transitions.
- Technical & Coding: Explaining technical concepts, system design, architecture trade-offs, debugging, writing clean code snippets (React, Node, Python, SQL, Cloud, etc.).
- Interviews & Salary: Behavioral STAR framework answers, technical interview questions, reverse questions, salary and equity negotiation strategies.
- General Knowledge: Career strategy, day-to-day workplace situations, software engineering practices.

Guidelines:
- Give a thorough, direct, and well-structured answer to the user's specific prompt.
- If the user provided resume context and it is relevant to their question, reference it naturally. If they are asking a technical, conceptual, or general question, focus 100% on answering that question expertly without forcing resume advice.
- Format responses in clean markdown with bold points, bullet lists, and code blocks where helpful.
- End with 2-3 quick, relevant follow-up prompt ideas wrapped in [SUGGESTIONS: question 1 | question 2 | question 3].`

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { message, resumeContext } = JSON.parse(event.body || '{}')
    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'message is required.' }) }
    }

    if (!AI_API_KEY) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          reply: `Here's my guidance on **"${message}"**:\n\n1. **Focus on Core Fundamentals**: Be clear and structured.\n2. **Demonstrate Practical Proof**: Real-world projects speak louder than theory.\n\nWhat would you like to explore next?`,
          suggestions: ['How to prepare for tech interviews?', 'Review my skills', 'Mock interview question'],
        }),
      }
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

        if (response.status === 503 || response.status === 429) continue

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
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          reply: `Here is advice regarding **"${message}"**:\n\n- **Be Direct**: Structure your thoughts clearly.\n- **Quantify Results**: Highlight outcomes and metrics.\n\nWould you like more details on this?`,
          suggestions: ['Give me a coding example', 'How do I answer this in an interview?', 'Review my resume'],
        }),
      }
    }

    const match = rawText.match(/\[SUGGESTIONS:\s*(.*?)\]/)
    let suggestions = ['How can I highlight leadership?', 'Review my skills section', 'Give me 3 interview questions']
    let cleanReply = rawText

    if (match) {
      cleanReply = rawText.replace(match[0], '').trim()
      suggestions = match[1].split('|').map((s: string) => s.trim()).filter(Boolean)
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ reply: cleanReply, suggestions }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to process coach message' }),
    }
  }
}
