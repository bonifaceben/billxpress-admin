import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useDashboardEarnings } from '../hooks/useDashboardEarnings';
import { useUsers } from '../hooks/useUsers';

// ─── constants ────────────────────────────────────────────────────────────────

const SERVICE_LABELS = {
  data: 'Data',
  airtime: 'Airtime',
  social_growth: 'Social Growth',
  electricity: 'Electricity',
  cable_tv: 'Cable TV',
  betting: 'Betting',
  esim: 'eSIM',
  bulk_sms: 'Bulk SMS',
  virtual_card: 'Virtual Card',
  education: 'Education',
};

const SUMMARY_PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'allTime', label: 'All Time' },
];

const SERIES_RANGES = [
  { key: 'daily', label: 'Daily', dateOpts: { month: 'short', day: 'numeric' } },
  { key: 'weekly', label: 'Weekly', dateOpts: { month: 'short', day: 'numeric' } },
  { key: 'monthly', label: 'Monthly', dateOpts: { month: 'short', year: '2-digit' } },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value, currency = 'NGN') {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value ?? 0));
  } catch {
    return `${currency} ${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
}

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString();
}

function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(2)}%`;
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d) ? value : d.toLocaleString();
}

function formatPeriodLabel(period, dateOpts) {
  if (!period) return '';
  const d = new Date(period);
  return isNaN(d) ? period : d.toLocaleDateString('en-US', dateOpts);
}

// ─── shared bits ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, highlight }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${highlight ? 'border-orange-200 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-500/20' : 'border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full transition-transform duration-500 group-hover:scale-150 ${highlight ? 'bg-white/10' : 'bg-orange-500/5'}`} />
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`relative mt-2 text-2xl font-bold ${highlight ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className={`mt-1 text-xs ${highlight ? 'text-orange-100' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  );
}

