import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle2, Database, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface TableStats {
  table_name: string;
  total_records: number;
  missing_original_lang: number;
  missing_original_text: number;
  completeness_percentage: number;
}

export function TranslationDataAssessment() {
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTableStats = async () => {
    setLoading(true);
    try {
      // Use the assessment function we created
      const { data, error } = await supabase.rpc('assess_translation_data_completeness');
      
      if (error) throw error;

      // Cast the data to the expected structure
      const assessmentData = data as any;

      const stats = [
        {
          table_name: 'ui_translations',
          total_records: assessmentData.tables?.ui_translations?.total_records || 0,
          missing_original_lang: assessmentData.tables?.ui_translations?.missing_original_lang || 0,
          missing_original_text: assessmentData.tables?.ui_translations?.missing_original_text || 0,
          completeness_percentage: assessmentData.tables?.ui_translations?.completeness_percentage || 100
        },
        {
          table_name: 'report_structures_translations',
          total_records: assessmentData.tables?.report_structures_translations?.total_records || 0,
          missing_original_lang: assessmentData.tables?.report_structures_translations?.missing_original_lang || 0,
          missing_original_text: assessmentData.tables?.report_structures_translations?.missing_original_text || 0,
          completeness_percentage: assessmentData.tables?.report_structures_translations?.completeness_percentage || 100
        },
        {
          table_name: 'report_line_items_translations',
          total_records: assessmentData.tables?.report_line_items_translations?.total_records || 0,
          missing_original_lang: assessmentData.tables?.report_line_items_translations?.missing_original_lang || 0,
          missing_original_text: assessmentData.tables?.report_line_items_translations?.missing_original_text || 0,
          completeness_percentage: assessmentData.tables?.report_line_items_translations?.completeness_percentage || 100
        }
      ];

      setTableStats(stats);
    } catch (error) {
      console.error('Error fetching table stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch translation table statistics.",
        variant: "destructive"
      });
      
      // Set empty stats as fallback
      setTableStats([
        {
          table_name: 'ui_translations',
          total_records: 0,
          missing_original_lang: 0,
          missing_original_text: 0,
          completeness_percentage: 100
        },
        {
          table_name: 'report_structures_translations', 
          total_records: 0,
          missing_original_lang: 0,
          missing_original_text: 0,
          completeness_percentage: 100
        },
        {
          table_name: 'report_line_items_translations',
          total_records: 0,
          missing_original_lang: 0,
          missing_original_text: 0,
          completeness_percentage: 100
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableStats();
  }, []);

  const totalRecords = tableStats.reduce((sum, stat) => sum + stat.total_records, 0);
  const totalMissing = tableStats.reduce((sum, stat) => sum + Math.max(stat.missing_original_lang, stat.missing_original_text), 0);
  const overallCompleteness = totalRecords > 0 ? Math.round(((totalRecords - totalMissing) / totalRecords) * 100) : 100;

  const getSeverityColor = (percentage: number) => {
    if (percentage >= 90) return "text-success";
    if (percentage >= 70) return "text-warning";
    return "text-destructive";
  };

  const getSeverityBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge variant="outline" className="bg-success/10 text-success border-success">Good</Badge>;
    if (percentage >= 70) return <Badge variant="outline" className="bg-warning/10 text-warning border-warning">Warning</Badge>;
    return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">Critical</Badge>;
  };

  return (
    <div className="space-y-6">
      
      {/* Overall Health Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Overall Data Health
              </CardTitle>
              <CardDescription>
                Translation data completeness across all tables
              </CardDescription>
            </div>
            <Button
              onClick={fetchTableStats}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{overallCompleteness}% Complete</span>
              {getSeverityBadge(overallCompleteness)}
            </div>
            <Progress value={overallCompleteness} className="w-full" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Records</div>
                <div className="font-semibold">{totalRecords.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Records with Missing Data</div>
                <div className={`font-semibold ${getSeverityColor(overallCompleteness)}`}>
                  {totalMissing.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Table Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tableStats.map((stat) => (
          <Card key={stat.table_name}>
            <CardHeader>
              <CardTitle className="text-lg">
                {stat.table_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </CardTitle>
              <CardDescription>
                Data completeness status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xl font-bold ${getSeverityColor(stat.completeness_percentage)}`}>
                    {stat.completeness_percentage}%
                  </span>
                  {getSeverityBadge(stat.completeness_percentage)}
                </div>
                <Progress value={stat.completeness_percentage} />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Records:</span>
                    <span className="font-medium">{stat.total_records.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Missing Original Language:</span>
                    <span className={`font-medium ${stat.missing_original_lang > 0 ? 'text-destructive' : 'text-success'}`}>
                      {stat.missing_original_lang.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Missing Original Text:</span>
                    <span className={`font-medium ${stat.missing_original_text > 0 ? 'text-destructive' : 'text-success'}`}>
                      {stat.missing_original_text.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Issues Alert */}
      {totalMissing > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{totalMissing.toLocaleString()} records</strong> are missing source tracking data. 
            This impacts translation chain integrity, AI accuracy, and audit compliance. 
            Use the Migration tab to fix these issues.
          </AlertDescription>
        </Alert>
      )}

      {totalMissing === 0 && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Excellent! All translation records have complete source tracking data. 
            Your translation system maintains full audit trails and optimal AI accuracy.
          </AlertDescription>
        </Alert>
      )}

    </div>
  );
}