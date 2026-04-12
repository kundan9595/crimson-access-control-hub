import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, CloudUpload } from 'lucide-react';
import { setScottAirtableSyncEnabled } from '@/services/scott/scottSettingsService';
import { toast } from 'sonner';

const Settings = () => {
  const [airtableEnabled, setAirtableEnabled] = useState(true);

  const syncMutation = useMutation({
    mutationFn: () => setScottAirtableSyncEnabled(airtableEnabled),
    onSuccess: () => {
      toast.success('Scott Airtable sync setting updated');
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Request failed';
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Application preferences and Scott dashboard integration
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CloudUpload className="h-5 w-5 text-blue-600" />
              Scott — Airtable sync
            </CardTitle>
            <CardDescription>
              Controls the Scott dashboard Airtable sync flag (same as Postman{' '}
              <code className="text-xs">/api/dashboard/v1/settings/airtable_sync</code>).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="airtable-sync">Enable Airtable sync</Label>
                <p className="text-sm text-muted-foreground">
                  When off, sync jobs on the Scott side should not run.
                </p>
              </div>
              <Switch
                id="airtable-sync"
                checked={airtableEnabled}
                onCheckedChange={setAirtableEnabled}
                disabled={syncMutation.isPending}
              />
            </div>
            <Button
              type="button"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? 'Saving…' : 'Save to Scott'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;

