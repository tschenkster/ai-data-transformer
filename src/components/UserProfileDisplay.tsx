import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Shield, Clock, MapPin } from 'lucide-react';

interface EnhancedUserData {
  user_uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  user_status: string;
  roles: string[];
  is_admin: boolean;
  is_super_admin: boolean;
}

export function UserProfileDisplay() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<EnhancedUserData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchEnhancedUserData();
    }
  }, [user?.id]);

  const fetchEnhancedUserData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_user_with_roles', { p_supabase_user_uuid: user.id });

      if (error) {
        console.error('Error fetching enhanced user data:', error);
        return;
      }

      if (data && data.length > 0) {
        setUserData(data[0] as EnhancedUserData);
      }
    } catch (error) {
      console.error('Error in fetchEnhancedUserData:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userData) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            User Profile
          </CardTitle>
          <CardDescription>Unable to load profile data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-4 w-4" />
          {userData.first_name && userData.last_name 
            ? `${userData.first_name} ${userData.last_name}`
            : 'User Profile'
          }
        </CardTitle>
        <CardDescription>{userData.email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge className={getStatusColor(userData.user_status)}>
            {userData.user_status}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Roles:</span>
          <div className="flex gap-1 flex-wrap">
            {userData.roles.length > 0 ? (
              userData.roles.map((role) => (
                <Badge key={role} className={getRoleColor(role)}>
                  {role.replace('_', ' ')}
                </Badge>
              ))
            ) : (
              <Badge variant="outline">No roles assigned</Badge>
            )}
          </div>
        </div>

        {(userData.is_admin || userData.is_super_admin) && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">
                Administrative Access
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}