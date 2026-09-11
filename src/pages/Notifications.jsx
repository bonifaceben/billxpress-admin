import ResponsiveTable from '../components/ResponsiveTable';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '../hooks/useNotifications';
import { apiClient } from '../lib/apiClient';
import NotificationUserSearch from '../components/NotificationUserSearch';

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
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  const [form, setForm] = useState({
    target: 'user',
    userId: '',
    title: '',
    message: '',
    channel: 'in_app',
    priority: 'normal',
    expiresIn: 'never',
    expiresAt: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (form.target === 'user' && !form.userId) {
      setError('Search for and select a recipient before sending.');
      return;
    }
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
      if (form.expiresIn === 'custom') {
        const expiry = new Date(form.expiresAt);
        if (!form.expiresAt || Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) {
          setError('Choose a valid future expiry date and time.');
          return;
        }
        body.expiresAt = expiry.toISOString();
      } else {
        body.expiresIn = form.expiresIn;
      }

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
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100';
  const selectCls = inputCls;

  return createPortal(
    <dialog ref={dialogRef} aria-labelledby="create-notification-title" onCancel={(e) => { e.preventDefault(); if (!loading) onClose(); }} className="m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-3xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <div className="min-w-0">
        <header className="flex shrink-0 items-start gap-4 border-b border-slate-100 bg-gradient-to-br from-orange-50 to-white px-6 py-5 dark:border-slate-800 dark:from-orange-500/10 dark:to-slate-900 sm:px-8">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg></div>
          <div className="flex-1"><p className="mb-1 text-[10px] font-bold uppercase tracking-[.18em] text-orange-600 dark:text-orange-400">Customer engagement</p><h2 id="create-notification-title" className="text-xl font-bold tracking-tight">Create notification</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A timely message, delivered your way.</p></div>
          <button type="button" disabled={loading} onClick={onClose} aria-label="Close notification editor" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-slate-800"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
        </header>

        <form onSubmit={handleSubmit} className="min-w-0">
        <fieldset disabled={loading} className="min-w-0 space-y-5 px-6 py-6 disabled:opacity-60 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">01 / Audience</p>
          {/* Target */}
          <div>
            <label htmlFor="notification-target" className="mb-2 block text-sm font-medium text-gray-700">
              Target <span className="text-orange-500">*</span>
            </label>
            <select
              id="notification-target"
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
            <NotificationUserSearch userId={form.userId} onSelect={(id) => set('userId', id)} inputClassName={inputCls} />
          )}

          {/* Title */}
          <div className="border-t border-slate-100 pt-5 dark:border-slate-800"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">02 / Message</p></div>
          <div>
            <label htmlFor="notification-title" className="mb-2 block text-sm font-medium text-gray-700">
              Title <span className="text-orange-500">*</span>
            </label>
            <input
              id="notification-title"
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
            <label htmlFor="notification-message" className="mb-2 block text-sm font-medium text-gray-700">
              Message <span className="text-orange-500">*</span>
            </label>
            <textarea
              id="notification-message"
              required
              rows={4}
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
              className={inputCls + ' resize-none'}
              placeholder="Notification body text…"
            />
          </div>

          {/* Channel + Priority side by side */}
          <div className="border-t border-slate-100 pt-5 dark:border-slate-800"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">03 / Delivery & visibility</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="notification-channel" className="mb-2 block text-sm font-medium text-gray-700">Channel</label>
              <select
                id="notification-channel"
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
              <label htmlFor="notification-priority" className="mb-2 block text-sm font-medium text-gray-700">Priority</label>
              <select
                id="notification-priority"
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

          <div>
            <label htmlFor="notification-expiry" className="mb-1 block text-sm text-gray-700">Visible for</label>
            <select id="notification-expiry" value={form.expiresIn} onChange={(e) => set('expiresIn', e.target.value)} className={selectCls}>
              <option value="never">Never expires</option>
              <option value="24h">24 hours</option>
              <option value="2d">2 days</option>
              <option value="1w">1 week</option>
              <option value="1m">1 month</option>
              <option value="custom">Custom date and time</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">Expired notifications are hidden from the customer's notification list and popups.</p>
          </div>
          {form.expiresIn === 'custom' && (
            <div>
              <label htmlFor="notification-expires-at" className="mb-1 block text-sm text-gray-700">Expiry date and time</label>
              <input id="notification-expires-at" type="datetime-local" required value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} className={inputCls} />
              <p className="mt-1 text-xs text-gray-500">Uses your local time zone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p>
            </div>
          )}

          {['push', 'both', 'all'].includes(form.channel) && (
            <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">Push delivery requires the customer app to have registered an Expo device token.</p>
          )}

          {/* Email info hint */}
          {(form.channel === 'email' || form.channel === 'both' || form.channel === 'all') && (
            <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Recipients can receive a branded BillXpress email with the orange theme and social links.
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

        </fieldset>
          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/30 sm:px-8">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send Notification'}
            </button>
          </footer>
        </form>
      </div>
    </dialog>, document.body
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

  const firstItem = (meta.page - 1) * LIMIT + 1;
  const lastItem = Math.min(meta.page * LIMIT, meta.total);

  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
      <p className="text-xs text-gray-400">
        Showing {firstItem}–{lastItem} of {meta.total} notifications
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          ← Prev
        </button>
        <span className="flex items-center px-1 text-xs text-gray-500">
          Page {meta.page} of {meta.totalPages}
        </span>
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
            <ResponsiveTable className="w-full min-w-[720px] text-left text-sm">
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
            </ResponsiveTable>
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
