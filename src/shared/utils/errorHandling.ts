// Production-ready error handling utilities

export const ErrorHandler = {
  // Log errors appropriately for production
  logError: (context: string, error: any, metadata?: any) => {
    // In production, send to monitoring service instead of console
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context}]`, error);
      if (metadata) {
        console.error(`[${context}] metadata:`, metadata);
      }
    }
    // TODO: Send to monitoring service in production
  },

  // Log warnings for development
  logWarning: (context: string, message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[${context}] ${message}`, data);
    }
  },

  // Log info only in development
  logInfo: (context: string, message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${context}] ${message}`, data);
    }
  },

  // Handle service failures gracefully
  handleServiceError: (service: string, operation: string, error: any): Error => {
    const errorMessage = `${service} ${operation} failed: ${error.message || 'Unknown error'}`;
    ErrorHandler.logError(`${service}.${operation}`, error);
    return new Error(errorMessage);
  }
};

export default ErrorHandler;