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
import { Download, FileText, RefreshCw, Trash2, Calendar, User, HardDrive, CheckCircle, Search, Filter, Eye, Archive, AlertTriangle, Database, Shield, Zap, BarChart3, RotateCcw as Sync } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { syncAllDocsToProject } from '@/utils/documentationSync';

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
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [lastDocumentation, setLastDocumentation] = useState<DocumentationInfo | null>(null);
  const [storedFiles, setStoredFiles] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('date');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [fileFilter, setFileFilter] = useState<string>('all');
  const [dbStats, setDbStats] = useState<any>(null);
  const [isSyncingToProject, setIsSyncingToProject] = useState(false);

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
    setCurrentPhase('');
    
    const phases = [
      { name: 'Schema Analysis', icon: Database, description: 'Analyzing database schema structure' },
      { name: 'Security Policies', icon: Shield, description: 'Documenting RLS policies and permissions' },
      { name: 'Performance Data', icon: Zap, description: 'Collecting performance metrics and indexes' },
      { name: 'Report Generation', icon: FileText, description: 'Generating comprehensive documentation' }
    ];

    try {
      toast({
        title: "Starting Database Documentation",
        description: "Initializing schema analysis...",
      });

      // Enhanced progress simulation with phases
      let currentPhaseIndex = 0;
      const progressInterval = setInterval(() => {
        const phaseProgress = Math.floor((progress % 25));
        const newPhaseIndex = Math.floor(progress / 25);
        
        if (newPhaseIndex < phases.length && newPhaseIndex !== currentPhaseIndex) {
          currentPhaseIndex = newPhaseIndex;
          setCurrentPhase(phases[currentPhaseIndex].name);
          toast({
            title: phases[currentPhaseIndex].name,
            description: phases[currentPhaseIndex].description,
          });
        }
        
        setProgress(prev => Math.min(prev + 2, 90));
      }, 300);

      const { data, error } = await supabase.functions.invoke('generate-db-documentation');
      
      clearInterval(progressInterval);

      if (error) throw error;

      setProgress(100);
      setCurrentPhase('Complete');
      
      toast({
        title: "Documentation Generated Successfully", 
        description: `Database documentation created: ${data.filename}`,
      });

      // Auto-download functionality
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

      // Refresh data
      await Promise.all([fetchLastDocumentation(), fetchStoredFiles()]);

      // Auto-sync to project after successful generation
      await handleSyncToProject();

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
      setCurrentPhase('');
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

  const handleSyncToProject = async () => {
    setIsSyncingToProject(true);
    
    try {
      toast({
        title: "Syncing to Project",
        description: "Updating project documentation folder...",
      });

      const result = await syncAllDocsToProject();
      
      if (result.success) {
        toast({
          title: "Sync Complete",
          description: `Updated ${result.total_files} files in project /docs folder`,
        });
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Error syncing to project:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync documentation to project.",
        variant: "destructive",
      });
    } finally {
      setIsSyncingToProject(false);
    }
  };


  return (
    <SystemToolsLayout
      toolId="database-docs"
      toolTitle="Database Structure Documentation"
      toolDescription="Generate comprehensive documentation of the current database schema, including tables, relationships, constraints, and security policies."
      showNavigation={false}
    >
      {/* Enhanced Generation Card with Progress Tracker */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Generate Database Documentation</CardTitle>
          </div>
          <CardDescription>
            Create comprehensive documentation of your database schema, security policies, and performance metrics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isGenerating && (
            <div className="space-y-4">
              {/* Enhanced Progress Tracker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {currentPhase ? `Phase: ${currentPhase}` : 'Starting documentation generation...'}
                  </span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="w-full h-2" />
              </div>

              {/* Phase Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                {[
                  { name: 'Schema Analysis', icon: Database, phase: 0 },
                  { name: 'Security Policies', icon: Shield, phase: 1 },
                  { name: 'Performance Data', icon: Zap, phase: 2 },
                  { name: 'Report Generation', icon: FileText, phase: 3 }
                ].map((phase, index) => {
                  const PhaseIcon = phase.icon;
                  const isActive = currentPhase === phase.name;
                  const isCompleted = progress > (index + 1) * 25;
                  
                  return (
                    <div 
                      key={phase.name}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        isActive 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : isCompleted 
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-muted bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      <PhaseIcon className={`h-4 w-4 mx-auto mb-1 ${
                        isActive ? 'animate-pulse' : ''
                      }`} />
                      <div className="text-xs font-medium">{phase.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={generateDocumentation} 
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating Documentation...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Generate Database Documentation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Statistics Preview */}
      {dbStats && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Database Statistics</CardTitle>
            </div>
            <CardDescription>
              Current database metrics and schema information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">{dbStats.tableCount || 0}</div>
                <div className="text-sm text-muted-foreground">Tables</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{dbStats.policyCount || 0}</div>
                <div className="text-sm text-muted-foreground">RLS Policies</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{dbStats.functionCount || 0}</div>
                <div className="text-sm text-muted-foreground">Functions</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{dbStats.indexCount || 0}</div>
                <div className="text-sm text-muted-foreground">Indexes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => handleDownload()} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Latest Documentation
              </Button>
              <Button onClick={handleSyncToProject} disabled={isSyncingToProject} variant="secondary">
                {isSyncingToProject ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Sync className="mr-2 h-4 w-4" />
                    Sync to Project
                  </>
                )}
              </Button>
            </div>
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

      {/* Advanced File Management with Tabs */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            <CardTitle>Documentation File Management</CardTitle>
          </div>
          <CardDescription>
            Comprehensive management system for all generated database documentation files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="browser" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                File Browser
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Maintenance
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">{storedFiles.length}</div>
                  <div className="text-sm text-muted-foreground">Total Files</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {storedFiles.reduce((acc, file) => acc + (file.metadata?.size || 0), 0) > 0 
                      ? formatFileSize(storedFiles.reduce((acc, file) => acc + (file.metadata?.size || 0), 0))
                      : '0 KB'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Total Size</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {storedFiles.length > 0 ? new Date(Math.max(...storedFiles.map(f => new Date(f.created_at).getTime()))).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">Latest File</div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={handleRefreshFiles}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Files
                </Button>
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

              {/* Recent Files Quick Access */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Recent Files</h4>
                {storedFiles.slice(0, 3).map((file) => (
                  <div key={file.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{file.name}</span>
                        <Badge variant="outline">{getFileVersion(file.name)}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>📅 {new Date(file.created_at).toLocaleDateString()}</span>
                        <span>💾 {formatFileSize(file.metadata?.size)}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(file.name)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {storedFiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No documentation files found.</p>
                    <p className="text-sm">Generate documentation to create your first file.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* File Browser Tab */}
            <TabsContent value="browser" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search files by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={fileFilter} onValueChange={setFileFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter files" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Files</SelectItem>
                      <SelectItem value="recent">Recent (Last 7 days)</SelectItem>
                      <SelectItem value="large">Large Files (&gt;1MB)</SelectItem>
                      <SelectItem value="small">Small Files (&lt;1MB)</SelectItem>
                    </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    All Files ({storedFiles.filter(file => {
                      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesFilter = fileFilter === 'all' || 
                        (fileFilter === 'recent' && new Date(file.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
                        (fileFilter === 'large' && (file.metadata?.size || 0) > 1024 * 1024) ||
                        (fileFilter === 'small' && (file.metadata?.size || 0) <= 1024 * 1024);
                      return matchesSearch && matchesFilter;
                    }).length})
                  </h4>
                  {selectedFiles.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedFiles.length} selected
                      </span>
                      <Button variant="outline" size="sm" onClick={() => setSelectedFiles([])}>
                        Clear Selection
                      </Button>
                    </div>
                  )}
                </div>

                {storedFiles
                  .filter(file => {
                    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesFilter = fileFilter === 'all' || 
                      (fileFilter === 'recent' && new Date(file.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
                      (fileFilter === 'large' && (file.metadata?.size || 0) > 1024 * 1024) ||
                      (fileFilter === 'small' && (file.metadata?.size || 0) <= 1024 * 1024);
                    return matchesSearch && matchesFilter;
                  })
                  .map((file) => (
                    <div key={file.name} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox
                        checked={selectedFiles.includes(file.name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFiles([...selectedFiles, file.name]);
                          } else {
                            setSelectedFiles(selectedFiles.filter(f => f !== file.name));
                          }
                        }}
                      />
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
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(file.name)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                {storedFiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No documentation files found.</p>
                    <p className="text-sm">Generate documentation to create your first file.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Maintenance Tab */}
            <TabsContent value="maintenance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Cleanup Policies</CardTitle>
                    <CardDescription>Automated file management options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" onClick={handleCleanupFiles} className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Keep Latest 10 Files
                    </Button>
                    <Button variant="outline" className="w-full" disabled>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive Old Files (Coming Soon)
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Bulk Operations</CardTitle>
                    <CardDescription>Actions for selected files</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      disabled={selectedFiles.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Selected ({selectedFiles.length})
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      disabled={selectedFiles.length === 0}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected ({selectedFiles.length})
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Storage Information</CardTitle>
                  <CardDescription>Current storage usage and limits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Storage Used:</span>
                      <span className="text-sm font-medium">
                        {storedFiles.reduce((acc, file) => acc + (file.metadata?.size || 0), 0) > 0 
                          ? formatFileSize(storedFiles.reduce((acc, file) => acc + (file.metadata?.size || 0), 0))
                          : '0 KB'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Files:</span>
                      <span className="text-sm font-medium">{storedFiles.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bucket:</span>
                      <span className="text-sm font-medium">database-docs</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </SystemToolsLayout>
  );
}