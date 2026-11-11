import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenisInstance: Lenis | null = null

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function initSmoothScroll(): () => void {
  if (typeof window === 'undefined' || prefersReducedMotion()) {
    return () => {}
  }

  const lenis = new Lenis({
    lerp: 0.09,
    wheelMultiplier: 0.72,
    smoothWheel: true,
    syncTouch: false,
    gestureOrientation: 'vertical',
    autoRaf: false,
  })

  lenisInstance = lenis
  lenis.on('scroll', ScrollTrigger.update)

  const onTick = (time: number) => {
    lenis.raf(time * 1000)
  }

  gsap.ticker.add(onTick)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(onTick)
    lenis.destroy()
    if (lenisInstance === lenis) {
      lenisInstance = null
    }
  }
}

export function getLenis(): Lenis | null {
  return lenisInstance
}

export function smoothScrollTo(
  target: number | string | HTMLElement,
  options?: { immediate?: boolean; offset?: number },
): void {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, {
      immediate: options?.immediate ?? false,
      offset: options?.offset ?? -86,
      duration: options?.immediate ? 0 : 1.15,
    })
    return
  }

  if (typeof target === 'number') {
    window.scrollTo({
      top: target,
      behavior: options?.immediate ? 'auto' : 'smooth',
    })
    return
  }

  const el =
    typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (el) {
    el.scrollIntoView({
      behavior: options?.immediate ? 'auto' : 'smooth',
      block: 'start',
    })
  }
}

export function refreshScrollTriggers(): void {
  ScrollTrigger.refresh()
}

