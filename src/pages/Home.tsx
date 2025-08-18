import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Footer from '@/components/Footer';
import { TrendingUp, Database, FileSpreadsheet, AlertTriangle, BarChart3, Users, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-primary opacity-5 rounded-full animate-pulse"></div>
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-subtle opacity-10 rounded-full animate-[pulse_3s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-0 right-1/4 w-1/3 h-1/3 bg-primary/5 rounded-full animate-[pulse_4s_ease-in-out_infinite]"></div>
      </div>

      <main className="container mx-auto px-4 py-8 space-y-20 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-8 py-8">
          <div className="animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-bold text-foreground leading-tight mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Decision-Ready Finance Data for Startup CFOs
            </h1>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Turn messy DATEV exports into clean, actionable insights — without Excel headaches or overpriced BI tools.
            </p>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            <p className="text-xl font-medium text-primary bg-primary/10 rounded-full px-8 py-4 inline-block border border-primary/20">
              From chaos to clarity in days, not months.
            </p>
          </div>
          
          {/* Floating Icons */}
          <div className="relative mt-16">
            <div className="absolute top-0 left-1/4 animate-[bounce_3s_ease-in-out_infinite] opacity-20">
              <Database className="h-12 w-12 text-primary" />
            </div>
            <div className="absolute top-8 right-1/4 animate-[bounce_3s_ease-in-out_infinite] opacity-20" style={{ animationDelay: '1s' }}>
              <TrendingUp className="h-10 w-10 text-primary" />
            </div>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 animate-[bounce_3s_ease-in-out_infinite] opacity-20" style={{ animationDelay: '2s' }}>
              <BarChart3 className="h-14 w-14 text-primary" />
            </div>
          </div>
        </div>

        {/* Target Audience Section */}
        <section className="max-w-5xl mx-auto text-center space-y-8 py-16 bg-gradient-subtle rounded-3xl border border-primary/10">
          <div className="animate-fade-in">
            <h2 className="text-4xl font-bold text-foreground mb-6">For CFOs of Startups with 10–100 Employees</h2>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto px-8">
              You need board-ready insights yesterday, but you don't have a large finance team or expensive infrastructure. 
              You're stuck with DATEV outputs that tell you nothing useful and Excel sheets that break every time you breathe on them. 
              You know there's a better way, but traditional BI tools cost more than your entire finance budget.
            </p>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="space-y-12">
          <div className="text-center animate-fade-in">
            <h2 className="text-4xl font-bold text-foreground mb-4">The Startup CFO Struggle</h2>
            <div className="w-24 h-1 bg-gradient-primary mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="shadow-elegant hover:shadow-glow hover:scale-105 transition-all duration-300 group border-l-4 border-l-destructive/30 hover:border-l-destructive">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive group-hover:text-destructive/80 transition-colors">
                  <div className="p-2 bg-destructive/10 rounded-lg mr-3 group-hover:bg-destructive/20 transition-colors">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  DATEV reports = useless for decisions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Raw DATEV exports are built for compliance, not insights. You get endless rows of cryptic account codes 
                  that tell you nothing about your business performance or cash flow trends.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-glow hover:scale-105 transition-all duration-300 group border-l-4 border-l-destructive/30 hover:border-l-destructive">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive group-hover:text-destructive/80 transition-colors">
                  <div className="p-2 bg-destructive/10 rounded-lg mr-3 group-hover:bg-destructive/20 transition-colors">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  Drowning in manual Excel work
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Every month, you spend hours manually cleaning, categorizing, and restructuring data just to get 
                  basic P&L insights. One formula breaks and you're back to square one.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-glow hover:scale-105 transition-all duration-300 group border-l-4 border-l-destructive/30 hover:border-l-destructive">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive group-hover:text-destructive/80 transition-colors">
                  <div className="p-2 bg-destructive/10 rounded-lg mr-3 group-hover:bg-destructive/20 transition-colors">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  Stuck in "Excel hell"
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Your "financial reporting system" is a collection of fragile spreadsheets that only you understand. 
                  Scaling your finance operations feels impossible when everything breaks with growth.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-glow hover:scale-105 transition-all duration-300 group border-l-4 border-l-destructive/30 hover:border-l-destructive">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive group-hover:text-destructive/80 transition-colors">
                  <div className="p-2 bg-destructive/10 rounded-lg mr-3 group-hover:bg-destructive/20 transition-colors">
                    <Users className="h-6 w-6" />
                  </div>
                  No internal finance infrastructure yet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  You're not ready for enterprise-grade solutions, but you've outgrown basic bookkeeping. 
                  You need something that bridges the gap without breaking the bank or requiring a data team.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Solution Section */}
        <section className="space-y-12 bg-gradient-subtle/30 py-16 rounded-3xl border border-primary/10">
          <div className="text-center animate-fade-in">
            <h2 className="text-4xl font-bold text-foreground mb-4">The Solution</h2>
            <div className="w-24 h-1 bg-gradient-primary mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8">
            <Card className="shadow-elegant hover:shadow-glow hover:scale-105 transition-all duration-300 group border-l-4 border-l-primary/30 hover:border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center text-primary group-hover:text-primary/80 transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors animate-pulse">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  From DATEV chaos to clarity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Upload your DATEV exports and watch AI instantly transform cryptic account codes into meaningful 
                  business categories. Get P&L insights in minutes, not hours.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-glow hover:scale-105 transition-all duration-300 group border-l-4 border-l-primary/30 hover:border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center text-primary group-hover:text-primary/80 transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors animate-pulse" style={{ animationDelay: '0.5s' }}>
                    <Database className="h-6 w-6" />
                  </div>
                  SQL database as your finance backbone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Your cleaned data lives in a proper database, not fragile spreadsheets. Scale your reporting 
                  as your startup grows without rebuilding everything from scratch.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-glow hover:scale-105 transition-all duration-300 group border-l-4 border-l-primary/30 hover:border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center text-primary group-hover:text-primary/80 transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors animate-pulse" style={{ animationDelay: '1s' }}>
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  Flexible reporting structures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Map your accounts to any reporting structure you need. Board reports, investor updates, 
                  department budgets — all from the same clean data foundation.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-glow hover:scale-105 transition-all duration-300 group border-l-4 border-l-primary/30 hover:border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center text-primary group-hover:text-primary/80 transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors animate-pulse" style={{ animationDelay: '1.5s' }}>
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  Plug into your favorite BI tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Export clean data to Tableau, Power BI, or any visualization tool. Or keep it simple with 
                  our built-in dashboards for quick insights and trend analysis.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Persona Section */}
        <section className="max-w-5xl mx-auto space-y-8 py-16">
          <div className="text-center animate-fade-in">
            <h2 className="text-4xl font-bold text-foreground mb-6">Who It's For</h2>
            <div className="w-24 h-1 bg-gradient-primary mx-auto rounded-full mb-8"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center p-6 hover:scale-105 transition-all duration-300 shadow-elegant hover:shadow-glow border border-primary/20">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">Startup CFOs</p>
              <p className="text-muted-foreground">With lean finance teams (up to 100 employees)</p>
            </Card>

            <Card className="text-center p-6 hover:scale-105 transition-all duration-300 shadow-elegant hover:shadow-glow border border-primary/20">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">Finance Managers</p>
              <p className="text-muted-foreground">Who need insights without a data team</p>
            </Card>

            <Card className="text-center p-6 hover:scale-105 transition-all duration-300 shadow-elegant hover:shadow-glow border border-primary/20">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">Finance-Responsible Founders</p>
              <p className="text-muted-foreground">Who want clarity without complexity</p>
            </Card>
          </div>
        </section>

        {/* Closing Statement */}
        <Card className="bg-gradient-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
          <CardContent className="text-center py-16 relative z-10">
            <div className="animate-fade-in">
              <p className="text-3xl font-bold leading-relaxed mb-6">
                👉 Stop wrestling with Excel. Start driving your startup with real-time, decision-ready finance data.
              </p>
              <p className="text-xl opacity-90">
                Use the sidebar navigation to start transforming your DATEV exports today.
              </p>
            </div>
            
            {/* Floating elements */}
            <div className="absolute top-4 right-8 opacity-20">
              <TrendingUp className="h-12 w-12 animate-[bounce_2s_ease-in-out_infinite]" />
            </div>
            <div className="absolute bottom-4 left-8 opacity-20">
              <Database className="h-10 w-10 animate-[bounce_2s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}