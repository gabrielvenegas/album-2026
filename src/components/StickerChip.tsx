import { useCallback, useRef } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { StickerVariant, useCollection, useStickerStatus, useStickerVariants } from '@/store/useCollection'

interface Props {
  code: string
  label: string
  isFoil?: boolean
}

export function StickerChip({ code, label, isFoil }: Props) {
  const status = useStickerStatus(code)
  const variants = useStickerVariants(code)
  const { cycleStatus, setDuplicateCopies, toggleVariant, dupCounts } = useCollection()
  const count = dupCounts[code] ?? 2
  const repeatedCopies = status === 'duplicate' ? count - 1 : 0

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

  const handlePointerDown = useCallback(() => {
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      const next = window.prompt('Quantas repetidas você tem?', String(repeatedCopies || 1))
      if (next === null) return
      const copies = Number(next.replace(',', '.'))
      if (Number.isFinite(copies)) setDuplicateCopies(code, copies)
    }, 500)
  }, [code, repeatedCopies, setDuplicateCopies])

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
    <div
      role="button"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={`chip-press relative flex flex-col items-center justify-center rounded-xl border p-2 pb-5 gap-0.5 select-none touch-none ${bg} ${foilRing}`}
      style={{ minHeight: 76 }}
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
        <span className="absolute bottom-1 left-1 text-gold opacity-60">
          <Sparkles size={8} />
        </span>
      )}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
        {VARIANTS.map(variant => (
          <button
            key={variant.id}
            type="button"
            aria-label={`${variant.label} ${code}`}
            title={variant.label}
            onPointerDown={e => e.stopPropagation()}
            onPointerUp={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation()
              toggleVariant(code, variant.id)
            }}
            className={`h-2.5 w-2.5 rounded-full border transition-transform ${
              variants[variant.id]
                ? `${variant.on} scale-110`
                : 'bg-transparent border-muted/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

const VARIANTS: { id: StickerVariant; label: string; on: string }[] = [
  { id: 'purple', label: 'Roxa', on: 'bg-purple-500 border-purple-300' },
  { id: 'bronze', label: 'Bronze', on: 'bg-orange-700 border-orange-400' },
  { id: 'silver', label: 'Prata', on: 'bg-slate-300 border-white' },
  { id: 'gold', label: 'Ouro', on: 'bg-gold border-yellow-200' },
]
