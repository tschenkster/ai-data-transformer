import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Languages, Database, Bot, CheckCircle, AlertCircle, Loader2, Search, BarChart3 } from 'lucide-react';
import { MultilingualSelector } from '@/components/MultilingualSelector';
import { TranslationEditor } from '@/components/TranslationEditor';
import { TranslationGapsViewer } from '@/components/TranslationGapsViewer';
import { TranslationService } from '@/services/translationService';
import { useLanguagePreference } from '@/hooks/useTranslations';
import { useToast } from '@/hooks/use-toast';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import { supabase } from '@/integrations/supabase/client';

export default function MultilingualManagement() {
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isGeneratingTranslations, setIsGeneratingTranslations] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [translationStatus, setTranslationStatus] = useState<any>(null);
  const [translationEditorOpen, setTranslationEditorOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { language, changeLanguage } = useLanguagePreference();
  const { toast } = useToast();

  const breadcrumbItems = [
    { label: 'System Tools', path: '/admin/system-tools' },
    { label: 'Multilingual Management', path: '/admin/multilingual-management' }
  ];

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisData(null);
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-translation-migration', {
        body: { operation: 'analyze' }
      });

      if (error) {
        console.error('Analysis error:', error);
        throw new Error(error.message || 'Failed to analyze content');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Analysis failed');
      }

      setAnalysisData(data.result);
      toast({
        title: "Analysis Complete",
        description: `Found ${data.result.totalContentItems} content items and ${data.result.translationGaps.length} translation gaps`,
      });
    } catch (error: any) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze content",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runMigration = async () => {
    if (!analysisData) {
      toast({
        title: "Analysis Required",
        description: "Please run content analysis first",
        variant: "destructive",
      });
      return;
    }

    setIsMigrating(true);
    setMigrationStatus(null);
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-translation-migration', {
        body: { 
          operation: 'migrate',
          filters: {} // Could add language or content type filters
        }
      });

      if (error) {
        console.error('Migration error:', error);
        throw new Error(error.message || 'Failed to migrate content');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Migration failed');
      }

      setMigrationStatus(data.result);
      toast({
        title: "Migration Complete",
        description: `Generated ${data.result.translationsGenerated} translations across all content types`,
      });
    } catch (error: any) {
      console.error('Migration failed:', error);
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to migrate content",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Auto-run analysis on component mount
  useEffect(() => {
    runAnalysis();
  }, []);

  return (
    <CompactPageLayout 
      breadcrumbItems={breadcrumbItems}
      currentPage="Multilingual Management"
    >
      <div className="space-y-6">

        {/* Content Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Content Discovery & Analysis
            </CardTitle>
            <CardDescription>
              Intelligent analysis of all content requiring translation with language detection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysisData ? (
              <div className="space-y-4">
                <Alert>
                  <BarChart3 className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total Content:</span>
                          <Badge variant="secondary" className="ml-2">
                            {analysisData.totalContentItems}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">UI Elements:</span>
                          <Badge variant="outline" className="ml-2">
                            {analysisData.contentByType.ui}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Structures:</span>
                          <Badge variant="outline" className="ml-2">
                            {analysisData.contentByType.report_structure}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Line Items:</span>
                          <Badge variant="outline" className="ml-2">
                            {analysisData.contentByType.report_line_item}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium">Detected Languages:</span>
                        <div className="mt-1 space-x-2">
                          {Object.entries(analysisData.detectedLanguages).map(([lang, count]: [string, number]) => (
                            <Badge key={lang} variant="secondary">
                              {lang.toUpperCase()}: {count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium">Translation Gaps:</span>
                        <Badge variant="destructive" className="ml-2">
                          {analysisData.translationGaps.length}
                        </Badge>
                        <span className="text-sm text-muted-foreground ml-2">
                          missing translations across all languages
                        </span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                
                {/* Translation Gaps Details */}
                {analysisData.translationGaps && analysisData.translationGaps.length > 0 && (
                  <TranslationGapsViewer gaps={analysisData.translationGaps} />
                )}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Run content analysis to discover all translatable content and identify gaps.
                  This will scan UI elements, report structures, and line items with AI-powered language detection.
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={runAnalysis} 
              disabled={isAnalyzing}
              variant="outline"
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Content...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  {analysisData ? 'Refresh Analysis' : 'Run Content Analysis'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Intelligent Migration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Intelligent Translation Migration
            </CardTitle>
            <CardDescription>
              AI-powered translation migration with automatic language detection and multi-directional translation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {migrationStatus ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Migration completed successfully!</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">UI Elements:</span>
                        <Badge variant="secondary" className="ml-2">
                          {migrationStatus.uiElementsProcessed}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Structures:</span>
                        <Badge variant="secondary" className="ml-2">
                          {migrationStatus.structuresProcessed}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Line Items:</span>
                        <Badge variant="secondary" className="ml-2">
                          {migrationStatus.lineItemsProcessed}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Translations:</span>
                        <Badge variant="secondary" className="ml-2">
                          {migrationStatus.translationsGenerated}
                        </Badge>
                      </div>
                    </div>
                    {migrationStatus.errors && migrationStatus.errors.length > 0 && (
                      <div className="text-sm text-amber-600">
                        <span className="font-medium">Errors:</span>
                        <Badge variant="destructive" className="ml-2">
                          {migrationStatus.errors.length}
                        </Badge>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Run intelligent migration to automatically detect source languages and generate translations.
                  This will process UI elements, report structures, and line items with multi-directional translation.
                  {!analysisData && (
                    <span className="text-amber-600 block mt-1">
                      Note: Run content analysis first to see what will be processed.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={runMigration} 
              disabled={isMigrating || !analysisData}
              className="w-full"
            >
              {isMigrating ? (
                <>
                  <Bot className="h-4 w-4 mr-2 animate-pulse" />
                  Migrating Content...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Run Intelligent Migration
                </>
              )}
            </Button>
          </CardContent>
        </Card>


        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Current multilingual system configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Translation Capabilities:</span>
                <div className="mt-1 space-x-2">
                  <Badge>Multi-directional</Badge>
                  <Badge variant="secondary">AI Language Detection</Badge>
                  <Badge variant="outline">UI Elements</Badge>
                  <Badge variant="outline">Content Data</Badge>
                </div>
              </div>
              <div>
                <span className="font-medium">Processing Features:</span>
                <div className="mt-1 space-x-2">
                  <Badge variant="outline">Gap Analysis</Badge>
                  <Badge variant="outline">Batch Processing</Badge>
                  <Badge variant="outline">Auto Bootstrap</Badge>
                  <Badge variant="outline">Error Recovery</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CompactPageLayout>
  );
}