import { useRef, useState } from "react";
import {
  ClipboardCopy,
  Check,
  Trophy,
  Wand2,
  Send,
  Inbox,
} from "lucide-react";
import { COUNTRIES, getStickerCode } from "@/data/album";
import { useCollection } from "@/store/useCollection";
import { formatDuplicatesAsText } from "@/lib/export";
import { parseDuplicateListWithAi } from "@/lib/ai";

const VALID_STICKER_CODES = new Set(
  COUNTRIES.flatMap((country) =>
    country.stickers.map((sticker) => getStickerCode(country.code, sticker)),
  ),
);
const ALL_STICKER_CODES = COUNTRIES.flatMap((country) =>
  country.stickers.map((sticker) => getStickerCode(country.code, sticker)),
);
const STICKER_INDEX_BY_CODE = new Map(
  ALL_STICKER_CODES.map((code, index) => [code, index] as const),
);

interface TradeProfile {
  owned: Set<string>;
  duplicateCounts: Map<string, number>;
  source: "share" | "text" | "ai";
}

export function Duplicates() {
  const { statuses, dupCounts, apiKey, decrementDup, setStatus } =
    useCollection();
  const exportRef = useRef<HTMLDivElement>(null);
  const [aiParsing, setAiParsing] = useState(false);
  const [aiParseError, setAiParseError] = useState("");
  const [copied, setCopied] = useState(false);
  const [friendInput, setFriendInput] = useState("");
  const [aiParsedDuplicates, setAiParsedDuplicates] =
    useState<Map<string, number> | null>(null);
  const [toast, setToast] = useState("");

  const groups = COUNTRIES.map((c) => {
    const dups = c.stickers
      .map((s) => {
        const code = getStickerCode(c.code, s);
        return statuses[code] === "duplicate"
          ? { code, count: dupCounts[code] ?? 2 }
          : null;
      })
      .filter(Boolean) as { code: string; count: number }[];
    return { country: c, stickers: dups };
  }).filter((g) => g.stickers.length > 0);

  const totalDups = groups.reduce(
    (sum, g) => sum + g.stickers.reduce((s, x) => s + (x.count - 1), 0),
    0,
  );
  const myDuplicateCounts = new Map(
    groups.flatMap((g) =>
      g.stickers.map((s) => [s.code, Math.max(0, s.count - 1)] as const),
    ),
  );
  const localFriendDuplicateCounts = parseDuplicateText(friendInput);
  const sharedProfile = parseSharedTradeProfile(friendInput);
  const friendProfile: TradeProfile =
    aiParsedDuplicates
      ? { owned: new Set(), duplicateCounts: aiParsedDuplicates, source: "ai" }
      : sharedProfile ?? {
          owned: new Set(),
          duplicateCounts: localFriendDuplicateCounts,
          source: "text",
        };
  const friendDuplicateCounts = friendProfile.duplicateCounts;
  const friendDuplicateCodes = [...friendDuplicateCounts.keys()];
  const friendCanGive = friendDuplicateCodes.filter(
    (code) => !hasSticker(code),
  );
  const iCanGive = [...myDuplicateCounts.keys()].filter(
    (code) =>
      friendProfile.source === "share"
        ? !friendProfile.owned.has(code)
        : !friendDuplicateCounts.has(code),
  );
  const suggestedSwaps = friendCanGive
    .slice(0, iCanGive.length)
    .map((receive, i) => ({ receive, give: iCanGive[i] }));

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleCopyText() {
    const duplicateText = formatDuplicatesAsText(
      groups.map((g) => ({
        country: g.country.name,
        flag: g.country.flag,
        stickers: g.stickers,
      })),
    );
    const text = [
      "Minha lista para troca no álbum da Copa 2026:",
      "",
      duplicateText,
      "",
      "Código para comparar no app:",
      createTradeShareCode(statuses, myDuplicateCounts),
    ].join("\n");

    try {
      await copyTextToClipboard(text);
      setCopied(true);
      showToast("Lista copiada.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      showToast("Não foi possível copiar. Tente novamente.");
    }
  }

  async function handleAnalyzeFriendList() {
    if (!friendInput.trim()) return;
    if (!apiKey) {
      setAiParseError("Configure sua chave de API em Configurações.");
      return;
    }
    setAiParsing(true);
    setAiParseError("");
    try {
      const codes = await parseDuplicateListWithAi(apiKey, friendInput);
      const parsed = countCodes(codes);
      setAiParsedDuplicates(parsed);
      showToast(`${parsed.size} tipo(s) encontrados pela IA.`);
    } catch (e) {
      setAiParseError(
        `Erro: ${e instanceof Error ? e.message : "Falha na conexão"}`,
      );
    } finally {
      setAiParsing(false);
    }
  }

  function handleAutoExchange() {
    if (!suggestedSwaps.length) return;
    for (const swap of suggestedSwaps) {
      decrementDup(swap.give);
      setStatus(swap.receive, "owned");
    }
    setAiParsedDuplicates(null);
    setFriendInput("");
    showToast(`${suggestedSwaps.length} troca(s) aplicadas ao álbum.`);
  }

  if (groups.length === 0) {
    return (
      <div className="album-page flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
        <div className="sticker-tile rounded-xl px-6 py-5">
          <p className="text-lg font-black text-text">Sem repetidas</p>
          <p className="mt-2 text-sm font-semibold text-muted">
            Marque figurinhas como repetidas tocando duas vezes em um país.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="album-page flex flex-col flex-1 min-h-0">
      {toast && (
        <div className="toast-safe fixed left-4 right-4 z-50 bg-owned text-white text-sm font-semibold rounded-xl px-4 py-3 text-center shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex-none px-4 pt-5 pb-3">
        <div className="app-header px-0 py-0">
          <p className="app-header-kicker">Área de trocas</p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <div>
              <h1 className="app-header-title">Repetidas</h1>
              <p className="app-header-subtitle">
                Figurinhas prontas para negociar
              </p>
            </div>
            <span className="rounded-lg bg-duplicate px-2.5 py-1 text-sm font-black text-white">
              {totalDups}
            </span>
          </div>
        </div>
      </div>

      <div className="scroll-area flex-1 px-4 pb-4">
        <div className="mb-4 grid gap-3">
          <div className="sticker-slot rounded-xl p-4">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-duplicate/15 text-duplicate">
                <Send size={17} />
              </div>
              <div className="min-w-0">
                <p className="album-section-label">1. Compartilhe sua lista</p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">
                  O texto inclui suas repetidas e um código compacto com as
                  figurinhas que você já tem.
                </p>
              </div>
            </div>
            <button
              onClick={handleCopyText}
              className="chip-press flex w-full items-center justify-center gap-1.5 rounded-xl bg-duplicate px-3 py-3 text-xs font-black text-white"
            >
              {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
              {copied ? "Copiado!" : "Copiar lista de troca"}
            </button>
          </div>

          <div className="sticker-slot rounded-xl p-4">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
                <Inbox size={17} />
              </div>
              <div className="min-w-0">
                <p className="album-section-label">2. Compare com alguém</p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">
                  Cole o texto do app para uma comparação completa, ou uma lista
                  simples de repetidas para uma comparação rápida.
                </p>
              </div>
            </div>
            <textarea
              value={friendInput}
              onChange={(e) => {
                setFriendInput(e.target.value);
                setAiParsedDuplicates(null);
                setAiParseError("");
              }}
              placeholder="Cole aqui a lista ou o código de troca..."
              className="w-full h-28 album-control rounded-xl px-3 py-2.5 text-base text-text placeholder:text-muted outline-none focus:border-gold/60 resize-none transition-colors"
            />

            {friendInput.trim() && (
              <div className="mt-3">
                {friendProfile.source !== "share" && (
                  <button
                    onClick={handleAnalyzeFriendList}
                    disabled={aiParsing}
                    className="chip-press mb-3 w-full border border-gold/30 bg-gold/15 text-gold text-xs font-black rounded-xl py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Wand2 size={14} />
                    {aiParsing
                      ? "Analisando lista..."
                      : "Entender lista com IA"}
                  </button>
                )}

                <div className="mb-3 rounded-xl border border-white/10 bg-bg/55 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                    {friendProfile.source === "share"
                      ? "Código do app"
                      : aiParsedDuplicates
                        ? "Resultado da IA"
                        : "Leitura automática local"}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-text/75">
                    {friendDuplicateCounts.size} tipo(s) de repetida(s)
                    encontrados
                  </p>
                  {friendProfile.source === "share" && (
                    <p className="mt-1 text-[10px] text-muted">
                      A comparação também considera o que a outra pessoa já tem.
                    </p>
                  )}
                  {localFriendDuplicateCounts.size > 0 &&
                    aiParsedDuplicates &&
                    localFriendDuplicateCounts.size !==
                      aiParsedDuplicates.size && (
                      <p className="mt-1 text-[10px] text-muted">
                        A IA substituiu a leitura local para essa comparação.
                      </p>
                    )}
                </div>

                {aiParseError && (
                  <p className="mb-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400">
                    {aiParseError}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <MiniStat
                    label="Seu amigo tem e você falta"
                    value={friendCanGive.length}
                  />
                  <MiniStat
                    label={
                      friendProfile.source === "share"
                        ? "Você tem e a pessoa precisa"
                        : "Você tem e ele não listou"
                    }
                    value={iCanGive.length}
                  />
                </div>

              {suggestedSwaps.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-black text-text">
                    Sugestão automática:
                  </p>
                  {suggestedSwaps.map(({ receive, give }) => (
                    <div
                      key={`${give}-${receive}`}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-bg/70 px-3 py-2"
                    >
                      <span className="text-xs text-muted">Você dá</span>
                      <span className="font-bold text-duplicate text-sm">
                        {give}
                      </span>
                      <span className="text-xs text-muted">e recebe</span>
                      <span className="font-bold text-owned text-sm">
                        {receive}
                      </span>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        formatSwapSuggestion(suggestedSwaps),
                      )
                    }
                    className="chip-press w-full bg-owned/15 border border-owned/30 text-owned text-xs font-black rounded-xl py-2.5"
                  >
                    Copiar sugestão
                  </button>
                  <button
                    onClick={handleAutoExchange}
                    className="chip-press w-full bg-owned text-white text-xs font-black rounded-xl py-3"
                  >
                    Aplicar troca no álbum
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted text-center py-2">
                  Nenhuma troca direta encontrada com essa lista.
                </p>
              )}
            </div>
          )}
          </div>
        </div>

        <div ref={exportRef} className="album-strip rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={22} className="text-gold" />
            <div>
              <p className="text-sm font-black text-text">
                Figurinhas para trocar
              </p>
              <p className="text-xs font-semibold text-muted">
                Copa do Mundo 2026 · {totalDups} disponíveis
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {groups.map(({ country, stickers }) => (
              <div
                key={country.code}
                className="rounded-xl border border-white/10 bg-white/10 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{country.flag}</span>
                  <span className="text-sm font-black text-text">
                    {country.name}
                  </span>
                  <span className="ml-auto text-xs font-bold text-muted">
                    {stickers.length} tipos
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {stickers.map((s) => (
                    <span
                      key={s.code}
                      className="text-xs bg-duplicate/15 border border-duplicate/30 text-duplicate px-2 py-0.5 rounded-md font-black"
                    >
                      {s.code} x{s.count - 1}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  function hasSticker(code: string): boolean {
    return statuses[code] === "owned" || statuses[code] === "duplicate";
  }
}

function parseDuplicateText(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  const matches =
    text
      .toUpperCase()
      .match(
        /\b(?:00|CC\s*[-#]?\s*\d{1,2}|[A-Z]{3}\s*[-#]?\s*\d{1,2})(?:\((\d+)X\)|\s+X(\d+)|X(\d+))?/g,
      ) ?? [];

  for (const raw of matches) {
    const codeMatch = raw.match(
      /\b(00|CC\s*[-#]?\s*\d{1,2}|[A-Z]{3}\s*[-#]?\s*\d{1,2})\b/,
    );
    if (!codeMatch) continue;
    const code = normalizeCode(codeMatch[1]);
    if (!VALID_STICKER_CODES.has(code)) continue;
    const countMatch = raw.match(/\((\d+)X\)|\s+X(\d+)|X(\d+)/);
    const count = countMatch
      ? Number(countMatch[1] ?? countMatch[2] ?? countMatch[3])
      : 1;
    counts.set(code, (counts.get(code) ?? 0) + count);
  }

  return counts;
}

function normalizeCode(raw: string): string {
  const code = raw
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/[-#]/g, "")
    .trim();
  if (code === "00") return code;
  const cc = code.match(/^CC\s*(\d{1,2})$/);
  if (cc) return `CC${Number(cc[1])}`;
  const parts = code.match(/^([A-Z]{3})\s*(\d{1,2})$/);
  if (parts) return `${parts[1]} ${Number(parts[2])}`;
  return code;
}

function countCodes(codes: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const code of codes) {
    const normalized = normalizeCode(code);
    if (!VALID_STICKER_CODES.has(normalized)) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }
  return counts;
}

function createTradeShareCode(
  statuses: Record<string, string>,
  duplicateCounts: Map<string, number>,
): string {
  const ownedBits = new Uint8Array(Math.ceil(ALL_STICKER_CODES.length / 8));
  for (const [code, status] of Object.entries(statuses)) {
    if (status !== "owned" && status !== "duplicate") continue;
    const index = STICKER_INDEX_BY_CODE.get(code);
    if (index === undefined) continue;
    ownedBits[Math.floor(index / 8)] |= 1 << index % 8;
  }
  const duplicates = [...duplicateCounts.entries()]
    .map(([code, count]) => [STICKER_INDEX_BY_CODE.get(code), count] as const)
    .filter((item): item is [number, number] => item[0] !== undefined)
    .sort(([a], [b]) => a - b);
  const payload = JSON.stringify({
    v: 1,
    o: encodeBytesAsBase64Url(ownedBits),
    d: duplicates,
  });
  return `ALBUM26:${encodeBase64Url(payload)}`;
}

function parseSharedTradeProfile(text: string): TradeProfile | null {
  const match = text.match(/ALBUM26:([A-Za-z0-9_-]+)/);
  if (!match) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(match[1])) as {
      v?: number;
      o?: unknown;
      d?: unknown;
    };
    if (payload.v !== 1) return null;

    const owned = new Set<string>();
    if (typeof payload.o === "string") {
      const ownedBits = decodeBase64UrlAsBytes(payload.o);
      for (let index = 0; index < ALL_STICKER_CODES.length; index += 1) {
        const byte = ownedBits[Math.floor(index / 8)];
        if (byte & (1 << index % 8)) owned.add(ALL_STICKER_CODES[index]);
      }
    }

    const duplicateCounts = new Map<string, number>();
    if (Array.isArray(payload.d)) {
      for (const item of payload.d) {
        if (!Array.isArray(item)) continue;
        const [rawIndex, rawCount] = item;
        const index = Number(rawIndex);
        const count = Number(rawCount);
        const code = ALL_STICKER_CODES[index];
        if (!code || !Number.isFinite(count)) continue;
        duplicateCounts.set(code, Math.max(1, Math.floor(count)));
        owned.add(code);
      }
    }

    return { owned, duplicateCounts, source: "share" };
  } catch {
    return null;
  }
}

function encodeBase64Url(value: string): string {
  return encodeBytesAsBase64Url(new TextEncoder().encode(value));
}

function encodeBytesAsBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string {
  return new TextDecoder().decode(decodeBase64UrlAsBytes(value));
}

function decodeBase64UrlAsBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function formatSwapSuggestion(
  swaps: { give: string; receive: string }[],
): string {
  const total = swaps.length;
  const header = `Sugestão de troca: ${total} figurinha${total === 1 ? "" : "s"} por ${total} figurinha${total === 1 ? "" : "s"}`;
  const lines = swaps.map(
    (s) => `Eu te dou ${s.give} e você me dá ${s.receive}`,
  );
  return [header, "", ...lines].join("\n");
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back below for webviews or non-secure contexts.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) throw new Error("copy failed");
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="sticker-tile rounded-xl px-3 py-2">
      <p className="text-base font-black text-text">{value}</p>
      <p className="text-[10px] font-bold text-muted leading-tight">
        {label}
      </p>
    </div>
  );
}
