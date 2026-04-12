import { callScottDashboard } from '@/services/scott/callScottDashboard';

/**
 * Toggle Scott dashboard Airtable sync (POST /api/dashboard/v1/settings/airtable_sync).
 */
export async function setScottAirtableSyncEnabled(enabled: boolean): Promise<unknown> {
  const { body } = await callScottDashboard<unknown>({
    resource: 'settings',
    method: 'POST',
    settingsAction: 'airtable_sync',
    body: {
      enabled: enabled ? 'true' : 'false',
    },
  });
  return body;
}
