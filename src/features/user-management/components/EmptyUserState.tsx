import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Search } from 'lucide-react';

interface EmptyUserStateProps {
  isFiltered: boolean;
  onClearFilters?: () => void;
  onInviteUser?: () => void;
  canInviteUsers: boolean;
}

export function EmptyUserState({ 
  isFiltered, 
  onClearFilters, 
  onInviteUser, 
  canInviteUsers 
}: EmptyUserStateProps) {
  if (isFiltered) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No users found</h3>
              <p className="text-muted-foreground max-w-md">
                No users match your current filters. Try adjusting your search criteria or clearing the filters.
              </p>
            </div>
            {onClearFilters && (
              <Button variant="outline" onClick={onClearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="text-center py-16">
        <div className="flex flex-col items-center space-y-6">
          <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center">
            <Users className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Welcome to User Management</h3>
            <p className="text-muted-foreground max-w-md">
              Start by inviting team members to join your organization. You can manage their roles, 
              permissions, and access levels from this dashboard.
            </p>
          </div>
          
          {canInviteUsers && (
            <div className="space-y-3">
              <Button onClick={onInviteUser} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite your first user
              </Button>
              <p className="text-xs text-muted-foreground">
                Users will receive an email invitation to join
              </p>
            </div>
          )}

          {!canInviteUsers && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                You don't have permission to invite users. Contact your administrator for access.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}