function TabBar({ items, active, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            active === item.key ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── summary section ──────────────────────────────────────────────────────────

function SummarySection({ summary, currency }) {
  const [period, setPeriod] = useState('today');
  const bucket = summary?.[period] ?? {};

  return (
    <div className="mb-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900">Earnings Summary</h2>
        <TabBar items={SUMMARY_PERIODS} active={period} onChange={setPeriod} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatCurrency(bucket.earned, currency)} highlight />
        <StatCard
          label="Profit"
          value={formatCurrency(bucket.profit, currency)}
          sub={`Margin ${formatPercent(bucket.profitMarginPercentage)}`}
        />
        <StatCard label="Cost Price" value={formatCurrency(bucket.costPrice, currency)} />
        <StatCard label="Avg Sale Value" value={formatCurrency(bucket.averageSellingPrice, currency)} />
        <StatCard
          label="Loss Amount"
          value={formatCurrency(bucket.lossAmount, currency)}
          sub={`${formatPercent(bucket.lossPercentage)} of attempted value`}
        />
        <StatCard label="Lost Profit" value={formatCurrency(bucket.lostProfit, currency)} />
        <StatCard
          label="Transactions"
          value={formatNumber(bucket.totalCount)}
          sub={`${formatNumber(bucket.successfulCount)} successful`}
        />
        <StatCard label="Failed / Reversed" value={`${formatNumber(bucket.failedCount)} / ${formatNumber(bucket.reversedCount)}`} />
      </div>
    </div>
  );
}

// ─── service breakdown ─────────────────────────────────────────────────────────

function ServiceCard({ service, currency }) {
  const label = SERVICE_LABELS[service.service] ?? service.service;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{label}</h3>
        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
          {formatPercent(service.profitMarginPercentage)} margin
        </span>
      </div>

      <p className="text-2xl font-bold text-gray-900">{formatCurrency(service.earned, currency)}</p>
      <p className="mt-0.5 text-xs text-gray-400">Revenue</p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400">Profit</p>
          <p className="font-semibold text-green-600">{formatCurrency(service.profit, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Cost Price</p>
          <p className="font-medium text-gray-700">{formatCurrency(service.costPrice, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Avg Sale</p>
          <p className="font-medium text-gray-700">{formatCurrency(service.averageSellingPrice, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Loss Amount</p>
          <p className="font-medium text-red-500">{formatCurrency(service.lossAmount, currency)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span className="text-green-600">● {formatNumber(service.successfulCount)} successful</span>
        <span className="text-red-500">● {formatNumber(service.failedCount)} failed</span>
        <span className="text-yellow-600">● {formatNumber(service.reversedCount)} reversed</span>
      </div>
    </div>
  );
}

function ServicesSection({ services, currency }) {
  return (
    <div className="mb-6">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">Service Breakdown</h2>
      {!services || services.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400 shadow-sm">
          No service data yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.service} service={s} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── chart section ──────────────────────────────────────────────────────────────

function EarningsChartSection({ series, currency }) {
  const [range, setRange] = useState('daily');
  const config = SERIES_RANGES.find((r) => r.key === range);
  const points = series?.[range] ?? [];

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900">Revenue &amp; Profit Trend</h2>
        <TabBar items={SERIES_RANGES} active={range} onChange={setRange} />
      </div>

      {points.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-sm text-gray-400">
          No chart data available yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={points} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="earnedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
            <XAxis
              dataKey="period"
              tickFormatter={(value) => formatPeriodLabel(value, config.dateOpts)}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value, currency)}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              width={80}
            />
            <Tooltip
              labelFormatter={(value) => formatPeriodLabel(value, config.dateOpts)}
              formatter={(value, name) => [formatCurrency(value, currency), name]}
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc' }}
              labelStyle={{ color: '#cbd5e1' }}
            />
            <Legend />
            <Area type="monotone" dataKey="earned" name="Revenue" stroke="#f97316" fill="url(#earnedGradient)" strokeWidth={2} />
            <Area type="monotone" dataKey="profit" name="Profit" stroke="#16a34a" fill="url(#profitGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function BalanceSection({ wallets, providerBalances, currency }) {
  const providers = Object.values(providerBalances ?? {});

  return <section className="mb-8">
    <div className="mb-4"><h2 className="text-sm font-semibold text-gray-900">Balance Overview</h2><p className="mt-0.5 text-xs text-gray-400">Customer liabilities and external provider funds.</p></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {!wallets && providers.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30"><p className="font-medium text-amber-800 dark:text-amber-300">Balance data is not available</p><p className="mt-1 text-sm text-amber-700 dark:text-amber-400">The current API response does not include <code>wallets</code> or <code>providerBalances</code>. Refresh after the updated backend is deployed.</p></div>}
      {wallets && <div className="relative overflow-hidden rounded-2xl border border-indigo-500 bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-lg shadow-indigo-500/15">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Customer Wallet Balance</p><p className="mt-2 text-3xl font-bold tracking-tight">{formatCurrency(wallets.totalBalance, wallets.currency ?? currency)}</p></div><span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">{formatNumber(wallets.walletCount)} wallets</span></div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/15 pt-4"><div><p className="text-xs text-indigo-200">Main wallets</p><p className="mt-1 font-semibold">{formatCurrency(wallets.mainBalance, wallets.currency ?? currency)}</p></div><div><p className="text-xs text-indigo-200">Referral wallets</p><p className="mt-1 font-semibold">{formatCurrency(wallets.referralBalance, wallets.currency ?? currency)}</p></div></div></div>
      </div>}
      {providers.map((provider) => <div key={provider.provider} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Provider Balance</p><h3 className="mt-1 font-semibold uppercase text-gray-900">{provider.provider}</h3></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${provider.available ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{provider.available ? 'Available' : 'Unavailable'}</span></div>
        {provider.available ? <><p className="mt-4 text-3xl font-bold tracking-tight text-gray-900">{formatCurrency(provider.balance, provider.currency ?? currency)}</p><p className="mt-1 text-sm text-gray-500">{provider.accountName ?? 'Provider account'}</p></> : <div className="mt-4 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30"><p className="text-sm font-medium text-amber-700 dark:text-amber-300">Balance unavailable</p><p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{provider.error ?? 'This provider does not support balance checks.'}</p></div>}
        <p className="mt-4 text-xs text-gray-400">Checked {formatDate(provider.checkedAt)}</p>
      </div>)}
    </div>
  </section>;
}

function TopCustomersSection({ topCustomers, currency }) {
  const [range, setRange] = useState('thisWeek');
  const customers = topCustomers?.[range] ?? [];

  return <section className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-slate-800"><div><h2 className="text-sm font-semibold text-gray-900">Top Customers</h2><p className="mt-0.5 text-xs text-gray-400">Ranked by successful service purchase value.</p></div><TabBar items={[{ key: 'thisWeek', label: 'This Week' }, { key: 'thisMonth', label: 'This Month' }, { key: 'allTime', label: 'All Time' }]} active={range} onChange={setRange} /></div>
    {!topCustomers ? <div className="m-5 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">The current API response does not include <code>topCustomers</code>. Refresh after the updated backend is deployed.</div> : customers.length === 0 ? <div className="py-14 text-center text-sm text-gray-400">No customer purchases for this period.</div> : <>
      <div className="grid gap-3 bg-slate-50/70 p-5 dark:bg-slate-950/30 sm:grid-cols-3">{customers.slice(0, 3).map((entry, index) => {
        const customer = entry.user ?? {}; const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.username || customer.email || 'Unknown user'; const colors = ['from-amber-400 to-orange-500', 'from-slate-400 to-slate-500', 'from-orange-700 to-amber-800'];
        return <div key={customer.id ?? entry.rank} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"><div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${colors[index]} font-bold text-white`}>#{entry.rank ?? index + 1}</div><div className="min-w-0"><p className="truncate font-semibold text-gray-900">{name}</p><p className="truncate text-xs text-gray-400">{customer.email ?? `@${customer.username ?? 'user'}`}</p></div></div><p className="mt-4 text-xl font-bold text-gray-900">{formatCurrency(entry.totalSpent, currency)}</p><p className="text-xs text-gray-400">{formatNumber(entry.transactionCount)} transactions</p></div>;
      })}</div>
      <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Rank</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Transactions</th><th className="px-5 py-3">Total spent</th><th className="px-5 py-3">Last purchase</th></tr></thead><tbody className="divide-y divide-gray-100 dark:divide-slate-800">{customers.map((entry, index) => { const customer = entry.user ?? {}; const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.username || 'Unknown user'; return <tr key={customer.id ?? `${range}-${index}`} className="hover:bg-gray-50"><td className="px-5 py-3 font-bold text-orange-600">#{entry.rank ?? index + 1}</td><td className="px-5 py-3"><p className="font-medium text-gray-900">{name}</p><p className="text-xs text-gray-400">{customer.email ?? '—'}</p></td><td className="px-5 py-3 text-gray-600">{formatNumber(entry.transactionCount)}</td><td className="px-5 py-3 font-semibold text-gray-900">{formatCurrency(entry.totalSpent, currency)}</td><td className="whitespace-nowrap px-5 py-3 text-gray-500">{formatDate(entry.lastTransactionAt)}</td></tr>; })}</tbody></table></div>
    </>}
  </section>;
}

function LatestUsersSection({ users, total, loading, error, onRetry }) {
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Users</h2>
          <p className="mt-0.5 text-xs text-gray-400">{loading ? 'Loading accounts…' : `${formatNumber(total)} total accounts`}</p>
        </div>
        <Link to="/users" className="text-sm font-medium text-orange-600 hover:text-orange-700">View all</Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading users…</div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={onRetry} className="text-sm text-orange-500 hover:underline">Try again</button>
        </div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">No users found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((account) => {
                const name = [account.firstName ?? account.first_name, account.lastName ?? account.last_name]
                  .filter(Boolean).join(' ') || account.name || '—';
                const status = account.status?.toLowerCase()
                  ?? (typeof account.isActive === 'boolean' ? (account.isActive ? 'active' : 'inactive') : '—');

                return (
                  <tr key={account.id ?? account._id ?? account.email} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{name}</p>
                      <p className="text-xs text-gray-400">{account.username ? `@${account.username}` : '—'}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{account.email ?? account.phone ?? account.phoneNumber ?? '—'}</td>
                    <td className="px-5 py-3 capitalize text-gray-600">{account.role ?? 'user'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-gray-500">{formatDate(account.createdAt ?? account.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useDashboardEarnings();
  const {
    users,
    pagination: usersPagination,
    loading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useUsers({ page: 1, limit: 5 });

  function refreshDashboard() {
    refetch();
    refetchUsers();
  }

  return (
    <div>
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-6 py-7 text-white shadow-2xl shadow-slate-900/10 sm:px-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-orange-500/25 blur-3xl" />
        <div className="absolute right-20 top-12 h-28 w-28 rounded-full border border-white/10" />
        <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[.2em] text-orange-300">Dashboard overview</p>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Welcome back, {user?.firstName}</h1>
          <p className="mt-1 text-sm text-slate-300">
            {data ? `Updated ${formatDate(data.generatedAt)}` : "Here's a quick overview of your platform."}
          </p>
        </div>
        <button
          onClick={refreshDashboard}
          className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
        >
          ↻ Refresh
        </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 text-sm text-gray-400">Loading earnings…</div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-32">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={refetch} className="text-sm text-orange-500 hover:underline">Try again</button>
        </div>
      ) : !data ? null : (
        <>
          <BalanceSection wallets={data.wallets} providerBalances={data.providerBalances} currency={data.currency} />
          <SummarySection summary={data.summary} currency={data.currency} />
          <ServicesSection services={data.services} currency={data.currency} />
          <EarningsChartSection series={data.series} currency={data.currency} />
          <TopCustomersSection topCustomers={data.topCustomers} currency={data.currency} />
        </>
      )}

      <LatestUsersSection
        users={users}
        total={usersPagination.total}
        loading={usersLoading}
        error={usersError}
        onRetry={refetchUsers}
      />
    </div>
  );
}
