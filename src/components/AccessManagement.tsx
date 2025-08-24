import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users, Plus, Settings, Trash2, Edit } from 'lucide-react';

interface EntityGroup {
  entity_group_uuid: string;
  entity_group_id: number;
  entity_group_name: string;
  entity_group_code: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface Entity {
  entity_uuid: string;
  entity_id: number;
  entity_name: string;
  entity_group_uuid: string;
  entity_group_id: number;
  entity_group_name?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface UserEntityAccess {
  user_entity_access_uuid: string;
  user_account_uuid: string;
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

export function AccessManagement() {
  const { isSuperAdmin, userAccount, currentEntity, isEntityAdmin } = useAuth();
  const { toast } = useToast();
  const [entityGroups, setEntityGroups] = useState<EntityGroup[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [userAccess, setUserAccess] = useState<UserEntityAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreateEntityOpen, setIsCreateEntityOpen] = useState(false);
  const [isEditEntityOpen, setIsEditEntityOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [selectedGroupUuid, setSelectedGroupUuid] = useState('');

  // Form states
  const [groupForm, setGroupForm] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [entityForm, setEntityForm] = useState({
    name: '',
    description: '',
    entity_group_uuid: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (isSuperAdmin) {
        // Super admins can see all entity groups and entities
        const [groupsResponse, entitiesResponse, accessResponse] = await Promise.all([
          supabase.from('entity_groups').select('*').order('entity_group_name'),
          supabase.from('entities').select(`
            *,
            entity_groups!inner(entity_group_name)
          `).order('entity_id'),
          supabase.from('user_entity_access')
            .select(`
              *,
              user_accounts!fk_user_entity_access_user(email, first_name, last_name),
              entities(entity_name),
              entity_groups(entity_group_name)
            `)
            .eq('is_active', true)
        ]);

        if (groupsResponse.error) throw groupsResponse.error;
        if (entitiesResponse.error) throw entitiesResponse.error;
        if (accessResponse.error) throw accessResponse.error;

        setEntityGroups(groupsResponse.data || []);
        // Flatten the joined data
        const flattenedEntities = (entitiesResponse.data || []).map(entity => ({
          ...entity,
          entity_group_name: entity.entity_groups?.entity_group_name
        }));
        setEntities(flattenedEntities);
        setUserAccess(accessResponse.data || []);
      } else if (isEntityAdmin()) {
        // Entity admins can see their entities and manage access within their scope
        if (currentEntity) {
          const [entityResponse, accessResponse] = await Promise.all([
            supabase.from('entities')
              .select('*, entity_groups(*)')
              .eq('entity_uuid', currentEntity.entity_uuid)
              .single(),
            supabase.from('user_entity_access')
              .select(`
                *,
                user_accounts!fk_user_entity_access_user(email, first_name, last_name),
                entities!inner(entity_name)
              `)
              .eq('entity_uuid', currentEntity.entity_uuid)
              .eq('is_active', true)
          ]);

          if (entityResponse.error) throw entityResponse.error;
          if (accessResponse.error) throw accessResponse.error;

          setEntities([entityResponse.data]);
          setUserAccess(accessResponse.data || []);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load entity data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createEntityGroup = async () => {
    try {
      const { error } = await supabase
        .from('entity_groups')
        .insert([{
          entity_group_name: groupForm.name,
          entity_group_code: groupForm.code,
          description: groupForm.description,
          created_by_user_uuid: userAccount?.user_uuid
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Entity group created successfully",
      });

      setIsCreateGroupOpen(false);
      setGroupForm({ name: '', code: '', description: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create entity group",
        variant: "destructive",
      });
    }
  };

  const createEntity = async () => {
    try {
      const selectedGroup = entityGroups.find(g => g.entity_group_uuid === entityForm.entity_group_uuid);
      if (!selectedGroup) throw new Error("Please select an entity group");

      const { error } = await supabase
        .from('entities')
        .insert([{
          entity_name: entityForm.name,
          entity_code: `ENT_${Date.now()}`, // Auto-generate code since it's still required by DB
          entity_group_uuid: entityForm.entity_group_uuid,
          entity_group_id: selectedGroup.entity_group_id,
          description: entityForm.description,
          created_by_user_uuid: userAccount?.user_uuid
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Entity created successfully",
      });

      setIsCreateEntityOpen(false);
      setEntityForm({ name: '', description: '', entity_group_uuid: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create entity",
        variant: "destructive",
      });
    }
  };

  const updateEntity = async () => {
    try {
      if (!editingEntity) return;

      const selectedGroup = entityGroups.find(g => g.entity_group_uuid === entityForm.entity_group_uuid);
      if (!selectedGroup) throw new Error("Please select an entity group");

      const { error } = await supabase
        .from('entities')
        .update({
          entity_name: entityForm.name,
          entity_group_uuid: entityForm.entity_group_uuid,
          entity_group_id: selectedGroup.entity_group_id,
          description: entityForm.description
        })
        .eq('entity_uuid', editingEntity.entity_uuid);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Entity updated successfully",
      });

      setIsEditEntityOpen(false);
      setEditingEntity(null);
      setEntityForm({ name: '', description: '', entity_group_uuid: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update entity",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (entity: Entity) => {
    setEditingEntity(entity);
    setEntityForm({
      name: entity.entity_name,
      description: entity.description || '',
      entity_group_uuid: entity.entity_group_uuid
    });
    setIsEditEntityOpen(true);
  };

  if (!isSuperAdmin && !isEntityAdmin()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Management</CardTitle>
          <CardDescription>
            You don't have permission to manage entities. Contact your administrator for access.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Management</CardTitle>
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
          <Building2 className="h-5 w-5" />
          Access Management
        </CardTitle>
        <CardDescription>
          Manage entities, entity groups, and user access permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="entities" className="space-y-4">
          <TabsList>
            <TabsTrigger value="entities">Entities</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="groups">Entity Groups</TabsTrigger>}
            <TabsTrigger value="access">User Access</TabsTrigger>
          </TabsList>

          <TabsContent value="entities" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Entities</h3>
              {isSuperAdmin && (
                <Dialog open={isCreateEntityOpen} onOpenChange={setIsCreateEntityOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Entity
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Entity</DialogTitle>
                      <DialogDescription>
                        Create a new entity within an entity group
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="entity-name">Entity Name</Label>
                        <Input
                          id="entity-name"
                          value={entityForm.name}
                          onChange={(e) => setEntityForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., ACME Corporation"
                        />
                       </div>
                       <div>
                         <Label htmlFor="entity-group">Entity Group</Label>
                        <Select 
                          value={entityForm.entity_group_uuid} 
                          onValueChange={(value) => setEntityForm(prev => ({ ...prev, entity_group_uuid: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select entity group" />
                          </SelectTrigger>
                          <SelectContent>
                            {entityGroups.map((group) => (
                              <SelectItem key={group.entity_group_uuid} value={group.entity_group_uuid}>
                                {group.entity_group_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="entity-description">Description</Label>
                        <Textarea
                          id="entity-description"
                          value={entityForm.description}
                          onChange={(e) => setEntityForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Optional description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateEntityOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createEntity}>Create Entity</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Legal Entity</TableHead>
                  <TableHead>Group ID</TableHead>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entities.map((entity) => (
                  <TableRow key={entity.entity_uuid}>
                    <TableCell className="font-mono text-sm">{entity.entity_id}</TableCell>
                    <TableCell className="font-medium">{entity.entity_name}</TableCell>
                    <TableCell className="font-mono text-sm">{entity.entity_group_id}</TableCell>
                    <TableCell>{entity.entity_group_name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant={entity.is_active ? "default" : "secondary"}>
                        {entity.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isSuperAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(entity)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Edit Entity Dialog */}
            <Dialog open={isEditEntityOpen} onOpenChange={setIsEditEntityOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Entity</DialogTitle>
                  <DialogDescription>
                    Update entity information
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-entity-name">Entity Name</Label>
                    <Input
                      id="edit-entity-name"
                      value={entityForm.name}
                      onChange={(e) => setEntityForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., ACME Corporation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-entity-group">Entity Group</Label>
                    <Select 
                      value={entityForm.entity_group_uuid} 
                      onValueChange={(value) => setEntityForm(prev => ({ ...prev, entity_group_uuid: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity group" />
                      </SelectTrigger>
                      <SelectContent>
                        {entityGroups.map((group) => (
                          <SelectItem key={group.entity_group_uuid} value={group.entity_group_uuid}>
                            {group.entity_group_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-entity-description">Description</Label>
                    <Textarea
                      id="edit-entity-description"
                      value={entityForm.description}
                      onChange={(e) => setEntityForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditEntityOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={updateEntity}>Update Entity</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="groups" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Entity Groups</h3>
                <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Entity Group</DialogTitle>
                      <DialogDescription>
                        Create a new entity group to organize your entities
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                          id="group-name"
                          value={groupForm.name}
                          onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., ACME Holdings"
                        />
                      </div>
                      <div>
                        <Label htmlFor="group-code">Group Code</Label>
                        <Input
                          id="group-code"
                          value={groupForm.code}
                          onChange={(e) => setGroupForm(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="e.g., ACME_HOLDINGS"
                        />
                      </div>
                      <div>
                        <Label htmlFor="group-description">Description</Label>
                        <Textarea
                          id="group-description"
                          value={groupForm.description}
                          onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Optional description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createEntityGroup}>Create Group</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entityGroups.map((group) => (
                    <TableRow key={group.entity_group_uuid}>
                      <TableCell className="font-mono text-sm">{group.entity_group_id}</TableCell>
                      <TableCell className="font-medium">{group.entity_group_name}</TableCell>
                      <TableCell className="font-mono text-sm">{group.entity_group_code}</TableCell>
                      <TableCell>
                        <Badge variant={group.is_active ? "default" : "secondary"}>
                          {group.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(group.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          )}

          <TabsContent value="access" className="space-y-4">
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}