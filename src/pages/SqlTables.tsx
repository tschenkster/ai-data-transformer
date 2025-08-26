import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Download, Database, Search, FileSpreadsheet } from 'lucide-react';
import Footer from '@/components/Footer';

export default function SqlTables() {
  const [sqlQuery, setSqlQuery] = useState('');
  
  const commonQueries = [
    {
      title: "All Users",
      description: "Export all user accounts with details",
      query: "SELECT * FROM user_accounts ORDER BY created_at DESC",
      icon: Database
    },
    {
      title: "Chart of Accounts",
      description: "Export all account mappings and translations", 
      query: "SELECT * FROM chart_of_accounts ORDER BY account_code",
      icon: FileSpreadsheet
    },
    {
      title: "Transaction History",
      description: "Export journal entries and trial balance data",
      query: "SELECT * FROM transactions ORDER BY transaction_date DESC",
      icon: Database
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">SQL Tables</h1>
          <p className="text-muted-foreground">Query and export database tables</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Custom Query Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Custom Query
              </CardTitle>
              <CardDescription>Write your own SQL query to export specific data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="SELECT * FROM table_name WHERE condition..."
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="min-h-32 font-mono text-sm"
              />
              <Button className="w-full" disabled={!sqlQuery.trim()}>
                <Download className="h-4 w-4 mr-2" />
                Execute & Download
              </Button>
            </CardContent>
          </Card>

          {/* Common Queries Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Common Queries</h2>
            {commonQueries.map((query) => (
              <Card key={query.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <query.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{query.title}</CardTitle>
                        <CardDescription className="text-sm">{query.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full text-sm" 
                    onClick={() => setSqlQuery(query.query)}
                  >
                    Use This Query
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}