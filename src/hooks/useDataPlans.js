import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export function useDataPlans() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/v1/services/data/plans');
      setData(data);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load data plans.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
