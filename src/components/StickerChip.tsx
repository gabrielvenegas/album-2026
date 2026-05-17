import { useCallback, useRef } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { useCollection, useStickerStatus } from '@/store/useCollection'

interface Props {
  code: string
  label: string
  isFoil?: boolean
}

export function StickerChip({ code, label, isFoil }: Props) {
  const status = useStickerStatus(code)
  const { cycleStatus, incrementDup, dupCounts } = useCollection()
  const count = dupCounts[code] ?? 2

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

  const handlePointerDown = useCallback(() => {
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      if (status === 'duplicate') incrementDup(code)
    }, 500)
  }, [code, status, incrementDup])

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    if (!didLongPress.current) cycleStatus(code)
  }, [code, cycleStatus])

  const handlePointerLeave = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }, [])

  const bg =
    status === 'owned' ? 'bg-owned/15 border-owned/40 text-owned' :
    status === 'duplicate' ? 'bg-duplicate/15 border-duplicate/40 text-duplicate' :
    'bg-surface border-border text-muted'

  const foilRing = isFoil && status !== 'missing' ? 'ring-1 ring-gold/40' : ''

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={`chip-press relative flex flex-col items-center justify-center rounded-xl border p-2 gap-0.5 select-none touch-none ${bg} ${foilRing}`}
      style={{ minHeight: 64 }}
    >
      <span className="text-xs font-bold leading-none">{code}</span>
      <span className="text-[9px] leading-none opacity-60 text-center line-clamp-1 px-0.5">{label}</span>

      {status === 'owned' && (
        <span className="absolute top-1 right-1">
          <Check size={10} strokeWidth={3} />
        </span>
      )}
      {status === 'duplicate' && (
        <span className="absolute top-0.5 right-0.5 text-[9px] bg-duplicate text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
          {count}
        </span>
      )}
      {isFoil && (
        <span className="absolute bottom-0.5 left-1 text-gold opacity-60">
          <Sparkles size={8} />
        </span>
      )}
    </button>
  )
}
