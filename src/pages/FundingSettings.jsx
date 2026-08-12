import { useState } from 'react';
import { useFundingSettings } from '../hooks/useFundingSettings';
import { useTransferSettings } from '../hooks/useTransferSettings';
import { useMapleradInstitutions } from '../hooks/useMapleradInstitutions';

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtNGN(v) {
  return `₦${Number(v ?? 0).toLocaleString()}`;
}

const PROVIDER_LABELS = { pocketfi: 'PocketFi', monnify: 'Monnify', maplerad: 'Maplerad' };
const ONE_TIME_PROVIDERS = ['maplerad', 'monnify'];
const INST_TYPES = ['DYNAMIC', 'VIRTUAL', 'NUBAN'];

// ─── One-Time Provider card ───────────────────────────────────────────────────

function OneTimeProviderCard({ providerSettings, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(providerSettings?.oneTimeFundingProvider ?? 'maplerad');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleEdit() {
    setValue(providerSettings?.oneTimeFundingProvider ?? 'maplerad');
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onUpdate({ oneTimeFundingProvider: value });
      setEditing(false);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to update provider.');
    } finally {
      setSaving(false);
    }
  }

  const current = providerSettings?.oneTimeFundingProvider;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">One-Time Funding Provider</h3>
          <p className="mt-0.5 text-xs text-gray-400">
            Provider used by wallet funding intents (POST /wallet/funding-intents).
          </p>
        </div>
        {!editing && (
          <button onClick={handleEdit} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-md bg-gray-100 px-3 py-2.5 text-sm text-gray-900 outline-none focus:bg-white focus:ring-1 focus:ring-orange-500"
          >
            {ONE_TIME_PROVIDERS.map((p) => (
              <option key={p} value={p}>{PROVIDER_LABELS[p] ?? p}</option>
            ))}
          </select>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <span className="inline-flex items-center rounded-full bg-orange-100 px-4 py-1.5 text-sm font-semibold text-orange-700">
          {PROVIDER_LABELS[current] ?? current ?? '—'}
        </span>
      )}
    </div>
  );
}

// ─── Provider Fee Card ────────────────────────────────────────────────────────

