import { useState } from 'react';
import { useElectricitySettings } from '../hooks/useElectricitySettings';

const inputClass = 'w-full rounded-md bg-gray-100 px-3 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-transparent focus:bg-white focus:ring-orange-500';

function providerName(provider) {
  return typeof provider === 'string' ? provider : provider?.name;
}

function formatNaira(value) {
  return value == null ? '—' : `₦${Number(value).toLocaleString()}`;
}

function toForm(settings) {
  return {
    isEnabled: settings.isEnabled ?? true,
    activeProvider: settings.activeProvider ?? 'vtpass',
    userMarkupPercent: settings.userMarkupPercent ?? 0,
    vendorMarkupPercent: settings.vendorMarkupPercent ?? 0,
    roundingMode: settings.roundingMode ?? 'ceil',
    minimumAmount: settings.minimumAmount ?? 100,
    maximumAmount: settings.maximumAmount ?? 500000,
  };
}

function Stat({ label, value, accent = false }) {
  return <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
    <p className={`text-lg font-bold capitalize ${accent ? 'text-orange-500' : 'text-gray-900'}`}>{value}</p>
  </div>;
}

function ViewMode({ settings, onEdit }) {
  const providers = settings.availableProviders ?? [];
  return <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <Stat label="Service" value={settings.service ?? 'Electricity'} />
      <Stat label="Status" value={settings.isEnabled ? 'Enabled' : 'Disabled'} />
      <Stat label="Active Provider" value={settings.activeProvider ?? '—'} accent />
      <Stat label="User Markup" value={`${settings.userMarkupPercent ?? 0}%`} accent />
      <Stat label="Vendor Markup" value={`${settings.vendorMarkupPercent ?? 0}%`} />
      <Stat label="Rounding" value={settings.roundingMode ?? '—'} />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <Stat label="Minimum Purchase" value={formatNaira(settings.minimumAmount)} />
      <Stat label="Maximum Purchase" value={formatNaira(settings.maximumAmount)} />
    </div>
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-semibold text-gray-900">Available Providers</h3>
      <div className="flex flex-wrap gap-2">
        {providers.length ? providers.map((provider) => {
          const name = providerName(provider);
          const available = typeof provider === 'string' || provider.available !== false;
          const active = name === settings.activeProvider;
          return <span key={name} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${active ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
            <span className={`h-2 w-2 rounded-full ${available ? 'bg-green-500' : 'bg-gray-300'}`} />{name}{active && <span className="text-xs font-semibold">active</span>}
          </span>;
        }) : <p className="text-sm text-gray-400">No provider list returned.</p>}
      </div>
    </div>
    <div className="flex justify-end"><button onClick={onEdit} className="rounded-md bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">Edit Settings</button></div>
  </div>;
}

function EditMode({ settings, onSave, onCancel }) {
  const [form, setForm] = useState(() => toForm(settings));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const providers = (settings.availableProviders ?? ['vtpass']).map(providerName).filter(Boolean);
  if (!providers.includes(form.activeProvider)) providers.unshift(form.activeProvider);
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  async function submit(event) {
    event.preventDefault();
    const minimumAmount = Number(form.minimumAmount);
    const maximumAmount = Number(form.maximumAmount);
    if (minimumAmount < 0 || maximumAmount < minimumAmount) {
      setError('Maximum amount must be greater than or equal to the minimum amount.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...form, userMarkupPercent: Number(form.userMarkupPercent), vendorMarkupPercent: Number(form.vendorMarkupPercent), minimumAmount, maximumAmount });
    } catch (requestError) {
      setError(requestError?.response?.data?.message ?? 'Failed to save electricity settings.');
      setSaving(false);
    }
  }

  return <form onSubmit={submit} className="space-y-6">
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-semibold text-gray-900">General Settings</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm text-gray-700">Service Status<select className={`${inputClass} mt-1`} value={String(form.isEnabled)} onChange={(e) => set('isEnabled', e.target.value === 'true')}><option value="true">Enabled</option><option value="false">Disabled</option></select></label>
        <label className="text-sm text-gray-700">Active Provider<select className={`${inputClass} mt-1`} value={form.activeProvider} onChange={(e) => set('activeProvider', e.target.value)}>{providers.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <label className="text-sm text-gray-700">Rounding Mode<select className={`${inputClass} mt-1`} value={form.roundingMode} onChange={(e) => set('roundingMode', e.target.value)}><option value="ceil">Ceil (round up)</option><option value="round">Round (normal)</option><option value="floor">Floor (round down)</option></select></label>
      </div>
    </section>
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 font-semibold text-gray-900">Markup Percentages</h3><p className="mb-4 text-xs text-gray-400">Added to electricity purchases before the customer or vendor is charged.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-gray-700">User Markup %<input className={`${inputClass} mt-1`} type="number" min="0" max="100" step="0.1" value={form.userMarkupPercent} onChange={(e) => set('userMarkupPercent', e.target.value)} /></label>
        <label className="text-sm text-gray-700">Vendor Markup %<input className={`${inputClass} mt-1`} type="number" min="0" max="100" step="0.1" value={form.vendorMarkupPercent} onChange={(e) => set('vendorMarkupPercent', e.target.value)} /></label>
      </div>
    </section>
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 font-semibold text-gray-900">Purchase Limits</h3><p className="mb-4 text-xs text-gray-400">Electricity purchases outside this range will be rejected.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-gray-700">Minimum Amount (₦)<input className={`${inputClass} mt-1`} type="number" min="0" value={form.minimumAmount} onChange={(e) => set('minimumAmount', e.target.value)} /></label>
        <label className="text-sm text-gray-700">Maximum Amount (₦)<input className={`${inputClass} mt-1`} type="number" min="0" value={form.maximumAmount} onChange={(e) => set('maximumAmount', e.target.value)} /></label>
      </div>
    </section>
    {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <div className="flex justify-end gap-3"><button type="button" onClick={onCancel} className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button><button disabled={saving} className="rounded-md bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">{saving ? 'Saving…' : 'Save Settings'}</button></div>
  </form>;
}

export default function ElectricitySettings() {
  const { settings, loading, error, refetch, update } = useElectricitySettings();
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState(null);
  async function save(payload) { await update(payload); setEditing(false); setSuccess('Electricity settings saved successfully.'); }
  return <div>
    <div className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-semibold text-gray-900">Electricity Service Settings</h1><p className="mt-0.5 text-sm text-gray-500">Provider, markup percentages, and purchase limits for electricity payments.</p></div>{!editing && <button onClick={() => { setSuccess(null); refetch(); }} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">↻ Refresh</button>}</div>
    {success && <div className="mb-5 flex items-center justify-between rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">{success}<button onClick={() => setSuccess(null)}>×</button></div>}
    {loading ? <div className="py-32 text-center text-sm text-gray-400">Loading settings…</div> : error ? <div className="flex flex-col items-center gap-3 py-32"><p className="text-sm text-red-600">{error}</p><button onClick={refetch} className="text-sm text-orange-500 hover:underline">Try again</button></div> : !settings ? null : editing ? <EditMode settings={settings} onSave={save} onCancel={() => setEditing(false)} /> : <ViewMode settings={settings} onEdit={() => { setSuccess(null); setEditing(true); }} />}
  </div>;
}
