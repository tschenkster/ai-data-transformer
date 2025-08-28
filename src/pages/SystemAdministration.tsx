import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Database, FileText, Calendar, User, AlertCircle } from 'lucide-react';
import Footer from '@/components/Footer';

interface DocumentationInfo {
  filename: string;
  generated_at: string;
  generated_by: string;
  version: string;
  file_size?: number;
}

export default function SystemAdministration() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastDocumentation, setLastDocumentation] = useState<DocumentationInfo | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchLastDocumentation();
    }
  }, [isSuperAdmin]);

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
        </div>

        <Footer />
      </div>
    </div>
  );
}