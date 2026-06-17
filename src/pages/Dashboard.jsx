import { useState } from 'react';
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
  const symbol = currency === 'NGN' ? '₦' : '';
  return `${symbol}${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
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
    <div className={`rounded-xl border p-5 shadow-sm ${highlight ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${highlight ? 'text-orange-600' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
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
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
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
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
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

// ─── page ────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useDashboardEarnings();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {user?.firstName}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {data ? `Updated ${formatDate(data.generatedAt)}` : "Here's a quick overview of your platform."}
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
        <div className="flex items-center justify-center py-32 text-sm text-gray-400">Loading earnings…</div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-32">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={refetch} className="text-sm text-orange-500 hover:underline">Try again</button>
        </div>
      ) : !data ? null : (
        <>
          <SummarySection summary={data.summary} currency={data.currency} />
          <ServicesSection services={data.services} currency={data.currency} />
          <EarningsChartSection series={data.series} currency={data.currency} />
        </>
      )}
    </div>
  );
}
