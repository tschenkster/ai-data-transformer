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
  const [generationProgress, setGenerationProgress] = useState({
    phase: '',
    progress: 0,
    message: '',
    error: null
  });
  const [lastDocumentation, setLastDocumentation] = useState<DocumentationInfo | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [storedFiles, setStoredFiles] = useState<FileObject[]>([]);
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'size'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced file formatting utilities
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileVersion = (filename: string): string => {
    const match = filename.match(/_v(\d+)\.md$/);
    return match ? `v${match[1]}` : 'Unknown';
  };

  const getFileDate = (filename: string): string => {
    const match = filename.match(/(\d{8})/);
    if (match) {
      const dateStr = match[1];
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return 'Unknown';
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchLastDocumentation();
      fetchStoredFiles();
    }
  }, [isSuperAdmin]);

  // Refresh files when sorting changes
  useEffect(() => {
    if (isSuperAdmin && storedFiles.length > 0) {
      fetchStoredFiles();
    }
  }, [sortBy, sortOrder]);

  const fetchStoredFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const { data, error } = await supabase.storage
        .from('database-docs')
        .list('', {
          limit: 50,
          offset: 0,
          sortBy: { column: sortBy === 'size' ? 'created_at' : sortBy, order: sortOrder }
        });

      if (error) {
        console.error('Error fetching stored files:', error);
        toast({
          title: "Failed to Load Files",
          description: "Could not retrieve stored documentation files.",
          variant: "destructive",
        });
      } else {
        let files = data || [];
        
        // Custom sorting for size since Supabase storage doesn't support it directly
        if (sortBy === 'size' && files.length > 0) {
          files = files.sort((a, b) => {
            const sizeA = a.metadata?.size || 0;
            const sizeB = b.metadata?.size || 0;
            return sortOrder === 'desc' ? sizeB - sizeA : sizeA - sizeB;
          });
        }
        
        setStoredFiles(files);
      }
    } catch (error) {
      console.error('Error fetching stored files:', error);
      toast({
        title: "Network Error",
        description: "Failed to connect to file storage. Please try again.",
        variant: "destructive",
      });
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

  const generateDocumentation = async (isRetry = false) => {
    setIsGenerating(true);
    setDownloadUrl(null);
    setGenerationProgress({
      phase: 'initialization',
      progress: 0,
      message: 'Starting documentation generation...',
      error: null
    });
    
    try {
      // Real-time progress updates
      const progressTimer = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev.progress < 90) {
            let newProgress = prev.progress + 2;
            let newMessage = prev.message;
            
            if (newProgress < 15) {
              newMessage = 'Authenticating and preparing session...';
            } else if (newProgress < 30) {
              newMessage = 'Analyzing database schema...';
            } else if (newProgress < 50) {
              newMessage = 'Fetching table structures and relationships...';
            } else if (newProgress < 70) {
              newMessage = 'Processing security policies and constraints...';
            } else if (newProgress < 85) {
              newMessage = 'Generating comprehensive documentation...';
            } else {
              newMessage = 'Preparing file for storage...';
            }
            
            return { ...prev, progress: newProgress, message: newMessage };
          }
          return prev;
        });
      }, 1000);

      const { data, error } = await supabase.functions.invoke('generate-db-documentation', {
        body: {}
      });

      clearInterval(progressTimer);

      if (error) {
        // Check if it's a timeout or temporary error for retry logic
        const isRetriableError = error.message?.includes('timeout') || 
                                error.message?.includes('network') ||
                                error.message?.includes('temporarily');
        
        if (isRetriableError && retryCount < 2) {
          setRetryCount(prev => prev + 1);
          setGenerationProgress({
            phase: 'retry',
            progress: 0,
            message: `Retrying... (Attempt ${retryCount + 2}/3)`,
            error: null
          });
          
          toast({
            title: "Retrying Generation",
            description: `Network issue detected. Retrying... (${retryCount + 2}/3)`,
            variant: "default",
          });
          
          // Wait 2 seconds before retry
          setTimeout(() => generateDocumentation(true), 2000);
          return;
        }
        
        throw error;
      }

      if (data.success) {
        setGenerationProgress({
          phase: 'complete',
          progress: 100,
          message: 'Documentation generated successfully!',
          error: null
        });

        toast({
          title: "Documentation Generated",
          description: `Successfully generated ${data.filename} (${(data.file_size / 1024).toFixed(1)} KB)`,
        });

        setDownloadUrl(data.download_url);
        setRetryCount(0); // Reset retry count on success
        await fetchLastDocumentation();
        
        // Refresh stored files list with proper delay for background upload
        setTimeout(() => {
          fetchStoredFiles();
        }, 3000);
      } else {
        throw new Error(data.error || 'Unknown error occurred during generation');
      }
    } catch (error) {
      console.error('Error generating documentation:', error);
      
      setGenerationProgress({
        phase: 'error',
        progress: 0,
        message: 'Generation failed',
        error: error.message
      });

      const errorMessage = error.message || 'Failed to generate database documentation';
      const isNetworkError = errorMessage.includes('network') || errorMessage.includes('timeout');
      
      toast({
        title: "Generation Failed",
        description: isNetworkError 
          ? `${errorMessage}. Please check your connection and try again.`
          : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      
      // Reset progress after a delay
      setTimeout(() => {
        setGenerationProgress({
          phase: '',
          progress: 0,
          message: '',
          error: null
        });
      }, 5000);
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
                  onClick={() => generateDocumentation(false)}
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

              {/* Enhanced Progress Indicator */}
              {isGenerating && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {generationProgress.phase === 'retry' ? 'Retrying Generation' : 'Generating Documentation'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(generationProgress.progress)}%
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${generationProgress.progress}%` }}
                          ></div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {generationProgress.message}
                        </div>
                        
                        {generationProgress.phase === 'retry' && (
                          <div className="text-xs text-amber-600 dark:text-amber-400">
                            Network issue detected. Retrying automatically...
                          </div>
                        )}
                        
                        {retryCount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Retry attempt: {retryCount}/2
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                  
                  {/* Detailed Processing Info */}
                  <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm">
                    <div className="font-medium">Processing Details:</div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Analyzing database schema and table structures</li>
                      <li>• Extracting relationships and foreign key constraints</li>
                      <li>• Processing Row Level Security policies</li>
                      <li>• Cataloging database functions and triggers</li>
                      <li>• Generating comprehensive documentation with examples</li>
                      <li>• Uploading to secure storage for persistent access</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Success/Error State */}
              {!isGenerating && generationProgress.phase === 'complete' && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Documentation generation completed successfully! File has been saved to storage.
                  </AlertDescription>
                </Alert>
              )}

              {!isGenerating && generationProgress.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">Generation failed:</div>
                      <div className="text-sm">{generationProgress.error}</div>
                      <Button 
                        onClick={() => generateDocumentation(false)}
                        size="sm"
                        variant="outline"
                        className="mt-2"
                      >
                        Try Again
                      </Button>
                    </div>
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
              {/* Enhanced Storage Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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

                {/* Enhanced Sorting Controls */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'created_at' | 'name' | 'size')}
                    className="px-2 py-1 border rounded text-sm bg-background"
                  >
                    <option value="created_at">Date Created</option>
                    <option value="name">Name</option>
                    <option value="size">Size</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-2 py-1 border rounded text-sm hover:bg-accent transition-colors"
                  >
                    {sortOrder === 'desc' ? '↓' : '↑'}
                  </button>
                </div>
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
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors group"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="font-medium font-mono text-sm">{file.name}</div>
                            <Badge variant="outline" className="text-xs">
                              {getFileVersion(file.name)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Created: {new Date(file.created_at).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>Date: {getFileDate(file.name)}</span>
                            </div>
                            
                            {file.metadata?.size && (
                              <div className="flex items-center gap-1">
                                <Database className="h-3 w-3" />
                                <span>Size: {formatFileSize(file.metadata.size)}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>System Generated</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => downloadStoredFile(file.name)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity"
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