import { useEffect, useState } from 'react';
import { api } from '../../services/api';

type Field = 'apiKey' | 'secret' | 'passphrase';
interface Exchange { id: string; name: string; logo: string; fields: Field[]; keyUrl: string; docsUrl: string; requiresIpWhitelist: boolean; ipWhitelistNote?: string; }
interface TestResult { ok: true; permissions: { scopes: string[]; ipRestricted: boolean }; sample: Array<{ symbol: string; amount: string; usd: number }>; totalAccounts: number; latencyMs: number; }

const STEPS = ['Exchange', 'Create key', 'Credentials', 'Verify', 'Done'] as const;

export function ConnectWizard({ onClose, onConnected }: { onClose: () => void; onConnected: () => void }) {
  const [step, setStep] = useState(0);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [ex, setEx] = useState<Exchange | null>(null);
  const [creds, setCreds] = useState<Record<Field, string>>({ apiKey: '', secret: '', passphrase: '' });
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get<Exchange[]>('/cex/exchanges').then(r => setExchanges(r.data)); }, []);

  const canAdvance = () => {
    if (step === 0) return !!ex;
    if (step === 2) return ex!.fields.every(f => creds[f].trim().length > 0);
    return true;
  };

  async function runTest() {
    setTesting(true); setError(null); setResult(null);
    try {
      const { data } = await api.post<TestResult>('/cex/test', { exchangeId: ex!.id, ...creds });
      setResult(data);
    } catch (e: any) {
      setError({ message: e?.response?.data?.message ?? 'Could not connect.', hint: e?.response?.data?.hint });
    } finally { setTesting(false); }
  }

  async function save() {
    setSaving(true);
    try {
      await api.post('/cex/connections', { exchangeId: ex!.id, ...creds });
      setStep(4); onConnected();
    } catch (e: any) {
      setError({ message: e?.response?.data?.message ?? 'Save failed.' });
    } finally { setSaving(false); }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="cex-wizard-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl">
        {/* Stepper */}
        <header className="flex items-center gap-2 border-b border-neutral-800 px-6 py-4">
          <h2 id="cex-wizard-title" className="sr-only">Connect an exchange</h2>
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span aria-current={i === step ? 'step' : undefined}
                className={`h-6 w-6 rounded-full text-xs grid place-items-center ${i <= step ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-500'}`}>
                {i < step ? '✓' : i + 1}
              </span>
              <span className={`text-xs ${i === step ? 'text-white' : 'text-neutral-500'}`}>{s}</span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-neutral-800" />}
            </div>
          ))}
        </header>

        <div className="px-6 py-5 min-h-[280px]">
          {step === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {exchanges.map(e => (
                <button key={e.id} onClick={() => setEx(e)}
                  className={`rounded-xl border p-4 text-left transition ${ex?.id === e.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-neutral-800 hover:border-neutral-700'}`}>
                  <img src={e.logo} alt="" className="h-7 w-7 mb-2" />
                  <div className="text-sm font-medium">{e.name}</div>
                </button>
              ))}
            </div>
          )}

          {step === 1 && ex && (
            <div className="space-y-4 text-sm">
              <p className="text-neutral-300">We only ever need <strong className="text-emerald-400">READ</strong> access. Never enable withdrawals.</p>
              <a href={ex.keyUrl} target="_blank" rel="noopener noreferrer"
                 className="inline-block rounded-lg bg-white text-black px-4 py-2 text-sm font-medium">
                Open {ex.name} API settings ↗
              </a>
              <ul className="space-y-2 text-neutral-400">
                <li>✅ Enable <strong>Read</strong> / <strong>View</strong> permissions</li>
                <li>❌ Leave <strong>Withdraw</strong> and <strong>Transfer</strong> OFF</li>
                {ex.requiresIpWhitelist && <li>ℹ️ {ex.ipWhitelistNote}</li>}
              </ul>
            </div>
          )}

          {step === 2 && ex && (
            <form className="space-y-3" onSubmit={e => { e.preventDefault(); setStep(3); runTest(); }}>
              {ex.fields.map(f => (
                <label key={f} className="block">
                  <span className="text-xs uppercase tracking-wide text-neutral-500">
                    {f === 'apiKey' ? 'API Key' : f === 'secret' ? 'API Secret' : 'Passphrase'}
                  </span>
                  <input
                    type={f === 'apiKey' ? 'text' : 'password'}
                    autoComplete="off" spellCheck={false}
                    value={creds[f]} onChange={e => setCreds(c => ({ ...c, [f]: e.target.value }))}
                    className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 font-mono text-sm focus:border-emerald-500 outline-none"
                  />
                </label>
              ))}
              <p className="text-xs text-neutral-500">Encrypted with AES-256-GCM. We never display your secret again, not even to admins.</p>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-3 text-sm">
              {testing && <p className="text-neutral-400">Testing connection…</p>}
              {error && (
                <div role="alert" className="rounded-lg border border-red-900 bg-red-950/40 p-3">
                  <p className="text-red-300">{error.message}</p>
                  {error.hint && <p className="text-red-400/70 text-xs mt-1">{error.hint}</p>}
                  <button onClick={runTest} className="mt-2 text-xs underline">Retry</button>
                </div>
              )}
              {result && (
                <>
                  <p className="text-emerald-400">✓ Connected in {result.latencyMs}ms · {result.totalAccounts} assets found</p>
                  <div className="rounded-lg border border-neutral-800 divide-y divide-neutral-800">
                    {result.sample.map(s => (
                      <div key={s.symbol} className="flex justify-between px-3 py-2">
                        <span>{s.symbol}</span><span className="font-mono">${s.usd.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  {result.permissions.scopes.includes('trade') && (
                    <p className="text-amber-400 text-xs">⚠️ This key has trading enabled. We only need read — consider creating a read-only key.</p>
                  )}
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">✓</div>
              <p className="text-lg">Exchange connected</p>
              <p className="text-sm text-neutral-400 mt-1">Balances will appear in your portfolio within a few seconds.</p>
            </div>
          )}
        </div>

        <footer className="flex justify-between border-t border-neutral-800 px-6 py-4">
          <button onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
                  className="text-sm text-neutral-400 hover:text-white">
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < 3 && (
            <button disabled={!canAdvance()} onClick={() => setStep(s => s + 1)}
                    className="rounded-lg bg-emerald-500 text-black px-4 py-2 text-sm font-medium disabled:opacity-40">
              Continue
            </button>
          )}
          {step === 3 && result && (
            <button disabled={saving} onClick={save}
                    className="rounded-lg bg-emerald-500 text-black px-4 py-2 text-sm font-medium disabled:opacity-40">
              {saving ? 'Saving…' : 'Connect'}
            </button>
          )}
          {step === 4 && (
            <button onClick={onClose} className="rounded-lg bg-white text-black px-4 py-2 text-sm font-medium">Done</button>
          )}
        </footer>
      </div>
    </div>
  );
}