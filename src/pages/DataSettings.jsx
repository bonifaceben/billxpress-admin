import { useState } from 'react';
import { useDataSettings } from '../hooks/useDataSettings';
import TierEditor from '../components/TierEditor';

// ─── constants ────────────────────────────────────────────────────────────────

const MVP_USER_TIERS = [
  { minCost: 0,    maxCost: 500,  markupPercent: 15 },
  { minCost: 501,  maxCost: 1500, markupPercent: 10 },
  { minCost: 1501, maxCost: 3000, markupPercent: 7  },
  { minCost: 3001, maxCost: 6000, markupPercent: 5  },
  { minCost: 6001, maxCost: null, markupPercent: 3  },
];

const MVP_VENDOR_TIERS = [
  { minCost: 0,    maxCost: 500,  markupPercent: 10 },
  { minCost: 501,  maxCost: 1500, markupPercent: 7  },
  { minCost: 1501, maxCost: 3000, markupPercent: 5  },
  { minCost: 3001, maxCost: 6000, markupPercent: 3  },
  { minCost: 6001, maxCost: null, markupPercent: 2  },
];

// ─── constants ───────────────────────────────────────────────────────────────

const NETWORKS = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatCost(value) {
  if (value == null) return '∞';
  return `₦${Number(value).toLocaleString()}`;
}

function cloneTiers(tiers) {
  return (tiers ?? []).map((t) => ({ ...t }));
}

function settingsToForm(s) {
  return {
    isEnabled: s.isEnabled ?? true,
    activeProvider: s.activeProvider ?? '',
    networkProviders: {
      MTN: s.networkProviders?.MTN ?? '',
      AIRTEL: s.networkProviders?.AIRTEL ?? '',
      GLO: s.networkProviders?.GLO ?? '',
      '9MOBILE': s.networkProviders?.['9MOBILE'] ?? '',
    },
    userMarkupPercent: s.userMarkupPercent ?? 15,
    vendorMarkupPercent: s.vendorMarkupPercent ?? 10,
    roundingMode: s.roundingMode ?? 'ceil',
    userPricingTiers: cloneTiers(s.userPricingTiers),
    vendorPricingTiers: cloneTiers(s.vendorPricingTiers),
  };
}

// ─── shared sub-components ────────────────────────────────────────────────────

function StatCard({ label, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      {children}
    </div>
  );
}

// ─── view: pricing tiers table ────────────────────────────────────────────────

