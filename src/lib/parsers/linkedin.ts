/**
 * LinkedIn Profile Importer & Parser
 * Converts LinkedIn PDF exports and copied profile text into structured resume format
 * ready for ATS scoring, AI coaching, and PDF export.
 */

import type { ExtractedResumeInfo } from '../../types'

export interface ParsedLinkedInProfile {
  name: string
  headline?: string
  email?: string
  phone?: string
  location?: string
  linkedinUrl?: string
  summary?: string
  skills: string[]
  experience: Array<{
    title: string
    company: string
    dates?: string
    description?: string
  }>
  education: Array<{
    school: string
    degree?: string
    field?: string
    dates?: string
  }>
  certifications: string[]
  rawMarkdown: string
}

/**
 * Checks if raw text appears to be from a LinkedIn PDF or profile copy.
 */
export function isLikelyLinkedInText(text: string): boolean {
  const lower = text.toLowerCase()
  return (
    lower.includes('linkedin.com/in/') ||
    lower.includes('top skills') ||
    (lower.includes('experience') && lower.includes('education') && lower.includes('summary')) ||
    lower.includes('contact www.linkedin.com')
  )
}

/**
 * Parses raw text from a LinkedIn "Save to PDF" or pasted LinkedIn profile into structured data.
 */
export function parseLinkedInText(raw: string): ParsedLinkedInProfile {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  let name = ''
  let headline = ''
  let email = ''
  let phone = ''
  let location = ''
  let linkedinUrl = ''
  let summary = ''
  const skills: string[] = []
  const experience: ParsedLinkedInProfile['experience'] = []
  const education: ParsedLinkedInProfile['education'] = []
  const certifications: string[] = []

  let currentSection = 'header'
  let currentBlock: string[] = []

  function flushBlock() {
    if (!currentBlock.length) return
    const text = currentBlock.join(' ')

    if (currentSection === 'summary') {
      summary = summary ? `${summary}\n${text}` : text
    } else if (currentSection === 'skills') {
      const splitSkills = text.split(/[,•·\n]/).map((s) => s.trim()).filter((s) => s.length > 1)
      skills.push(...splitSkills)
    } else if (currentSection === 'experience') {
      const firstLine = currentBlock[0]
      const companyMatch = currentBlock.find((l) => /(company|inc|llc|technologies|ltd|corp)/i.test(l)) || currentBlock[1] || ''
      experience.push({
        title: firstLine,
        company: companyMatch,
        dates: currentBlock.find((l) => /\b(20\d\d|19\d\d)\b/.test(l)),
        description: currentBlock.slice(2).join('\n'),
      })
    } else if (currentSection === 'education') {
      education.push({
        school: currentBlock[0],
        degree: currentBlock[1] || undefined,
        dates: currentBlock.find((l) => /\b(20\d\d|19\d\d)\b/.test(l)),
      })
    } else if (currentSection === 'certifications') {
      certifications.push(currentBlock[0])
    }

    currentBlock = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Top Header info
    if (i === 0 && !name && !line.includes('linkedin')) {
      name = line.replace(/^(Page \d+ of \d+|Contact|www\.)/i, '').trim()
      continue
    }

    if (!headline && i < 5 && !line.includes('@') && !line.includes('http') && line.length > 5) {
      headline = line
      continue
    }

    // Contact info detection
    if (line.includes('@') && !email) {
      const match = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
      if (match) email = match[0]
    }
    if (line.toLowerCase().includes('linkedin.com/in/') && !linkedinUrl) {
      const match = line.match(/(https?:\/\/[^\s]+|www\.linkedin\.com\/in\/[^\s]+|linkedin\.com\/in\/[^\s]+)/i)
      if (match) linkedinUrl = match[0]
    }
    if (/\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(line) && !phone) {
      const match = line.match(/\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/)
      if (match) phone = match[0]
    }
    if (!location && /(greater|area|city|state|united states|india|canada|germany|remote)/i.test(line) && i < 15) {
      location = line
    }

    // Section headings detection
    const lower = line.toLowerCase()
    if (lower === 'summary' || lower === 'about') {
      flushBlock()
      currentSection = 'summary'
      continue
    } else if (lower.includes('top skills') || lower === 'skills') {
      flushBlock()
      currentSection = 'skills'
      continue
    } else if (lower === 'experience' || lower === 'work experience') {
      flushBlock()
      currentSection = 'experience'
      continue
    } else if (lower === 'education') {
      flushBlock()
      currentSection = 'education'
      continue
    } else if (lower.includes('certifications') || lower === 'licenses & certifications') {
      flushBlock()
      currentSection = 'certifications'
      continue
    }

    // Accumulate into current block
    currentBlock.push(line)
  }

  flushBlock()

  if (!name) name = 'Candidate'

  // Generate standardized ATS Markdown
  let rawMarkdown = `# ${name}\n`
  const contactLine: string[] = []
  if (email) contactLine.push(email)
  if (phone) contactLine.push(phone)
  if (location) contactLine.push(location)
  if (linkedinUrl) contactLine.push(linkedinUrl)
  if (contactLine.length) rawMarkdown += `${contactLine.join(' | ')}\n\n`

  if (summary || headline) {
    rawMarkdown += `## Professional Summary\n${summary || headline}\n\n`
  }

  if (skills.length) {
    // Unique skills
    const uniqueSkills = Array.from(new Set(skills))
    rawMarkdown += `## Skills\n${uniqueSkills.join(', ')}\n\n`
  }

  if (experience.length) {
    rawMarkdown += `## Experience\n`
    for (const exp of experience) {
      rawMarkdown += `### ${exp.title} | ${exp.company}${exp.dates ? ` | ${exp.dates}` : ''}\n`
      if (exp.description) rawMarkdown += `${exp.description}\n`
      rawMarkdown += '\n'
    }
  }

  if (education.length) {
    rawMarkdown += `## Education\n`
    for (const edu of education) {
      rawMarkdown += `### ${edu.school}${edu.degree ? ` - ${edu.degree}` : ''}${edu.dates ? ` | ${edu.dates}` : ''}\n\n`
    }
  }

  if (certifications.length) {
    rawMarkdown += `## Certifications\n`
    for (const cert of certifications) {
      rawMarkdown += `- ${cert}\n`
    }
  }

  return {
    name,
    headline,
    email,
    phone,
    location,
    linkedinUrl,
    summary,
    skills: Array.from(new Set(skills)),
    experience,
    education,
    certifications,
    rawMarkdown: rawMarkdown.trim(),
  }
}

/**
 * Creates ExtractedResumeInfo from parsed LinkedIn profile
 */
export function linkedInToExtractedInfo(profile: ParsedLinkedInProfile): ExtractedResumeInfo {
  return {
    name: profile.name,
    email: profile.email || undefined,
    phone: profile.phone || undefined,
    location: profile.location || undefined,
    linkedin: profile.linkedinUrl || undefined,
    professionalSummary: profile.summary || profile.headline || undefined,
    detectedSections: [
      'Contact Information',
      profile.summary ? 'Summary' : null,
      profile.skills.length ? 'Skills' : null,
      profile.experience.length ? 'Experience' : null,
      profile.education.length ? 'Education' : null,
      profile.certifications.length ? 'Certifications' : null,
    ].filter((s): s is string => Boolean(s)),
    skills: profile.skills,
    experience: profile.experience.map((e) => `${e.title} at ${e.company} (${e.dates || 'N/A'})\n${e.description || ''}`),
    education: profile.education.map((e) => `${e.school} - ${e.degree || 'Degree'} (${e.dates || 'N/A'})`),
    projects: [],
    certifications: profile.certifications,
    achievements: [],
    publications: [],
    other: [],
  }
}

