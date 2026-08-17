import { Routes, Route } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { Landing } from './pages/Landing'
import { Upload } from './pages/Upload'
import { Analysis } from './pages/Analysis'
import { Optimize } from './pages/Optimize'
import { Dashboard } from './pages/Dashboard'
import { NotFound } from './pages/NotFound'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/analyze/:id" element={<Analysis />} />
          <Route path="/optimize/:id" element={<Optimize />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
