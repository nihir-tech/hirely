import type { Handler } from '@netlify/functions'
import { chatJson } from './_shared/ai'

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
- "modelAnswer": string a complete high-scoring model answer using the STAR format (Situation, Task, Action, Result) or structured narrative`

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
    const data = JSON.parse(event.body || '{}')
    const { jobTitle, company, jobDescription, requiredSkills, matchingSkills, missingSkills, resumeText } = data

    const userPrompt = `Target Position: ${jobTitle} @ ${company}
Job Description:
${(jobDescription || '').slice(0, 3000)}

Required Skills: ${(requiredSkills || []).join(', ')}
Candidate Matching Skills: ${(matchingSkills || []).join(', ')}
Candidate Missing Skills / Gaps: ${(missingSkills || []).join(', ')}

Candidate Resume Excerpt:
${(resumeText || '').slice(0, 3000)}

Generate 6-8 tailored interview questions.`

    const result = await chatJson({
      system: INTERVIEW_SYSTEM_PROMPT,
      user: userPrompt,
      temperature: 0.4,
      maxTokens: 4000,
    })

    const questions = Array.isArray((result as any).questions) ? (result as any).questions : []

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ questions }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to generate interview questions' }),
    }
  }
}

