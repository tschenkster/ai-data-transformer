import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, userAccount, loading, isAdmin, isApproved, authError, authTimeoutCount, forceLogout } = useAuth();

  console.log('🛡️ AdminRoute: Checking access', {
    loading,
    hasUser: !!user,
    userEmail: user?.email,
    hasUserAccount: !!userAccount,
    userAccountStatus: userAccount?.user_status,
    isAdmin,
    isApproved
  });

  if (loading) {
    console.log('🛡️ AdminRoute: Still loading, showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[400px]">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <div className="text-lg">Loading...</div>
              {authError && (
                <div className="text-sm text-destructive text-center">
                  {authError}
                </div>
              )}
              {authTimeoutCount > 0 && (
                <button 
                  onClick={forceLogout}
                  className="text-sm text-muted-foreground underline hover:text-foreground"
                >
                  Having trouble? Try logging in again
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    console.log('🛡️ AdminRoute: No user, access denied');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be logged in to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!userAccount) {
    console.log('🛡️ AdminRoute: No user account, showing error');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Account Error</CardTitle>
            <CardDescription>
              {authError || "Unable to load your account. Please try refreshing the page."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md"
            >
              Refresh Page
            </button>
            <button 
              onClick={forceLogout}
              className="w-full mt-2 text-sm text-muted-foreground underline hover:text-foreground"
            >
              Or try logging in again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isApproved) {
    console.log('🛡️ AdminRoute: User not approved');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Account Not Approved</CardTitle>
            <CardDescription>Your account is not approved yet. Only approved users can access admin features.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    console.log('🛡️ AdminRoute: User not admin');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>You don't have administrator privileges to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  console.log('🛡️ AdminRoute: Access granted, rendering children');
  return <>{children}</>;
}