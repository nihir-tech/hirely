const AI_API_KEY = process.env.OPENAI_API_KEY

// Primary and fallback models to cascade through if one experiences high demand (503/429)
const CANDIDATE_MODELS = [
  process.env.OPENAI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i)

function getApiKey(): string {
  if (!AI_API_KEY) {
    throw new Error('AI is not configured. Set OPENAI_API_KEY in Vercel environment variables.')
  }
  return AI_API_KEY
}

export interface ChatOptions {
  system: string
  user: string
  temperature?: number
  maxTokens?: number
}

export async function chatJson({
  system,
  user,
  temperature = 0,
  maxTokens = 4000,
}: ChatOptions): Promise<Record<string, unknown>> {
  const apiKey = getApiKey()
  let lastError: Error | null = null

  // Try across available candidate models
  for (let mIdx = 0; mIdx < CANDIDATE_MODELS.length; mIdx++) {
    const currentModel = CANDIDATE_MODELS[mIdx]
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`

    // Up to 2 quick attempts per model
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
              temperature,
              maxOutputTokens: maxTokens,
              responseMimeType: 'application/json',
            },
          }),
        })

        // Model overloaded (503) or rate limited (429) -> cascade to next model
        if (response.status === 503 || response.status === 429) {
          lastError = new Error('AI model is temporarily experiencing high demand.')
          break // break to next model in CANDIDATE_MODELS
        }

        if (!response.ok) {
          const errText = await response.text()
          // If 404 or bad model name, skip to next model
          if (response.status === 404) {
            lastError = new Error(`Model ${currentModel} not found`)
            break
          }
          throw new Error(`AI API error (${response.status}): ${errText}`)
        }

        const result = await response.json()
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) throw new Error('AI returned empty response')

        try {
          return JSON.parse(text)
        } catch {
          // Sometimes models wrap markdown codeblocks ```json ... ```
          const stripped = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
          return JSON.parse(stripped)
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        // If it's a parse error or non-network, proceed
      }
    }
  }

  throw (
    lastError ||
    new Error('The AI service is experiencing high traffic. Please try clicking Analyze again in a few moments.')
  )
}
