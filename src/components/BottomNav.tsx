import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Globe, Copy, ScanLine, Settings } from 'lucide-react'

const TABS = [
  { path: '/', label: 'Início', Icon: Home },
  { path: '/paises', label: 'Países', Icon: Globe },
  { path: '/repetidas', label: 'Repetidas', Icon: Copy },
  { path: '/scanner', label: 'Scanner', Icon: ScanLine },
  { path: '/config', label: 'Config', Icon: Settings },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const active = TABS.find(t => t.path !== '/' ? location.pathname.startsWith(t.path) : location.pathname === '/')

  return (
    <nav
      className="bg-surface border-t border-border flex-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 10px)' }}
    >
      <div className="flex">
        {TABS.map(tab => {
          const isActive = tab === active
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 pt-3 pb-2 transition-colors ${
                isActive ? 'text-gold' : 'text-muted'
              }`}
            >
              <tab.Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
