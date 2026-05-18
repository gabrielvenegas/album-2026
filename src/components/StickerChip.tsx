import { useCallback, useRef, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { StickerVariant, useCollection, useStickerStatus, useStickerVariants } from '@/store/useCollection'

interface Props {
  code: string
  label: string
  isFoil?: boolean
}

type SlideOption = 'duplicates' | 'variants'

export function StickerChip({ code, label, isFoil }: Props) {
  const status = useStickerStatus(code)
  const variants = useStickerVariants(code)
  const { cycleStatus, setDuplicateCopies, toggleVariant, dupCounts, confirmBeforeSelect } = useCollection()
  const count = dupCounts[code] ?? 2
  const repeatedCopies = status === 'duplicate' ? count - 1 : 0

  const chipRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)
  const slideSelRef = useRef<SlideOption>('duplicates')

  const [slideActive, setSlideActive] = useState(false)
  const [slideSel, setSlideSel] = useState<SlideOption>('duplicates')
  const [variantMode, setVariantMode] = useState(false)

  const clearTimer = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (variantMode) return
    didLongPress.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      setSlideActive(true)
    }, 500)
  }, [variantMode])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!didLongPress.current || !chipRef.current) return
    const rect = chipRef.current.getBoundingClientRect()
    const next: SlideOption = e.clientX < rect.left + rect.width / 2 ? 'duplicates' : 'variants'
    if (next !== slideSelRef.current) {
      slideSelRef.current = next
      setSlideSel(next)
    }
  }, [])

  const handlePointerUp = useCallback(() => {
    clearTimer()
    if (!didLongPress.current) {
      if (confirmBeforeSelect) {
        const nextLabel = status === 'missing' ? 'coletada' : status === 'owned' ? 'repetida' : 'faltando'
        if (!window.confirm(`Marcar ${code} como ${nextLabel}?`)) return
      }
      cycleStatus(code)
      return
    }
    const sel = slideSelRef.current
    didLongPress.current = false
    setSlideActive(false)
    if (sel === 'duplicates') {
      const next = window.prompt('Quantas repetidas você tem?', String(repeatedCopies || 1))
      if (next === null) return
      const copies = Number(next.replace(',', '.'))
      if (Number.isFinite(copies)) setDuplicateCopies(code, copies)
    } else {
      setVariantMode(true)
    }
  }, [clearTimer, code, cycleStatus, confirmBeforeSelect, status, repeatedCopies, setDuplicateCopies])

  const handlePointerLeave = useCallback(() => {
    if (!didLongPress.current) clearTimer()
  }, [clearTimer])

  const handlePointerCancel = useCallback(() => {
    clearTimer()
    didLongPress.current = false
    setSlideActive(false)
  }, [clearTimer])

  const closeVariantMode = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    clearTimer()
    setVariantMode(false)
  }, [clearTimer])

  const bg =
    status === 'owned' ? 'bg-owned/15 border-owned/40 text-owned' :
    status === 'duplicate' ? 'bg-duplicate/15 border-duplicate/40 text-duplicate' :
    'bg-surface border-border text-muted'

  const foilRing = isFoil && status !== 'missing' ? 'ring-1 ring-gold/40' : ''

  return (
    <div
      ref={chipRef}
      role="button"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerCancel}
      className={`chip-press relative flex flex-col items-center justify-center rounded-xl border p-2 pb-5 gap-0.5 select-none touch-none ${bg} ${foilRing}`}
      style={{ minHeight: 76 }}
    >
      <span className="text-xs font-bold leading-none">{code}</span>
      <span className="text-[9px] leading-none opacity-60 text-center line-clamp-1 px-0.5">{label}</span>

      {!slideActive && !variantMode && (
        <>
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
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
            {VARIANTS.map(v => (
              <span
                key={v.id}
                className={`h-2.5 w-2.5 rounded-full border ${
                  variants[v.id] ? v.on : 'bg-transparent border-muted/40'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Slide-to-select overlay (shown while holding) */}
      {slideActive && (
        <div className="absolute inset-0 flex rounded-xl overflow-hidden z-20 pointer-events-none">
          <div className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-100 ${
            slideSel === 'duplicates' ? 'bg-duplicate/35 text-duplicate' : 'bg-surface/80 text-muted/40'
          }`}>
            <span className="text-sm font-bold leading-none">+</span>
            <span className="text-[7px] font-semibold">Repetidas</span>
          </div>
          <div className="w-px bg-border/30 self-stretch my-2" />
          <div className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-100 ${
            slideSel === 'variants' ? 'bg-gold/25 text-gold' : 'bg-surface/80 text-muted/40'
          }`}>
            <Sparkles size={11} />
            <span className="text-[7px] font-semibold">Colecionável</span>
          </div>
        </div>
      )}

      {/* Variant toggle overlay (shown after selecting Colecionável) */}
      {variantMode && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-surface/95 rounded-xl z-20"
          onPointerUp={closeVariantMode}
        >
          <span className="text-[7px] text-muted uppercase tracking-widest">Colecionável</span>
          <div className="flex gap-2">
            {VARIANTS.map(v => (
              <button
                key={v.id}
                type="button"
                aria-label={v.label}
                onPointerDown={e => e.stopPropagation()}
                onPointerUp={e => e.stopPropagation()}
                onClick={e => {
                  e.stopPropagation()
                  toggleVariant(code, v.id)
                }}
                className={`h-5 w-5 rounded-full border-2 transition-all active:scale-125 ${
                  variants[v.id] ? `${v.on} scale-110` : 'bg-transparent border-muted/40'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const VARIANTS: { id: StickerVariant; label: string; on: string }[] = [
  { id: 'purple', label: 'Roxa', on: 'bg-purple-500 border-purple-300' },
  { id: 'bronze', label: 'Bronze', on: 'bg-orange-700 border-orange-400' },
  { id: 'silver', label: 'Prata', on: 'bg-slate-300 border-white' },
  { id: 'gold', label: 'Ouro', on: 'bg-gold border-yellow-200' },
]
