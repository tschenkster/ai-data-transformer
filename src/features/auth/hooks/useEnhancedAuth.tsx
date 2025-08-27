// Phase 6 Enhanced Authentication Hook
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import SecurityService from '../services/securityService';
import { useToast } from '@/hooks/use-toast';

export interface SecurityMetrics {
  failedAttempts: number;
  lastFailedAttempt?: string;
  accountLocked: boolean;
  lockExpiry?: string;
  suspiciousActivity: boolean;
  sessionsActive: number;
}

export function useEnhancedAuth() {
  const auth = useAuth();
  const { toast } = useToast();
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    failedAttempts: 0,
    accountLocked: false,
    suspiciousActivity: false,
    sessionsActive: 0
  });
  const [sessionActivity, setSessionActivity] = useState<any>(null);

  // Initialize security tracking
  useEffect(() => {
    if (auth.user?.id) {
      initializeSecurityTracking();
      
      // Start session activity monitoring
      const activityTimer = setInterval(() => {
        SecurityService.updateSessionActivity();
      }, 60000); // Update every minute

      return () => clearInterval(activityTimer);
    }
  }, [auth.user?.id]);

  const initializeSecurityTracking = async () => {
    if (!auth.user?.id) return;

    try {
      // Check for suspicious activity
      const suspicious = await SecurityService.detectSuspiciousActivity(auth.user.id);
      
      setSecurityMetrics(prev => ({
        ...prev,
        suspiciousActivity: suspicious,
        sessionsActive: 1 // Current session
      }));

      // Get client session info
      const session = SecurityService.getClientSession();
      setSessionActivity(session);

    } catch (error) {
      console.error('Failed to initialize security tracking:', error);
    }
  };

  const enhancedSignIn = async (email: string, password: string) => {
    const ipAddress = SecurityService.getClientIP();
    const userAgent = SecurityService.getUserAgent();

    try {
      // Check rate limiting before attempting login
      const isAllowed = await SecurityService.checkRateLimit({
        operation_type: 'login_attempt',
        identifier: email,
        max_attempts: 5,
        window_minutes: 15
      });

      if (!isAllowed) {
        toast({
          variant: "destructive",
          title: "Rate Limited",
          description: "Too many login attempts. Please wait before trying again."
        });
        return { error: { message: 'Rate limited' } };
      }

      // Attempt the login
      const result = await auth.signIn(email, password);

      if (result.error) {
        // Handle failed login
        await SecurityService.handleFailedLogin(email, ipAddress, userAgent);
        
        setSecurityMetrics(prev => ({
          ...prev,
          failedAttempts: prev.failedAttempts + 1,
          lastFailedAttempt: new Date().toISOString()
        }));

        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid credentials. Please check your email and password."
        });
      } else {
        // Handle successful login
        const loginResult = await SecurityService.handleSuccessfulLogin(
          auth.user?.id || '', 
          ipAddress, 
          userAgent
        );

        if (loginResult.suspicious) {
          toast({
            variant: "destructive",
            title: "Security Alert",
            description: "Suspicious activity detected. Please verify your account security."
          });
        }

        setSecurityMetrics(prev => ({
          ...prev,
          failedAttempts: 0,
          suspiciousActivity: loginResult.suspicious,
          sessionsActive: prev.sessionsActive + 1
        }));
      }

      return result;
    } catch (error) {
      console.error('Enhanced sign in error:', error);
      return { error };
    }
  };

  const enhancedSignUp = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string
  ) => {
    try {
      // Validate password policy
      const passwordValidation = SecurityService.validatePasswordPolicy(password);
      
      if (!passwordValidation.isValid) {
        toast({
          variant: "destructive",
          title: "Password Policy Violation",
          description: passwordValidation.violations[0]
        });
        return { 
          error: { 
            message: 'Password does not meet security requirements',
            violations: passwordValidation.violations 
          } 
        };
      }

      // Check rate limiting for signups
      const isAllowed = await SecurityService.checkRateLimit({
        operation_type: 'account_creation',
        identifier: email,
        max_attempts: 3,
        window_minutes: 60
      });

      if (!isAllowed) {
        toast({
          variant: "destructive",
          title: "Rate Limited",
          description: "Too many signup attempts. Please wait before trying again."
        });
        return { error: { message: 'Rate limited' } };
      }

      // Perform the signup
      const result = await auth.signUp(email, password, firstName, lastName);

      if (!result.error) {
        // Log successful account creation
        await SecurityService.logSecurityEvent({
          action: 'account_creation_attempt',
          details: {
            email,
            ip_address: SecurityService.getClientIP(),
            user_agent: SecurityService.getUserAgent(),
            timestamp: new Date().toISOString()
          }
        });

        toast({
          title: "Account Created",
          description: "Please check your email for verification instructions."
        });
      }

      return result;
    } catch (error) {
      console.error('Enhanced sign up error:', error);
      return { error };
    }
  };

  const enhancedSignOut = async () => {
    try {
      // Clear security session
      SecurityService.clearClientSession();
      
      // Log logout event
      if (auth.user?.id) {
        await SecurityService.logSecurityEvent({
          action: 'logout',
          target_user_id: auth.user.id,
          details: {
            timestamp: new Date().toISOString(),
            session_duration: sessionActivity ? 
              Date.now() - new Date(sessionActivity.created_at).getTime() : 0
          }
        });
      }

      setSecurityMetrics({
        failedAttempts: 0,
        accountLocked: false,
        suspiciousActivity: false,
        sessionsActive: 0
      });
      setSessionActivity(null);

      return await auth.signOut();
    } catch (error) {
      console.error('Enhanced sign out error:', error);
      return auth.signOut(); // Fallback to regular signout
    }
  };

  const validatePasswordStrength = (password: string) => {
    return SecurityService.validatePasswordPolicy(password);
  };

  const getSecurityStatus = () => {
    const session = SecurityService.getClientSession();
    const now = new Date();
    
    return {
      sessionActive: !!session,
      sessionExpiry: session?.expires_at,
      timeUntilExpiry: session ? 
        new Date(session.expires_at).getTime() - now.getTime() : 0,
      lastActivity: session?.last_activity_at,
      ...securityMetrics
    };
  };

  return {
    ...auth,
    // Enhanced methods
    signIn: enhancedSignIn,
    signUp: enhancedSignUp,
    signOut: enhancedSignOut,
    
    // Security utilities
    validatePasswordStrength,
    getSecurityStatus,
    securityMetrics,
    sessionActivity,
    
    // Security checks
    detectSuspiciousActivity: (timeWindow?: number) => 
      auth.user?.id ? SecurityService.detectSuspiciousActivity(auth.user.id, timeWindow) : false,
    
    checkRateLimit: SecurityService.checkRateLimit.bind(SecurityService),
    
    // Audit access
    getSecurityAuditLogs: SecurityService.getSecurityAuditLogs.bind(SecurityService)
  };
}