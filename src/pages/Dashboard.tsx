import { useNavigate } from "react-router-dom";
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

  const worstCountries = COUNTRIES.map((c) => {
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
  })
    .filter((x) => x.missing > 0)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5);

  return (
    <div className="scroll-area flex-1 px-4 py-6">
      <div className="mb-6">
        <p className="text-muted text-sm">Copa do Mundo</p>
        <h1 className="text-2xl font-bold text-text">Meu Álbum 2026</h1>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <ProgressRing
            percent={pct}
            size={160}
            stroke={10}
            color="#fbbf24"
            trackColor="#1e2b24"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gold">{pct}%</span>
            <span className="text-xs text-muted">completo</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard label="Coletadas" value={owned} color="text-owned" />
        <StatCard label="Faltando" value={missing} color="text-muted" />
        <StatCard label="Repetidas" value={duplicates} color="text-duplicate" />
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted mb-2">
          <span>
            {owned} de {TOTAL_STICKERS} figurinhas
          </span>
          <span>{missing} faltando</span>
        </div>
        <div className="h-2 bg-border rounded-full ">
          <div
            className="h-full bg-gradient-to-r from-gold to-owned rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {worstCountries.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
            Países mais incompletos
          </h2>
          <div className="space-y-2">
            {worstCountries.map(({ country, missing: m, pct: p }) => (
              <button
                key={country.code}
                onClick={() => navigate(`/paises/${country.code}`)}
                className="chip-press w-full flex items-center gap-3 bg-surface border border-border rounded-xl px-3 py-2.5"
              >
                <span className="text-2xl">{country.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">
                    {country.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1 bg-border rounded-full ">
                      <div
                        className="h-full bg-gold/60 rounded-full"
                        style={{ width: `${p}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted shrink-0">{p}%</span>
                  </div>
                </div>
                <span className="text-xs text-muted shrink-0">-{m}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-muted mt-0.5">{label}</p>
    </div>
  );
}
