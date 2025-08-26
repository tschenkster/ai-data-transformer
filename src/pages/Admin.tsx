import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecurityAuditLog } from '@/components/SecurityAuditLog';
import { AccessManagement } from '@/components/AccessManagement';
import { UserManagementPanel } from '@/components/UserManagementPanel';
import Footer from '@/components/Footer';

export default function Admin() {
  const { isSuperAdmin, isAdmin } = useAuth();

  return (
    <div className="bg-background">
      {/* Main Content */}
      <div className="container mx-auto p-6 space-y-6">
        {/* Management Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            {(isSuperAdmin || isAdmin) && (
              <TabsTrigger value="users">Users</TabsTrigger>
            )}
            {(isSuperAdmin || isAdmin) && (
              <TabsTrigger value="entities">Entity Management</TabsTrigger>
            )}
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="space-y-4">
            <SecurityAuditLog />
          </TabsContent>

          {(isSuperAdmin || isAdmin) && (
            <TabsContent value="users" className="space-y-4">
              <UserManagementPanel />
            </TabsContent>
          )}

          {(isSuperAdmin || isAdmin) && (
            <TabsContent value="entities" className="space-y-4">
              <AccessManagement />
            </TabsContent>
          )}

        </Tabs>
        </div>
        <Footer />
      </div>
    );
}