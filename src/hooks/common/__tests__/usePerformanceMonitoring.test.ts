import { renderHook, act } from '@testing-library/react';
import { usePerformanceMonitoring } from '../usePerformanceMonitoring';
import { vi } from 'vitest';

// Mock performance.now
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
  },
  writable: true,
});

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
global.console = mockConsole;

describe('usePerformanceMonitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
  });

  describe('Basic Functionality', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitoring({
          componentName: 'TestComponent',
        })
      );

      expect(result.current.metrics).toEqual([]);
      expect(result.current.totalRenders).toBe(0);
      expect(result.current.averageRenderTime).toBe(0);
      expect(result.current.performanceIssues).toEqual([]);
    });

    it('tracks render times', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitoring({
          componentName: 'TestComponent',
        })
      );

      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(50);

      act(() => {
        result.current.startRender();
        result.current.endRender();
      });

      expect(result.current.metrics).toHaveLength(1);
      expect(result.current.metrics[0].renderTime).toBe(50);
      expect(result.current.totalRenders).toBe(1);
      expect(result.current.averageRenderTime).toBe(50);
    });

    it('tracks multiple renders', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitoring({
          componentName: 'TestComponent',
        })
      );

      // First render
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(50);
      act(() => {
        result.current.startRender();
        result.current.endRender();
      });

      // Second render
      mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(180);
      act(() => {
        result.current.startRender();
        result.current.endRender();
      });

      expect(result.current.metrics).toHaveLength(2);
      expect(result.current.totalRenders).toBe(2);
      expect(result.current.averageRenderTime).toBe(65); // (50 + 80) / 2
    });
  });

  describe('Performance Thresholds', () => {
    it('detects slow renders when exceeding threshold', () => {
      const onPerformanceIssue = vi.fn();
      const { result } = renderHook(() =>
        usePerformanceMonitoring({
          componentName: 'TestComponent',
          threshold: 100,
          onPerformanceIssue,
        })
      );

      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(150);

      act(() => {
        result.current.startRender();
        result.current.endRender();
      });

      expect(result.current.performanceIssues).toHaveLength(1);
      expect(result.current.performanceIssues[0].renderTime).toBe(150);
      expect(onPerformanceIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          renderTime: 150,
          componentName: 'TestComponent',
        })
      );
    });

    it('does not flag fast renders as issues', () => {
      const onPerformanceIssue = vi.fn();
      const { result } = renderHook(() =>
        usePerformanceMonitoring({
          componentName: 'TestComponent',
          threshold: 100,
          onPerformanceIssue,
        })
      );

      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(50);

      act(() => {
        result.current.startRender();
        result.current.endRender();
      });

      expect(result.current.performanceIssues).toHaveLength(0);
      expect(onPerformanceIssue).not.toHaveBeenCalled();
    });
  });

  describe('Error Tracking', () => {
    it('tracks errors when enabled', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitoring({
          componentName: 'TestComponent',
          trackErrors: true,
        })
      );

      const testError = new Error('Test error');

      act(() => {
        result.current.trackError(testError);
      });

      expect(result.current.metrics).toHaveLength(1);
      expect(result.current.metrics[0].error).toBe(testError);
    });

    it('does not track errors when disabled', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitoring({
          componentName: 'TestComponent',
          trackErrors: false,
        })
      );

      const testError = new Error('Test error');

      act(() => {
        result.current.trackError(testError);
      });

      expect(result.current.metrics).toHaveLength(0);
    });
  });

  describe('Memory Tracking', () => {
    it('tracks memory usage when available and enabled', () => {
      // Mock memory API
      Object.defineProperty(global, 'performance', {
        value: {
          now: mockPerformanceNow,
          memory: {
            usedJSHeapSize: 50 * 1024 * 1024, // 50MB
          },
        },
        writable: true,
      });

      const { result } = renderHook(() =>
        usePerformanceMonitoring({
          componentName: 'TestComponent',
          trackMemory: true,
        })
      );

      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(50);

      act(() => {
        result.current.startRender();
        result.current.endRender();
      });

      expect(result.current.metrics[0].memoryUsage).toBe(50);
    });

    it('does not track memory when disabled', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitoring({
          componentName: 'TestComponent',
          trackMemory: false,
        })
      );

      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(50);

      act(() => {
        result.current.startRender();
        result.current.endRender();
      });

      expect(result.current.metrics[0].memoryUsage).toBeUndefined();
    });
  });

  describe('Development Logging', () => {
    it('logs performance data in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const { result } = renderHook(() =>
        usePerformanceMonitoring({
          componentName: 'TestComponent',
        })
      );

      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(50);

      act(() => {
        result.current.startRender();
        result.current.endRender();
      });

      expect(mockConsole.log).toHaveBeenCalledWith(
        '[TestComponent] Render #1:',
        expect.objectContaining({
          renderTime: '50.00ms',
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('logs warnings for slow renders in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const { result } = renderHook(() =>
        usePerformanceMonitoring({
          componentName: 'TestComponent',
          threshold: 100,
        })
      );

      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(150);

      act(() => {
        result.current.startRender();
        result.current.endRender();
      });

      expect(mockConsole.warn).toHaveBeenCalledWith(
        '[TestComponent] Slow render detected: 150.00ms (threshold: 100ms)'
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Custom Handlers', () => {
    it('calls custom metrics handler', () => {
      const onMetrics = vi.fn();
      const { result } = renderHook(() =>
        usePerformanceMonitoring({
          componentName: 'TestComponent',
          onMetrics,
        })
      );

      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(50);

      act(() => {
        result.current.startRender();
        result.current.endRender();
      });

      expect(onMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          renderTime: 50,
          componentName: 'TestComponent',
        })
      );
    });

    it('calls custom performance issue handler', () => {
      const onPerformanceIssue = vi.fn();
      const { result } = renderHook(() =>
        usePerformanceMonitoring({
          componentName: 'TestComponent',
          threshold: 100,
          onPerformanceIssue,
        })
      );

      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(150);

      act(() => {
        result.current.startRender();
        result.current.endRender();
      });

      expect(onPerformanceIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          renderTime: 150,
          componentName: 'TestComponent',
        })
      );
    });
  });

  describe('Disabled Mode', () => {
    it('does not track when disabled', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitoring({
          componentName: 'TestComponent',
          enabled: false,
        })
      );

      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(50);

      act(() => {
        result.current.startRender();
        result.current.endRender();
      });

      expect(result.current.metrics).toHaveLength(0);
      expect(result.current.totalRenders).toBe(0);
    });
  });
});
