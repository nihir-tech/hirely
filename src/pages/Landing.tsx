import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

/* ── tiny icon set ─────────────────────────────────── */

const I = {
  upload: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
  ),
  spark: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  ),
  check: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
  ),
  bubble: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
  ),
  shield: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
  ),
  timer: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  chart: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  ),
  doc: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  ),
  link: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 0V14a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
  ),
  users: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ),
  tag: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
  ),
  pie: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
  ),
  pen: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
  ),
  book: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253m-4.5-4.506l2-1m-2 1l4.5 3.5m4.5-7l2.25 1.5m-2.25-1.5l-4.5 3.5z" /></svg>
  ),
  match: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8L8 20" /></svg>
  ),
}

const STEPS = [
  { num: '1', title: 'Upload Resume', desc: 'Drop your PDF or image — we handle the rest.' },
  { num: '2', title: 'AI Reviews It', desc: 'Detailed breakdown of strengths, weaknesses, and ATS readiness.' },
  { num: '3', title: 'Add Target Job', desc: "Paste a job description to see exactly where you match — and where you don't." },
  { num: '4', title: 'Optimize & Apply', desc: 'Accept targeted improvements and download your optimized resume.' },
]

const FEATURES = [
  { icon: I.chart, title: 'AI Resume Review', desc: 'Deep analysis of content, structure, clarity, and impact.', wide: true, big: true, vis: true },
  { icon: I.match, title: 'Job Matching', desc: 'Compare your resume against any job description you paste.' },
  { icon: I.tag, title: 'Keyword Analysis', desc: 'Find missing keywords that matter to recruiters and ATS systems.', kws: true },
  { icon: I.doc, title: 'ATS Analysis', desc: 'Identify formatting issues that may reduce parsing reliability.' },
  { icon: I.pie, title: 'Skill Gap Detection', desc: "See which required skills you're missing or underrepresenting." },
  { icon: I.book, title: 'Bullet Improvements', desc: 'Strengthen every bullet point with actionable, line-by-line feedback — plus one-click AI rewrite suggestions you can review before accepting.', wide: true },
]

const TESTIMONIALS = [
  { init: 'AR', name: 'Aryan Rathore', role: 'Software Engineer, Bangalore', outcome: 'Hired · 2 weeks', quote: 'Went from radio silence to 3 callbacks in two weeks. The job-match section is a cheat code.' },
  { init: 'PM', name: 'Priya Mehta', role: 'Product Manager, Mumbai', outcome: '3 interviews · 10 days', quote: 'I finally understood why my ATS score was low. The formatting suggestions fixed what no course could.' },
  { init: 'DK', name: 'Dev Kulkarni', role: 'Data Analyst, Pune', outcome: 'Offer · 1 month', quote: 'Pasted a job description, got a targeted resume. Landed an interview the following week. Unreal.' },
]

const FAQS = [
  { q: 'Is my resume data safe?', a: 'Yes. Files are processed securely, never sold, and only stored if you choose to save them. No data is shared with third parties.' },
  { q: 'Which file formats are supported?', a: 'PDF, PNG and JPG. Just upload and the parser handles the rest.' },
  { q: 'Do I really need a target job description?', a: 'Not for the basic review. Adding one unlocks the full job-match and keyword tools, which make the biggest difference.' },
  { q: 'Is Hirely free?', a: 'Yes — analyze and improve your resume free. Results in under 30 seconds, no credit card needed.' },
]

const SCORE_BARS = [
  { label: 'ATS', value: 92, suffix: '' },
  { label: 'Match', value: 87, suffix: '%' },
  { label: 'Impact', value: 64, suffix: '%' },
]
const RING_TARGET = 84
const RING_C = 289

/* ── Reveal wrapper ────────────────────────────────── */

