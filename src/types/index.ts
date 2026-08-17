// ─── Severity ──────────────────────────────────────────────
export type Severity = 'high' | 'medium' | 'low'

// ─── Scores ────────────────────────────────────────────────
export interface ScoreCategory {
  key: string
  label: string
  score: number
  description: string
}

export interface ScoreBreakdown {
  overall: number
  categories: ScoreCategory[]
}

// ─── Resume Analysis Feedback ──────────────────────────────
export interface Strength {
  title: string
  description: string
}

export interface Problem {
  title: string
  description: string
  severity: Severity
}

export interface QuickWin {
  title: string
  description: string
}

export interface MissingInfo {
  field: string
  description: string
}

// ─── Section Review ────────────────────────────────────────
export interface SectionReviewItem {
  what: string
  why: string
  change: string
  example?: string
}

export interface SectionReview {
  summary: SectionReviewItem[]
  experience: SectionReviewItem[]
  education: SectionReviewItem[]
  skills: SectionReviewItem[]
  projects: SectionReviewItem[]
  certifications: SectionReviewItem[]
  achievements: SectionReviewItem[]
}

// ─── ATS Analysis ──────────────────────────────────────────
export interface AtsConcern {
  issue: string
  risk: string
  recommendation: string
  severity: Severity
}

export interface AtsAnalysis {
  score: number
  concerns: AtsConcern[]
  positives: string[]
}

// ─── Bullet & Summary Feedback ─────────────────────────────
export interface BulletFeedback {
  original: string
  issue: string
  suggestion: string
  reason: string
}

export interface SummarySuggestion {
  current?: string
  suggested: string
  reason: string
}

// ─── Skills Assessment ─────────────────────────────────────
export interface SkillsAssessment {
  detected: string[]
  recommended: string[]
}

// ─── Extracted Resume Info ─────────────────────────────────
export interface ExtractedResumeInfo {
  name?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  github?: string
  portfolio?: string
  professionalSummary?: string
  detectedSections: string[]
  education: string[]
  experience: string[]
  projects: string[]
  skills: string[]
  certifications: string[]
  achievements: string[]
  publications: string[]
  other: string[]
}

// ─── Analysis Result ───────────────────────────────────────
export interface AnalysisResult {
  id: string
  createdAt: string
  updatedAt: string
  fileName: string
  fileType: string
  fileSize: number
  resumeText: string
  extracted: ExtractedResumeInfo
  scores: ScoreBreakdown
  strengths: Strength[]
  problems: Problem[]
  quickWins: QuickWin[]
  missingInfo: MissingInfo[]
  sections: SectionReview
  ats: AtsAnalysis
  bullets: BulletFeedback[]
  summarySuggestions: SummarySuggestion[]
  skills: SkillsAssessment
  jobTarget?: JobTarget
  jobMatch?: JobMatchResult
  rewritten?: RewrittenResume
}

// ─── Job Target & Match ────────────────────────────────────
export interface JobTarget {
  company?: string
  title?: string
  jobDescription: string
  jobUrl?: string
}

export interface JobExtracted {
  title: string
  company: string
  requiredSkills: string[]
  preferredSkills: string[]
  softSkills: string[]
  qualifications: string[]
  responsibilities: string[]
  keywords: string[]
  technologies: string[]
  certifications: string[]
  yearsExperience?: string
  seniorityLevel?: string
}

export interface SkillMatch {
  skill: string
  status: 'matched' | 'missing' | 'weak'
  explanation: string
  evidence?: string
}

export interface ChangeSuggestion {
  id: string
  section: string
  current?: string
  suggested: string
  reason: string
  accepted?: boolean | null
}

export interface JobMatchResult {
  extracted: JobExtracted
  score: number
  skills: SkillMatch[]
  atsConcerns: AtsConcern[]
  changes: ChangeSuggestion[]
  notes: string[]
}

// ─── Rewritten Resume ──────────────────────────────────────
export interface RewrittenResume {
  markdown: string
  notes: string[]
  createdAt: string
}

// ─── Resume Version ────────────────────────────────────────
export interface ResumeVersion {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  markdown: string
  sourceAnalysisId: string
}

// ─── UI State ──────────────────────────────────────────────
export type TabItem = {
  id: string
  label: string
  icon?: string
}

export type UploadPhase =
  | 'idle'
  | 'validating'
  | 'reading'
  | 'parsing'
  | 'analyzing'
  | 'complete'
  | 'error'

export interface UploadState {
  phase: UploadPhase
  progress: number
  message: string
  error?: string
}

// ─── API Response Types ────────────────────────────────────
export interface ApiError {
  error: string
  code: string
  details?: string
}

export interface AnalyzeRequest {
  text: string
}

export interface AnalyzeResponse {
  analysis: Omit<AnalysisResult, 'id' | 'createdAt' | 'updatedAt' | 'fileName' | 'fileType' | 'fileSize' | 'resumeText'>
}

export interface JobMatchRequest {
  resumeText: string
  jobDescription: string
  company?: string
  jobTitle?: string
  jobUrl?: string
}

export interface JobMatchResponse {
  jobMatch: JobMatchResult
}

export interface RewriteRequest {
  resumeText: string
  jobDescription?: string
  company?: string
  jobTitle?: string
  focus: 'general' | 'job'
}

export interface RewriteResponse {
  rewritten: Omit<RewrittenResume, 'createdAt'>
}
