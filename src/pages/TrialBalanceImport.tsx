import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Clock, Star } from "lucide-react";

export default function TrialBalanceImport() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Trial Balance Import</h1>
          <Badge variant="secondary" className="ml-2">
            <Clock className="h-3 w-3 mr-1" />
            Coming Soon
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground">
          Streamlined trial balance data import with intelligent validation and processing
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Multi-Format Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Import from Excel, CSV, PDF, and direct connections to major accounting software.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Smart Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Automatic validation of trial balance integrity with detailed error reporting and suggestions.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Data Cleaning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Intelligent data cleaning to handle common formatting issues and inconsistencies.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Period Mapping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Automatic detection and mapping of accounting periods with fiscal year adjustments.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Reconciliation Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Built-in reconciliation features to ensure data accuracy and completeness.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Batch Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Process multiple trial balances simultaneously with progress tracking and error handling.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">What to Expect</h2>
        <p className="text-muted-foreground">
          The Trial Balance Import feature will make uploading and processing trial balance data effortless. 
          With intelligent validation and error handling, you'll spend less time on data preparation and more time on analysis. 
          This feature is currently under development and will be available soon.
        </p>
      </div>
    </div>
  );
}