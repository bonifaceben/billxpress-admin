import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export function useCardSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/v1/admin/cards/settings');
      setSettings(data.settings);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load card settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function update(payload) {
    const { data } = await apiClient.patch('/api/v1/admin/cards/settings', payload);
    setSettings(data.settings);
    return data;
  }

  return { settings, loading, error, refetch: fetch, update };
}
