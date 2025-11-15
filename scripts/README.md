# Log Watching Scripts

These scripts help you watch Supabase Edge Function logs in real-time.

## Quick Start

### Option 1: Using Supabase CLI (Recommended)

If you have the Supabase CLI installed:

```bash
npm run logs:reset-password
```

Or watch a specific function:
```bash
npm run logs:watch <function-name>
```

**Prerequisites:**
- Install Supabase CLI: `npm install -g supabase`
- Login: `supabase login`

### Option 2: Using Management API

If you have a Supabase access token:

```bash
# Get your access token from: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN=your_token_here
npm run logs:reset-password:api
```

Or manually:
```bash
SUPABASE_ACCESS_TOKEN=your_token SUPABASE_PROJECT_REF=your_project_ref node scripts/watch-edge-logs-api.js reset-password
```

## Features

- ✅ Real-time log streaming
- ✅ Color-coded log levels (error, warn, info)
- ✅ Highlights email-related logs (📧 prefix)
- ✅ Timestamp formatting
- ✅ Automatic polling every 2-3 seconds
- ✅ Shows recent logs on startup

## Troubleshooting

### "Supabase CLI not found"
Install it: `npm install -g supabase`

### "Not logged in"
Run: `supabase login`

### "Access token required"
Get your token from: https://supabase.com/dashboard/account/tokens

### No logs showing
- Make sure the function name is correct
- Check that the function has been deployed
- Verify you have the correct project reference

## Example Output

```
[14:23:45.123] [INFO] 📧 [reset-password] Starting password reset process
[14:23:45.456] [INFO] 📧 [reset-password] Using email address: user@example.com
[14:23:45.789] [ERROR] Error generating reset link: User not found
```

