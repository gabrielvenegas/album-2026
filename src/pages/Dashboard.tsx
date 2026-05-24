import { useNavigate } from "react-router-dom";
import { Copy, Flag, ScanLine, Trophy, Wallet } from "lucide-react";
import { COUNTRIES, TOTAL_STICKERS, getStickerCode } from "@/data/album";
import { useCollection } from "@/store/useCollection";
import { ProgressRing } from "@/components/ProgressRing";

export function Dashboard() {
  const navigate = useNavigate();
  const { statuses, spendingEntries } = useCollection();

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

  const totalSpent = spendingEntries.reduce((sum, e) => sum + e.amount, 0);
  const costPerSticker = owned > 0 && totalSpent > 0 ? totalSpent / owned : 0;
  const dupRatio = owned > 0 ? Math.round((duplicates / owned) * 100) : 0;

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
      total: codes.length,
    };
  });

  const startedCountries = countryStats.filter((x) => x.owned > 0);

  const bestCountry =
    startedCountries.length > 0
      ? startedCountries.reduce((a, b) => (b.pct > a.pct ? b : a))
      : null;

  const worstCountry =
    startedCountries.filter((x) => x.pct < 100).length > 0
      ? startedCountries
          .filter((x) => x.pct < 100)
          .reduce((a, b) => (b.pct < a.pct ? b : a))
      : null;

  const almostComplete = countryStats
    .filter((x) => x.missing > 0 && x.owned > 0 && x.missing <= 5)
    .sort((a, b) => a.missing - b.missing || b.pct - a.pct)
    .slice(0, 4);

  return (
    <div className="scroll-area album-page flex-1">
      <div className="page-container pb-6">
        <div className="app-header mb-5 px-0">
          <p className="app-header-kicker">Copa do Mundo · 2026</p>
          <h1 className="mt-7 text-3xl font-black leading-[0.95] text-text lg:text-4xl">
            Meu Álbum
            <br />
            <span className="text-gold">2026</span>
          </h1>
          <p className="app-header-subtitle">
            {owned} de {TOTAL_STICKERS} figurinhas coladas
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center gap-5">
              <div className="relative shrink-0 rounded-full bg-[#151b1f] p-2">
                <ProgressRing
                  percent={pct}
                  size={104}
                  stroke={9}
                  color="#ffb238"
                  trackColor="rgba(255,244,215,0.08)"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-gold">{pct}%</span>
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

            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <KpiCard label="Coletadas" value={owned} color="text-owned" />
              <KpiCard label="Faltando" value={missing} color="text-text" />
              <KpiCard
                label="Repetidas"
                value={duplicates}
                sub={dupRatio > 0 ? `${dupRatio}% das coletadas` : undefined}
                color="text-duplicate"
                onClick={() => navigate("/repetidas")}
              />
              <KpiCard
                label="Gastos"
                value={formatBRL(totalSpent)}
                sub={
                  costPerSticker > 0
                    ? `${formatBRL(costPerSticker)} / fig`
                    : undefined
                }
                color="text-text"
                onClick={() => navigate("/config")}
              />
              {bestCountry ? (
                <CountryKpiCard
                  label="Melhor país"
                  country={bestCountry.country}
                  pct={bestCountry.pct}
                  owned={bestCountry.owned}
                  total={bestCountry.total}
                  accent="text-gold"
                  onClick={() =>
                    navigate(`/paises/${bestCountry.country.code}`)
                  }
                />
              ) : (
                <KpiCard label="Melhor país" value="—" color="text-muted" />
              )}
              {worstCountry ? (
                <CountryKpiCard
                  label="Pior país"
                  country={worstCountry.country}
                  pct={worstCountry.pct}
                  owned={worstCountry.owned}
                  total={worstCountry.total}
                  accent="text-duplicate"
                  onClick={() =>
                    navigate(`/paises/${worstCountry.country.code}`)
                  }
                />
              ) : (
                <KpiCard label="Pior país" value="—" color="text-muted" />
              )}
            </div>

            {/* Shortcuts */}
            <div className="grid grid-cols-4 gap-2">
              <ShortcutButton
                label="Países"
                Icon={Flag}
                onClick={() => navigate("/paises")}
              />
              <ShortcutButton
                label="Trocas"
                Icon={Copy}
                onClick={() => navigate("/repetidas")}
              />
              <ShortcutButton
                label="Gastos"
                Icon={Wallet}
                onClick={() => navigate("/config")}
              />
              <ShortcutButton
                label="Scanner"
                Icon={ScanLine}
                onClick={() => navigate("/scanner")}
              />
            </div>
          </div>

          {/* Almost complete */}
          {almostComplete.length > 0 && (
            <div className="mt-6 lg:mt-0">
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
        </div>
      </div>
    </div>
  );
}

function formatBRL(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function KpiCard({
  label,
  value,
  sub,
  color,
  onClick,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="sticker-tile chip-press flex flex-col items-start rounded-xl px-4 py-3.5 disabled:cursor-default"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-black leading-none ${color}`}>
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-[11px] font-semibold text-muted">{sub}</p>
      )}
    </button>
  );
}

function CountryKpiCard({
  label,
  country,
  pct,
  owned,
  total,
  accent,
  onClick,
}: {
  label: string;
  country: { flag: string; name: string };
  pct: number;
  owned: number;
  total: number;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="sticker-tile chip-press flex flex-col items-start rounded-xl px-4 py-3.5"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="text-xl leading-none">{country.flag}</span>
        <span className={`text-sm font-black leading-tight ${accent}`}>
          {pct}%
        </span>
      </div>
      <p className="mt-0.5 truncate text-[11px] font-semibold text-muted">
        {country.name}
      </p>
      <div className="mt-2 h-1 w-full rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gold/60"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] font-semibold text-muted">
        {owned}/{total}
      </p>
    </button>
  );
}

function ShortcutButton({
  label,
  Icon,
  onClick,
}: {
  label: string;
  Icon: React.ElementType;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="chip-press sticker-tile flex flex-col items-center justify-center gap-1.5 rounded-xl py-3.5 text-[11px] font-black text-text"
    >
      <Icon size={18} strokeWidth={2.5} />
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
      className="chip-press sticker-tile flex w-full items-center gap-3 rounded-xl px-3 py-2.5"
    >
      <span className="text-xl">{flag}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-black text-text">{name}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <div className="h-1 flex-1 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gold/60"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-bold text-muted">{pct}%</span>
        </div>
      </div>
      <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-black text-muted">
        {badge}
      </span>
    </button>
  );
}
