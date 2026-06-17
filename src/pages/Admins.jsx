import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/apiClient';
import { useAdmins } from '../hooks/useAdmins';

function Badge({ active }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function MakeAdminModal({ onClose, onSuccess }) {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiClient.patch(`/api/v1/admin/make-admin/${userId.trim()}`);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to promote user.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Make Admin</h2>
        <p className="mb-4 text-sm text-gray-500">
          Enter the User ID of an active user you want to promote to admin.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="userId" className="mb-1 block text-sm text-gray-700">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-md bg-gray-100 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none ring-1 ring-transparent focus:bg-white focus:ring-orange-500"
              placeholder="Paste user ID here"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex gap-3">
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
              {loading ? 'Promoting…' : 'Make Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({ admin, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Remove Admin</h2>
        <p className="mb-4 text-sm text-gray-600">
          Are you sure you want to remove admin access from{' '}
          <span className="font-medium text-gray-900">
            {admin.firstName} {admin.lastName}
          </span>
          ? They will become a regular user.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? 'Removing…' : 'Remove Admin'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Admins() {
  const { user: currentUser } = useAuth();
  const { admins, loading, error, refetch } = useAdmins();

  const [showMakeModal, setShowMakeModal] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  async function handleRemoveAdmin() {
    setRemoveLoading(true);
    setRemoveError(null);
    try {
      await apiClient.patch(`/api/v1/admin/remove-admin/${confirmTarget.id}`);
      setSuccessMsg(`Admin access removed from ${confirmTarget.firstName} ${confirmTarget.lastName}.`);
      setConfirmTarget(null);
      refetch();
    } catch (err) {
      setRemoveError(err?.response?.data?.message ?? 'Failed to remove admin.');
    } finally {
      setRemoveLoading(false);
    }
  }

  function handleMakeSuccess() {
    setSuccessMsg('User promoted to admin successfully.');
    refetch();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admins</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage all admin accounts on the platform.</p>
        </div>
        <button
          onClick={() => { setSuccessMsg(null); setShowMakeModal(true); }}
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          + Make Admin
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 flex items-center justify-between rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-4 text-green-500 hover:text-green-700">✕</button>
        </div>
      )}

      {removeError && (
        <div className="mb-4 flex items-center justify-between rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {removeError}
          <button onClick={() => setRemoveError(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            Loading admins…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={refetch} className="text-sm text-orange-500 hover:underline">
              Try again
            </button>
          </div>
        ) : admins.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            No admins found.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {['Name', 'Username', 'Email', 'Phone', 'Auth Tier', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {admins.map((admin) => {
                const isSelf = admin.id === currentUser?.id;
                return (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {admin.firstName} {admin.lastName}
                      {isSelf && (
                        <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-600">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">@{admin.username}</td>
                    <td className="px-4 py-3 text-gray-600">{admin.email}</td>
                    <td className="px-4 py-3 text-gray-600">{admin.phone}</td>
                    <td className="px-4 py-3 text-gray-500">{admin.authTier}</td>
                    <td className="px-4 py-3">
                      <Badge active={admin.isActive} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={isSelf}
                        onClick={() => { setRemoveError(null); setSuccessMsg(null); setConfirmTarget(admin); }}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title={isSelf ? "You can't remove your own admin role" : 'Remove admin role'}
                      >
                        Remove Admin
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && !error && (
          <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
            {admins.length} admin{admins.length !== 1 ? 's' : ''} total
          </div>
        )}
      </div>

      {confirmTarget && (
        <ConfirmModal
          admin={confirmTarget}
          onConfirm={handleRemoveAdmin}
          onClose={() => setConfirmTarget(null)}
          loading={removeLoading}
        />
      )}

      {showMakeModal && (
        <MakeAdminModal
          onClose={() => setShowMakeModal(false)}
          onSuccess={handleMakeSuccess}
        />
      )}
    </div>
  );
}
