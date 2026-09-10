import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface PageHeadProps {
  eyebrow?: string
  title: ReactNode
  sub?: string
  crumb?: { label: string; to: string }
}

export function PageHead({ eyebrow, title, sub, crumb }: PageHeadProps) {
  return (
    <div className="lp-page-lead">
      {crumb && (
        <div className="lp-page-crumb">
          <Link to={crumb.to}>{crumb.label}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">this page</span>
        </div>
      )}
      {eyebrow && <span className="lp-page-eyebrow">{eyebrow}</span>}
      <h1 className="lp-page-title">{title}</h1>
      {sub && <p className="lp-page-sub">{sub}</p>}
    </div>
  )
}