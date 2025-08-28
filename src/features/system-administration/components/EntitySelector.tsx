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
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Building2 className="h-3 w-3" />
        <span>Entity</span>
      </div>
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
              <span className="truncate">{currentEntity.entity_name}</span>
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