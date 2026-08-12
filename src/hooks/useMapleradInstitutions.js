import { useState, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export function useMapleradInstitutions() {
  const [institutions, setInstitutions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async ({ type = 'DYNAMIC', country = 'NG' } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/v1/admin/funding/maplerad/institutions', {
        params: { type, country },
      });
      setInstitutions(data.institutions ?? []);
      setMeta({ page: data.page, pageSize: data.pageSize, total: data.total, country: data.country, type: data.type });
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to fetch institutions.');
    } finally {
      setLoading(false);
    }
  }, []);

  // No auto-fetch — admin triggers manually
  return { institutions, meta, loading, error, fetch };
}
