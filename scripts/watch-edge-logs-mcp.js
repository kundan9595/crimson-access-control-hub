#!/usr/bin/env node

/**
 * Watch Supabase Edge Function logs using MCP (Model Context Protocol)
 * This script can be used if you have MCP access to Supabase
 * 
 * Usage:
 *   node scripts/watch-edge-logs-mcp.js [function-name]
 */

const FUNCTION_NAME = process.argv[2] || 'reset-password';
const POLL_INTERVAL = 3000; // Poll every 3 seconds

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
  
  if (message.includes('📧') || message.includes('reset-password')) {
    output += `${colors.magenta}${message}${colors.reset}`;
  } else {
    output += message;
  }
  
  return output;
}

// This would need to be called via MCP - for now, just show instructions
console.log(`${colors.bright}${colors.cyan}MCP Log Watcher${colors.reset}\n`);
console.log(`${colors.yellow}Note: This script requires MCP access to Supabase.${colors.reset}`);
console.log(`${colors.dim}To use this, you would need to call the MCP get_logs function.${colors.reset}\n`);
console.log(`${colors.cyan}Alternative: Use the CLI-based watcher instead:${colors.reset}`);
console.log(`${colors.dim}  node scripts/watch-edge-logs.js ${FUNCTION_NAME}${colors.reset}\n`);

