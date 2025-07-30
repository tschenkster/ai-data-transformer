import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Brain, Database, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUpload } from '@/components/FileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ProcessingStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
}

export const MemoryUpload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [completed, setCompleted] = useState(false);

  const handleFileProcessed = async (data: { accounts: string[]; filename: string; totalAccounts: number }) => {
    if (!user) {
      toast.error('Please log in to upload historical data');
      return;
    }

    setIsProcessing(true);
    setCompleted(false);

    try {
      // Format accounts data for embedding generation
      const accountsData = data.accounts.map(account => ({
        original_account_name: account,
        mapped_account_name: account, // For historical data, these might be the same initially
        user_id: user.id,
        confidence_score: 1.0,
        reasoning: `Historical mapping from ${data.filename}`,
        validated: true
      }));

      setProcessingStats({
        total: accountsData.length,
        processed: 0,
        successful: 0,
        failed: 0
      });

      // Generate embeddings for historical accounts
      const { data: embeddingResult, error } = await supabase.functions.invoke('generate-embeddings', {
        body: { 
          accounts: accountsData,
          batchSize: 5 // Smaller batches for historical upload
        }
      });

      if (error) {
        throw new Error(`Failed to generate embeddings: ${error.message}`);
      }

      if (!embeddingResult.success) {
        throw new Error(embeddingResult.error || 'Unknown error occurred');
      }

      // Update processing stats
      setProcessingStats({
        total: embeddingResult.summary.total,
        processed: embeddingResult.summary.total,
        successful: embeddingResult.summary.successful,
        failed: embeddingResult.summary.failed
      });

      setCompleted(true);
      
      toast.success(
        `Successfully processed ${embeddingResult.summary.successful} historical mappings! Your AI memory is now enhanced.`
      );

    } catch (error) {
      console.error('Error processing historical data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process historical data');
    } finally {
      setIsProcessing(false);
    }
  };

  const progress = processingStats 
    ? (processingStats.processed / processingStats.total) * 100 
    : 0;

  if (completed && processingStats) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-success-light flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-2xl">Memory Enhancement Complete!</CardTitle>
            <CardDescription>
              Your AI system now has access to {processingStats.successful} historical account mappings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-card">
                <div className="text-2xl font-bold text-primary">{processingStats.total}</div>
                <div className="text-sm text-muted-foreground">Total Accounts</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-success-light">
                <div className="text-2xl font-bold text-success">{processingStats.successful}</div>
                <div className="text-sm text-muted-foreground">Successfully Processed</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-destructive/10">
                <div className="text-2xl font-bold text-destructive">{processingStats.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/10">
                <div className="text-2xl font-bold text-primary">
                  {Math.round((processingStats.successful / processingStats.total) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>

            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                Your AI will now use these historical mappings to provide more accurate suggestions 
                and learn from past decisions. The vector database is ready for similarity search!
              </AlertDescription>
            </Alert>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Upload More Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-2xl">Processing Historical Data</CardTitle>
            <CardDescription>
              Generating embeddings and building your AI memory database...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {processingStats && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{processingStats.processed} / {processingStats.total}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-primary/10">
                    <div className="text-lg font-semibold text-primary">{processingStats.successful}</div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-lg font-semibold">{processingStats.processed}</div>
                    <div className="text-sm text-muted-foreground">Processed</div>
                  </div>
                  <div className="p-4 rounded-lg bg-destructive/10">
                    <div className="text-lg font-semibold text-destructive">{processingStats.failed}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </div>
              </>
            )}

            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                This process may take a few minutes depending on the file size. 
                We're using Google Gemini to generate high-quality embeddings for each account to enable precise similarity search.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Memory Enhancement</h1>
        <p className="text-muted-foreground">
          Upload historical account mappings to enhance your AI's knowledge base and improve mapping accuracy.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">1</div>
              <div className="text-sm">Upload your historical account mappings file</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">2</div>
              <div className="text-sm">Google Gemini generates vector embeddings for each account</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">3</div>
              <div className="text-sm">Embeddings are stored in the vector database</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">4</div>
              <div className="text-sm">Future mappings use similarity search for better accuracy</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              File Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <div className="font-medium mb-1">Supported formats:</div>
              <div className="text-muted-foreground">Excel (.xlsx), CSV (.csv)</div>
            </div>
            <div className="text-sm">
              <div className="font-medium mb-1">Required columns:</div>
              <div className="text-muted-foreground">
                • account_name (or similar)
                <br />
                • mapped_account (optional)
              </div>
            </div>
            <div className="text-sm">
              <div className="font-medium mb-1">Recommended:</div>
              <div className="text-muted-foreground">
                Use your bridge_accounts_used_to_reporting_structure.xlsx file 
                or similar historical mapping data
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Historical Data</CardTitle>
          <CardDescription>
            Select your historical account mappings file to enhance the AI memory database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload onFileProcessed={handleFileProcessed} />
        </CardContent>
      </Card>
    </div>
  );
};