/**
 * AI Resume Coach Client Library
 * Handles chat communication with Hirely Coach, maintaining context and suggestions.
 */

import type { CoachMessage, AnalysisResult } from '../types'

export interface AskCoachParams {
  message: string
  resume?: AnalysisResult | null
  history?: CoachMessage[]
}

export interface CoachResponse {
  reply: string
  suggestions: string[]
}

/**
 * Generates smart client-side coaching advice if backend is unavailable
 */
function getOfflineCoachAdvice(message: string, resume?: AnalysisResult | null): CoachResponse {
  const lower = message.toLowerCase()

  if (lower.includes('bullet') || lower.includes('experience') || lower.includes('work')) {
    const role = resume?.extracted.experience?.[0]?.split('\n')[0] || 'Software Engineer'
    return {
      reply: `Here is how to elevate your bullet points for **${role}**:\n\n- **Formula**: **Strong Action Verb** + **Measurable Outcome (%, $, hours)** + **Tech / Method Used**\n- **Before**: *"Built features for the frontend using React and improved performance."*\n- **After**: *"Architected and deployed 4 high-traffic React 19 micro-frontends, reducing LCP by 42% and accelerating page load time across 250k daily active users."*\n\nTry running this template through your top 2 projects!`,
      suggestions: [
        'Rewrite my summary section',
        'What skills should I add?',
        'How to prepare for system design questions?',
      ],
    }
  }

  if (lower.includes('ats') || lower.includes('keyword') || lower.includes('score')) {
    const score = resume?.ats.score || 78
    return {
      reply: `Your current estimated ATS score is **${score}/100**.\n\n### Top 3 ATS Optimization Rules:\n1. **Standard Headings**: Keep headings clean: *Work Experience*, *Education*, *Technical Skills* (avoid creative names like *My Journey*).\n2. **Clean Typography**: Avoid tables, multi-column text boxes, or non-standard fonts.\n3. **Exact Keyword Matches**: Mirror the job description keywords exactly as written in the JD (e.g. if JD says "TypeScript", do not only say "TS").`,
      suggestions: [
        'Check my bullet points',
        'What are my biggest resume gaps?',
        'How do I tailor for a specific job?',
      ],
    }
  }

  if (lower.includes('interview') || lower.includes('question') || lower.includes('mock')) {
    return {
      reply: `Here are 3 high-probability interview questions tailored to your background:\n\n1. **Behavioral (STAR method)**: *"Tell me about a time you identified a critical production performance bottleneck. What metrics did you use to diagnose and fix it?"*\n2. **Technical Depth**: *"How do you approach state management and component boundary optimization when scaling web applications?"*\n3. **Cross-functional**: *"Describe a project where you had to push back on a product requirement due to technical constraints. How did you align the team?"*`,
      suggestions: [
        'How do I answer question 1 using STAR?',
        'How can I answer question 2 effectively?',
        'What salary should I ask for?',
      ],
    }
  }

  if (lower.includes('summary') || lower.includes('about')) {
    const name = resume?.extracted.name || 'Candidate'
    const skills = resume?.skills.detected.slice(0, 4).join(', ') || 'React, TypeScript, Cloud'
    return {
      reply: `Here is a high-converting, ATS-compliant 2-sentence summary for your resume:\n\n> *"Performance-driven software engineer with proven expertise in ${skills}. Track record of architecting scalable applications and collaborating with cross-functional teams to deliver business-critical products on schedule."*`,
      suggestions: [
        'Make this more senior/leadership focused',
        'Make this geared towards startups',
        'Critique my work experience',
      ],
    }
  }

  return {
    reply: `Here are key takeaways regarding **"${message}"**:\n\n- **Quantify Impact**: Numbers catch the recruiter's eye in the 6-second scan. Include percentages, user counts, or latency reductions.\n- **Align with Job Requirements**: Make sure the first half of your first page directly proves you meet the top 3 requirements of the role.\n- **Focus on Outcomes**: Shift focus from *what tasks you did* to *what business results were achieved*.\n\nWhat specific part of your resume would you like to review next?`,
    suggestions: [
      'Rewrite my top bullet point',
      'What are my biggest resume gaps?',
      'Prepare me for behavioral interviews',
    ],
  }
}

/**
 * Sends a message to the Hirely Coach API or returns structured intelligent coaching
 */
export async function askCoach({ message, resume, history }: AskCoachParams): Promise<CoachResponse> {
  try {
    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        resumeContext: resume
          ? {
              name: resume.extracted.name,
              title: resume.extracted.professionalSummary,
              skills: resume.skills.detected,
              atsScore: resume.ats.score,
              targetJob: resume.jobTarget?.title || resume.jobTarget?.company,
              resumeSnippet: resume.resumeText.slice(0, 3000),
            }
          : undefined,
        history: (history || []).slice(-6).map((h) => ({
          role: h.sender === 'user' ? 'user' : 'assistant',
          content: h.text,
        })),
      }),
    })

    if (!res.ok) {
      return getOfflineCoachAdvice(message, resume)
    }

    const data = await res.json()
    return {
      reply: data.reply || getOfflineCoachAdvice(message, resume).reply,
      suggestions: data.suggestions?.length ? data.suggestions : ['Rewrite my bullets', 'ATS tips', 'Mock questions'],
    }
  } catch {
    return getOfflineCoachAdvice(message, resume)
  }
}

