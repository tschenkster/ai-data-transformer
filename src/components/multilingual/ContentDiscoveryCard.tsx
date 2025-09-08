import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Loader2, MousePointer, FileText, Database, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContentType {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const contentTypes: ContentType[] = [
  {
    id: 'ui',
    label: 'UI Elements',
    icon: MousePointer,
    description: 'Interface translations and labels'
  },
  {
    id: 'report_structure',
    label: 'Report Structures',
    icon: FileText,
    description: 'Report names and descriptions'
  },
  {
    id: 'report_line_item',
    label: 'Line Items',
    icon: Database,
    description: 'Report line item descriptions'
  }
];

interface ContentDiscoveryCardProps {
  onAnalysisComplete: (data: any) => void;
}

export function ContentDiscoveryCard({ onAnalysisComplete }: ContentDiscoveryCardProps) {
  const [analysisProgress, setAnalysisProgress] = useState<Record<string, { loading: boolean; progress: number; data?: any }>>({});
  const [globalAnalysis, setGlobalAnalysis] = useState<any>(null);
  const [isGlobalAnalyzing, setIsGlobalAnalyzing] = useState(false);
  const { toast } = useToast();

  const runSelectiveAnalysis = async (contentTypeId: string) => {
    setAnalysisProgress(prev => ({
      ...prev,
      [contentTypeId]: { loading: true, progress: 0 }
    }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => ({
          ...prev,
          [contentTypeId]: {
            ...prev[contentTypeId],
            progress: Math.min(prev[contentTypeId].progress + 10, 90)
          }
        }));
      }, 200);

      const { data, error } = await supabase.functions.invoke('intelligent-translation-migration', {
        body: { 
          operation: `analyze-${contentTypeId === 'report_structure' ? 'structures' : contentTypeId === 'report_line_item' ? 'line-items' : contentTypeId}`,
          contentTypes: [contentTypeId]
        }
      });

      clearInterval(progressInterval);

      if (error) {
        throw new Error(error.message || `Failed to analyze ${contentTypeId}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || `Analysis failed for ${contentTypeId}`);
      }

      setAnalysisProgress(prev => ({
        ...prev,
        [contentTypeId]: { loading: false, progress: 100, data: data.result }
      }));

      toast({
        title: "Analysis Complete",
        description: `Found ${data.result.contentByType[contentTypeId] || 0} ${contentTypes.find(ct => ct.id === contentTypeId)?.label} items`,
      });

    } catch (error: any) {
      setAnalysisProgress(prev => ({
        ...prev,
        [contentTypeId]: { loading: false, progress: 0 }
      }));

      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const runGlobalAnalysis = async () => {
    setIsGlobalAnalyzing(true);
    setGlobalAnalysis(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-translation-migration', {
        body: { operation: 'analyze' }
      });

      if (error) {
        throw new Error(error.message || 'Failed to analyze content');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Analysis failed');
      }

      setGlobalAnalysis(data.result);
      onAnalysisComplete(data.result);

      toast({
        title: "Global Analysis Complete",
        description: `Found ${data.result.totalContentItems} content items and ${data.result.translationGaps.length} translation gaps`,
      });

    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGlobalAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Content Discovery & Analysis
        </CardTitle>
        <CardDescription>
          Discover translatable content with AI-powered language detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Individual Content Type Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contentTypes.map((contentType) => {
            const Icon = contentType.icon;
            const analysis = analysisProgress[contentType.id];
            
            return (
              <div key={contentType.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium text-sm">{contentType.label}</span>
                </div>
                
                <p className="text-xs text-muted-foreground">{contentType.description}</p>
                
                {analysis?.loading && (
                  <div className="space-y-2">
                    <Progress value={analysis.progress} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      Analyzing {contentType.label.toLowerCase()}...
                    </div>
                  </div>
                )}
                
                {analysis?.data && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Found <Badge variant="secondary" className="ml-1">
                        {analysis.data.contentByType[contentType.id] || 0}
                      </Badge> items
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => runSelectiveAnalysis(contentType.id)}
                  disabled={analysis?.loading}
                >
                  {analysis?.loading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="h-3 w-3 mr-2" />
                      Discover
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Global Analysis Section */}
        <div className="border-t pt-4">
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Comprehensive Analysis
            </h4>
            
            {globalAnalysis ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Total Content:</span>
                        <Badge variant="secondary" className="ml-2">
                          {globalAnalysis.totalContentItems}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">UI Elements:</span>
                        <Badge variant="outline" className="ml-2">
                          {globalAnalysis.contentByType.ui}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Structures:</span>
                        <Badge variant="outline" className="ml-2">
                          {globalAnalysis.contentByType.report_structure}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Line Items:</span>
                        <Badge variant="outline" className="ml-2">
                          {globalAnalysis.contentByType.report_line_item}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Translation Gaps:</span>
                      <Badge variant="destructive" className="ml-2">
                        {globalAnalysis.translationGaps.length}
                      </Badge>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Run comprehensive analysis to discover all translatable content across all types
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={runGlobalAnalysis} 
              disabled={isGlobalAnalyzing}
              variant="default"
              className="w-full"
            >
              {isGlobalAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing All Content...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Analyze All Content Types
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}