function PricingTiersTable({ tiers, fallbackMarkup, label }) {
  const hasTiers = tiers && tiers.length > 0;
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h3 className="font-semibold text-gray-900">{label}</h3>
          <p className="mt-0.5 text-xs text-gray-400">
            {hasTiers
              ? 'Tiered pricing active — fallback applies when no tier matches.'
              : 'No tiers configured — flat markup applies to all plans.'}
          </p>
        </div>
        <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600">
          Fallback: {fallbackMarkup ?? '—'}%
        </span>
      </div>
      {hasTiers ? (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              {['Min Cost', 'Max Cost', 'Markup %'].map((h) => (
                <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tiers.map((tier, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{formatCost(tier.minCost)}</td>
                <td className="px-5 py-3 text-gray-600">{formatCost(tier.maxCost)}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                    {tier.markupPercent}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="flex items-center justify-center py-10 text-sm text-gray-400">No pricing tiers configured.</div>
      )}
    </div>
  );
}



// ─── view mode ────────────────────────────────────────────────────────────────

function ViewMode({ settings, onEdit }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
        <StatCard label="Rounding Mode">
          <p className="text-lg font-bold capitalize text-gray-900">{settings.roundingMode ?? '—'}</p>
        </StatCard>
      </div>

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

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 font-semibold text-gray-900">Network Routing</h3>
        <p className="mb-4 text-xs text-gray-400">
          Per-network provider overrides. Networks without an override use the global active provider.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {NETWORKS.map((network) => {
            const provider = settings.networkProviders?.[network];
            return (
              <div key={network} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{network}</p>
                {provider ? (
                  <p className="mt-1 text-sm font-semibold text-orange-600">{provider}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">global fallback</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PricingTiersTable label="User Pricing Tiers" tiers={settings.userPricingTiers} fallbackMarkup={settings.userMarkupPercent} />
        <PricingTiersTable label="Vendor Pricing Tiers" tiers={settings.vendorPricingTiers} fallbackMarkup={settings.vendorMarkupPercent} />
      </div>

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

    // Sanitise tiers: ensure numbers
    const sanitise = (tiers) =>
      tiers.map((t) => ({
        minCost: Number(t.minCost) || 0,
        maxCost: t.maxCost === '' || t.maxCost == null ? null : Number(t.maxCost),
        markupPercent: Number(t.markupPercent) || 0,
      }));

    // build networkProviders — only include if at least one network has an explicit provider
    const networkProviders = {};
    for (const [network, provider] of Object.entries(form.networkProviders ?? {})) {
      if (provider) networkProviders[network] = provider;
    }

    const payload = {
      isEnabled: form.isEnabled,
      activeProvider: form.activeProvider,
      userMarkupPercent: Number(form.userMarkupPercent),
      vendorMarkupPercent: Number(form.vendorMarkupPercent),
      roundingMode: form.roundingMode,
      userPricingTiers: sanitise(form.userPricingTiers),
      vendorPricingTiers: sanitise(form.vendorPricingTiers),
    };

    // only attach networkProviders when there is something to set
    if (Object.keys(networkProviders).length > 0) {
      payload.networkProviders = networkProviders;
    }

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
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Basic settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">General Settings</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* isEnabled */}
          <div>
            <label className="mb-1 block text-sm text-gray-700">Service Status</label>
            <select value={form.isEnabled ? 'true' : 'false'} onChange={(e) => set('isEnabled', e.target.value === 'true')} className={inputCls}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>

          {/* activeProvider */}
          <div>
            <label className="mb-1 block text-sm text-gray-700">Active Provider</label>
            <select value={form.activeProvider} onChange={(e) => set('activeProvider', e.target.value)} className={inputCls}>
              {(availableProviders ?? []).map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
              {(availableProviders ?? []).length === 0 && (
                <>
                  <option value="smeapi">smeapi</option>
                  <option value="ujaydata">ujaydata</option>
                </>
              )}
            </select>
          </div>

          {/* roundingMode */}
          <div>
            <label className="mb-1 block text-sm text-gray-700">Rounding Mode</label>
            <select value={form.roundingMode} onChange={(e) => set('roundingMode', e.target.value)} className={inputCls}>
              <option value="ceil">Ceil (round up)</option>
              <option value="round">Round (normal)</option>
            </select>
          </div>

          {/* userMarkupPercent */}
          <div>
            <label className="mb-1 block text-sm text-gray-700">
              User Fallback Markup %
              <span className="ml-1 text-xs text-gray-400">(used when no tier matches)</span>
            </label>
            <input type="number" min="0" max="100" value={form.userMarkupPercent} onChange={(e) => set('userMarkupPercent', e.target.value)} className={inputCls} />
          </div>

          {/* vendorMarkupPercent */}
          <div>
            <label className="mb-1 block text-sm text-gray-700">
              Vendor Fallback Markup %
              <span className="ml-1 text-xs text-gray-400">(used when no tier matches)</span>
            </label>
            <input type="number" min="0" max="100" value={form.vendorMarkupPercent} onChange={(e) => set('vendorMarkupPercent', e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* networkProviders */}
        <div className="mt-5 border-t border-gray-100 pt-5">
          <p className="mb-1 text-sm font-medium text-gray-700">Network Provider Overrides</p>
          <p className="mb-3 text-xs text-gray-400">
            Route each network to a specific provider. Leave blank to use the global active provider above.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {NETWORKS.map((network) => (
              <div key={network}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {network}
                </label>
                <select
                  value={form.networkProviders[network] ?? ''}
                  onChange={(e) =>
                    set('networkProviders', { ...form.networkProviders, [network]: e.target.value })
                  }
                  className={inputCls}
                >
                  <option value="">— global fallback —</option>
                  {(availableProviders ?? []).map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tier editors */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TierEditor
          label="User Pricing Tiers"
          tiers={form.userPricingTiers}
          onChange={(t) => set('userPricingTiers', t)}
          onApplyMVP={() => set('userPricingTiers', cloneTiers(MVP_USER_TIERS))}
        />
        <TierEditor
          label="Vendor Pricing Tiers"
          tiers={form.vendorPricingTiers}
          onChange={(t) => set('vendorPricingTiers', t)}
          onApplyMVP={() => set('vendorPricingTiers', cloneTiers(MVP_VENDOR_TIERS))}
        />
      </div>

      {/* Hint */}
      <div className="rounded-md bg-blue-50 px-4 py-3 text-xs text-blue-700">
        <strong>Tip:</strong> Leave Max Cost blank (empty) for the last tier to mean "no upper limit".
        If both tier arrays are empty, the flat fallback markup percentages above apply to all plans.
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DataSettings() {
  const { settings, loading, error, refetch, update } = useDataSettings();
  const [editing, setEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  async function handleSave(payload) {
    await update(payload);
    setEditing(false);
    setSuccessMsg('Data service settings saved successfully.');
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Data Service Settings</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Active provider, markup config, and pricing tiers for the data service.
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => { setSuccessMsg(null); refetch(); }}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
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
