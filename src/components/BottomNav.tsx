import { useLocation, useNavigate } from "react-router-dom";
import { Home, Globe, Copy, ScanLine, Settings } from "lucide-react";

const TABS = [
  { path: "/", label: "Início", Icon: Home },
  { path: "/paises", label: "Países", Icon: Globe },
  { path: "/scanner", label: "Scanner", Icon: ScanLine },
  { path: "/repetidas", label: "Repetidas", Icon: Copy },
  { path: "/config", label: "Config", Icon: Settings },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = TABS.find((t) =>
    t.path !== "/"
      ? location.pathname.startsWith(t.path)
      : location.pathname === "/",
  );

  return (
    <nav className="bottom-nav border-t border-[#25372f] shadow-[0_-14px_30px_rgba(0,0,0,0.28)]">
      <div className="bottom-nav-items flex gap-1">
        {TABS.map((tab) => {
          const isActive = tab === active;
          const isScanner = tab.path === "/scanner";

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                isScanner
                  ? "bg-gold text-bg shadow-[0_8px_18px_rgba(159,134,84,0.18)]"
                  : isActive
                    ? "bg-[#1b2923] text-gold"
                    : "text-muted"
              }`}
            >
              <tab.Icon
                size={isScanner ? 24 : 20}
                strokeWidth={isActive || isScanner ? 2.5 : 1.8}
              />
              <span className="text-[10px] font-medium leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
