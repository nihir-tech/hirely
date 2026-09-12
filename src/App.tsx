import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Ambient } from './components/layout/Ambient'
import { SiteStatsProvider } from './hooks/useSiteStats'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { BackToTop } from './components/layout/BackToTop'
import { Landing } from './pages/Landing'
import { Upload } from './pages/Upload'
import { Analysis } from './pages/Analysis'
import { Optimize } from './pages/Optimize'
import { Dashboard } from './pages/Dashboard'
import { Privacy, Terms, DataSafety } from './pages/LegalPages'
import { Contact } from './pages/Contact'
import { Admin } from './pages/Admin'
import { NotFound } from './pages/NotFound'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

function ScrollManager() {
  const location = useLocation()
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0 })
      return
    }
    const id = location.hash.slice(1)
    const timer = setTimeout(() => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
    return () => clearTimeout(timer)
  }, [location.pathname, location.hash])
  return null
}

export default function App() {
  return (
    <SiteStatsProvider>
      <div className="lp-app min-h-screen flex flex-col bg-[#050505]">
        <ScrollManager />
        <Ambient />
        <Navbar />
        <main className="flex-1 relative z-[1]">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/data-safety" element={<DataSafety />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <BackToTop />
      </div>
    </SiteStatsProvider>
  )
}
