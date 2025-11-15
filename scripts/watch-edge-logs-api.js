#!/usr/bin/env node

/**
 * Watch Supabase Edge Function logs using Management API
 * 
 * Requires:
 *   - SUPABASE_ACCESS_TOKEN (from https://supabase.com/dashboard/account/tokens)
 *   - SUPABASE_PROJECT_REF (your project reference)
 * 
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=xxx SUPABASE_PROJECT_REF=xxx node scripts/watch-edge-logs-api.js [function-name]
 */

const FUNCTION_NAME = process.argv[2] || 'reset-password';
const POLL_INTERVAL = 3000; // Poll every 3 seconds
const MAX_LOG_AGE = 10 * 60 * 1000; // Show logs from last 10 minutes

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'pyvlvnuupagaumaacgyz';

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

function formatTimestamp(timestamp) {
  const date = new Date(timestamp / 1000);
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
  
  const levelColor = level === 'error' ? colors.red : 
                     level === 'warn' ? colors.yellow : 
                     level === 'info' ? colors.cyan : colors.reset;
  
  let output = `${colors.dim}[${timestamp}]${colors.reset} `;
  output += `${levelColor}[${level.toUpperCase()}]${colors.reset} `;
  
  // Highlight email-related logs
  if (message.includes('📧') || message.includes('reset-password') || message.includes('reset_password')) {
    output += `${colors.magenta}${message}${colors.reset}`;
  } else if (message.includes('Error') || message.includes('error')) {
    output += `${colors.red}${message}${colors.reset}`;
  } else {
    output += message;
  }
  
  return output;
}

async function fetchLogs() {
  if (!ACCESS_TOKEN) {
    console.error(`${colors.red}Error: SUPABASE_ACCESS_TOKEN environment variable is required${colors.reset}`);
    console.log(`${colors.yellow}Get your access token from: https://supabase.com/dashboard/account/tokens${colors.reset}`);
    return [];
  }

  try {
    const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/${FUNCTION_NAME}/logs`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error(`${colors.red}Error fetching logs:${colors.reset}`, error.message);
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
  
  // On first run, show all recent logs
  if (isFirstRun) {
    const cutoffTime = Date.now() * 1000 - MAX_LOG_AGE;
    const recentLogs = logs.filter(log => log.timestamp > cutoffTime);
    recentLogs.reverse().forEach(log => {
      console.log(formatLogEntry(log));
    });
    isFirstRun = false;
    if (recentLogs.length > 0) {
      console.log(`\n${colors.dim}--- Watching for new logs (polling every ${POLL_INTERVAL/1000}s) ---${colors.reset}\n`);
    } else {
      console.log(`${colors.dim}No recent logs found. Waiting for new logs...${colors.reset}\n`);
    }
  } else {
    // Show new logs as they come in
    newLogs.reverse().forEach(log => {
      console.log(formatLogEntry(log));
    });
  }
}

// Main execution
console.log(`${colors.bright}${colors.cyan}Watching logs for function: ${FUNCTION_NAME}${colors.reset}`);
console.log(`${colors.dim}Project: ${PROJECT_REF}${colors.reset}\n`);

if (!ACCESS_TOKEN) {
  console.error(`${colors.red}Error: SUPABASE_ACCESS_TOKEN not set${colors.reset}\n`);
  console.log(`${colors.yellow}To use this script:${colors.reset}`);
  console.log(`${colors.dim}1. Get your access token from: https://supabase.com/dashboard/account/tokens${colors.reset}`);
  console.log(`${colors.dim}2. Run: SUPABASE_ACCESS_TOKEN=your_token npm run logs:reset-password:api${colors.reset}\n`);
  process.exit(1);
}

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

