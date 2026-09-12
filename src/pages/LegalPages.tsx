import type { ReactNode } from 'react'
import { PageHead } from '../components/layout/PageHead'
import { Card } from '../components/ui/Card'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-6 sm:p-7">
      <h2 className="lp-legal-h">{title}</h2>
      <div className="space-y-3">{children}</div>
    </Card>
  )
}

function P({ children }: { children: ReactNode }) {
  return <p className="lp-legal-p">{children}</p>
}

function Li({ children }: { children: ReactNode }) {
  return <li className="lp-legal-li">{children}</li>
}

function Shell({ eyebrow, title, sub, children }: { eyebrow: string; title: ReactNode; sub: string; children: ReactNode }) {
  return (
    <div className="min-h-[80vh] relative pt-20">
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
        <PageHead eyebrow={eyebrow} title={title} sub={sub} />
        <div className="lp-legal space-y-5">{children}</div>
      </div>
    </div>
  )
}

export function Privacy() {
  return (
    <Shell
      eyebrow="Privacy"
      title={<>Your data, <span className="lp-grad-text">your call</span></>}
      sub="Hirely is designed to be private by default — your resume and analysis stay under your control."
    >
      <Section title="What we process">
        <P>
          When you upload a resume, its text is read in your browser and sent to an AI model for a
          single analysis request. For signed-in users, the resume file and analysis data may be
          retained by the service operator for service-quality purposes; they are not shared with
          external third parties.
        </P>
      </Section>
      <Section title="Where your data lives">
        <ul className="space-y-2">
          <Li><strong>Resume & analysis results:</strong> saved only in your browser's local storage, and only if you choose to save them. You can delete them anytime from the dashboard.</Li>
          <Li><strong>Signed-in submissions:</strong> for signed-in users, the resume file and analysis metadata may be retained by the service operator for service-quality purposes. This is not shared with external third parties.</Li>
          <Li><strong>AI request:</strong> sent to a trusted AI provider for the length of one request to generate analysis. Not persisted by Hirely.</Li>
          <Li><strong>Anonymous counters:</strong> a random, non-identifying device id is stored in your browser to count total and online users. It contains no personal information.</Li>
        </ul>
      </Section>
      <Section title="What we don't do">
        <ul className="space-y-2">
          <Li>We do not sell, rent, or share your data.</Li>
          <Li>We do not run ads or install tracking cookies.</Li>
        </ul>
      </Section>
      <Section title="Model providers">
        <P>
          AI analysis is processed by a trusted third-party model provider. The provider processes
          the text solely to generate the response and does not retain it for training. Their
          privacy terms apply to that request.
        </P>
      </Section>
      <Section title="Your choices">
        <P>
          Everything is optional and local: delete saved analyses from your dashboard, or clear
          your browser's site data to remove the device id used for counters.
        </P>
      </Section>
    </Shell>
  )
}

export function Terms() {
  return (
    <Shell
      eyebrow="Terms"
      title={<>Terms of <span className="lp-grad-text">service</span></>}
      sub="The short version: use Hirely for what it's built for, and know AI output is generated content."
    >
      <Section title="Acceptance">
        <P>
          By using Hirely, you agree to these terms. The service is provided on an "as is" and
          "as available" basis without warranties of any kind.
        </P>
      </Section>
      <Section title="What Hirely does">
        <P>
          Hirely analyzes resumes with AI and provides scoring, suggestions, and job-match
          optimization. Output is generated content intended to aid your job search.
        </P>
      </Section>
      <Section title="AI-generated content">
        <ul className="space-y-2">
          <Li>AI suggestions can contain errors. Review them before adding anything to your resume.</Li>
          <Li>You are responsible for the accuracy of information you submit and use.</Li>
          <Li>Results are not a guarantee of interviews or employment outcomes.</Li>
        </ul>
      </Section>
      <Section title="Acceptable use">
        <ul className="space-y-2">
          <Li>Do not submit content you don't have the right to process.</Li>
          <Li>Do not attempt to abuse, overload, or reverse-engineer the service.</Li>
          <Li>Do not use the service for illegal or harmful purposes.</Li>
        </ul>
      </Section>
      <Section title="Limitation of liability">
        <P>
          Hirely shall not be liable for any indirect, incidental, or consequential damages
          arising from use of the service or reliance on AI-generated output.
        </P>
      </Section>
    </Shell>
  )
}

export function DataSafety() {
  return (
    <Shell
      eyebrow="Data Safety"
      title={<>Built private, <span className="lp-grad-text">by default</span></>}
      sub="A plain-language look at what data Hirely touches and why."
    >
      <Section title="The short version">
        <P>
          Hirely is local-first. Your resume analysis lives in your browser. For signed-in users,
          the service operator may retain the resume file and analysis data for service-quality
          purposes. We share nothing with advertisers or external third parties.
        </P>
      </Section>
      <Section title="Processing flow">
        <ul className="space-y-2">
          <Li><strong>Resume file →</strong> parsed in your browser (PDF/images never leave your device as files).</Li>
          <Li><strong>Extracted text →</strong> sent to the AI API once, for analysis only.</Li>
          <Li><strong>Results →</strong> returned to your browser and saved locally on your request.</Li>
          <Li><strong>Signed-in users →</strong> the file and analysis metadata flow to the service operator's private review dashboard for service-quality purposes.</Li>
        </ul>
      </Section>
      <Section title="Data controls">
        <ul className="space-y-2">
          <Li>Delete any saved analysis anytime — the dashboard's delete button removes it permanently from your browser.</Li>
          <Li>Full browser-clear removes everything, including the anonymous device id used for counters.</Li>
        </ul>
      </Section>
      <Section title="Encryption & transfers">
        <P>
          All traffic uses HTTPS. AI analysis is transferred to a trusted model provider which
          applies its own security and retention policies to that one-time request.
        </P>
      </Section>
    </Shell>
  )
}