import { useId } from 'react'

export function LogoMark() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const grad = `lpMarkGrad${uid}`
  const sheen = `lpMarkSheen${uid}`
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="0.6" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id={sheen} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.4" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="13" fill={`url(#${grad})`} />
      <path d="M14 8c0-3 2-5 5-5 0 0-1.5 3.5 0 5.5 1.3 1.7 4 1 5.5 0 1.5-1 0-5.5 0-5.5 3 0 5 2 5 5v32L14 42V8z" fill={`url(#${sheen})`} opacity="0.55" />
      <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="12.25" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M14.5 15.5v17M33.5 15.5v17M14.5 24h19" stroke="#fff" strokeWidth="5.6" strokeLinecap="round" />
      <path d="M37.6 9.2l1.05 2.35 2.35 1.05-2.35 1.05-1.05 2.35-1.05-2.35-2.35-1.05 2.35-1.05 1.05-2.35z" fill="#fff" />
    </svg>
  )
}