import { useMemo, useState } from 'react';
import { useDataPlans } from '../hooks/useDataPlans';

// ─── constants ────────────────────────────────────────────────────────────────

const NETWORK_COLORS = {
  MTN: 'bg-yellow-100 text-yellow-800',
  GLO: 'bg-green-100 text-green-700',
  AIRTEL: 'bg-red-100 text-red-700',
  '9MOBILE': 'bg-emerald-100 text-emerald-700',
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatNaira(value) {
  if (value == null) return '—';
  return `₦${Number(value).toLocaleString()}`;
}

function formatTierRange(tier) {
  if (!tier) return '—';
  const min = formatNaira(tier.minCost);
  const max = tier.maxCost == null ? '∞' : formatNaira(tier.maxCost);
  return `${min} – ${max}`;
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

function PricingModelBadge({ model }) {
  const cls = model === 'tiered' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {model ?? '—'}
    </span>
  );
}

function AvailabilityBadge({ available }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {available ? 'Available' : 'Unavailable'}
    </span>
  );
}

// ─── shared bits ─────────────────────────────────────────────────────────────

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function DataPlans() {
  const { data, loading, error, refetch } = useDataPlans();
  const [network, setNetwork] = useState('ALL');
  const [search, setSearch] = useState('');

  const networks = useMemo(() => {
    const set = new Set((data?.plans ?? []).map((p) => p.network).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [data]);

  const filteredPlans = useMemo(() => {
    let plans = data?.plans ?? [];
    if (network !== 'ALL') plans = plans.filter((p) => p.network === network);
    const q = search.trim().toLowerCase();
    if (q) {
      plans = plans.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.type?.toLowerCase().includes(q)
      );
    }
    return plans;
  }, [data, network, search]);

  const inputCls =
    'rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Data Plans</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Live plans and pricing from the active data provider.
          </p>
        </div>
        <button
          onClick={refetch}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 text-sm text-gray-400">Loading data plans…</div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-32">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={refetch} className="text-sm text-orange-500 hover:underline">Try again</button>
        </div>
      ) : !data ? null : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Provider" value={data.provider ?? '—'} />
            <StatCard label="Pricing Model" value={data.pricing?.appliedPricingModel ?? '—'} />
            <StatCard label="Rounding" value={data.pricing?.roundingMode ?? '—'} />
            <StatCard label="User Markup" value={`${data.pricing?.userMarkupPercent ?? 0}%`} />
            <StatCard label="Vendor Markup" value={`${data.pricing?.vendorMarkupPercent ?? 0}%`} />
            <StatCard label="Total Plans" value={data.count ?? data.plans?.length ?? 0} />
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {networks.map((n) => (
                <button
                  key={n}
                  onClick={() => setNetwork(n)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    network === n
                      ? 'bg-orange-500 text-white'
                      : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by bundle or type…"
              className={inputCls + ' w-64'}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {filteredPlans.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-sm text-gray-400">
                No plans found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      {['Network', 'Bundle', 'Type', 'Validity', 'Cost Price', 'Selling Price', 'Profit', 'Markup', 'Model', 'Tier Range', 'Status'].map((h) => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPlans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><NetworkBadge network={plan.network} /></td>
                        <td className="px-4 py-3 font-medium text-gray-900">{plan.name}</td>
                        <td className="px-4 py-3 text-gray-600">{plan.type ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{plan.validity ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{formatNaira(plan.costPrice)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{formatNaira(plan.sellingPrice)}</td>
                        <td className="px-4 py-3 font-semibold text-green-600">{formatNaira(plan.profit)}</td>
                        <td className="px-4 py-3 text-gray-600">{plan.markupPercent != null ? `${plan.markupPercent}%` : '—'}</td>
                        <td className="px-4 py-3"><PricingModelBadge model={plan.pricingModel} /></td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatTierRange(plan.pricingTier)}</td>
                        <td className="px-4 py-3"><AvailabilityBadge available={plan.available} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400">
                Showing {filteredPlans.length} of {data.plans?.length ?? 0} plans
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
