import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { Dashboard } from '@/pages/Dashboard'
import { Countries } from '@/pages/Countries'
import { CountryDetail } from '@/pages/CountryDetail'
import { Duplicates } from '@/pages/Duplicates'
import { Scanner } from '@/pages/Scanner'
import { Settings } from '@/pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-full bg-bg">
        {/* Top safe-area bar — fills the status bar zone with the app background */}
        <div className="flex-none bg-bg pt-safe" />
        <div className="flex-1 flex flex-col min-h-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/paises" element={<Countries />} />
            <Route path="/paises/:code" element={<CountryDetail />} />
            <Route path="/repetidas" element={<Duplicates />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/config" element={<Settings />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
