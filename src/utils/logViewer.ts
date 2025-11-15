/**
 * Browser-based log viewer for Supabase Edge Functions
 * 
 * Usage in browser console:
 *   import { fetchEdgeFunctionLogs } from '@/utils/logViewer'
 *   await fetchEdgeFunctionLogs('reset-password')
 */

import { supabase } from '@/integrations/supabase/client';
import { config } from '@/config/environment';

export interface EdgeFunctionLog {
  id: string;
  timestamp: number;
  level: string;
  event_message: string;
  event_type: string;
  function_id?: string;
}

/**
 * Fetch recent logs from Supabase Edge Functions
 * Note: This requires Management API access or you can use the CLI script instead
 */
export async function fetchEdgeFunctionLogs(functionName: string = 'reset-password'): Promise<EdgeFunctionLog[]> {
  console.log(`📊 Fetching logs for function: ${functionName}`);
  
  // Note: This would require Management API access
  // For now, we'll show instructions
  console.warn('⚠️ Direct log fetching requires Management API access.');
  console.log('💡 To view logs in real-time, run in terminal:');
  console.log(`   npm run logs:${functionName === 'reset-password' ? 'reset-password' : 'watch'} ${functionName}`);
  console.log('\n📋 Or check Supabase Dashboard:');
  console.log(`   Edge Functions > ${functionName} > Logs`);
  
  return [];
}

/**
 * Helper to format and display logs in console
 */
export function displayLogs(logs: EdgeFunctionLog[]) {
  console.group('📧 Edge Function Logs');
  
  logs.forEach(log => {
    const timestamp = new Date(log.timestamp / 1000).toLocaleTimeString();
    const level = log.level || 'info';
    const message = log.event_message || '';
    
    const style = level === 'error' ? 'color: red' : 
                  level === 'warn' ? 'color: orange' : 
                  level === 'info' ? 'color: cyan' : '';
    
    console.log(
      `%c[${timestamp}] [${level.toUpperCase()}] ${message}`,
      style
    );
  });
  
  console.groupEnd();
}

/**
 * Watch for new logs (polling)
 * This is a browser-based alternative to the CLI script
 */
export function watchLogs(functionName: string = 'reset-password', callback?: (logs: EdgeFunctionLog[]) => void) {
  console.log(`👀 Starting to watch logs for: ${functionName}`);
  console.log('💡 For real-time logs, use the CLI script: npm run logs:reset-password');
  
  // This would require WebSocket or polling via Management API
  // For now, just show instructions
  return () => {
    console.log('👋 Stopped watching logs');
  };
}

