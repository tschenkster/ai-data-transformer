import { SystemToolsLayout } from '@/features/system-administration/components/SystemToolsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Download, FileText, RefreshCw, Trash2, Calendar, User, HardDrive, CheckCircle } from "lucide-react";

interface DocumentationInfo {
  filename: string;
  generated_at: string;
  generated_by: string;
  file_size?: number;
}

export default function DatabaseDocumentation() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastDocumentation, setLastDocumentation] = useState<DocumentationInfo | null>(null);
  const [storedFiles, setStoredFiles] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('date');
  const [isLoading, setIsLoading] = useState(true);

  if (!isSuperAdmin) {
    return (
      <SystemToolsLayout
        toolId="database-docs"
        toolTitle="Database Structure Documentation"
        toolDescription="Generate comprehensive documentation of the current database schema."
        showNavigation={false}
      >
        <Card className="w-96 mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You must be a Super Administrator to access this page.
            </p>
          </CardContent>
        </Card>
      </SystemToolsLayout>
    );
  }

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${kb.toFixed(1)} KB`;
  };

  const getFileVersion = (filename: string): string => {
    const match = filename.match(/_v(\d+)\.md$/);
    return match ? `v${match[1]}` : 'v1';
  };

  const getFileDate = (filename: string): string => {
    const match = filename.match(/(\d{8})/);
    if (match) {
      const dateStr = match[1];
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${day}/${month}/${year}`;
    }
    return 'Unknown';
  };

  const fetchLastDocumentation = async () => {
    try {
      // Get the most recent documentation generation event
      const { data: auditLog, error: auditError } = await supabase
        .from('security_audit_logs')
        .select('created_at, details, user_id')
        .eq('action', 'database_documentation_generated')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (auditError) {
        console.error('Error fetching audit log:', auditError);
        setLastDocumentation(null);
        return;
      }

      if (auditLog && auditLog.details) {
        const details = auditLog.details as any;
        // Get user name from user_accounts
        const { data: userAccount } = await supabase
          .from('user_accounts')
          .select('first_name, last_name, email')
          .eq('supabase_user_uuid', auditLog.user_id)
          .maybeSingle();

        const userName = userAccount 
          ? `${userAccount.first_name || ''} ${userAccount.last_name || ''}`.trim() || userAccount.email
          : 'System Generated';

        setLastDocumentation({
          filename: details.filename || 'Unknown',
          generated_at: new Date(auditLog.created_at).toLocaleString(),
          generated_by: userName,
          file_size: details.file_size
        });
      } else {
        setLastDocumentation(null);
      }
    } catch (error) {
      console.error('Error fetching last documentation:', error);
      setLastDocumentation(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStoredFiles = async () => {
    try {
      const { data: files, error } = await supabase.storage
        .from('database-docs')
        .list('', {
          sortBy: { 
            column: sortBy === 'date' ? 'created_at' : sortBy === 'size' ? 'size' : 'name',
            order: 'desc'
          }
        });

      if (error) {
        console.error('Error fetching stored files:', error);
        return;
      }

      // Filter only markdown files
      const markdownFiles = files?.filter(file => 
        file.name.endsWith('.md') && file.name.startsWith('DATABASE-STRUCTURE_')
      ) || [];

      setStoredFiles(markdownFiles);
    } catch (error) {
      console.error('Error fetching stored files:', error);
      setStoredFiles([]);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchLastDocumentation();
      fetchStoredFiles();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchStoredFiles();
  }, [sortBy]);

  const generateDocumentation = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      toast({
        title: "Generating Documentation",
        description: "Starting database structure analysis...",
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('generate-db-documentation');
      
      clearInterval(progressInterval);

      if (error) throw error;

      setProgress(100);
      
      toast({
        title: "Documentation Generated Successfully",
        description: `File created: ${data.filename}`,
      });

      // If the response includes content, trigger immediate download
      if (data.content && data.filename) {
        const blob = new Blob([data.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // Refresh the documentation info and files list
      await Promise.all([fetchLastDocumentation(), fetchStoredFiles()]);

    } catch (error) {
      console.error('Error generating documentation:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate documentation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleDownload = async (filename?: string) => {
    const targetFilename = filename || lastDocumentation?.filename;
    if (!targetFilename) return;
    
    try {
      toast({
        title: "Download Started",
        description: "Preparing your documentation file...",
      });

      const { data, error } = await supabase.storage
        .from('database-docs')
        .download(targetFilename);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = targetFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `${targetFilename} has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed", 
        description: "Unable to download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshFiles = async () => {
    toast({
      title: "Refreshing File List",
      description: "Loading latest files from storage...",
    });
    await fetchStoredFiles();
    toast({
      title: "File List Updated",
      description: "The file list has been refreshed successfully.",
    });
  };

  const handleCleanupFiles = async () => {
    try {
      toast({
        title: "Cleaning Up Files",
        description: "Removing old documentation files...",
      });

      const { data, error } = await supabase.rpc('cleanup_old_documentation_files', {
        p_keep_count: 10
      });

      if (error) throw error;

      toast({
        title: "Cleanup Complete",
        description: `Removed ${data} old files. Kept the 10 most recent files.`,
      });

      await fetchStoredFiles();
    } catch (error) {
      console.error('Cleanup error:', error);
      toast({
        title: "Cleanup Failed",
        description: "Unable to clean up old files. Please try again.",
        variant: "destructive",
      });
    }
  };


  return (
    <SystemToolsLayout
      toolId="database-docs"
      toolTitle="Database Structure Documentation"
      toolDescription="Generate comprehensive documentation of the current database schema, including tables, relationships, constraints, and security policies."
      showNavigation={false}
    >
      {/* Generation Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Generate Documentation</CardTitle>
          </div>
          <CardDescription>
            Create a comprehensive markdown file documenting the current database structure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Generating documentation...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
          
          <Button 
            onClick={generateDocumentation} 
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Database Documentation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Last Generated Documentation */}
      {lastDocumentation && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle>Latest Documentation</CardTitle>
              </div>
              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                {getFileVersion(lastDocumentation.filename)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Filename:</span>
                <span className="text-muted-foreground truncate">{lastDocumentation.filename}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Generated:</span>
                <span className="text-muted-foreground">{lastDocumentation.generated_at}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">By:</span>
                <span className="text-muted-foreground">{lastDocumentation.generated_by}</span>
              </div>
            </div>

            <Button onClick={() => handleDownload()} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Download Latest Documentation
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Documentation Contents Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation Contents</CardTitle>
          <CardDescription>
            The generated documentation includes the following comprehensive information:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Complete schema overview</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Table structures and columns</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Data types and constraints</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Indexes and performance data</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Foreign key relationships</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Row Level Security policies</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Database functions and triggers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Enums and custom types</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stored Documentation Files */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              <CardTitle>Stored Documentation Files</CardTitle>
            </div>
          </div>
          <CardDescription>
            Manage and download previously generated documentation files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleRefreshFiles}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh File List
              </Button>
              <Button variant="outline" size="sm" onClick={handleCleanupFiles}>
                <Trash2 className="mr-2 h-4 w-4" />
                Cleanup Old Files (Keep 10)
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date Created</SelectItem>
                  <SelectItem value="size">File Size</SelectItem>
                  <SelectItem value="name">Filename</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Available Files ({storedFiles.length})</h4>
            
            {storedFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documentation files found.</p>
                <p className="text-sm">Generate documentation to create your first file.</p>
              </div>
            ) : (
              storedFiles.map((file) => (
                <div key={file.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{file.name}</span>
                      <Badge variant="outline">{getFileVersion(file.name)}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>📅 Created: {new Date(file.created_at).toLocaleDateString()}</span>
                      <span>📄 Date: {getFileDate(file.name)}</span>
                      <span>💾 Size: {formatFileSize(file.metadata?.size)}</span>
                      <span>👤 System Generated</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(file.name)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </SystemToolsLayout>
  );
}