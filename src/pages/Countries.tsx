import { useState } from "react";
import { Search, Layers, Globe } from "lucide-react";
import { COUNTRIES, Confederation, Group } from "@/data/album";
import { CountryCard } from "@/components/CountryCard";

type ViewMode = "group" | "confederation";

const GROUPS: Group[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "Extras",
];

const CONF_ORDER: Confederation[] = [
  "CONMEBOL",
  "UEFA",
  "CONCACAF",
  "AFC",
  "CAF",
  "OFC",
  "Inter",
];
const CONF_LABELS: Record<Confederation, string> = {
  CONMEBOL: "América do Sul",
  UEFA: "Europa",
  CONCACAF: "América do Norte/Central",
  AFC: "Ásia",
  CAF: "África",
  OFC: "Oceania",
  Inter: "Interconfederações",
};

export function Countries() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("group");

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="scroll-area album-page flex-1">
      <div className="sticky top-0 z-10 bg-bg/95 px-4 pb-4 pt-5 shadow-[0_12px_24px_rgba(0,0,0,0.24)] backdrop-blur space-y-3">
        <div className="album-strip rounded-xl py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">
            Álbum Copa 2026
          </p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black leading-none">Países</h1>
              <p className="mt-1 text-xs font-semibold text-muted">
                Página por grupos ou confederações
              </p>
            </div>
            <span className="rounded-lg bg-surface px-2.5 py-1 text-xs font-black text-text">
              {filtered.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-1 album-control rounded-xl p-1">
            <button
              onClick={() => setView("group")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black transition-colors ${
                view === "group" ? "album-control-active" : "text-text/60"
              }`}
            >
              <Layers size={12} /> Grupos
            </button>
            <button
              onClick={() => setView("confederation")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black transition-colors ${
                view === "confederation"
                  ? "album-control-active"
                  : "text-text/60"
              }`}
            >
              <Globe size={12} /> Conf.
            </button>
          </div>
        </div>

        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            placeholder="Buscar país ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full album-control rounded-xl pl-9 pr-4 py-3 text-sm font-medium text-text placeholder:text-muted outline-none focus:border-gold/60 transition-colors"
          />
        </div>
      </div>

      <div className="px-4 pb-16 pt-4 space-y-7">
        {view === "group"
          ? GROUPS.map((group) => {
              const countries = filtered.filter((c) => c.group === group);
              if (!countries.length) return null;
              return (
                <div key={group}>
                  <h2 className="album-section-label mb-3">
                    {group === "Extras" ? "Extras" : `Grupo ${group}`}
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    {countries.map((country) => (
                      <CountryCard key={country.code} country={country} />
                    ))}
                  </div>
                </div>
              );
            })
          : CONF_ORDER.map((conf) => {
              const countries = filtered.filter(
                (c) => c.confederation === conf,
              );
              if (!countries.length) return null;
              return (
                <div key={conf}>
                  <h2 className="album-section-label mb-3">
                    {CONF_LABELS[conf]}
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    {countries.map((country) => (
                      <CountryCard key={country.code} country={country} />
                    ))}
                  </div>
                </div>
              );
            })}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted">
            <p className="text-sm">Nenhum país encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
