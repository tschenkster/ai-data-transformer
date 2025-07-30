import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, BarChart3, Settings, LogOut, User } from 'lucide-react';

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Account Mapper</h1>
            <p className="text-sm text-muted-foreground">Intelligent financial account mapping</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{profile?.email}</p>
              <p className="text-xs text-muted-foreground">
                Status: <span className="text-success font-medium">Approved</span>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Upload Card */}
          <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2 text-primary" />
                Upload File
              </CardTitle>
              <CardDescription>
                Upload Excel files to start mapping accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Start Upload
              </Button>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Recent Sessions
              </CardTitle>
              <CardDescription>
                View your mapping history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Sessions
              </Button>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Analytics
              </CardTitle>
              <CardDescription>
                Track mapping performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Stats
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">0</div>
              <p className="text-xs text-muted-foreground">Total Mappings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-success">0%</div>
              <p className="text-xs text-muted-foreground">Accuracy Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-accent">0</div>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-warning">0</div>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Welcome to AI Account Mapper
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Get started by uploading an Excel file with account names. Our AI will analyze 
              and suggest mappings based on historical data and intelligent pattern recognition.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload First File
              </Button>
              <Button variant="outline" size="sm" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <FileText className="h-4 w-4 mr-2" />
                View Tutorial
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}