import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { X, Save, Loader2 } from 'lucide-react';
import { SessionTabs } from './SessionTabs';
import { SessionTable } from './SessionTable';
import type { BaseActivityEntry, ActivitySession, SessionManagerHookResult } from './types/sessionTypes';

interface SessionLoggerModalProps<T extends BaseActivityEntry> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  sessionManager: SessionManagerHookResult<T>;
  tableColumns: Array<{
    key: string;
    header: string;
    width?: string;
    className?: string;
    render?: (entry: T, session: ActivitySession<T>) => React.ReactNode;
    align?: 'left' | 'center' | 'right';
  }>;
  quantityInputs?: Array<{
    field: string;
    label: string;
    min?: number;
    max?: (entry: T) => number;
    disabled?: (entry: T, session: ActivitySession<T>) => boolean;
  }>;
  onQuantityChange?: (sessionId: string, entryId: string, field: string, value: number) => void;
  showSaveButton?: boolean;
  saveButtonText?: string;
  emptyMessage?: string;
  formatTimestamp?: (date: Date) => string;
  className?: string;
  maxWidth?: string;
  maxHeight?: string;
  customValidation?: (session: ActivitySession<T>) => boolean;
}

export function SessionLoggerModal<T extends BaseActivityEntry>({
  isOpen,
  onClose,
  title,
  subtitle,
  sessionManager,
  tableColumns,
  quantityInputs = [],
  onQuantityChange,
  showSaveButton = true,
  saveButtonText = 'Save',
  emptyMessage = 'No items found for this session',
  formatTimestamp,
  className = '',
  maxWidth = 'max-w-6xl',
  maxHeight = 'max-h-[90vh]',
  customValidation
}: SessionLoggerModalProps<T>) {
  
  const {
    sessions,
    activeSessionId,
    loading,
    saving,
    deleting,
    validationErrors,
    loadSessions,
    saveSession,
    deleteSession,
    setActiveSession
  } = sessionManager;

  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [sessionToDelete, setSessionToDelete] = React.useState<string | null>(null);

  // Load sessions when modal opens
  useEffect(() => {
    if (isOpen && sessions.length === 0) {
      loadSessions();
    }
  }, [isOpen, loadSessions, sessions.length]);

  // Set active session when sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      // Check if current active session still exists
      const currentSessionExists = activeSessionId && sessions.some(s => s.id === activeSessionId);
      
      if (!currentSessionExists) {
        // Set to the "Today" session (unsaved) if it exists, otherwise the most recent session
        const todaySession = sessions.find(s => !s.isSaved);
        const targetSession = todaySession || sessions[sessions.length - 1];
        setActiveSession(targetSession.id);
      }
    }
  }, [sessions, activeSessionId, setActiveSession]);

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (sessionToDelete) {
      await deleteSession(sessionToDelete);
      setDeleteConfirmOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleSave = async () => {
    if (activeSessionId) {
      await saveSession(activeSessionId);
    }
  };

  const handleQuantityChange = (entryId: string, field: string, value: number) => {
    if (activeSessionId && onQuantityChange) {
      onQuantityChange(activeSessionId, entryId, field, value);
    }
  };

  const currentSession = sessions.find(s => s.id === activeSessionId);
  
  // Check if there's at least one entry with valid data
  const hasValidQuantities = currentSession && (
    customValidation 
      ? customValidation(currentSession)
      : currentSession.entries.some(entry => 
          'quantity' in entry && typeof entry.quantity === 'number' && entry.quantity > 0
        )
  );
  
  // Check if there are any validation errors
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  
  const canSave = currentSession && !currentSession.isSaved && showSaveButton && hasValidQuantities && !hasValidationErrors;

  // Debug logging
  React.useEffect(() => {
    console.log('🐛 SessionLoggerModal Debug:');
    console.log('- sessions:', sessions);
    console.log('- activeSessionId:', activeSessionId);
    console.log('- showSaveButton:', showSaveButton);
    console.log('- currentSession:', currentSession);
    console.log('- hasValidQuantities:', hasValidQuantities);
    console.log('- hasValidationErrors:', hasValidationErrors);
    console.log('- validationErrors:', validationErrors);
    console.log('- canSave:', canSave);
    if (sessions.length > 0) {
      sessions.forEach((session, index) => {
        console.log(`- Session ${index}:`, {
          id: session.id,
          name: session.name,
          isSaved: session.isSaved,
          entriesCount: session.entries.length
        });
      });
    }
  }, [sessions, activeSessionId, showSaveButton, currentSession, hasValidQuantities, canSave]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={`${maxWidth} ${maxHeight} flex flex-col ${className}`}>
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                {subtitle && (
                  <DialogDescription className="text-sm text-muted-foreground mt-1">
                    {subtitle}
                  </DialogDescription>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading session data...</span>
                </div>
              </div>
            ) : (
              <Tabs 
                value={activeSessionId || sessions[0]?.id || ''} 
                onValueChange={setActiveSession} 
                className="flex flex-col h-full"
              >
                <SessionTabs
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  onSessionChange={setActiveSession}
                  onDeleteSession={handleDeleteClick}
                  deleting={deleting}
                  formatTimestamp={formatTimestamp}
                />

                {sessions.map((session) => (
                  <TabsContent key={session.id} value={session.id} className="flex flex-col mt-4" style={{ height: 'calc(100% - 1rem)' }}>
                    <div className="flex-1 overflow-auto min-h-0">
                      <div className="pb-8 w-full">
                        <SessionTable
                          session={session}
                          columns={tableColumns}
                          quantityInputs={quantityInputs}
                          onQuantityChange={handleQuantityChange}
                          validationErrors={validationErrors}
                          emptyMessage={emptyMessage}
                          className="w-full"
                        />

                        {showSaveButton && !session.isSaved && (
                          <div className="flex justify-end mt-6 pt-4 border-t bg-background">
                            <Button 
                              onClick={() => {
                                console.log('🔥 SAVE BUTTON CLICKED!');
                                console.log('Session:', session);
                                console.log('showSaveButton:', showSaveButton);
                                console.log('session.isSaved:', session.isSaved);
                                console.log('hasValidQuantities:', hasValidQuantities);
                                handleSave();
                              }}
                              disabled={saving || !hasValidQuantities}
                              className="flex items-center gap-2"
                            >
                              {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              {saving ? 'Saving...' : saveButtonText}
                            </Button>
                          </div>
                        )}
                        
                        {/* Extra spacing to ensure button is fully visible */}
                        <div className="h-8"></div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this session? This action cannot be undone and will permanently remove all data associated with this session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting !== null}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
