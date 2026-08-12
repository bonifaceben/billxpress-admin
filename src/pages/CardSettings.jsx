import { useState } from 'react';
import { useCardSettings } from '../hooks/useCardSettings';
import { useCardRates } from '../hooks/useCardRates';

// ─── constants ────────────────────────────────────────────────────────────────

const BRANDS = ['VISA', 'MASTERCARD'];

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtNGN(v) {
  return `₦${Number(v ?? 0).toLocaleString()}`;
}

function fmtUSD(v) {
  return `$${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtFee(fee, currency) {
  if (!fee) return '—';
  const parts = [];
  if (Number(fee.percent) > 0) parts.push(`${fee.percent}%`);
  if (Number(fee.flat) > 0) parts.push(currency === 'USD' ? fmtUSD(fee.flat) : fmtNGN(fee.flat));
  return parts.length ? parts.join(' + ') : '0';
}

function cloneFee(f, defaults = {}) {
  return {
    percent:              f?.percent              ?? defaults.percent              ?? 0,
    flat:                 f?.flat                 ?? defaults.flat                 ?? 0,
    thresholdAmount:      f?.thresholdAmount      ?? defaults.thresholdAmount      ?? 0,
    belowThresholdFlat:   f?.belowThresholdFlat   ?? defaults.belowThresholdFlat   ?? 0,
    aboveThresholdPercent: f?.aboveThresholdPercent ?? defaults.aboveThresholdPercent ?? 0,
  };
}

function settingsToForm(s) {
  return {
    isEnabled:      s.isEnabled      ?? true,
    allowedBrands:  s.allowedBrands  ?? ['VISA', 'MASTERCARD'],
    defaultBrand:   s.defaultBrand   ?? 'VISA',

    // Card creation (USD) — BillXpress charges $3, provider costs $2
    creationFeeUsd:      cloneFee(s.creationFeeUsd,      { flat: 3 }),
    providerCreationFee: cloneFee(s.providerCreationFee, { flat: 2 }),

    // Card funding — customer: ₦2,000 below ₦100,000 then 3% (provider fee is read-only, not sent in PATCH)
    fundingFee: cloneFee(s.fundingFee, {
      thresholdAmount:       100000,
      belowThresholdFlat:    2000,
      aboveThresholdPercent: 3,
    }),

    // Card withdrawal — customer charge only (NGN)
    withdrawalFee: cloneFee(s.withdrawalFee, { flat: 2000 }),

    // Incident fees — customer charge only (provider inputs removed from admin form)
    crossBorderFee: cloneFee(s.crossBorderFee),
    chargebackFee:  cloneFee(s.chargebackFee),
    declineFee:     cloneFee(s.declineFee),

    fundingExchangeMarkupPercent:    s.fundingExchangeMarkupPercent    ?? 0,
    withdrawalExchangeMarkupPercent: s.withdrawalExchangeMarkupPercent ?? 0,
    monthlyMaintenanceFee:           s.monthlyMaintenanceFee           ?? 0,
    maintenanceGracePeriodDays:      s.maintenanceGracePeriodDays      ?? 3,
    freezeOnMaintenanceFailure:      s.freezeOnMaintenanceFailure      ?? true,
    minimumFundingAmount:            s.minimumFundingAmount            ?? 1000,
    maximumFundingAmount:            s.maximumFundingAmount            ?? 1000000,
    minimumWithdrawalAmount:         s.minimumWithdrawalAmount         ?? 1,
    quoteTtlSeconds:                 s.quoteTtlSeconds                 ?? 300,
  };
}

// ─── live rates panel ────────────────────────────────────────────────────────

function LiveRatesPanel() {
  const { rates, loading, error, refetch } = useCardRates({ amountNgn: 10000, amountUsd: 10 });

  function fmtTs(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString();
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-blue-900">Live Exchange Rates</h3>
          <p className="mt-0.5 text-xs text-blue-600">
            Provider rates change at any time. Rates shown here are admin-only — customers see only the effective rate.
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Fetching…' : '↻ Refresh live rate'}
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {!rates && !loading && !error && (
        <p className="text-sm text-blue-500">Click "Refresh live rate" to fetch the current Maplerad rate.</p>
      )}

      {rates && (
        <div className="space-y-4">
          <p className="text-xs text-blue-500">Fetched at: {fmtTs(rates.fetchedAt)}</p>

          {/* Funding rate */}
          {rates.funding && (
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Funding — NGN → USD (example: ₦{rates.funding.input?.amount?.toLocaleString()})
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-400">Provider Rate</p>
                  <p className="mt-0.5 text-sm font-bold text-gray-900">{rates.funding.providerRate?.display ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Configured Markup</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">
                    {rates.funding.configuredMarkup?.percent ?? 0}%
                    {rates.funding.configuredMarkup?.amountNgn != null && (
                      <span className="ml-1 text-xs font-normal text-gray-500">
                        (₦{Number(rates.funding.configuredMarkup.amountNgn).toLocaleString()})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Effective Customer Rate</p>
                  <p className="mt-0.5 text-sm font-bold text-orange-600">{rates.funding.effectiveCustomerRate?.display ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Output (before fees)</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">
                    {rates.funding.outputBeforeCharges?.amount != null
                      ? `$${Number(rates.funding.outputBeforeCharges.amount).toFixed(2)}`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Withdrawal rate */}
          {rates.withdrawal && (
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Withdrawal — USD → NGN (example: ${rates.withdrawal.input?.amount})
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-400">Provider Rate</p>
                  <p className="mt-0.5 text-sm font-bold text-gray-900">{rates.withdrawal.providerRate?.display ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Configured Markup</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">
                    {rates.withdrawal.configuredMarkup?.percent ?? 0}%
                    {rates.withdrawal.configuredMarkup?.amountUsd != null && (
                      <span className="ml-1 text-xs font-normal text-gray-500">
                        (${rates.withdrawal.configuredMarkup.amountUsd})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Effective Customer Rate</p>
                  <p className="mt-0.5 text-sm font-bold text-orange-600">{rates.withdrawal.effectiveCustomerRate?.display ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Output (before fees)</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">
                    {rates.withdrawal.outputBeforeCharges?.amount != null
                      ? `₦${Number(rates.withdrawal.outputBeforeCharges.amount).toLocaleString()}`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── view sub-components ─────────────────────────────────────────────────────

function StatCard({ label, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      {children}
    </div>
  );
}

function FeeTable({ title, note, rows }) {
  const hasThreshold = rows.some(({ fee }) =>
    Number(fee?.thresholdAmount) > 0 || Number(fee?.belowThresholdFlat) > 0 || Number(fee?.aboveThresholdPercent) > 0
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {note && <p className="mt-0.5 text-xs text-gray-400">{note}</p>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Fee Type</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Percent</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Flat</th>
              {hasThreshold && <>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Threshold</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Below (flat)</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Above (%)</th>
              </>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ label, fee, currency }) => (
              <tr key={label} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">{label}</td>
                <td className="px-5 py-3 text-gray-600">{Number(fee?.percent ?? 0)}%</td>
                <td className="px-5 py-3 font-semibold text-gray-900">
                  {currency === 'USD' ? fmtUSD(fee?.flat) : fmtNGN(fee?.flat)}
                </td>
                {hasThreshold && <>
                  <td className="px-5 py-3 text-gray-600">
                    {Number(fee?.thresholdAmount) > 0 ? (currency === 'USD' ? fmtUSD(fee.thresholdAmount) : fmtNGN(fee.thresholdAmount)) : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {Number(fee?.belowThresholdFlat) > 0 ? (currency === 'USD' ? fmtUSD(fee.belowThresholdFlat) : fmtNGN(fee.belowThresholdFlat)) : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {Number(fee?.aboveThresholdPercent) > 0 ? `${fee.aboveThresholdPercent}%` : '—'}
                  </td>
                </>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── view mode ────────────────────────────────────────────────────────────────

function ViewMode({ settings, onEdit }) {
  return (
    <div className="space-y-6">
      {/* General */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Status">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
            settings.isEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            {settings.isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </StatCard>

        <StatCard label="Default Brand">
          <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
            {settings.defaultBrand ?? '—'}
          </span>
        </StatCard>

        <StatCard label="Allowed Brands">
          <div className="flex flex-wrap gap-1">
            {(settings.allowedBrands ?? []).map((b) => (
              <span key={b} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                {b}
              </span>
            ))}
          </div>
        </StatCard>

        <StatCard label="Quote TTL">
          <p className="text-lg font-bold text-gray-900">{settings.quoteTtlSeconds ?? 0}s</p>
        </StatCard>
      </div>

      {/* Card creation fees — USD */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
        <h3 className="mb-1 font-semibold text-blue-900">Card Creation Fees (USD)</h3>
        <p className="mb-4 text-xs text-blue-600">
          Both values are in USD and converted to NGN using a fresh Maplerad rate at quote time.
          Card creation does not fund the card automatically — funding fees below apply separately.
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">BillXpress Card Creation Fee</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400">Percent</p>
                <p className="mt-0.5 text-lg font-bold text-gray-900">{settings.creationFeeUsd?.percent ?? 0}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Flat (USD)</p>
                <p className="mt-0.5 text-lg font-bold text-gray-900">${settings.creationFeeUsd?.flat ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Provider Card Creation Cost</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400">Percent</p>
                <p className="mt-0.5 text-lg font-bold text-gray-900">{settings.providerCreationFee?.percent ?? 0}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Flat (USD)</p>
                <p className="mt-0.5 text-lg font-bold text-gray-900">${settings.providerCreationFee?.flat ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Funding / withdrawal fees */}
      <FeeTable
        title="Customer Charge — Funding &amp; Withdrawal (NGN)"
        note="What the customer pays. Funding uses tiered billing — e.g. ₦2,000 below ₦100,000 then 3% above. Withdrawal is a fixed flat fee."
        rows={[
          { label: 'Funding', fee: settings.fundingFee, currency: 'NGN' },
          { label: 'Withdrawal', fee: settings.withdrawalFee, currency: 'NGN' },
        ]}
      />

      {/* Incident fees */}
      <FeeTable
        title="Incident Fees — Customer Charge"
        note="Amounts BillXpress bills the customer for cross-border transactions, chargebacks, and declines."
        rows={[
          { label: 'Cross-border', fee: settings.crossBorderFee, currency: 'USD' },
          { label: 'Chargeback', fee: settings.chargebackFee, currency: 'USD' },
          { label: 'Decline', fee: settings.declineFee, currency: 'USD' },
        ]}
      />

      {/* Live rates */}
      <LiveRatesPanel />

      {/* Exchange & Maintenance */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="font-semibold text-gray-900">Exchange &amp; Maintenance</h3>
          <p className="text-xs text-gray-400">Maintenance fee is USD, converted at the current Maplerad rate.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Funding Exchange Markup</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{settings.fundingExchangeMarkupPercent ?? 0}%</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Withdrawal Exchange Markup</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{settings.withdrawalExchangeMarkupPercent ?? 0}%</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Monthly Maintenance Fee</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{fmtUSD(settings.monthlyMaintenanceFee)} USD</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Grace Period</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{settings.maintenanceGracePeriodDays ?? 0} days</p>
            <p className="mt-0.5 text-xs text-gray-400">Days overdue before freeze</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Freeze on Failure</p>
            <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              settings.freezeOnMaintenanceFailure ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {settings.freezeOnMaintenanceFailure ? 'Yes (recommended)' : 'No (disabled)'}
            </span>
          </div>
        </div>
      </div>

      {/* Limits */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="font-semibold text-gray-900">Card Funding Limits</h3>
          <p className="text-xs text-gray-400">These limits apply to card funding only — not card creation.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Min Funding', value: fmtNGN(settings.minimumFundingAmount) },
            { label: 'Max Funding', value: fmtNGN(settings.maximumFundingAmount) },
            { label: 'Min Withdrawal', value: String(settings.minimumWithdrawalAmount ?? 0) },
            { label: 'Quote TTL', value: `${settings.quoteTtlSeconds ?? 0} sec` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Metadata */}
      {(settings.updatedAt || settings.updatedBy) && (
        <p className="text-xs text-gray-400">
          {settings.updatedAt && <>Last updated: {new Date(settings.updatedAt).toLocaleString()}</>}
          {settings.updatedBy && <> · by {settings.updatedBy}</>}
        </p>
      )}

      <div className="flex justify-end">
        <button onClick={onEdit} className="rounded-md bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">
          Edit Settings
        </button>
      </div>
    </div>
  );
}

// ─── edit mode ────────────────────────────────────────────────────────────────

function FeeEditor({ label, value, onChange, currency }) {
  const sym = currency === 'USD' ? '$' : '₦';
  const ic = 'w-full rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-900 outline-none focus:bg-white focus:ring-1 focus:ring-orange-500';

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <p className="mb-3 text-sm font-medium text-gray-700">{label}</p>

      {/* Base fee */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Percent (%)</label>
          <input type="number" min="0" step="0.01" value={value.percent}
            onChange={(e) => onChange({ ...value, percent: e.target.value })} className={ic} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Flat ({sym})</label>
          <input type="number" min="0" step="0.01" value={value.flat}
            onChange={(e) => onChange({ ...value, flat: e.target.value })} className={ic} />
        </div>
      </div>

      {/* Tiered threshold */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Tiered threshold <span className="ml-1 font-normal normal-case">(set to 0 to disable)</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Threshold ({sym})</label>
            <input type="number" min="0" step="0.01" value={value.thresholdAmount}
              onChange={(e) => onChange({ ...value, thresholdAmount: e.target.value })} className={ic} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Below flat ({sym})</label>
            <input type="number" min="0" step="0.01" value={value.belowThresholdFlat}
              onChange={(e) => onChange({ ...value, belowThresholdFlat: e.target.value })} className={ic} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Above (%)</label>
            <input type="number" min="0" step="0.01" value={value.aboveThresholdPercent}
              onChange={(e) => onChange({ ...value, aboveThresholdPercent: e.target.value })} className={ic} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EditMode({ initialForm, onSave, onCancel }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleBrand(brand, checked) {
    set('allowedBrands', checked
      ? [...form.allowedBrands, brand]
      : form.allowedBrands.filter((b) => b !== brand)
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const numFee = (f) => ({
      percent: Number(f.percent) || 0,
      flat: Number(f.flat) || 0,
      thresholdAmount: Number(f.thresholdAmount) || 0,
      belowThresholdFlat: Number(f.belowThresholdFlat) || 0,
      aboveThresholdPercent: Number(f.aboveThresholdPercent) || 0,
    });

    const payload = {
      isEnabled: form.isEnabled,
      allowedBrands: form.allowedBrands,
      defaultBrand: form.defaultBrand,
      providerCreationFee: numFee(form.providerCreationFee),
      creationFeeUsd: numFee(form.creationFeeUsd),
      fundingFee: numFee(form.fundingFee),
      withdrawalFee: numFee(form.withdrawalFee),
      crossBorderFee: numFee(form.crossBorderFee),
      chargebackFee: numFee(form.chargebackFee),
      declineFee: numFee(form.declineFee),
      fundingExchangeMarkupPercent: Number(form.fundingExchangeMarkupPercent) || 0,
      withdrawalExchangeMarkupPercent: Number(form.withdrawalExchangeMarkupPercent) || 0,
      monthlyMaintenanceFee: Number(form.monthlyMaintenanceFee) || 0,
      maintenanceGracePeriodDays: Number(form.maintenanceGracePeriodDays) || 0,
      freezeOnMaintenanceFailure: form.freezeOnMaintenanceFailure,
      minimumFundingAmount: Number(form.minimumFundingAmount) || 0,
      maximumFundingAmount: Number(form.maximumFundingAmount) || 0,
      minimumWithdrawalAmount: Number(form.minimumWithdrawalAmount) || 0,
      quoteTtlSeconds: Number(form.quoteTtlSeconds) || 300,
    };

    try {
      await onSave(payload);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to save settings.');
      setSaving(false);
    }
  }

  const inputCls = 'w-full rounded-md bg-gray-100 px-3 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-transparent focus:bg-white focus:ring-orange-500';
  const panelCls = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
      )}

      {/* General */}
      <div className={panelCls}>
        <h3 className="mb-4 font-semibold text-gray-900">General</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-gray-700">Service Status</label>
            <select value={form.isEnabled ? 'true' : 'false'} onChange={(e) => set('isEnabled', e.target.value === 'true')} className={inputCls}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700">Default Brand</label>
            <select value={form.defaultBrand} onChange={(e) => set('defaultBrand', e.target.value)} className={inputCls}>
              {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700">Allowed Brands</label>
            <div className="flex gap-4 pt-2">
              {BRANDS.map((b) => (
                <label key={b} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allowedBrands.includes(b)}
                    onChange={(e) => toggleBrand(b, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 accent-orange-500"
                  />
                  {b}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Card creation fees (USD) */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
        <h3 className="mb-1 font-semibold text-blue-900">Card Creation Fees (USD)</h3>
        <p className="mb-4 text-xs text-blue-600">
          Both values are in USD. The backend converts them to NGN using a fresh Maplerad rate at quote time (e.g. $3 at 1 USD = ₦1,500 → ₦4,500).
          Card creation does not fund the card automatically.
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FeeEditor label="BillXpress card creation fee (USD)" value={form.creationFeeUsd} onChange={(v) => set('creationFeeUsd', v)} currency="USD" />
          <FeeEditor label="Provider card creation cost (USD)" value={form.providerCreationFee} onChange={(v) => set('providerCreationFee', v)} currency="USD" />
        </div>
      </div>

      {/* Card funding fee */}
      <div className={panelCls}>
        <h3 className="mb-1 font-semibold text-gray-900">Card Funding Fee</h3>
        <p className="mb-1 text-xs text-gray-400">
          Applies only when funding an <strong>existing card</strong> — not at card creation.
        </p>
        <div className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <strong>fundingFee = total amount charged to the customer (NGN).</strong>{' '}
          Use the tiered threshold for split billing — e.g. ₦2,000 flat below ₦100,000 then 3% above.
          Set thresholdAmount to 0 to use a simple percent + flat fee instead.
        </div>
        <FeeEditor
          label="Customer funding charge (NGN)"
          value={form.fundingFee}
          onChange={(v) => set('fundingFee', v)}
          currency="NGN"
        />
      </div>

      {/* Card withdrawal fee */}
      <div className={panelCls}>
        <h3 className="mb-1 font-semibold text-gray-900">Card Withdrawal Fee</h3>
        <p className="mb-4 text-xs text-gray-400">
          Customer charge for withdrawing from a card (NGN). For a fixed fee set percent to 0 and enter the flat amount.
        </p>
        <FeeEditor
          label="Customer withdrawal charge (NGN)"
          value={form.withdrawalFee}
          onChange={(v) => set('withdrawalFee', v)}
          currency="NGN"
        />
      </div>

      {/* Incident fees */}
      <div className={panelCls}>
        <h3 className="mb-1 font-semibold text-gray-900">Incident Fees</h3>
        <p className="mb-4 text-xs text-gray-400">
          Customer charge for cross-border transactions, chargebacks, and declines. These are the exact amounts BillXpress bills the user.
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <FeeEditor label="Cross-border fee" value={form.crossBorderFee} onChange={(v) => set('crossBorderFee', v)} currency="USD" />
          <FeeEditor label="Chargeback fee" value={form.chargebackFee} onChange={(v) => set('chargebackFee', v)} currency="USD" />
          <FeeEditor label="Decline fee" value={form.declineFee} onChange={(v) => set('declineFee', v)} currency="USD" />
        </div>
      </div>

      {/* Exchange & Maintenance */}
      <div className={panelCls}>
        <h3 className="mb-1 font-semibold text-gray-900">Exchange &amp; Maintenance</h3>
        <p className="mb-4 text-xs text-gray-400">
          Exchange markups are entered as normal percentages (e.g. 1 = 1%). The monthly maintenance fee is in USD and converted at the current Maplerad rate.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-gray-700">Funding Exchange Markup (%)</label>
            <input type="number" min="0" step="0.01" value={form.fundingExchangeMarkupPercent} onChange={(e) => set('fundingExchangeMarkupPercent', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Withdrawal Exchange Markup (%)</label>
            <input type="number" min="0" step="0.01" value={form.withdrawalExchangeMarkupPercent} onChange={(e) => set('withdrawalExchangeMarkupPercent', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Monthly Maintenance Fee (USD)</label>
            <input type="number" min="0" step="0.01" value={form.monthlyMaintenanceFee} onChange={(e) => set('monthlyMaintenanceFee', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Grace Period (days)</label>
            <p className="mb-1.5 text-xs text-gray-400">Overdue card stays usable for this many days before being frozen.</p>
            <input type="number" min="0" value={form.maintenanceGracePeriodDays} onChange={(e) => set('maintenanceGracePeriodDays', e.target.value)} className={inputCls} />
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="mb-1 block text-sm text-gray-700">Freeze on Maintenance Failure</label>
            <p className="mb-1.5 text-xs text-gray-400">
              Should normally remain <strong>Yes</strong>. The backend uses Maplerad freeze/unfreeze — the same card is restored after payment. Cards are never terminated for maintenance debt.
            </p>
            <select value={form.freezeOnMaintenanceFailure ? 'true' : 'false'} onChange={(e) => set('freezeOnMaintenanceFailure', e.target.value === 'true')} className={inputCls}>
              <option value="true">Yes — freeze card until payment</option>
              <option value="false">No — keep card active (not recommended)</option>
            </select>
            {!form.freezeOnMaintenanceFailure && (
              <p className="mt-1.5 text-xs font-medium text-amber-600">
                Warning: disabling this allows cards with unpaid maintenance to remain active.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Limits */}
      <div className={panelCls}>
        <h3 className="mb-1 font-semibold text-gray-900">Card Funding Limits</h3>
        <p className="mb-4 text-xs text-gray-400">These limits apply to card funding only — not card creation.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm text-gray-700">Min Funding Amount (NGN)</label>
            <input type="number" min="0" value={form.minimumFundingAmount} onChange={(e) => set('minimumFundingAmount', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Max Funding Amount (NGN)</label>
            <input type="number" min="0" value={form.maximumFundingAmount} onChange={(e) => set('maximumFundingAmount', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Min Withdrawal Amount</label>
            <input type="number" min="0" step="0.01" value={form.minimumWithdrawalAmount} onChange={(e) => set('minimumWithdrawalAmount', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Quote TTL (seconds)</label>
            <input type="number" min="0" value={form.quoteTtlSeconds} onChange={(e) => set('quoteTtlSeconds', e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

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

export default function CardSettings() {
  const { settings, loading, error, refetch, update } = useCardSettings();
  const [editing, setEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  async function handleSave(payload) {
    await update(payload);
    setEditing(false);
    setSuccessMsg('Card settings saved successfully.');
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Card Settings</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Virtual card fees, exchange markups, maintenance rules, and funding limits.
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
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <ViewMode settings={settings} onEdit={() => { setSuccessMsg(null); setEditing(true); }} />
      )}
    </div>
  );
}
