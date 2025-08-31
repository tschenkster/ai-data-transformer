import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Languages, Database, Bot, CheckCircle, AlertCircle } from 'lucide-react';
import { MultilingualSelector } from '@/components/MultilingualSelector';
import { TranslationEditor } from '@/components/TranslationEditor';
import { TranslationService } from '@/services/translationService';
import { useLanguagePreference } from '@/hooks/useTranslations';
import { useToast } from '@/hooks/use-toast';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';

export default function MultilingualManagement() {
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [translationEditorOpen, setTranslationEditorOpen] = useState(false);
  const { language, changeLanguage } = useLanguagePreference();
  const { toast } = useToast();

  const breadcrumbItems = [
    { label: 'System Tools', path: '/admin/system-tools' },
    { label: 'Multilingual Management', path: '/admin/multilingual-management' }
  ];

  const runMigration = async () => {
    setIsMigrating(true);
    try {
      const result = await TranslationService.migrateExistingData();
      setMigrationStatus(result);
      toast({
        title: "Migration Complete",
        description: result.message,
      });
    } catch (error: any) {
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
    try {
      // This would be implemented to find entities with missing translations
      // and generate them automatically
      toast({
        title: "Feature Coming Soon",
        description: "Auto-generation of missing translations will be available soon",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate translations",
        variant: "destructive",
      });
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
          <CardContent>
            <Button 
              onClick={generateMissingTranslations}
              variant="outline"
              className="w-full"
            >
              <Bot className="h-4 w-4 mr-2" />
              Generate Missing Translations
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