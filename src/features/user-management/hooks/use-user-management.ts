import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { UserService } from '@/features/user-management/services/userService';
import { RoleService } from '@/features/user-management/services/roleService';
import { UserAccount, UserRole, UserFilters } from '@/features/user-management/types';

export function useUserManagement(): {
  users: UserAccount[];
  userRoles: UserRole[];
  filteredUsers: UserAccount[];
  userStats: { total: number; pending: number; approved: number; suspended: number; rejected: number };
  loading: boolean;
  filters: UserFilters;
  setFilters: React.Dispatch<React.SetStateAction<UserFilters>>;
  hasPermission: boolean;
  isSuperAdmin: boolean;
  refetchData: () => Promise<void>;
  getUserRole: (userUuid: string) => string;
  getUserRoleDisplay: (userUuid: string) => { role: string; label: string; variant: string };
  getUserName: (user: UserAccount) => string;
  isUserSuperAdmin: (userUuid: string) => boolean;
} {
  const { isSuperAdmin, isEntityAdmin } = useAuth();
  const { toast } = useToast();

  // State for data
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'all',
    role: 'all'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (isSuperAdmin) {
        // Super admins can see everything
        const [usersData, rolesData] = await Promise.all([
          UserService.fetchUsers(true),
          RoleService.fetchUserRoles()
        ]);

        setUsers(usersData);
        setUserRoles(rolesData);
        
      } else if (isEntityAdmin()) {
        // Entity admins can only see users in their scope
        const usersData = await UserService.fetchUsers(false);
        setUsers(usersData);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Computed values
  const filteredUsers = UserService.filterUsers(users, filters);
  const userStats = UserService.calculateUserStats(users);

  // Permissions check
  const hasPermission = isSuperAdmin || isEntityAdmin();

  return {
    // Data
    users,
    userRoles,
    filteredUsers,
    userStats,
    loading,
    
    // Filters
    filters,
    setFilters,
    
    // Permissions
    hasPermission,
    isSuperAdmin,
    
    // Actions
    refetchData: fetchData,
    
    // Helper functions
    getUserRole: (userUuid: string) => RoleService.getUserRole(userUuid, userRoles),
    getUserRoleDisplay: (userUuid: string) => RoleService.getUserRoleDisplay(userUuid, userRoles),
    getUserName: UserService.getUserName,
    isUserSuperAdmin: (userUuid: string) => RoleService.isUserSuperAdmin(userUuid, userRoles)
  };
}