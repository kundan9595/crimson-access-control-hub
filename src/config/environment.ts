// Environment configuration for the application
export const config = {
  // Supabase Configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || "https://pyvlvnuupagaumaacgyz.supabase.co",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dmx2bnV1cGFnYXVtYWFjZ3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMzY1NzIsImV4cCI6MjA2NzYxMjU3Mn0.ovZXw3yFidM-gtxHPay__Aw2_CbNbfB7yh6o-h5LP_A",
  },
  
  // Application Configuration
  app: {
    name: "Crimson Access Control Hub",
    version: "1.0.0",
    environment: import.meta.env.MODE,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  },
  
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },
  
  // Feature Flags
  features: {
    bulkImport: true,
    mediaUpload: true,
    realtimeUpdates: true,
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  },
  
  // Pagination Configuration
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    pageSizeOptions: [10, 20, 50, 100],
  },
  
  // Cache Configuration
  cache: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  
  // Error Reporting
  errorReporting: {
    enabled: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
    dsn: import.meta.env.VITE_SENTRY_DSN,
  },
} as const;

// Type-safe environment access
export type Config = typeof config; 