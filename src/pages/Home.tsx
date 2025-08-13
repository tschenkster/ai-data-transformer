import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import { Brain, Zap, Target, Shield, Clock, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 mr-3 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">AI-Powered Data Transformer</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your messy data into clean, structured information with the power of artificial intelligence
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Intelligent Mapping */}
          <Card className="shadow-elegant hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-6 w-6 mr-3 text-blue-500" />
                Intelligent Mapping
              </CardTitle>
              <CardDescription>
                Advanced AI algorithms automatically detect patterns and suggest optimal data mappings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Pattern recognition</li>
                <li>• Smart suggestions</li>
                <li>• Context-aware mapping</li>
              </ul>
            </CardContent>
          </Card>

          {/* Real-time Processing */}
          <Card className="shadow-elegant hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-6 w-6 mr-3 text-green-500" />
                Real-time Processing
              </CardTitle>
              <CardDescription>
                Process large datasets instantly with lightning-fast AI-powered transformation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Instant analysis</li>
                <li>• Bulk processing</li>
                <li>• Live feedback</li>
              </ul>
            </CardContent>
          </Card>

          {/* High Accuracy */}
          <Card className="shadow-elegant hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-6 w-6 mr-3 text-red-500" />
                High Accuracy
              </CardTitle>
              <CardDescription>
                Machine learning models ensure precise data transformation with minimal errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 99%+ accuracy rate</li>
                <li>• Continuous learning</li>
                <li>• Error detection</li>
              </ul>
            </CardContent>
          </Card>

          {/* Secure Processing */}
          <Card className="shadow-elegant hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-6 w-6 mr-3 text-purple-500" />
                Secure Processing
              </CardTitle>
              <CardDescription>
                Enterprise-grade security ensures your sensitive data remains protected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• End-to-end encryption</li>
                <li>• Privacy compliant</li>
                <li>• Audit trails</li>
              </ul>
            </CardContent>
          </Card>

          {/* Performance Analytics */}
          <Card className="shadow-elegant hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-6 w-6 mr-3 text-orange-500" />
                Performance Analytics
              </CardTitle>
              <CardDescription>
                Track transformation quality and optimize your data processing workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Detailed metrics</li>
                <li>• Quality scores</li>
                <li>• Process insights</li>
              </ul>
            </CardContent>
          </Card>

          {/* Smart Automation */}
          <Card className="shadow-elegant hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-6 w-6 mr-3 text-yellow-500" />
                Smart Automation
              </CardTitle>
              <CardDescription>
                Automate repetitive data transformation tasks with intelligent workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Workflow automation</li>
                <li>• Batch processing</li>
                <li>• Scheduled transforms</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Ready to Transform Your Data?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-lg opacity-90">
              Start your data transformation journey today. Upload your files and see the AI magic in action.
            </p>
            <Button 
              size="lg"
              variant="secondary"
              onClick={() => window.location.href = '/upload'}
              className="bg-white text-primary hover:bg-gray-100"
            >
              Get Started
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}