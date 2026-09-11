import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export function useNotifications({ page = 1, limit = 20, type = '', userId = '' } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (type) params.type = type;
      if (userId) params.userId = userId;

      const { data } = await apiClient.get('/api/v1/admin/notifications', { params });

      const payload = data?.data ?? data ?? {};
      const items = Array.isArray(payload)
        ? payload
        : (payload.notifications ?? data?.notifications ?? []);
      const pagination = payload.pagination ?? data?.pagination ?? payload.meta ?? data?.meta ?? {};
      const total = Number(
        pagination.total ?? pagination.totalItems ?? payload.total ?? data?.total ?? items.length,
      );
      const currentPage = Number(
        pagination.page ?? pagination.currentPage ?? payload.page ?? data?.page ?? page,
      );
      const pageSize = Number(pagination.limit ?? pagination.pageSize ?? limit);
      const totalPages = Number(
        pagination.pages ?? pagination.totalPages ?? pagination.pageCount ??
        payload.totalPages ?? data?.totalPages ?? Math.ceil(total / pageSize),
      );

      setNotifications(Array.isArray(items) ? items : []);
      setMeta({
        total: Number.isFinite(total) ? total : items.length,
        page: Number.isFinite(currentPage) ? currentPage : page,
        totalPages: Number.isFinite(totalPages) ? Math.max(1, totalPages) : 1,
      });
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, type, userId]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  return { notifications, meta, loading, error, refetch: fetchNotifications };
}
