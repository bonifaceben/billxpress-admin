import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export function useReferralRewards({ page = 1, limit = 20, status = '', referrerId = '', referredUserId = '' } = {}) {
  const [rewards, setRewards] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (status) params.status = status;
      if (referrerId) params.referrerId = referrerId;
      if (referredUserId) params.referredUserId = referredUserId;

      const { data } = await apiClient.get('/api/v1/admin/referrals/rewards', { params });
      setRewards(data.rewards ?? []);
      setPagination(data.pagination ?? { page, limit, total: 0, pages: 1 });
      setSettings(data.settings ?? null);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load referral rewards.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, referrerId, referredUserId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { rewards, pagination, settings, loading, error, refetch: fetch };
}
