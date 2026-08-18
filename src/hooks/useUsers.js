import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

const EMPTY_PAGINATION = { page: 1, limit: 20, total: 0, pages: 1 };

export async function adjustUserWallet(userId, operation, payload) {
  if (!['credit', 'debit'].includes(operation)) {
    throw new Error('Invalid wallet operation.');
  }

  const { data } = await apiClient.post(
    `/api/v1/admin/users/${encodeURIComponent(userId)}/wallet/${operation}`,
    payload,
  );
  return data;
}

export function useUsers({ page = 1, limit = 20, search = '', role = '', status = '', authTier = '' } = {}) {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (role) params.role = role;
      if (status) params.status = status;
      if (authTier) params.authTier = authTier;

      const { data } = await apiClient.get('/api/v1/admin/users', { params });
      const payload = data?.data ?? data ?? {};
      const records = Array.isArray(payload) ? payload : (payload.users ?? []);
      const meta = payload.pagination ?? data?.pagination ?? payload.meta ?? data?.meta ?? {};
      const total = Number(meta.total ?? meta.totalItems ?? payload.total ?? data?.total ?? records.length);
      const currentPage = Number(meta.page ?? meta.currentPage ?? page);
      const pageSize = Number(meta.limit ?? meta.pageSize ?? limit);
      const pageCount = Number(meta.pages ?? meta.totalPages ?? meta.pageCount ?? Math.max(1, Math.ceil(total / pageSize)));

      setUsers(Array.isArray(records) ? records : []);
      setPagination({
        page: Number.isFinite(currentPage) ? currentPage : page,
        limit: Number.isFinite(pageSize) ? pageSize : limit,
        total: Number.isFinite(total) ? total : records.length,
        pages: Number.isFinite(pageCount) ? Math.max(1, pageCount) : 1,
      });
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, role, status, authTier]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return { users, pagination, loading, error, refetch: fetchUsers };
}
