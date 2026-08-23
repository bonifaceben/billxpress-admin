import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

function extractSettings(response) {
  return response?.data?.settings ?? response?.settings ?? response?.data ?? response;
}

export function useElectricitySettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/v1/admin/services/electricity/settings');
      setSettings(extractSettings(data));
    } catch (requestError) {
      setError(requestError?.response?.data?.message ?? 'Failed to load electricity settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  async function update(payload) {
    const { data } = await apiClient.patch('/api/v1/admin/services/electricity/settings', payload);
    setSettings(extractSettings(data));
    return data;
  }

  return { settings, loading, error, refetch: fetchSettings, update };
}
