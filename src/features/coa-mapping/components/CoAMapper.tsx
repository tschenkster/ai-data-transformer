import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Upload, Brain, CheckCircle } from 'lucide-react';

export function CoAMapper() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Chart of Accounts Mapper</h1>
        <p className="text-muted-foreground">
          AI-powered mapping of client-specific CoA accounts to standardized report structures
        </p>
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI-Powered Mapping Engine
            <Badge variant="secondary" className="ml-2">Coming in M6</Badge>
          </CardTitle>
          <CardDescription>
            Advanced CoA mapping with rule-based suggestions and machine learning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Planned Features */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Mapping Features
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Rule-based mapping suggestions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  AI-assisted account matching
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Confidence scoring
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Review and approval workflows
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Integration Features
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Historical mapping search
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Bulk mapping operations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Export approved mappings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Full audit trail
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Development Status:</strong> This feature is part of Milestone M6 and will include
              advanced AI mapping capabilities, review workflows, and integration with the existing
              CoA translation and report structure systems.
            </p>
          </div>

          <div className="flex justify-center">
            <Button variant="outline" disabled>
              Available in M6 Release
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}