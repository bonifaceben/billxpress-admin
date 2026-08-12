import { useState, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export function useCardRates({ amountNgn = 10000, amountUsd = 10 } = {}) {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/v1/admin/cards/rates', {
        params: { amountNgn, amountUsd },
      });
      setRates(data.rates);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to fetch live rates.');
    } finally {
      setLoading(false);
    }
  }, [amountNgn, amountUsd]);

  // No auto-fetch — rates change at any time, user should trigger manually
  return { rates, loading, error, refetch: fetch };
}
