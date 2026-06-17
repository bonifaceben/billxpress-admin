import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navSections = [
  {
    items: [
      { to: '/', label: 'Overview', end: true },
      { to: '/users', label: 'Users' },
      { to: '/admins', label: 'Admins' },
      { to: '/notifications', label: 'Notifications' },
      { to: '/referral-rewards', label: 'Referral Rewards' },
    ],
  },
  {
    heading: 'Services',
    items: [
      { to: '/services/data-plans', label: 'Data Plans' },
      { to: '/services/data-settings', label: 'Data Settings' },
      { to: '/services/airtime-settings', label: 'Airtime Settings' },
      { to: '/services/social-growth-settings', label: 'Social Growth' },
    ],
  },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-60 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-5">
          <h1 className="text-lg font-semibold text-gray-900">BillXpress</h1>
          <p className="text-xs text-gray-500">Admin Dashboard</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navSections.map((section, si) => (
            <div key={si} className={si > 0 ? 'mt-5' : ''}>
              {section.heading && (
                <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {section.heading}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-orange-50 text-orange-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-200 px-4 py-4">
          <p className="truncate text-sm font-medium text-gray-900">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="truncate text-xs text-gray-500">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
