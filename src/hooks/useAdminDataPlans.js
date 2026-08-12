import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export function useAdminDataPlans({
  provider = 'smeplug',
  network = '',
  type = '',
  isEnabled = '',
  providerAvailable = '',
} = {}) {
  const [plans, setPlans] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { provider };
      if (network) params.network = network;
      if (type) params.type = type;
      if (isEnabled !== '') params.isEnabled = isEnabled;
      if (providerAvailable !== '') params.providerAvailable = providerAvailable;

      const { data } = await apiClient.get('/api/v1/admin/services/data/plans', { params });
      const list = data.plans ?? data.data ?? [];
      setPlans(list);
      setCount(data.count ?? data.total ?? list.length);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load plans.');
    } finally {
      setLoading(false);
    }
  }, [provider, network, type, isEnabled, providerAvailable]);

  useEffect(() => { fetch(); }, [fetch]);

  async function syncPlans() {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const { data } = await apiClient.post('/api/v1/admin/services/data/plans/sync');
      setSyncResult(data);
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Sync failed.';
      setSyncError(msg);
      throw new Error(msg);
    } finally {
      setSyncing(false);
    }
  }

  async function updatePlan(id, payload) {
    const { data } = await apiClient.patch(`/api/v1/admin/services/data/plans/${id}`, payload);
    const updated = data.plan ?? data;
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    return data;
  }

  return { plans, count, loading, error, syncing, syncResult, syncError, refetch: fetch, syncPlans, updatePlan };
}
