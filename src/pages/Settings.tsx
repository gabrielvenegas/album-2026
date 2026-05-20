import { useRef, useState } from "react";
import {
  Key,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  SlidersHorizontal,
  Receipt,
  Plus,
  Trash2,
} from "lucide-react";
import { useCollection } from "@/store/useCollection";
import { testConnection } from "@/lib/ai";

type SettingsTab = "general" | "spending";

export function Settings() {
  const {
    apiKey,
    setApiKey,
    resetAll,
    exportData,
    importData,
    confirmBeforeSelect,
    setConfirmBeforeSelect,
    spendingEntries,
    addSpendingEntry,
    deleteSpendingEntry,
    clearSpendingEntries,
  } = useCollection();
  const [keyInput, setKeyInput] = useState(apiKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [testError, setTestError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClearSpending, setConfirmClearSpending] = useState(false);
  const [expenseDate, setExpenseDate] = useState(formatInputDate(new Date()));
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const fileRef = useRef<HTMLInputElement>(null);
  const totalSpent = spendingEntries.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function handleSaveKey() {
    setApiKey(keyInput.trim());
    showToast("Chave salva!");
    setTestResult(null);
    setTestError("");
  }

  async function handleTestConnection() {
    const key = keyInput.trim();
    if (!key) {
      showToast("Insira uma chave de API primeiro.");
      return;
    }
    setTesting(true);
    setTestResult(null);
    setTestError("");
    try {
      const ok = await testConnection(key);
      setTestResult(ok ? "ok" : "fail");
      if (!ok) setTestError("A API respondeu, mas não retornou o OK esperado.");
    } catch (err) {
      setTestResult("fail");
      setTestError(err instanceof Error ? err.message : "Falha na conexão.");
    } finally {
      setTesting(false);
    }
  }

  function handleAddExpense() {
    const amount = Number(expenseAmount.replace(",", "."));
    if (!expenseDate || !amount || amount <= 0) {
      showToast("Informe data e valor do gasto.");
      return;
    }

    addSpendingEntry({
      date: expenseDate,
      description: expenseDescription || "Gasto com o álbum",
      amount,
    });
    setExpenseDescription("");
    setExpenseAmount("");
    setConfirmClearSpending(false);
    showToast("Gasto registrado!");
  }

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "album-copa-2026.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      importData(ev.target?.result as string);
      showToast("Dados importados com sucesso!");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="scroll-area album-page flex-1">
      <div className="page-container mx-auto max-w-3xl py-6">
      {toast && (
        <div className="toast-safe fixed left-4 right-4 z-50 bg-owned text-white text-sm font-semibold rounded-xl px-4 py-3 text-center shadow-lg">
          {toast}
        </div>
      )}

      <div className="app-header mb-5 px-0 py-0">
        <p className="app-header-kicker">Preferências</p>
        <h1 className="app-header-title">Configurações</h1>
        <p className="app-header-subtitle">
          Dados, IA e comportamento do álbum
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
        <TabButton
          active={activeTab === "general"}
          Icon={SlidersHorizontal}
          label="Geral"
          onClick={() => setActiveTab("general")}
        />
        <TabButton
          active={activeTab === "spending"}
          Icon={Receipt}
          label="Gastos"
          onClick={() => setActiveTab("spending")}
        />
      </div>

      {activeTab === "spending" ? (
        <Section title="Gastos do álbum" Icon={Receipt}>
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Total gasto</p>
            <p className="text-xl font-black text-gold">
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <p className="rounded-lg bg-surface/10 px-2 py-1 text-xs font-black text-muted text-right">
              {spendingEntries.length}{" "}
              {spendingEntries.length === 1 ? "registro" : "registros"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <label className="min-w-0">
              <span className="block text-[11px] font-black uppercase tracking-wide text-muted mb-1">
                Data
              </span>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm font-semibold text-text outline-none focus:border-gold transition-colors"
              />
            </label>
            <label className="min-w-0">
              <span className="block text-[11px] font-black uppercase tracking-wide text-muted mb-1">
                Valor
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm font-semibold text-text placeholder:text-muted/55 outline-none focus:border-gold transition-colors"
              />
            </label>
          </div>

          <label className="block mb-3">
            <span className="block text-[11px] font-black uppercase tracking-wide text-muted mb-1">
              Descrição
            </span>
            <input
              type="text"
              value={expenseDescription}
              onChange={(e) => setExpenseDescription(e.target.value)}
              placeholder="Pacotinhos, caixa, troca..."
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm font-semibold text-text placeholder:text-muted/55 outline-none focus:border-gold transition-colors"
            />
          </label>

          <button
            onClick={handleAddExpense}
            className="chip-press w-full bg-owned text-white text-sm font-black rounded-xl py-3 flex items-center justify-center gap-1.5 mb-4"
          >
            <Plus size={14} /> Adicionar gasto
          </button>

          {spendingEntries.length > 0 ? (
            <div className="space-y-2">
              {spendingEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-text truncate">
                      {entry.description}
                    </p>
                    <p className="text-xs font-semibold text-muted">
                      {formatDisplayDate(entry.date)}
                    </p>
                  </div>
                  <p className="text-sm font-black text-gold shrink-0">
                    {formatCurrency(entry.amount)}
                  </p>
                  <button
                    aria-label={`Remover ${entry.description}`}
                    onClick={() => deleteSpendingEntry(entry.id)}
                    className="chip-press h-8 w-8 shrink-0 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {!confirmClearSpending ? (
                <button
                  onClick={() => setConfirmClearSpending(true)}
                  className="chip-press w-full rounded-xl border border-white/10 bg-white/10 py-2.5 mt-3 text-xs font-black text-muted"
                >
                  Limpar histórico de gastos
                </button>
              ) : (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      clearSpendingEntries();
                      setConfirmClearSpending(false);
                      showToast("Gastos removidos.");
                    }}
                    className="chip-press flex-1 bg-red-500 text-white text-xs font-bold rounded-xl py-2.5"
                  >
                    Apagar gastos
                  </button>
                  <button
                    onClick={() => setConfirmClearSpending(false)}
                    className="chip-press flex-1 rounded-xl border border-white/10 bg-white/10 py-2.5 text-xs font-bold text-muted"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-xs font-semibold text-muted bg-white/10 border border-dashed border-white/10 rounded-xl px-3 py-4">
              Nenhum gasto registrado ainda.
            </p>
          )}
        </Section>
      ) : (
        <>
          <Section title="IA · Chave de API" Icon={Key}>
            <p className="text-xs font-semibold text-muted mb-3">
              Insira sua chave do Mulerouter para usar as funcionalidades de IA
              (escaneamento, previsão, mensagens).
            </p>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Bearer token do Mulerouter..."
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-text placeholder:text-muted/55 outline-none focus:border-gold transition-colors mb-3 font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveKey}
                className="chip-press flex-1 bg-owned text-white text-sm font-black rounded-xl py-2.5"
              >
                Salvar
              </button>
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="chip-press flex-1 rounded-xl border border-white/10 bg-white/10 py-2.5 text-sm font-black text-muted disabled:opacity-50"
              >
                {testing ? "Testando..." : "Testar conexão"}
              </button>
            </div>
            {testResult && (
              <div
                className={`flex items-center justify-center gap-1.5 text-xs mt-2 ${testResult === "ok" ? "text-owned" : "text-red-400"}`}
              >
                {testResult === "ok" ? (
                  <>
                    <CheckCircle size={13} /> Conexão bem-sucedida!
                  </>
                ) : (
                  <>
                    <XCircle size={13} /> Falha. Verifique a chave.
                  </>
                )}
              </div>
            )}
            {testError && (
              <p className="mt-2 break-words text-center text-xs text-red-400">
                {testError}
              </p>
            )}
          </Section>

          <Section title="Comportamento" Icon={SlidersHorizontal}>
            <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
              <div>
                <p className="text-sm font-black text-text">
                  Confirmar antes de selecionar
                </p>
                <p className="text-xs font-semibold text-muted mt-0.5">
                  Pede confirmação ao tocar em uma figurinha
                </p>
              </div>
              <button
                role="switch"
                aria-checked={confirmBeforeSelect}
                onClick={() => setConfirmBeforeSelect(!confirmBeforeSelect)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  confirmBeforeSelect ? "bg-owned" : "bg-border"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                    confirmBeforeSelect ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </label>
          </Section>

          <Section title="Dados da coleção" Icon={Download}>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="chip-press flex-1 rounded-xl border border-white/10 bg-white/10 py-3 text-sm font-black text-muted flex items-center justify-center gap-1.5"
              >
                <Upload size={14} /> Exportar
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="chip-press flex-1 rounded-xl border border-white/10 bg-white/10 py-3 text-sm font-black text-muted flex items-center justify-center gap-1.5"
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
                <p className="text-sm text-red-400 text-center">
                  Tem certeza? Isso apaga tudo.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      resetAll();
                      setConfirmReset(false);
                      showToast("Coleção resetada.");
                    }}
                    className="chip-press flex-1 bg-red-500 text-white text-sm font-bold rounded-xl py-3"
                  >
                    Sim, apagar tudo
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="chip-press flex-1 rounded-xl border border-white/10 bg-white/10 py-3 text-sm font-bold text-muted"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </Section>
        </>
      )}

      <p className="text-center text-xs text-muted mt-6 pb-2">
        Álbum Copa 2026 · Dados salvos localmente
      </p>
      </div>
    </div>
  );
}

function Section({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} className="text-gold" />
        <h2 className="album-section-label">
          {title}
        </h2>
      </div>
      <div className="sticker-tile rounded-xl p-4">
        {children}
      </div>
    </div>
  );
}

function TabButton({
  active,
  Icon,
  label,
  onClick,
}: {
  active: boolean;
  Icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`chip-press flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-black transition-colors ${
        active ? "bg-gold text-bg" : "bg-surface text-muted"
      }`}
    >
      <Icon size={15} strokeWidth={2.4} />
      {label}
    </button>
  );
}

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
