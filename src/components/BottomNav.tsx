import { useLocation, useNavigate } from 'react-router-dom'
import { APP_TABS, isTabActive, type AppTab } from '@/components/nav-tabs'

function NavButton({
  tab,
  isActive,
  onClick,
  layout,
}: {
  tab: AppTab
  isActive: boolean
  onClick: () => void
  layout: 'mobile' | 'desktop'
}) {
  const isScanner = tab.path === '/scanner'

  if (layout === 'desktop') {
    return (
      <button
        onClick={onClick}
        className={`chip-press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
          isScanner
            ? 'bg-gold text-bg shadow-[0_8px_18px_rgba(255,178,56,0.18)]'
            : isActive
              ? 'bg-[#1b2923] text-gold'
              : 'text-muted hover:bg-white/5 hover:text-text'
        }`}
      >
        <tab.Icon size={20} strokeWidth={isActive || isScanner ? 2.5 : 1.8} />
        <span className="text-sm font-semibold">{tab.label}</span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
        isScanner
          ? 'bg-gold text-bg shadow-[0_8px_18px_rgba(159,134,84,0.18)]'
          : isActive
            ? 'bg-[#1b2923] text-gold'
            : 'text-muted'
      }`}
    >
      <tab.Icon
        size={isScanner ? 24 : 20}
        strokeWidth={isActive || isScanner ? 2.5 : 1.8}
      />
      <span className="text-[10px] font-medium leading-none">{tab.label}</span>
    </button>
  )
}

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <>
      <aside className="desktop-sidebar hidden lg:flex">
        <div className="desktop-sidebar-brand">
          <p className="desktop-sidebar-kicker">Copa 2026</p>
          <p className="desktop-sidebar-title">Meu Álbum</p>
        </div>
        <nav className="desktop-sidebar-nav">
          {APP_TABS.map((tab) => (
            <NavButton
              key={tab.path}
              tab={tab}
              isActive={isTabActive(location.pathname, tab.path)}
              onClick={() => navigate(tab.path)}
              layout="desktop"
            />
          ))}
        </nav>
      </aside>

      <nav className="bottom-nav border-t border-[#25372f] shadow-[0_-14px_30px_rgba(0,0,0,0.28)] lg:hidden">
        <div className="bottom-nav-items flex gap-1">
          {APP_TABS.map((tab) => (
            <NavButton
              key={tab.path}
              tab={tab}
              isActive={isTabActive(location.pathname, tab.path)}
              onClick={() => navigate(tab.path)}
              layout="mobile"
            />
          ))}
        </div>
      </nav>
    </>
  )
}
