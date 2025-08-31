import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Footer from '@/components/Footer';
import TransformationVisualization from '@/components/TransformationVisualization';
import { 
  TrendingUp, 
  Database, 
  FileSpreadsheet, 
  AlertTriangle, 
  BarChart3, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Clock,
  Shield,
  Zap,
  Target,
  PlayCircle,
  Star,
  Award,
  Activity,
  DollarSign,
  Smartphone,
  MousePointer,
  ChevronRight
} from 'lucide-react';

export default function Start() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-primary opacity-5 rounded-full animate-pulse"></div>
          <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-subtle opacity-10 rounded-full animate-[pulse_3s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-0 right-1/4 w-1/3 h-1/3 bg-primary/5 rounded-full animate-[pulse_4s_ease-in-out_infinite]"></div>
        </div>
      </div>

      <main className="relative z-10 -mt-4">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-0 pb-20 md:pb-32">
          <div className="text-center space-y-8 max-w-6xl mx-auto">
            {/* Main Headline */}
            <div className="animate-fade-in space-y-4" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight bg-gradient-primary bg-clip-text text-transparent">
                Decision-Ready Finance Data for Startup CFOs
              </h1>
              <p className="text-4xl font-bold text-foreground max-w-6xl mx-auto leading-relaxed">
                Turn messy DATEV exports into clean data & reports.
              </p>
            </div>

            {/* Modern Transformation Visualization */}
            <TransformationVisualization />
          </div>
        </section>


        {/* Target Audience Section */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-5xl mx-auto text-center space-y-12">
            <div className="animate-fade-in space-y-4">
              <Badge variant="secondary" className="px-4 py-2 bg-primary/10 text-primary">Perfect For</Badge>
              <h2 className="text-xl md:text-2xl text-muted-foreground">CFOs of Startups with 10–100 Employees</h2>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                You need board-ready insights, BUT you&apos;re stuck with useless DATEV outputs &amp; Excel sheets that break every time you breathe on them and you haven&apos;t built your Finance tech stack yet .
              </p>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="bg-gradient-to-br from-destructive/5 to-background py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto space-y-16">
              <div className="text-center animate-fade-in space-y-4">
                <Badge variant="destructive" className="px-4 py-2">Current Reality</Badge>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground">The Startup CFO Struggle</h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Every month, the same painful routine. Let's break the cycle.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="relative overflow-hidden border-l-4 border-l-destructive hover:shadow-2xl transition-all duration-500 group bg-gradient-to-br from-destructive/5 to-transparent">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-start gap-4 text-destructive text-xl">
                      <div className="p-3 bg-destructive/10 rounded-xl group-hover:bg-destructive/20 transition-colors flex-shrink-0">
                        <AlertTriangle className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="font-bold">DATEV reports = useless for decisions</div>
                        <div className="text-sm text-muted-foreground font-normal mt-2">Compliance ≠ Insights</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Raw DATEV exports are built for compliance, not insights. You get endless rows of cryptic account codes 
                      that tell you nothing about your business performance or cash flow trends.
                    </p>
                    <div className="flex items-center gap-2 text-destructive/70">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Hours wasted monthly</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-l-4 border-l-destructive hover:shadow-2xl transition-all duration-500 group bg-gradient-to-br from-destructive/5 to-transparent">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-start gap-4 text-destructive text-xl">
                      <div className="p-3 bg-destructive/10 rounded-xl group-hover:bg-destructive/20 transition-colors flex-shrink-0">
                        <FileSpreadsheet className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="font-bold">Drowning in manual Excel work</div>
                        <div className="text-sm text-muted-foreground font-normal mt-2">Error-prone & fragile</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Every month, you spend hours manually cleaning, categorizing, and restructuring data just to get 
                      basic P&L insights. One formula breaks and you're back to square one.
                    </p>
                    <div className="flex items-center gap-2 text-destructive/70">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">High error risk</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-l-4 border-l-destructive hover:shadow-2xl transition-all duration-500 group bg-gradient-to-br from-destructive/5 to-transparent">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-start gap-4 text-destructive text-xl">
                      <div className="p-3 bg-destructive/10 rounded-xl group-hover:bg-destructive/20 transition-colors flex-shrink-0">
                        <Users className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="font-bold">Stuck in "Excel hell"</div>
                        <div className="text-sm text-muted-foreground font-normal mt-2">Doesn't scale</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Your "financial reporting system" is a collection of fragile spreadsheets that only you understand. 
                      Scaling your finance operations feels impossible when everything breaks with growth.
                    </p>
                    <div className="flex items-center gap-2 text-destructive/70">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">Growth blocked</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-l-4 border-l-destructive hover:shadow-2xl transition-all duration-500 group bg-gradient-to-br from-destructive/5 to-transparent">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-start gap-4 text-destructive text-xl">
                      <div className="p-3 bg-destructive/10 rounded-xl group-hover:bg-destructive/20 transition-colors flex-shrink-0">
                        <DollarSign className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="font-bold">No internal finance infrastructure yet</div>
                        <div className="text-sm text-muted-foreground font-normal mt-2">Stuck in the middle</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      You're not ready for enterprise-grade solutions, but you've outgrown basic bookkeeping. 
                      You need something that bridges the gap without breaking the bank or requiring a data team.
                    </p>
                    <div className="flex items-center gap-2 text-destructive/70">
                      <Target className="h-4 w-4" />
                      <span className="text-sm">Need the right fit</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pain Points Summary */}
              <div className="text-center bg-destructive/5 rounded-2xl p-8 border border-destructive/20">
                <h3 className="text-2xl font-bold text-destructive mb-4">The Result?</h3>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  You're making critical business decisions based on outdated, unreliable data while spending 
                  80% of your time on manual data wrestling instead of strategic finance work.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="bg-gradient-to-br from-primary/5 to-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto space-y-16">
              <div className="text-center animate-fade-in space-y-4">
                <Badge className="px-4 py-2 bg-primary text-primary-foreground">The Solution</Badge>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground">Your New Finance Workflow</h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Transform chaos into clarity with our AI-powered platform designed specifically for startup CFOs.
                </p>
              </div>

              {/* Process Flow */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="relative">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow">
                      <span className="text-2xl font-bold text-primary-foreground">1</span>
                    </div>
                    <h3 className="text-lg font-semibold">Upload DATEV Export</h3>
                    <p className="text-muted-foreground text-sm">Drop your messy DATEV file and watch the magic happen</p>
                  </div>
                  <div className="hidden md:block absolute top-10 right-0 transform translate-x-1/2">
                    <ArrowRight className="h-6 w-6 text-primary" />
                  </div>
                </div>

                <div className="relative">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow">
                      <span className="text-2xl font-bold text-primary-foreground">2</span>
                    </div>
                    <h3 className="text-lg font-semibold">AI Transformation</h3>
                    <p className="text-muted-foreground text-sm">Our AI categorizes and structures your data automatically</p>
                  </div>
                  <div className="hidden md:block absolute top-10 right-0 transform translate-x-1/2">
                    <ArrowRight className="h-6 w-6 text-primary" />
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow">
                    <span className="text-2xl font-bold text-primary-foreground">3</span>
                  </div>
                  <h3 className="text-lg font-semibold">Get Insights</h3>
                  <p className="text-muted-foreground text-sm">Access clean, actionable financial data in seconds</p>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="relative overflow-hidden border-l-4 border-l-primary hover:shadow-2xl transition-all duration-500 group bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-start gap-4 text-primary text-xl">
                      <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors flex-shrink-0">
                        <Zap className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="font-bold">From DATEV chaos to clarity</div>
                        <div className="text-sm text-muted-foreground font-normal mt-2">AI-powered transformation</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Upload your DATEV exports and watch AI instantly transform cryptic account codes into meaningful 
                      business categories. Get P&L insights in minutes, not hours.
                    </p>
                    <div className="flex items-center gap-2 text-primary/70">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">30 seconds avg processing</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-l-4 border-l-primary hover:shadow-2xl transition-all duration-500 group bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-start gap-4 text-primary text-xl">
                      <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors flex-shrink-0">
                        <Database className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="font-bold">SQL database as your finance backbone</div>
                        <div className="text-sm text-muted-foreground font-normal mt-2">Built to scale</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Your cleaned data lives in a proper database, not fragile spreadsheets. Scale your reporting 
                      as your startup grows without rebuilding everything from scratch.
                    </p>
                    <div className="flex items-center gap-2 text-primary/70">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">Enterprise-grade reliability</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-l-4 border-l-primary hover:shadow-2xl transition-all duration-500 group bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-start gap-4 text-primary text-xl">
                      <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors flex-shrink-0">
                        <BarChart3 className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="font-bold">Flexible reporting that grows with you</div>
                        <div className="text-sm text-muted-foreground font-normal mt-2">Custom insights, no limits</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Create custom P&L structures, compare periods, and build the exact reports your board wants to see. 
                      No more "let me get back to you on that" moments.
                    </p>
                    <div className="flex items-center gap-2 text-primary/70">
                      <Target className="h-4 w-4" />
                      <span className="text-sm">Board-ready insights</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-l-4 border-l-primary hover:shadow-2xl transition-all duration-500 group bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-start gap-4 text-primary text-xl">
                      <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors flex-shrink-0">
                        <CheckCircle className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="font-bold">Purpose-built for startup CFOs</div>
                        <div className="text-sm text-muted-foreground font-normal mt-2">Startup-ready, not enterprise-heavy</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      No complex data engineering required. No expensive consultants. Just upload, transform, 
                      and get the insights you need to make confident financial decisions.
                    </p>
                    <div className="flex items-center gap-2 text-primary/70">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm">Ready in minutes</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CTA Section */}
              <div className="text-center bg-primary/5 rounded-2xl p-8 border border-primary/20">
                <h3 className="text-3xl font-bold text-primary mb-4">Ready to Transform Your Finance Workflow?</h3>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                  Join startup CFOs who've already escaped Excel hell and are making data-driven decisions with confidence.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow">
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Start Free Trial
                  </Button>
                  <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5">
                    See Live Demo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Showcase */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto space-y-16">
              <div className="text-center animate-fade-in space-y-4">
                <Badge variant="outline" className="px-4 py-2 border-primary text-primary">Platform Features</Badge>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground">Everything You Need to Scale Finance Operations</h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  From data chaos to strategic insights—we handle the technical complexity so you can focus on growing your business.
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-colors">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Lightning-Fast Processing</CardTitle>
                    <CardDescription>
                      Upload DATEV files and get cleaned, categorized data in under 30 seconds. No more manual categorization.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-colors">
                      <Database className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Scalable SQL Backend</CardTitle>
                    <CardDescription>
                      Your data lives in a proper database, not spreadsheets. Query, filter, and analyze without limits.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-colors">
                      <BarChart3 className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Custom P&L Structures</CardTitle>
                    <CardDescription>
                      Build report structures that match your business model. Map accounts to meaningful categories.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-colors">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Enterprise-Grade Security</CardTitle>
                    <CardDescription>
                      SOC 2 compliant infrastructure with role-based access controls and audit trails for financial data.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-colors">
                      <Activity className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Real-Time Dashboards</CardTitle>
                    <CardDescription>
                      Monitor key metrics, cash flow trends, and expense categories with automatically updating dashboards.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-colors">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Team Collaboration</CardTitle>
                    <CardDescription>
                      Share financial insights with your team, investors, and board members with granular permission controls.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Target Personas */}
        <section className="bg-gradient-to-br from-secondary/5 to-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto space-y-16">
              <div className="text-center animate-fade-in space-y-4">
                <Badge variant="secondary" className="px-4 py-2">Who We Serve</Badge>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground">Built for Growing Finance Teams</h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Whether you're a solo CFO or building a finance team, our platform scales with your needs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="text-center space-y-6 p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Startup CFOs</h3>
                    <p className="text-muted-foreground">
                      Solo finance leaders who need to move fast, make strategic decisions, and prepare board-ready reports without a full finance team.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>10-100 employee startups</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Board reporting needs</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Limited finance resources</span>
                    </div>
                  </div>
                </Card>

                <Card className="text-center space-y-6 p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Finance Managers</h3>
                    <p className="text-muted-foreground">
                      Finance professionals who need reliable data infrastructure to support analysis and reporting without technical overhead.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Financial analysis focus</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Data accuracy critical</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Process efficiency goals</span>
                    </div>
                  </div>
                </Card>

                <Card className="text-center space-y-6 p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Finance-Responsible Founders</h3>
                    <p className="text-muted-foreground">
                      Founders handling finance until they can hire a CFO, needing simple but powerful tools for investor updates and financial planning.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Investor reporting needs</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Simple, powerful tools</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Transitioning to CFO hire</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto space-y-16">
              <div className="text-center animate-fade-in space-y-4">
                <Badge className="px-4 py-2 bg-primary text-primary-foreground">Simple Pricing</Badge>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground">Start Free, Scale as You Grow</h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  No hidden fees, no per-user charges. Just powerful finance tools that grow with your startup.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Starter</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">€99</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <p className="text-muted-foreground mt-2">Perfect for getting started with data transformation</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Up to 10 DATEV file uploads per month</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Basic P&L report structures</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Standard data transformations</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Email support</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>3 months data history</span>
                      </div>
                    </div>

                    <Button className="w-full" variant="outline">
                      Start Free Trial
                    </Button>
                  </div>
                </Card>

                <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 border-primary relative overflow-hidden">
                  <div className="absolute -top-2 -right-2 w-24 h-24 bg-primary/10 rounded-full"></div>
                  <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">Most Popular</Badge>
                  
                  <div className="space-y-6 relative z-10">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Professional</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">€299</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <p className="text-muted-foreground mt-2">For growing finance teams needing advanced features</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Unlimited DATEV file uploads</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Custom P&L report structures</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Advanced data transformations</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Priority support + onboarding</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Unlimited data history</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Team collaboration features</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>API access</span>
                      </div>
                    </div>

                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow">
                      Start Free Trial
                    </Button>
                  </div>
                </Card>
              </div>

              {/* ROI Calculator Teaser */}
              <div className="text-center bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 border">
                <h3 className="text-2xl font-bold mb-4">Calculate Your ROI</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  See how much time and money you'll save by eliminating manual Excel work and getting reliable financial insights.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">20+</div>
                    <div className="text-sm text-muted-foreground">Hours saved per month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">90%</div>
                    <div className="text-sm text-muted-foreground">Faster reporting</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">€5000+</div>
                    <div className="text-sm text-muted-foreground">Value created monthly</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-gradient-to-br from-primary to-primary-glow py-12 md:py-16 text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="animate-fade-in space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold">Ready to Escape Excel Hell?</h2>
                <p className="text-xl opacity-90 max-w-3xl mx-auto">
                  Join startup CFOs who've transformed their finance operations and are making confident, 
                  data-driven decisions every day.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90 shadow-xl">
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Start Free Trial - No Credit Card
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                  Book a Demo Call
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-primary-foreground/20">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Shield className="h-5 w-5" />
                    <span className="font-semibold">SOC 2</span>
                  </div>
                  <div className="text-sm opacity-80">Compliant</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Clock className="h-5 w-5" />
                    <span className="font-semibold">90%</span>
                  </div>
                  <div className="text-sm opacity-80">Faster reporting</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Star className="h-5 w-5" />
                    <span className="font-semibold">4.9/5</span>
                  </div>
                  <div className="text-sm opacity-80">User rating</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Users className="h-5 w-5" />
                    <span className="font-semibold">500+</span>
                  </div>
                  <div className="text-sm opacity-80">CFOs trust us</div>
                </div>
              </div>

              {/* Social proof */}
              <div className="pt-8 border-t border-primary-foreground/20">
                <p className="text-sm opacity-80 mb-4">Trusted by finance teams at:</p>
                <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
                  <div className="text-lg font-semibold">TechCorp</div>
                  <div className="text-lg font-semibold">StartupX</div>
                  <div className="text-lg font-semibold">ScaleUp Inc</div>
                  <div className="text-lg font-semibold">GrowthCo</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}