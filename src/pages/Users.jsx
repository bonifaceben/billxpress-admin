import { useState } from 'react';
import { adjustUserWallet, useUsers } from '../hooks/useUsers';

const INITIAL_FILTERS = { search: '', role: '', status: '', authTier: '', limit: 20 };

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(value, currency = 'NGN') {
  if (value == null) return '—';
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
}

function Badge({ children, className }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${className}`}>{children}</span>;
}

function UserRow({ user, onAdjustWallet }) {
  const firstName = user.firstName ?? user.first_name;
  const lastName = user.lastName ?? user.last_name;
  const name = [firstName, lastName].filter(Boolean).join(' ') || user.name || '—';
  const status = user.status?.toLowerCase()
    ?? (typeof user.isActive === 'boolean' ? (user.isActive ? 'active' : 'inactive') : '—');
  const authTier = user.authTier ?? user.auth_tier;
  const wallet = user.wallet ?? {};
  const mainBalance = wallet.mainBalance ?? wallet.balances?.main;
  const referralBalance = wallet.referralBalance ?? wallet.balances?.referral;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-400">{user.username ? `@${user.username}` : '—'}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-gray-700">{user.email ?? '—'}</p>
        <p className="text-xs text-gray-400">{user.phone ?? user.phoneNumber ?? '—'}</p>
      </td>
      <td className="px-4 py-3"><Badge className="bg-blue-50 text-blue-700">{user.role ?? 'user'}</Badge></td>
      <td className="px-4 py-3">
        <Badge className={status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>{status}</Badge>
      </td>
      <td className="px-4 py-3 capitalize text-gray-600">{authTier?.replace('_', ' ') ?? '—'}</td>
      <td className="whitespace-nowrap px-4 py-3 text-gray-500">{formatDate(user.createdAt ?? user.created_at)}</td>
      <td className="whitespace-nowrap px-4 py-3">
        <p className="font-semibold text-gray-900">{formatCurrency(mainBalance, wallet.currency)}</p>
        <p className="mt-0.5 text-xs text-gray-400">Referral: {formatCurrency(referralBalance, wallet.currency)}</p>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex gap-2">
          <button onClick={() => onAdjustWallet(user, 'credit')} className="rounded-md bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100">Credit</button>
          <button onClick={() => onAdjustWallet(user, 'debit')} className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100">Debit</button>
        </div>
      </td>
    </tr>
  );
}

function WalletDialog({ adjustment, onClose, onSuccess }) {
  const operation = adjustment.operation;
  const user = adjustment.user;
  const name = [user.firstName ?? user.first_name, user.lastName ?? user.last_name]
    .filter(Boolean).join(' ') || user.name || user.email || 'this user';
  const [amount, setAmount] = useState('');
  const [walletType, setWalletType] = useState('main');
  const [reason, setReason] = useState(`Admin manual wallet ${operation}`);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const numericAmount = Number(amount);
    const userId = user.id ?? user._id;

    if (!userId) {
      setError('This user has no valid ID.');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (!reason.trim()) {
      setError('Enter a reason for this wallet adjustment.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await adjustUserWallet(userId, operation, {
        amount: numericAmount,
        walletType,
        reason: reason.trim(),
      });
      onSuccess(`${name}'s ${walletType} wallet was ${operation === 'credit' ? 'credited' : 'debited'} successfully.`);
    } catch (requestError) {
      setError(requestError?.response?.data?.message ?? requestError.message ?? `Failed to ${operation} wallet.`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="wallet-dialog-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5">
          <h2 id="wallet-dialog-title" className="text-lg font-semibold capitalize text-gray-900">{operation} user wallet</h2>
          <p className="mt-1 text-sm text-gray-500">{name} · {user.email ?? user.username ?? 'User account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Wallet</span>
            <select value={walletType} onChange={(event) => setWalletType(event.target.value)} disabled={submitting} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400">
              <option value="main">Main wallet</option>
              <option value="referral">Referral wallet</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Amount</span>
            <input type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={submitting} autoFocus placeholder="1000" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Reason</span>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} disabled={submitting} rows="3" className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400" />
          </label>

          {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {operation === 'debit' && <p className="text-xs text-amber-700">The debit will fail if the selected wallet has insufficient funds.</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={submitting} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={submitting} className={`rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${operation === 'credit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
              {submitting ? 'Processing…' : `Confirm ${operation}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Users() {
  const [draft, setDraft] = useState(INITIAL_FILTERS);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [adjustment, setAdjustment] = useState(null);
  const [success, setSuccess] = useState('');
  const { users, pagination, loading, error, refetch } = useUsers({ page, ...filters, limit: Number(filters.limit) });

  function submitFilters(event) {
    event.preventDefault();
    setFilters({ ...draft, search: draft.search.trim() });
    setPage(1);
  }

  function resetFilters() {
    setDraft(INITIAL_FILTERS);
    setFilters(INITIAL_FILTERS);
    setPage(1);
  }

  async function handleAdjustmentSuccess(message) {
    setAdjustment(null);
    setSuccess(message);
    await refetch();
  }

  const inputClass = 'rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-0.5 text-sm text-gray-500">Search and review all BillXpress accounts.</p>
        </div>
        <button onClick={refetch} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Refresh</button>
      </div>

      <form onSubmit={submitFilters} className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <input
          value={draft.search}
          onChange={(event) => setDraft((value) => ({ ...value, search: event.target.value }))}
          placeholder="Name, username, email, or phone"
          className={`${inputClass} min-w-64 flex-1`}
        />
        {[
          ['role', 'All roles', ['user', 'vendor', 'admin']],
          ['status', 'All statuses', ['active', 'inactive']],
          ['authTier', 'All auth tiers', ['tier_1', 'tier_2', 'tier_3']],
        ].map(([key, label, options]) => (
          <select key={key} value={draft[key]} onChange={(event) => setDraft((value) => ({ ...value, [key]: event.target.value }))} className={inputClass}>
            <option value="">{label}</option>
            {options.map((option) => <option key={option} value={option}>{option.replace('_', ' ')}</option>)}
          </select>
        ))}
        <select value={draft.limit} onChange={(event) => setDraft((value) => ({ ...value, limit: Number(event.target.value) }))} className={inputClass}>
          {[20, 50, 100].map((limit) => <option key={limit} value={limit}>{limit} / page</option>)}
        </select>
        <button type="submit" className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">Search</button>
        <button type="button" onClick={resetFilters} className="px-2 py-2 text-sm text-gray-400 hover:text-gray-700">Reset</button>
      </form>

      {success && (
        <div role="status" className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="font-semibold text-green-800" aria-label="Dismiss notification">×</button>
        </div>
      )}

      {!loading && !error && <p className="mb-3 text-sm text-gray-500">{pagination.total.toLocaleString()} user{pagination.total !== 1 ? 's' : ''} found</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-24 text-center text-sm text-gray-400">Loading users…</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-24"><p className="text-sm text-red-600">{error}</p><button onClick={refetch} className="text-sm text-orange-500 hover:underline">Try again</button></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50"><tr>
                  {['User', 'Contact', 'Role', 'Status', 'Auth tier', 'Joined', 'Wallet balance', 'Wallet actions'].map((heading) => <th key={heading} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{heading}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {users.length ? users.map((user) => <UserRow key={user.id ?? user._id ?? user.email} user={user} onAdjustWallet={(selectedUser, operation) => { setSuccess(''); setAdjustment({ user: selectedUser, operation }); }} />) : <tr><td colSpan="8" className="px-4 py-16 text-center text-gray-400">No users found.</td></tr>}
                </tbody>
              </table>
            </div>
            {pagination.pages > 1 && <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-500">Page {pagination.page} of {pagination.pages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
                <button onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} disabled={page >= pagination.pages} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
              </div>
            </div>}
          </>
        )}
      </div>

      {adjustment && <WalletDialog adjustment={adjustment} onClose={() => setAdjustment(null)} onSuccess={handleAdjustmentSuccess} />}
    </div>
  );
}
