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
    <nav className="bottom-nav border-t border-border">
      <div className="bottom-nav-items flex">
        {TABS.map((tab) => {
          const isActive = tab === active;
          const isScanner = tab.path === "/scanner";

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                isScanner
                  ? "bg-gradient-to-r from-gold via-amber-300 to-gold bg-[length:200%_200%] bg-clip-text text-transparent"
                  : isActive
                    ? "text-gold"
                    : "text-muted"
              }`}
            >
              <tab.Icon
                size={isScanner ? 26 : 20}
                strokeWidth={isActive || isScanner ? 2.5 : 1.8}
                className={
                  isScanner
                    ? "text-gold drop-shadow-[0_0_8px_rgba(245,190,80,0.65)]"
                    : undefined
                }
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
