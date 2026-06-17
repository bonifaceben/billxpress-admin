import { useState } from 'react';
import { useSocialGrowthSettings } from '../hooks/useSocialGrowthSettings';
import TierEditor from '../components/TierEditor';

// ─── constants ────────────────────────────────────────────────────────────────

const MVP_USER_TIERS = [
  { minCost: 0,     maxCost: 1000,  markupPercent: 15 },
  { minCost: 1001,  maxCost: 5000,  markupPercent: 10 },
  { minCost: 5001,  maxCost: 15000, markupPercent: 7  },
  { minCost: 15001, maxCost: 50000, markupPercent: 5  },
  { minCost: 50001, maxCost: null,  markupPercent: 3  },
];

const MVP_VENDOR_TIERS = [
  { minCost: 0,     maxCost: 1000,  markupPercent: 10 },
  { minCost: 1001,  maxCost: 5000,  markupPercent: 7  },
  { minCost: 5001,  maxCost: 15000, markupPercent: 5  },
  { minCost: 15001, maxCost: 50000, markupPercent: 3  },
  { minCost: 50001, maxCost: null,  markupPercent: 2  },
];

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
    activeProvider: s.activeProvider ?? 'vheeboost',
    roundingMode: s.roundingMode ?? 'ceil',
    userPricingTiers: cloneTiers(s.userPricingTiers),
    vendorPricingTiers: cloneTiers(s.vendorPricingTiers),
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

function PricingTiersTable({ tiers, label }) {
  const hasTiers = tiers && tiers.length > 0;
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="font-semibold text-gray-900">{label}</h3>
        <p className="mt-0.5 text-xs text-gray-400">
          {hasTiers ? 'Tiered pricing active.' : 'No tiers configured.'}
        </p>
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
        <div className="flex items-center justify-center py-10 text-sm text-gray-400">
          No pricing tiers configured.
        </div>
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
          <p className="text-lg font-bold capitalize text-gray-900">Social Growth</p>
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

      {settings.availableProviders?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-900">Available Providers</h3>
          <div className="flex flex-wrap gap-2">
            {settings.availableProviders.map((p) => (
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
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PricingTiersTable label="User Pricing Tiers" tiers={settings.userPricingTiers} />
        <PricingTiersTable label="Vendor Pricing Tiers" tiers={settings.vendorPricingTiers} />
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

    const sanitise = (tiers) =>
      tiers.map((t) => ({
        minCost: Number(t.minCost) || 0,
        maxCost: t.maxCost === '' || t.maxCost == null ? null : Number(t.maxCost),
        markupPercent: Number(t.markupPercent) || 0,
      }));

    const payload = {
      isEnabled: form.isEnabled,
      activeProvider: form.activeProvider,
      roundingMode: form.roundingMode,
      userPricingTiers: sanitise(form.userPricingTiers),
      vendorPricingTiers: sanitise(form.vendorPricingTiers),
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
      {/* General */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">General Settings</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              {(availableProviders ?? [{ name: 'vheeboost' }]).map((p) => (
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

      <div className="rounded-md bg-blue-50 px-4 py-3 text-xs text-blue-700">
        <strong>Tip:</strong> Leave Max Cost blank for the last tier to mean "no upper limit".
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

export default function SocialGrowthSettings() {
  const { settings, loading, error, refetch, update } = useSocialGrowthSettings();
  const [editing, setEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  async function handleSave(payload) {
    await update(payload);
    setEditing(false);
    setSuccessMsg('Social growth settings saved successfully.');
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Social Growth Settings</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Provider and pricing tiers for the social growth service.
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
