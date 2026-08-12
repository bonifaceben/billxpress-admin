import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export function useAdminCards({ page = 1, limit = 20, status = '', userId = '', maintenancePastDue = '' } = {}) {
  const [cards, setCards] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (status) params.status = status;
      if (userId) params.userId = userId;
      if (maintenancePastDue !== '') params.maintenancePastDue = maintenancePastDue;
      const { data } = await apiClient.get('/api/v1/admin/cards', { params });
      setCards(data.cards ?? []);
      setTotal(data.total ?? data.count ?? 0);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load cards.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, userId, maintenancePastDue]);

  useEffect(() => { fetch(); }, [fetch]);

  return { cards, total, loading, error, refetch: fetch };
}
