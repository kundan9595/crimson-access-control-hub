# Quick Log Viewing Guide

## 🚀 Fastest Way to See Edge Function Logs

### Option 1: Run the Log Watcher (Recommended)

Open a **new terminal window** and run:

```bash
npm run logs:reset-password
```

This will stream logs in real-time with color coding. You'll see:
- 📧 Email-related logs highlighted in magenta
- Errors in red
- Info logs in cyan
- Timestamps for each log entry

### Option 2: Use Supabase CLI Directly

```bash
supabase functions logs reset-password --limit 50
```

### Option 3: Check Browser Console

After triggering a password reset, check your browser console. You should now see:

```
🔐 [resetUserPassword] Full Response: {
  result: {...},
  resultMessage: "...",
  resultDebug: {...}
}
```

This shows what the edge function returned.

## 🔍 What to Look For

When you trigger a password reset, you should see logs like:

```
📧 [reset-password] Starting password reset process
📧 [reset-password] Using email address: user@example.com
📧 [reset-password] Checking if user exists in Auth by userId: ...
📧 [reset-password] User found in Auth: {...}
📧 [reset-password] Calling generateLink with: {...}
📧 [reset-password] generateLink response: {...}
```

If you see errors:
- `User not found in Auth` - User exists in profiles but not in auth.users
- `Error generating reset link` - Check the error details
- No email sent - Check SMTP configuration

## 📊 Real-Time Monitoring

Keep the log watcher running in a separate terminal while you test. Every time you trigger a password reset, you'll see the logs appear in real-time!

