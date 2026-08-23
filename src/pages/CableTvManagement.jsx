import { useEffect, useMemo, useState } from 'react';
import { useCableTvPackages, useCableTvSettings } from '../hooks/useCableTvAdmin';

const EMPTY_FILTERS = { provider: 'vtpass', tvProvider: '', isEnabled: '', providerAvailable: '' };
const inputClass = 'rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400';

function money(value) {
  return value == null || value === '' ? '—' : `₦${Number(value).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function SettingsPanel() {
  const { settings, loading, error, refetch, updateSettings } = useCableTvSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (settings) setForm({ isEnabled: settings.isEnabled ?? true, activeProvider: settings.activeProvider ?? 'vtpass', userMarkupPercent: settings.userMarkupPercent ?? 0, vendorMarkupPercent: settings.vendorMarkupPercent ?? 0, roundingMode: settings.roundingMode ?? 'ceil' });
  }, [settings]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateSettings({ ...form, userMarkupPercent: Number(form.userMarkupPercent), vendorMarkupPercent: Number(form.vendorMarkupPercent) });
      setMessage({ ok: true, text: 'Cable TV settings saved successfully.' });
    } catch (requestError) {
      setMessage({ ok: false, text: requestError?.response?.data?.message ?? 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  }

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return <section className="mb-7 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-gray-900">Service Settings</h2><p className="text-xs text-gray-400">Provider, availability, fallback markup, and rounding.</p></div><button onClick={refetch} className="text-sm text-orange-500 hover:underline">Refresh</button></div>
    {loading ? <p className="py-8 text-center text-sm text-gray-400">Loading settings…</p> : error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : form && <form onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><label className="text-xs text-gray-500">Status<select className={`${inputClass} mt-1 w-full`} value={String(form.isEnabled)} onChange={(e) => set('isEnabled', e.target.value === 'true')}><option value="true">Enabled</option><option value="false">Disabled</option></select></label><label className="text-xs text-gray-500">Active Provider<select className={`${inputClass} mt-1 w-full`} value={form.activeProvider} onChange={(e) => set('activeProvider', e.target.value)}><option value="vtpass">vtpass</option></select></label><label className="text-xs text-gray-500">User Markup %<input className={`${inputClass} mt-1 w-full`} type="number" min="0" step="0.1" value={form.userMarkupPercent} onChange={(e) => set('userMarkupPercent', e.target.value)} /></label><label className="text-xs text-gray-500">Vendor Markup %<input className={`${inputClass} mt-1 w-full`} type="number" min="0" step="0.1" value={form.vendorMarkupPercent} onChange={(e) => set('vendorMarkupPercent', e.target.value)} /></label><label className="text-xs text-gray-500">Rounding<select className={`${inputClass} mt-1 w-full`} value={form.roundingMode} onChange={(e) => set('roundingMode', e.target.value)}><option value="ceil">Ceil</option><option value="round">Round</option><option value="floor">Floor</option></select></label></div>{message && <p className={`mt-4 rounded-md px-3 py-2 text-sm ${message.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message.text}</p>}<div className="mt-4 flex justify-end"><button disabled={saving} className="rounded-md bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">{saving ? 'Saving…' : 'Save Settings'}</button></div></form>}
  </section>;
}

