import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { syncAllDocsToProject } from "@/utils/documentationSync";
import { FileText, RotateCcw as Sync, RefreshCw, CheckCircle, AlertTriangle, Folder, Download } from "lucide-react";

interface DocsStatus {
  database_docs: {
    latest_file?: string;
    last_generated?: string;
    file_size?: number;
  };
  codebase_docs: {
    latest_file?: string;
    last_generated?: string;
    file_size?: number;
  };
  project_sync: {
    last_synced?: string;
    synced_files?: number;
    sync_status?: 'success' | 'failed' | 'pending';
  };
}

export function DocumentationManager() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [docsStatus, setDocsStatus] = useState<DocsStatus>({
    database_docs: {},
    codebase_docs: {},
    project_sync: {}
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Only show for super admins
  if (!isSuperAdmin) {
    return null;
  }

  const fetchDocsStatus = async () => {
    setIsRefreshing(true);
    try {
      // Fetch database documentation status
      const { data: dbDocs } = await supabase.storage
        .from('database-docs')
        .list('', { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });

      // Fetch codebase documentation status
      const { data: codebaseDocs } = await supabase.storage
        .from('codebase-docs')
        .list('', { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });

      // Fetch last sync info from audit logs
      const { data: syncLogs } = await supabase
        .from('security_audit_logs')
        .select('created_at, details')
        .eq('action', 'docs_sync_to_project')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setDocsStatus({
        database_docs: {
          latest_file: dbDocs?.[0]?.name,
          last_generated: dbDocs?.[0]?.created_at,
          file_size: dbDocs?.[0]?.metadata?.size
        },
        codebase_docs: {
          latest_file: codebaseDocs?.[0]?.name,
          last_generated: codebaseDocs?.[0]?.created_at,
          file_size: codebaseDocs?.[0]?.metadata?.size
        },
        project_sync: {
          last_synced: syncLogs?.created_at,
          synced_files: (syncLogs?.details as any)?.total_files || 0,
          sync_status: syncLogs ? 'success' : 'pending'
        }
      });
    } catch (error) {
      console.error('Error fetching docs status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSyncToProject = async () => {
    setIsSyncing(true);
    try {
      toast({
        title: "Syncing Documentation",
        description: "Updating project /docs folder with latest documentation...",
      });

      const result = await syncAllDocsToProject();
      
      if (result.success) {
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${result.total_files} files to project /docs folder`,
        });
        await fetchDocsStatus();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync documentation",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${kb.toFixed(1)} KB`;
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    fetchDocsStatus();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary" />
            <CardTitle>Documentation Manager</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDocsStatus}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Status
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          Manage and synchronize all documentation files between storage and project folder.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Documentation Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Database Documentation */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Database Documentation
            </h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latest:</span>
                <span>{docsStatus.database_docs.latest_file || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Generated:</span>
                <span>{formatDate(docsStatus.database_docs.last_generated)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size:</span>
                <span>{formatFileSize(docsStatus.database_docs.file_size)}</span>
              </div>
            </div>
          </div>

          {/* Codebase Documentation */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Codebase Documentation
            </h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latest:</span>
                <span>{docsStatus.codebase_docs.latest_file || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Generated:</span>
                <span>{formatDate(docsStatus.codebase_docs.last_generated)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size:</span>
                <span>{formatFileSize(docsStatus.codebase_docs.file_size)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Sync Status */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Project /docs Folder Status
            </h4>
            <Badge 
              variant={docsStatus.project_sync.sync_status === 'success' ? 'secondary' : 'outline'}
              className={docsStatus.project_sync.sync_status === 'success' ? 'bg-green-50 text-green-700 border-green-200' : ''}
            >
              {docsStatus.project_sync.sync_status === 'success' ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Synced
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Needs Sync
                </>
              )}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Synced:</span>
              <span>{formatDate(docsStatus.project_sync.last_synced)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Files Synced:</span>
              <span>{docsStatus.project_sync.synced_files || 0}</span>
            </div>
          </div>

          {isSyncing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Syncing to project...</span>
                <span>Processing...</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}
          
          <Button 
            onClick={handleSyncToProject} 
            disabled={isSyncing}
            className="w-full"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing to Project...
              </>
            ) : (
              <>
                <Sync className="mr-2 h-4 w-4" />
                Sync Documentation to Project
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p className="font-medium mb-2">How it works:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Documentation is first generated and stored in Supabase Storage buckets</li>
            <li>Use "Sync to Project" to download and organize files in your local /docs folder</li>
            <li>The sync creates the proper folder structure and updates README files</li>
            <li>Auto-sync happens after each successful documentation generation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}