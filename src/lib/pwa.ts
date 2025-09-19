import { toast } from 'sonner';

export const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content is available; please refresh
                toast.info('New version available! Please refresh the page.', {
                  duration: 10000,
                  action: {
                    label: 'Refresh',
                    onClick: () => window.location.reload(),
                  },
                });
              } else {
                // Content is cached for offline use
                console.log('Content is cached for offline use.');
              }
            }
          });
        }
      });

      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

export const unregisterSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        console.log('Service Worker unregistered successfully');
        return true;
      }
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  }
  return false;
};

export const checkForUpdates = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        console.log('Checked for Service Worker updates');
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }
};

export const isAppInstalled = (): boolean => {
  // Check if running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Check for iOS standalone mode
  const isInWebAppiOS = (window.navigator as any).standalone === true;
  
  return isStandalone || isInWebAppiOS;
};

export const getInstallationStatus = () => {
  return {
    isInstalled: isAppInstalled(),
    canInstall: 'serviceWorker' in navigator && !isAppInstalled(),
    isOnline: navigator.onLine,
    hasServiceWorker: 'serviceWorker' in navigator,
  };
};
