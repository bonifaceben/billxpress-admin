import { useState, useEffect } from 'react';
import { useAdminDataPlans } from '../hooks/useAdminDataPlans';

// ─── constants ────────────────────────────────────────────────────────────────

const NETWORKS = ['', 'MTN', 'AIRTEL', 'GLO', '9MOBILE'];
const TYPES = ['', 'AWOOF', 'GIFTING', 'SME', 'CORPORATE GIFTING', 'SOCIAL', 'OTHER'];
const PROVIDERS = ['', 'smeapi', 'smeplug', 'autopilot', 'ujaydata', 'ogdams', '2fast', 'vtpass'];

const NETWORK_COLORS = {
  MTN: 'bg-yellow-100 text-yellow-800',
  GLO: 'bg-green-100 text-green-700',
  AIRTEL: 'bg-red-100 text-red-700',
  '9MOBILE': 'bg-emerald-100 text-emerald-700',
};

const EMPTY_FILTERS = {
  provider: '',
  network: '',
  type: '',
  isEnabled: '',
  providerAvailable: '',
  customerVisible: '',
  sortBy: 'provider',
  sortDirection: 'asc',
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatNaira(value) {
  if (value == null) return null;
  return `₦${Number(value).toLocaleString()}`;
}

function shortId(id) {
  if (!id) return '—';
  return String(id).length > 12 ? String(id).slice(0, 8) + '…' : id;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

// ─── badges ──────────────────────────────────────────────────────────────────

function NetworkBadge({ network }) {
  const cls = NETWORK_COLORS[network] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {network ?? '—'}
    </span>
  );
}

function AvailableBadge({ value }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      value ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {value ? 'Available' : 'Unavailable'}
    </span>
  );
}

// ─── inline-editable plan row ─────────────────────────────────────────────────

