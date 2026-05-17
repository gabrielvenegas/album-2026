import { useRef, useState } from 'react'
import { Key, Upload, Download, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useCollection } from '@/store/useCollection'
import { testConnection } from '@/lib/ai'

export function Settings() {
  const { apiKey, setApiKey, resetAll, exportData, importData } = useCollection()
  const [keyInput, setKeyInput] = useState(apiKey)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function handleSaveKey() {
    setApiKey(keyInput.trim())
    showToast('Chave salva!')
    setTestResult(null)
  }

  async function handleTestConnection() {
    const key = keyInput.trim()
    if (!key) { showToast('Insira uma chave de API primeiro.'); return }
    setTesting(true)
    setTestResult(null)
    try {
      const ok = await testConnection(key)
      setTestResult(ok ? 'ok' : 'fail')
    } catch {
      setTestResult('fail')
    } finally {
      setTesting(false)
    }
  }

  function handleExport() {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'album-copa-2026.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      importData(ev.target?.result as string)
      showToast('Dados importados com sucesso!')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="scroll-area flex-1 px-4 py-6">
      {toast && (
        <div className="toast-safe fixed left-4 right-4 z-50 bg-owned text-white text-sm font-semibold rounded-xl px-4 py-3 text-center shadow-lg">
          {toast}
        </div>
      )}

      <h1 className="text-xl font-bold text-text mb-6">Configurações</h1>

      <Section title="IA · Chave de API" Icon={Key}>
        <p className="text-xs text-muted mb-3">
          Insira sua chave do Mulerouter para usar as funcionalidades de IA (escaneamento, previsão, mensagens).
        </p>
        <input
          type="password"
          value={keyInput}
          onChange={e => setKeyInput(e.target.value)}
          placeholder="Bearer token do Mulerouter..."
          className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-muted outline-none focus:border-gold/50 transition-colors mb-3 font-mono"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSaveKey}
            className="chip-press flex-1 bg-owned/15 border border-owned/30 text-owned text-sm font-semibold rounded-xl py-2.5"
          >
            Salvar
          </button>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="chip-press flex-1 bg-surface border border-border text-muted text-sm font-semibold rounded-xl py-2.5 disabled:opacity-50"
          >
            {testing ? 'Testando...' : 'Testar conexão'}
          </button>
        </div>
        {testResult && (
          <div className={`flex items-center justify-center gap-1.5 text-xs mt-2 ${testResult === 'ok' ? 'text-owned' : 'text-red-400'}`}>
            {testResult === 'ok'
              ? <><CheckCircle size={13} /> Conexão bem-sucedida!</>
              : <><XCircle size={13} /> Falha. Verifique a chave.</>
            }
          </div>
        )}
      </Section>

      <Section title="Dados da coleção" Icon={Download}>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="chip-press flex-1 bg-surface border border-border text-muted text-sm font-semibold rounded-xl py-3 flex items-center justify-center gap-1.5"
          >
            <Upload size={14} /> Exportar
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="chip-press flex-1 bg-surface border border-border text-muted text-sm font-semibold rounded-xl py-3 flex items-center justify-center gap-1.5"
          >
            <Download size={14} /> Importar
          </button>
        </div>
      </Section>

      <Section title="Zona de perigo" Icon={AlertTriangle}>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="chip-press w-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold rounded-xl py-3"
          >
            Resetar toda a coleção
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-400 text-center">Tem certeza? Isso apaga tudo.</p>
            <div className="flex gap-2">
              <button
                onClick={() => { resetAll(); setConfirmReset(false); showToast('Coleção resetada.') }}
                className="chip-press flex-1 bg-red-500 text-white text-sm font-bold rounded-xl py-3"
              >
                Sim, apagar tudo
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="chip-press flex-1 bg-surface border border-border text-muted text-sm rounded-xl py-3"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Section>

      <p className="text-center text-xs text-muted mt-6 pb-2">
        Álbum Copa 2026 · Dados salvos localmente
      </p>
    </div>
  )
}

function Section({ title, Icon, children }: { title: string; Icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} className="text-muted" />
        <h2 className="text-xs font-semibold text-muted uppercase tracking-widest">{title}</h2>
      </div>
      <div className="bg-surface border border-border rounded-2xl p-4">
        {children}
      </div>
    </div>
  )
}
