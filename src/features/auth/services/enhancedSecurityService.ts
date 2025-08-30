// Enhanced security service with comprehensive protection measures

import { supabase } from '@/integrations/supabase/client';
import { InputValidator, ErrorHandler } from '@/shared/utils';

export interface SecurityConfig {
  enableRateLimit: boolean;
  maxAttempts: number;
  windowMinutes: number;
  enableAuditLogging: boolean;
  enableSuspiciousActivityDetection: boolean;
}

export interface SecurityEventDetails {
  action: string;
  targetUserId?: string;
  ipAddress?: string;
  userAgent?: string;
  additionalData?: Record<string, any>;
}

export class EnhancedSecurityService {
  private static defaultConfig: SecurityConfig = {
    enableRateLimit: true,
    maxAttempts: 5,
    windowMinutes: 15,
    enableAuditLogging: true,
    enableSuspiciousActivityDetection: true
  };

  // Check if user has super admin privileges
  static async isSuperAdmin(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_super_admin_user_secure');
      
      if (error) {
        ErrorHandler.logError('EnhancedSecurityService.isSuperAdmin', error);
        return false;
      }
      
      return data === true;
    } catch (error) {
      ErrorHandler.logError('EnhancedSecurityService.isSuperAdmin', error);
      return false;
    }
  }

  // Check if user can delete other users
  static async canDeleteUsers(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_delete_users');
      
      if (error) {
        ErrorHandler.logError('EnhancedSecurityService.canDeleteUsers', error);
        return false;
      }
      
      return data === true;
    } catch (error) {
      ErrorHandler.logError('EnhancedSecurityService.canDeleteUsers', error);
      return false;
    }
  }

  // Check if a specific user can be deleted
  static async isUserDeletable(userUuid: string): Promise<boolean> {
    try {
      const validatedUuid = InputValidator.validateUuid(userUuid, 'User UUID');
      
      const { data, error } = await supabase.rpc('is_user_deletable', {
        target_user_uuid: validatedUuid
      });
      
      if (error) {
        ErrorHandler.logError('EnhancedSecurityService.isUserDeletable', error);
        return false;
      }
      
      return data === true;
    } catch (error) {
      ErrorHandler.logError('EnhancedSecurityService.isUserDeletable', error);
      return false;
    }
  }

  // Enhanced security event logging
  static async logSecurityEvent(
    eventDetails: SecurityEventDetails,
    config: Partial<SecurityConfig> = {}
  ): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };

    if (!finalConfig.enableAuditLogging) {
      return;
    }

    try {
      const sanitizedAction = InputValidator.validateText(
        eventDetails.action,
        'Security action',
        { maxLength: 100, required: true }
      );

      const { error } = await supabase.rpc('log_security_event_enhanced', {
        p_action: sanitizedAction,
        p_target_user_id: eventDetails.targetUserId || null,
        p_details: eventDetails.additionalData || {},
        p_ip_address: eventDetails.ipAddress || null,
        p_user_agent: eventDetails.userAgent || null
      });

      if (error) {
        ErrorHandler.logError('EnhancedSecurityService.logSecurityEvent', error);
      }
    } catch (error) {
      ErrorHandler.logError('EnhancedSecurityService.logSecurityEvent', error);
    }
  }

  // Enhanced rate limiting check
  static async checkRateLimit(
    operation: string,
    identifier?: string,
    config: Partial<SecurityConfig> = {}
  ): Promise<boolean> {
    const finalConfig = { ...this.defaultConfig, ...config };

    if (!finalConfig.enableRateLimit) {
      return true;
    }

    try {
      const sanitizedOperation = InputValidator.validateText(
        operation,
        'Operation type',
        { maxLength: 50, required: true }
      );

      const sanitizedIdentifier = identifier 
        ? InputValidator.validateText(identifier, 'Rate limit identifier', { maxLength: 100 })
        : '';

      const { data, error } = await supabase.rpc('enhanced_check_rate_limit', {
        p_operation_type: sanitizedOperation,
        p_identifier: sanitizedIdentifier,
        p_max_attempts: finalConfig.maxAttempts,
        p_window_minutes: finalConfig.windowMinutes
      });

      if (error) {
        ErrorHandler.logError('EnhancedSecurityService.checkRateLimit', error);
        return true; // Allow operation if rate limit check fails
      }

      return data === true;
    } catch (error) {
      ErrorHandler.logError('EnhancedSecurityService.checkRateLimit', error);
      return true; // Allow operation if rate limit check fails
    }
  }

  // Validate and sanitize user input for security operations
  static validateSecurityInput(input: any, fieldName: string): any {
    if (typeof input === 'string') {
      return InputValidator.validateText(input, fieldName, {
        maxLength: 1000,
        sanitizeHtml: true
      });
    }

    if (typeof input === 'object' && input !== null) {
      const sanitizedObject: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(input)) {
        const sanitizedKey = InputValidator.validateText(key, `${fieldName} key`, {
          maxLength: 100,
          sanitizeHtml: true
        });
        
        if (typeof value === 'string') {
          sanitizedObject[sanitizedKey] = InputValidator.validateText(value, `${fieldName}.${key}`, {
            maxLength: 1000,
            sanitizeHtml: true
          });
        } else if (typeof value === 'number') {
          sanitizedObject[sanitizedKey] = value;
        } else if (typeof value === 'boolean') {
          sanitizedObject[sanitizedKey] = value;
        }
        // Skip other types for security
      }
      
      return sanitizedObject;
    }

    return input;
  }

  // Get client IP address from request headers (for use in edge functions)
  static getClientIP(request?: Request): string | null {
    if (!request) return null;

    // Try various headers in order of preference
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip'
    ];

    for (const header of headers) {
      const value = request.headers.get(header);
      if (value) {
        // Take the first IP if there are multiple (comma-separated)
        const ip = value.split(',')[0].trim();
        return InputValidator.sanitizeInput(ip);
      }
    }

    return null;
  }

  // Get user agent from request headers
  static getUserAgent(request?: Request): string | null {
    if (!request) return null;

    const userAgent = request.headers.get('user-agent');
    return userAgent ? InputValidator.sanitizeInput(userAgent) : null;
  }

  // Comprehensive security check for administrative operations
  static async performAdminSecurityCheck(
    operation: string,
    targetData?: any
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Check if user is super admin
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) {
        await this.logSecurityEvent({
          action: 'unauthorized_admin_access_attempt',
          additionalData: { operation, attempted_action: 'admin_operation' }
        });
        
        return { allowed: false, reason: 'Super admin privileges required' };
      }

      // Check rate limiting for admin operations
      const isWithinLimits = await this.checkRateLimit(operation, undefined, {
        maxAttempts: 10, // Higher limit for admin operations
        windowMinutes: 5
      });

      if (!isWithinLimits) {
        await this.logSecurityEvent({
          action: 'admin_rate_limit_exceeded',
          additionalData: { operation }
        });
        
        return { allowed: false, reason: 'Rate limit exceeded for admin operations' };
      }

      return { allowed: true };
    } catch (error) {
      ErrorHandler.logError('EnhancedSecurityService.performAdminSecurityCheck', error);
      return { allowed: false, reason: 'Security check failed' };
    }
  }
}

export default EnhancedSecurityService;