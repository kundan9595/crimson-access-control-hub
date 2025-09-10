import { useCallback } from 'react';
import type {
  BaseActivityEntry,
  ActivitySession,
  QuantityCalculationFunction
} from '../types/sessionTypes';

interface QuantityFields {
  goodQuantity?: number;
  badQuantity?: number;
  quantity?: number;
  pending?: number;
  [key: string]: any;
}

interface PendingCalculationsConfig {
  includeGoodQuantity?: boolean;
  includeBadQuantity?: boolean;
  includeQuantity?: boolean;
  customCalculation?: QuantityCalculationFunction<any>;
}

export interface UsePendingCalculationsResult<T extends BaseActivityEntry> {
  calculatePendingQuantity: (
    entry: T & QuantityFields,
    sessions: ActivitySession<T & QuantityFields>[],
    currentSessionId?: string
  ) => number;
  
  calculateAllPendingQuantities: (
    sessions: ActivitySession<T & QuantityFields>[]
  ) => ActivitySession<T & QuantityFields>[];
  
  getTotalReceived: (
    entry: T & QuantityFields,
    sessions: ActivitySession<T & QuantityFields>[],
    excludeSessionId?: string
  ) => number;
  
  getSessionTotals: (
    session: ActivitySession<T & QuantityFields>
  ) => {
    totalGood: number;
    totalBad: number;
    totalQuantity: number;
    totalReceived: number;
  };
}

export function usePendingCalculations<T extends BaseActivityEntry>(
  config: PendingCalculationsConfig = {}
): UsePendingCalculationsResult<T> {
  
  const {
    includeGoodQuantity = true,
    includeBadQuantity = true,
    includeQuantity = true,
    customCalculation
  } = config;

  const getTotalReceived = useCallback((
    entry: T & QuantityFields,
    sessions: ActivitySession<T & QuantityFields>[],
    excludeSessionId?: string
  ): number => {
    let totalReceived = 0;
    
    sessions.forEach(session => {
      // Skip excluded session and only count saved sessions
      if (session.id === excludeSessionId || !session.isSaved) return;
      
      const sessionEntry = session.entries.find(e => {
        // Match by ID or by SKU+Size for SKU items, or by misc_name for misc items
        if (entry.item_type === 'sku' && e.item_type === 'sku') {
          return e.sku_id === entry.sku_id && e.size_id === entry.size_id;
        } else if (entry.item_type === 'misc' && e.item_type === 'misc') {
          return e.misc_name === entry.misc_name;
        }
        return e.id === entry.id;
      });
      
      if (sessionEntry) {
        let sessionTotal = 0;
        
        if (includeGoodQuantity) {
          sessionTotal += sessionEntry.goodQuantity || 0;
        }
        if (includeBadQuantity) {
          sessionTotal += sessionEntry.badQuantity || 0;
        }
        if (includeQuantity) {
          sessionTotal += sessionEntry.quantity || 0;
        }
        
        totalReceived += sessionTotal;
      }
    });
    
    return totalReceived;
  }, [includeGoodQuantity, includeBadQuantity, includeQuantity]);

  const calculatePendingQuantity = useCallback((
    entry: T & QuantityFields,
    sessions: ActivitySession<T & QuantityFields>[],
    currentSessionId?: string
  ): number => {
    if (customCalculation) {
      return customCalculation(entry, sessions, currentSessionId || '');
    }
    
    const totalReceived = getTotalReceived(entry, sessions, currentSessionId);
    return Math.max(0, entry.ordered - totalReceived);
  }, [customCalculation, getTotalReceived]);

  const calculateAllPendingQuantities = useCallback((
    sessions: ActivitySession<T & QuantityFields>[]
  ): ActivitySession<T & QuantityFields>[] => {
    return sessions.map(session => {
      if (session.isSaved) {
        // For saved sessions, calculate what was pending at the time this session was saved
        const sortedSessions = [...sessions]
          .filter(s => s.isSaved)
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        const updatedEntries = session.entries.map(entry => {
          let totalReceivedUpToThisSession = 0;
          
          for (const sortedSession of sortedSessions) {
            const sessionEntry = sortedSession.entries.find(e => {
              if (entry.item_type === 'sku' && e.item_type === 'sku') {
                return e.sku_id === entry.sku_id && e.size_id === entry.size_id;
              } else if (entry.item_type === 'misc' && e.item_type === 'misc') {
                return e.misc_name === entry.misc_name;
              }
              return e.id === entry.id;
            });
            
            if (sessionEntry) {
              let sessionTotal = 0;
              if (includeGoodQuantity) sessionTotal += sessionEntry.goodQuantity || 0;
              if (includeBadQuantity) sessionTotal += sessionEntry.badQuantity || 0;
              if (includeQuantity) sessionTotal += sessionEntry.quantity || 0;
              
              totalReceivedUpToThisSession += sessionTotal;
            }
            
            // Stop when we reach the current session
            if (sortedSession.id === session.id) break;
          }
          
          const remainingPending = Math.max(0, entry.ordered - totalReceivedUpToThisSession);
          return { ...entry, pending: remainingPending };
        });
        
        return { ...session, entries: updatedEntries };
      } else {
        // For unsaved sessions (like "Today"), calculate pending based on all saved sessions
        const updatedEntries = session.entries.map(entry => {
          const totalReceivedFromSavedSessions = getTotalReceived(entry, sessions);
          const remainingPending = Math.max(0, entry.ordered - totalReceivedFromSavedSessions);
          return { ...entry, pending: remainingPending };
        });
        
        return { ...session, entries: updatedEntries };
      }
    });
  }, [getTotalReceived, includeGoodQuantity, includeBadQuantity, includeQuantity]);

  const getSessionTotals = useCallback((
    session: ActivitySession<T & QuantityFields>
  ) => {
    const totals = session.entries.reduce(
      (acc, entry) => {
        acc.totalGood += entry.goodQuantity || 0;
        acc.totalBad += entry.badQuantity || 0;
        acc.totalQuantity += entry.quantity || 0;
        return acc;
      },
      { totalGood: 0, totalBad: 0, totalQuantity: 0, totalReceived: 0 }
    );
    
    totals.totalReceived = totals.totalGood + totals.totalBad + totals.totalQuantity;
    return totals;
  }, []);

  return {
    calculatePendingQuantity,
    calculateAllPendingQuantities,
    getTotalReceived,
    getSessionTotals
  };
}
