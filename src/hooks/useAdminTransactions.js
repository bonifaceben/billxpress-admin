import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

export function useAdminTransactions(filters = {}) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '' && value != null),
      );
      const { data } = await apiClient.get('/api/v1/admin/transactions', { params });
      const payload = data?.data ?? data ?? {};
      const items = payload.transactions ?? data?.transactions ?? [];
      const pageData = payload.pagination ?? data?.pagination ?? {};
      setTransactions(Array.isArray(items) ? items : []);
      setSummary(payload.summary ?? data?.summary ?? null);
      setPagination({
        page: Number(pageData.page ?? filters.page ?? 1),
        limit: Number(pageData.limit ?? filters.limit ?? 20),
        total: Number(pageData.total ?? items.length),
        pages: Math.max(1, Number(pageData.pages ?? pageData.totalPages ?? 1)),
      });
    } catch (requestError) {
      setError(requestError?.response?.data?.message ?? 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  return { transactions, summary, pagination, loading, error, refetch: fetchTransactions };
}
