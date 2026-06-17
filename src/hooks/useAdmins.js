import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export function useAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/v1/admin/admins');
      setAdmins(data.admins);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load admins.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  return { admins, loading, error, refetch: fetchAdmins };
}
