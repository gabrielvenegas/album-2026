import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Sparkles, X } from "lucide-react";
import {
  StickerVariant,
  useCollection,
  useStickerStatus,
  useStickerVariants,
} from "@/store/useCollection";

interface Props {
  code: string;
  label: string;
  isFoil?: boolean;
  image?: string;
}

export function StickerChip({ code, label, isFoil, image }: Props) {
  const status = useStickerStatus(code);
  const variants = useStickerVariants(code);
  const {
    cycleStatus,
    setDuplicateCopies,
    toggleVariant,
    dupCounts,
    confirmBeforeSelect,
  } = useCollection();
  const count = dupCounts[code] ?? 2;
  const repeatedCopies = status === "duplicate" ? count - 1 : 0;

  const chipRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const didMove = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const pointerXRef = useRef(0);
  const pointerYRef = useRef(0);
  const pointerStartRef = useRef({ x: 0, y: 0 });

  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const clearTimer = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (actionMenuOpen) return;
      didLongPress.current = false;
      didMove.current = false;
      activePointerIdRef.current = e.pointerId;
      pointerXRef.current = e.clientX;
      pointerYRef.current = e.clientY;
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      longPressTimer.current = setTimeout(() => {
        if (didMove.current) return;
        didLongPress.current = true;
        setActionMenuOpen(true);
      }, 500);
    },
    [actionMenuOpen],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      pointerXRef.current = e.clientX;
      pointerYRef.current = e.clientY;
      if (!didLongPress.current) {
        const dx = e.clientX - pointerStartRef.current.x;
        const dy = e.clientY - pointerStartRef.current.y;
        if (Math.hypot(dx, dy) > 10) {
          didMove.current = true;
          clearTimer();
        }
        return;
      }
    },
    [clearTimer],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    clearTimer();
    if (
      activePointerIdRef.current !== null &&
      e.currentTarget.hasPointerCapture(activePointerIdRef.current)
    ) {
      e.currentTarget.releasePointerCapture(activePointerIdRef.current);
    }
    activePointerIdRef.current = null;
    if (didMove.current) {
      didMove.current = false;
      didLongPress.current = false;
      return;
    }
    if (!didLongPress.current) {
      if (confirmBeforeSelect) {
        const nextLabel =
          status === "missing"
            ? "coletada"
            : status === "owned"
              ? "repetida"
              : "faltando";
        if (!window.confirm(`Marcar ${code} como ${nextLabel}?`)) return;
      }
      cycleStatus(code);
      return;
    }
    didLongPress.current = false;
  }, [
    clearTimer,
    code,
    cycleStatus,
    confirmBeforeSelect,
    status,
  ]);

  const handlePointerLeave = useCallback(() => {
    if (!didLongPress.current) clearTimer();
  }, [clearTimer]);

  const handlePointerCancel = useCallback(() => {
    clearTimer();
    didLongPress.current = false;
    didMove.current = false;
    activePointerIdRef.current = null;
  }, [clearTimer]);

  const closeActionMenu = useCallback(() => {
    clearTimer();
    didLongPress.current = false;
    didMove.current = false;
    setActionMenuOpen(false);
  }, [clearTimer]);

  const editDuplicates = useCallback(() => {
    const next = window.prompt(
      "Quantas repetidas você tem?",
      String(repeatedCopies || 1),
    );
    if (next === null) return;
    const copies = Number(next.replace(",", "."));
    if (Number.isFinite(copies)) setDuplicateCopies(code, copies);
    setActionMenuOpen(false);
  }, [code, repeatedCopies, setDuplicateCopies]);

  const handleVariantToggle = useCallback(
    (variant: StickerVariant) => {
      toggleVariant(code, variant);
    },
    [code, toggleVariant],
  );

  const bg =
    status === "owned"
      ? "sticker-tile border-owned/35 text-owned"
      : status === "duplicate"
        ? "sticker-tile border-duplicate/45 text-duplicate"
        : "sticker-slot text-muted";

  const foilRing = isFoil && status !== "missing" ? "ring-1 ring-gold/40" : "";
  const showImage = Boolean(image);
  const imageMuted = status === "missing";
  const hasArt = Boolean(image);
  const isLandscape = label === "Foto oficial";
  const sizeClass = hasArt
    ? "aspect-[5/7] w-full min-h-0 p-0"
    : "min-h-[82px] p-2 pb-5 gap-1";

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
        onContextMenu={(e) => e.preventDefault()}
        className={`chip-press relative flex flex-col items-stretch justify-end rounded-xl border select-none touch-pan-y overflow-hidden ${sizeClass} ${bg} ${foilRing}`}
        style={{ WebkitTouchCallout: "none" }}
      >
        {showImage && image && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-zinc-950">
            <span
              aria-hidden="true"
              className={`block h-full w-full bg-contain bg-center bg-no-repeat ${
                isLandscape ? "scale-[1.42] rotate-90" : ""
              } ${imageMuted ? "opacity-60 saturate-50" : ""}`}
              style={{ backgroundImage: `url(${JSON.stringify(image)})` }}
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/92 via-black/55 to-transparent" />
            {imageMuted && (
              <span className="pointer-events-none absolute inset-0 bg-black/50" />
            )}
          </div>
        )}

        {showImage ? (
          <div className="relative z-[1] w-full px-1.5 pb-1.5 pt-8">
            <p className="text-[10px] font-black leading-none text-white drop-shadow-md">
              {code}
            </p>
            <p className="mt-0.5 line-clamp-2 text-center text-[8px] font-semibold leading-tight text-white/90 drop-shadow-md">
              {label}
            </p>
          </div>
        ) : (
          <>
            {status !== "missing" && (
              <span className="absolute left-1.5 top-1.5 z-[2] h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            )}
            <span
              className={`relative z-[1] text-xs font-black leading-none ${
                status === "missing" ? "text-muted" : ""
              }`}
            >
              {code}
            </span>
            <span
              className={`relative z-[1] line-clamp-2 px-0.5 text-center text-[9px] font-semibold leading-tight ${
                status === "missing" ? "text-muted/55" : "text-muted"
              }`}
            >
              {label}
            </span>
          </>
        )}

        {status === "owned" && (
          <span className="absolute right-1 top-1 rounded-md bg-owned/12 p-0.5">
            <Check size={10} strokeWidth={3} />
          </span>
        )}
        {status === "duplicate" && (
          <span className="absolute top-1 right-1 text-[9px] bg-duplicate text-white rounded-md min-w-4 h-4 px-1 flex items-center justify-center font-black">
            {count}
          </span>
        )}
        {isFoil && (
          <span className="absolute bottom-1 left-1 text-gold opacity-80">
            <Sparkles size={8} />
          </span>
        )}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
          {VARIANTS.map((v) => (
            <span
              key={v.id}
              className={`h-2.5 w-2.5 rounded-full border ${
                variants[v.id]
                  ? v.on
                  : status === "missing"
                    ? "bg-transparent border-gold/20"
                    : "bg-transparent border-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      {actionMenuOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end bg-black/70 px-3 pb-3 backdrop-blur-sm"
            onPointerDown={closeActionMenu}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`sticker-menu-${code}`}
              className="w-full rounded-2xl border border-white/10 bg-surface p-3 shadow-2xl"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    id={`sticker-menu-${code}`}
                    className="text-sm font-black text-text"
                  >
                    {code}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-muted">
                    {label}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Fechar menu"
                  onClick={closeActionMenu}
                  className="chip-press flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-muted"
                >
                  <X size={18} />
                </button>
              </div>

              <button
                type="button"
                onClick={editDuplicates}
                className="chip-press mb-3 flex w-full items-center justify-between rounded-xl border border-duplicate/35 bg-duplicate/15 px-3 py-3 text-left"
              >
                <span>
                  <span className="block text-sm font-black text-duplicate">
                    Repetidas
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-muted">
                    Ajustar quantidade de cópias
                  </span>
                </span>
                <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-duplicate text-sm font-black text-white">
                  {repeatedCopies || "+"}
                </span>
              </button>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-black text-text">
                    Colecionável
                  </span>
                  <Sparkles size={16} className="text-gold" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {VARIANTS.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleVariantToggle(v.id)}
                      className={`chip-press flex h-12 items-center justify-center rounded-xl border-2 text-[10px] font-black ${
                        variants[v.id] ? `${v.on} text-bg` : `${v.off} text-muted`
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

const VARIANTS: {
  id: StickerVariant;
  label: string;
  on: string;
  off: string;
}[] = [
  {
    id: "purple",
    label: "Roxa",
    on: "bg-purple-500 border-purple-300",
    off: "bg-transparent border-purple-500",
  },
  {
    id: "bronze",
    label: "Bronze",
    on: "bg-orange-700 border-orange-500",
    off: "bg-transparent border-orange-700",
  },
  {
    id: "silver",
    label: "Prata",
    on: "bg-slate-300  border-white",
    off: "bg-transparent border-slate-400",
  },
  {
    id: "gold",
    label: "Ouro",
    on: "bg-gold border-yellow-200",
    off: "bg-transparent border-gold",
  },
];
