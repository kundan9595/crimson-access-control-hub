import React from 'react';
import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trash2 } from 'lucide-react';
import type { BaseActivityEntry, ActivitySession } from './types/sessionTypes';

interface SessionTabsProps<T extends BaseActivityEntry> {
  sessions: ActivitySession<T>[];
  activeSessionId: string | null;
  onSessionChange: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  deleting: string | null;
  formatTimestamp?: (date: Date) => string;
  showDeleteButton?: boolean;
  className?: string;
}

const defaultFormatTimestamp = (date: Date): string => {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function SessionTabs<T extends BaseActivityEntry>({
  sessions,
  activeSessionId,
  onSessionChange,
  onDeleteSession,
  deleting,
  formatTimestamp = defaultFormatTimestamp,
  showDeleteButton = true,
  className = ''
}: SessionTabsProps<T>) {
  
  const handleDeleteClick = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    if (!session.isSaved) {
      // Could show a toast here, but we'll let the parent handle validation
      return;
    }
    
    onDeleteSession(sessionId);
  };

  if (sessions.length === 0) {
    return (
      <TabsList className={`flex justify-start w-full bg-transparent border-none ${className}`}>
        <div className="text-muted-foreground text-sm">No sessions available</div>
      </TabsList>
    );
  }

  return (
    <TabsList className={`flex justify-start w-full bg-transparent border-none ${className}`}>
      {sessions.map((session) => (
        <TabsTrigger 
          key={session.id} 
          value={session.id}
          className="flex items-center gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary group"
          onClick={() => onSessionChange(session.id)}
        >
          <span>
            {session.isSaved ? formatTimestamp(session.timestamp) : session.name}
          </span>
          
          {session.isSaved && showDeleteButton && (
            <div
              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground rounded-sm flex items-center justify-center cursor-pointer"
              onClick={(e) => handleDeleteClick(session.id, e)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDeleteClick(session.id, e as any);
                }
              }}
              aria-label={`Delete session ${session.name}`}
              style={{ pointerEvents: deleting === session.id ? 'none' : 'auto' }}
            >
              {deleting === session.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </div>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
