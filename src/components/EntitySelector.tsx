import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

export function EntitySelector() {
  const { availableEntities, currentEntity, setCurrentEntity, isSuperAdmin } = useAuth();

  if (availableEntities.length <= 1) {
    return null; // Don't show selector if user has access to only one entity
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={currentEntity?.entity_uuid || ''}
        onValueChange={(value) => {
          const entity = availableEntities.find(e => e.entity_uuid === value);
          setCurrentEntity(entity || null);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select entity">
            {currentEntity && (
              <div className="flex items-center gap-2">
                <span>{currentEntity.entity_name}</span>
                {isSuperAdmin && (
                  <Badge variant="outline" className="text-xs">
                    Super Admin
                  </Badge>
                )}
                {currentEntity.access_level === 'entity_admin' && !isSuperAdmin && (
                  <Badge variant="secondary" className="text-xs">
                    Admin
                  </Badge>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableEntities.map((entity) => (
            <SelectItem key={entity.entity_uuid} value={entity.entity_uuid}>
              <div className="flex items-center gap-2">
                <span>{entity.entity_name}</span>
                <Badge 
                  variant={entity.access_level === 'entity_admin' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {entity.access_level === 'entity_admin' ? 'Admin' : 'Viewer'}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}