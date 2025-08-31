import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, AlertCircle } from 'lucide-react';
import { fetchLatestDbStructureDocs, type SyncResult } from '@/utils/documentationSync';
import Footer from '@/components/Footer';

export default function DocumentationSync() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [isFetching, setIsFetching] = useState(false);
  const [lastFetch, setLastFetch] = useState<SyncResult | null>(null);

  const handleFetch = async () => {
    setIsFetching(true);
    try {
      const result = await fetchLatestDbStructureDocs();
      setLastFetch(result);
      
      if (result.success) {
        toast({
          title: "Documentation Fetched",
          description: `Successfully downloaded ${result.filename}`,
        });
      } else {
        toast({
          title: "Fetch Failed",
          description: result.error || "Failed to fetch documentation",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fetch Error",
        description: error.message || "Unexpected error during fetch",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Access denied. Only Super Administrators can fetch database structure documentation.
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Database Structure Documentation</h1>
          <p className="text-muted-foreground">
            Fetch the latest database structure documentation from storage and download it locally.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Fetch Database Structure Docs
            </CardTitle>
            <CardDescription>
              Download the latest database structure documentation from Supabase Storage as a local file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleFetch}
              disabled={isFetching}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isFetching ? 'Fetching Documentation...' : 'Fetch Latest Documentation'}
            </Button>

            {lastFetch && (
              <div className="mt-4">
                {lastFetch.success ? (
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Success:</strong> Downloaded {lastFetch.filename} 
                      {lastFetch.size && ` (${(lastFetch.size / 1024).toFixed(1)} KB)`}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Error:</strong> {lastFetch.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="text-sm text-muted-foreground mt-4">
              <h4 className="font-medium mb-2">What this does:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Fetches the most recent DATABASE-STRUCTURE_[date]_v[num].md file</li>
                <li>Downloads it from Supabase Storage</li>
                <li>Triggers a browser download of the documentation file</li>
                <li>Logs the fetch operation for audit purposes</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}