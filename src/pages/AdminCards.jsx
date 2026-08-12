import { useState } from 'react';
import { useAdminCards } from '../hooks/useAdminCards';

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  FROZEN: 'bg-blue-100 text-blue-700',
  FAILED: 'bg-red-100 text-red-600',
  TERMINATED: 'bg-gray-200 text-gray-600',
};

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status ?? '—'}
    </span>
  );
}

function BoolBadge({ value, trueLabel = 'Yes', falseLabel = 'No', trueStyle = 'bg-red-100 text-red-600', falseStyle = 'bg-gray-100 text-gray-500' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${value ? trueStyle : falseStyle}`}>
      {value ? trueLabel : falseLabel}
    </span>
  );
}

// ─── filter bar ──────────────────────────────────────────────────────────────

const STATUSES = ['', 'PENDING', 'ACTIVE', 'FROZEN', 'FAILED', 'TERMINATED'];

function FilterBar({ filters, onChange, onReset }) {
  const selectCls = 'rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500';
  const inputCls = 'rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        placeholder="Filter by user ID…"
        value={filters.userId}
        onChange={(e) => onChange('userId', e.target.value)}
        className={`${inputCls} w-44`}
      />
      <select value={filters.status} onChange={(e) => onChange('status', e.target.value)} className={selectCls}>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s || 'All statuses'}</option>
        ))}
      </select>
      <select value={filters.maintenancePastDue} onChange={(e) => onChange('maintenancePastDue', e.target.value)} className={selectCls}>
        <option value="">All maintenance</option>
        <option value="true">Past due</option>
        <option value="false">Up to date</option>
      </select>
      <select value={filters.limit} onChange={(e) => onChange('limit', e.target.value)} className={selectCls}>
        {[20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
      </select>
      <button onClick={onReset} className="text-sm text-gray-400 hover:text-gray-700">Reset</button>
    </div>
  );
}

// ─── card row ────────────────────────────────────────────────────────────────

function CardRow({ card }) {
  const owner = card.user ?? card.owner ?? {};
  const ownerName = owner.name ?? ([owner.firstName, owner.lastName].filter(Boolean).join(' ') || '—');

  const balance = card.balance;
  const balanceStr = balance != null
    ? (typeof balance === 'object'
        ? `$${Number(balance.amount ?? balance).toFixed(2)}`
        : `$${Number(balance).toFixed(2)}`)
    : '—';

  const maskedPan = card.maskedPan ?? card.last4 ?? '—';

  return (
    <tr className="hover:bg-gray-50">
      {/* Owner */}
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900">{ownerName}</p>
        <p className="text-xs text-gray-500">{owner.email ?? '—'}</p>
        <p className="text-xs text-gray-400">{owner.phone ?? owner.phoneNumber ?? ''}</p>
      </td>

      {/* Card identity */}
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-gray-900">{card.brand ?? '—'} {maskedPan !== '—' ? `•••• ${maskedPan}` : ''}</p>
        <p className="mt-0.5 text-xs text-gray-400 font-mono">BX: {card.id ?? '—'}</p>
        <p className="text-xs text-gray-400 font-mono">PR: {card.providerId ?? card.mapleradCardId ?? '—'}</p>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={card.status} />
      </td>

      {/* Balance */}
      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{balanceStr}</td>

      {/* Maintenance dates */}
      <td className="px-4 py-3">
        <p className="text-xs text-gray-500">Next: {fmtDate(card.nextMaintenanceDate)}</p>
        <p className="text-xs text-gray-500">Last: {fmtDate(card.lastMaintenanceDate)}</p>
        {card.gracePeriodDeadline && (
          <p className="text-xs font-medium text-amber-600">Grace: {fmtDate(card.gracePeriodDeadline)}</p>
        )}
      </td>

      {/* Maintenance status */}
      <td className="px-4 py-3">
        <BoolBadge
          value={card.maintenancePastDue ?? false}
          trueLabel="Past due"
          falseLabel="Up to date"
          trueStyle="bg-amber-100 text-amber-700"
          falseStyle="bg-green-100 text-green-700"
        />
        {card.frozenForMaintenance && (
          <p className="mt-1">
            <BoolBadge value trueLabel="Frozen (maint.)" trueStyle="bg-blue-100 text-blue-700" />
          </p>
        )}
      </td>

      {/* Latest failure */}
      <td className="px-4 py-3">
        {card.latestMaintenanceFailure ? (
          <p className="text-xs text-red-500 max-w-[160px]">{card.latestMaintenanceFailure}</p>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

const INIT_FILTERS = { status: '', userId: '', maintenancePastDue: '', limit: 20 };

export default function AdminCards() {
  const [filters, setFilters] = useState(INIT_FILTERS);
  const [page, setPage] = useState(1);

  const { cards, total, loading, error, refetch } = useAdminCards({
    page,
    limit: Number(filters.limit),
    status: filters.status,
    userId: filters.userId,
    maintenancePastDue: filters.maintenancePastDue,
  });

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function handleReset() {
    setFilters(INIT_FILTERS);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(total / Number(filters.limit)));

  const TABLE_HEADERS = ['Owner', 'Card', 'Status', 'Balance', 'Maintenance Dates', 'Maintenance Status', 'Latest Failure'];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Virtual Cards</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            All BillXpress virtual dollar cards with owner, status, and maintenance state.
          </p>
        </div>
        <button onClick={refetch} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          ↻ Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <FilterBar filters={filters} onChange={handleFilterChange} onReset={handleReset} />
      </div>

      {/* Summary */}
      {!loading && !error && (
        <p className="mb-3 text-sm text-gray-500">
          {total.toLocaleString()} card{total !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-32 text-sm text-gray-400">Loading cards…</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={refetch} className="text-sm text-orange-500 hover:underline">Try again</button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    {TABLE_HEADERS.map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cards.length === 0 ? (
                    <tr>
                      <td colSpan={TABLE_HEADERS.length} className="px-4 py-16 text-center text-sm text-gray-400">
                        No cards found.
                      </td>
                    </tr>
                  ) : (
                    cards.map((card) => <CardRow key={card.id} card={card} />)
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pageCount > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-500">Page {page} of {pageCount}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page === pageCount}
                    className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
