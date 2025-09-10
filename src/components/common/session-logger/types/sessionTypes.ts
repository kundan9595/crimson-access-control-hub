// Core session and activity types for the Session-Based Activity Logger system

export interface BaseActivityEntry {
  id: string;
  item_type: 'sku' | 'misc';
  item_id: string;
  sku_id?: string;
  sku_code?: string;
  sku_name?: string;
  size_id?: string;
  size_name?: string;
  size_code?: string;
  misc_name?: string;
  ordered: number;
}

export interface ActivitySession<T extends BaseActivityEntry> {
  id: string;
  name: string;
  timestamp: Date;
  isSaved: boolean;
  entries: T[];
}

export interface SessionValidationError {
  entryId: string;
  field: string;
  message: string;
}

export interface SessionManagerConfig {
  maxPendingExceedance?: boolean;
  allowNegativeQuantities?: boolean;
  autoSave?: boolean;
  sessionNameFormat?: (timestamp: Date) => string;
}

export interface SessionManagerHookResult<T extends BaseActivityEntry> {
  sessions: ActivitySession<T>[];
  activeSessionId: string | null;
  loading: boolean;
  saving: boolean;
  deleting: string | null;
  validationErrors: Record<string, string>;
  
  // Actions
  loadSessions: () => Promise<void>;
  saveSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  updateEntry: (sessionId: string, entryId: string, updates: Partial<T>) => void;
  setActiveSession: (sessionId: string) => void;
  clearValidationError: (key: string) => void;
  setValidationError: (key: string, message: string) => void;
}

export interface SessionService<T extends BaseActivityEntry, SaveData = any> {
  loadSessions: (referenceId: string) => Promise<ActivitySession<T>[]>;
  saveSession: (referenceId: string, sessionName: string, sessionData: SaveData[]) => Promise<string>;
  deleteSession: (sessionId: string, referenceId: string) => Promise<void>;
  updateStatus?: (referenceId: string) => Promise<void>;
}

// Validation function type
export type ValidationFunction<T extends BaseActivityEntry> = (
  entry: T,
  sessions: ActivitySession<T>[],
  sessionId: string
) => string | null;

// Quantity calculation function type  
export type QuantityCalculationFunction<T extends BaseActivityEntry> = (
  entry: T,
  sessions: ActivitySession<T>[],
  currentSessionId: string
) => number;
