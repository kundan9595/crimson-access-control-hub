import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  dataFetchTime?: number;
  componentName: string;
}

interface UseWarehousePerformanceOptions {
  componentName: string;
  threshold?: number; // ms
  onPerformanceIssue?: (metrics: PerformanceMetrics) => void;
  trackMemory?: boolean;
  trackDataFetch?: boolean;
}

export const useWarehousePerformance = (options: UseWarehousePerformanceOptions) => {
  const { componentName, threshold = 200, onPerformanceIssue, trackMemory = true, trackDataFetch = true } = options;
  const renderStartTime = useRef<number>(0);
  const dataFetchStartTime = useRef<number>(0);
  const memoryStart = useRef<number>(0);

  const startRender = useCallback(() => {
    renderStartTime.current = performance.now();
    if (trackMemory && 'memory' in performance) {
      memoryStart.current = (performance as any).memory.usedJSHeapSize;
    }
  }, [trackMemory]);

  const endRender = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    let memoryUsage: number | undefined;
    if (trackMemory && 'memory' in performance) {
      const currentMemory = (performance as any).memory.usedJSHeapSize;
      memoryUsage = currentMemory - memoryStart.current;
    }

    const metrics: PerformanceMetrics = {
      renderTime,
      memoryUsage,
      componentName
    };

    // Log performance metrics
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render time: ${renderTime.toFixed(2)}ms`, {
        memoryUsage: memoryUsage ? `${(memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A',
        threshold: `${threshold}ms`
      });
    }

    // Alert if performance is below threshold
    if (renderTime > threshold && onPerformanceIssue) {
      onPerformanceIssue(metrics);
    }

    return metrics;
  }, [componentName, threshold, onPerformanceIssue, trackMemory]);

  const startDataFetch = useCallback(() => {
    if (trackDataFetch) {
      dataFetchStartTime.current = performance.now();
    }
  }, [trackDataFetch]);

  const endDataFetch = useCallback(() => {
    if (!trackDataFetch) return;

    const dataFetchTime = performance.now() - dataFetchStartTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Data fetch time: ${dataFetchTime.toFixed(2)}ms`);
    }

    return dataFetchTime;
  }, [componentName, trackDataFetch]);

  // Auto-track render performance
  useEffect(() => {
    startRender();
    return () => {
      endRender();
    };
  }, [startRender, endRender]);

  return {
    startRender,
    endRender,
    startDataFetch,
    endDataFetch,
    getMemoryUsage: useCallback(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    }, [])
  };
}; 