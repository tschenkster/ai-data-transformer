import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, userAccount, loading, isAdmin, isApproved } = useAuth();

  console.log('🛡️ AdminRoute: Checking access', {
    loading,
    hasUser: !!user,
    userEmail: user?.email,
    hasUserAccount: !!userAccount,
    userAccountStatus: userAccount?.status,
    isAdmin,
    isApproved
  });

  if (loading) {
    console.log('🛡️ AdminRoute: Still loading, showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
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
            <CardDescription>Unable to load your account. Please try refreshing the page.</CardDescription>
          </CardHeader>
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