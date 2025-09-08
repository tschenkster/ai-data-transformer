import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecurityAuditLog, AccessManagement } from '@/features/data-security';
import { SecurityAuditDashboard } from '@/features/auth';
import { UserManagementPanel } from '@/features/user-management';
import Footer from '@/components/Footer';
import { useUITranslations } from '@/hooks/useUITranslations';

export default function Admin() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const { t } = useUITranslations();

  return (
    <div className="bg-background">
      {/* Main Content */}
      <div className="container mx-auto p-6 space-y-6">
        {/* Management Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            {(isSuperAdmin || isAdmin) && (
              <TabsTrigger value="users">{t('TAB_USERS', 'Users')}</TabsTrigger>
            )}
            {(isSuperAdmin || isAdmin) && (
              <TabsTrigger value="entities">{t('PAGE_ENTITY_MANAGEMENT', 'Entity Management')}</TabsTrigger>
            )}
            <TabsTrigger value="audit">{t('TAB_AUDIT_LOG', 'Audit Log')}</TabsTrigger>
            <TabsTrigger value="security">{t('TAB_SECURITY_DASHBOARD', 'Security Dashboard')}</TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="space-y-4">
            <SecurityAuditLog />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <SecurityAuditDashboard />
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