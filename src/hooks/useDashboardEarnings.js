import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export function useDashboardEarnings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/v1/admin/dashboard/earnings');
      // Support both the documented direct response and APIs that wrap it in `data`.
      setData(data?.data ?? data);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load dashboard earnings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
