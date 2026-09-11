import { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

export default function NotificationUserSearch({ userId, onSelect, inputClassName }) {
  const [query, setQuery] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const search = query.trim();

  useEffect(() => {
    if (!search || userId) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { data } = await apiClient.get('/api/v1/admin/users', {
          params: { search, page, limit: 10 }, signal: controller.signal,
        });
        const payload = data?.data ?? data ?? {};
        const users = Array.isArray(payload) ? payload : payload.users ?? [];
        const meta = payload.pagination ?? data?.pagination ?? payload.meta ?? data?.meta ?? {};
        const total = meta.total ?? meta.totalItems ?? payload.total ?? data?.total;
        const pages = meta.pages ?? meta.totalPages ?? meta.pageCount ?? (total != null ? Math.ceil(Number(total) / 10) : null);
        if (!controller.signal.aborted) setResult({ users: users.filter((user) => user.id ?? user._id), hasNext: pages != null ? page < Number(pages) : users.length === 10 });
      } catch (err) {
        if (!controller.signal.aborted) setResult({ error: err?.response?.data?.message ?? 'Could not search users. Please try again.' });
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, page, userId, retry]);

  function changeQuery(value) {
    setQuery(value); setPage(1); setResult(null); onSelect('');
  }

  return (
    <div>
      <label htmlFor="notification-user-search" className="mb-2 block text-sm font-medium text-gray-700">Recipient <span className="text-orange-500">*</span></label>
      {userId ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3 dark:border-orange-500/30 dark:bg-orange-500/10">
          <div className="min-w-0"><p className="font-medium text-gray-900">{selectedName || 'Selected user'}</p><p className="break-all font-mono text-xs text-gray-500">{userId}</p></div>
          <button type="button" onClick={() => changeQuery('')} className="rounded-lg px-3 py-2 text-sm font-semibold text-orange-600">Change</button>
        </div>
      ) : (
        <>
          <input id="notification-user-search" type="search" autoComplete="off" value={query} onChange={(e) => changeQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} className={inputClassName} placeholder="Search by name…" aria-describedby="notification-user-help" />
          <p id="notification-user-help" className="mt-2 text-xs text-gray-500">Search for a user, then select a result. Their ID is used as the recipient.</p>
          {search && <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            {!result ? <p role="status" className="p-4 text-sm text-gray-500">Searching users…</p> : result.error ? <div role="alert" className="p-4 text-sm text-red-600">{result.error}<button type="button" onClick={() => { setResult(null); setRetry((value) => value + 1); }} className="ml-2 underline">Retry</button></div> : <>
              <ul aria-label="Matching users" className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {result.users.map((user) => {
                  const id = String(user.id ?? user._id);
                  const name = [user.firstName ?? user.first_name, user.lastName ?? user.last_name].filter(Boolean).join(' ') || user.name || user.username || 'Unnamed user';
                  return <li key={id}><button type="button" onClick={() => { setSelectedName(name); onSelect(id); }} className="block w-full px-4 py-3 text-left hover:bg-orange-50 focus-visible:bg-orange-50 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800"><span className="block text-sm font-semibold text-gray-900">{name}</span>{user.email && <span className="block break-all text-xs text-gray-500">{user.email}</span>}<span className="block break-all font-mono text-xs text-gray-500">{id}</span></button></li>;
                })}
              </ul>
              {result.users.length === 0 && <p role="status" className="p-4 text-sm text-gray-500">No matching users found. Try another name.</p>}
              {(page > 1 || result.hasNext) && <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-xs dark:border-slate-700"><button type="button" disabled={page === 1} onClick={() => { setResult(null); setPage(page - 1); }} className="p-2 text-orange-600 disabled:opacity-40">Previous</button><span className="text-gray-500">Page {page}</span><button type="button" disabled={!result.hasNext} onClick={() => { setResult(null); setPage(page + 1); }} className="p-2 text-orange-600 disabled:opacity-40">Next</button></div>}
            </>}
          </div>}
        </>
      )}
    </div>
  );
}
