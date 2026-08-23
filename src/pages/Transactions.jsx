import { useMemo, useState } from 'react';
import { useAdminTransactions } from '../hooks/useAdminTransactions';

const INITIAL_FILTERS = { search: '', userId: '', type: '', status: '', direction: '', walletType: '', provider: '', service: '', dateFrom: '', dateTo: '', amountMin: '', amountMax: '', limit: 20 };
const TYPES = ['funding', 'credit', 'debit', 'transfer', 'referral_earning', 'referral_redeem', 'service_payment', 'reversal'];
const SERVICES = ['data', 'airtime', 'electricity', 'cable_tv', 'social_growth'];
const inputClass = 'rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400';

function money(value, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value ?? 0));
}

function dateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}

function label(value) {
  return value ? String(value).replaceAll('_', ' ') : '—';
}

function Badge({ value, kind = 'neutral' }) {
  const styles = {
    successful: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700', pending: 'bg-amber-100 text-amber-700', reversed: 'bg-purple-100 text-purple-700',
    credit: 'bg-green-100 text-green-700', debit: 'bg-orange-100 text-orange-700', neutral: 'bg-gray-100 text-gray-600',
  };
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[value] ?? styles[kind]}`}>{label(value)}</span>;
}

function Summary({ summary, currency }) {
  if (!summary) return null;
  const statuses = Object.entries(summary.byStatus ?? {});
  return <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <div className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-white shadow-sm"><p className="text-xs font-semibold uppercase text-orange-100">Transactions</p><p className="mt-1 text-2xl font-bold">{Number(summary.totalCount ?? 0).toLocaleString()}</p></div>
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase text-gray-400">Total Amount</p><p className="mt-1 text-2xl font-bold text-gray-900">{money(summary.totalAmount, currency)}</p></div>
    {statuses.slice(0, 2).map(([status, stats]) => <div key={status} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase text-gray-400">{label(status)}</p><Badge value={status} /></div><p className="mt-1 text-xl font-bold text-gray-900">{money(stats.amount, currency)}</p><p className="text-xs text-gray-400">{Number(stats.count ?? 0).toLocaleString()} transactions</p></div>)}
  </div>;
}

function Filters({ draft, setDraft, apply, reset }) {
  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  return <form onSubmit={(event) => { event.preventDefault(); apply(); }} className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      <input className={`${inputClass} sm:col-span-2`} placeholder="Search reference, user, provider…" value={draft.search} onChange={(e) => set('search', e.target.value)} />
      <input className={inputClass} placeholder="User ID" value={draft.userId} onChange={(e) => set('userId', e.target.value)} />
      <select className={inputClass} value={draft.status} onChange={(e) => set('status', e.target.value)}><option value="">All statuses</option>{['pending', 'successful', 'failed', 'reversed'].map((v) => <option key={v}>{v}</option>)}</select>
      <select className={inputClass} value={draft.type} onChange={(e) => set('type', e.target.value)}><option value="">All types</option>{TYPES.map((v) => <option key={v}>{v}</option>)}</select>
      <select className={inputClass} value={draft.service} onChange={(e) => set('service', e.target.value)}><option value="">All services</option>{SERVICES.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select>
      <select className={inputClass} value={draft.direction} onChange={(e) => set('direction', e.target.value)}><option value="">All directions</option><option>credit</option><option>debit</option></select>
      <select className={inputClass} value={draft.walletType} onChange={(e) => set('walletType', e.target.value)}><option value="">All wallets</option><option value="main">main</option><option value="referral">referral</option></select>
      <input className={inputClass} placeholder="Provider" value={draft.provider} onChange={(e) => set('provider', e.target.value)} />
      <select className={inputClass} value={draft.limit} onChange={(e) => set('limit', Number(e.target.value))}>{[20, 50, 100].map((v) => <option key={v} value={v}>{v} / page</option>)}</select>
      <label className="text-xs text-gray-500">From<input className={`${inputClass} mt-1 w-full`} type="date" value={draft.dateFrom} onChange={(e) => set('dateFrom', e.target.value)} /></label>
      <label className="text-xs text-gray-500">To<input className={`${inputClass} mt-1 w-full`} type="date" value={draft.dateTo} onChange={(e) => set('dateTo', e.target.value)} /></label>
      <input className={inputClass} type="number" min="0" placeholder="Minimum amount" value={draft.amountMin} onChange={(e) => set('amountMin', e.target.value)} />
      <input className={inputClass} type="number" min="0" placeholder="Maximum amount" value={draft.amountMax} onChange={(e) => set('amountMax', e.target.value)} />
    </div>
    <div className="mt-4 flex justify-end gap-3"><button type="button" onClick={reset} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Reset</button><button className="rounded-md bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600">Apply Filters</button></div>
  </form>;
}

function Details({ transaction }) {
  const details = transaction.details ?? {};
  const fields = transaction.service === 'data' ? [['Network', details.network], ['Plan', details.planName], ['Phone', details.phone]]
    : transaction.service === 'airtime' ? [['Network', details.network], ['Airtime Value', money(details.airtimeValue)], ['Phone', details.phone]]
    : transaction.service === 'electricity' ? [['Disco', details.disco], ['Meter Number', details.meterNumber], ['Meter Type', details.meterType], ['Token', details.token ?? transaction.token], ['Units', details.units ?? transaction.units]]
    : transaction.service === 'cable_tv' ? [['TV Provider', details.tvProvider], ['Smartcard', details.smartcardNumber], ['Package', details.packageName]] : [];
  const references = [['BillXpress Reference', transaction.reference], ['Provider Reference', transaction.providerReference], ['Customer Reference', details.customerReference]];
  return <div className="grid gap-4 p-5 sm:grid-cols-2"><div><h3 className="mb-2 text-xs font-bold uppercase text-gray-400">Transaction</h3>{references.map(([name, value]) => <p key={name} className="mb-2 text-sm"><span className="text-gray-500">{name}: </span><span className="break-all font-mono text-xs text-gray-900">{value ?? '—'}</span></p>)}<p className="text-sm text-gray-600">{transaction.narration ?? '—'}</p></div><div><h3 className="mb-2 text-xs font-bold uppercase text-gray-400">Service Details</h3>{fields.length ? fields.map(([name, value]) => <p key={name} className="mb-2 text-sm"><span className="text-gray-500">{name}: </span><strong className="text-gray-900">{value ?? '—'}</strong></p>) : <p className="text-sm text-gray-400">No service-specific details.</p>}<p className="mt-3 text-sm text-gray-500">Balance: {money(transaction.balanceBefore, transaction.currency)} → {money(transaction.balanceAfter, transaction.currency)}</p></div></div>;
}

function TransactionRow({ transaction }) {
  const [open, setOpen] = useState(false);
  const user = transaction.user ?? {};
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Unknown user';
  return <><tr onClick={() => setOpen((value) => !value)} className="cursor-pointer hover:bg-gray-50"><td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{dateTime(transaction.createdAt)}</td><td className="px-4 py-3"><p className="font-medium text-gray-900">{name}</p><p className="text-xs text-gray-400">{user.email ?? user.phone ?? '—'}</p></td><td className="px-4 py-3 capitalize text-gray-600">{label(transaction.service)}</td><td className="px-4 py-3"><p className="capitalize text-gray-700">{label(transaction.type)}</p><Badge value={transaction.direction} /></td><td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">{money(transaction.amount, transaction.currency)}</td><td className="px-4 py-3"><Badge value={transaction.status} /></td><td className="px-4 py-3 text-gray-600">{transaction.provider ?? '—'}</td><td className="max-w-[170px] px-4 py-3"><p className="truncate font-mono text-xs text-gray-600" title={transaction.reference}>{transaction.reference ?? '—'}</p><p className="truncate font-mono text-xs text-gray-400" title={transaction.providerReference}>{transaction.providerReference ?? '—'}</p></td><td className="px-4 py-3 text-orange-500">{open ? '▴' : '▾'}</td></tr>{open && <tr className="bg-gray-50"><td colSpan="9"><Details transaction={transaction} /></td></tr>}</>;
}

export default function Transactions() {
  const [draft, setDraft] = useState(INITIAL_FILTERS);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const query = useMemo(() => ({ ...filters, page }), [filters, page]);
  const { transactions, summary, pagination, loading, error, refetch } = useAdminTransactions(query);
  const apply = () => { setFilters(draft); setPage(1); };
  const reset = () => { setDraft(INITIAL_FILTERS); setFilters(INITIAL_FILTERS); setPage(1); };
  return <div><div className="mb-6 flex items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold text-gray-900">Transactions</h1><p className="mt-0.5 text-sm text-gray-500">All wallet and service transactions across BillXpress users.</p></div><button onClick={refetch} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">↻ Refresh</button></div>
    <Filters draft={draft} setDraft={setDraft} apply={apply} reset={reset} /><Summary summary={summary} currency="NGN" />
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">{loading ? <div className="py-32 text-center text-sm text-gray-400">Loading transactions…</div> : error ? <div className="flex flex-col items-center gap-3 py-32"><p className="text-sm text-red-600">{error}</p><button onClick={refetch} className="text-sm text-orange-500 hover:underline">Try again</button></div> : <><div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="border-b border-gray-200 bg-gray-50"><tr>{['Date / Time', 'User', 'Service', 'Type / Direction', 'Amount', 'Status', 'Provider', 'References', ''].map((heading, index) => <th key={`${heading}-${index}`} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{heading}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{transactions.length ? transactions.map((transaction) => <TransactionRow key={transaction.id ?? transaction._id ?? transaction.reference} transaction={transaction} />) : <tr><td colSpan="9" className="py-20 text-center text-gray-400">No transactions found.</td></tr>}</tbody></table></div><div className="flex items-center justify-between border-t border-gray-100 px-4 py-3"><p className="text-xs text-gray-500">Showing {pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}</p><div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs disabled:opacity-40">Previous</button><span className="text-xs text-gray-500">Page {pagination.page} of {pagination.pages}</span><button disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs disabled:opacity-40">Next</button></div></div></>}</div>
  </div>;
}
