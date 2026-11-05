/**
 * AI & Rule-Based Interview Question Generator
 * Generates tailored interview questions based on the candidate's specific resume
 * and the target job description, including technical architecture, resume gap inquiries,
 * behavioral STAR templates, and smart reverse-interview questions to ask the employer.
 */

import type { AnalysisResult, InterviewKit, InterviewQuestion, JobMatchAlert, JobOpening } from '../types'

/**
 * Builds offline fallback / instant high-quality tailored interview kit
 */
export function generateInterviewQuestions(
  alert: JobMatchAlert,
  resume?: AnalysisResult | null,
): InterviewKit {
  const { opening, matchingSkills, missingSkills } = alert
  const company = opening.company
  const title = opening.title
  const topSkill = matchingSkills[0] || 'React'
  const secondSkill = matchingSkills[1] || 'TypeScript'
  const primaryGap = missingSkills[0] || 'Cloud Infrastructure'
  const isStartup = opening.companyType === 'Startup / Small Team'
  const candidateName = resume?.extracted.name || 'Candidate'

  const questions: InterviewQuestion[] = [
    // ─── 1. Technical & Architecture ──────────────────────────
    {
      id: 'q-tech-01',
      category: 'Technical & Architecture',
      difficulty: 'Challenging',
      question: `At ${company}, how would you architect an end-to-end feature using ${topSkill} and ${secondSkill} that maintains sub-100ms response times under heavy user concurrency?`,
      whyTheyAsk: `Recruiters and engineering leads want to evaluate your real-world system design depth, state management strategy, and understanding of performance bottlenecks beyond syntax.`,
      keyPointsToHit: [
        `Explain client-side vs server-side boundaries and caching layers (e.g. CDN or in-memory cache).`,
        `Describe state normalization and avoiding unnecessary re-renders or database queries.`,
        `Mention error boundaries, graceful degradation, and structured telemetry/monitoring.`,
      ],
      modelAnswer: `**Situation:** In my previous web application project, user traffic spiked during marketing campaigns, causing UI render lag.\n**Task:** I needed to re-architect our data fetching and component hierarchy in ${topSkill}.\n**Action:** I implemented request memoization and a cache-aside layer, separated heavy computation into web workers, and paginated infinite lists.\n**Result:** We achieved a 65% drop in time-to-interactive (TTI) and maintained sub-80ms render cycles even during peak concurrent loads.`,
    },
    {
      id: 'q-tech-02',
      category: 'Technical & Architecture',
      difficulty: 'Standard',
      question: `Walk me through a complex bug or production incident you diagnosed in ${topSkill}. What was your step-by-step troubleshooting methodology?`,
      whyTheyAsk: `Assesses your debugging acumen, patience under pressure, and systematic problem isolation rather than random guessing.`,
      keyPointsToHit: [
        `Reproducing the issue in an isolated sandbox or staging environment.`,
        `Analyzing network payloads, memory heap profiles, or server logs.`,
        `Writing an automated regression test to ensure the issue never re-occurs.`,
      ],
      modelAnswer: `**Situation:** A subtle memory leak was causing browser tabs to crash after 20 minutes of active dashboard usage.\n**Task:** Identify the memory retention source and patch it without disrupting client sessions.\n**Action:** Using Chrome DevTools Memory Heap Snapshots, I isolated detached DOM nodes caused by an uncleaned event listener inside a custom ${topSkill} hook. I refactored the lifecycle cleanup and added automated lint rules for effect subscriptions.\n**Result:** Memory usage remained flat under 45MB over multi-hour sessions with zero recorded tab crashes.`,
    },

    // ─── 2. Resume Gap & Transition Inquiries ──────────────────
    {
      id: 'q-gap-01',
      category: 'Resume Deep Dive & Gaps',
      difficulty: 'Senior',
      question: `We see you have a strong foundation in ${matchingSkills.slice(0, 3).join(', ')}, but this role requires hands-on experience with ${primaryGap}. How will you bridge this gap in your first 30 days?`,
      whyTheyAsk: `The hiring manager already knows you don't have extensive production years in ${primaryGap}. They want to see your speed of learning, humility, self-starter mentality, and actionable plan.`,
      keyPointsToHit: [
        `Acknowledge the gap directly without being defensive or pretending.`,
        `Draw clear parallels from similar technologies or concepts you already master.`,
        `Provide a concrete 30-day learning milestone plan (docs, sandbox project, code reviews).`,
      ],
      modelAnswer: `**Direct Answer:** "While my primary production background is focused on ${topSkill}, the architectural concepts behind ${primaryGap} directly translate to the systems I have already built. In my previous role, I picked up ${secondSkill} in less than two weeks by building an internal proof-of-concept. For ${primaryGap}, I have already completed foundational sandbox projects and will pair with senior engineers during sprint 1 to master your team's specific deployment patterns. By day 30, I expect to be submitting independent pull requests in ${primaryGap}."`,
    },
    {
      id: 'q-gap-02',
      category: 'Resume Deep Dive & Gaps',
      difficulty: 'Standard',
      question: `Looking at your resume, what is the single project you are most proud of, and if you had to rebuild it today, what architectural decisions would you change?`,
      whyTheyAsk: `Tests intellectual honesty, reflection, and technical growth. Candidates who think their past code was flawless usually lack senior perspective.`,
      keyPointsToHit: [
        `Briefly highlight the business impact of your proudest project.`,
        `Identify 1-2 real architectural trade-offs you made due to time constraints or knowledge at the time.`,
        `Explain how modern patterns (e.g. better type schemas, modular separation) would improve it today.`,
      ],
      modelAnswer: `**Situation:** I led the development of our customer onboarding flow, which increased user conversion by 28%.\n**Reflection:** While the feature was a business success, we tightly coupled form validation state to the UI components.\n**What I'd change today:** If rebuilding it today, I would decouple the form engine using headless schemas like Zod, introduce optimistic UI updates, and isolate business logic into dedicated pure domain hooks for easier unit testing.`,
    },

    // ─── 3. Behavioral (STAR) ──────────────────────────────────
    {
      id: 'q-beh-01',
      category: 'Behavioral (STAR)',
      difficulty: 'Standard',
      question: isStartup
        ? `As a lean team (${opening.teamSize || '10-25 people'}), priorities change rapidly and specifications can be ambiguous. Tell me about a time you had to deliver results with incomplete requirements.`
        : `Tell me about a time you had a strong technical disagreement with a teammate or product manager on how to implement a feature. How did you resolve it?`,
      whyTheyAsk: isStartup
        ? `Evaluates autonomous execution, self-direction, and bias for action without hand-holding.`
        : `Evaluates communication, empathy, egoless engineering, and commitment to business objectives.`,
      keyPointsToHit: [
        `Focus on facts, user data, and prototypes rather than subjective opinions.`,
        `Highlight active listening and understanding the other stakeholder's constraints.`,
        `Show that you can disagree and commit once a decision is finalized.`,
      ],
      modelAnswer: isStartup
        ? `**Situation:** We needed to launch a new export integration before a partner deadline, but the API specs were only 50% defined.\n**Task:** Deliver a working alpha without waiting for three rounds of meetings.\n**Action:** I designed a flexible adapter layer and mocked the expected data contract with TypeScript interfaces. I shared the mock interface with the partner within 24 hours to validate assumptions.\n**Result:** When the final specs arrived, our adapter only required 2 hours of adjustments, and we delivered the integration 3 days ahead of deadline.`
        : `**Situation:** Our backend engineer wanted to implement a complex event sourcing architecture, whereas I advocated for a simpler PostgreSQL transactional model to hit our Q3 launch.\n**Task:** Align the engineering team on a maintainable path that meets business deadlines.\n**Action:** Rather than arguing in chat, I scheduled a 30-minute whiteboard session where we mapped estimated dev hours, failure modes, and expected scale. We agreed to start with PostgreSQL for phase 1 and document the event-sourcing migration triggers.\n**Result:** We launched on time with zero production incidents, and the simple model handled our traffic smoothly for over a year.`,
    },

    // ─── 4. Questions YOU Should Ask Them ──────────────────────
    {
      id: 'q-rev-01',
      category: 'Questions to Ask Them',
      difficulty: 'Standard',
      question: `For the Interviewer: "What does success look like for this ${title} role in the first 90 days, and what is the biggest technical bottleneck currently blocking the engineering team?"`,
      whyTheyAsk: `Signals that you are already mentally operating in the role and focused on delivering high-impact value from day one.`,
      keyPointsToHit: [
        `Listen carefully for mentions of technical debt, team communication, or delivery speed.`,
        `Follow up with how your specific strengths (e.g. ${topSkill}) can help solve that exact bottleneck.`,
      ],
      modelAnswer: `**Why this question wins:** It flips the dynamic from being evaluated to collaborating as a peer problem solver. Interviewers love discussing their engineering challenges with proactive candidates.`,
    },
    {
      id: 'q-rev-02',
      category: 'Questions to Ask Them',
      difficulty: 'Standard',
      question: isStartup
        ? `For the Founder / Lead: "With ${company}'s current stage, how do you balance technical speed to market versus paying down technical debt? How does engineering influence product roadmap decisions?"`
        : `For the Interviewer: "How does the team handle code reviews, continuous deployment, and testing? What is your typical release cadence from PR merge to production?"`,
      whyTheyAsk: `Shows you understand engineering maturity and care deeply about working in a healthy, sustainable software environment.`,
      keyPointsToHit: [
        `Demonstrates you are a craftsman who cares about code quality and developer experience.`,
        `Helps you assess if this company is a healthy environment for your career.`,
      ],
      modelAnswer: `**Why this question wins:** Shows maturity and long-term thinking. High-caliber engineers care about deployment velocity and CI/CD hygiene.`,
    },
  ]

  return {
    jobTitle: title,
    company,
    candidateName,
    questions,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Calls AI endpoint with fallback to generate fresh interview questions
 */
export async function fetchAiInterviewQuestions(
  alert: JobMatchAlert,
  resume?: AnalysisResult | null,
): Promise<InterviewKit> {
  try {
    const res = await fetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTitle: alert.opening.title,
        company: alert.opening.company,
        jobDescription: alert.opening.description,
        requiredSkills: alert.opening.requiredSkills,
        matchingSkills: alert.matchingSkills,
        missingSkills: alert.missingSkills,
        resumeText: resume?.resumeText?.slice(0, 5000) || '',
        candidateName: resume?.extracted.name || 'Candidate',
      }),
    })

    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        return {
          jobTitle: alert.opening.title,
          company: alert.opening.company,
          candidateName: resume?.extracted.name || 'Candidate',
          questions: data.questions,
          generatedAt: new Date().toISOString(),
        }
      }
    }
  } catch {
    // Fall back to rule-based generator
  }

  return generateInterviewQuestions(alert, resume)
}
