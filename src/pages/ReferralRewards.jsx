import { useState } from 'react';
import { useReferralRewards } from '../hooks/useReferralRewards';

const LIMIT = 20;

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d) ? value : d.toLocaleString();
}

function formatNaira(amount) {
  if (amount == null) return '—';
  return `₦${Number(amount).toLocaleString()}`;
}

function StatusBadge({ status }) {
  const map = {
    successful:  'bg-green-100 text-green-700',
    processing:  'bg-yellow-100 text-yellow-700',
    failed:      'bg-red-100 text-red-700',
  };
  const cls = map[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-500';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status ?? '—'}
    </span>
  );
}

function UserCell({ user }) {
  if (!user) return <span className="text-gray-400">—</span>;
  return (
    <div>
      <p className="font-medium text-gray-900">
        {user.firstName} {user.lastName}
      </p>
      <p className="text-xs text-gray-400">@{user.username}</p>
    </div>
  );
}

// ─── Settings summary ─────────────────────────────────────────────────────────

function SettingsCards({ settings }) {
  if (!settings) return null;
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-gray-500">First Deposit Reward</p>
        <p className="mt-1 text-2xl font-bold text-orange-500">
          {settings.firstDepositRewardPercent}%
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-gray-500">Min. Redeem Amount</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          {formatNaira(settings.minimumRedeemAmount)}
        </p>
      </div>
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({ onSearch }) {
  const [status, setStatus] = useState('');
  const [referrerId, setReferrerId] = useState('');
  const [referredUserId, setReferredUserId] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onSearch({ status, referrerId: referrerId.trim(), referredUserId: referredUserId.trim() });
  }

  function handleClear() {
    setStatus('');
    setReferrerId('');
    setReferredUserId('');
    onSearch({ status: '', referrerId: '', referredUserId: '' });
  }

  const inputCls =
    'rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400';

  return (
    <form onSubmit={handleSubmit} className="mb-5 flex flex-wrap gap-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className={inputCls + ' w-44'}
      >
        <option value="">All statuses</option>
        <option value="successful">Successful</option>
        <option value="processing">Processing</option>
        <option value="failed">Failed</option>
      </select>

      <input
        type="text"
        value={referrerId}
        onChange={(e) => setReferrerId(e.target.value)}
        placeholder="Referrer ID"
        className={inputCls + ' w-48'}
      />

      <input
        type="text"
        value={referredUserId}
        onChange={(e) => setReferredUserId(e.target.value)}
        placeholder="Referred User ID"
        className={inputCls + ' w-48'}
      />

      <button
        type="submit"
        className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
      >
        Search
      </button>
      <button
        type="button"
        onClick={handleClear}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
      >
        Clear
      </button>
    </form>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ pagination, page, onPageChange }) {
  if (pagination.pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
      <p className="text-xs text-gray-400">
        Page {pagination.page} of {pagination.pages} &nbsp;·&nbsp; {pagination.total} total
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          ← Prev
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pagination.pages}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReferralRewards() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', referrerId: '', referredUserId: '' });

  const { rewards, pagination, settings, loading, error, refetch } = useReferralRewards({
    page,
    limit: LIMIT,
    ...filters,
  });

  function handleSearch(newFilters) {
    setFilters(newFilters);
    setPage(1);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Referral Rewards</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Audit referral payouts — who earned from whose first deposit.
          </p>
        </div>
        <button
          onClick={refetch}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          ↻ Refresh
        </button>
      </div>

      <SettingsCards settings={settings} />

      <FilterBar onSearch={handleSearch} />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            Loading referral rewards…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={refetch} className="text-sm text-orange-500 hover:underline">
              Try again
            </button>
          </div>
        ) : rewards.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            No referral rewards found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  {['Referrer', 'Referred User', 'Trigger', 'Qualifying Amt', 'Reward %', 'Reward Amt', 'Status', 'Date'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rewards.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <UserCell user={r.referrer} />
                    </td>
                    <td className="px-4 py-3">
                      <UserCell user={r.referredUser} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {r.trigger ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatNaira(r.qualifyingAmount)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.rewardPercent != null ? `${r.rewardPercent}%` : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-orange-600">
                      {formatNaira(r.rewardAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {formatDate(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <Pagination pagination={pagination} page={page} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
