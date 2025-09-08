import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bot, Loader2, MousePointer, FileText, Database, CheckCircle, AlertCircle } from 'lucide-react';
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
    description: 'Interface translations'
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

interface IntelligentMigrationCardProps {
  analysisData?: any;
}

export function IntelligentMigrationCard({ analysisData }: IntelligentMigrationCardProps) {
  const [migrationProgress, setMigrationProgress] = useState<Record<string, { loading: boolean; progress: number; result?: any; phase?: string }>>({});
  const [globalMigration, setGlobalMigration] = useState<any>(null);
  const [isGlobalMigrating, setIsGlobalMigrating] = useState(false);
  const { toast } = useToast();

  const runSelectiveMigration = async (contentTypeId: string) => {
    console.log('Starting migration for:', contentTypeId);
    
    setMigrationProgress(prev => ({
      ...prev,
      [contentTypeId]: { loading: true, progress: 0, phase: 'discovering' }
    }));

    try {
      // Two-phase progress: Discovery (0-40%) + Migration (40-100%)
      const progressInterval = setInterval(() => {
        setMigrationProgress(prev => {
          const current = prev[contentTypeId];
          const newProgress = Math.min(current.progress + 3, current.phase === 'discovering' ? 40 : 95);
          
          // Switch to migration phase at 40%
          if (current.phase === 'discovering' && newProgress >= 40) {
            return {
              ...prev,
              [contentTypeId]: { ...current, progress: 40, phase: 'migrating' }
            };
          }
          
          return {
            ...prev,
            [contentTypeId]: { ...current, progress: newProgress }
          };
        });
      }, 400);

      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;

      const { data, error } = await supabase.functions.invoke('intelligent-translation-migration', {
        body: { 
          operation: `migrate-${contentTypeId === 'report_structure' ? 'structures' : contentTypeId === 'report_line_item' ? 'line-items' : contentTypeId}`,
          contentTypes: [contentTypeId],
          userId
        }
      });

      console.log('Migration response:', { data, error, contentTypeId });

      clearInterval(progressInterval);

      if (error) {
        throw new Error(error.message || `Failed to migrate ${contentTypeId}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || `Migration failed for ${contentTypeId}`);
      }

      setMigrationProgress(prev => ({
        ...prev,
        [contentTypeId]: { loading: false, progress: 100, result: data.result, phase: 'complete' }
      }));

      const discoveredItems = data.result.itemsAnalyzed || 0;
      const generatedTranslations = data.result.translationsGenerated || 0;
      
      toast({
        title: "Migration Complete",
        description: `Discovered ${discoveredItems} items, generated ${generatedTranslations} translations for ${contentTypes.find(ct => ct.id === contentTypeId)?.label}`,
      });

    } catch (error: any) {
      setMigrationProgress(prev => ({
        ...prev,
        [contentTypeId]: { loading: false, progress: 0 }
      }));

      toast({
        title: "Migration Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const runGlobalMigration = async () => {
    setIsGlobalMigrating(true);
    setGlobalMigration(null);
    
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;

      const { data, error } = await supabase.functions.invoke('intelligent-translation-migration', {
        body: { operation: 'migrate', userId }
      });

      if (error) {
        throw new Error(error.message || 'Failed to migrate content');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Migration failed');
      }

      setGlobalMigration(data.result);

      const discoveredItems = data.result.totalItemsAnalyzed || 0;
      const generatedTranslations = data.result.translationsGenerated || 0;

      toast({
        title: "Global Migration Complete",
        description: `Discovered ${discoveredItems} items, generated ${generatedTranslations} translations across all content types`,
      });

    } catch (error: any) {
      toast({
        title: "Migration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGlobalMigrating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Intelligent Translation Migration
        </CardTitle>
        <CardDescription>
          AI-powered translation generation with automatic language detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Individual Content Type Migration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contentTypes.map((contentType) => {
            const Icon = contentType.icon;
            const migration = migrationProgress[contentType.id];
            
            return (
              <div key={contentType.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium text-sm">{contentType.label}</span>
                </div>
                
                <p className="text-xs text-muted-foreground">{contentType.description}</p>
                
                {migration?.loading && (
                  <div className="space-y-2">
                    <Progress value={migration.progress} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {migration.phase === 'discovering' ? (
                        <>Discovering {contentType.label.toLowerCase()}...</>
                      ) : (
                        <>Migrating {contentType.label.toLowerCase()}...</>
                      )}
                    </div>
                  </div>
                )}
                
                {migration?.result && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <div className="space-y-1">
                        <div>
                          Analyzed <Badge variant="outline" className="ml-1">
                            {migration.result.itemsAnalyzed || 0}
                          </Badge> items
                        </div>
                        <div>
                          Generated <Badge variant="secondary" className="ml-1">
                            {migration.result.translationsGenerated || 0}
                          </Badge> translations
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  type="button"
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => runSelectiveMigration(contentType.id)}
                  disabled={migration?.loading}
                >
                  {migration?.loading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      {migration.phase === 'discovering' ? 'Discovering...' : 'Migrating...'}
                    </>
                  ) : (
                    <>
                      <Bot className="h-3 w-3 mr-2" />
                      Discover & Migrate
                    </>
                  )}
                </Button>
                
                <div className="text-xs text-muted-foreground">
                  Automatically discovers content and generates translations
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Migration Section */}
        <div className="border-t pt-4">
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Comprehensive Migration
            </h4>
            
            {globalMigration ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Migration completed successfully!</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Items Analyzed:</span>
                        <Badge variant="outline" className="ml-2">
                          {globalMigration.totalItemsAnalyzed || 0}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">UI Elements:</span>
                        <Badge variant="secondary" className="ml-2">
                          {globalMigration.uiElementsProcessed || 0}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Structures:</span>
                        <Badge variant="secondary" className="ml-2">
                          {globalMigration.structuresProcessed || 0}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Translations:</span>
                        <Badge variant="secondary" className="ml-2">
                          {globalMigration.translationsGenerated || 0}
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
                  Automatically discovers all translatable content and generates translations with AI-powered language detection and multi-directional translation
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="button"
              onClick={runGlobalMigration} 
              disabled={isGlobalMigrating}
              variant="default"
              className="w-full"
            >
              {isGlobalMigrating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Discovering & Migrating...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Discover & Migrate All Content
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}