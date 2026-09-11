import { useState, type FormEvent } from 'react'
import { PageHead } from '../components/layout/PageHead'
import { Card } from '../components/ui/Card'

const TOPICS = ['General', 'Bug report', 'Feature request', 'Partnership', 'Other']

interface FieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
}

function Field({ label, required, children }: FieldProps) {
  return (
    <label className="lp-field">
      <span className="lp-label">
        {label} {required ? <em className="lp-req">*</em> : null}
      </span>
      {children}
    </label>
  )
}

export function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState(TOPICS[0])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const gmailUrl = `https://mail.google.com/mail/?view=cm&to=nihir12121@gmail.com&su=${encodeURIComponent(`[Hirely] ${topic} — from ${name.trim() || '?'}`)}&body=${encodeURIComponent(`Name: ${name.trim()}\nEmail: ${email.trim()}\nTopic: ${topic}\n\n${message.trim()}\n\n— sent from hirelly.vercel.app`)}`

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Please enter your name.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email address.')
    if (message.trim().length < 10) return setError('Please describe your inquiry (at least 10 characters).')

    const subject = encodeURIComponent(`[Hirely] ${topic} — from ${name.trim()}`)
    const body = encodeURIComponent(
      `Name: ${name.trim()}\nEmail: ${email.trim()}\nTopic: ${topic}\n\n${message.trim()}\n\n— sent from hirelly.vercel.app`
    )
    const a = document.createElement('a')
    a.href = `mailto:nihir12121@gmail.com?subject=${subject}&body=${body}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setSent(true)
  }

  return (
    <div className="min-h-[80vh] relative pt-20">
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
        <PageHead
          eyebrow="Contact"
          title={<>Say hello, <span className="lp-grad-text">get an answer</span></>}
          sub="Questions about Hirely, a feature idea, or a bug report — drop a message and it lands straight in my inbox."
        />

        <div className="lp-contact-grid">
          <Card className="p-6 sm:p-8">
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <div className="lp-contact-row">
                <Field label="Name" required>
                  <input className="lp-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </Field>
                <Field label="Email" required>
                  <input className="lp-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </Field>
              </div>

              <Field label="Topic" required>
                <div className="lp-select-wrap">
                  <select className="lp-input lp-select" value={topic} onChange={(e) => setTopic(e.target.value)}>
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <svg className="lp-select-chev" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </Field>

              <Field label="Message" required>
                <textarea className="lp-input lp-textarea" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell me what's on your mind…" />
              </Field>

              {error ? <p className="lp-form-msg lp-form-err">{error}</p> : null}
              {sent ? (
                <>
                  <p className="lp-form-msg lp-form-ok">
                    Your email app should have opened with the message ready to go. If it didn't, open it directly in Gmail below.
                  </p>
                  <a className="lp-contact-btn lp-contact-btn-ghost" href={gmailUrl} target="_blank" rel="noreferrer">
                    Open in Gmail
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </a>
                </>
              ) : null}

              <button type="submit" className="lp-contact-btn">
                Send message
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </form>
          </Card>

          <Card className="p-6 sm:p-8 lp-contact-side">
            <h3 className="lp-contact-side-h">Prefer something else?</h3>
            <ul className="lp-contact-list">
              <li>
                <span className="lp-contact-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <div>
                  <strong>Email</strong>
                  <a href="mailto:nihir12121@gmail.com">nihir12121@gmail.com</a>
                </div>
              </li>
              <li>
                <span className="lp-contact-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div>
                  <strong>Response time</strong>
                  <span>Usually within 24–48 hours</span>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}