import type { VercelRequest, VercelResponse } from '@vercel/node'
import { chatJson } from './_lib/ai'

const INTERVIEW_SYSTEM_PROMPT = `You are an elite technical recruiter and hiring director at a top technology company.
Your task is to generate 6-8 tailored, realistic interview questions for a candidate applying to a specific role, based on their resume background and the target job description.

Structure the response as valid JSON with a "questions" array.
Each question object MUST have:
- "id": string unique id (e.g. "q-1", "q-2")
- "category": exactly one of "Technical & Architecture", "Resume Deep Dive & Gaps", "Behavioral (STAR)", "Questions to Ask Them"
- "difficulty": "Standard", "Challenging", or "Senior"
- "question": string the exact question
- "whyTheyAsk": string why the interviewer asks this and what they evaluate
- "keyPointsToHit": array of 3 bullet point strings the candidate should mention
- "modelAnswer": string a complete high-scoring model answer using the STAR format (Situation, Task, Action, Result) or structured narrative

Ensure questions specifically address any skills the candidate lacks or transitions they are making, as well as the company's tech stack and size.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { jobTitle, company, jobDescription, requiredSkills, matchingSkills, missingSkills, resumeText } = req.body || {}

    if (!jobTitle || !company) {
      return res.status(400).json({ error: 'jobTitle and company are required.' })
    }

    const userPrompt = `Target Position: ${jobTitle} @ ${company}
Job Description:
${(jobDescription || '').slice(0, 3000)}

Required Skills: ${(requiredSkills || []).join(', ')}
Candidate Matching Skills: ${(matchingSkills || []).join(', ')}
Candidate Missing Skills / Gaps: ${(missingSkills || []).join(', ')}

Candidate Resume Excerpt:
${(resumeText || '').slice(0, 3000)}

Generate 6-8 tailored interview questions according to the system prompt instructions.`

    const result = await chatJson({
      system: INTERVIEW_SYSTEM_PROMPT,
      user: userPrompt,
      temperature: 0.4,
      maxTokens: 4000,
    })

    const questions = Array.isArray((result as any).questions) ? (result as any).questions : []
    return res.status(200).json({ questions })
  } catch (err) {
    console.error('[API interview Error]', err)
    return res.status(500).json({ error: 'Failed to generate interview questions' })
  }
}

