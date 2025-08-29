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
import { Download, FileSpreadsheet, RefreshCw, Trash2, Calendar, User, HardDrive, CheckCircle, Code2, GitBranch, AlertTriangle } from "lucide-react";

interface DocumentationInfo {
  filename: string;
  generated_at: string;
  generated_by: string;
  file_size?: number;
  violations_count?: number;
}

export default function CodebaseDocumentation() {
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
        toolId="codebase-docs"
        toolTitle="Codebase Documentation Generator"
        toolDescription="Generate comprehensive documentation of the codebase structure."
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
      const { data: auditLog, error: auditError } = await supabase
        .from('security_audit_logs')
        .select('created_at, details, user_id')
        .eq('action', 'codebase_documentation_generated')
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
          file_size: details.file_size,
          violations_count: details.violations_count
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
        .from('codebase-docs')
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

      const markdownFiles = files?.filter(file => 
        file.name.endsWith('.md') && file.name.startsWith('CODEBASE-STRUCTURE_')
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
        description: "Starting codebase structure analysis...",
      });

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('generate-codebase-documentation');
      
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
        .from('codebase-docs')
        .download(targetFilename);

      if (error) throw error;

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

  return (
    <SystemToolsLayout
      toolId="codebase-docs"
      toolTitle="Codebase Documentation Generator"
      toolDescription="Generate comprehensive documentation of the codebase structure, including features, components, conventions compliance, and architectural insights."
      showNavigation={false}
    >
      {/* Generation Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <CardTitle>Generate Documentation</CardTitle>
          </div>
          <CardDescription>
            Create a comprehensive markdown file documenting the current codebase structure, feature modules, and convention compliance.
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
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Generate Codebase Documentation
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
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                  {getFileVersion(lastDocumentation.filename)}
                </Badge>
                {lastDocumentation.violations_count !== undefined && (
                  <Badge variant={lastDocumentation.violations_count === 0 ? "secondary" : "destructive"}>
                    {lastDocumentation.violations_count === 0 ? "No Issues" : `${lastDocumentation.violations_count} Issues`}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
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
                <Code2 className="w-4 h-4 text-green-500" />
                <span className="text-sm">Feature modules structure</span>
              </div>
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-green-500" />
                <span className="text-sm">Component hierarchy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm">Pages and routing structure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm">Shared UI components</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm">Edge functions overview</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm">Configuration files</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm">Convention violations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm">Architecture recommendations</span>
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
            Manage and download previously generated codebase documentation files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleRefreshFiles}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh File List
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
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No codebase documentation files found.</p>
                <p className="text-sm">Generate documentation to create your first file.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {storedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Date: {getFileDate(file.name)}</span>
                          <span>Size: {formatFileSize(file.metadata?.size)}</span>
                          <span>Version: {getFileVersion(file.name)}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownload(file.name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </SystemToolsLayout>
  );
}