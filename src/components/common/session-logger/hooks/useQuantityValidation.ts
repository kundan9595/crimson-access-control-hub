import { useCallback } from 'react';
import type {
  BaseActivityEntry,
  ActivitySession,
  ValidationFunction
} from '../types/sessionTypes';

interface QuantityValidationConfig {
  allowNegative?: boolean;
  maxExceedanceAllowed?: boolean;
  customValidators?: ValidationFunction<any>[];
}

interface QuantityFields {
  goodQuantity?: number;
  badQuantity?: number;
  quantity?: number;
  [key: string]: any;
}

export interface UseQuantityValidationResult<T extends BaseActivityEntry> {
  validateQuantityEntry: ValidationFunction<T & QuantityFields>;
  validateQuantityUpdate: (
    sessionId: string,
    entryId: string,
    field: string,
    value: number,
    sessions: ActivitySession<T & QuantityFields>[]
  ) => string | null;
}

export function useQuantityValidation<T extends BaseActivityEntry>(
  config: QuantityValidationConfig = {}
): UseQuantityValidationResult<T> {
  
  const calculatePendingQuantity = useCallback((
    entry: T & QuantityFields,
    sessions: ActivitySession<T & QuantityFields>[],
    currentSessionId: string
  ): number => {
    let totalReceivedInSavedSessions = 0;
    
    // Calculate total received from all saved sessions (excluding current session)
    sessions.forEach(session => {
      if (session.isSaved && session.id !== currentSessionId) {
        const sessionEntry = session.entries.find(e => e.id === entry.id);
        if (sessionEntry) {
          const goodQty = sessionEntry.goodQuantity || 0;
          const badQty = sessionEntry.badQuantity || 0;
          const qty = sessionEntry.quantity || 0;
          totalReceivedInSavedSessions += goodQty + badQty + qty;
        }
      }
    });
    
    return Math.max(0, entry.ordered - totalReceivedInSavedSessions);
  }, []);

  const validateQuantityEntry = useCallback<ValidationFunction<T & QuantityFields>>((
    entry,
    sessions,
    sessionId
  ) => {
    const { allowNegative = false, maxExceedanceAllowed = false } = config;
    
    // Basic negative quantity check
    const goodQty = entry.goodQuantity || 0;
    const badQty = entry.badQuantity || 0;
    const qty = entry.quantity || 0;
    
    if (!allowNegative) {
      if (goodQty < 0) return 'Good quantity cannot be negative';
      if (badQty < 0) return 'Bad quantity cannot be negative';
      if (qty < 0) return 'Quantity cannot be negative';
    }
    
    // Check against pending quantity if not allowed to exceed
    if (!maxExceedanceAllowed) {
      const pendingQuantity = calculatePendingQuantity(entry, sessions, sessionId);
      const totalEntered = goodQty + badQty + qty;
      
      if (totalEntered > pendingQuantity) {
        return `Total quantity (${totalEntered}) cannot exceed pending amount (${pendingQuantity})`;
      }
    }
    
    // Run custom validators if provided
    if (config.customValidators) {
      for (const validator of config.customValidators) {
        const error = validator(entry, sessions, sessionId);
        if (error) return error;
      }
    }
    
    return null;
  }, [config, calculatePendingQuantity]);

  const validateQuantityUpdate = useCallback((
    sessionId: string,
    entryId: string,
    field: string,
    value: number,
    sessions: ActivitySession<T & QuantityFields>[]
  ): string | null => {
    const { allowNegative = false, maxExceedanceAllowed = false } = config;
    
    // Find the current session and entry
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return 'Session not found';
    
    const entry = session.entries.find(e => e.id === entryId);
    if (!entry) return 'Entry not found';
    
    // Basic negative check
    if (!allowNegative && value < 0) {
      return 'Quantity cannot be negative';
    }
    
    // Calculate what the total would be with this update
    const goodQty = field === 'goodQuantity' ? value : (entry.goodQuantity || 0);
    const badQty = field === 'badQuantity' ? value : (entry.badQuantity || 0);
    const qty = field === 'quantity' ? value : (entry.quantity || 0);
    const totalWithUpdate = goodQty + badQty + qty;
    
    // Check against pending quantity if not allowed to exceed
    if (!maxExceedanceAllowed) {
      const pendingQuantity = calculatePendingQuantity(entry, sessions, sessionId);
      
      if (totalWithUpdate > pendingQuantity) {
        return `Total quantity (${totalWithUpdate}) cannot exceed pending amount (${pendingQuantity})`;
      }
    }
    
    return null;
  }, [config, calculatePendingQuantity]);

  return {
    validateQuantityEntry,
    validateQuantityUpdate
  };
}
