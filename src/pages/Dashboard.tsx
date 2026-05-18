import { useNavigate } from "react-router-dom";
import { Copy, Flag, ScanLine, Trophy } from "lucide-react";
import { COUNTRIES, TOTAL_STICKERS, getStickerCode } from "@/data/album";
import { useCollection } from "@/store/useCollection";
import { ProgressRing } from "@/components/ProgressRing";

export function Dashboard() {
  const navigate = useNavigate();
  const { statuses } = useCollection();

  let owned = 0,
    duplicates = 0;
  for (const st of Object.values(statuses)) {
    if (st === "owned") owned++;
    else if (st === "duplicate") {
      owned++;
      duplicates++;
    }
  }
  const missing = TOTAL_STICKERS - owned;
  const pct = Math.round((owned / TOTAL_STICKERS) * 100);

  const countryStats = COUNTRIES.map((c) => {
    const codes = c.stickers.map((s) => getStickerCode(c.code, s));
    const own = codes.filter(
      (code) => statuses[code] === "owned" || statuses[code] === "duplicate",
    ).length;
    return {
      country: c,
      owned: own,
      missing: codes.length - own,
      pct: Math.round((own / codes.length) * 100),
    };
  });

  const almostComplete = countryStats
    .filter((x) => x.missing > 0 && x.owned > 0 && x.missing <= 5)
    .sort((a, b) => a.missing - b.missing || b.pct - a.pct)
    .slice(0, 4);

  const worstCountries = countryStats
    .filter((x) => x.missing > 0)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5);

  return (
    <div className="scroll-area album-page flex-1 px-4 pb-6">
      <div className="app-header mb-5 px-0">
        <p className="app-header-kicker">Copa do Mundo · 2026</p>
        <h1 className="mt-7 text-3xl font-black leading-[0.95] text-text">
          Meu Álbum<br />
          <span className="text-gold">2026</span>
        </h1>
        <p className="app-header-subtitle">
          {owned} de {TOTAL_STICKERS} figurinhas coladas
        </p>
      </div>

      <div className="mb-6 flex items-center gap-5">
        <div className="relative shrink-0 rounded-full bg-[#151b1f] p-2">
          <ProgressRing
            percent={pct}
            size={86}
            stroke={8}
            color="#ffb238"
            trackColor="rgba(255,244,215,0.08)"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-gold">{pct}%</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
            Faltam
          </p>
          <p className="mt-1 text-3xl font-black leading-none text-text">
            {missing}
          </p>
          <p className="mt-2 text-xs font-semibold text-muted">
            de {TOTAL_STICKERS} figurinhas
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-0 border-y border-border py-5">
        <InlineStat label="Coletadas" value={owned} color="text-owned" />
        <InlineStat label="Repetidas" value={duplicates} color="text-duplicate" />
        <InlineStat label="Completo" value={`${pct}%`} color="text-text" />
      </div>

      <button
        onClick={() => navigate("/scanner")}
        className="chip-press mb-4 flex w-full items-center gap-3 rounded-2xl bg-gold px-5 py-4 text-left text-bg shadow-[0_14px_30px_rgba(255,178,56,0.18)]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071011]/10">
          <ScanLine size={22} strokeWidth={2.6} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black leading-tight">
            Escanear pacotinho
          </span>
          <span className="block text-xs font-semibold opacity-75">
            Aponte a câmera para suas figurinhas
          </span>
        </span>
      </button>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border mb-5">
        <ActionButton
          label="Países"
          Icon={Flag}
          onClick={() => navigate("/paises")}
        />
        <ActionButton
          label="Trocas"
          Icon={Copy}
          onClick={() => navigate("/repetidas")}
        />
      </div>

      {duplicates > 0 && (
        <button
          onClick={() => navigate("/repetidas")}
          className="chip-press mb-6 flex w-full items-center gap-3 rounded-xl border border-duplicate/30 bg-duplicate/10 px-4 py-4 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-duplicate text-white">
            <Copy size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-duplicate">
              {duplicates} repetida{duplicates === 1 ? "" : "s"} para trocar
            </p>
            <p className="text-xs font-semibold text-muted">
              Compare com amigos e aplique trocas no álbum
            </p>
          </div>
        </button>
      )}

      {almostComplete.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Trophy size={14} className="text-gold" />
            <h2 className="album-section-label">Quase completos</h2>
          </div>
          <div className="space-y-2">
            {almostComplete.map(({ country, missing: m, pct: p }) => (
              <CountryRow
                key={country.code}
                flag={country.flag}
                name={country.name}
                pct={p}
                badge={`-${m}`}
                onClick={() => navigate(`/paises/${country.code}`)}
              />
            ))}
          </div>
        </div>
      )}

      {worstCountries.length > 0 && (
        <div className="mb-6">
          <h2 className="album-section-label mb-3">Mais incompletos</h2>
          <div className="space-y-2">
            {worstCountries.map(({ country, missing: m, pct: p }) => (
              <CountryRow
                key={country.code}
                flag={country.flag}
                name={country.name}
                pct={p}
                badge={`-${m}`}
                onClick={() => navigate(`/paises/${country.code}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  label,
  Icon,
  onClick,
  tone = "secondary",
}: {
  label: string;
  Icon: React.ElementType;
  onClick: () => void;
  tone?: "primary" | "secondary";
}) {
  return (
    <button
      onClick={onClick}
      className={`chip-press flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-black ${
        tone === "primary"
          ? "bg-gold text-bg"
          : "bg-surface text-text"
      }`}
    >
      <Icon size={19} strokeWidth={2.5} />
      {label}
    </button>
  );
}

function CountryRow({
  flag,
  name,
  pct,
  badge,
  onClick,
}: {
  flag: string;
  name: string;
  pct: number;
  badge: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="chip-press sticker-tile w-full flex items-center gap-3 rounded-xl px-3 py-2.5"
    >
      <span className="text-xl">{flag}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-black text-text">{name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1 bg-white/10 rounded-full">
            <div
              className="h-full bg-gold/60 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-muted shrink-0">
            {pct}%
          </span>
        </div>
      </div>
      <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-black text-muted shrink-0">
        {badge}
      </span>
    </button>
  );
}

function InlineStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="border-r border-border px-3 last:border-r-0">
      <p className={`text-xl font-black ${color}`}>{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-muted">
        {label}
      </p>
    </div>
  );
}
