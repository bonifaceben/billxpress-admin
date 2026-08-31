import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

const BASE = '/api/v1/admin/services/data/datashare';
const unwrap = (data) => data?.data ?? data ?? {};
const message = (error, fallback) => error?.response?.data?.message ?? fallback;

export function useDataShare() {
  const [summary, setSummary] = useState(null);
  const [sims, setSims] = useState([]);
  const [batches, setBatches] = useState([]);
  const [usages, setUsages] = useState([]);
  const [counts, setCounts] = useState({ sims: 0, batches: 0, usages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    const { data } = await apiClient.get(`${BASE}/summary`);
    setSummary(unwrap(data).summary ?? unwrap(data));
  }, []);

  const loadSims = useCallback(async (params = {}) => {
    const { data } = await apiClient.get(`${BASE}/sims`, { params });
    const payload = unwrap(data);
    const list = payload.sims ?? [];
    setSims(list);
    setCounts((old) => ({ ...old, sims: payload.count ?? list.length }));
  }, []);

  const loadBatches = useCallback(async (params = {}) => {
    const { data } = await apiClient.get(`${BASE}/batches`, { params });
    const payload = unwrap(data);
    const list = payload.batches ?? payload.stock ?? [];
    setBatches(list);
    setCounts((old) => ({ ...old, batches: payload.count ?? list.length }));
  }, []);

  const loadUsages = useCallback(async (params = {}) => {
    const { data } = await apiClient.get(`${BASE}/usages`, { params });
    const payload = unwrap(data);
    const list = payload.usages ?? payload.usage ?? [];
    setUsages(list);
    setCounts((old) => ({ ...old, usages: payload.count ?? list.length }));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadSummary(), loadSims(), loadBatches(), loadUsages()]);
    } catch (err) {
      setError(message(err, 'Failed to load DataShare inventory.'));
    } finally {
      setLoading(false);
    }
  }, [loadSummary, loadSims, loadBatches, loadUsages]);

  useEffect(() => { refresh(); }, [refresh]);

  async function mutate(request, successRefresh = true) {
    try {
      const { data } = await request();
      if (successRefresh) await refresh();
      return unwrap(data);
    } catch (err) {
      throw new Error(message(err, 'The request could not be completed.'));
    }
  }

  return {
    summary, sims, batches, usages, counts, loading, error, refresh,
    loadSims, loadBatches, loadUsages,
    createSim: (body) => mutate(() => apiClient.post(`${BASE}/sims`, body)),
    updateSim: (id, body) => mutate(() => apiClient.patch(`${BASE}/sims/${id}`, body)),
    reloadSim: (id) => mutate(() => apiClient.post(`${BASE}/sims/${id}/reload`)),
    createBatch: (body) => mutate(() => apiClient.post(`${BASE}/batches`, body)),
    updateBatch: (id, body) => mutate(() => apiClient.patch(`${BASE}/batches/${id}`, body)),
  };
}
