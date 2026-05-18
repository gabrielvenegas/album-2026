import { useEffect } from 'react'

interface Props {
  onDone: () => void
}

// Total visible duration: 500ms in + 900ms hold + 500ms out = 1900ms
const TOTAL_MS = 1900

export function SplashScreen({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, TOTAL_MS)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6"
      style={{
        background: '#080c0a',
        animation: `splash-fade-out 500ms ease-in ${TOTAL_MS - 500}ms both`,
      }}
    >
      <img
        src="/logo.jpeg"
        alt="Álbum Copa 2026"
        className="w-56 h-56 rounded-3xl object-cover"
        style={{ animation: 'splash-logo-in 500ms cubic-bezier(0.34,1.56,0.64,1) both' }}
      />
      <p
        className="text-white/40 text-sm tracking-widest uppercase"
        style={{ animation: 'splash-logo-in 500ms ease-out 120ms both' }}
      >
        Álbum Copa 2026
      </p>
    </div>
  )
}
