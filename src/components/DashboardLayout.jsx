import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const ICONS = {
  overview: <><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87m-2-12a4 4 0 0 1 0 7.75"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  gift: <><path d="M20 12v10H4V12M2 7h20v5H2V7Zm10 15V7m0 0H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7Zm0 0h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z"/></>,
  service: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21h-4v-.05a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3.05 14H3v-4h.05A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06L7.06 4.2l.06.06A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3.05V3h4v.05a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 9 1.7 1.7 0 0 0 20.95 10H21v4h-.05A1.7 1.7 0 0 0 19.4 15Z"/></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></>,
  wallet: <><path d="M20 7V5a2 2 0 0 0-2-2H5a4 4 0 0 0 0 8h16v8a2 2 0 0 1-2 2H5a4 4 0 0 1-4-4V7"/><path d="M17 15h.01"/></>,
};

function Icon({ name }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">{ICONS[name]}</svg>;
}

const sections = [
  { items: [
    { to: '/', label: 'Overview', icon: 'overview', end: true },
    { to: '/users', label: 'Users', icon: 'users' },
    { to: '/admins', label: 'Admins', icon: 'shield' },
    { to: '/notifications', label: 'Notifications', icon: 'bell' },
    { to: '/referral-rewards', label: 'Referral Rewards', icon: 'gift' },
  ] },
  { heading: 'Services', items: [
    { to: '/services/data-plans', label: 'Data Plans', icon: 'service' },
    { to: '/services/data-plan-management', label: 'Plan Management', icon: 'service' },
    { to: '/services/data-settings', label: 'Data Settings', icon: 'service' },
    { to: '/services/airtime-settings', label: 'Airtime Settings', icon: 'service' },
    { to: '/services/social-growth-settings', label: 'Social Growth', icon: 'service' },
    { to: '/services/card-settings', label: 'Card Settings', icon: 'service' },
  ] },
  { heading: 'Money', items: [
    { to: '/cards', label: 'Virtual Cards', icon: 'card' },
    { to: '/funding/settings', label: 'Funding & Transfers', icon: 'wallet' },
  ] },
];

function initialTheme() {
  const saved = localStorage.getItem('adminTheme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(initialTheme);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('adminTheme', theme);
  }, [theme]);
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const current = sections.flatMap((section) => section.items).find((item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to));
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'A';

  function signOut() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {sidebarOpen && <button className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-slate-200/70 bg-white/95 shadow-2xl shadow-slate-900/5 backdrop-blur-xl transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900/95 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6 dark:border-slate-800">
          <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/25"><img src={logo} alt="" className="h-full w-full object-cover" /></div>
          <div><p className="font-bold tracking-tight">BillXpress</p><p className="text-xs text-slate-400">Admin workspace</p></div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800" aria-label="Close sidebar">×</button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          {sections.map((section, index) => <div key={section.heading ?? 'main'} className={index ? 'mt-7' : ''}>
            {section.heading && <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[.16em] text-slate-400">{section.heading}</p>}
            <div className="space-y-1">{section.items.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20' : 'text-slate-600 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'}`}><Icon name={item.icon} /><span>{item.label}</span></NavLink>)}</div>
          </div>)}
        </nav>

        <div className="m-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">{initials}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user?.firstName} {user?.lastName}</p><p className="truncate text-xs text-slate-400">{user?.email}</p></div>
            <button onClick={signOut} title="Sign out" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" aria-label="Sign out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="m10 17 5-5-5-5m5 5H3m10-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></svg></button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 sm:px-6 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="mr-3 rounded-xl border border-slate-200 p-2.5 text-slate-600 lg:hidden dark:border-slate-700 dark:text-slate-300" aria-label="Open navigation"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          <div><p className="text-xs font-medium text-slate-400">Workspace</p><h2 className="font-semibold text-slate-800 dark:text-slate-100">{current?.label ?? 'Dashboard'}</h2></div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>}
            </button>
            <div className="ml-1 hidden h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white sm:grid">{initials}</div>
          </div>
        </header>

        <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden p-4 sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full bg-orange-300/20 blur-3xl dark:bg-orange-600/10" />
          <div className="pointer-events-none absolute -bottom-48 left-1/3 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-600/10" />
          <div key={location.pathname} className="page-enter relative mx-auto max-w-[1600px]"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
