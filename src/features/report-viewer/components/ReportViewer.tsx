import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, FileSpreadsheet, Download, Filter } from 'lucide-react';

export function ReportViewer() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Financial Report Viewer</h1>
        <p className="text-muted-foreground">
          Interactive interface for exploring imported trial balances and journal entries
        </p>
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Interactive Financial Explorer
            <Badge variant="secondary" className="ml-2">Coming in M9</Badge>
          </CardTitle>
          <CardDescription>
            Advanced reporting interface with drill-down capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Trial Balance Viewer */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Trial Balance Views
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Monthly and annual views</li>
                <li>• Account hierarchy navigation</li>
                <li>• Balance comparisons</li>
                <li>• Period-over-period analysis</li>
                <li>• Variance reporting</li>
              </ul>
            </div>

            {/* Journal Entry Explorer */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Journal Entry Drill-Down
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Transaction-level detail</li>
                <li>• Document reference links</li>
                <li>• Posting date filtering</li>
                <li>• Account code search</li>
                <li>• Reconciliation tracking</li>
              </ul>
            </div>

            {/* Export & Integration */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export & Integration
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Multiple export formats</li>
                <li>• Custom report templates</li>
                <li>• BI tool integration</li>
                <li>• Scheduled reports</li>
                <li>• API data access</li>
              </ul>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Development Status:</strong> The Report Viewer is planned for Milestone M9 and will provide
              comprehensive financial data exploration capabilities, integrating with imported trial balances,
              journal entries, and report structures to deliver actionable insights.
            </p>
          </div>

          <div className="flex justify-center">
            <Button variant="outline" disabled>
              Available in M9 Release
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}