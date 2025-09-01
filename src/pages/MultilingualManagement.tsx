import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Languages, Database, Bot, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { MultilingualSelector } from '@/components/MultilingualSelector';
import { TranslationEditor } from '@/components/TranslationEditor';
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
  const { language, changeLanguage } = useLanguagePreference();
  const { toast } = useToast();

  const breadcrumbItems = [
    { label: 'System Tools', path: '/admin/system-tools' },
    { label: 'Multilingual Management', path: '/admin/multilingual-management' }
  ];

  const runMigration = async () => {
    setIsMigrating(true);
    setMigrationStatus(null);
    try {
      const { data, error } = await supabase.functions.invoke('bulk-translation-migration', {
        body: { operation: 'migrate' }
      });

      if (error) {
        console.error('Migration error:', error);
        throw new Error(error.message || 'Failed to migrate existing data');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Migration failed');
      }

      setMigrationStatus(data.result);
      toast({
        title: "Migration Complete",
        description: `Successfully migrated ${data.result.structures_migrated || 0} structures and ${data.result.line_items_migrated || 0} line items`,
      });
    } catch (error: any) {
      console.error('Migration failed:', error);
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to migrate existing data",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const generateMissingTranslations = async () => {
    setIsGeneratingTranslations(true);
    setTranslationProgress(0);
    setTranslationStatus(null);
    
    try {
      toast({
        title: "Starting Translation Generation",
        description: "Generating English translations for all German content...",
      });

      const { data, error } = await supabase.functions.invoke('bulk-translation-migration', {
        body: { operation: 'generate_translations' }
      });

      if (error) {
        console.error('Translation generation error:', error);
        throw new Error(error.message || 'Failed to generate translations');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Translation generation failed');
      }

      setTranslationStatus(data.result);
      setTranslationProgress(100);
      
      const successMessage = `Generated ${data.result.total_processed} translations (${data.result.structures_processed} structures, ${data.result.line_items_processed} line items)`;
      
      toast({
        title: "Translation Generation Complete",
        description: successMessage,
      });

      // Show errors if any
      if (data.result.errors && data.result.errors.length > 0) {
        console.warn('Translation errors:', data.result.errors);
        toast({
          title: "Some Translations Had Errors",
          description: `${data.result.errors.length} items had translation errors. Check console for details.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Translation generation failed:', error);
      
      let errorMessage = error.message || "Failed to generate translations";
      
      // Check for specific error messages
      if (errorMessage.includes('OPENAI_API_KEY')) {
        errorMessage = "OpenAI API key is not configured. Please add it in Supabase Edge Function Secrets.";
      }
      
      toast({
        title: "Translation Generation Failed", 
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingTranslations(false);
    }
  };

  return (
    <CompactPageLayout 
      breadcrumbItems={breadcrumbItems}
      currentPage="Multilingual Management"
    >
      <div className="space-y-6">
        {/* Language Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Current Language Settings
            </CardTitle>
            <CardDescription>
              Select your preferred language for viewing content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MultilingualSelector
              currentLanguage={language}
              onLanguageChange={changeLanguage}
              showLabel={true}
            />
          </CardContent>
        </Card>

        {/* Migration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Migration
            </CardTitle>
            <CardDescription>
              Migrate existing data to the multilingual translation system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {migrationStatus ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Migration completed successfully!</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Report Structures:</span>
                        <Badge variant="secondary" className="ml-2">
                          {migrationStatus.structures_migrated}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Line Items:</span>
                        <Badge variant="secondary" className="ml-2">
                          {migrationStatus.line_items_migrated}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Run the migration to move existing data into the translation system. 
                  This will create German entries for all existing report structures and line items.
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={runMigration} 
              disabled={isMigrating}
              className="w-full"
            >
              {isMigrating ? (
                <>
                  <Database className="h-4 w-4 mr-2 animate-pulse" />
                  Migrating Data...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Run Data Migration
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI Translation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Translation Generation
            </CardTitle>
            <CardDescription>
              Automatically generate English translations for all content using AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {translationStatus ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Translation generation completed!</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Structures:</span>
                        <Badge variant="secondary" className="ml-2">
                          {translationStatus.structures_processed}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Line Items:</span>
                        <Badge variant="secondary" className="ml-2">
                          {translationStatus.line_items_processed}
                        </Badge>
                      </div>
                    </div>
                    {translationStatus.errors && translationStatus.errors.length > 0 && (
                      <div className="text-sm text-amber-600">
                        <span className="font-medium">Errors:</span>
                        <Badge variant="destructive" className="ml-2">
                          {translationStatus.errors.length}
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
                  Generate English translations for all existing German content. 
                  This will create AI-powered translations for report structures and line items.
                  {!migrationStatus && (
                    <span className="text-amber-600 block mt-1">
                      Note: Run data migration first to populate the translation tables.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            {isGeneratingTranslations && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Generating translations...</span>
                  <span>{translationProgress}%</span>
                </div>
                <Progress value={translationProgress} className="w-full" />
              </div>
            )}
            
            <Button 
              onClick={generateMissingTranslations}
              disabled={isGeneratingTranslations || !migrationStatus}
              variant="outline"
              className="w-full"
            >
              {isGeneratingTranslations ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Translations...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Generate Missing Translations
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
                <span className="font-medium">Supported Languages:</span>
                <div className="mt-1 space-x-2">
                  <Badge>German (Default)</Badge>
                  <Badge variant="secondary">English</Badge>
                </div>
              </div>
              <div>
                <span className="font-medium">Translation Sources:</span>
                <div className="mt-1 space-x-2">
                  <Badge variant="outline">Manual</Badge>
                  <Badge variant="outline">AI Generated</Badge>
                  <Badge variant="outline">Import</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CompactPageLayout>
  );
}