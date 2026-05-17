import { useRef, useState } from 'react'
import { Camera, PenLine, BarChart2, CheckCircle, XCircle } from 'lucide-react'
import { COUNTRIES, TOTAL_STICKERS, getStickerCode } from '@/data/album'
import { useCollection } from '@/store/useCollection'
import { scanStickersFromImage } from '@/lib/ai'

type Tab = 'camera' | 'manual' | 'stats'

export function Scanner() {
  const [tab, setTab] = useState<Tab>('camera')
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string>('')
  const [scanning, setScanning] = useState(false)
  const [detected, setDetected] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [manualInput, setManualInput] = useState('')
  const [manualParsed, setManualParsed] = useState<string[]>([])
  const [toast, setToast] = useState('')

  const { apiKey, markMultiple, statuses } = useCollection()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function handleImageCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async ev => {
      const base64 = ev.target?.result as string
      setPreview(base64)
      setDetected([])
      setSelected(new Set())

      if (!apiKey) {
        showToast('Configure sua chave de API em Configurações.')
        return
      }

      setScanning(true)
      try {
        const codes = await scanStickersFromImage(apiKey, base64)
        setDetected(codes)
        setSelected(new Set(codes))
      } catch (err) {
        showToast(`Erro: ${err instanceof Error ? err.message : 'Falha'}`)
      } finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function confirmCamera() {
    const codes = [...selected]
    if (!codes.length) return
    markMultiple(codes, 'owned')
    showToast(`${codes.length} figurinha(s) marcadas como coletadas!`)
    setPreview('')
    setDetected([])
    setSelected(new Set())
  }

  function parseManual(input: string): string[] {
    const tokens = input.toUpperCase().match(/[A-Z]{2,3}\s*\d+/g) ?? []
    return tokens.map(t => t.replace(/\s+/, ' ').trim())
  }

  function handleManualChange(val: string) {
    setManualInput(val)
    setManualParsed(parseManual(val))
  }

  function confirmManual() {
    if (!manualParsed.length) return
    markMultiple(manualParsed, 'owned')
    showToast(`${manualParsed.length} figurinha(s) marcadas!`)
    setManualInput('')
    setManualParsed([])
  }

  // Compute stats for the stats tab
  let owned = 0, duplicates = 0
  for (const st of Object.values(statuses)) {
    if (st === 'owned') owned++
    else if (st === 'duplicate') { owned++; duplicates++ }
  }
  const missing = TOTAL_STICKERS - owned
  const pct = Math.round((owned / TOTAL_STICKERS) * 100)
  const estimatedPacks = Math.ceil(missing / 4.5) // ~4.5 new stickers per pack at this stage

  const worstCountries = COUNTRIES
    .map(c => {
      const codes = c.stickers.map(s => getStickerCode(c.code, s.number))
      const own = codes.filter(code => statuses[code] === 'owned' || statuses[code] === 'duplicate').length
      return { country: c, missing: codes.length - own, pct: Math.round((own / codes.length) * 100) }
    })
    .filter(x => x.missing > 0)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5)

  const TABS: { id: Tab; label: string; Icon: typeof Camera }[] = [
    { id: 'camera', label: 'Câmera', Icon: Camera },
    { id: 'manual', label: 'Manual', Icon: PenLine },
    { id: 'stats', label: 'Progresso', Icon: BarChart2 },
  ]

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-owned text-white text-sm font-semibold rounded-xl px-4 py-3 text-center shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex-none px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-text">Scanner</h1>
      </div>

      <div className="flex-none flex gap-1 px-4 mb-4">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
              tab === id ? 'bg-gold text-bg' : 'bg-surface border border-border text-muted'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <div className="scroll-area flex-1 px-4 pb-4">
        {tab === 'camera' && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Fotografe um lote de figurinhas. A IA identifica os códigos automaticamente.
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />

            {!preview ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="chip-press w-full h-48 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-muted"
              >
                <Camera size={40} strokeWidth={1.2} />
                <span className="text-sm font-medium">Tirar foto ou selecionar imagem</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={preview} alt="Preview" className="w-full object-cover max-h-64" />
                  {scanning && (
                    <div className="absolute inset-0 bg-bg/80 flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gold font-medium">Analisando...</p>
                    </div>
                  )}
                </div>

                {detected.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-text mb-2">{detected.length} figurinha(s) detectadas:</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {detected.map(code => (
                        <button
                          key={code}
                          onClick={() => {
                            const next = new Set(selected)
                            if (next.has(code)) next.delete(code)
                            else next.add(code)
                            setSelected(next)
                          }}
                          className={`chip-press px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                            selected.has(code)
                              ? 'bg-owned/20 border-owned/50 text-owned'
                              : 'bg-surface border-border text-muted'
                          }`}
                        >
                          {selected.has(code) ? <CheckCircle size={11} /> : <XCircle size={11} />}
                          {code}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={confirmCamera}
                      disabled={selected.size === 0}
                      className="chip-press w-full bg-owned text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-40"
                    >
                      Confirmar {selected.size} figurinha(s)
                    </button>
                  </div>
                )}

                {!scanning && detected.length === 0 && (
                  <p className="text-sm text-muted text-center py-2">
                    Nenhum código detectado. Tente uma foto mais clara.
                  </p>
                )}

                <button
                  onClick={() => { setPreview(''); setDetected([]); setSelected(new Set()) }}
                  className="chip-press w-full border border-border text-muted text-sm rounded-xl py-2.5"
                >
                  Nova foto
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'manual' && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Digite os códigos separados por espaço ou vírgula. Ex: BRA 1 ARG 5 FRA 3
            </p>
            <textarea
              value={manualInput}
              onChange={e => handleManualChange(e.target.value)}
              placeholder="BRA 1 BRA 5 ARG 3 MEX 7..."
              className="w-full h-32 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-muted outline-none focus:border-gold/50 resize-none transition-colors uppercase"
            />
            {manualParsed.length > 0 && (
              <div>
                <p className="text-xs text-muted mb-2">{manualParsed.length} código(s) reconhecidos:</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {manualParsed.map((code, i) => (
                    <span key={i} className="text-xs bg-owned/15 border border-owned/30 text-owned px-2.5 py-1 rounded-full font-medium">
                      {code}
                    </span>
                  ))}
                </div>
                <button
                  onClick={confirmManual}
                  className="chip-press w-full bg-owned text-white font-semibold text-sm rounded-xl py-3"
                >
                  Marcar {manualParsed.length} como coletadas
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'stats' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Faltando" value={missing} sub={`de ${TOTAL_STICKERS}`} valueColor="text-text" />
              <StatBox label="Completo" value={`${pct}%`} sub={`${owned} coletadas`} valueColor="text-gold" />
              <StatBox label="Repetidas" value={duplicates} sub="para trocar" valueColor="text-duplicate" />
              <StatBox label="Pacotes est." value={estimatedPacks} sub="para completar" valueColor="text-muted" />
            </div>

            <div className="h-2 bg-border rounded-full overflow-hidden mt-4">
              <div
                className="h-full bg-gradient-to-r from-gold to-owned rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>

            {worstCountries.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">Mais incompletos</p>
                <div className="space-y-2">
                  {worstCountries.map(({ country, missing: m, pct: p }) => (
                    <div key={country.code} className="flex items-center gap-3 bg-surface border border-border rounded-xl px-3 py-2">
                      <span className="text-lg">{country.flag}</span>
                      <span className="flex-1 text-sm text-text">{country.name}</span>
                      <span className="text-xs text-muted">{p}%</span>
                      <span className="text-xs text-muted w-8 text-right">-{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value, sub, valueColor }: { label: string; value: string | number; sub: string; valueColor: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-xs font-medium text-text mt-0.5">{label}</p>
      <p className="text-[10px] text-muted">{sub}</p>
    </div>
  )
}
