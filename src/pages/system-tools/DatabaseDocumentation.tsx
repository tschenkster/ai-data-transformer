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
    // Implementation would go here - for now using mock data
    setIsLoading(false);
  };

  const fetchStoredFiles = async () => {
    // Implementation would go here - for now using mock data
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

      const { data, error } = await supabase.functions.invoke('generate-db-documentation');

      if (error) throw error;

      setProgress(100);
      
      toast({
        title: "Documentation Generated Successfully",
        description: "Database structure documentation has been created and stored.",
      });

      // Refresh the documentation info and files list
      fetchLastDocumentation();
      fetchStoredFiles();

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

  const handleDownload = async () => {
    if (!lastDocumentation) return;
    
    try {
      // Implementation for downloading the latest documentation
      toast({
        title: "Download Started",
        description: "Your documentation file is being prepared...",
      });
    } catch (error) {
      toast({
        title: "Download Failed", 
        description: "Unable to download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Mock data for demonstration
  useEffect(() => {
    setLastDocumentation({
      filename: 'DATABASE-STRUCTURE_20250828_v07.md',
      generated_at: '28/08/2025, 11:46:18',
      generated_by: 'Thomas Schenkelberg',
      file_size: 90112
    });
    setIsLoading(false);
  }, []);

  return (
    <SystemToolsLayout
      toolId="database-docs"
      toolTitle="Database Structure Documentation"
      toolDescription="Generate comprehensive documentation of the current database schema, including tables, relationships, constraints, and security policies."
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

            <Button onClick={handleDownload} variant="outline" className="w-full sm:w-auto">
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
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh File List
              </Button>
              <Button variant="outline" size="sm">
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
            <h4 className="text-sm font-semibold">Available Files (4)</h4>
            
            {/* Mock file entry */}
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium text-sm truncate">DATABASE-STRUCTURE_20250828_v07.md</span>
                  <Badge variant="outline">v07</Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span>📅 Created: 28/08/2025</span>
                  <span>📄 Date: 2025-08-28</span>
                  <span>💾 Size: 88 KB</span>
                  <span>👤 System Generated</span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </SystemToolsLayout>
  );
}