function Reveal({ children, delay, as: Tag = 'div', className = '', style }: { children: ReactNode; delay?: 1 | 2 | 3 | 4; as?: 'div' | 'span'; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          setInView(true)
          io.unobserve(el)
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Tag ref={ref as never} data-lp-reveal="" data-lp-d={delay ?? ''} style={style} className={`${inView ? 'lp-in' : ''} ${className}`.trim()}>
      {children}
    </Tag>
  )
}

/* ── Compare slider ────────────────────────────────── */

/* ── Compare: before / after slider ─────────────────── */

interface CompareItem { kw: string; ok: boolean; text: string }
interface CompareSkill { name: string; ok: boolean }
interface ComparePane {
  label: string
  score: number
  sub: string
  items: CompareItem[]
  skills: CompareSkill[]
  chips: string[]
}
interface CompareCase { id: string; tab: string; role: string; before: ComparePane; after: ComparePane }

const CASES: CompareCase[] = [
  {
    id: 'se',
    tab: 'Software Engineer',
    role: 'Senior @ Series-C · 5 yrs',
    before: {
      label: 'Before — ATS rejected',
      score: 42,
      sub: 'Senior @ Series-C · 5 yrs',
      items: [
        { kw: 'API', ok: false, text: 'Responsible for improving API performance' },
        { kw: 'React', ok: true, text: 'Built some dashboards with React' },
        { kw: 'CI/CD', ok: false, text: 'Helped ship features to production' },
      ],
      skills: [
        { name: 'React ✓', ok: true }, { name: 'TypeScript ✓', ok: true },
        { name: 'Docker', ok: false }, { name: 'CI/CD', ok: false }, { name: 'Kubernetes', ok: false },
      ],
      chips: ['0 metrics on bullets', '6 keywords missing', 'Table layout breaks parsing'],
    },
    after: {
      label: 'After — shortlisted',
      score: 92,
      sub: 'Senior @ Series-C · 5 yrs',
      items: [
        { kw: 'API', ok: true, text: 'Cut p95 latency 38% (820→510 ms) by optimizing query paths' },
        { kw: 'React', ok: true, text: 'Owned 3 React dashboards used by 12k daily users' },
        { kw: 'CI/CD', ok: true, text: 'Automated deploys — releases fell from 4 hrs to 11 min' },
      ],
      skills: [
        { name: 'React ✓', ok: true }, { name: 'TypeScript ✓', ok: true },
        { name: 'Docker ✓', ok: true }, { name: 'CI/CD ✓', ok: true }, { name: 'Kubernetes ✓', ok: true },
      ],
      chips: ['Every bullet has a metric', '12/12 keywords covered', 'Clean single-column ATS layout'],
    },
  },
  {
    id: 'pm',
    tab: 'Product Manager',
    role: 'PM @ Fintech · 4 yrs',
    before: {
      label: 'Before — ATS rejected',
      score: 55,
      sub: 'PM @ Fintech · 4 yrs',
      items: [
        { kw: 'Roadmap', ok: false, text: 'Worked on product features' },
        { kw: 'Metrics', ok: false, text: 'Monitored feature performance' },
        { kw: 'Launch', ok: false, text: 'Helped launch onboarding' },
      ],
      skills: [
        { name: 'SQL ✓', ok: true }, { name: 'Figma ✓', ok: true }, { name: 'Jira ✓', ok: true },
        { name: 'Roadmaps', ok: false }, { name: 'A/B testing', ok: false },
      ],
      chips: ['No quantified impact', 'Vague verbs only', 'No product lifecycle'],
    },
    after: {
      label: 'After — shortlisted',
      score: 89,
      sub: 'PM @ Fintech · 4 yrs',
      items: [
        { kw: 'Roadmap', ok: true, text: 'Drove 2025 Q3 roadmap — shipped 14 features on time' },
        { kw: 'Metrics', ok: true, text: 'Raised activation 22% with data-driven onboarding changes' },
        { kw: 'Launch', ok: true, text: 'Launched 3 products 0→1 with 4 cross-functional teams' },
      ],
      skills: [
        { name: 'SQL ✓', ok: true }, { name: 'Figma ✓', ok: true }, { name: 'Jira ✓', ok: true },
        { name: 'Roadmaps ✓', ok: true }, { name: 'A/B testing ✓', ok: true },
      ],
      chips: ['Impact in every bullet', '10/10 keywords covered', 'Crisp value-first phrasing'],
    },
  },
  {
    id: 'da',
    tab: 'Data Analyst',
    role: 'Data @ e-commerce · 3 yrs',
    before: {
      label: 'Before — ATS rejected',
      score: 38,
      sub: 'Data @ e-commerce · 3 yrs',
      items: [
        { kw: 'SQL', ok: false, text: 'Used SQL to pull data for reports' },
        { kw: 'Dashboards', ok: true, text: 'Made dashboards for the team' },
        { kw: 'A/B test', ok: false, text: 'Ran some experiments' },
      ],
      skills: [
        { name: 'Excel ✓', ok: true }, { name: 'SQL ✓', ok: true },
        { name: 'Python', ok: false }, { name: 'Tableau', ok: false }, { name: 'Statistics', ok: false },
      ],
      chips: ['Tasks, not outcomes', '4 skills missing', 'No stakeholder results'],
    },
    after: {
      label: 'After — shortlisted',
      score: 84,
      sub: 'Data @ e-commerce · 3 yrs',
      items: [
        { kw: 'SQL', ok: true, text: 'Wrote complex SQL — cut monthly reporting time 60%' },
        { kw: 'Dashboards', ok: true, text: 'Built 8 Tableau dashboards used by exec decision-makers' },
        { kw: 'A/B test', ok: true, text: 'Designed A/B tests driving 19% checkout conversion lift' },
      ],
      skills: [
        { name: 'Excel ✓', ok: true }, { name: 'SQL ✓', ok: true }, { name: 'Python ✓', ok: true },
        { name: 'Tableau ✓', ok: true }, { name: 'Statistics ✓', ok: true },
      ],
      chips: ['Outcome-led bullets', '8/8 keywords covered', 'Story connects to revenue'],
    },
  },
]

