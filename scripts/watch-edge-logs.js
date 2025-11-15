#!/usr/bin/env node

/**
 * Watch Supabase Edge Function logs in real-time
 * 
 * Usage:
 *   node scripts/watch-edge-logs.js [function-name]
 * 
 * Example:
 *   node scripts/watch-edge-logs.js reset-password
 */

const FUNCTION_NAME = process.argv[2] || 'reset-password';
const POLL_INTERVAL = 2000; // Poll every 2 seconds
const MAX_LOG_AGE = 5 * 60 * 1000; // Show logs from last 5 minutes

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(level, message) {
  const colorMap = {
    'error': colors.red,
    'warn': colors.yellow,
    'info': colors.cyan,
    'log': colors.green,
    'debug': colors.dim,
  };
  const color = colorMap[level] || colors.reset;
  return `${color}${message}${colors.reset}`;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp / 1000); // Supabase timestamps are in microseconds
  return date.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
}

function formatLogEntry(log) {
  const timestamp = formatTimestamp(log.timestamp);
  const level = log.level || 'info';
  const message = log.event_message || '';
  
  // Color code by level
  const levelColor = level === 'error' ? colors.red : 
                     level === 'warn' ? colors.yellow : 
                     level === 'info' ? colors.cyan : colors.reset;
  
  // Format the log entry
  let output = `${colors.dim}[${timestamp}]${colors.reset} `;
  output += `${levelColor}[${level.toUpperCase()}]${colors.reset} `;
  
  // Highlight email-related logs
  if (message.includes('📧') || message.includes('reset-password')) {
    output += `${colors.magenta}${message}${colors.reset}`;
  } else {
    output += message;
  }
  
  return output;
}

async function fetchLogs() {
  try {
    // Check if we have Supabase CLI available
    const { execSync } = require('child_process');
    
    // Try using Supabase CLI
    try {
      const result = execSync(
        `supabase functions logs ${FUNCTION_NAME} --limit 50`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
      
      // Parse the output (Supabase CLI returns JSON)
      const lines = result.trim().split('\n').filter(line => line.trim());
      const logs = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          // If not JSON, create a log object
          return {
            timestamp: Date.now() * 1000,
            level: 'info',
            event_message: line,
            event_type: 'Log'
          };
        }
      });
      
      return logs;
    } catch (cliError) {
      console.error(`${colors.red}Error fetching logs via CLI:${colors.reset}`, cliError.message);
      console.log(`${colors.yellow}Make sure Supabase CLI is installed and you're logged in:${colors.reset}`);
      console.log(`${colors.dim}  npm install -g supabase${colors.reset}`);
      console.log(`${colors.dim}  supabase login${colors.reset}`);
      return [];
    }
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    return [];
  }
}

let seenLogIds = new Set();
let isFirstRun = true;

async function pollLogs() {
  const logs = await fetchLogs();
  
  // Filter to only show new logs
  const newLogs = logs.filter(log => {
    const logId = log.id || `${log.timestamp}-${log.event_message}`;
    if (seenLogIds.has(logId)) {
      return false;
    }
    seenLogIds.add(logId);
    return true;
  });
  
  // On first run, show all logs from the last few minutes
  if (isFirstRun) {
    const cutoffTime = Date.now() * 1000 - MAX_LOG_AGE;
    const recentLogs = logs.filter(log => log.timestamp > cutoffTime);
    recentLogs.reverse().forEach(log => {
      console.log(formatLogEntry(log));
    });
    isFirstRun = false;
    if (recentLogs.length > 0) {
      console.log(`\n${colors.dim}--- Watching for new logs (polling every ${POLL_INTERVAL/1000}s) ---${colors.reset}\n`);
    }
  } else {
    // Show new logs as they come in
    newLogs.reverse().forEach(log => {
      console.log(formatLogEntry(log));
    });
  }
}

// Main execution
console.log(`${colors.bright}${colors.cyan}Watching logs for function: ${FUNCTION_NAME}${colors.reset}\n`);
console.log(`${colors.dim}Press Ctrl+C to stop${colors.reset}\n`);

// Initial fetch
pollLogs();

// Poll for new logs
const intervalId = setInterval(pollLogs, POLL_INTERVAL);

// Cleanup on exit
process.on('SIGINT', () => {
  console.log(`\n${colors.dim}Stopping log watcher...${colors.reset}`);
  clearInterval(intervalId);
  process.exit(0);
});

