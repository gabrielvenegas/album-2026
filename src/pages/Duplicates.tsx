import { useRef, useState } from 'react'
import { ImageDown, ClipboardCopy, Check, Bot, Trophy, Repeat2 } from 'lucide-react'
import { COUNTRIES, getStickerCode } from '@/data/album'
import { useCollection } from '@/store/useCollection'
import { exportElementAsImage, formatDuplicatesAsText } from '@/lib/export'
import { generateSwapMessage } from '@/lib/ai'

export function Duplicates() {
  const { statuses, dupCounts, apiKey } = useCollection()
  const exportRef = useRef<HTMLDivElement>(null)
  const [aiMsg, setAiMsg] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [friendInput, setFriendInput] = useState('')

  const groups = COUNTRIES
    .map(c => {
      const dups = c.stickers
        .map(s => {
          const code = getStickerCode(c.code, s)
          return statuses[code] === 'duplicate' ? { code, count: dupCounts[code] ?? 2 } : null
        })
        .filter(Boolean) as { code: string; count: number }[]
      return { country: c, stickers: dups }
    })
    .filter(g => g.stickers.length > 0)

  const totalDups = groups.reduce((sum, g) => sum + g.stickers.reduce((s, x) => s + (x.count - 1), 0), 0)
  const myDuplicateCounts = new Map(groups.flatMap(g => g.stickers.map(s => [s.code, Math.max(0, s.count - 1)] as const)))
  const friendDuplicateCounts = parseDuplicateText(friendInput)
  const friendDuplicateCodes = [...friendDuplicateCounts.keys()]
  const friendCanGive = friendDuplicateCodes.filter(code => !hasSticker(code))
  const iCanGive = [...myDuplicateCounts.keys()].filter(code => !friendDuplicateCounts.has(code))
  const suggestedSwaps = friendCanGive
    .slice(0, iCanGive.length)
    .map((receive, i) => ({ receive, give: iCanGive[i] }))

  async function handleExportImage() {
    if (!exportRef.current) return
    await exportElementAsImage(exportRef.current, 'repetidas-copa-2026.png')
  }

  function handleCopyText() {
    const text = formatDuplicatesAsText(
      groups.map(g => ({ country: g.country.name, flag: g.country.flag, stickers: g.stickers }))
    )
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleGenerateMessage() {
    if (!apiKey) { setAiMsg('Configure sua chave de API em Configurações.'); return }
    setAiLoading(true)
    setAiMsg('')
    try {
      const all = groups.flatMap(g => g.stickers)
      const msg = await generateSwapMessage(apiKey, all)
      setAiMsg(msg)
    } catch (e) {
      setAiMsg(`Erro: ${e instanceof Error ? e.message : 'Falha na conexão'}`)
    } finally {
      setAiLoading(false)
    }
  }

  if (groups.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
        <p className="text-lg font-semibold text-text">Sem repetidas</p>
        <p className="text-sm text-muted">Marque figurinhas como repetidas tocando duas vezes em um país.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-none px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-text">Repetidas</h1>
        <p className="text-sm text-muted">{totalDups} figurinhas para trocar</p>
      </div>

      <div className="scroll-area flex-1 px-4 pb-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleExportImage}
            className="chip-press flex-1 bg-gold/15 border border-gold/30 text-gold text-xs font-semibold rounded-xl py-2.5 flex items-center justify-center gap-1.5"
          >
            <ImageDown size={14} /> Exportar imagem
          </button>
          <button
            onClick={handleCopyText}
            className="chip-press flex-1 bg-surface border border-border text-muted text-xs font-semibold rounded-xl py-2.5 flex items-center justify-center gap-1.5"
          >
            {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
            {copied ? 'Copiado!' : 'Copiar texto'}
          </button>
        </div>

        <button
          onClick={handleGenerateMessage}
          disabled={aiLoading}
          className="chip-press w-full mb-4 bg-gradient-to-r from-owned/15 to-gold/10 border border-owned/30 text-owned text-xs font-semibold rounded-xl py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Bot size={14} />
          {aiLoading ? 'Gerando mensagem...' : 'Gerar mensagem para grupos (IA)'}
        </button>

        {aiMsg && (
          <div className="mb-4 bg-surface border border-border rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-semibold text-owned">Mensagem gerada pela IA</p>
              <button
                onClick={() => navigator.clipboard.writeText(aiMsg)}
                className="text-xs text-muted"
              >
                copiar
              </button>
            </div>
            <p className="text-sm text-text whitespace-pre-wrap">{aiMsg}</p>
          </div>
        )}

        <div className="mb-4 bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Repeat2 size={15} className="text-gold" />
            <p className="text-xs font-semibold text-muted uppercase tracking-widest">Comparar troca</p>
          </div>
          <textarea
            value={friendInput}
            onChange={e => setFriendInput(e.target.value)}
            placeholder="Cole aqui a lista de repetidas do seu amigo..."
            className="w-full h-28 bg-bg border border-border rounded-xl px-3 py-2.5 text-base text-text placeholder-muted outline-none focus:border-gold/50 resize-none transition-colors"
          />

          {friendInput.trim() && (
            <div className="mt-3">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <MiniStat label="Seu amigo tem e você falta" value={friendCanGive.length} />
                <MiniStat label="Você tem e ele não listou" value={iCanGive.length} />
              </div>

              {suggestedSwaps.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text">Sugestão automática:</p>
                  {suggestedSwaps.map(({ receive, give }) => (
                    <div key={`${give}-${receive}`} className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2">
                      <span className="text-xs text-muted">Você dá</span>
                      <span className="font-bold text-duplicate text-sm">{give}</span>
                      <span className="text-xs text-muted">e recebe</span>
                      <span className="font-bold text-owned text-sm">{receive}</span>
                    </div>
                  ))}
                  <button
                    onClick={() => navigator.clipboard.writeText(formatSwapSuggestion(suggestedSwaps))}
                    className="chip-press w-full bg-owned/15 border border-owned/30 text-owned text-xs font-semibold rounded-xl py-2.5"
                  >
                    Copiar sugestão
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

        <div ref={exportRef} className="bg-bg rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={22} className="text-gold" />
            <div>
              <p className="text-sm font-bold text-gold">Figurinhas para trocar</p>
              <p className="text-xs text-muted">Copa do Mundo 2026 · {totalDups} disponíveis</p>
            </div>
          </div>

          <div className="space-y-3">
            {groups.map(({ country, stickers }) => (
              <div key={country.code} className="bg-surface rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{country.flag}</span>
                  <span className="text-sm font-semibold text-text">{country.name}</span>
                  <span className="ml-auto text-xs text-muted">{stickers.length} tipos</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {stickers.map(s => (
                    <span
                      key={s.code}
                      className="text-xs bg-duplicate/15 border border-duplicate/30 text-duplicate px-2 py-0.5 rounded-full font-medium"
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
  )

  function hasSticker(code: string): boolean {
    return statuses[code] === 'owned' || statuses[code] === 'duplicate'
  }
}

function parseDuplicateText(text: string): Map<string, number> {
  const counts = new Map<string, number>()
  const matches = text.toUpperCase().match(/\b(?:00|CC\s*[-#]?\s*\d{1,2}|[A-Z]{3}\s*[-#]?\s*\d{1,2})(?:\((\d+)X\)|\s+X(\d+)|X(\d+))?/g) ?? []

  for (const raw of matches) {
    const codeMatch = raw.match(/\b(00|CC\s*[-#]?\s*\d{1,2}|[A-Z]{3}\s*[-#]?\s*\d{1,2})\b/)
    if (!codeMatch) continue
    const code = normalizeCode(codeMatch[1])
    const countMatch = raw.match(/\((\d+)X\)|\s+X(\d+)|X(\d+)/)
    const count = countMatch ? Number(countMatch[1] ?? countMatch[2] ?? countMatch[3]) : 1
    counts.set(code, (counts.get(code) ?? 0) + count)
  }

  return counts
}

function normalizeCode(raw: string): string {
  const code = raw.toUpperCase().replace(/\s+/g, ' ').replace(/[-#]/g, '').trim()
  if (code === '00') return code
  const cc = code.match(/^CC\s*(\d{1,2})$/)
  if (cc) return `CC${Number(cc[1])}`
  const parts = code.match(/^([A-Z]{3})\s*(\d{1,2})$/)
  if (parts) return `${parts[1]} ${Number(parts[2])}`
  return code
}

function formatSwapSuggestion(swaps: { give: string; receive: string }[]): string {
  return swaps.map(s => `Eu te dou ${s.give} e você me dá ${s.receive}`).join('\n')
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-bg px-3 py-2">
      <p className="text-lg font-bold text-text">{value}</p>
      <p className="text-[10px] text-muted leading-tight">{label}</p>
    </div>
  )
}
