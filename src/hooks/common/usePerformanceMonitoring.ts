import { useCallback, useEffect, useRef, useState } from 'react';

// Performance metrics interface
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  timestamp: number;
  componentName: string;
  error?: Error;
}

// Performance monitoring options
export interface PerformanceMonitoringOptions {
  componentName: string;
  enabled?: boolean;
  threshold?: number;
  onMetrics?: (metrics: PerformanceMetrics) => void;
  onPerformanceIssue?: (metrics: PerformanceMetrics) => void;
  trackMemory?: boolean;
  trackErrors?: boolean;
}

// Performance monitoring result
export interface PerformanceMonitoringResult {
  startRender: () => void;
  endRender: () => void;
  trackError: (error: Error) => void;
  measureRender: <T>(renderFn: () => T) => T;
  measureAsync: <T>(name: string, asyncFn: () => Promise<T>) => Promise<T>;
  metrics: PerformanceMetrics[];
  averageRenderTime: number;
  totalRenders: number;
  performanceIssues: PerformanceMetrics[];
}

// Performance monitoring hook
export const usePerformanceMonitoring = ({
  componentName,
  enabled = process.env.NODE_ENV === 'development',
  threshold = 100,
  onMetrics,
  onPerformanceIssue,
  trackMemory = true,
  trackErrors = true
}: PerformanceMonitoringOptions): PerformanceMonitoringResult => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [performanceIssues, setPerformanceIssues] = useState<PerformanceMetrics[]>([]);

  // Store stable references to avoid dependency issues
  const onMetricsRef = useRef(onMetrics);
  const onPerformanceIssueRef = useRef(onPerformanceIssue);
  const enabledRef = useRef(enabled);
  const thresholdRef = useRef(threshold);
  const trackMemoryRef = useRef(trackMemory);
  const trackErrorsRef = useRef(trackErrors);

  // Update refs when props change
  useEffect(() => {
    onMetricsRef.current = onMetrics;
    onPerformanceIssueRef.current = onPerformanceIssue;
    enabledRef.current = enabled;
    thresholdRef.current = threshold;
    trackMemoryRef.current = trackMemory;
    trackErrorsRef.current = trackErrors;
  }, [onMetrics, onPerformanceIssue, enabled, threshold, trackMemory, trackErrors]);

  const startRender = useCallback(() => {
    if (!enabledRef.current) return;
    renderStartTime.current = performance.now();
  }, []);

  const endRender = useCallback(() => {
    if (!enabledRef.current || renderStartTime.current === 0) return;

    const renderTime = performance.now() - renderStartTime.current;
    renderCount.current += 1;

    const performanceMetric: PerformanceMetrics = {
      renderTime,
      timestamp: Date.now(),
      componentName
    };

    // Get memory usage if available and enabled
    if (trackMemoryRef.current && 'memory' in performance) {
      const memory = (performance as any).memory;
      performanceMetric.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    // Log performance data in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render #${renderCount.current}:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        memoryUsage: performanceMetric.memoryUsage ? `${performanceMetric.memoryUsage.toFixed(2)}MB` : 'N/A',
        timestamp: new Date(performanceMetric.timestamp).toISOString()
      });
    }

    // Check if render time exceeds threshold
    if (renderTime > thresholdRef.current) {
      const issueMetric = { ...performanceMetric };
      setPerformanceIssues(prev => [...prev, issueMetric]);
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[${componentName}] Slow render detected: ${renderTime.toFixed(2)}ms (threshold: ${thresholdRef.current}ms)`);
      }

      // Call performance issue handler
      if (onPerformanceIssueRef.current) {
        onPerformanceIssueRef.current(issueMetric);
      }
    }

    // Update metrics
    setMetrics(prev => [...prev, performanceMetric]);

    // Call custom metrics handler
    if (onMetricsRef.current) {
      onMetricsRef.current(performanceMetric);
    }

    renderStartTime.current = 0;
  }, []); // Remove componentName dependency to prevent infinite re-renders

  const trackError = useCallback((error: Error) => {
    if (!enabledRef.current || !trackErrorsRef.current) return;

    const errorMetric: PerformanceMetrics = {
      renderTime: 0,
      timestamp: Date.now(),
      componentName,
      error
    };

    setMetrics(prev => [...prev, errorMetric]);

    if (process.env.NODE_ENV === 'development') {
      console.error(`[${componentName}] Error tracked:`, error);
    }

    // Call custom metrics handler
    if (onMetricsRef.current) {
      onMetricsRef.current(errorMetric);
    }
  }, []); // Remove componentName dependency to prevent infinite re-renders

  // Monitor component lifecycle - only run once on mount
  useEffect(() => {
    startRender();
    return () => {
      endRender();
    };
  }, []); // Empty dependency array to run only once

  // Calculate average render time
  const averageRenderTime = metrics.length > 0 
    ? metrics.reduce((sum, metric) => sum + metric.renderTime, 0) / metrics.length 
    : 0;

  // Measure render function
  const measureRender = useCallback(<T>(renderFn: () => T): T => {
    startRender();
    const result = renderFn();
    endRender();
    return result;
  }, []); // Remove dependencies to prevent infinite re-renders

  // Measure async function
  const measureAsync = useCallback(async <T>(name: string, asyncFn: () => Promise<T>): Promise<T> => {
    const startTime = performance.now();
    try {
      const result = await asyncFn();
      const duration = performance.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${componentName}] ${name}: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      trackError(error as Error);
      throw error;
    }
  }, []); // Remove dependencies to prevent infinite re-renders

  return {
    startRender,
    endRender,
    trackError,
    measureRender,
    measureAsync,
    metrics,
    averageRenderTime,
    totalRenders: renderCount.current,
    performanceIssues
  };
};

// Hook for monitoring specific dependencies
export const useDependencyMonitoring = (
  dependencies: any[],
  options: PerformanceMonitoringOptions
) => {
  const { startRender, endRender } = usePerformanceMonitoring(options);

  useEffect(() => {
    startRender();
    return () => {
      endRender();
    };
  }, dependencies);
};

// Hook for monitoring async operations
export const useAsyncMonitoring = (
  options: PerformanceMonitoringOptions
) => {
  const { startRender, endRender, trackError } = usePerformanceMonitoring(options);

  const monitorAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    startRender();
    
    try {
      const result = await asyncFn();
      endRender();
      return result;
    } catch (error) {
      trackError(error as Error);
      throw error;
    }
  }, [startRender, endRender, trackError]);

  return { monitorAsync };
};

// Performance monitoring context for global monitoring
export interface GlobalPerformanceContext {
  trackComponentRender: (componentName: string, renderTime: number) => void;
  trackError: (componentName: string, error: Error) => void;
  getPerformanceReport: () => {
    totalComponents: number;
    averageRenderTime: number;
    slowestComponent: string;
    errorCount: number;
  };
}

// Performance monitoring provider
export const useGlobalPerformanceMonitoring = (): GlobalPerformanceContext => {
  const [globalMetrics, setGlobalMetrics] = useState<Map<string, PerformanceMetrics[]>>(new Map());

  const trackComponentRender = useCallback((componentName: string, renderTime: number) => {
    setGlobalMetrics(prev => {
      const newMap = new Map(prev);
      const componentMetrics = newMap.get(componentName) || [];
      newMap.set(componentName, [...componentMetrics, {
        renderTime,
        timestamp: Date.now(),
        componentName
      }]);
      return newMap;
    });
  }, []);

  const trackError = useCallback((componentName: string, error: Error) => {
    setGlobalMetrics(prev => {
      const newMap = new Map(prev);
      const componentMetrics = newMap.get(componentName) || [];
      newMap.set(componentName, [...componentMetrics, {
        renderTime: 0,
        timestamp: Date.now(),
        componentName,
        error
      }]);
      return newMap;
    });
  }, []);

  const getPerformanceReport = useCallback(() => {
    let totalComponents = 0;
    let totalRenderTime = 0;
    let slowestComponent = '';
    let maxRenderTime = 0;
    let errorCount = 0;

    globalMetrics.forEach((metrics, componentName) => {
      totalComponents += metrics.length;
      
      metrics.forEach(metric => {
        if (metric.error) {
          errorCount++;
        } else {
          totalRenderTime += metric.renderTime;
          if (metric.renderTime > maxRenderTime) {
            maxRenderTime = metric.renderTime;
            slowestComponent = componentName;
          }
        }
      });
    });

    return {
      totalComponents,
      averageRenderTime: totalComponents > 0 ? totalRenderTime / totalComponents : 0,
      slowestComponent,
      errorCount
    };
  }, [globalMetrics]);

  return {
    trackComponentRender,
    trackError,
    getPerformanceReport
  };
};