function PlanRow({ plan, onUpdate }) {
  const [isEnabled, setIsEnabled] = useState(plan.isEnabled);
  const [priceDraft, setPriceDraft] = useState(plan.ourPrice ?? '');
  const [vendorPriceDraft, setVendorPriceDraft] = useState(plan.vendorPrice ?? '');
  const [savingEnabled, setSavingEnabled] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [savingVendorPrice, setSavingVendorPrice] = useState(false);
  const [enabledError, setEnabledError] = useState(null);
  const [priceError, setPriceError] = useState(null);
  const [vendorPriceError, setVendorPriceError] = useState(null);

  // keep local state in sync when parent re-fetches
  useEffect(() => { setIsEnabled(plan.isEnabled); }, [plan.isEnabled]);
  useEffect(() => { setPriceDraft(plan.ourPrice ?? ''); }, [plan.ourPrice]);
  useEffect(() => { setVendorPriceDraft(plan.vendorPrice ?? ''); }, [plan.vendorPrice]);

  async function handleEnabledChange(e) {
    const next = e.target.value === 'true';
    const prev = isEnabled;
    setIsEnabled(next);
    setEnabledError(null);
    setSavingEnabled(true);
    try {
      await onUpdate(plan.id, { isEnabled: next });
    } catch (err) {
      setIsEnabled(prev);
      setEnabledError(err?.response?.data?.message ?? 'Save failed');
    } finally {
      setSavingEnabled(false);
    }
  }

  async function handlePriceBlur() {
    const num = priceDraft === '' ? null : Number(priceDraft);
    if (num === (plan.ourPrice ?? null)) return;
    setPriceError(null);
    setSavingPrice(true);
    try {
      await onUpdate(plan.id, { ourPrice: num });
    } catch (err) {
      setPriceDraft(plan.ourPrice ?? '');
      setPriceError(err?.response?.data?.message ?? 'Save failed');
    } finally {
      setSavingPrice(false);
    }
  }

  async function handleVendorPriceBlur() {
    const num = vendorPriceDraft === '' ? null : Number(vendorPriceDraft);
    if (num === (plan.vendorPrice ?? null)) return;
    setVendorPriceError(null);
    setSavingVendorPrice(true);
    try {
      await onUpdate(plan.id, { vendorPrice: num });
    } catch (err) {
      setVendorPriceDraft(plan.vendorPrice ?? '');
      setVendorPriceError(err?.response?.data?.message ?? 'Save failed');
    } finally {
      setSavingVendorPrice(false);
    }
  }

  const priceIsUnset = priceDraft === '' || priceDraft == null;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <span title={plan.id} className="cursor-default font-mono text-xs text-gray-400">
          {shortId(plan.id)}
        </span>
      </td>
      <td className="px-4 py-3"><NetworkBadge network={plan.network} /></td>
      <td className="px-4 py-3 font-semibold capitalize text-gray-700">{plan.provider ?? '—'}</td>
      <td className="px-4 py-3 font-medium text-gray-900">{plan.name ?? plan.planName ?? '—'}</td>
      <td className="px-4 py-3 text-gray-600">{plan.type ?? plan.datatype ?? '—'}</td>
      <td className="px-4 py-3 text-gray-600">{plan.validity ?? '—'}</td>
      <td className="px-4 py-3 text-gray-500">
        {formatNaira(plan.networkPrice) ?? '—'}
      </td>
      <td className="px-4 py-3 text-gray-500">
        {formatNaira(plan.providerPrice ?? plan.price ?? plan.costPrice) ?? '—'}
      </td>
      <td className="px-4 py-3 font-medium text-gray-700">{formatNaira(plan.costPrice) ?? '—'}</td>

      {/* Our Price — editable */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              value={priceDraft}
              onChange={(e) => setPriceDraft(e.target.value)}
              onBlur={handlePriceBlur}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              placeholder="Set price"
              disabled={savingPrice}
              className={`w-24 rounded-md border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-orange-400 disabled:opacity-50 ${
                priceIsUnset
                  ? 'border-orange-300 bg-orange-50 text-orange-700 placeholder-orange-400'
                  : 'border-gray-200 bg-white text-gray-900'
              }`}
            />
            {savingPrice && <span className="text-xs text-gray-400">Saving…</span>}
          </div>
          {priceError && <p className="text-xs text-red-500">{priceError}</p>}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5"><input type="number" min="0" value={vendorPriceDraft} onChange={(e) => setVendorPriceDraft(e.target.value)} onBlur={handleVendorPriceBlur} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} placeholder="Fallback" disabled={savingVendorPrice} className="w-24 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-orange-400 disabled:opacity-50" />{savingVendorPrice && <span className="text-xs text-gray-400">Saving…</span>}</div>
          {vendorPriceError && <p className="text-xs text-red-500">{vendorPriceError}</p>}
        </div>
      </td>

      {/* Enabled — editable select */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <select
              value={isEnabled ? 'true' : 'false'}
              onChange={handleEnabledChange}
              disabled={savingEnabled}
              className={`rounded-md border px-2 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-orange-400 disabled:opacity-50 ${
                isEnabled
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
            {savingEnabled && <span className="text-xs text-gray-400">Saving…</span>}
          </div>
          {enabledError && (
            <p className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
              {enabledError}
            </p>
          )}
        </div>
      </td>

      <td className="px-4 py-3"><AvailableBadge value={plan.providerAvailable} /></td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{formatDate(plan.lastSyncedAt)}</td>
    </tr>
  );
}

// ─── filter bar ───────────────────────────────────────────────────────────────

function FilterBar({ filters, onChange, onSearch, onClear }) {
  const inputCls =
    'rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400';

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSearch(); }}
      className="mb-5 flex flex-wrap gap-3"
    >
      <select value={filters.provider} onChange={(e) => onChange('provider', e.target.value)} className={inputCls + ' w-40'}><option value="">All providers</option>{PROVIDERS.filter(Boolean).map((provider) => <option key={provider} value={provider}>{provider}</option>)}</select>

      <select value={filters.network} onChange={(e) => onChange('network', e.target.value)} className={inputCls + ' w-40'}>
        <option value="">All networks</option>
        {NETWORKS.filter(Boolean).map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>

      <select value={filters.type} onChange={(e) => onChange('type', e.target.value)} className={inputCls + ' w-48'}>
        <option value="">All types</option>
        {TYPES.filter(Boolean).map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <select value={filters.isEnabled} onChange={(e) => onChange('isEnabled', e.target.value)} className={inputCls + ' w-36'}>
        <option value="">Enabled: all</option>
        <option value="true">Enabled only</option>
        <option value="false">Disabled only</option>
      </select>

      <select value={filters.providerAvailable} onChange={(e) => onChange('providerAvailable', e.target.value)} className={inputCls + ' w-44'}>
        <option value="">Provider avail: all</option>
        <option value="true">Available only</option>
        <option value="false">Unavailable only</option>
      </select>

      <select value={filters.customerVisible} onChange={(e) => onChange('customerVisible', e.target.value)} className={inputCls + ' w-44'}><option value="">Visibility: all</option><option value="true">Customer visible</option><option value="false">Not customer visible</option></select>
      <select value={filters.sortBy} onChange={(e) => onChange('sortBy', e.target.value)} className={inputCls + ' w-40'}><option value="provider">Sort: provider</option><option value="network">Sort: network</option><option value="price">Sort: price</option><option value="name">Sort: name</option></select>
      <select value={filters.sortDirection} onChange={(e) => onChange('sortDirection', e.target.value)} className={inputCls + ' w-32'}><option value="asc">Ascending</option><option value="desc">Descending</option></select>

      <button type="submit" className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
        Search
      </button>
      <button type="button" onClick={onClear} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
        Clear
      </button>
    </form>
  );
}

// ─── sync result banner ───────────────────────────────────────────────────────

function SyncBanner({ result, error, onDismiss }) {
  if (error) {
    return (
      <div className="mb-5 flex items-center justify-between rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
        <span>Sync failed: {error}</span>
        <button onClick={onDismiss} className="ml-4 text-red-400 hover:text-red-600">✕</button>
      </div>
    );
  }
  if (!result) return null;

  const parts = [];
  if (result.created != null) parts.push(`${result.created} new`);
  if (result.updated != null) parts.push(`${result.updated} updated`);
  if (result.synced != null && parts.length === 0) parts.push(`${result.synced} synced`);

  const summary = parts.length > 0 ? ` — ${parts.join(', ')} plans.` : '.';
  const msg = result.message ? result.message : `Sync complete${summary}`;

  return (
    <div className="mb-5 flex items-center justify-between rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
      <span>{msg}</span>
      <button onClick={onDismiss} className="ml-4 text-green-400 hover:text-green-600">✕</button>
    </div>
  );
}

// ─── summary cards ────────────────────────────────────────────────────────────

function SummaryCards({ plans }) {
  const total = plans.length;
  const enabled = plans.filter((p) => p.isEnabled).length;
  const disabled = total - enabled;
  const providerAvail = plans.filter((p) => p.providerAvailable).length;
  const fallbackPriced = plans.filter((p) => p.ourPrice == null || p.vendorPrice == null).length;

  const cards = [
    { label: 'Total Plans', value: total },
    { label: 'Enabled', value: enabled, color: 'text-green-600' },
    { label: 'Disabled', value: disabled, color: 'text-red-600' },
    { label: 'Provider Available', value: providerAvail, color: 'text-blue-600' },
    { label: 'Using Fallback Pricing', value: fallbackPriced, color: fallbackPriced > 0 ? 'text-orange-600' : 'text-gray-900' },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{c.label}</p>
          <p className={`mt-2 text-2xl font-bold ${c.color ?? 'text-gray-900'}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function AdminDataPlans() {
  const [formFilters, setFormFilters] = useState({ ...EMPTY_FILTERS });
  const [activeFilters, setActiveFilters] = useState({ ...EMPTY_FILTERS });
  const [syncDismissed, setSyncDismissed] = useState(false);

  const { plans, count, loading, error, syncing, syncResult, syncError, refetch, syncPlans, updatePlan } =
    useAdminDataPlans(activeFilters);

  function handleFilterChange(field, value) {
    setFormFilters((prev) => ({ ...prev, [field]: value }));
  }

  function handleSearch() {
    setActiveFilters({ ...formFilters });
    setSyncDismissed(false);
  }

  function handleClear() {
    setFormFilters({ ...EMPTY_FILTERS });
    setActiveFilters({ ...EMPTY_FILTERS });
  }

  async function handleSync() {
    setSyncDismissed(false);
    try {
      await syncPlans();
      refetch();
    } catch {
      // error stored in syncError
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Data Plan Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Audit, price, enable, and route plans across every connected provider.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={refetch}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            ↻ Refresh
          </button>
          <button
            onClick={handleSync}
            disabled={syncing || loading}
            className="flex items-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {syncing ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Syncing…
              </>
            ) : (
                'Sync Provider Plans'
            )}
          </button>
        </div>
      </div>

      {!syncDismissed && (syncResult || syncError) && (
        <SyncBanner
          result={syncResult}
          error={syncError}
          onDismiss={() => setSyncDismissed(true)}
        />
      )}

      <div className="mb-4 rounded-md bg-blue-50 px-4 py-3 text-xs text-blue-700">
        <strong>Pricing:</strong> <code>ourPrice</code> and <code>vendorPrice</code> are optional fixed prices.
        Leave either blank to use that audience's tiered or fallback percentage pricing.
      </div>

      <FilterBar
        filters={formFilters}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        onClear={handleClear}
      />

      {!loading && !error && plans.length > 0 && (
        <SummaryCards plans={plans} />
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-gray-400">Loading plans…</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={refetch} className="text-sm text-orange-500 hover:underline">Try again</button>
          </div>
        ) : plans.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-sm text-gray-400">
            No plans found. Try syncing or adjusting your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  {['DB ID', 'Network', 'Provider', 'Bundle', 'Type', 'Validity', 'Network Price', 'Provider Price', 'Cost Price', 'Our Price', 'Vendor Price', 'Enabled', 'Available', 'Last Synced'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plans.map((plan) => (
                  <PlanRow key={plan.id} plan={plan} onUpdate={updatePlan} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <div className="border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400">
              Showing {plans.length} plan{plans.length !== 1 ? 's' : ''}
              {count > plans.length ? ` (${count} total)` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