function CompareSlider() {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const beforeRef = useRef<HTMLDivElement | null>(null)
  const handleRef = useRef<HTMLDivElement | null>(null)
  const dragging = useRef(false)
  const [active, setActive] = useState(CASES[0].id)

  const cs = CASES.find((c) => c.id === active) || CASES[0]

  const setPos = useCallback((px: number) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const r = wrap.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (px - r.left) / r.width))
    if (beforeRef.current) beforeRef.current.style.width = `${p * 100}%`
    if (handleRef.current) handleRef.current.style.left = `${p * 100}%`
  }, [])

  const center = useCallback(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const r = wrap.getBoundingClientRect()
    setPos(r.left + r.width * 0.5)
  }, [setPos])

  useEffect(() => {
    center()
  }, [active, center])

  function renderPane(pane: ComparePane, side: 'before' | 'after') {
    return (
      <div ref={side === 'before' ? beforeRef : undefined} className={`lp-compare-pane lp-pane-${side}`}>
        <div className="lp-pane-inner">
          <span className="lp-compare-label">{pane.label}</span>
          <div className="lp-pane-head">
            <div className="lp-round">
              {pane.score}
              <span className="lp-round-suffix">score</span>
            </div>
            <div className="lp-pane-title">
              <h3>{cs.role}</h3>
              <span>{pane.sub}</span>
            </div>
          </div>
          <div className="lp-pane-section">Experience</div>
          <ul className="lp-pane-items">
            {pane.items.map((it, i) => (
              <li key={i}>
                <span className={`lp-kw ${it.ok ? 'ok' : 'bad'}`}>{it.kw}</span>
                <span className="lp-it-text">{it.text}</span>
              </li>
            ))}
          </ul>
          <div className="lp-pane-section">Skills</div>
          <div className="lp-pane-skills">
            {pane.skills.map((s, i) => (
              <span key={i} className={`lp-skill ${s.ok ? 'ok' : 'bad'}`}>{s.name}</span>
            ))}
          </div>
          <div className="lp-pane-foot">
            {pane.chips.map((c, i) => (
              <span key={i} className="lp-chip">{c}</span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const matchedSkills = cs.after.skills.filter((s) => s.ok).length
  const totalSkills = cs.after.skills.length
  const delta = cs.after.score - cs.before.score

  return (
    <div className="lp-compare-block">
      <div className="lp-compare-tabs" role="tablist">
        {CASES.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={c.id === active}
            className={c.id === active ? 'on' : ''}
            onClick={() => setActive(c.id)}
          >
            {c.tab}
          </button>
        ))}
      </div>

      <div
        ref={wrapRef}
        className="lp-compare-wrap"
        role="slider"
        aria-label="Compare resume before and after"
        aria-valuenow={50}
        tabIndex={0}
        onPointerDown={(e) => {
          dragging.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          setPos(e.clientX)
        }}
        onPointerMove={(e) => dragging.current && setPos(e.clientX)}
        onPointerUp={(e) => {
          dragging.current = false
          if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
        }}
        onKeyDown={(e) => {
          const wrap = wrapRef.current
          if (!wrap) return
          const r = wrap.getBoundingClientRect()
          const step = r.width * 0.06
          if (e.key === 'ArrowLeft') { e.preventDefault(); setPos(r.left + r.width / 2 - step) }
          if (e.key === 'ArrowRight') { e.preventDefault(); setPos(r.left + r.width / 2 + step) }
        }}
      >
        {renderPane(cs.before, 'before')}
        {renderPane(cs.after, 'after')}
        <div ref={handleRef} className="lp-compare-handle" />
      </div>

      <p className="lp-compare-hint">Drag the handle — or use ← → keys</p>

      <div className="lp-compare-stats">
        <div><b>{cs.before.score} → {cs.after.score}</b><span>ATS score</span></div>
        <div><b>+{delta}</b><span>points gained</span></div>
        <div><b>{matchedSkills}/{totalSkills}</b><span>keywords matched</span></div>
        <div><b>ATS-safe ✓</b><span>single-column layout</span></div>
      </div>
    </div>
  )
}

/* ── Hero mock ─────────────────────────────────────── */

function HeroMock() {
  const mockRef = useRef<HTMLDivElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const ringRef = useRef<SVGCircleElement | null>(null)
  const numRef = useRef<HTMLSpanElement | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    const root = mockRef.current
    if (!root) return
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting || ran.current) return
      ran.current = true
      const t0 = performance.now()
      const step = (now: number) => {
        const p = Math.min((now - t0) / 1500, 1)
        const e = 1 - Math.pow(1 - p, 3)
        if (ringRef.current) ringRef.current.setAttribute('stroke-dashoffset', String(RING_C - RING_C * (RING_TARGET / 100) * e))
        if (numRef.current) numRef.current.textContent = String(Math.round(RING_TARGET * e))
        if (barRef.current) {
          const bars = barRef.current.querySelectorAll<HTMLElement>('[data-w]')
          bars.forEach((b) => (b.style.width = `${(Number(b.dataset.w) * e).toFixed(1)}%`))
        }
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
      io.disconnect()
    }, { threshold: 0.25 })
    io.observe(root)
    return () => io.disconnect()
  }, [])

  return (
    <div className="lp-anchor-wrap" style={{ maxWidth: 920, margin: '70px auto 0' }}>
      <div className="lp-glow-card" />
      <div
        ref={mockRef}
        className="lp-mock"
        onMouseMove={(e) => {
          const el = e.currentTarget
          const r = el.getBoundingClientRect()
          const px = (e.clientX - r.left) / r.width
          const py = (e.clientY - r.top) / r.height
          el.style.setProperty('--lp-mx', `${px * 100}%`)
          el.style.setProperty('--lp-my', `${py * 100}%`)
          if (window.matchMedia('(hover:hover)').matches) el.style.transform = `rotateY(${(px - 0.5) * 6}deg) rotateX(${(0.5 - py) * 5}deg)`
        }}
        onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
      >
        <div className="lp-mock-top">
          <span className="lp-fdot" style={{ background: 'var(--lp-emerald)' }} />
          <span className="lp-file">resume-analysis.pdf — analyzing live…</span>
          <span className="lp-status"><span className="lp-spinner" /> AI processing</span>
        </div>
        <div className="lp-mock-grid">
          <div>
            <div className="lp-score-block">
              <div className="lp-ring">
                <svg width="110" height="110" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="9" />
                  <circle
                    ref={ringRef}
                    cx="55" cy="55" r="46" fill="none" stroke="url(#lpRingGrad)" strokeWidth="9"
                    strokeLinecap="round" strokeDasharray={RING_C} strokeDashoffset={RING_C}
                  />
                  <defs>
                    <linearGradient id="lpRingGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" /><stop offset="50%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                </svg>
                <span ref={numRef} className="lp-num">0</span>
              </div>
              <div className="lp-ring-txt">
                <h3>Resume Score</h3>
                <p>Strong foundation detected</p>
                <div className="lp-tags"><span className="lp-tag">ATS Friendly</span><span className="lp-tag warn">Missing Keywords</span></div>
              </div>
            </div>
            <div ref={barRef} className="lp-bars">
              {SCORE_BARS.map((b) => (
                <div key={b.label} className="lp-bar-row">
                  <span>{b.label}</span>
                  <div className="lp-bar-track"><div className="lp-bar-fill" data-w={b.value} /></div>
                  <span className="lp-bar-num">{b.value}{b.suffix}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="lp-sugg-head"><span className="lp-spark">✦</span> Top AI suggestions</div>
            <div className="lp-sugg">
              <div className="lp-sugg-item"><span className="lp-idx">01</span><span>Quantify <b>4 action verbs</b> with real numbers for stronger impact.</span></div>
              <div className="lp-sugg-item"><span className="lp-idx">02</span><span>Add <b>Docker</b> &amp; <b>CI/CD</b> — 6 job posts require them.</span></div>
              <div className="lp-sugg-item"><span className="lp-idx">03</span><span>Rewrite the team-lead bullet to beat the <b>ATS threshold</b>.</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="lp-chip green lp-chip-c1" style={{ right: '-2%' }}>{I.check} 12 Suggestions Applied</div>
      <div className="lp-chip violet lp-chip-c2">{I.spark} AI Analysis Live</div>
      <div className="lp-chip violet lp-chip-c3">{I.shield} Interview-Ready</div>
    </div>
  )
}

/* ── HERO ──────────────────────────────────────────── */

function Hero() {
  const [ready, setReady] = useState(false)
  const h1Ref = useRef<HTMLHeadingElement | null>(null)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    if (!ready || !h1Ref.current) return
    const words = h1Ref.current.querySelectorAll<HTMLElement>('.lp-word > span')
    words.forEach((w, i) => (w.style.animationDelay = `${i * 0.09}s`))
  }, [ready])

  const parts = ['Make your resume', 'Hire-Ready.']
  const html = parts.map((p, pi) =>
    p.split(' ').map((w, wi) => {
      const word = pi === 1 ? `<span class="lp-grad-text">${w}</span>` : w
      return `<span class="lp-word"><span>${word}</span></span>`
    }).join(' ')
  ).join(' ')

  const fade = (d: string) => (ready ? `lp-fade lp-fade-d${d} in` : `lp-fade lp-fade-d${d}`)

  return (
    <section className="lp-hero">
      <div className="fx fx-1" data-lp-para="0.18" /><div className="fx fx-2" data-lp-para="0.3" />
      <div className="fx fx-3" data-lp-para="0.12" /><div className="fx-oid" />
      <div className="lp-container">
        <span className="lp-hero-badge"><span className="lp-live-dot" /> AI-Powered Resume Optimization — Now Live</span>
        <h1 ref={h1Ref} className={ready ? 'lp-in' : ''} dangerouslySetInnerHTML={{ __html: html }} />
        <p className={`lp-hero-sub ${fade('1')}`}>
          Upload your resume, discover what's holding it back, and optimize it for the job you actually want — <strong>in seconds</strong>.
        </p>
        <div className={`lp-hero-actions ${fade('2')}`}>
          <Link to="/upload" className="lp-btn lp-btn-primary lp-btn-lg">{I.upload} Analyze My Resume — Free</Link>
          <a href="#how-it-works" className="lp-btn lp-btn-ghost lp-btn-lg">See How It Works</a>
        </div>
        <div className={`lp-hero-note ${fade('3')}`}>
          <span>{I.shield} No credit card required</span>
          <span>{I.timer} Results in under 30 seconds</span>
          <span>{I.spark} Private &amp; secure</span>
        </div>
        <HeroMock />
      </div>
      <div className="lp-hero-ticker">
        <span>PDF · PNG · JPG supported</span><span>100% private</span><span>ATS-aware</span>
      </div>
    </section>
  )
}

