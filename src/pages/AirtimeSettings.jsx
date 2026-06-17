import { useState } from 'react';
import { useAirtimeSettings } from '../hooks/useAirtimeSettings';

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatNaira(v) {
  if (v == null) return '—';
  return `₦${Number(v).toLocaleString()}`;
}

function settingsToForm(s) {
  return {
    isEnabled: s.isEnabled ?? true,
    activeProvider: s.activeProvider ?? 'ujaydata',
    userMarkupPercent: s.userMarkupPercent ?? 0,
    vendorMarkupPercent: s.vendorMarkupPercent ?? 0,
    roundingMode: s.roundingMode ?? 'ceil',
    minimumAmount: s.minimumAmount ?? 50,
    maximumAmount: s.maximumAmount ?? 50000,
  };
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      {children}
    </div>
  );
}

function ProfitExample({ userMarkup }) {
  const cost = 100;
  const profit = (cost * (userMarkup / 100)).toFixed(2);
  const debit = (cost + Number(profit)).toFixed(2);
  if (!userMarkup) return null;
  return (
    <div className="rounded-xl border border-orange-100 bg-orange-50 p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange-400">Example</p>
      <p className="text-sm text-orange-700">
        User buys <strong>₦{cost}</strong> airtime at <strong>{userMarkup}%</strong> markup →{' '}
        wallet debited <strong>₦{debit}</strong>, BillXpress profit <strong>₦{profit}</strong>.
      </p>
    </div>
  );
}

// ─── view mode ────────────────────────────────────────────────────────────────

function ViewMode({ settings, onEdit }) {
  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Service">
          <p className="text-lg font-bold capitalize text-gray-900">{settings.service}</p>
        </StatCard>

        <StatCard label="Status">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
            settings.isEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            {settings.isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </StatCard>

        <StatCard label="Active Provider">
          <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
            {settings.activeProvider ?? '—'}
          </span>
        </StatCard>

        <StatCard label="User Markup">
          <p className="text-2xl font-bold text-orange-500">{settings.userMarkupPercent ?? 0}%</p>
        </StatCard>

        <StatCard label="Vendor Markup">
          <p className="text-2xl font-bold text-gray-900">{settings.vendorMarkupPercent ?? 0}%</p>
        </StatCard>

        <StatCard label="Rounding">
          <p className="text-lg font-bold capitalize text-gray-900">{settings.roundingMode ?? '—'}</p>
        </StatCard>
      </div>

      {/* Amount limits */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Minimum Purchase</p>
          <p className="text-2xl font-bold text-gray-900">{formatNaira(settings.minimumAmount)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Maximum Purchase</p>
          <p className="text-2xl font-bold text-gray-900">{formatNaira(settings.maximumAmount)}</p>
        </div>
      </div>

      {/* Available providers */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-gray-900">Available Providers</h3>
        <div className="flex flex-wrap gap-2">
          {(settings.availableProviders ?? []).map((p) => (
            <span
              key={p.name}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${
                p.name === settings.activeProvider
                  ? 'border-orange-300 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${p.available ? 'bg-green-500' : 'bg-gray-300'}`} />
              {p.name}
              {p.name === settings.activeProvider && (
                <span className="ml-1 text-xs font-semibold text-orange-500">active</span>
              )}
            </span>
          ))}
        </div>
      </div>

      <ProfitExample userMarkup={settings.userMarkupPercent} />

      <div className="flex justify-end">
        <button
          onClick={onEdit}
          className="rounded-md bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Edit Settings
        </button>
      </div>
    </div>
  );
}

// ─── edit mode ────────────────────────────────────────────────────────────────

function EditMode({ initialForm, availableProviders, onSave, onCancel }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      isEnabled: form.isEnabled,
      activeProvider: form.activeProvider,
      userMarkupPercent: Number(form.userMarkupPercent),
      vendorMarkupPercent: Number(form.vendorMarkupPercent),
      roundingMode: form.roundingMode,
      minimumAmount: Number(form.minimumAmount),
      maximumAmount: Number(form.maximumAmount),
    };
    try {
      await onSave(payload);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to save settings.');
      setSaving(false);
    }
  }

  const inputCls =
    'w-full rounded-md bg-gray-100 px-3 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-transparent focus:bg-white focus:ring-orange-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">General Settings</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-gray-700">Service Status</label>
            <select value={form.isEnabled ? 'true' : 'false'} onChange={(e) => set('isEnabled', e.target.value === 'true')} className={inputCls}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700">Active Provider</label>
            <select value={form.activeProvider} onChange={(e) => set('activeProvider', e.target.value)} className={inputCls}>
              {(availableProviders ?? [{ name: 'ujaydata' }]).map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700">Rounding Mode</label>
            <select value={form.roundingMode} onChange={(e) => set('roundingMode', e.target.value)} className={inputCls}>
              <option value="ceil">Ceil (round up)</option>
              <option value="round">Round (normal)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Markup */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 font-semibold text-gray-900">Markup Percentages</h3>
        <p className="mb-4 text-xs text-gray-400">
          Added on top of the airtime face value. 0% means the user pays exactly the airtime amount.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-700">User Markup %</label>
            <input type="number" min="0" max="100" step="0.1" value={form.userMarkupPercent} onChange={(e) => set('userMarkupPercent', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Vendor Markup %</label>
            <input type="number" min="0" max="100" step="0.1" value={form.vendorMarkupPercent} onChange={(e) => set('vendorMarkupPercent', e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Live profit example */}
        {Number(form.userMarkupPercent) > 0 && (
          <div className="mt-4 rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700">
            Example: user buys <strong>₦100</strong> airtime →
            wallet debited <strong>₦{(100 + 100 * Number(form.userMarkupPercent) / 100).toFixed(2)}</strong>,
            profit <strong>₦{(100 * Number(form.userMarkupPercent) / 100).toFixed(2)}</strong>.
          </div>
        )}
      </div>

      {/* Amount limits */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 font-semibold text-gray-900">Purchase Limits</h3>
        <p className="mb-4 text-xs text-gray-400">
          Transactions outside this range will be rejected by the backend.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-700">Minimum Amount (₦)</label>
            <input type="number" min="0" value={form.minimumAmount} onChange={(e) => set('minimumAmount', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Maximum Amount (₦)</label>
            <input type="number" min="0" value={form.maximumAmount} onChange={(e) => set('maximumAmount', e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-md bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AirtimeSettings() {
  const { settings, loading, error, refetch, update } = useAirtimeSettings();
  const [editing, setEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  async function handleSave(payload) {
    await update(payload);
    setEditing(false);
    setSuccessMsg('Airtime settings saved successfully.');
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Airtime Service Settings</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Provider, markup percentages, and purchase limits for the airtime service.
          </p>
        </div>
        {!editing && (
          <button onClick={() => { setSuccessMsg(null); refetch(); }} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            ↻ Refresh
          </button>
        )}
      </div>

      {successMsg && (
        <div className="mb-5 flex items-center justify-between rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-4 text-green-500 hover:text-green-700">✕</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-32 text-sm text-gray-400">Loading settings…</div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-32">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={refetch} className="text-sm text-orange-500 hover:underline">Try again</button>
        </div>
      ) : !settings ? null : editing ? (
        <EditMode
          initialForm={settingsToForm(settings)}
          availableProviders={settings.availableProviders}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <ViewMode settings={settings} onEdit={() => { setSuccessMsg(null); setEditing(true); }} />
      )}
    </div>
  );
}
