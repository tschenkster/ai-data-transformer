import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, Clock, Star } from "lucide-react";

export default function CoAMapper() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Map className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">CoA Mapper</h1>
          <Badge variant="secondary" className="ml-2">
            <Clock className="h-3 w-3 mr-1" />
            Coming Soon
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground">
          Intelligent mapping between different Chart of Accounts structures
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Smart Mapping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              AI-powered account mapping that learns from your business context and industry standards.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Multi-Format Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Support for major accounting software formats including QuickBooks, SAP, Oracle, and custom structures.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Validation Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Built-in validation to ensure mapping accuracy and compliance with accounting standards.
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
              Process thousands of account mappings simultaneously with detailed progress tracking.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Mapping History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Track all mapping changes with audit trails and the ability to revert to previous versions.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Export Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Export mapped data in multiple formats for seamless integration with your existing systems.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">What to Expect</h2>
        <p className="text-muted-foreground">
          The CoA Mapper will revolutionize how you handle Chart of Accounts transformations. 
          This feature is currently in development and will be available soon. Stay tuned for updates!
        </p>
      </div>
    </div>
  );
}