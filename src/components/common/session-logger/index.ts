// Core Session Logger exports
export { SessionLoggerModal } from './SessionLoggerModal';
export { SessionTabs } from './SessionTabs';
export { SessionTable } from './SessionTable';

// Hooks
export { useSessionManager } from './hooks/useSessionManager';
export { useQuantityValidation } from './hooks/useQuantityValidation';
export { usePendingCalculations } from './hooks/usePendingCalculations';

// Types
export type {
  BaseActivityEntry,
  ActivitySession,
  SessionValidationError,
  SessionManagerConfig,
  SessionManagerHookResult,
  SessionService,
  ValidationFunction,
  QuantityCalculationFunction
} from './types/sessionTypes';

// Re-export hook result types for convenience
export type { UseQuantityValidationResult } from './hooks/useQuantityValidation';
export type { UsePendingCalculationsResult } from './hooks/usePendingCalculations';
