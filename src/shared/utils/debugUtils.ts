// Debug utilities for tracking application state and errors
export const debugUtils = {
  // Track component lifecycle
  logComponentLifecycle: (componentName: string, phase: 'mount' | 'unmount' | 'update', data?: any) => {
    console.log(`[DEBUG] ${componentName} - ${phase}:`, data);
  },

  // Track async operations
  logAsyncOperation: (operationName: string, phase: 'start' | 'success' | 'error', data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[ASYNC] ${timestamp} - ${operationName} - ${phase}:`, data);
  },

  // Track state changes
  logStateChange: (stateName: string, oldValue: any, newValue: any) => {
    console.log(`[STATE] ${stateName}:`, { from: oldValue, to: newValue });
  },

  // Track errors with context
  logError: (context: string, error: any, metadata?: any) => {
    console.error(`[ERROR] ${context}:`, error);
    if (metadata) {
      console.error(`[ERROR] ${context} metadata:`, metadata);
    }
    
    // Also log to a global error store for debugging
    if (typeof window !== 'undefined') {
      if (!window.debugErrors) {
        window.debugErrors = [];
      }
      window.debugErrors.push({
        timestamp: Date.now(),
        context,
        error: error.message || error,
        stack: error.stack,
        metadata
      });
    }
  },

  // Performance tracking
  startTimer: (name: string) => {
    if (typeof window !== 'undefined') {
      if (!window.debugTimers) {
        window.debugTimers = {};
      }
      window.debugTimers[name] = performance.now();
    }
  },

  endTimer: (name: string) => {
    if (typeof window !== 'undefined' && window.debugTimers && window.debugTimers[name]) {
      const duration = performance.now() - window.debugTimers[name];
      console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
      delete window.debugTimers[name];
    }
  },

  // Memory usage tracking
  logMemoryUsage: (context: string) => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      console.log(`[MEMORY] ${context}:`, {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      });
    }
  }
};

// Extend window type for TypeScript
declare global {
  interface Window {
    debugErrors?: Array<{
      timestamp: number;
      context: string;
      error: any;
      stack?: string;
      metadata?: any;
    }>;
    debugTimers?: Record<string, number>;
  }
}

export default debugUtils;