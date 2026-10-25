import ResponsiveTable from '../components/ResponsiveTable';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { adjustUserWallet, makeVendor, useUsers } from '../hooks/useUsers';

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

function getDisplayName(user, fallback) {
  return [user.firstName ?? user.first_name, user.lastName ?? user.last_name]
    .filter(Boolean).join(' ') || user.name || user.email || fallback;
}

const actionButton = 'inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 text-xs font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400';

function UserRow({ user, onAdjustWallet, onMakeVendor }) {
  const firstName = user.firstName ?? user.first_name;
  const lastName = user.lastName ?? user.last_name;
  const name = [firstName, lastName].filter(Boolean).join(' ') || user.name || '—';
  const status = user.status?.toLowerCase()
    ?? (typeof user.isActive === 'boolean' ? (user.isActive ? 'active' : 'inactive') : '—');
  const authTier = user.authTier ?? user.auth_tier;
  const wallet = user.wallet ?? {};
  const mainBalance = wallet.mainBalance ?? wallet.balances?.main;
  const referralBalance = wallet.referralBalance ?? wallet.balances?.referral;
  const role = user.role ?? 'user';

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
      <td className="px-4 py-3"><Badge className={role === 'vendor' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}>{role}</Badge></td>
      <td className="px-4 py-3">
        <Badge className={status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>{status}</Badge>
      </td>
      <td className="px-4 py-3 capitalize text-gray-600">{authTier?.replace('_', ' ') ?? '—'}</td>
      <td className="whitespace-nowrap px-4 py-3 text-gray-500">{formatDate(user.createdAt ?? user.created_at)}</td>
      <td className="whitespace-nowrap px-4 py-3">
        <p className="font-semibold text-gray-900">{formatCurrency(mainBalance, wallet.currency)}</p>
        <p className="mt-0.5 text-xs text-gray-400">Referral: {formatCurrency(referralBalance, wallet.currency)}</p>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="grid w-full max-w-[13rem] grid-cols-2 gap-1.5">
          <button type="button" onClick={() => onAdjustWallet(user, 'credit')} title="Credit wallet" className={`${actionButton} border-green-200 bg-green-50 text-green-700 hover:border-green-300 hover:bg-green-100 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20`}>
            <Icon name="credit" className="h-3.5 w-3.5" />Credit
          </button>
          <button type="button" onClick={() => onAdjustWallet(user, 'debit')} title="Debit wallet" className={`${actionButton} border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20`}>
            <Icon name="debit" className="h-3.5 w-3.5" />Debit
          </button>
          {role === 'user' && (
            <button type="button" onClick={() => onMakeVendor(user)} title="Upgrade to vendor" className={`${actionButton} col-span-2 border-purple-200 bg-white text-purple-700 hover:border-purple-300 hover:bg-purple-50 dark:border-purple-500/30 dark:text-purple-400 dark:hover:bg-purple-500/10`}>
              <Icon name="vendor" className="h-3.5 w-3.5" />Make vendor
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

const ICONS = {
  credit: 'M12 4.5v15m7.5-7.5h-15',
  debit: 'M19.5 12h-15',
  vendor: 'M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z',
  check: 'm4.5 12.75 6 6 9-13.5',
  close: 'M6 18 18 6M6 6l12 12',
  warning: 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z',
  copy: 'M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25',
};

function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

const TONES = {
  green: { icon: 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400', button: 'bg-green-600 hover:bg-green-700 focus-visible:ring-green-500', ring: 'focus:border-green-500 focus:ring-green-500/20' },
  red: { icon: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400', button: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500', ring: 'focus:border-red-500 focus:ring-red-500/20' },
  purple: { icon: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400', button: 'bg-purple-600 hover:bg-purple-700 focus-visible:ring-purple-500', ring: 'focus:border-purple-500 focus:ring-purple-500/20' },
};

function Modal({ titleId, icon, tone, title, subtitle, locked, onClose, children, footer }) {
  useEffect(() => {
    function handleKey(event) { if (event.key === 'Escape' && !locked) onClose(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [locked, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  // Portal to <body> so the animated (transformed) page wrapper can't become the containing block.
  return createPortal(
    <div className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !locked) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="modal-panel flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-black/5 sm:max-w-md sm:rounded-2xl">
        <div className="flex items-start gap-4 px-6 pb-4 pt-6">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[tone].icon}`}>
            <Icon name={icon} className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id={titleId} className="text-lg font-semibold leading-6 text-gray-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} disabled={locked} aria-label="Close" className="-mr-2 -mt-1 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

function UserSummary({ user, aside }) {
  const name = getDisplayName(user, 'Unnamed user');
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-semibold text-white">{initials}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
        <p className="truncate text-xs text-gray-500">{user.email ?? (user.username ? `@${user.username}` : 'User account')}</p>
      </div>
      {aside}
    </div>
  );
}

function ErrorAlert({ children }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

const secondaryButton = 'rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50';
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60';
const QUICK_AMOUNTS = [1000, 5000, 10000, 50000];

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />;
}

function WalletDialog({ adjustment, onClose, onSuccess }) {
  const operation = adjustment.operation;
  const user = adjustment.user;
  const name = getDisplayName(user, 'this user');
  const wallet = user.wallet ?? {};
  const currency = wallet.currency ?? 'NGN';
  const balances = {
    main: wallet.mainBalance ?? wallet.balances?.main,
    referral: wallet.referralBalance ?? wallet.balances?.referral,
  };
  const isCredit = operation === 'credit';
  const tone = isCredit ? 'green' : 'red';
  const [amount, setAmount] = useState('');
  const [walletType, setWalletType] = useState('main');
  const [reason, setReason] = useState(`Admin manual wallet ${operation}`);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const numericAmount = Number(amount);
  const currentBalance = balances[walletType];
  const hasAmount = amount !== '' && Number.isFinite(numericAmount) && numericAmount > 0;
  const newBalance = currentBalance != null && hasAmount
    ? Number(currentBalance) + (isCredit ? numericAmount : -numericAmount)
    : null;
  const insufficient = !isCredit && newBalance != null && newBalance < 0;

  async function handleSubmit(event) {
    event.preventDefault();
    const userId = user.id ?? user._id;

    if (!userId) {
      setError('This user has no valid ID.');
      return;
    }
    if (!hasAmount) {
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
      onSuccess(`${name}'s ${walletType} wallet was ${isCredit ? 'credited' : 'debited'} successfully.`);
    } catch (requestError) {
      setError(requestError?.response?.data?.message ?? requestError.message ?? `Failed to ${operation} wallet.`);
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass = `w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none focus:ring-4 ${TONES[tone].ring}`;

  return (
    <Modal
      titleId="wallet-dialog-title"
      icon={operation}
      tone={tone}
      title={isCredit ? 'Credit wallet' : 'Debit wallet'}
      subtitle={isCredit ? 'Add funds to this user’s wallet.' : 'Remove funds from this user’s wallet.'}
      locked={submitting}
      onClose={onClose}
      footer={(
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={secondaryButton}>Cancel</button>
          <button type="submit" form="wallet-form" disabled={submitting} className={`${primaryButton} ${TONES[tone].button}`}>
            {submitting && <Spinner />}
            {submitting ? 'Processing…' : `${isCredit ? 'Credit' : 'Debit'}${hasAmount ? ` ${formatCurrency(numericAmount, currency)}` : ''}`}
          </button>
        </>
      )}
    >
      <form id="wallet-form" onSubmit={handleSubmit} className="space-y-5">
        <UserSummary user={user} />

        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-gray-700">Wallet</legend>
          <div className="grid grid-cols-2 gap-2">
            {[['main', 'Main wallet'], ['referral', 'Referral wallet']].map(([value, label]) => {
              const selected = walletType === value;
              return (
                <label key={value} className={`cursor-pointer rounded-xl border-2 p-3 transition ${selected ? (isCredit ? 'border-green-500 bg-green-50 dark:bg-green-500/10' : 'border-red-500 bg-red-50 dark:bg-red-500/10') : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="walletType" value={value} checked={selected} onChange={() => setWalletType(value)} disabled={submitting} className="sr-only" />
                  <span className="block text-xs font-medium text-gray-500">{label}</span>
                  <span className="mt-1 block text-base font-semibold text-gray-900">{formatCurrency(balances[value], currency)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="wallet-amount" className="mb-2 block text-sm font-medium text-gray-700">Amount</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-gray-400">{currency === 'NGN' ? '₦' : currency}</span>
            <input id="wallet-amount" type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={submitting} autoFocus placeholder="0.00" className={`${fieldClass} pl-9 text-lg font-semibold`} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <button key={value} type="button" onClick={() => setAmount(String(value))} disabled={submitting} className={`rounded-full border px-3 py-1 text-xs font-medium ${numericAmount === value ? 'border-gray-900 bg-gray-900 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {formatCurrency(value, currency)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="wallet-reason" className="mb-2 block text-sm font-medium text-gray-700">Reason</label>
          <textarea id="wallet-reason" value={reason} onChange={(event) => setReason(event.target.value)} disabled={submitting} rows="2" className={`${fieldClass} resize-none`} />
          <p className="mt-1.5 text-xs text-gray-400">Recorded in the transaction history for auditing.</p>
        </div>

        {newBalance != null && (
          <div className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm ${insufficient ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-gray-50 text-gray-600'}`}>
            <span>{insufficient ? 'Insufficient funds' : 'New balance'}</span>
            <span className="font-semibold">{formatCurrency(currentBalance, currency)} → {formatCurrency(newBalance, currency)}</span>
          </div>
        )}

        {error && <ErrorAlert>{error}</ErrorAlert>}
      </form>
    </Modal>
  );
}

const VENDOR_CHANGES = [
  ['Role', 'User → Vendor'],
  ['Discount rate', '20% on purchases'],
  ['Vendor access', 'Activated immediately'],
  ['API key', 'Generated for integrations'],
];

function MakeVendorDialog({ user, onClose, onSuccess }) {
  const name = getDisplayName(user, 'this user');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  async function handleConfirm() {
    const userId = user.id ?? user._id;
    if (!userId) {
      setError('This user has no valid ID.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const data = await makeVendor(userId);
      setApiKey(data?.apiKey ?? data?.data?.apiKey ?? '');
      setUpgraded(true);
      onSuccess(data?.message ?? `${name} was upgraded to vendor successfully.`);
    } catch (requestError) {
      setError(requestError?.response?.data?.message ?? requestError.message ?? 'Failed to upgrade user to vendor.');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyApiKey() {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (upgraded) {
    return (
      <Modal
        titleId="vendor-dialog-title"
        icon="check"
        tone="green"
        title="Vendor approved"
        subtitle={`${name} can now access vendor pricing.`}
        locked={Boolean(apiKey) && !copied}
        onClose={onClose}
        footer={<button type="button" onClick={onClose} className={`${primaryButton} ${TONES.purple.button}`}>Done</button>}
      >
        {apiKey ? (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Vendor API key</p>
              <div className="flex items-stretch overflow-hidden rounded-lg border border-gray-300 bg-gray-50">
                <code className="min-w-0 flex-1 break-all px-3 py-2.5 font-mono text-xs leading-5 text-gray-900">{apiKey}</code>
                <button type="button" onClick={copyApiKey} className={`flex shrink-0 items-center gap-1.5 border-l border-gray-300 px-3 text-xs font-semibold ${copied ? 'text-green-600 dark:text-green-400' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <Icon name={copied ? 'check' : 'copy'} className="h-4 w-4" />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Copy this key and share it securely with the vendor. It may not be shown again.</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">The account is now a vendor. The server did not return an API key.</p>
        )}
      </Modal>
    );
  }

  return (
    <Modal
      titleId="vendor-dialog-title"
      icon="vendor"
      tone="purple"
      title="Upgrade to vendor"
      subtitle="Review the changes before approving."
      locked={submitting}
      onClose={onClose}
      footer={(
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={secondaryButton}>Cancel</button>
          <button type="button" onClick={handleConfirm} disabled={submitting} className={`${primaryButton} ${TONES.purple.button}`}>
            {submitting && <Spinner />}
            {submitting ? 'Upgrading…' : 'Approve vendor'}
          </button>
        </>
      )}
    >
      <div className="space-y-5">
        <UserSummary user={user} aside={<Badge className="bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">{user.role ?? 'user'}</Badge>} />

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">What will change</p>
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {VENDOR_CHANGES.map(([label, value]) => (
              <li key={label} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400">
                  <Icon name="check" className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 text-sm text-gray-600">{label}</span>
                <span className="text-sm font-medium text-gray-900">{value}</span>
              </li>
            ))}
          </ul>
        </div>

        {error && <ErrorAlert>{error}</ErrorAlert>}
      </div>
    </Modal>
  );
}

export default function Users() {
  const [draft, setDraft] = useState(INITIAL_FILTERS);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [adjustment, setAdjustment] = useState(null);
  const [vendorTarget, setVendorTarget] = useState(null);
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

  async function handleVendorSuccess(message) {
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
              <ResponsiveTable className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50"><tr>
                  {['User', 'Contact', 'Role', 'Status', 'Auth tier', 'Joined', 'Wallet balance', 'Actions'].map((heading) => <th key={heading} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${heading === 'Actions' ? 'w-[14.5rem]' : ''}`}>{heading}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {users.length ? users.map((user) => <UserRow key={user.id ?? user._id ?? user.email} user={user} onAdjustWallet={(selectedUser, operation) => { setSuccess(''); setAdjustment({ user: selectedUser, operation }); }} onMakeVendor={(selectedUser) => { setSuccess(''); setVendorTarget(selectedUser); }} />) : <tr><td colSpan="8" className="px-4 py-16 text-center text-gray-400">No users found.</td></tr>}
                </tbody>
              </ResponsiveTable>
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
      {vendorTarget && <MakeVendorDialog user={vendorTarget} onClose={() => setVendorTarget(null)} onSuccess={handleVendorSuccess} />}
    </div>
  );
}
