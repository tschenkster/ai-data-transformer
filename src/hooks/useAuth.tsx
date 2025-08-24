import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface UserAccount {
  user_uuid: string;
  user_id: number;
  supabase_user_uuid: string;
  email: string;
  first_name?: string;
  last_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}

interface UserRole {
  user_role_uuid: string;
  user_id: string;
  role: 'user' | 'admin' | 'super_admin';
  assigned_by?: string;
  assigned_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userAccount: UserAccount | null;
  userRoles: UserRole[];
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isApproved: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  authError: string | null;
  authTimeoutCount: number;
  forceLogout: () => Promise<void>;
  logSecurityEvent: (action: string, targetUserId?: string, details?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authTimeoutCount, setAuthTimeoutCount] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Session validation helper
  const isSessionValid = (session: Session | null): boolean => {
    if (!session) return false;
    
    const now = Date.now() / 1000;
    const expiresAt = session.expires_at || 0;
    
    // Check if session expires within next 5 minutes
    const isExpiringSoon = expiresAt - now < 300;
    if (isExpiringSoon) {
      console.warn('🔐 AuthProvider: Session expiring soon', { expiresAt, now, remainingTime: expiresAt - now });
    }
    
    return expiresAt > now;
  };

  // Force logout helper
  const forceLogout = async () => {
    console.log('🔐 AuthProvider: Force logout triggered');
    setUser(null);
    setSession(null);
    setUserAccount(null);
    setLoading(false);
    setAuthError(null);
    await supabase.auth.signOut();
    navigate('/auth');
  };

  useEffect(() => {
    let mounted = true;
    let initTimeoutId: NodeJS.Timeout;
    
    console.log('🔐 AuthProvider: Initializing auth state listener');

    // Set timeout for initial auth check
    initTimeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.error('🔐 AuthProvider: Initial auth check timeout after 15 seconds');
        setAuthError('Authentication timeout - please refresh the page');
        setLoading(false);
        setAuthTimeoutCount(prev => prev + 1);
      }
    }, 15000);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log('🔐 AuthProvider: Auth state changed', { 
        event, 
        hasSession: !!session, 
        hasUser: !!session?.user,
        isValid: isSessionValid(session)
      });

      clearTimeout(initTimeoutId);
      setAuthError(null);

      // Handle session expiry
      if (session && !isSessionValid(session)) {
        console.warn('🔐 AuthProvider: Invalid/expired session detected');
        forceLogout();
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        console.log('🔐 AuthProvider: No user, clearing state');
        setUserAccount(null);
        setLoading(false);
      } else {
        console.log('🔐 AuthProvider: Valid user found, will fetch account');
        setLoading(true);
      }
    });

    // Check for existing session with timeout
    console.log('🔐 AuthProvider: Checking for existing session');
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('🔐 AuthProvider: Session check error:', error);
          setAuthError('Failed to check session');
          setLoading(false);
          return;
        }

        console.log('🔐 AuthProvider: Initial session check', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          isValid: isSessionValid(session)
        });

        if (session && !isSessionValid(session)) {
          console.warn('🔐 AuthProvider: Initial session is invalid/expired');
          forceLogout();
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          console.log('🔐 AuthProvider: No initial user');
          setLoading(false);
        } else {
          console.log('🔐 AuthProvider: Initial user found');
          setLoading(true);
        }
      } catch (err) {
        console.error('🔐 AuthProvider: Unexpected session check error:', err);
        if (mounted) {
          setAuthError('Unexpected authentication error');
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      console.log('🔐 AuthProvider: Cleaning up auth listener');
      mounted = false;
      clearTimeout(initTimeoutId);
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Fetch user account when user changes
  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    const fetchUserAccount = async (userId: string) => {
      try {
        console.log('👤 AuthProvider: Fetching user account for:', userId);
        
        // Validate session before fetching
        if (!isSessionValid(session)) {
          console.warn('👤 AuthProvider: Session invalid during fetch, forcing logout');
          forceLogout();
          return;
        }
        
        // Reduced timeout to 8 seconds
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            console.error('👤 AuthProvider: User account fetch timeout after 8 seconds');
            setAuthError('Account loading timeout - please try refreshing');
            setUserAccount(null);
            setLoading(false);
            setAuthTimeoutCount(prev => prev + 1);
          }
        }, 8000);

        // Fetch user account
        const { data: userAccountData, error: accountError } = await supabase
          .from('user_accounts')
          .select('*')
          .eq('supabase_user_uuid', userId)
          .maybeSingle(); // Use maybeSingle to handle missing records gracefully

        if (cancelled) {
          console.log('👤 AuthProvider: Fetch cancelled for user:', userId);
          return;
        }
        
        if (accountError) {
          console.error('👤 AuthProvider: Error fetching user account:', accountError);
          setAuthError('Failed to load account data');
          setUserAccount(null);
          setUserRoles([]);
        } else if (!userAccountData) {
          console.warn('👤 AuthProvider: No user account found for user:', userId);
          setAuthError('Account not found - contact administrator');
          setUserAccount(null);
          setUserRoles([]);
        } else {
          console.log('👤 AuthProvider: User account fetched successfully:', userAccountData);
          setUserAccount(userAccountData as UserAccount);
          
          // Fetch user roles
          const { data: rolesData, error: rolesError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', userId);

          if (rolesError) {
            console.error('👤 AuthProvider: Error fetching user roles:', rolesError);
            setUserRoles([]);
          } else {
            console.log('👤 AuthProvider: User roles fetched successfully:', rolesData);
            setUserRoles((rolesData || []) as UserRole[]);
          }
          
          setAuthError(null);
        }
        
        clearTimeout(timeoutId);
      } catch (err) {
        console.error('👤 AuthProvider: User account fetch error:', err);
        if (!cancelled) {
          setAuthError('Unexpected error loading account');
          setUserAccount(null);
        }
      } finally {
        if (!cancelled) {
          console.log('👤 AuthProvider: Setting loading to false');
          setLoading(false);
        }
      }
    };

    if (user?.id) {
      console.log('👤 AuthProvider: User ID changed, fetching account:', user.id);
      setAuthError(null); // Clear any previous errors
      fetchUserAccount(user.id);
    } else {
      console.log('👤 AuthProvider: No user ID, skipping account fetch');
      setLoading(false);
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user?.id, session]);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      if (error) {
        toast({
          title: "Signup Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Created",
          description: "Your account is pending approval. You'll be notified when approved.",
          variant: "default",
        });
      }

      return { error };
    } catch (err: any) {
      toast({
        title: "Signup Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Login Error",
          description: error.message,
          variant: "destructive",
        });
      }

      return { error };
    } catch (err: any) {
      toast({
        title: "Login Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Compute role flags using the new role system
  const isApproved = userAccount?.status === 'approved';
  const hasRole = (role: string) => userRoles.some(r => r.role === role);
  const isAdmin = isApproved && (hasRole('admin') || hasRole('super_admin'));
  const isSuperAdmin = isApproved && hasRole('super_admin');

  // Security audit logging function
  const logSecurityEvent = async (action: string, targetUserId?: string, details?: any) => {
    if (!user) return;
    
    try {
      await supabase.rpc('log_security_event', {
        p_action: action,
        p_target_user_id: targetUserId || null,
        p_details: details || null
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const value = {
    user,
    session,
    userAccount,
    userRoles,
    loading,
    signUp,
    signIn,
    signOut,
    isApproved,
    isAdmin,
    isSuperAdmin,
    authError,
    authTimeoutCount,
    forceLogout,
    logSecurityEvent,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}