function ProviderFeeCard({ setting, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleEdit() {
    setForm({
      percent: setting.percent ?? 0,
      flat: setting.flat ?? 0,
      cap: setting.cap ?? 0,
    });
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        provider: setting.provider,
        percent: Number(form.percent) || 0,
        flat: Number(form.flat) || 0,
      };
      // Only include cap for maplerad or when non-zero
      if (setting.provider === 'maplerad' || Number(form.cap) > 0) {
        payload.cap = Number(form.cap) || 0;
      }
      await onUpdate(payload);
      setEditing(false);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to update fee.');
    } finally {
      setSaving(false);
    }
  }

  const label = PROVIDER_LABELS[setting.provider] ?? setting.provider;
  const hasCap = setting.cap != null && setting.cap > 0;
  const inputCls = 'w-full rounded-md bg-gray-100 px-3 py-2.5 text-sm text-gray-900 outline-none focus:bg-white focus:ring-1 focus:ring-orange-500';

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h3 className="font-semibold text-gray-900">{label}</h3>
        {!editing && (
          <button onClick={handleEdit} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            Edit fees
          </button>
        )}
      </div>

      <div className="p-5">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Percent (%)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.percent}
                  onChange={(e) => setForm((f) => ({ ...f, percent: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Flat (₦)</label>
                <input
                  type="number" min="0" step="1"
                  value={form.flat}
                  onChange={(e) => setForm((f) => ({ ...f, flat: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Cap (₦, 0 = none)</label>
                <input
                  type="number" min="0" step="1"
                  value={form.cap}
                  onChange={(e) => setForm((f) => ({ ...f, cap: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Percent</p>
                <p className="mt-1 text-lg font-bold text-gray-900">{setting.percent ?? 0}%</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Flat</p>
                <p className="mt-1 text-lg font-bold text-gray-900">{fmtNGN(setting.flat)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Cap</p>
                <p className="mt-1 text-lg font-bold text-gray-900">{hasCap ? fmtNGN(setting.cap) : '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 sm:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Credit Policy</p>
                <span className="mt-1 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {setting.creditPolicy ?? '—'}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Paid By</p>
                <span className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                  {setting.paidBy ?? '—'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">User Receives Full Amount</p>
                <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  setting.userReceivesFullAmount ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {setting.userReceivesFullAmount ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {setting.message && (
              <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500 italic">{setting.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Transfer Settings Card ───────────────────────────────────────────────────

function TransferSettingsCard({ setting, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [flatFee, setFlatFee] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleEdit() {
    setFlatFee(setting?.flatFee ?? 0);
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onUpdate({ flatFee: Number(flatFee) || 0 });
      setEditing(false);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to update transfer fee.');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full rounded-md bg-gray-100 px-3 py-2.5 text-sm text-gray-900 outline-none focus:bg-white focus:ring-1 focus:ring-orange-500';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Bank Transfer (Payout) Fee</h3>
          <p className="mt-0.5 text-xs text-gray-400">
            Flat fee added to every NGN Maplerad payout. The beneficiary still receives the full sent amount.
          </p>
        </div>
        {!editing && setting && (
          <button onClick={handleEdit} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            Edit
          </button>
        )}
      </div>

      {setting ? (
        editing ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-gray-700">Flat Fee (₦)</label>
              <p className="mb-1.5 text-xs text-gray-400">
                e.g. ₦25 — sending ₦1,000 debits ₦1,025; beneficiary receives ₦1,000.
              </p>
              <input
                type="number" min="0" step="1"
                value={flatFee}
                onChange={(e) => setFlatFee(e.target.value)}
                className={inputCls}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Provider', value: setting.provider ?? '—' },
              { label: 'Channel', value: `${setting.currency ?? ''} ${setting.channel ?? ''}`.trim() || '—' },
              { label: 'BillXpress Fee (flat)', value: fmtNGN(setting.flatFee) },
              { label: 'Provider Cost', value: fmtNGN(setting.providerFee) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                <p className="mt-1 text-sm font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        )
      ) : (
        <p className="text-sm text-gray-400">Loading transfer settings…</p>
      )}
    </div>
  );
}

// ─── Maplerad Institutions panel ──────────────────────────────────────────────

function InstitutionsPanel() {
  const { institutions, meta, loading, error, fetch } = useMapleradInstitutions();
  const [type, setType] = useState('DYNAMIC');
  const [open, setOpen] = useState(false);

  function handleFetch() {
    setOpen(true);
    fetch({ type, country: 'NG' });
  }

  const selectCls = 'rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500';

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <p className="font-semibold text-gray-900">Maplerad Bank / Institution Codes</p>
          <p className="mt-0.5 text-xs text-gray-400">Fetch institution codes without exposing the Maplerad secret key.</p>
        </div>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
              {INST_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button onClick={handleFetch} disabled={loading} className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
              {loading ? 'Fetching…' : 'Fetch institutions'}
            </button>
            {meta && (
              <span className="text-xs text-gray-500">
                {meta.total} institution{meta.total !== 1 ? 's' : ''} · type: {meta.type} · country: {meta.country}
              </span>
            )}
          </div>

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          {institutions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    {['Institution', 'Code'].map((h) => (
                      <th key={h} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {institutions.map((inst) => (
                    <tr key={inst.code} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{inst.name}</td>
                      <td className="px-4 py-2 font-mono font-semibold text-orange-600">{inst.code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function FundingSettings() {
  const { data: fundingData, loading: fundingLoading, error: fundingError, refetch: fundingRefetch, update: fundingUpdate } = useFundingSettings();
  const { setting: transferSetting, loading: transferLoading, error: transferError, refetch: transferRefetch, update: transferUpdate } = useTransferSettings();

  const loading = fundingLoading || transferLoading;
  const error = fundingError ?? transferError;

  function handleRefresh() {
    fundingRefetch();
    transferRefetch();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Funding &amp; Transfer Settings</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Wallet funding provider, per-provider charges, and bank transfer payout fees.
          </p>
        </div>
        <button onClick={handleRefresh} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          ↻ Refresh
        </button>
      </div>

      {loading && !fundingData && !transferSetting ? (
        <div className="flex items-center justify-center py-32 text-sm text-gray-400">Loading settings…</div>
      ) : error && !fundingData && !transferSetting ? (
        <div className="flex flex-col items-center justify-center gap-3 py-32">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={handleRefresh} className="text-sm text-orange-500 hover:underline">Try again</button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* One-time provider */}
          {fundingData && (
            <OneTimeProviderCard
              providerSettings={fundingData.providerSettings}
              onUpdate={fundingUpdate}
            />
          )}

          {/* Per-provider fee cards */}
          {fundingData?.settings?.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Funding Charge Settings
              </h2>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {fundingData.settings.map((s) => (
                  <ProviderFeeCard key={s.provider} setting={s} onUpdate={fundingUpdate} />
                ))}
              </div>
            </div>
          )}

          {/* Transfer / payout fee */}
          <TransferSettingsCard
            setting={transferSetting}
            onUpdate={transferUpdate}
          />

          {/* Institution codes */}
          <InstitutionsPanel />
        </div>
      )}
    </div>
  );
}
