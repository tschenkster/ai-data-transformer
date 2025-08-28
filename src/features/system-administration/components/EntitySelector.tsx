import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

export function EntitySelector() {
  const { availableEntities, currentEntity, setCurrentEntity, isSuperAdmin, isAdmin } = useAuth();
  
  const getRoleText = () => {
    if (isSuperAdmin) return 'Super Admin';
    if (isAdmin) return 'Admin';
    return 'Viewer';
  };

  if (availableEntities.length <= 1) {
    return null; // Don't show selector if user has access to only one entity
  }

  return (
    <Select
        value={currentEntity?.entity_uuid || ''}
        onValueChange={(value) => {
          const entity = availableEntities.find(e => e.entity_uuid === value);
          setCurrentEntity(entity || null);
        }}
      >
        <SelectTrigger className="w-full h-8 text-xs">
          <SelectValue placeholder="Select entity">
            {currentEntity && (
              <span className="truncate">
                {currentEntity.entity_name} ({getRoleText()})
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableEntities.map((entity) => {
            // Determine the correct role display for this entity
            const getEntityRoleText = (entity: any) => {
              if (isSuperAdmin) return 'Super Admin';
              if (entity.access_level === 'entity_admin') return 'Admin';
              return 'Viewer';
            };

            const getEntityRoleBadgeVariant = (entity: any) => {
              if (isSuperAdmin) return 'default';
              if (entity.access_level === 'entity_admin') return 'secondary';
              return 'outline';
            };

            return (
              <SelectItem key={entity.entity_uuid} value={entity.entity_uuid}>
                <div className="flex items-center gap-2">
                  <span>{entity.entity_name}</span>
                  <Badge 
                    variant={getEntityRoleBadgeVariant(entity)}
                    className="text-xs"
                  >
                    {getEntityRoleText(entity)}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
    </Select>
  );
}