import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  timestamp: number;
}

interface UsePerformanceMonitoringOptions {
  componentName: string;
  enabled?: boolean;
  onMetrics?: (metrics: PerformanceMetrics) => void;
  threshold?: number; // Alert if render time exceeds this (ms)
}

export const usePerformanceMonitoring = ({
  componentName,
  enabled = process.env.NODE_ENV === 'development',
  onMetrics,
  threshold = 100
}: UsePerformanceMonitoringOptions) => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  const startRender = useCallback(() => {
    if (!enabled) return;
    renderStartTime.current = performance.now();
  }, [enabled]);

  const endRender = useCallback(() => {
    if (!enabled || renderStartTime.current === 0) return;

    const renderTime = performance.now() - renderStartTime.current;
    renderCount.current += 1;

    const metrics: PerformanceMetrics = {
      renderTime,
      timestamp: Date.now()
    };

    // Get memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    // Log performance data
    console.log(`[${componentName}] Render #${renderCount.current}:`, {
      renderTime: `${renderTime.toFixed(2)}ms`,
      memoryUsage: metrics.memoryUsage ? `${metrics.memoryUsage.toFixed(2)}MB` : 'N/A',
      timestamp: new Date(metrics.timestamp).toISOString()
    });

    // Alert if render time exceeds threshold
    if (renderTime > threshold) {
      console.warn(`[${componentName}] Slow render detected: ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }

    // Call custom metrics handler
    if (onMetrics) {
      onMetrics(metrics);
    }

    renderStartTime.current = 0;
  }, [enabled, componentName, threshold, onMetrics]);

  // Monitor component lifecycle - only run once on mount
  useEffect(() => {
    startRender();
    return () => {
      endRender();
    };
  }, []); // Empty dependency array to run only once

  // Monitor specific dependencies
  const monitorDependencies = useCallback((dependencies: any[]) => {
    useEffect(() => {
      startRender();
      return () => {
        endRender();
      };
    }, dependencies);
  }, []); // Remove dependencies to prevent infinite re-renders

  return {
    startRender,
    endRender,
    monitorDependencies,
    renderCount: renderCount.current
  };
};

// Hook for monitoring data fetching performance
export const useDataFetchingMonitor = (componentName: string) => {
  const fetchStartTime = useRef<number>(0);
  const fetchCount = useRef<number>(0);

  const startFetch = useCallback(() => {
    fetchStartTime.current = performance.now();
    console.log(`[${componentName}] Starting data fetch...`);
  }, [componentName]);

  const endFetch = useCallback((success: boolean, error?: Error) => {
    if (fetchStartTime.current === 0) return;

    const fetchTime = performance.now() - fetchStartTime.current;
    fetchCount.current += 1;

    console.log(`[${componentName}] Data fetch #${fetchCount.current}:`, {
      success,
      fetchTime: `${fetchTime.toFixed(2)}ms`,
      error: error?.message || 'None'
    });

    if (fetchTime > 1000) {
      console.warn(`[${componentName}] Slow data fetch detected: ${fetchTime.toFixed(2)}ms`);
    }

    fetchStartTime.current = 0;
  }, [componentName]);

  return {
    startFetch,
    endFetch,
    fetchCount: fetchCount.current
  };
};

// Hook for monitoring memory usage
export const useMemoryMonitor = (componentName: string, intervalMs = 5000) => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !('memory' in performance)) {
      return;
    }

    const interval = setInterval(() => {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const totalMB = memory.totalJSHeapSize / 1024 / 1024;
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;

      console.log(`[${componentName}] Memory Usage:`, {
        used: `${usedMB.toFixed(2)}MB`,
        total: `${totalMB.toFixed(2)}MB`,
        limit: `${limitMB.toFixed(2)}MB`,
        percentage: `${((usedMB / limitMB) * 100).toFixed(1)}%`
      });

      // Alert if memory usage is high
      if (usedMB / limitMB > 0.8) {
        console.warn(`[${componentName}] High memory usage detected: ${((usedMB / limitMB) * 100).toFixed(1)}%`);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [componentName, intervalMs]);
}; 