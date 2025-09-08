import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertTriangle, Search, RefreshCw, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'checking';
  details?: string;
  affectedRecords?: number;
}

export function ValidationDashboard() {
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([
    {
      id: 'EMPTY_UI_TRANSLATIONS',
      name: 'UI Translations Bootstrap',
      description: 'UI translations table should not be empty - needs initial translation entries',
      status: 'checking'
    },
    {
      id: 'EMPTY_STRUCTURES_TRANSLATIONS',
      name: 'Structure Translations Bootstrap',
      description: 'Report structure translations should not be empty when structures exist',
      status: 'checking'
    },
    {
      id: 'EMPTY_LINE_ITEMS_TRANSLATIONS',
      name: 'Line Item Translations Bootstrap',
      description: 'Line item translations should not be empty when line items exist',
      status: 'checking'
    },
    {
      id: 'UI_NULL_VALUES',
      name: 'No NULL Original Language (UI)',
      description: 'UI translation records must have non-NULL language_code_original',
      status: 'checking'
    },
    {
      id: 'STRUCTURES_NULL_VALUES',
      name: 'No NULL Original Text (Structures)',
      description: 'Report structure translation records must have non-NULL original_text',
      status: 'checking'
    },
    {
      id: 'LINE_ITEMS_NULL_VALUES',
      name: 'No NULL Original Text (Line Items)',
      description: 'Line item translation records must have non-NULL original_text',
      status: 'checking'
    },
    {
      id: 'MISSING_LANGUAGE_CODES',
      name: 'Valid Language Codes',
      description: 'All language codes must be valid 2-character ISO codes',
      status: 'checking'
    }
  ]);

  const [lastValidation, setLastValidation] = useState<Date | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const runValidation = async () => {
    setIsRunning(true);
    
    try {
      // Run validation checks
      const { data, error } = await supabase.functions.invoke('historic-translation-validation', {
        body: { operation: 'validate_all' }
      });

      if (error) throw error;

      // Update validation rules with results
      setValidationRules(prev => prev.map(rule => {
        const result = data?.results?.[rule.id];
        return {
          ...rule,
          status: result?.status || 'fail',
          details: result?.details,
          affectedRecords: result?.affectedRecords
        };
      }));

      setLastValidation(new Date());
      
      const failedRules = validationRules.filter(rule => rule.status === 'fail').length;
      if (failedRules === 0) {
        toast({
          title: "Validation Passed",
          description: "All translation data integrity rules are satisfied.",
        });
      } else {
        toast({
          title: "Validation Issues Found",
          description: `${failedRules} validation rules failed. Review the details below.`,
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Failed",
        description: error.message || "Failed to run validation checks.",
        variant: "destructive"
      });
      
      // Mark all as failed if validation couldn't run
      setValidationRules(prev => prev.map(rule => ({
        ...rule,
        status: 'fail',
        details: 'Validation service unavailable'
      })));
    } finally {
      setIsRunning(false);
    }
  };

  const runQuickFix = async (ruleId: string) => {
    try {
      // Handle bootstrap operations for empty tables differently
      if (['EMPTY_UI_TRANSLATIONS', 'EMPTY_STRUCTURES_TRANSLATIONS', 'EMPTY_LINE_ITEMS_TRANSLATIONS'].includes(ruleId)) {
        const operationMap: Record<string, string> = {
          'EMPTY_UI_TRANSLATIONS': 'bootstrap_ui_translations',
          'EMPTY_STRUCTURES_TRANSLATIONS': 'bootstrap_structures_translations',
          'EMPTY_LINE_ITEMS_TRANSLATIONS': 'bootstrap_line_items_translations'
        };
        
        const operation = operationMap[ruleId];
        const { data, error } = await supabase.functions.invoke('historic-translation-migration', {
          body: { 
            operation,
            dry_run: false
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Bootstrap Completed",
          description: `Successfully created ${data?.created || 0} initial translation entries.`,
        });
      } else {
        // Handle regular validation fixes using existing logic
        const { error } = await supabase.functions.invoke('historic-translation-validation', {
          body: { 
            operation: 'quick_fix',
            rule_id: ruleId
          }
        });

        if (error) throw error;

        toast({
          title: "Quick Fix Applied",
          description: "The issue has been automatically resolved.",
        });
      }

      // Re-run validation to update status
      await runValidation();
      
    } catch (error: any) {
      toast({
        title: "Quick Fix Failed",
        description: error.message || "Failed to apply automatic fix.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    runValidation();
  }, []);

  const getStatusIcon = (status: ValidationRule['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'fail':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />;
    }
  };

  const getStatusBadge = (status: ValidationRule['status']) => {
    switch (status) {
      case 'pass':
        return <Badge variant="outline" className="bg-success/10 text-success border-success">Pass</Badge>;
      case 'fail':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">Fail</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning">Warning</Badge>;
      default:
        return <Badge variant="outline">Checking</Badge>;
    }
  };

  const passedRules = validationRules.filter(rule => rule.status === 'pass').length;
  const failedRules = validationRules.filter(rule => rule.status === 'fail').length;
  const warningRules = validationRules.filter(rule => rule.status === 'warning').length;

  return (
    <div className="space-y-6">
      
      {/* Validation Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data Integrity Validation
              </CardTitle>
              <CardDescription>
                Comprehensive validation of translation data integrity rules
              </CardDescription>
            </div>
            <Button
              onClick={runValidation}
              disabled={isRunning}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              Run Validation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{passedRules}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{warningRules}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{failedRules}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </div>
          {lastValidation && (
            <div className="mt-4 text-sm text-muted-foreground">
              Last validation: {lastValidation.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Rules */}
      <div className="space-y-4">
        {validationRules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {getStatusIcon(rule.status)}
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{rule.name}</h4>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(rule.status)}
                      {rule.status === 'fail' && (
                        <Button
                          onClick={() => runQuickFix(rule.id)}
                          size="sm"
                          variant="outline"
                        >
                          <Search className="h-3 w-3 mr-1" />
                          Quick Fix
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {rule.details && (
                    <Alert>
                      <AlertDescription className="text-sm">
                        {rule.details}
                        {rule.affectedRecords && (
                          <span className="font-medium ml-2">
                            ({rule.affectedRecords.toLocaleString()} records affected)
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Status */}
      {failedRules === 0 && warningRules === 0 && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Perfect! All validation rules are passing. Your translation system maintains 
            complete data integrity and audit compliance.
          </AlertDescription>
        </Alert>
      )}

      {failedRules > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{failedRules} validation rule{failedRules > 1 ? 's' : ''} failed.</strong> 
            These issues must be resolved to ensure data integrity and system reliability.
            Use the Quick Fix buttons or run the Migration process to resolve them.
          </AlertDescription>
        </Alert>
      )}

    </div>
  );
}