import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Star } from "lucide-react";

export default function JournalImport() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Journal Import</h1>
          <Badge variant="secondary" className="ml-2">
            <Clock className="h-3 w-3 mr-1" />
            Coming Soon
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground">
          Comprehensive journal entry import with automated validation and processing
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Flexible Import
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Import journal entries from various sources including Excel, CSV, and direct API connections.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Entry Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Comprehensive validation of journal entries including balance checks and account verification.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Duplicate Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Intelligent duplicate detection to prevent data redundancy and maintain data integrity.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Transaction Matching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Advanced matching algorithms to link related transactions and maintain audit trails.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Error Handling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Robust error handling with detailed reporting and suggested corrections for data issues.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Complete audit trail tracking all imports with timestamps, user information, and change logs.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">What to Expect</h2>
        <p className="text-muted-foreground">
          The Journal Import feature will transform how you handle journal entry data. 
          With advanced validation, duplicate detection, and comprehensive error handling, 
          importing journal entries will become a seamless process. This powerful feature is in development and coming soon!
        </p>
      </div>
    </div>
  );
}