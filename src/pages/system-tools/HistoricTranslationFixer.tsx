import { CompactPageLayout } from "@/components/layout/CompactPageLayout";
import { TranslationDataAssessment } from "@/features/system-administration/components/translation-fixer/TranslationDataAssessment";
import { MigrationExecutor } from "@/features/system-administration/components/translation-fixer/MigrationExecutor";
import { ValidationDashboard } from "@/features/system-administration/components/translation-fixer/ValidationDashboard";
import { MonitoringPanel } from "@/features/system-administration/components/translation-fixer/MonitoringPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Database, Activity } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function HistoricTranslationFixer() {
  const breadcrumbItems = [
    { path: '/start', label: 'Start' },
    { path: '/admin', label: 'System Administration' },
    { path: '/admin/system-tools', label: 'System Tools' },
    { path: '/admin/system-tools/historic-translation-fixer', label: 'Historic Translation Fixer' }
  ];

  return (
    <CompactPageLayout 
      currentPage="Historic Translation Fixer"
      breadcrumbItems={breadcrumbItems}
    >
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-warning/10 text-warning">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Historic Translation Fixer</h1>
            <p className="text-muted-foreground text-lg">
              Address critical data integrity issues in translation tables by fixing NULL values in source tracking fields.
            </p>
          </div>
        </div>

        {/* Overview Alert */}
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            This tool fixes missing <code>language_code_original</code> and <code>original_text</code> values 
            across all translation tables to ensure complete audit trails and improve AI translation accuracy.
          </AlertDescription>
        </Alert>

        {/* Main Tabs */}
        <Tabs defaultValue="assessment" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="assessment">Data Assessment</TabsTrigger>
            <TabsTrigger value="migration">Migration</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assessment" className="space-y-6 mt-6">
            <TranslationDataAssessment />
          </TabsContent>
          
          <TabsContent value="migration" className="space-y-6 mt-6">
            <MigrationExecutor />
          </TabsContent>
          
          <TabsContent value="validation" className="space-y-6 mt-6">
            <ValidationDashboard />
          </TabsContent>
          
          <TabsContent value="monitoring" className="space-y-6 mt-6">
            <MonitoringPanel />
          </TabsContent>
        </Tabs>

      </div>
    </CompactPageLayout>
  );
}