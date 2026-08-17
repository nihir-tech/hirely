export const APP_NAME = 'Hirely'

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
export const MIN_TEXT_LENGTH = 50
export const MAX_TEXT_LENGTH = 50000

export const ALLOWED_FILE_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WebP',
}

export const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp']

export const ANALYSIS_STORAGE_KEY = 'hirely:analyses'
export const VERSION_STORAGE_KEY = 'hirely:versions'

export const SCORE_THRESHOLDS = {
  excellent: 85,
  good: 70,
  fair: 50,
  poor: 0,
} as const

export const LOADING_MESSAGES = [
  'Reading your resume...',
  'Extracting content...',
  'Analyzing your experience...',
  'Evaluating skills & achievements...',
  'Checking ATS compatibility...',
  'Generating recommendations...',
  'Finalizing analysis...',
]

export const JOB_LOADING_MESSAGES = [
  'Analyzing the job description...',
  'Extracting requirements...',
  'Comparing your skills...',
  'Identifying gaps...',
  'Preparing recommendations...',
]

export const REWRITE_LOADING_MESSAGES = [
  'Preparing your improved resume...',
  'Restructuring content...',
  'Optimizing language...',
  'Applying best practices...',
  'Finalizing document...',
]