/* ── Main landing ──────────────────────────────────── */

export function Landing() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0)

  useEffect(() => {
    const fx = document.querySelectorAll<HTMLElement>('.landing .fx')
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop
      fx.forEach((f) => {
        const s = parseFloat(f.getAttribute('data-lp-para') || '0') || 0
        f.style.translate = `0 ${y * s}px`
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="landing">
      <Hero />

      {/* How It Works */}
      <section id="how-it-works" className="lp-section">
        <div className="lp-container">
          <Reveal className="lp-section-head">
            <span className="lp-eyebrow">How it works</span>
            <h2>Four steps to a <span className="lp-grad-text">stronger resume</span></h2>
            <p>No guesswork. Just a clear path from “okay” to “hire-ready”.</p>
            <div className="lp-underline" />
          </Reveal>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <Reveal key={s.num} className="lp-step" delay={(i + 1) as 1 | 2 | 3 | 4}>
                {i < 3 && (
                  <svg className="lp-step-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" /></svg>
                )}
                <div className="lp-step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features (bento) */}
      <section id="features" className="lp-section" style={{ paddingTop: 40 }}>
        <div className="lp-container">
          <Reveal className="lp-section-head">
            <span className="lp-eyebrow">Features</span>
            <h2>Everything you need to <span className="lp-grad-text">get hired</span></h2>
            <p>Comprehensive analysis, actionable insights — nothing generic.</p>
            <div className="lp-underline" />
          </Reveal>
          <div className="lp-bento">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} className={`lp-bento-card ${f.big ? 'big' : ''} ${f.wide ? 'wide' : ''}`} delay={((i % 3) + 1) as 1 | 2 | 3}>
                <span className="lp-bg-ring" />
                <div className="lp-bento-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                {f.vis && (
                  <div className="lp-score-vis">
                    {[30, 52, 45, 74, 64, 88, 80, 95].map((h, hi) => (
                      <i key={hi} style={{ height: `${h}%` }} />
                    ))}
                  </div>
                )}
                {f.kws && (
                  <div className="lp-kws">
                    <span className="lp-kw">React ✓</span><span className="lp-kw">TypeScript ✓</span>
                    <span className="lp-kw warn">Docker</span><span className="lp-kw warn">CI/CD</span>
                  </div>
                )}
                <svg className="lp-spark-mini" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Compare */}
      <section className="lp-section" style={{ padding: '60px 0 110px' }}>
        <div className="lp-container">
          <Reveal className="lp-section-head">
            <span className="lp-eyebrow">Proof</span>
            <h2>Drag to see the <span className="lp-grad-text">difference</span></h2>
            <p>Same resume. Same facts. One AI pass through Hirely — across three roles.</p>
            <div className="lp-underline" />
          </Reveal>
          <Reveal style={{ display: 'block' }}>
            <CompareSlider />
          </Reveal>
        </div>
      </section>

      {/* Why */}
      <section className="lp-section" style={{ paddingTop: 10 }}>
        <div className="lp-container">
          <Reveal className="lp-why" style={{ margin: '0 auto', maxWidth: 780, textAlign: 'center' }}>
            <span className="lp-eyebrow">Why Hirely</span>
            <h2 style={{ fontFamily: 'var(--lp-display)', fontSize: 'clamp(1.9rem,4.6vw,3rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.13, marginBottom: 18 }}>
              Generic advice <span className="lp-grad-text">isn't enough</span>
            </h2>
            <p>A resume for a software engineer at Google is different from one for a product manager at a startup. The same document won't work everywhere.</p>
            <p>Hirely analyzes your resume <strong>and</strong> compares it against the specific role you're applying for — so you know exactly what to change, what to keep, and what's missing.</p>
            <div className="lp-why-cards" style={{ textAlign: 'left' }}>
              <Reveal className="lp-why-mini" delay={1}>{I.shield}<div><h4>Never fabricated</h4><p>Every recommendation comes from AI analysis of your actual content.</p></div></Reveal>
              <Reveal className="lp-why-mini" delay={2}>{I.spark}<div><h4>Job-specific</h4><p>Feedback is tuned to the exact job description you paste.</p></div></Reveal>
              <Reveal className="lp-why-mini" delay={3}>{I.timer}<div><h4>In seconds</h4><p>No waiting days for expert reviews — results are instant.</p></div></Reveal>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Testimonials */}
      <section className="lp-section" style={{ paddingTop: 40 }}>
        <div className="lp-container">
          <Reveal className="lp-section-head">
            <span className="lp-eyebrow">Loved by job seekers</span>
            <h2>They got <span className="lp-grad-text">interviews</span></h2>
            <p>Real people, real hire-ready resumes.</p>
            <div className="lp-underline" />
          </Reveal>
          <div className="lp-tst-slot">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} className="lp-tst" delay={(i + 1) as 1 | 2 | 3}>
                <div className="lp-stars">★★★★★</div>
                <p className="lp-quote">{t.quote}</p>
                <div className="lp-who">
                  <div className="lp-av">{t.init}</div>
                  <div><b>{t.name}</b><span>{t.role}</span></div>
                </div>
                <span className="lp-role">{t.outcome}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="lp-section" style={{ paddingTop: 40 }}>
        <div className="lp-container">
          <Reveal className="lp-section-head">
            <span className="lp-eyebrow">FAQ</span>
            <h2>Questions, <span className="lp-grad-text">answered</span></h2>
            <div className="lp-underline" />
          </Reveal>
          <div className="lp-faq-wrap">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} className={`lp-faq-item ${faqOpen === i ? 'open' : ''}`}>
                <button className="lp-faq-q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                  {f.q}
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div className="lp-faq-a" style={{ maxHeight: faqOpen === i ? 300 : 0 }}><p>{f.a}</p></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="lp-section" style={{ paddingTop: 20 }}>
        <div className="lp-container">
          <Reveal className="lp-cta-box">
            <div className="lp-cta-bg" />
            <div className="lp-cta-orb" />
            <h2>Ready to improve your resume?</h2>
            <p>Get detailed feedback and job-specific optimization in seconds. Free to start.</p>
            <div className="lp-cta-actions">
              <Link to="/upload" className="lp-btn lp-btn-primary lp-btn-lg">{I.upload} Analyze My Resume</Link>
            </div>
            <p className="lp-cta-note">No credit card required · Results in under 30 seconds · Private &amp; secure</p>
          </Reveal>
        </div>
      </section>
    </div>
  )
}