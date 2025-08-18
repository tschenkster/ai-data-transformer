import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Footer from '@/components/Footer';
import { TrendingUp, Database, FileSpreadsheet, AlertTriangle, BarChart3, Users, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-foreground leading-tight">
            Decision-Ready Finance Data for Startup CFOs
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Turn messy DATEV exports into clean, actionable insights — without Excel headaches or overpriced BI tools.
          </p>
          <p className="text-lg font-medium text-primary">
            From chaos to clarity in days, not months.
          </p>
        </div>

        {/* Target Audience Section */}
        <section className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-foreground">For CFOs of Startups with 10–100 Employees</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            You need board-ready insights yesterday, but you don't have a large finance team or expensive infrastructure. 
            You're stuck with DATEV outputs that tell you nothing useful and Excel sheets that break every time you breathe on them. 
            You know there's a better way, but traditional BI tools cost more than your entire finance budget.
          </p>
        </section>

        {/* Pain Points Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-foreground text-center">The Startup CFO Struggle</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-elegant hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <AlertTriangle className="h-6 w-6 mr-3" />
                  DATEV reports = useless for decisions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Raw DATEV exports are built for compliance, not insights. You get endless rows of cryptic account codes 
                  that tell you nothing about your business performance or cash flow trends.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <FileSpreadsheet className="h-6 w-6 mr-3" />
                  Drowning in manual Excel work
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Every month, you spend hours manually cleaning, categorizing, and restructuring data just to get 
                  basic P&L insights. One formula breaks and you're back to square one.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <AlertTriangle className="h-6 w-6 mr-3" />
                  Stuck in "Excel hell"
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your "financial reporting system" is a collection of fragile spreadsheets that only you understand. 
                  Scaling your finance operations feels impossible when everything breaks with growth.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <Users className="h-6 w-6 mr-3" />
                  No internal finance infrastructure yet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You're not ready for enterprise-grade solutions, but you've outgrown basic bookkeeping. 
                  You need something that bridges the gap without breaking the bank or requiring a data team.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Solution Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-foreground text-center">The Solution: AI-Powered Data Transformer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-elegant hover:shadow-lg transition-shadow border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <CheckCircle className="h-6 w-6 mr-3" />
                  From DATEV chaos to clarity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Upload your DATEV exports and watch AI instantly transform cryptic account codes into meaningful 
                  business categories. Get P&L insights in minutes, not hours.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-lg transition-shadow border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <Database className="h-6 w-6 mr-3" />
                  SQL database as your finance backbone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your cleaned data lives in a proper database, not fragile spreadsheets. Scale your reporting 
                  as your startup grows without rebuilding everything from scratch.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-lg transition-shadow border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <TrendingUp className="h-6 w-6 mr-3" />
                  Flexible reporting structures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Map your accounts to any reporting structure you need. Board reports, investor updates, 
                  department budgets — all from the same clean data foundation.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-lg transition-shadow border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <BarChart3 className="h-6 w-6 mr-3" />
                  Plug into your favorite BI tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Export clean data to Tableau, Power BI, or any visualization tool. Or keep it simple with 
                  our built-in dashboards for quick insights and trend analysis.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Persona Section */}
        <section className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-foreground text-center">Who It's For</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-lg text-muted-foreground">CFOs of startups with lean finance teams (up to 100 employees)</p>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-lg text-muted-foreground">Finance managers who need insights without a data team</p>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-lg text-muted-foreground">Founders responsible for finance who want clarity without complexity</p>
            </div>
          </div>
        </section>

        {/* Closing Statement */}
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardContent className="text-center py-12">
            <p className="text-2xl font-bold leading-relaxed">
              👉 Stop wrestling with Excel. Start driving your startup with real-time, decision-ready finance data.
            </p>
            <p className="text-lg opacity-90 mt-4">
              Use the sidebar navigation to start transforming your DATEV exports today.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}