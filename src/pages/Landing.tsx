import { Link } from 'react-router-dom'
import { ScoreRing } from '../components/ui/ScoreRing'
import { Badge } from '../components/ui/Badge'

const STEPS = [
  { num: '1', title: 'Upload Resume', desc: 'Drop your PDF or image — we handle the rest.' },
  { num: '2', title: 'AI Reviews It', desc: 'Get a detailed breakdown of strengths, weaknesses, and ATS readiness.' },
  { num: '3', title: 'Add Your Target Job', desc: 'Paste a job description to see exactly where you match — and where you don\'t.' },
  { num: '4', title: 'Optimize & Apply', desc: 'Accept targeted improvements and download your optimized resume.' },
]

const FEATURES = [
  { title: 'AI Resume Review', desc: 'Deep analysis of content, structure, clarity, and impact.' },
  { title: 'ATS Analysis', desc: 'Identify formatting issues that may reduce parsing reliability.' },
  { title: 'Job Matching', desc: 'Compare your resume against any job description.' },
  { title: 'Company-Specific Tips', desc: 'Tailor your resume to the role and company you\'re targeting.' },
  { title: 'Keyword Analysis', desc: 'Find missing keywords that matter to recruiters and ATS systems.' },
  { title: 'Skill Gap Detection', desc: 'See which required skills you\'re missing or underrepresenting.' },
  { title: 'Bullet Improvements', desc: 'Strengthen every bullet point with actionable feedback.' },
  { title: 'Resume Score', desc: 'An overall score with category-by-category breakdown.' },
  { title: 'Job Match Score', desc: 'See your match percentage against any job posting.' },
  { title: 'AI Rewrite Suggestions', desc: 'Generate an improved version you can review before accepting.' },
]

export function Landing() {
  return (
    <div className="overflow-hidden">
      {/* Background Effects — purple ambient glows, NOT gray overlays */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-brand-600/[0.06] rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-brand-500/[0.04] rounded-full blur-[120px]" />
      </div>

      {/* Hero */}
      <section className="relative pt-24 sm:pt-32 pb-20 sm:pb-28">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Text */}
            <div>
              <Badge variant="brand" className="mb-6">AI-Powered Resume Optimization</Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance leading-[1.1]">
                <span className="text-white">Make Your Resume</span>
                <br />
                <span className="text-gradient-bright">Hire-Ready.</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-neutral-400 max-w-xl leading-relaxed">
                Upload your resume, discover what&apos;s holding it back, and optimize it for the job you actually want.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to="/upload"
                  className="glass-button inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-white rounded-xl"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Analyze My Resume
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-medium text-neutral-300 rounded-xl border border-white/10 hover:bg-neutral-800/30 transition-colors"
                >
                  See How It Works
                </a>
              </div>
            </div>

            {/* Right — 3D Hero Composition */}
            <div className="relative hidden lg:block">
              {/* Purple ambient glow behind card */}
              <div className="absolute inset-0 bg-brand-500/[0.08] rounded-full blur-[100px] scale-75" />

              {/* Main Resume Card — dark glass */}
              <div className="relative bg-elevated rounded-2xl p-6 border border-white/[0.08] animate-float-slow" style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 80px rgba(139,92,246,0.08)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-neutral-500 font-mono">resume-analysis.pdf</span>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <ScoreRing value={84} size={80} strokeWidth={6} />
                  <div>
                    <p className="text-sm font-semibold text-white">Resume Score</p>
                    <p className="text-xs text-neutral-500">Strong foundation detected</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-surface rounded-xl p-3 text-center border border-white/[0.06]">
                    <p className="text-lg font-bold text-white">92</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">ATS</p>
                  </div>
                  <div className="bg-surface rounded-xl p-3 text-center border border-white/[0.06]">
                    <p className="text-lg font-bold text-brand-400">87%</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Match</p>
                  </div>
                  <div className="bg-surface rounded-xl p-3 text-center border border-white/[0.06]">
                    <p className="text-lg font-bold text-emerald-400">18/21</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Skills</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {['React', 'TypeScript', 'Node.js', 'Python'].map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-brand-500/[0.12] border border-brand-500/20 text-[10px] text-brand-300">{s}</span>
                  ))}
                  {['AWS', 'Docker'].map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-surface-subtle border border-white/[0.06] text-[10px] text-neutral-400">{s}</span>
                  ))}
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-4 -right-4 bg-elevated rounded-xl px-3 py-2 border border-white/[0.08] animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-medium text-white">12 Suggestions</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-elevated rounded-xl px-3 py-2 border border-white/[0.08] animate-float" style={{ animationDelay: '2s' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-brand-400">AI Analysis</span>
                  <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-glow" />
                </div>
              </div>

              {/* Orbital Ring */}
              <div className="absolute inset-8 rounded-full border border-brand-500/10 animate-ring-spin" style={{ animationDuration: '30s' }}>
                <div className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">How It Works</h2>
            <p className="mt-3 text-lg text-neutral-500">Four steps to a stronger resume.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step) => (
              <div key={step.num} className="glass-card p-6">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold flex items-center justify-center text-sm mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 relative">
        <div className="absolute inset-0 bg-radial-purple pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Everything You Need</h2>
            <p className="mt-3 text-lg text-neutral-500">Comprehensive analysis, actionable insights.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card p-5">
                <h3 className="text-base font-semibold text-white mb-1.5">{f.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Hirely */}
      <section className="py-20 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Why Hirely?</h2>
            <p className="text-lg text-neutral-400 leading-relaxed mb-4">
              Generic resume advice isn&apos;t enough. A resume for a software engineer at Google is different
              from one for a product manager at a startup. The same document won&apos;t work everywhere.
            </p>
            <p className="text-lg text-neutral-400 leading-relaxed mb-4">
              Hirely analyzes your resume <strong className="text-white">and</strong> compares it against the specific role you&apos;re
              applying for — so you know exactly what to change, what to keep, and what&apos;s missing.
            </p>
            <p className="text-base text-neutral-500 leading-relaxed">
              Every recommendation comes from AI analysis of your actual content. We never fabricate experience,
              metrics, or qualifications.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-radial-purple-strong pointer-events-none" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to improve your resume?</h2>
          <p className="text-lg text-neutral-500 mb-8">Get detailed feedback and job-specific optimization in seconds.</p>
          <Link
            to="/upload"
            className="glass-button inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white rounded-xl"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Analyze My Resume
          </Link>
        </div>
      </section>
    </div>
  )
}
