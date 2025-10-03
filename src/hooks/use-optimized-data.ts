import { useState, useEffect, useCallback } from 'react';
import { cacheService, createCacheKey, CACHE_TTL } from '@/services/cacheService';

interface UseOptimizedDataOptions<T> {
  cacheKey: string;
  fetchFn: () => Promise<T>;
  ttl?: number;
  dependencies?: any[];
  enabled?: boolean;
}

export function useOptimizedData<T>({
  cacheKey,
  fetchFn,
  ttl = CACHE_TTL.MEDIUM,
  dependencies = [],
  enabled = true
}: UseOptimizedDataOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = cacheService.get<T>(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      // Fetch fresh data
      const freshData = await fetchFn();
      
      // Cache the result
      cacheService.set(cacheKey, freshData, ttl);
      
      setData(freshData);
    } catch (err) {
      setError(err as Error);
      console.error(`Error fetching data for ${cacheKey}:`, err);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchFn, ttl, enabled, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    // Clear cache and refetch
    cacheService.delete(cacheKey);
    fetchData();
  }, [cacheKey, fetchData]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

// Hook for multiple parallel data fetches
export function useOptimizedDataList<T>(queries: UseOptimizedDataOptions<T>[]) {
  const [results, setResults] = useState<Array<{ data: T | null; loading: boolean; error: Error | null }>>(
    queries.map(() => ({ data: null, loading: true, error: null }))
  );

  useEffect(() => {
    const fetchAllData = async () => {
      const promises = queries.map(async (query, index) => {
        try {
          // Check cache first
          const cached = cacheService.get<T>(query.cacheKey);
          if (cached) {
            return { data: cached, loading: false, error: null };
          }

          // Fetch fresh data
          const freshData = await query.fetchFn();
          
          // Cache the result
          cacheService.set(query.cacheKey, freshData, query.ttl || CACHE_TTL.MEDIUM);
          
          return { data: freshData, loading: false, error: null };
        } catch (err) {
          return { data: null, loading: false, error: err as Error };
        }
      });

      const results = await Promise.all(promises);
      setResults(results);
    };

    if (queries.every(q => q.enabled !== false)) {
      fetchAllData();
    }
  }, [queries]);

  return results;
}

// Hook for paginated data
export function useOptimizedPaginatedData<T>({
  cacheKey,
  fetchFn,
  pageSize = 10,
  ttl = CACHE_TTL.MEDIUM,
  dependencies = []
}: {
  cacheKey: string;
  fetchFn: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>;
  pageSize?: number;
  ttl?: number;
  dependencies?: any[];
}) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPage = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const pageCacheKey = createCacheKey(cacheKey, 'page', page.toString());
      const cached = cacheService.get<{ data: T[]; total: number }>(pageCacheKey);
      
      if (cached) {
        setData(cached.data);
        setTotal(cached.total);
        setCurrentPage(page);
        setLoading(false);
        return;
      }

      const result = await fetchFn(page, pageSize);
      
      // Cache the result
      cacheService.set(pageCacheKey, result, ttl);
      
      setData(result.data);
      setTotal(result.total);
      setCurrentPage(page);
    } catch (err) {
      setError(err as Error);
      console.error(`Error fetching page ${page} for ${cacheKey}:`, err);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchFn, pageSize, ttl, ...dependencies]);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const goToPage = useCallback((page: number) => {
    loadPage(page);
  }, [loadPage]);

  const refetch = useCallback(() => {
    // Clear all page caches
    cacheService.clearPattern(`${cacheKey}:page:*`);
    loadPage(currentPage);
  }, [cacheKey, currentPage, loadPage]);

  return {
    data,
    total,
    currentPage,
    loading,
    error,
    goToPage,
    refetch,
    totalPages: Math.ceil(total / pageSize)
  };
}
