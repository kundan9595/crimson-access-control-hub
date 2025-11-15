# Email Debugging Guide for Password Reset

## Current Status

The password reset function is generating reset links successfully, but emails may not be sending. This guide helps debug the issue.

## How to Check Logs

### 1. View Edge Function Logs
The reset-password function now includes comprehensive logging with the `📧` prefix. To view logs:

- **Via Console (Real-time)**: 
  ```bash
  npm run logs:reset-password
  ```
  Or with API token:
  ```bash
  SUPABASE_ACCESS_TOKEN=your_token npm run logs:reset-password:api
  ```
  See `scripts/README.md` for more options.

- **Via Supabase Dashboard**: Go to Edge Functions > reset-password > Logs
- **Via CLI**: `supabase functions logs reset-password`
- **Via MCP**: Use the `get_logs` tool with service `edge-function`

### 2. View Auth Logs
Auth logs show email-related events:

- **Via Supabase Dashboard**: Go to Logs > Auth
- **Via MCP**: Use the `get_logs` tool with service `auth`

Look for:
- `user_recovery_requested` - Indicates the reset link was generated
- Email delivery errors (if any)

## Common Issues

### Issue 1: Supabase Default Email Limitations ⚠️ **MOST COMMON**
**Symptoms**: 
- `user_recovery_requested` appears in logs
- No email delivery confirmation
- No errors in logs
- Function returns success but email never arrives

**Root Cause**:
- **By default, Supabase only sends emails to pre-authorized addresses (team members)**
- If the recipient email is NOT in your Supabase organization's team list, the email will fail silently
- The default SMTP service has strict rate limits and is not meant for production

**Solution**:
1. **Check if email is in team list**: Go to Supabase Dashboard > Organization Settings > Team
2. **For production, configure custom SMTP**:
   - Go to Supabase Dashboard > Project Settings > Auth > SMTP Settings
   - Set up SendGrid, AWS SES, Postmark, or another SMTP provider
   - See: https://supabase.com/docs/guides/auth/auth-smtp
3. **Verify email templates**: Go to Authentication > Email Templates
4. For local development, check if email is enabled in `supabase/config.toml`

### Issue 2: Email Provider Not Set Up
**Symptoms**:
- Function returns success
- No email received
- No email provider configured in Supabase

**Solution**:
1. Go to Supabase Dashboard > Project Settings > Auth
2. Configure SMTP settings or enable SendGrid
3. For production, you need a proper email provider

### Issue 3: Email Going to Spam
**Symptoms**:
- Function succeeds
- Email not in inbox

**Solution**:
- Check spam/junk folder
- Verify sender email is properly configured
- Check email domain reputation

## Debugging Steps

### Step 1: Check Function Logs
After triggering a password reset, check the logs for:
```
📧 [reset-password] Starting password reset process
📧 [reset-password] Using email address: <email>
📧 [reset-password] Configuration: {...}
📧 [reset-password] Calling generateLink with: {...}
📧 [reset-password] generateLink response: {...}
```

### Step 2: Check Auth Logs
Look for `user_recovery_requested` events in auth logs. This confirms Supabase processed the request.

### Step 3: Verify Email Configuration
1. Check Supabase Dashboard > Authentication > Email Templates
2. Verify SMTP/SendGrid is configured
3. Check if email is enabled for your project

### Step 4: Test Email Sending
Try using Supabase's built-in test email feature:
- Go to Authentication > Email Templates
- Click "Send test email"

## What the Logs Show

The enhanced logging will show:
- Email address being used
- Configuration (siteUrl, redirectTo)
- Full generateLink response
- Any errors during the process

## Next Steps

If emails are still not sending after checking the above:

1. **Set up SendGrid or SMTP** in Supabase Dashboard
2. **Configure email templates** in Authentication > Email Templates
3. **Check Supabase email limits** (free tier has limits)
4. **Consider using a custom email service** if Supabase email is unreliable

## Manual Workaround

If email is not working, you can manually send the reset link:
1. Check the function logs for the generated link
2. The link will be in the `generateLink response` log
3. Manually send this link to the user

Note: The link format is typically:
```
https://<project>.supabase.co/auth/v1/verify?token=<token>&type=recovery&redirect_to=<redirect>
```

