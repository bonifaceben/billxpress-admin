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

      // Support both { notifications, total, page, totalPages } and { data, meta } shapes
      const items = data.notifications ?? data.data ?? [];
      setNotifications(items);
      setMeta({
        total: data.total ?? data.meta?.total ?? items.length,
        page: data.page ?? data.meta?.page ?? page,
        totalPages: data.totalPages ?? data.meta?.totalPages ?? Math.ceil((data.total ?? items.length) / limit),
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
