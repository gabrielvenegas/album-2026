import { useCallback, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { SplashScreen } from "@/components/SplashScreen";
import { Dashboard } from "@/pages/Dashboard";
import { Countries } from "@/pages/Countries";
import { CountryDetail } from "@/pages/CountryDetail";
import { Duplicates } from "@/pages/Duplicates";
import { Scanner } from "@/pages/Scanner";
import { Settings } from "@/pages/Settings";

export default function App() {
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem('splashShown')
  )

  const handleSplashDone = useCallback(() => {
    sessionStorage.setItem('splashShown', '1')
    setShowSplash(false)
  }, [])

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <BrowserRouter>
        <div className="app-shell">
          <div className="app-content flex-1 flex flex-col min-h-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/paises" element={<Countries />} />
              <Route path="/paises/:code" element={<CountryDetail />} />
              <Route path="/repetidas" element={<Duplicates />} />
              <Route path="/scanner" element={<Scanner />} />
              <Route path="/config" element={<Settings />} />
            </Routes>
          </div>
        </div>
        <BottomNav />
      </BrowserRouter>
    </>
  );
}
