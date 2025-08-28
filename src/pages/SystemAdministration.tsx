import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Database, FileText, Calendar, User, AlertCircle, Cloud, Archive } from 'lucide-react';
import Footer from '@/components/Footer';
import type { FileObject } from '@supabase/storage-js';

interface DocumentationInfo {
  filename: string;
  generated_at: string;
  generated_by: string;
  version: string;
  file_size?: number;
  storage_path?: string;
  upload_success?: boolean;
}

export default function SystemAdministration() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastDocumentation, setLastDocumentation] = useState<DocumentationInfo | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [storedFiles, setStoredFiles] = useState<FileObject[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchLastDocumentation();
      fetchStoredFiles();
    }
  }, [isSuperAdmin]);

  const fetchStoredFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const { data, error } = await supabase.storage
        .from('database-docs')
        .list('', {
          limit: 20,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error fetching stored files:', error);
      } else {
        setStoredFiles(data || []);
      }
    } catch (error) {
      console.error('Error fetching stored files:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const cleanupOldFiles = async () => {
    setIsCleaningUp(true);
    try {
      const { data, error } = await supabase.rpc('cleanup_old_documentation_files', {
        p_keep_count: 10
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Cleanup Complete",
        description: `Successfully cleaned up ${data} old documentation files.`,
      });

      await fetchStoredFiles();
    } catch (error) {
      console.error('Error cleaning up files:', error);
      toast({
        title: "Cleanup Failed",
        description: error.message || 'Failed to cleanup old documentation files',
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const downloadStoredFile = async (filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('database-docs')
        .download(filename);

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Downloading ${filename}...`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: error.message || 'Failed to download the file',
        variant: "destructive",
      });
    }
  };

  const fetchLastDocumentation = async () => {
    try {
      // Query audit logs for last documentation generation
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .eq('action', 'database_documentation_generated')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        const details = data.details as any;
        setLastDocumentation({
          filename: details.filename,
          generated_at: data.created_at,
          generated_by: details.generated_by_name || 'System',
          version: details.version,
          file_size: details.file_size
        });
      }
    } catch (error) {
      console.log('No previous documentation found');
    }
  };

  const generateDocumentation = async () => {
    setIsGenerating(true);
    setDownloadUrl(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-db-documentation', {
        body: {}
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Documentation Generated",
          description: `Database documentation has been successfully generated: ${data.filename}`,
        });

        setDownloadUrl(data.download_url);
        await fetchLastDocumentation();
        
        // Refresh stored files list to show the new file (with slight delay for background upload)
        setTimeout(() => {
          fetchStoredFiles();
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to generate documentation');
      }
    } catch (error) {
      console.error('Error generating documentation:', error);
      toast({
        title: "Generation Failed",
        description: error.message || 'Failed to generate database documentation',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = lastDocumentation?.filename || 'database-structure.md';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Access denied. Only Super Administrators can access System Administration features.
            </AlertDescription>
          </Alert>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">System Administration</h1>
          <p className="text-muted-foreground">
            Advanced system management tools and database operations for Super Administrators
          </p>
        </div>

        <div className="grid gap-6">
          {/* Database Documentation Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Structure Documentation
              </CardTitle>
              <CardDescription>
                Generate comprehensive documentation of the current database schema, including tables, 
                relationships, constraints, and security policies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Generation Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={generateDocumentation}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Generate Database Documentation
                    </>
                  )}
                </Button>

                {downloadUrl && (
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Generated Documentation
                  </Button>
                )}
              </div>

              {/* Progress Indicator */}
              {isGenerating && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Analyzing database schema and generating documentation. This may take up to 60 seconds 
                    for large databases...
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {/* Last Generated Documentation Info */}
              {lastDocumentation ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Last Generated Documentation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Filename</div>
                      <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {lastDocumentation.filename}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Version</div>
                      <Badge variant="secondary">{lastDocumentation.version}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Generated
                      </div>
                      <div className="text-sm">
                        {new Date(lastDocumentation.generated_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Generated By
                      </div>
                      <div className="text-sm">{lastDocumentation.generated_by}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No database documentation has been generated yet.</p>
                  <p className="text-sm">Click the button above to generate your first documentation.</p>
                </div>
              )}

              {/* Documentation Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Documentation Contents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Complete schema overview
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Table structures and columns
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Data types and constraints
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Indexes and performance data
                    </li>
                  </ul>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Foreign key relationships
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Row Level Security policies
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Database functions and triggers
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Enums and custom types
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stored Documentation Files Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Stored Documentation Files
              </CardTitle>
              <CardDescription>
                Manage and download previously generated documentation files stored in the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Storage Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={fetchStoredFiles}
                  disabled={isLoadingFiles}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isLoadingFiles ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <Cloud className="h-4 w-4" />
                      Refresh File List
                    </>
                  )}
                </Button>

                <Button
                  onClick={cleanupOldFiles}
                  disabled={isCleaningUp || storedFiles.length === 0}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isCleaningUp ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      Cleanup Old Files (Keep 10)
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              {/* Stored Files List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Available Files ({storedFiles.length})
                </h3>

                {isLoadingFiles ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading stored files...</p>
                  </div>
                ) : storedFiles.length > 0 ? (
                  <div className="space-y-3">
                    {storedFiles.map((file) => (
                      <div 
                        key={file.id || file.name} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="font-medium font-mono text-sm">{file.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(file.created_at).toLocaleString()}
                            </span>
                            {file.metadata?.size && (
                              <span>
                                {(file.metadata.size / 1024).toFixed(1)} KB
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => downloadStoredFile(file.name)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Cloud className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No stored documentation files found.</p>
                    <p className="text-sm">Generate documentation to create files in storage.</p>
                  </div>
                )}
              </div>

              {/* Storage Information */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Storage Information</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Files are automatically stored in Supabase Storage after generation</li>
                  <li>• Old files are automatically cleaned up to maintain performance</li>
                  <li>• Only Super Administrators can access and manage these files</li>
                  <li>• Each file includes comprehensive schema documentation and metadata</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    </div>
  );
}