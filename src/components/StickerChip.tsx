import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Sparkles, X } from 'lucide-react'
import { StickerVariant, useCollection, useStickerStatus, useStickerVariants } from '@/store/useCollection'

interface Props {
  code: string
  label: string
  isFoil?: boolean
}

type SlideOption = 'duplicates' | 'variants' | 'cancel'

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
  const pointerXRef = useRef(0)
  const pointerYRef = useRef(0)
  const originRef = useRef({ x: 0, y: 0 })

  const [slideActive, setSlideActive] = useState(false)
  const [slideSel, setSlideSel] = useState<SlideOption>('duplicates')
  const [variantMode, setVariantMode] = useState(false)

  const clearTimer = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (variantMode) return
    didLongPress.current = false
    pointerXRef.current = e.clientX
    pointerYRef.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      originRef.current = { x: pointerXRef.current, y: pointerYRef.current }
      const initial: SlideOption = pointerXRef.current < window.innerWidth / 2 ? 'duplicates' : 'variants'
      slideSelRef.current = initial
      setSlideSel(initial)
      setSlideActive(true)
    }, 500)
  }, [variantMode])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    pointerXRef.current = e.clientX
    pointerYRef.current = e.clientY
    if (!didLongPress.current) return
    const dx = e.clientX - originRef.current.x
    const dy = e.clientY - originRef.current.y
    const next: SlideOption =
      dy > 55 && dy > Math.abs(dx)
        ? 'cancel'
        : e.clientX < window.innerWidth / 2 ? 'duplicates' : 'variants'
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
    if (sel === 'cancel') return
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
    <>
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

        {!variantMode && (
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

      {slideActive && createPortal(
        <div
          className="fixed inset-0 z-[100] flex flex-col pointer-events-none"
          style={{ animation: 'slide-overlay-in 180ms ease-out both' }}
        >
          <div className="absolute inset-0 bg-black/82 backdrop-blur-sm" />

          {/* Chip label */}
          <div className="relative flex justify-center" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 3rem)' }}>
            <span className="text-white/30 text-sm font-mono tracking-wider">{code}</span>
          </div>

          {/* Left / Right options */}
          <div className="relative flex flex-[3] items-center">
            {/* Repetidas */}
            <div className={`flex-1 flex flex-col items-center justify-center gap-5 transition-all duration-150 ${
              slideSel === 'duplicates' ? 'opacity-100 scale-100' : 'opacity-20 scale-[0.93]'
            }`}>
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-colors duration-150 ${
                slideSel === 'duplicates' ? 'bg-duplicate' : 'bg-white/10'
              }`}>
                <span className="text-4xl font-bold text-white leading-none">+</span>
              </div>
              <div className="text-center px-6">
                <p className="text-2xl font-bold text-white">Repetidas</p>
                <p className="text-sm text-white/50 mt-1">Qtd de cópias</p>
              </div>
            </div>

            <div className="w-px bg-white/10 self-stretch my-20" />

            {/* Colecionável */}
            <div className={`flex-1 flex flex-col items-center justify-center gap-5 transition-all duration-150 ${
              slideSel === 'variants' ? 'opacity-100 scale-100' : 'opacity-20 scale-[0.93]'
            }`}>
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-colors duration-150 ${
                slideSel === 'variants' ? 'bg-gold' : 'bg-white/10'
              }`}>
                <Sparkles size={36} className="text-white" />
              </div>
              <div className="text-center px-6">
                <p className="text-2xl font-bold text-white">Colecionável</p>
                <p className="text-sm text-white/50 mt-1">Tipo especial</p>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="w-1/3 h-px bg-white/10" />
          </div>

          {/* Cancel option */}
          <div
            className="relative flex flex-[2] items-center justify-center"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className={`flex flex-col items-center gap-5 transition-all duration-150 ${
              slideSel === 'cancel' ? 'opacity-100 scale-100' : 'opacity-20 scale-[0.93]'
            }`}>
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-colors duration-150 ${
                slideSel === 'cancel' ? 'bg-white/20' : 'bg-white/10'
              }`}>
                <X size={36} className="text-white" />
              </div>
              <div className="text-center px-6">
                <p className="text-2xl font-bold text-white">Cancelar</p>
                <p className="text-sm text-white/50 mt-1">Nenhuma alteração</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

const VARIANTS: { id: StickerVariant; label: string; on: string }[] = [
  { id: 'purple', label: 'Roxa', on: 'bg-purple-500 border-purple-300' },
  { id: 'bronze', label: 'Bronze', on: 'bg-orange-700 border-orange-400' },
  { id: 'silver', label: 'Prata', on: 'bg-slate-300 border-white' },
  { id: 'gold', label: 'Ouro', on: 'bg-gold border-yellow-200' },
]
