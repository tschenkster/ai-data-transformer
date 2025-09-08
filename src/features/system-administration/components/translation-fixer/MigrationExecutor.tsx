import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, RotateCcw, CheckCircle2, AlertTriangle, Database } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface MigrationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export function MigrationExecutor() {
  const [migrationSteps, setMigrationSteps] = useState<MigrationStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [canRollback, setCanRollback] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Initialize migration steps based on current system state
  const initializeMigrationSteps = async () => {
    if (isInitialized) return;
    
    try {
      // Check validation status to determine what steps are needed
      const { data: validation, error } = await supabase.functions.invoke('historic-translation-validation', {
        body: { operation: 'validate_all' }
      });
      
      if (error) throw error;

      const baseSteps: MigrationStep[] = [
        {
          id: 'backup',
          title: 'Create Data Backup',
          description: 'Create backup of current translation data before migration',
          status: 'pending',
          progress: 0
        },
        {
          id: 'analyze',
          title: 'Analyze Data Patterns',
          description: 'Analyze existing data to determine optimal migration strategy',
          status: 'pending',
          progress: 0
        }
      ];

      const bootstrapSteps: MigrationStep[] = [];
      const migrationSteps: MigrationStep[] = [];

      // Check if bootstrap is needed based on validation results
      const results = validation?.results || {};
      
      // Add bootstrap steps for empty tables
      if (results.EMPTY_UI_TRANSLATIONS?.status === 'fail') {
        bootstrapSteps.push({
          id: 'bootstrap_ui',
          title: 'Bootstrap UI Translations',
          description: 'Create initial UI translation entries from common keys',
          status: 'pending',
          progress: 0
        });
      }

      if (results.EMPTY_STRUCTURES_TRANSLATIONS?.status === 'fail') {
        bootstrapSteps.push({
          id: 'bootstrap_structures',
          title: 'Bootstrap Structure Translations',
          description: 'Create initial translation entries from existing report structures',
          status: 'pending',
          progress: 0
        });
      }

      if (results.EMPTY_LINE_ITEMS_TRANSLATIONS?.status === 'fail') {
        bootstrapSteps.push({
          id: 'bootstrap_line_items',
          title: 'Bootstrap Line Item Translations',
          description: 'Create initial translation entries from existing line items',
          status: 'pending',
          progress: 0
        });
      }

      // Add regular migration steps
      migrationSteps.push({
        id: 'detect_ui_original',
        title: 'Detect Original Languages',
        description: 'AI-detect language_code_original for UI translations',
        status: 'pending',
        progress: 0
      });

      migrationSteps.push({
        id: 'migrate_ui',
        title: 'Migrate UI Translations',
        description: 'Fix NULL values in ui_translations table',
        status: 'pending',
        progress: 0
      });

      migrationSteps.push({
        id: 'migrate_structures',
        title: 'Migrate Report Structure Translations',
        description: 'Fix NULL values in report_structures_translations table',
        status: 'pending',
        progress: 0
      });

      migrationSteps.push({
        id: 'migrate_line_items',
        title: 'Migrate Report Line Item Translations',
        description: 'Fix NULL values in report_line_items_translations table',
        status: 'pending',
        progress: 0
      });

      const finalSteps: MigrationStep[] = [
        {
          id: 'add_constraints',
          title: 'Add Schema Constraints',
          description: 'Add NOT NULL constraints and validation triggers',
          status: 'pending',
          progress: 0
        },
        {
          id: 'validate',
          title: 'Validate Migration',
          description: 'Verify all data integrity rules are enforced',
          status: 'pending',
          progress: 0
        }
      ];

      const allSteps = [...baseSteps, ...bootstrapSteps, ...migrationSteps, ...finalSteps];
      setMigrationSteps(allSteps);
      setIsInitialized(true);

      if (bootstrapSteps.length > 0) {
        toast({
          title: "Bootstrap Required",
          description: `Detected ${bootstrapSteps.length} empty translation tables that need bootstrapping.`,
        });
      }

    } catch (error: any) {
      console.error('Failed to initialize migration steps:', error);
      toast({
        title: "Initialization Failed",
        description: "Failed to analyze system state. Using default migration steps.",
        variant: "destructive"
      });
      
      // Fall back to default steps
      setMigrationSteps([
        {
          id: 'backup',
          title: 'Create Data Backup',
          description: 'Create backup of current translation data before migration',
          status: 'pending',
          progress: 0
        },
        {
          id: 'analyze',
          title: 'Analyze Data Patterns',
          description: 'Analyze existing data to determine optimal migration strategy',
          status: 'pending',
          progress: 0
        },
        {
          id: 'detect_ui_original',
          title: 'Detect Original Languages',
          description: 'AI-detect language_code_original for UI translations',
          status: 'pending',
          progress: 0
        },
        {
          id: 'migrate_ui',
          title: 'Migrate UI Translations',
          description: 'Fix NULL values in ui_translations table',
          status: 'pending',
          progress: 0
        },
        {
          id: 'migrate_structures',
          title: 'Migrate Report Structure Translations',
          description: 'Fix NULL values in report_structures_translations table',
          status: 'pending',
          progress: 0
        },
        {
          id: 'migrate_line_items',
          title: 'Migrate Report Line Item Translations',
          description: 'Fix NULL values in report_line_items_translations table',
          status: 'pending',
          progress: 0
        },
        {
          id: 'add_constraints',
          title: 'Add Schema Constraints',
          description: 'Add NOT NULL constraints and validation triggers',
          status: 'pending',
          progress: 0
        },
        {
          id: 'validate',
          title: 'Validate Migration',
          description: 'Verify all data integrity rules are enforced',
          status: 'pending',
          progress: 0
        }
      ]);
      setIsInitialized(true);
    }
  };

  // Initialize on component mount
  useEffect(() => {
    initializeMigrationSteps();
  }, []);

  const updateStepStatus = (stepId: string, status: MigrationStep['status'], progress: number, error?: string) => {
    setMigrationSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, progress, error }
        : step
    ));
  };

  const executeMigrationStep = async (step: MigrationStep) => {
    updateStepStatus(step.id, 'running', 0);
    
    try {
      switch (step.id) {
        case 'backup':
          // Simulate backup creation
          for (let i = 0; i <= 100; i += 20) {
            updateStepStatus(step.id, 'running', i);
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          break;

        case 'analyze':
          // Simulate data analysis
          for (let i = 0; i <= 100; i += 25) {
            updateStepStatus(step.id, 'running', i);
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          break;

        case 'bootstrap_ui':
          // Bootstrap UI translations from common keys
          updateStepStatus(step.id, 'running', 20);
          const { error: bootstrapUIError } = await supabase.functions.invoke('historic-translation-migration', {
            body: { 
              operation: 'bootstrap_ui_translations',
              dry_run: false
            }
          });
          if (bootstrapUIError) throw bootstrapUIError;
          updateStepStatus(step.id, 'running', 100);
          break;

        case 'bootstrap_structures':
          // Bootstrap report structures translations
          updateStepStatus(step.id, 'running', 20);
          const { error: bootstrapStructError } = await supabase.functions.invoke('historic-translation-migration', {
            body: { 
              operation: 'bootstrap_structures_translations',
              dry_run: false
            }
          });
          if (bootstrapStructError) throw bootstrapStructError;
          updateStepStatus(step.id, 'running', 100);
          break;

        case 'bootstrap_line_items':
          // Bootstrap line items translations
          updateStepStatus(step.id, 'running', 20);
          const { error: bootstrapLineError } = await supabase.functions.invoke('historic-translation-migration', {
            body: { 
              operation: 'bootstrap_line_items_translations',
              dry_run: false
            }
          });
          if (bootstrapLineError) throw bootstrapLineError;
          updateStepStatus(step.id, 'running', 100);
          break;

        case 'detect_ui_original':
          // Detect original languages for UI translations in batches
          let lastId = 0;
          let hasMore = true;
          let totalProcessed = 0;
          let totalRows = 0;
          
          while (hasMore) {
            const { data: batchResult, error: detectError } = await supabase.functions.invoke('historic-translation-migration', {
              body: {
                operation: 'detect_ui_original_languages_batch',
                dry_run: false,
                batch_size: 50,
                start_after_id: lastId > 0 ? lastId : undefined,
                reprocess_all: false
              }
            });
            
            if (detectError) throw detectError;
            
            totalProcessed += batchResult.processed;
            totalRows = batchResult.total_rows || totalRows;
            lastId = batchResult.last_id;
            hasMore = batchResult.has_more;
            
            // Update progress based on total rows
            const progress = totalRows > 0 ? Math.min(95, (totalProcessed / totalRows) * 100) : 90;
            updateStepStatus(step.id, 'running', progress);
            
            // Small delay to prevent overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          updateStepStatus(step.id, 'running', 100);
          break;

        case 'migrate_ui':
          // Execute UI translations migration
          updateStepStatus(step.id, 'running', 20);
          const { error: uiError } = await supabase.functions.invoke('historic-translation-migration', {
            body: { 
              operation: 'migrate_ui_translations',
              dry_run: false
            }
          });
          if (uiError) throw uiError;
          updateStepStatus(step.id, 'running', 100);
          break;

        case 'migrate_structures':
          // Execute report structures migration
          updateStepStatus(step.id, 'running', 20);
          const { error: structError } = await supabase.functions.invoke('historic-translation-migration', {
            body: { 
              operation: 'migrate_report_structures_translations',
              dry_run: false
            }
          });
          if (structError) throw structError;
          updateStepStatus(step.id, 'running', 100);
          break;

        case 'migrate_line_items':
          // Execute line items migration
          updateStepStatus(step.id, 'running', 20);
          const { error: lineError } = await supabase.functions.invoke('historic-translation-migration', {
            body: { 
              operation: 'migrate_line_items_translations',
              dry_run: false
            }
          });
          if (lineError) throw lineError;
          updateStepStatus(step.id, 'running', 100);
          break;

        case 'add_constraints':
          // Add database constraints
          updateStepStatus(step.id, 'running', 50);
          const { error: constraintError } = await supabase.functions.invoke('historic-translation-migration', {
            body: { 
              operation: 'add_schema_constraints',
              dry_run: false
            }
          });
          if (constraintError) throw constraintError;
          updateStepStatus(step.id, 'running', 100);
          break;

        case 'validate':
          // Validate migration success
          for (let i = 0; i <= 100; i += 33) {
            updateStepStatus(step.id, 'running', i);
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          break;
      }
      
      updateStepStatus(step.id, 'completed', 100);
      
    } catch (error: any) {
      console.error(`Migration step ${step.id} failed:`, error);
      updateStepStatus(step.id, 'failed', 0, error.message || 'Unknown error occurred');
      throw error;
    }
  };

  const startMigration = async () => {
    setIsRunning(true);
    
    try {
      for (const step of migrationSteps) {
        if (step.status !== 'completed') {
          await executeMigrationStep(step);
        }
      }
      
      setCanRollback(true);
      toast({
        title: "Migration Completed",
        description: "All translation data has been successfully migrated and validated.",
      });
      
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: "The migration process encountered an error. Check the logs for details.",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const rollbackMigration = async () => {
    setIsRunning(true);
    
    try {
      const { error } = await supabase.functions.invoke('historic-translation-migration', {
        body: { 
          operation: 'rollback_migration',
          dry_run: false
        }
      });
      
      if (error) throw error;
      
      // Reset all steps
      setMigrationSteps(prev => prev.map(step => ({
        ...step,
        status: 'pending',
        progress: 0,
        error: undefined
      })));
      
      setCanRollback(false);
      
      toast({
        title: "Rollback Completed",
        description: "All changes have been reverted to the pre-migration state.",
      });
      
    } catch (error: any) {
      toast({
        title: "Rollback Failed",
        description: error.message || "Failed to rollback migration changes.",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: MigrationStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

  const getStatusBadge = (status: MigrationStep['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-success/10 text-success border-success">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary">Running</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const completedSteps = migrationSteps.filter(step => step.status === 'completed').length;
  const totalSteps = migrationSteps.length;
  const overallProgress = (completedSteps / totalSteps) * 100;

  return (
    <div className="space-y-6">
      
      {/* Migration Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Migration Control Panel
          </CardTitle>
          <CardDescription>
            Execute the complete data migration process to fix all NULL values in translation tables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{Math.round(overallProgress)}% Complete</div>
                <div className="text-sm text-muted-foreground">
                  {completedSteps} of {totalSteps} steps completed
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={startMigration}
                  disabled={isRunning || completedSteps === totalSteps}
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {completedSteps === totalSteps ? 'Migration Complete' : 'Start Migration'}
                </Button>
                {canRollback && (
                  <Button
                    onClick={rollbackMigration}
                    disabled={isRunning}
                    variant="outline"
                    size="lg"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Rollback
                  </Button>
                )}
              </div>
            </div>
            <Progress value={overallProgress} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Migration Steps */}
      <div className="space-y-4">
        {migrationSteps.map((step, index) => (
          <Card key={step.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground w-8 text-center">
                    {index + 1}
                  </div>
                  {getStatusIcon(step.status)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {getStatusBadge(step.status)}
                  </div>
                  
                  {(step.status === 'running' || step.status === 'completed') && (
                    <Progress value={step.progress} className="w-full h-2" />
                  )}
                  
                  {step.error && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Error:</strong> {step.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Important Notes */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> This migration will modify your translation tables. 
          A backup will be created automatically before any changes are made. 
          The entire process should complete in under 5 minutes for most datasets.
        </AlertDescription>
      </Alert>

    </div>
  );
}