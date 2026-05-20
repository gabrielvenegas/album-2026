import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Square, RotateCcw, Search, X } from "lucide-react";
import { COUNTRIES, getCountryByCode, getStickerCode } from "@/data/album";
import { useCollection, useCountryStats } from "@/store/useCollection";
import { StickerChip } from "@/components/StickerChip";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

export function CountryDetail() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const country = code ? getCountryByCode(code) : undefined;
  const [confirmReset, setConfirmReset] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { markMultiple, resetCountry } = useCollection();

  const codes = useMemo(
    () => country ? country.stickers.map((s) => getStickerCode(country.code, s)) : [],
    [country]
  );
  const { owned, duplicates, missing } = useCountryStats(codes);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  useEffect(() => {
    if (isSearchOpen) {
      setSelectedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 10);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCountries.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCountries.length) % Math.max(1, filteredCountries.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCountries[selectedIndex]) {
        navigate(`/paises/${filteredCountries[selectedIndex].code}`);
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    }
  };

  if (!country) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted">
        País não encontrado
      </div>
    );
  }
  const total = country.stickers.length;
  const pct = Math.round((owned / total) * 100);
  const hasStickerArt = country.stickers.some((s) => Boolean(s.image));
  const countryIndex = COUNTRIES.findIndex((c) => c.code === country.code);
  const previousCountry = countryIndex > 0 ? COUNTRIES[countryIndex - 1] : undefined;
  const nextCountry =
    countryIndex >= 0 && countryIndex < COUNTRIES.length - 1
      ? COUNTRIES[countryIndex + 1]
      : undefined;

  return (
    <div className="album-page flex flex-1 flex-col min-h-0">
      <div className="flex-none px-4 pt-4 pb-3 bg-bg/95 border-b border-border shadow-[0_12px_24px_rgba(0,0,0,0.2)]">
        <div className="mx-auto w-full max-w-7xl">
        <div className="app-header px-0 py-0">
          <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/paises")}
              className="chip-press flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-text"
          >
            <ArrowLeft size={20} />
          </button>
            <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-2xl shadow-inner">
              {country.flag}
            </span>
            <div className="min-w-0 flex-1">
              <p className="app-header-kicker">
                {country.code} · {country.group === "Extras" ? "Extras" : `Grupo ${country.group}`}
              </p>
              <h1 className="truncate text-lg font-black leading-tight text-text">
                {country.name}
              </h1>
            </div>
            <span className="rounded-lg bg-gold px-2 py-1 text-sm font-black text-text">
              {pct}%
            </span>
          </div>

          <div className="mt-3 h-2 rounded-full bg-surface/12">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold via-amber-400 to-owned transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Coletadas" value={`${owned}/${total}`} tone="owned" />
            <MiniStat label="Repetidas" value={duplicates} tone="duplicate" />
            <MiniStat label="Faltando" value={missing > 0 ? missing : "OK"} tone="missing" />
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => previousCountry && navigate(`/paises/${previousCountry.code}`)}
            disabled={!previousCountry}
            className="chip-press album-control flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-black disabled:opacity-35"
          >
            <ChevronLeft size={14} />
            {previousCountry ? previousCountry.code : "Anterior"}
          </button>
          <button
            onClick={() => nextCountry && navigate(`/paises/${nextCountry.code}`)}
            disabled={!nextCountry}
            className="chip-press album-control flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-black disabled:opacity-35"
          >
            {nextCountry ? nextCountry.code : "Próximo"}
            <ChevronRight size={14} />
          </button>
        </div>
        </div>
      </div>

      <div className="scroll-area flex-1 px-3 py-4 md:px-6">
        <div className="mx-auto w-full max-w-7xl">
        <div className="mb-4 flex items-center justify-between px-1">
          <h2 className="album-section-label">Figurinhas</h2>
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted">
            {total} espaços
          </span>
        </div>

        <div
          className={`mb-4 grid gap-2.5 ${
            hasStickerArt
              ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
              : "grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8"
          }`}
        >
          {country.stickers.map((sticker) => (
            <StickerChip
              key={sticker.code ?? sticker.number}
              code={getStickerCode(country.code, sticker)}
              label={sticker.label}
              isFoil={sticker.isFoil}
              image={sticker.image}
            />
          ))}
        </div>

        <div className="sticker-slot mb-3 rounded-xl px-3 py-2">
          <div className="flex gap-4 justify-center text-[10px] font-semibold text-text/70">
          <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm border border-white/20 bg-transparent inline-block" />{" "}
            Faltando
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-owned inline-block" />{" "}
            Coletada
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-duplicate inline-block" />{" "}
            Repetida
          </span>
        </div>
          <p className="mt-1 text-center text-[10px] font-medium text-text/45">
            Toque para alternar · Segure para opções
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => markMultiple(codes, "owned")}
            className="chip-press flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-owned/40 bg-owned/20 py-3 text-sm font-bold text-owned"
          >
            <Check size={15} /> Marcar todas
          </button>
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="chip-press album-control flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold text-muted"
            >
              <RotateCcw size={14} /> Resetar
            </button>
          ) : (
            <button
              onClick={() => {
                resetCountry(country.code, codes);
                setConfirmReset(false);
              }}
              className="chip-press flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/15 py-3 text-sm font-bold text-red-400"
            >
              <Square size={14} /> Confirmar
            </button>
          )}
        </div>
        </div>
      </div>

      {isSearchOpen && createPortal(
        <div 
          className="sticker-sheet-backdrop fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-4 pt-[15vh] backdrop-blur-sm"
          onClick={() => setIsSearchOpen(false)}
        >
          <div 
            className="sticker-sheet-panel w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative border-b border-white/5 p-4">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar país ou código..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full rounded-xl bg-white/5 py-3 pl-12 pr-10 text-base font-medium text-text placeholder:text-muted outline-none focus:ring-1 focus:ring-gold/50"
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-7 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto py-2">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((c, i) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      navigate(`/paises/${c.code}`);
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`flex w-full items-center gap-3 px-6 py-3 text-left transition-colors ${
                      i === selectedIndex ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-xl shadow-inner">
                      {c.flag}
                    </span>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${i === selectedIndex ? "text-gold" : "text-text"}`}>
                        {c.name}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                        {c.code} · Grupo {c.group}
                      </p>
                    </div>
                    {i === selectedIndex && (
                      <span className="text-[10px] font-black text-gold/60 uppercase">
                        Enter
                      </span>
                    )}
                  </button>
                ))
              ) : searchQuery ? (
                <div className="px-6 py-8 text-center text-sm text-muted">
                  Nenhum país encontrado para "{searchQuery}"
                </div>
              ) : (
                <div className="px-6 py-8 text-center text-sm text-muted">
                  Digite para buscar países...
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "owned" | "duplicate" | "missing";
}) {
  const toneClass =
    tone === "owned"
      ? "text-owned"
      : tone === "duplicate"
        ? "text-duplicate"
        : "text-muted";

  return (
    <div className="rounded-lg border border-white/10 bg-white/10 px-2 py-1.5">
      <p className={`text-xs font-black leading-none ${toneClass}`}>{value}</p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-muted">
        {label}
      </p>
    </div>
  );
}
