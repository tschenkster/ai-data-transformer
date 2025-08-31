// Phase 6 Security Service - Enhanced security management
import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  action: string;
  target_user_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
}

export interface RateLimitCheck {
  operation_type: string;
  identifier: string;
  max_attempts?: number;
  window_minutes?: number;
}

export const SecurityService = {
  // Session Management (using localStorage for now until types are updated)
  createClientSession(sessionData: {
    session_token: string;
    ip_address?: string;
    user_agent?: string;
    expires_at: string;
  }) {
    const sessionInfo = {
      ...sessionData,
      created_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      is_active: true
    };
    
    localStorage.setItem('security_session', JSON.stringify(sessionInfo));
    return sessionInfo;
  },

  updateSessionActivity() {
    const existingSession = localStorage.getItem('security_session');
    if (existingSession) {
      const session = JSON.parse(existingSession);
      session.last_activity_at = new Date().toISOString();
      localStorage.setItem('security_session', JSON.stringify(session));
    }
  },

  clearClientSession() {
    localStorage.removeItem('security_session');
  },

  getClientSession() {
    const session = localStorage.getItem('security_session');
    return session ? JSON.parse(session) : null;
  },

  // Enhanced Rate Limiting using new database function
  async checkRateLimit({ operation_type, identifier, max_attempts = 5, window_minutes = 15 }: RateLimitCheck): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('enhanced_check_rate_limit', {
        p_operation_type: operation_type,
        p_identifier: identifier,
        p_max_attempts: max_attempts,
        p_window_minutes: window_minutes
      });

      if (error) {
        console.error('Enhanced rate limit check failed:', error);
        return true; // Fail open for better UX - allow login when RPC fails
      }

      return data as boolean;
    } catch (error) {
      console.error('Enhanced rate limit check error:', error);
      return true; // Fail open - allow login when RPC fails
    }
  },

  // Security Event Logging
  async logSecurityEvent(event: SecurityEvent) {
    try {
      const { error } = await supabase.rpc('enhanced_log_security_event', {
        p_action: event.action,
        p_target_user_id: event.target_user_id || null,
        p_additional_data: event.details || null,
        p_ip_address: event.details?.identifier || null
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Security event logging error:', error);
    }
  },

  // Account Security Checks
  async detectSuspiciousActivity(userId: string, timeWindowMinutes = 60): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('detect_suspicious_activity', {
        p_user_id: userId,
        p_time_window_minutes: timeWindowMinutes
      });

      if (error) {
        console.error('Suspicious activity check failed:', error);
        return false;
      }

      return data as boolean;
    } catch (error) {
      console.error('Suspicious activity check error:', error);
      return false;
    }
  },

  // Account Lockout Management
  async handleFailedLogin(email: string, ipAddress?: string, userAgent?: string) {
    try {
      // Log the failed attempt using existing infrastructure
      await this.logSecurityEvent({
        action: 'failed_login_attempt',
        details: {
          email,
          ip_address: ipAddress,
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        }
      });

      // Check rate limiting for this email
      const isAllowed = await this.checkRateLimit({
        operation_type: 'login_attempt',
        identifier: email,
        max_attempts: 5,
        window_minutes: 15
      });

      if (!isAllowed) {
        console.warn('Rate limit exceeded for email:', email);
      }

      return { rateLimited: !isAllowed };
    } catch (error) {
      console.error('Failed login handling error:', error);
      return { rateLimited: false };
    }
  },

  async handleSuccessfulLogin(userId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Log the successful login using existing infrastructure
      await this.logSecurityEvent({
        action: 'login_success',
        target_user_id: userId,
        details: {
          user_id: userId,
          ip_address: ipAddress,
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        }
      });

      // Create client session tracking
      const sessionToken = this.generateSessionToken();
      this.createClientSession({
        session_token: sessionToken,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });

      // Check for suspicious activity
      const isSuspicious = await this.detectSuspiciousActivity(userId, 60);
      if (isSuspicious) {
        console.warn('Suspicious activity detected for user:', userId);
        await this.logSecurityEvent({
          action: 'suspicious_activity_detected',
          target_user_id: userId,
          details: {
            detection_context: 'successful_login',
            timestamp: new Date().toISOString()
          }
        });
      }

      return { sessionToken, suspicious: isSuspicious };
    } catch (error) {
      console.error('Successful login handling error:', error);
      return { sessionToken: null, suspicious: false };
    }
  },

  // Security Audit Queries
  async getSecurityAuditLogs(filters?: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    let query = supabase
      .from('security_audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get security audit logs:', error);
      throw error;
    }

    return data;
  },

  // Password Policy Validation
  validatePasswordPolicy(password: string): {
    isValid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    if (password.length < 12) {
      violations.push('Password must be at least 12 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      violations.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      violations.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      violations.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      violations.push('Password must contain at least one special character');
    }

    // Check for common patterns
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i
    ];

    if (commonPatterns.some(pattern => pattern.test(password))) {
      violations.push('Password contains common patterns that are not allowed');
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  },

  // Utility Functions
  getClientIP(): string {
    // In a real application, this would be handled by the server
    return 'client-detected';
  },

  getUserAgent(): string {
    return navigator.userAgent;
  },

  generateSessionToken(): string {
    return crypto.randomUUID();
  }
};

export default SecurityService;