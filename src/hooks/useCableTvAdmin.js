import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

function extractSettings(data) {
  return data?.data?.settings ?? data?.settings ?? data?.data ?? data;
}

export function useCableTvSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/v1/admin/services/cable-tv/settings');
      setSettings(extractSettings(data));
    } catch (requestError) {
      setError(requestError?.response?.data?.message ?? 'Failed to load Cable TV settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  async function updateSettings(payload) {
    const { data } = await apiClient.patch('/api/v1/admin/services/cable-tv/settings', payload);
    setSettings(extractSettings(data));
    return data;
  }

  return { settings, loading, error, refetch: fetchSettings, updateSettings };
}

export function useCableTvPackages(filters = {}) {
  const [packages, setPackages] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
      const { data } = await apiClient.get('/api/v1/admin/services/cable-tv/packages', { params });
      const payload = data?.data ?? data ?? {};
      const list = payload.packages ?? payload.plans ?? (Array.isArray(payload) ? payload : []);
      setPackages(Array.isArray(list) ? list : []);
      setCount(Number(payload.count ?? payload.total ?? list.length));
    } catch (requestError) {
      setError(requestError?.response?.data?.message ?? 'Failed to load Cable TV packages.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  async function syncPackages() {
    setSyncing(true);
    try {
      const { data } = await apiClient.post('/api/v1/admin/services/cable-tv/packages/sync');
      await fetchPackages();
      return data;
    } finally {
      setSyncing(false);
    }
  }

  async function updatePackage(id, payload) {
    const { data } = await apiClient.patch(`/api/v1/admin/services/cable-tv/packages/${id}`, payload);
    const updated = data?.data?.package ?? data?.package ?? data?.data ?? data;
    setPackages((current) => current.map((item) => (item.id === id || item._id === id ? { ...item, ...updated } : item)));
    return data;
  }

  return { packages, count, loading, error, syncing, refetch: fetchPackages, syncPackages, updatePackage };
}
