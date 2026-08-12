import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export function useTransferSettings() {
  const [setting, setSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/v1/admin/transfers/settings');
      setSetting(data.setting);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load transfer settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function update(payload) {
    const { data } = await apiClient.patch('/api/v1/admin/transfers/settings', payload);
    setSetting(data.setting ?? data);
    return data;
  }

  return { setting, loading, error, refetch: fetch, update };
}
