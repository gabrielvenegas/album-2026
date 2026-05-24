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
import {
  buildSwapPlan,
  countCodes,
  createTradeShareCode,
  formatSwapSuggestionForFriend,
  parseDuplicateText,
  parseSharedTradeProfile,
  parseTradeApplicationCode,
  VALID_STICKER_CODES,
  type SwapAction,
  type TradeProfile,
} from "@/lib/trade";

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
  const myDuplicateCodes = [...myDuplicateCounts.keys()];
  const incomingTrade = parseTradeApplicationCode(friendInput);
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
  const exactTradeMode = friendProfile.source === "share";
  const friendCanGive = friendDuplicateCodes.filter(
    (code) => !hasSticker(code),
  );
  const iCanGive = exactTradeMode
    ? myDuplicateCodes.filter((code) => !friendProfile.owned.has(code))
    : [];
  const suggestedSwaps = exactTradeMode
    ? buildSwapPlan(iCanGive, friendCanGive)
    : [];

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
      "Código do meu álbum para comparação exata no app:",
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

  async function handleCopySwapForFriend() {
    if (!suggestedSwaps.length) return;
    try {
      await copyTextToClipboard(formatSwapSuggestionForFriend(suggestedSwaps));
      showToast("Troca para o amigo copiada.");
    } catch {
      showToast("Não foi possível copiar. Tente novamente.");
    }
  }

  function handleAutoExchange() {
    if (!suggestedSwaps.length) return;
    const applied = applySwaps(suggestedSwaps, statuses, decrementDup, setStatus);
    if (applied === 0) {
      showToast("Nenhuma troca válida para aplicar.");
      return;
    }
    setAiParsedDuplicates(null);
    setFriendInput("");
    showToast(`${applied} troca(s) aplicadas ao álbum.`);
  }

  function handleApplyIncomingTrade() {
    if (!incomingTrade?.length) return;
    const applied = applySwaps(incomingTrade, statuses, decrementDup, setStatus);
    if (applied === 0) {
      showToast("Nenhuma troca válida encontrada nesse código.");
      return;
    }
    setAiParsedDuplicates(null);
    setFriendInput("");
    showToast(`${applied} troca(s) aplicadas ao álbum.`);
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

      <div className="flex-none border-b border-border bg-bg/95 shadow-[0_12px_24px_rgba(0,0,0,0.2)]">
        <div className="page-container py-5">
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
      </div>

      <div className="scroll-area flex-1 pb-4">
        <div className="page-container lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="mb-4 grid gap-3 lg:mb-0">
          <div className="sticker-slot rounded-xl p-4">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-duplicate/15 text-duplicate">
                <Send size={17} />
              </div>
              <div className="min-w-0">
                <p className="album-section-label">1. Compartilhe sua lista</p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">
                  O texto inclui suas repetidas e um código compacto que deixa a
                  comparação exata no outro app.
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
                  Cole o código do álbum compartilhado para uma comparação
                  completa. Lista simples de repetidas vira só leitura parcial.
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

            {friendInput.trim() && incomingTrade && (
              <div className="mt-3">
                <div className="mb-3 rounded-xl border border-owned/25 bg-owned/10 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-owned">
                    Troca recebida
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-text/75">
                    {incomingTrade.length} troca(s) pronta(s) para aplicar no
                    seu álbum
                  </p>
                </div>

                <div className="mb-3 space-y-2">
                  {incomingTrade.map(({ give, receive }) => (
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
                </div>

                <button
                  onClick={handleApplyIncomingTrade}
                  className="chip-press w-full bg-owned text-white text-xs font-black rounded-xl py-3"
                >
                  Aplicar troca recebida
                </button>
              </div>
            )}

            {friendInput.trim() && !incomingTrade && (
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
                  {exactTradeMode ? (
                    <p className="mt-1 text-[10px] text-muted">
                      A comparação usa o álbum compartilhado, então a troca
                      automática fica igual nos dois lados.
                    </p>
                  ) : (
                    <p className="mt-1 text-[10px] text-muted">
                      Para gerar uma troca automática, cole o código
                      compartilhado do colega.
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
                  {exactTradeMode ? (
                    <MiniStat
                      label="Você tem e a pessoa precisa"
                      value={iCanGive.length}
                    />
                  ) : (
                    <div className="sticker-tile rounded-xl px-3 py-2">
                      <p className="text-sm font-black text-text">Parcial</p>
                      <p className="text-[10px] font-bold text-muted leading-tight">
                        Troca automática exige o código compartilhado.
                      </p>
                    </div>
                  )}
                </div>

                {exactTradeMode ? (
                  suggestedSwaps.length > 0 ? (
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
                        onClick={handleCopySwapForFriend}
                        className="chip-press w-full bg-owned/15 border border-owned/30 text-owned text-xs font-black rounded-xl py-2.5"
                      >
                        Copiar troca para amigo
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
                      Nenhuma troca direta encontrada com esse álbum.
                    </p>
                  )
                ) : (
                  <p className="text-xs text-muted text-center py-2">
                    Troca automática disponível só com o código compartilhado.
                  </p>
                )}
            </div>
          )}
          </div>
        </div>

        <div ref={exportRef} className="album-strip rounded-xl p-4 lg:sticky lg:top-4">
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
    </div>
  );

  function hasSticker(code: string): boolean {
    return statuses[code] === "owned" || statuses[code] === "duplicate";
  }
}

function applySwaps(
  swaps: SwapAction[],
  statuses: Record<string, string>,
  decrementDup: (code: string) => void,
  setStatus: (code: string, status: "missing" | "owned" | "duplicate") => void,
): number {
  const appliedGives = new Set<string>();
  const appliedReceives = new Set<string>();
  const liveStatuses = { ...statuses };
  let applied = 0;

  for (const swap of swaps) {
    if (
      appliedGives.has(swap.give) ||
      appliedReceives.has(swap.receive) ||
      swap.give === swap.receive ||
      !VALID_STICKER_CODES.has(swap.give) ||
      !VALID_STICKER_CODES.has(swap.receive) ||
      liveStatuses[swap.give] !== "duplicate" ||
      liveStatuses[swap.receive] !== "missing"
    ) {
      continue;
    }

    appliedGives.add(swap.give);
    appliedReceives.add(swap.receive);
    decrementDup(swap.give);
    setStatus(swap.receive, "owned");
    liveStatuses[swap.give] = "owned";
    liveStatuses[swap.receive] = "owned";
    applied += 1;
  }

  return applied;
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
