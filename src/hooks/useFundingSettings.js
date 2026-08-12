import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export function useFundingSettings() {
  const [data, setData] = useState(null); // { providerSettings, settings }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await apiClient.get('/api/v1/admin/funding/settings');
      setData({ providerSettings: res.providerSettings, settings: res.settings ?? [] });
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load funding settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // payload can be { oneTimeFundingProvider } OR { provider, percent, flat, cap?, creditPolicy? }
  async function update(payload) {
    const { data: res } = await apiClient.patch('/api/v1/admin/funding/settings', payload);
    setData((prev) => {
      const next = { ...prev };
      if (res.providerSettings) next.providerSettings = res.providerSettings;
      if (res.setting) {
        next.settings = prev.settings.map((s) =>
          s.provider === res.setting.provider ? res.setting : s
        );
      }
      return next;
    });
    return res;
  }

  return { data, loading, error, refetch: fetch, update };
}
