import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { apiClient } from '../lib/apiClient';

const LIMIT = 20;

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d) ? value : d.toLocaleString();
}

function TypeBadge({ type }) {
  const colours = {
    email:  'bg-blue-100 text-blue-700',
    push:   'bg-purple-100 text-purple-700',
    sms:    'bg-yellow-100 text-yellow-700',
    in_app: 'bg-green-100 text-green-700',
    both:   'bg-orange-100 text-orange-700',
    all:    'bg-orange-100 text-orange-700',
    system: 'bg-gray-100 text-gray-600',
  };
  const cls = colours[type?.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {type ?? '—'}
    </span>
  );
}

// ─── Create Notification Modal ───────────────────────────────────────────────

function CreateModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    target: 'user',
    userId: '',
    title: '',
    message: '',
    channel: 'in_app',
    priority: 'normal',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = {
        target: form.target,
        title: form.title.trim(),
        message: form.message.trim(),
        channel: form.channel,
        priority: form.priority,
      };
      if (form.target === 'user') body.userId = form.userId.trim();

      await apiClient.post('/api/v1/admin/notifications', body);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to send notification.');
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'w-full rounded-md bg-gray-100 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none ring-1 ring-transparent focus:bg-white focus:ring-orange-500';
  const selectCls =
    'w-full rounded-md bg-gray-100 px-3 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-transparent focus:bg-white focus:ring-orange-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Create Notification</h2>
        <p className="mb-5 text-sm text-gray-500">
          Send an in-app, push, or email notification to a user or all active users.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target */}
          <div>
            <label className="mb-1 block text-sm text-gray-700">
              Target <span className="text-orange-500">*</span>
            </label>
            <select
              value={form.target}
              onChange={(e) => set('target', e.target.value)}
              className={selectCls}
            >
              <option value="user">Single User</option>
              <option value="all">All Active Users</option>
            </select>
          </div>

          {/* User ID — only when target = user */}
          {form.target === 'user' && (
            <div>
              <label className="mb-1 block text-sm text-gray-700">
                User ID <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.userId}
                onChange={(e) => set('userId', e.target.value)}
                className={inputCls}
                placeholder="Paste the recipient's user ID"
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-1 block text-sm text-gray-700">
              Title <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className={inputCls}
              placeholder="e.g. Transaction Successful"
            />
          </div>

          {/* Message */}
          <div>
            <label className="mb-1 block text-sm text-gray-700">
              Message <span className="text-orange-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
              className={inputCls + ' resize-none'}
              placeholder="Notification body text…"
            />
          </div>

          {/* Channel + Priority side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-gray-700">Channel</label>
              <select
                value={form.channel}
                onChange={(e) => set('channel', e.target.value)}
                className={selectCls}
              >
                <option value="in_app">In-App</option>
                <option value="push">Push</option>
                <option value="email">Email</option>
                <option value="both">Both (push + email)</option>
                <option value="all">All channels</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                className={selectCls}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Email info hint */}
          {(form.channel === 'email' || form.channel === 'both' || form.channel === 'all') && (
            <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
              A branded BillXpress email with your orange theme will be sent to the recipient(s).
            </p>
          )}

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Filter bar ──────────────────────────────────────────────────────────────

function FilterBar({ onSearch }) {
  const [type, setType] = useState('');
  const [userId, setUserId] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onSearch({ type: type.trim(), userId: userId.trim() });
  }

  function handleClear() {
    setType('');
    setUserId('');
    onSearch({ type: '', userId: '' });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-5 flex flex-wrap gap-3">
      <input
        type="text"
        value={type}
        onChange={(e) => setType(e.target.value)}
        placeholder="Filter by type"
        className="w-44 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
      />
      <input
        type="text"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        placeholder="Filter by User ID"
        className="w-56 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
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

function Pagination({ meta, page, onPageChange }) {
  if (meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
      <p className="text-xs text-gray-400">
        Page {meta.page} of {meta.totalPages} &nbsp;·&nbsp; {meta.total} total
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
          disabled={page >= meta.totalPages}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Notifications() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ type: '', userId: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const { notifications, meta, loading, error, refetch } = useNotifications({
    page,
    limit: LIMIT,
    type: filters.type,
    userId: filters.userId,
  });

  function handleSearch(newFilters) {
    setFilters(newFilters);
    setPage(1);
  }

  function handleCreateSuccess() {
    setSuccessMsg('Notification sent successfully.');
    refetch();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Audit log of all notifications created or sent by the platform.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refetch}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => { setSuccessMsg(null); setShowCreate(true); }}
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            + Create Notification
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 flex items-center justify-between rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-4 text-green-500 hover:text-green-700">✕</button>
        </div>
      )}

      <FilterBar onSearch={handleSearch} />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            Loading notifications…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={refetch} className="text-sm text-orange-500 hover:underline">
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            No notifications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  {['Title', 'Message', 'Channel', 'Priority', 'User ID', 'Sent At'].map((h) => (
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
                {notifications.map((n) => (
                  <tr key={n.id ?? n._id} className="hover:bg-gray-50">
                    <td className="max-w-[160px] truncate px-4 py-3 font-medium text-gray-900">
                      {n.title ?? '—'}
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-gray-600">
                      <span className="block truncate" title={n.message ?? n.body ?? ''}>
                        {n.message ?? n.body ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={n.channel ?? n.type} />
                    </td>
                    <td className="px-4 py-3">
                      {n.priority ? (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          n.priority === 'high'   ? 'bg-red-100 text-red-700' :
                          n.priority === 'normal' ? 'bg-gray-100 text-gray-600' :
                                                    'bg-slate-100 text-slate-500'
                        }`}>
                          {n.priority}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {n.userId ?? n.user?.id ?? (n.target === 'all' ? 'All users' : '—')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {formatDate(n.createdAt ?? n.sentAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <Pagination meta={meta} page={page} onPageChange={setPage} />
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
