import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Ambient } from './components/layout/Ambient'
import { SiteStatsProvider } from './hooks/useSiteStats'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { BackToTop } from './components/layout/BackToTop'
import { SidebarProvider, useSidebar } from './components/layout/SidebarContext'
import { WorkspaceSidebar } from './components/layout/WorkspaceSidebar'
import { Landing } from './pages/Landing'
import { Upload } from './pages/Upload'
import { Analysis } from './pages/Analysis'
import { Optimize } from './pages/Optimize'
import { Dashboard } from './pages/Dashboard'
import { Jobs } from './pages/Jobs'
import { Extension } from './pages/Extension'
import { Privacy, Terms, DataSafety } from './pages/LegalPages'
import { Contact } from './pages/Contact'
import { Admin } from './pages/Admin'
import { Company } from './pages/Company'
import { NotFound } from './pages/NotFound'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { ResumeCoachDrawer } from './components/coach/ResumeCoachDrawer'
import { ExtensionBridge } from './components/layout/ExtensionBridge'
import { initSmoothScroll, refreshScrollTriggers, smoothScrollTo } from './lib/smoothScroll'

function ScrollManager() {
  const location = useLocation()
  useEffect(() => {
    if (!location.hash) {
      smoothScrollTo(0, { immediate: true, offset: 0 })
      const t = setTimeout(refreshScrollTriggers, 120)
      return () => clearTimeout(t)
    }
    const id = location.hash.slice(1)
    const timer = setTimeout(() => {
      const el = document.getElementById(id)
      if (el) smoothScrollTo(el, { offset: -86 })
      refreshScrollTriggers()
    }, 100)
    return () => clearTimeout(timer)
  }, [location.pathname, location.hash])
  return null
}

function AppShell() {
  const { isLoggedIn, desktopExpanded } = useSidebar()

  useEffect(() => {
    return initSmoothScroll()
  }, [])
  const sidebarPad = isLoggedIn
    ? desktopExpanded
      ? 'lg:pl-60'
      : 'lg:pl-[68px]'
    : ''

  return (
    <div className="lp-app min-h-screen flex flex-col bg-canvas">
      <ScrollManager />
      <Ambient />
      <Navbar />
      <WorkspaceSidebar />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${sidebarPad}`}>
        <main className="flex-1 relative z-[1]">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/data-safety" element={<DataSafety />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/company" element={<Company />} />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analyze/:id"
              element={
                <ProtectedRoute>
                  <Analysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/optimize/:id"
              element={
                <ProtectedRoute>
                  <Optimize />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/extension" element={<Extension />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <BackToTop />
      <ResumeCoachDrawer />
      <ExtensionBridge />
    </div>
  )
}

export default function App() {
  return (
    <SiteStatsProvider>
      <SidebarProvider>
        <AppShell />
      </SidebarProvider>
    </SiteStatsProvider>
  )
}
