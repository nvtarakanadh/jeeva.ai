// Performance monitoring utilities

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric>();
  private enabled = process.env.NODE_ENV === 'development';

  start(name: string): void {
    if (!this.enabled) return;
    
    this.metrics.set(name, {
      name,
      startTime: performance.now()
    });
  }

  end(name: string): number | null {
    if (!this.enabled) return null;
    
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;

    // Log slow operations
    if (duration > 1000) {
      console.warn(`🐌 Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    } else if (duration > 500) {
      console.log(`⏱️ Operation: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  clear(): void {
    this.metrics.clear();
  }

  // Get performance summary
  getSummary(): { totalOperations: number; averageDuration: number; slowOperations: number } {
    const metrics = this.getAllMetrics();
    const completedMetrics = metrics.filter(m => m.duration !== undefined);
    
    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = completedMetrics.length > 0 ? totalDuration / completedMetrics.length : 0;
    const slowOperations = completedMetrics.filter(m => (m.duration || 0) > 1000).length;

    return {
      totalOperations: completedMetrics.length,
      averageDuration,
      slowOperations
    };
  }
}

export const perfMonitor = new PerformanceMonitor();

// Higher-order function to measure performance
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  name?: string
): T {
  return ((...args: any[]) => {
    const metricName = name || fn.name || 'anonymous';
    perfMonitor.start(metricName);
    
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          perfMonitor.end(metricName);
        });
      }
      
      perfMonitor.end(metricName);
      return result;
    } catch (error) {
      perfMonitor.end(metricName);
      throw error;
    }
  }) as T;
}

// React hook for measuring component render performance
export function useRenderPerformance(componentName: string) {
  useEffect(() => {
    perfMonitor.start(`${componentName}-render`);
    
    return () => {
      perfMonitor.end(`${componentName}-render`);
    };
  });
}

// Utility to measure data fetching performance
export async function measureDataFetch<T>(
  name: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  perfMonitor.start(name);
  
  try {
    const result = await fetchFn();
    perfMonitor.end(name);
    return result;
  } catch (error) {
    perfMonitor.end(name);
    throw error;
  }
}

// Bundle size optimization utilities
export const bundleOptimizations = {
  // Lazy load components
  lazyLoad: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
  ) => {
    return React.lazy(importFn);
  },

  // Preload critical components
  preload: (importFn: () => Promise<any>) => {
    if (typeof window !== 'undefined') {
      importFn();
    }
  },

  // Dynamic imports with loading states
  dynamicImport: async <T>(
    importFn: () => Promise<T>,
    fallback?: React.ReactNode
  ) => {
    try {
      return await importFn();
    } catch (error) {
      console.error('Dynamic import failed:', error);
      return fallback || null;
    }
  }
};

// Memory usage monitoring
export function getMemoryUsage() {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }
  return null;
}

// Network performance monitoring
export function measureNetworkPerformance(url: string): Promise<number> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    fetch(url, { method: 'HEAD' })
      .then(() => {
        const endTime = performance.now();
        resolve(endTime - startTime);
      })
      .catch(() => {
        resolve(-1); // Error indicator
      });
  });
}
