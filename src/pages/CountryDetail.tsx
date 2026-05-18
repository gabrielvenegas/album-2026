import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Square, RotateCcw } from "lucide-react";
import { COUNTRIES, getCountryByCode, getStickerCode } from "@/data/album";
import { useCollection, useCountryStats } from "@/store/useCollection";
import { StickerChip } from "@/components/StickerChip";
import { useMemo, useState } from "react";

export function CountryDetail() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const country = code ? getCountryByCode(code) : undefined;
  const [confirmReset, setConfirmReset] = useState(false);

  const { markMultiple, resetCountry } = useCollection();

  const codes = useMemo(
    () => country ? country.stickers.map((s) => getStickerCode(country.code, s)) : [],
    [country]
  );
  const { owned, duplicates, missing } = useCountryStats(codes);

  if (!country) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted">
        País não encontrado
      </div>
    );
  }
  const total = country.stickers.length;
  const pct = Math.round((owned / total) * 100);
  const countryIndex = COUNTRIES.findIndex((c) => c.code === country.code);
  const previousCountry = countryIndex > 0 ? COUNTRIES[countryIndex - 1] : undefined;
  const nextCountry =
    countryIndex >= 0 && countryIndex < COUNTRIES.length - 1
      ? COUNTRIES[countryIndex + 1]
      : undefined;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-none px-4 pt-4 pb-3 bg-bg border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate("/paises")}
            className="text-muted p-1 -ml-1"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-3xl">{country.flag}</span>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-text">{country.name}</h1>
            <p className="text-xs text-muted">
              {country.code} · {pct}% completo
            </p>
          </div>
        </div>

        <div className="h-1.5 bg-border rounded-full  mb-2">
          <div
            className="h-full bg-gradient-to-r from-gold to-owned rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted">
          <span>
            {owned}/{total} coletadas
          </span>
          <span>{duplicates > 0 ? `${duplicates} repetidas` : ""}</span>
          <span>{missing > 0 ? `${missing} faltando` : "Completa!"}</span>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => previousCountry && navigate(`/paises/${previousCountry.code}`)}
            disabled={!previousCountry}
            className="chip-press flex-1 bg-surface border border-border text-muted text-xs font-semibold rounded-xl py-2.5 flex items-center justify-center gap-1 disabled:opacity-35"
          >
            <ChevronLeft size={14} />
            {previousCountry ? previousCountry.code : "Anterior"}
          </button>
          <button
            onClick={() => nextCountry && navigate(`/paises/${nextCountry.code}`)}
            disabled={!nextCountry}
            className="chip-press flex-1 bg-surface border border-border text-muted text-xs font-semibold rounded-xl py-2.5 flex items-center justify-center gap-1 disabled:opacity-35"
          >
            {nextCountry ? nextCountry.code : "Próximo"}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="scroll-area flex-1 px-3 py-3">
        <div className="grid grid-cols-4 gap-2 mb-4">
          {country.stickers.map((sticker) => (
            <StickerChip
              key={sticker.code ?? sticker.number}
              code={getStickerCode(country.code, sticker)}
              label={sticker.label}
              isFoil={sticker.isFoil}
            />
          ))}
        </div>

        <div className="flex gap-4 justify-center text-[10px] text-muted mb-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-missing inline-block" />{" "}
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
        <p className="text-[10px] text-muted text-center mb-4">
          Toque para alternar · Segure para adicionar repetida
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => markMultiple(codes, "owned")}
            className="chip-press flex-1 bg-owned/15 border border-owned/30 text-owned text-sm font-medium rounded-xl py-3 flex items-center justify-center gap-1.5"
          >
            <Check size={15} /> Marcar todas
          </button>
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="chip-press flex-1 bg-surface border border-border text-muted text-sm font-medium rounded-xl py-3 flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} /> Resetar
            </button>
          ) : (
            <button
              onClick={() => {
                resetCountry(country.code, codes);
                setConfirmReset(false);
              }}
              className="chip-press flex-1 bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-medium rounded-xl py-3 flex items-center justify-center gap-1.5"
            >
              <Square size={14} /> Confirmar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