function PackageRow({ item, updatePackage }) {
  const id = item.id ?? item._id;
  const [ourPrice, setOurPrice] = useState(item.ourPrice ?? '');
  const [vendorPrice, setVendorPrice] = useState(item.vendorPrice ?? '');
  const [enabled, setEnabled] = useState(Boolean(item.isEnabled));
  const [saving, setSaving] = useState('');
  const [error, setError] = useState(null);
  useEffect(() => { setOurPrice(item.ourPrice ?? ''); setVendorPrice(item.vendorPrice ?? ''); setEnabled(Boolean(item.isEnabled)); }, [item.ourPrice, item.vendorPrice, item.isEnabled]);

  async function savePrice(field, value, original) {
    const next = value === '' ? null : Number(value);
    if (next === (original ?? null)) return;
    setSaving(field); setError(null);
    try { await updatePackage(id, { [field]: next }); } catch (requestError) { field === 'ourPrice' ? setOurPrice(original ?? '') : setVendorPrice(original ?? ''); setError(requestError?.response?.data?.message ?? 'Save failed.'); } finally { setSaving(''); }
  }
  async function toggle(event) {
    const next = event.target.value === 'true'; const previous = enabled;
    setEnabled(next); setSaving('enabled'); setError(null);
    try { await updatePackage(id, { isEnabled: next }); } catch (requestError) { setEnabled(previous); setError(requestError?.response?.data?.message ?? 'Save failed.'); } finally { setSaving(''); }
  }
  const tvProvider = item.tvProvider ?? item.providerName ?? item.biller;
  const baseAmount = item.baseAmount ?? item.providerPrice ?? item.amount ?? item.costPrice;
  return <tr className="hover:bg-gray-50"><td className="px-4 py-3"><p className="font-semibold uppercase text-gray-900">{tvProvider ?? '—'}</p><p className="text-xs text-gray-400">{item.provider ?? 'vtpass'}</p></td><td className="px-4 py-3"><p className="font-medium text-gray-900">{item.name ?? item.packageName ?? '—'}</p><p className="font-mono text-xs text-gray-400">{item.code ?? item.packageCode ?? item.serviceId ?? '—'}</p></td><td className="whitespace-nowrap px-4 py-3 text-gray-600">{money(baseAmount)}</td><td className="px-4 py-3"><input aria-label="User price" type="number" min="0" value={ourPrice} placeholder="Fallback" onChange={(e) => setOurPrice(e.target.value)} onBlur={() => savePrice('ourPrice', ourPrice, item.ourPrice)} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} disabled={saving === 'ourPrice'} className="w-28 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-orange-400" /></td><td className="px-4 py-3"><input aria-label="Vendor price" type="number" min="0" value={vendorPrice} placeholder="Fallback" onChange={(e) => setVendorPrice(e.target.value)} onBlur={() => savePrice('vendorPrice', vendorPrice, item.vendorPrice)} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} disabled={saving === 'vendorPrice'} className="w-28 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-orange-400" /></td><td className="px-4 py-3"><select value={String(enabled)} onChange={toggle} disabled={saving === 'enabled'} className={`rounded-md border px-2 py-1.5 text-xs font-semibold ${enabled ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}><option value="true">Enabled</option><option value="false">Disabled</option></select>{error && <p className="mt-1 max-w-48 text-xs text-red-500">{error}</p>}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.providerAvailable ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{item.providerAvailable ? 'Available' : 'Unavailable'}</span></td><td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{formatDate(item.lastSyncedAt)}</td></tr>;
}

export default function CableTvManagement() {
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [banner, setBanner] = useState(null);
  const activeFilters = useMemo(() => filters, [filters]);
  const { packages, count, loading, error, syncing, refetch, syncPackages, updatePackage } = useCableTvPackages(activeFilters);
  const set = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  async function sync() { setBanner(null); try { const result = await syncPackages(); const payload = result?.data ?? result ?? {}; setBanner({ ok: true, text: payload.message ?? `Sync complete. ${payload.created ?? 0} created, ${payload.updated ?? 0} updated.` }); } catch (requestError) { setBanner({ ok: false, text: requestError?.response?.data?.message ?? 'Package sync failed.' }); } }
  return <div><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold text-gray-900">Cable TV Management</h1><p className="mt-0.5 text-sm text-gray-500">Configure Cable TV pricing and manage the VTpass package catalogue.</p></div><div className="flex gap-3"><button onClick={refetch} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600">↻ Refresh</button><button onClick={sync} disabled={syncing} className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{syncing ? 'Syncing…' : 'Sync VTpass Packages'}</button></div></div>
    {banner && <p className={`mb-5 rounded-md px-4 py-3 text-sm ${banner.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{banner.text}</p>}<SettingsPanel />
    <div className="mb-5 rounded-md bg-blue-50 px-4 py-3 text-xs text-blue-700"><strong>Pricing:</strong> leave a fixed price blank to use the service fallback markup. Packages must be enabled and provider-available before customers can see them.</div>
    <form onSubmit={(e) => { e.preventDefault(); setFilters({ ...draft }); }} className="mb-5 flex flex-wrap gap-3"><select className={inputClass} value={draft.provider} onChange={(e) => set('provider', e.target.value)}><option value="vtpass">vtpass</option></select><select className={inputClass} value={draft.tvProvider} onChange={(e) => set('tvProvider', e.target.value)}><option value="">All TV providers</option>{['DSTV', 'GOTV', 'STARTIMES'].map((value) => <option key={value}>{value}</option>)}</select><select className={inputClass} value={draft.isEnabled} onChange={(e) => set('isEnabled', e.target.value)}><option value="">Enabled: all</option><option value="true">Enabled only</option><option value="false">Disabled only</option></select><select className={inputClass} value={draft.providerAvailable} onChange={(e) => set('providerAvailable', e.target.value)}><option value="">Availability: all</option><option value="true">Available only</option><option value="false">Unavailable only</option></select><button className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white">Apply Filters</button><button type="button" onClick={() => { setDraft(EMPTY_FILTERS); setFilters(EMPTY_FILTERS); }} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600">Clear</button></form>
    <div className="mb-3 flex items-center justify-between"><p className="text-sm text-gray-500">{count.toLocaleString()} package{count === 1 ? '' : 's'} found</p><p className="text-xs text-gray-400">Changes save when a field loses focus.</p></div><div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">{loading ? <div className="py-24 text-center text-sm text-gray-400">Loading Cable TV packages…</div> : error ? <div className="flex flex-col items-center gap-3 py-24"><p className="text-sm text-red-600">{error}</p><button onClick={refetch} className="text-sm text-orange-500 hover:underline">Try again</button></div> : packages.length === 0 ? <div className="py-24 text-center text-sm text-gray-400">No packages found. Sync VTpass or adjust the filters.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="border-b border-gray-200 bg-gray-50"><tr>{['Provider', 'Package', 'VTpass Base', 'User Price', 'Vendor Price', 'Enabled', 'Provider Status', 'Last Synced'].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase text-gray-500">{heading}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{packages.map((item) => <PackageRow key={item.id ?? item._id} item={item} updatePackage={updatePackage} />)}</tbody></table></div>}</div>
  </div>;
}
