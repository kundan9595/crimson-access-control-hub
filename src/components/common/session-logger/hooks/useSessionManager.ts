import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type {
  BaseActivityEntry,
  ActivitySession,
  SessionManagerHookResult,
  SessionService,
  SessionManagerConfig,
  ValidationFunction
} from '../types/sessionTypes';

interface UseSessionManagerProps<T extends BaseActivityEntry, SaveData = any> {
  referenceId: string;
  service: SessionService<T, SaveData>;
  config?: SessionManagerConfig;
  validateEntry?: ValidationFunction<T>;
  prepareSessionData?: (entries: T[]) => SaveData[];
  onSessionSaved?: () => void;
  onSessionDeleted?: () => void;
}

export function useSessionManager<T extends BaseActivityEntry, SaveData = any>({
  referenceId,
  service,
  config = {},
  validateEntry,
  prepareSessionData,
  onSessionSaved,
  onSessionDeleted
}: UseSessionManagerProps<T, SaveData>): SessionManagerHookResult<T> {
  const [sessions, setSessions] = useState<ActivitySession<T>[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Keep track of the reference ID to avoid stale closures
  const currentReferenceId = useRef(referenceId);
  currentReferenceId.current = referenceId;

  const defaultSessionNameFormat = (timestamp: Date) => 
    timestamp.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const loadSessions = useCallback(async () => {
    if (!currentReferenceId.current) return;
    
    try {
      setLoading(true);
      const loadedSessions = await service.loadSessions(currentReferenceId.current);
      setSessions(loadedSessions);
      
      // Set active session to the most recent one or first available
      if (loadedSessions.length > 0) {
        // Check if current active session still exists
        const currentSessionExists = activeSessionId && loadedSessions.some(s => s.id === activeSessionId);
        
        if (!currentSessionExists) {
          // Set to the "Today" session (unsaved) if it exists, otherwise the most recent session
          const todaySession = loadedSessions.find(s => !s.isSaved);
          const targetSession = todaySession || loadedSessions[loadedSessions.length - 1];
          setActiveSessionId(targetSession.id);
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load session data');
    } finally {
      setLoading(false);
    }
  }, [service, activeSessionId]);

  const saveSession = useCallback(async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || session.isSaved) {
      toast.error('Invalid session or session already saved');
      return;
    }

    try {
      setSaving(true);
      
      // Validate entries if validation function provided
      if (validateEntry) {
        for (const entry of session.entries) {
          const error = validateEntry(entry, sessions, sessionId);
          if (error) {
            // Don't show toast error - validation errors are already shown inline
            console.warn(`Validation error during save: ${error}`);
            return;
          }
        }
      }

      // Prepare session data for saving
      const sessionData = prepareSessionData 
        ? prepareSessionData(session.entries)
        : session.entries as unknown as SaveData[];

      // Generate session name
      const sessionNameFormat = config.sessionNameFormat || defaultSessionNameFormat;
      const sessionName = session.isSaved 
        ? session.name 
        : sessionNameFormat(new Date());

      // Save to service
      await service.saveSession(currentReferenceId.current, sessionName, sessionData);

      // Update status if service provides this functionality
      if (service.updateStatus) {
        await service.updateStatus(currentReferenceId.current);
      }

      // Mark session as saved
      setSessions(prevSessions =>
        prevSessions.map(s =>
          s.id === sessionId
            ? { ...s, isSaved: true, name: sessionName }
            : s
        )
      );

      // Reload sessions to get updated state
      await loadSessions();

      toast.success('Session saved successfully');
      onSessionSaved?.();

    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Failed to save session');
    } finally {
      setSaving(false);
    }
  }, [sessions, service, config, validateEntry, prepareSessionData, loadSessions, onSessionSaved]);

  const deleteSession = useCallback(async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      toast.error('Session not found');
      return;
    }

    if (!session.isSaved) {
      toast.error('Cannot delete unsaved sessions');
      return;
    }

    try {
      setDeleting(sessionId);
      
      // Delete from service
      await service.deleteSession(sessionId, currentReferenceId.current);

      // Update status if service provides this functionality
      if (service.updateStatus) {
        await service.updateStatus(currentReferenceId.current);
      }

      // Reload sessions to get updated state
      await loadSessions();

      toast.success('Session deleted successfully');
      onSessionDeleted?.();

    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    } finally {
      setDeleting(null);
    }
  }, [sessions, service, loadSessions, onSessionDeleted]);

  const updateEntry = useCallback((sessionId: string, entryId: string, updates: Partial<T>) => {
    setSessions(prevSessions =>
      prevSessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            entries: session.entries.map(entry =>
              entry.id === entryId
                ? { ...entry, ...updates }
                : entry
            )
          };
        }
        return session;
      })
    );
  }, []);

  const setActiveSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const clearValidationError = useCallback((key: string) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }, []);

  const setValidationError = useCallback((key: string, message: string) => {
    setValidationErrors(prev => ({
      ...prev,
      [key]: message
    }));
  }, []);

  return {
    sessions,
    activeSessionId,
    loading,
    saving,
    deleting,
    validationErrors,
    loadSessions,
    saveSession,
    deleteSession,
    updateEntry,
    setActiveSession,
    clearValidationError,
    setValidationError
  };
}
