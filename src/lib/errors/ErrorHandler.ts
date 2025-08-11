import { toast } from 'sonner';

// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Error context
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp: string;
  url?: string;
  userAgent?: string;
}

// Error information
export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  context: ErrorContext;
  originalError?: Error;
  metadata?: Record<string, any>;
}

// Error handler configuration
export interface ErrorHandlerConfig {
  enableToast?: boolean;
  enableConsole?: boolean;
  enableReporting?: boolean;
  reportToService?: (error: ErrorInfo) => Promise<void>;
}

// Default error messages
const DEFAULT_ERROR_MESSAGES = {
  [ErrorType.VALIDATION]: 'Please check your input and try again.',
  [ErrorType.NETWORK]: 'Network error. Please check your connection and try again.',
  [ErrorType.AUTHENTICATION]: 'Authentication required. Please log in again.',
  [ErrorType.AUTHORIZATION]: 'You do not have permission to perform this action.',
  [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorType.SERVER]: 'Server error. Please try again later.',
  [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

// Error handler class
export class ErrorHandler {
  private static config: ErrorHandlerConfig = {
    enableToast: true,
    enableConsole: true,
    enableReporting: true,
  };

  // Initialize error handler
  static initialize(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...this.config, ...config };
  }

  // Handle error with automatic type detection
  static handle(error: Error | string, context: Partial<ErrorContext> = {}): ErrorInfo {
    const errorInfo = this.createErrorInfo(error, context);
    this.processError(errorInfo);
    return errorInfo;
  }

  // Handle specific error types
  static handleValidation(error: Error | string, context: Partial<ErrorContext> = {}): ErrorInfo {
    return this.handleWithType(error, ErrorType.VALIDATION, ErrorSeverity.MEDIUM, context);
  }

  static handleNetwork(error: Error | string, context: Partial<ErrorContext> = {}): ErrorInfo {
    return this.handleWithType(error, ErrorType.NETWORK, ErrorSeverity.HIGH, context);
  }

  static handleAuthentication(error: Error | string, context: Partial<ErrorContext> = {}): ErrorInfo {
    return this.handleWithType(error, ErrorType.AUTHENTICATION, ErrorSeverity.HIGH, context);
  }

  static handleAuthorization(error: Error | string, context: Partial<ErrorContext> = {}): ErrorInfo {
    return this.handleWithType(error, ErrorType.AUTHORIZATION, ErrorSeverity.HIGH, context);
  }

  static handleNotFound(error: Error | string, context: Partial<ErrorContext> = {}): ErrorInfo {
    return this.handleWithType(error, ErrorType.NOT_FOUND, ErrorSeverity.MEDIUM, context);
  }

  static handleServer(error: Error | string, context: Partial<ErrorContext> = {}): ErrorInfo {
    return this.handleWithType(error, ErrorType.SERVER, ErrorSeverity.CRITICAL, context);
  }

  // Handle error with specific type and severity
  static handleWithType(
    error: Error | string,
    type: ErrorType,
    severity: ErrorSeverity,
    context: Partial<ErrorContext> = {}
  ): ErrorInfo {
    const errorInfo = this.createErrorInfo(error, context, type, severity);
    this.processError(errorInfo);
    return errorInfo;
  }

  // Create error info object
  private static createErrorInfo(
    error: Error | string,
    context: Partial<ErrorContext> = {},
    type?: ErrorType,
    severity?: ErrorSeverity
  ): ErrorInfo {
    const message = typeof error === 'string' ? error : error.message;
    const originalError = typeof error === 'string' ? new Error(error) : error;

    // Auto-detect error type if not provided
    const detectedType = type || this.detectErrorType(originalError);
    const detectedSeverity = severity || this.detectErrorSeverity(detectedType);

    return {
      type: detectedType,
      severity: detectedSeverity,
      message,
      code: this.extractErrorCode(originalError),
      context: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context,
      },
      originalError,
      metadata: this.extractMetadata(originalError),
    };
  }

  // Process error based on configuration
  private static processError(errorInfo: ErrorInfo): void {
    // Show toast notification
    if (this.config.enableToast) {
      this.showToast(errorInfo);
    }

    // Log to console
    if (this.config.enableConsole) {
      this.logToConsole(errorInfo);
    }

    // Report to external service
    if (this.config.enableReporting && this.config.reportToService) {
      this.reportError(errorInfo);
    }
  }

  // Show toast notification
  private static showToast(errorInfo: ErrorInfo): void {
    const message = this.getUserFriendlyMessage(errorInfo);
    
    switch (errorInfo.severity) {
      case ErrorSeverity.CRITICAL:
        toast.error(message, {
          duration: 10000,
          action: {
            label: 'Report',
            onClick: () => this.reportError(errorInfo),
          },
        });
        break;
      case ErrorSeverity.HIGH:
        toast.error(message, { duration: 8000 });
        break;
      case ErrorSeverity.MEDIUM:
        toast.warning(message, { duration: 6000 });
        break;
      case ErrorSeverity.LOW:
        toast.info(message, { duration: 4000 });
        break;
    }
  }

  // Log to console
  private static logToConsole(errorInfo: ErrorInfo): void {
    const logMessage = `[${errorInfo.type}] ${errorInfo.message}`;
    const logData = {
      ...errorInfo,
      stack: errorInfo.originalError?.stack,
    };

    switch (errorInfo.severity) {
      case ErrorSeverity.CRITICAL:
        console.error(logMessage, logData);
        break;
      case ErrorSeverity.HIGH:
        console.error(logMessage, logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage, logData);
        break;
      case ErrorSeverity.LOW:
        console.info(logMessage, logData);
        break;
    }
  }

  // Report error to external service
  private static async reportError(errorInfo: ErrorInfo): Promise<void> {
    if (!this.config.reportToService) return;

    try {
      await this.config.reportToService(errorInfo);
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  // Get user-friendly error message
  private static getUserFriendlyMessage(errorInfo: ErrorInfo): string {
    // Use custom message if available, otherwise use default
    if (errorInfo.message && errorInfo.message !== errorInfo.originalError?.message) {
      return errorInfo.message;
    }

    return DEFAULT_ERROR_MESSAGES[errorInfo.type] || DEFAULT_ERROR_MESSAGES[ErrorType.UNKNOWN];
  }

  // Auto-detect error type
  private static detectErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (name.includes('validation') || message.includes('validation')) {
      return ErrorType.VALIDATION;
    }

    if (name.includes('network') || message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }

    if (name.includes('auth') || message.includes('auth') || message.includes('unauthorized')) {
      return ErrorType.AUTHENTICATION;
    }

    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorType.AUTHORIZATION;
    }

    if (message.includes('not found') || message.includes('404')) {
      return ErrorType.NOT_FOUND;
    }

    if (message.includes('server') || message.includes('500')) {
      return ErrorType.SERVER;
    }

    return ErrorType.UNKNOWN;
  }

  // Auto-detect error severity
  private static detectErrorSeverity(type: ErrorType): ErrorSeverity {
    switch (type) {
      case ErrorType.CRITICAL:
        return ErrorSeverity.CRITICAL;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
      case ErrorType.NETWORK:
        return ErrorSeverity.HIGH;
      case ErrorType.VALIDATION:
      case ErrorType.NOT_FOUND:
        return ErrorSeverity.MEDIUM;
      default:
        return ErrorSeverity.LOW;
    }
  }

  // Extract error code
  private static extractErrorCode(error: Error): string | undefined {
    // Extract from error name or message
    const codeMatch = error.message.match(/\[([A-Z0-9_]+)\]/);
    return codeMatch ? codeMatch[1] : undefined;
  }

  // Extract metadata from error
  private static extractMetadata(error: Error): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Extract common error properties
    if (error.name) metadata.name = error.name;
    if (error.stack) metadata.hasStack = true;

    // Extract additional properties if they exist
    if ('code' in error) metadata.code = (error as any).code;
    if ('status' in error) metadata.status = (error as any).status;
    if ('response' in error) metadata.hasResponse = true;

    return metadata;
  }

  // Create error boundary error info
  static createBoundaryError(error: Error, errorInfo: React.ErrorInfo): ErrorInfo {
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.CRITICAL,
      message: 'React component error',
      context: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        component: errorInfo.componentStack,
      },
      originalError: error,
      metadata: {
        componentStack: errorInfo.componentStack,
        isReactError: true,
      },
    };
  }

  // Handle async errors
  static async handleAsync<T>(
    promise: Promise<T>,
    context: Partial<ErrorContext> = {}
  ): Promise<{ data: T | null; error: ErrorInfo | null }> {
    try {
      const data = await promise;
      return { data, error: null };
    } catch (error) {
      const errorInfo = this.handle(error as Error, context);
      return { data: null, error: errorInfo };
    }
  }

  // Retry with exponential backoff
  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          this.handle(lastError, {
            ...context,
            action: `retry_attempt_${attempt}`,
          });
          throw lastError;
        }

        // Wait before retrying
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

// Export convenience functions
export const handleError = (error: Error | string, context?: Partial<ErrorContext>) => 
  ErrorHandler.handle(error, context);

export const handleValidationError = (error: Error | string, context?: Partial<ErrorContext>) => 
  ErrorHandler.handleValidation(error, context);

export const handleNetworkError = (error: Error | string, context?: Partial<ErrorContext>) => 
  ErrorHandler.handleNetwork(error, context);

export const handleAsyncError = <T>(promise: Promise<T>, context?: Partial<ErrorContext>) => 
  ErrorHandler.handleAsync(promise, context);

export const retryWithBackoff = <T>(fn: () => Promise<T>, maxRetries?: number, baseDelay?: number, context?: Partial<ErrorContext>) => 
  ErrorHandler.retry(fn, maxRetries, baseDelay, context);
