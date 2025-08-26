import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, PieChart, TrendingUp } from 'lucide-react';
import Footer from '@/components/Footer';

export default function FinancialReports() {
  const reports = [
    {
      title: "Balance Sheet",
      description: "Assets, liabilities, and equity at a specific point in time",
      icon: PieChart,
      format: "PDF, Excel"
    },
    {
      title: "Income Statement",
      description: "Revenue, expenses, and profit over a period",
      icon: TrendingUp,
      format: "PDF, Excel"
    },
    {
      title: "Cash Flow Statement",
      description: "Cash inflows and outflows over a period",
      icon: FileText,
      format: "PDF, Excel"
    },
    {
      title: "Trial Balance",
      description: "List of all accounts and their balances",
      icon: FileText,
      format: "PDF, Excel"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Financial Reports</h1>
          <p className="text-muted-foreground">Generate and download financial reports</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {reports.map((report) => (
            <Card key={report.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <report.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription className="text-sm">{report.format}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Footer />
      </div>
    </div>
  );
}