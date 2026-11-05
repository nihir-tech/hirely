/**
 * Intelligent Job Matching & Recommendation Engine
 * Analyzes resume skills, experience, and domains to determine "Best Fit For You"
 * job openings, calculates match scores, and provides custom reasoning.
 */

import type { AnalysisResult, JobOpening, JobMatchAlert } from '../types'
import { CURATED_JOB_OPENINGS } from './jobOpenings'

/**
 * Normalizes skill strings for fuzzy matching
 * e.g., "React.js" -> "react", "NodeJS" -> "node"
 */
function normalizeSkill(s: string): string {
  return s
    .toLowerCase()
    .replace(/\.js\b/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9#+]/g, '')
}

/**
 * Checks if a candidate has a specific skill in their extracted skills or text
 */
function hasSkill(candidateSkills: string[], resumeText: string, targetSkill: string): boolean {
  const normTarget = normalizeSkill(targetSkill)
  // 1. Direct normalized skill match
  if (candidateSkills.some((s) => normalizeSkill(s) === normTarget || normalizeSkill(s).includes(normTarget))) {
    return true
  }
  // 2. Word boundary search in resume text
  const regex = new RegExp(`\\b${targetSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  return regex.test(resumeText)
}

/**
 * Matches a resume against a single job opening
 */
export function matchResumeToJob(resume: AnalysisResult, opening: JobOpening): JobMatchAlert {
  const candidateSkills = [
    ...(resume.skills.detected || []),
    ...(resume.extracted.skills || []),
  ]
  const resumeText = resume.resumeText || ''

  const matchingSkills: string[] = []
  const missingSkills: string[] = []

  for (const req of opening.requiredSkills) {
    if (hasSkill(candidateSkills, resumeText, req)) {
      matchingSkills.push(req)
    } else {
      missingSkills.push(req)
    }
  }

  // Bonus for preferred skills
  let preferredMatches = 0
  if (opening.preferredSkills) {
    for (const pref of opening.preferredSkills) {
      if (hasSkill(candidateSkills, resumeText, pref)) {
        preferredMatches++
        if (!matchingSkills.includes(pref)) {
          matchingSkills.push(pref)
        }
      }
    }
  }

  // Base score from required skill ratio (weight 65%)
  const reqTotal = opening.requiredSkills.length || 1
  const reqRatio = matchingSkills.filter((s) => opening.requiredSkills.includes(s)).length / reqTotal

  // Experience / domain relevance (weight 25%)
  const titleWords = opening.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  const matchesTitle = titleWords.some((w) => resumeText.toLowerCase().includes(w)) ? 1 : 0.6

  // ATS score booster (weight 10%)
  const atsFactor = Math.min((resume.ats.score || 70) / 100, 1)

  // Preferred skills bonus
  const prefBonus = Math.min(preferredMatches * 0.05, 0.15)

  let rawScore = reqRatio * 65 + matchesTitle * 20 + atsFactor * 10 + prefBonus * 10
  // Ensure score is between 45 and 98
  rawScore = Math.min(98, Math.max(45, Math.round(rawScore)))

  const isNearMiss = rawScore >= 60 && rawScore <= 84 && missingSkills.length > 0

  let fitBadge: JobMatchAlert['fitBadge'] = 'Good Match'
  if (rawScore >= 88) {
    fitBadge = 'Best Fit For You'
  } else if (rawScore >= 75) {
    fitBadge = 'High Match'
  } else if (isNearMiss) {
    fitBadge = 'Near-Miss Match'
  }

  // Generate personalized match reasoning
  const topMatched = matchingSkills.slice(0, 3).join(', ')
  let matchReason = ''
  if (rawScore >= 88) {
    matchReason = `Your strong background in ${topMatched || 'core engineering'} directly matches this ${opening.title} role at ${opening.company}. Your experience profile puts you in the top candidate tier.`
  } else if (rawScore >= 75) {
    matchReason = `You meet most core requirements including ${topMatched || 'key technical skills'}. Adding a few emphasized keywords can push you to top match status.`
  } else if (isNearMiss) {
    matchReason = `Near-miss opportunity! You already match ${matchingSkills.length} skills (${topMatched || 'core foundations'}). Closing the gap on ${missingSkills.slice(0, 2).join(' and ')} can elevate you to top candidate status.`
  } else {
    matchReason = `This position aligns with your broader experience. Highlighting ${missingSkills.slice(0, 2).join(' and ') || 'relevant tools'} will strengthen your application.`
  }

  const highlightedAdvantages: string[] = []
  if (matchingSkills.length >= 3) {
    highlightedAdvantages.push(`Matched ${matchingSkills.length} key required technologies (${matchingSkills.slice(0, 4).join(', ')})`)
  }
  if (resume.ats.score >= 80) {
    highlightedAdvantages.push(`High ATS compliance (${resume.ats.score}/100) ensures your resume parses cleanly`)
  }
  if (opening.type.includes('Remote')) {
    highlightedAdvantages.push('Remote flexibility aligns with your modern tech stack')
  }

  const gapSummary = missingSkills.length > 0
    ? `Missing ${missingSkills.slice(0, 2).join(' and ')} (${missingSkills.length} gap${missingSkills.length > 1 ? 's' : ''})`
    : 'Full keyword match'

  return {
    opening,
    score: rawScore,
    fitBadge,
    matchReason,
    matchingSkills,
    missingSkills,
    highlightedAdvantages,
    isNearMiss,
    gapSummary,
  }
}

/**
 * Finds and ranks all job openings for a given resume, highlighting top matches
 */
export function getJobRecommendationsForResume(
  resume: AnalysisResult,
  openings: JobOpening[] = CURATED_JOB_OPENINGS,
): JobMatchAlert[] {
  const matches = openings.map((op) => matchResumeToJob(resume, op))
  return matches.sort((a, b) => b.score - a.score)
}

