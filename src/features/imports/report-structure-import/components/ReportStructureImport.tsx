import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, CheckCircle, AlertTriangle, Database, RotateCcw, FileCheck } from 'lucide-react';

export default function ReportStructureImport() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <FileSpreadsheet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Report Structure Import</h1>
          <Badge variant="secondary" className="mt-1">Coming Soon</Badge>
        </div>
      </div>
      
      <p className="text-muted-foreground mb-8 text-lg">
        Import and validate hierarchical report structures with intelligent parsing and version control.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-green-600" />
              Hierarchical Parsing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Parse P&L and Balance Sheet hierarchies with automatic parent-child relationship validation and mapped_hierarchy_path enforcement.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Smart Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Detect duplicates, missing parents, and integrity issues with preview impact analysis before publishing changes.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-purple-600" />
              Version Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Built-in versioning with rollback capabilities and comprehensive change-log integration for audit trails.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-600" />
              Localization Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Handle multi-language report structures with DE/EN labels and optional comment metadata preservation.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Error Handling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Comprehensive error detection with detailed feedback and guided resolution for structural issues.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
              Format Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Support for multiple file formats including CSV and Excel with automatic format detection and parsing.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What to Expect</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base">
            This feature will provide a comprehensive solution for importing and managing hierarchical report structures. 
            It will handle complex P&L and Balance Sheet hierarchies with full validation, versioning, and audit capabilities.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}