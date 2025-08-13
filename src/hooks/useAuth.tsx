import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface UserAccount {
  user_account_uuid: string;
  user_account_id: number;
  supabase_user_uuid: string;
  email: string;
  first_name?: string;
  last_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userAccount: UserAccount | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isApproved: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener (no Supabase calls here)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        setUserAccount(null);
        setLoading(false);
      } else {
        setLoading(true);
      }
    });

    // Check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          setLoading(false);
        } else {
          setLoading(true);
        }
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user account when user changes
  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    const fetchUserAccount = async (userId: string) => {
      try {
        console.log('Fetching user account for:', userId);
        
        // Add timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            console.error('User account fetch timeout after 10 seconds');
            setUserAccount(null);
            setLoading(false);
          }
        }, 10000);

        const { data: userAccountData, error } = await supabase
          .from('user_accounts')
          .select('*')
          .eq('supabase_user_uuid', userId)
          .single();

        if (cancelled) return;
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('Error fetching user account:', error);
          setUserAccount(null);
        } else {
          console.log('User account fetched successfully:', userAccountData);
          setUserAccount(userAccountData as UserAccount);
        }
      } catch (err) {
        console.error('User account fetch error:', err);
        if (!cancelled) setUserAccount(null);
      } finally {
        if (!cancelled) {
          console.log('Setting loading to false');
          setLoading(false);
        }
      }
    };

    if (user?.id) {
      fetchUserAccount(user.id);
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user?.id]);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
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

  const isApproved = userAccount?.status === 'approved';
  
  // Admin detection - replace with your actual admin email(s)
  const ADMIN_EMAILS = ['thomas@cfo-team.de']; // Admin email configured
  const SUPER_ADMIN_EMAILS = ['thomas@cfo-team.de']; // Super Admin email configured
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;
  const isSuperAdmin = user?.email ? SUPER_ADMIN_EMAILS.includes(user.email) : false;

  const value = {
    user,
    session,
    userAccount,
    loading,
    signUp,
    signIn,
    signOut,
    isApproved,
    isAdmin,
    isSuperAdmin,
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