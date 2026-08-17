const GEMINI_API_KEY = process.env.OPENAI_API_KEY
const GEMINI_MODEL = process.env.OPENAI_MODEL || 'gemini-3.5-flash'

function getApiKey(): string {
  if (!GEMINI_API_KEY) {
    throw new Error('AI is not configured. Please set the OPENAI_API_KEY environment variable.')
  }
  return GEMINI_API_KEY
}

export interface ChatOptions {
  system: string
  user: string
  temperature?: number
  maxTokens?: number
}

export async function chatJson({ system, user, temperature = 0.2, maxTokens = 4000 }: ChatOptions): Promise<Record<string, unknown>> {
  const apiKey = getApiKey()
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  let lastError: Error | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 5000))
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${system}\n\n${user}` }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
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
      const errText = await response.text()
      throw new Error(`Gemini API error (${response.status}): ${errText}`)
    }

    const result = await response.json()
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('AI returned an empty response')

    try {
      return JSON.parse(text)
    } catch {
      throw new Error('AI returned invalid JSON. Please try again.')
    }
  }
  throw lastError || new Error('AI service unavailable after retries')
}

export function buildJsonResponse(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export function errorResponse(statusCode: number, message: string, code: string) {
  return buildJsonResponse(statusCode, { error: message, code })
}
