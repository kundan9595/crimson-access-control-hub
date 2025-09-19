import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, WifiOff, Download, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';
import { getInstallationStatus, checkForUpdates } from '@/lib/pwa';
import { toast } from 'sonner';

const PWAStatus: React.FC = () => {
  const [status, setStatus] = useState(getInstallationStatus());
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(getInstallationStatus());
    };

    // Listen for online/offline events
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Update status periodically
    const interval = setInterval(updateStatus, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      clearInterval(interval);
    };
  }, []);

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      await checkForUpdates();
      toast.success('Checked for updates successfully');
    } catch (error) {
      toast.error('Failed to check for updates');
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const getStatusIcon = () => {
    if (status.isInstalled) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (status.canInstall) {
      return <Download className="h-4 w-4 text-blue-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (status.isInstalled) {
      return 'Installed as PWA';
    }
    if (status.canInstall) {
      return 'Can be installed';
    }
    return 'Not available';
  };

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (status.isInstalled) return 'default';
    if (status.canInstall) return 'secondary';
    return 'outline';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Smartphone className="h-5 w-5" />
          <span>PWA Status</span>
        </CardTitle>
        <CardDescription>
          Progressive Web App installation and connectivity status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Installation Status:</span>
          <Badge variant={getStatusVariant()} className="flex items-center space-x-1">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Network Status:</span>
          <Badge variant={status.isOnline ? 'default' : 'destructive'} className="flex items-center space-x-1">
            {status.isOnline ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <span>{status.isOnline ? 'Online' : 'Offline'}</span>
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Service Worker:</span>
          <Badge variant={status.hasServiceWorker ? 'default' : 'outline'} className="flex items-center space-x-1">
            {status.hasServiceWorker ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{status.hasServiceWorker ? 'Active' : 'Not Available'}</span>
          </Badge>
        </div>

        {status.hasServiceWorker && (
          <Button 
            onClick={handleCheckUpdates} 
            disabled={isCheckingUpdates}
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            {isCheckingUpdates ? 'Checking...' : 'Check for Updates'}
          </Button>
        )}

        {status.isInstalled && (
          <div className="text-xs text-muted-foreground text-center">
            🎉 App is running as a Progressive Web App with offline capabilities!
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PWAStatus;
