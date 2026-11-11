import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'

const FEATURES = [
  {
    icon: '🎯',
    title: 'Live LinkedIn Job Match Score',
    desc: 'Browse any job post on LinkedIn and see an instant 0–99% match ring, matched skills, and exact missing skills compared to your Hirely resume.',
  },
  {
    icon: '🚀',
    title: 'Smart Job Finder Presets',
    desc: 'One-click LinkedIn searches pre-configured for Startups & Small Teams, Early-Bird (<10 applicants), Fresh Last 24h, and Remote + Easy Apply.',
  },
  {
    icon: '✉️',
    title: 'AI Recruiter Pitch & Cover Note',
    desc: 'Generate a personalized 290-character LinkedIn connection note and tailored hiring manager InMail on any job post in one click.',
  },
  {
    icon: '✨',
    title: 'Tailor Resume & Interview Prep',
    desc: 'Send any LinkedIn job directly into Hirely’s Resume Optimizer, Skill-Gap Roadmap, or Mock Interview Generator.',
  },
  {
    icon: '📥',
    title: '1-Click LinkedIn Profile Import',
    desc: 'Open your LinkedIn profile page and import Experience, Education, Skills, and About sections straight into Hirely for ATS scoring.',
  },
  {
    icon: '📌',
    title: 'Auto-Syncing Application Pipeline',
    desc: 'Save jobs while browsing LinkedIn and sync them straight to your Hirely Dashboard tracker alongside your active resume versions.',
  },
]

const INSTALL_STEPS = [
  {
    num: '1',
    title: 'Download & Unzip',
    desc: 'Click the download button above to save hirely-linkedin-extension.zip, then extract it into a folder on your computer.',
  },
  {
    num: '2',
    title: 'Open Browser Extensions',
    desc: 'Open Chrome, Edge, or Brave and navigate to chrome://extensions (or edge://extensions).',
  },
  {
    num: '3',
    title: 'Turn On Developer Mode',
    desc: 'Toggle the "Developer mode" switch in the top-right corner of the extensions page.',
  },
  {
    num: '4',
    title: 'Click "Load unpacked"',
    desc: 'Select the extracted folder (containing manifest.json), pin Hirely Copilot to your toolbar, and open LinkedIn Jobs!',
  },
]

export function Extension() {
  return (
    <div className="min-h-[85vh] relative pt-20 pb-16">
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="lp-page-lead mb-10">
          <span className="lp-page-eyebrow">Chrome / Edge Extension · Free</span>
          <h1 className="lp-page-title">
            Hirely <span className="lp-grad-text">LinkedIn Job Copilot</span>
          </h1>
          <p className="lp-page-sub">
            Bring Hirely’s AI job matching, skill-gap detector, interview prep, and resume tailoring directly onto LinkedIn job pages.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
            <a
              href="/hirely-linkedin-extension.zip"
              download="hirely-linkedin-extension.zip"
              className="lp-btn lp-btn-primary lp-btn-lg inline-flex items-center gap-2"
            >
              <span>⬇️ Download Extension (.zip)</span>
            </a>
            <Link to="/jobs" className="lp-btn lp-btn-ghost lp-btn-lg">
              Browse Jobs Feed →
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-5 space-y-2.5 border-line">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-xl">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold text-fg-strong">{f.title}</h3>
              <p className="text-xs text-fg-muted leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>

        {/* Install Guide */}
        <Card className="p-6 sm:p-8 border-brand-500/25 bg-surface/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-lg font-bold text-fg-strong">Quick 60-Second Setup</h2>
              <p className="text-xs text-fg-muted">
                Works on Google Chrome, Microsoft Edge, Brave, and Arc Browser (Manifest V3).
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 w-fit">
              Auto-syncs with your Hirely resumes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {INSTALL_STEPS.map((s) => (
              <div
                key={s.num}
                className="p-4 rounded-2xl bg-surface-subtle border border-line space-y-2"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-brand-600 text-white text-xs font-bold">
                  {s.num}
                </span>
                <h4 className="text-sm font-bold text-fg-strong">{s.title}</h4>
                <p className="text-xs text-fg-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
