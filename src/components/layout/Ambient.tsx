import { useEffect, useRef } from 'react'

function Starfield() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let stars: { x: number; y: number; r: number; a: number; s: number; p: number }[] = []
    const init = () => {
      const n = Math.min(160, Math.floor((canvas.width * canvas.height) / 7500))
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.5 + 0.15,
        s: Math.random() * 0.3 + 0.05,
        p: Math.random() * Math.PI * 2,
      }))
    }
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      init()
    }
    let raf = 0
    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const s of stars) {
        const tw = s.a * (0.6 + 0.4 * Math.sin(t * 0.0016 * s.s * 40 + s.p))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, 7)
        ctx.fillStyle = `rgba(167,139,250,${tw})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])
  return <canvas className="lp-stars-canvas" aria-hidden="true" ref={ref} />
}

function Cursor() {
  const dotRef = useRef<HTMLDivElement | null>(null)
  const haloRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const root = document.querySelector('.lp-app')
    const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches
    if (!root || !fine) return
    root.classList.add('lp-cursor-on')
    const dot = dotRef.current
    const halo = haloRef.current
    if (!dot || !halo) return
    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let hx = mx
    let hy = my
    let raf: number | null = null
    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      dot.style.left = `${mx}px`
      dot.style.top = `${my}px`
      if (raf == null) {
        raf = requestAnimationFrame(function loop() {
          hx += (mx - hx) * 0.18
          hy += (my - hy) * 0.18
          halo.style.left = `${hx}px`
          halo.style.top = `${hy}px`
          raf = null
        })
      }
    }
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      halo.classList.toggle('hovering', !!t.closest('a,button,input,textarea,.lp-faq-q,.lp-compare-handle'))
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      root.classList.remove('lp-cursor-on')
    }
  }, [])
  return (
    <div className="lp-cursor-layout" aria-hidden="true">
      <div className="lp-cursor-dot" ref={dotRef} />
      <div className="lp-cursor-halo" ref={haloRef} />
    </div>
  )
}

export function Ambient() {
  useEffect(() => {
    const progress = document.getElementById('lp-progress')
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const y = window.scrollY || document.documentElement.scrollTop
      if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <div className="lp-progress" id="lp-progress" />
      <div className="lp-bg-aurora">
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />
      </div>
      <div className="lp-bg-grid" />
      <Starfield />
      <Cursor />
    </>
  )
}