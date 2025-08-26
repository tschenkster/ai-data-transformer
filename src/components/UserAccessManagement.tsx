import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';

interface UserEntityAccess {
  user_entity_access_uuid: string;
  user_uuid: string;
  user_accounts?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  entities?: {
    entity_name: string;
  };
  entity_groups?: {
    entity_group_name: string;
  };
  entity_uuid?: string;
  entity_name?: string;
  entity_group_uuid?: string;
  entity_group_name?: string;
  access_level: 'viewer' | 'entity_admin';
  granted_at: string;
  is_active: boolean;
}

export function UserAccessManagement() {
  const { isSuperAdmin, currentEntity, isEntityAdmin } = useAuth();
  const { toast } = useToast();
  const [userAccess, setUserAccess] = useState<UserEntityAccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAccess();
  }, []);

  const fetchUserAccess = async () => {
    try {
      setLoading(true);
      
      if (isSuperAdmin) {
        // Super admins can see all user access
        const accessResponse = await supabase.from('user_entity_access')
          .select(`
            *,
            user_accounts!fk_user_entity_access_user(email, first_name, last_name),
            entities(entity_name),
            entity_groups(entity_group_name)
          `)
          .eq('is_active', true);

        if (accessResponse.error) throw accessResponse.error;
        setUserAccess(accessResponse.data || []);
      } else if (isEntityAdmin()) {
        // Entity admins can see access within their scope
        if (currentEntity) {
          const accessResponse = await supabase.from('user_entity_access')
            .select(`
              *,
              user_accounts!fk_user_entity_access_user(email, first_name, last_name),
              entities!inner(entity_name)
            `)
            .eq('entity_uuid', currentEntity.entity_uuid)
            .eq('is_active', true);

          if (accessResponse.error) throw accessResponse.error;
          setUserAccess(accessResponse.data || []);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load user access data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin && !isEntityAdmin()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Access Management</CardTitle>
          <CardDescription>
            You don't have permission to view user access. Contact your administrator for access.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Access Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Access Management
        </CardTitle>
        <CardDescription>
          View and manage user permissions and access levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">User Entity Access</h3>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead>Granted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userAccess.map((access) => (
                <TableRow key={access.user_entity_access_uuid}>
                  <TableCell>
                    {access.user_accounts?.first_name && access.user_accounts?.last_name 
                      ? `${access.user_accounts.first_name} ${access.user_accounts.last_name}`
                      : 'Unknown User'
                    }
                  </TableCell>
                  <TableCell>{access.user_accounts?.email || 'Unknown'}</TableCell>
                  <TableCell>
                    {access.entities?.entity_name || access.entity_groups?.entity_group_name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={access.access_level === 'entity_admin' ? "default" : "secondary"}>
                      {access.access_level === 'entity_admin' ? 'Admin' : 'Viewer'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(access.granted_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}