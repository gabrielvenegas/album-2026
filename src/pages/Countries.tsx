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
];

const CONF_ORDER: Confederation[] = [
  "CONMEBOL",
  "UEFA",
  "CONCACAF",
  "AFC",
  "CAF",
  "OFC",
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
    <div className="scroll-area flex-1">
      <div className="sticky top-0 z-10 bg-[#111816] px-4 pt-6 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text">Países</h1>
          <div className="flex bg-surface border border-border rounded-xl ">
            <button
              onClick={() => setView("group")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === "group" ? "bg-gold text-bg" : "text-muted"
              }`}
            >
              <Layers size={12} /> Grupos
            </button>
            <button
              onClick={() => setView("confederation")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === "confederation" ? "bg-gold text-bg" : "text-muted"
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
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text placeholder-muted outline-none focus:border-gold/50 transition-colors"
          />
        </div>
      </div>

      <div className="px-4 pb-6 space-y-6">
        {view === "group"
          ? GROUPS.map((group) => {
              const countries = filtered.filter((c) => c.group === group);
              if (!countries.length) return null;
              return (
                <div key={group}>
                  <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
                    Grupo {group}
                  </h2>
                  <div className="grid grid-cols-3 gap-2">
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
                  <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
                    {CONF_LABELS[conf]}
                  </h2>
                  <div className="grid grid-cols-3 gap-2">
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
