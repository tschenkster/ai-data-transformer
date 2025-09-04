import React from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Footer from '@/components/Footer';
import TransformationVisualization from '@/components/TransformationVisualization';
import { useBetaDialog } from '@/hooks/useBetaDialog';
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

const Homepage = () => {
  const { showBetaDialog, BetaDialog } = useBetaDialog();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      
      {/* Content from Start page below */}
      <div className="relative overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-primary opacity-5 rounded-full animate-pulse"></div>
            <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-subtle opacity-10 rounded-full animate-[pulse_3s_ease-in-out_infinite]"></div>
            <div className="absolute bottom-0 right-1/4 w-1/3 h-1/3 bg-primary/5 rounded-full animate-[pulse_4s_ease-in-out_infinite]"></div>
          </div>
        </div>

        <main className="relative z-10">
          {/* Hero Section */}
          <section className="container mx-auto px-4 pt-0 pb-20 md:pb-32">
            <div className="text-center space-y-8 max-w-6xl mx-auto">
              {/* Main Headline */}
              <div className="animate-fade-in space-y-4" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight bg-gradient-primary bg-clip-text text-transparent">
                  Decision-Ready Finance Data for Startup CFOs
                </h1>
              </div>

              {/* CFO Challenge Text */}
              <div className="text-center mt-12 space-y-4">
                <p className="text-2xl md:text-3xl font-bold text-foreground max-w-4xl mx-auto leading-relaxed">
                  You need board-ready insights quickly.
                </p>
                <p className="text-2xl md:text-3xl font-bold text-foreground max-w-4xl mx-auto leading-relaxed">
                  ...but your dealing with (DATEV) reality.
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
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground">The Startup CFO's Challenge</h2>
                  <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    Every month, the same painful routine. Let's break the cycle.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* ... keep existing pain point cards ... */}
                  <Card className="relative overflow-hidden border-l-4 border-l-destructive hover:shadow-2xl transition-all duration-500 group bg-gradient-to-br from-destructive/5 to-transparent">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <CardHeader className="relative z-10">
                      <CardTitle className="flex items-start gap-4 text-destructive text-xl">
                        <div className="p-3 bg-destructive/10 rounded-xl group-hover:bg-destructive/20 transition-colors flex-shrink-0">
                          <AlertTriangle className="h-7 w-7" />
                        </div>
                      <div>
                        <div className="font-bold">Useless DATEV reports</div>
                        <div className="text-sm text-muted-foreground font-normal mt-2">Compliance ≠ Insights</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      DATEV exports are designed for compliance, not management. You get PDFs that tell you little 
                      about business performance or cash flow trends.
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
                        <div className="font-bold">Manual Excel grind</div>
                        <div className="text-sm text-muted-foreground font-normal mt-2">Error-Prone & Fragile</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Each month you spend hours cleaning, categorizing, and restructuring data just to build a basic P&L. 
                      Broken formulas and endless copy-paste eat up valuable time without adding real value.
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
                        <div className="font-bold">No real finance tech stack yet</div>
                        <div className="text-sm text-muted-foreground font-normal mt-2">In Transition</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      You've outgrown simple bookkeeping, but a full ERP/BI/FP&A setup is not in place. 
                      Excel is holding things together, barely.
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
                        <div className="font-bold">Enterprise tools you can't afford</div>
                        <div className="text-sm text-muted-foreground font-normal mt-2">Overpriced & Overengineered</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Traditional finance platforms start at €5,000+ annually, take 2+ months to implement, and force you to pay for 145 features you'll never use. You need insights today, not next quarter.
                    </p>
                      <div className="flex items-center gap-2 text-destructive/70">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Budget stretched thin</span>
                      </div>
                    </CardContent>
                  </Card>

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
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground">An AI-Powered Finance Workflow</h2>
                  <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    Transform chaos into clarity with our AI-powered platform designed specifically for startup CFOs.
                  </p>
                </div>

                {/* Transformation Infographic */}
                <TransformationVisualization />

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
                          <div className="font-bold">Insights in minutes</div>
                          <div className="text-sm text-muted-foreground font-normal mt-2">Instant transformation</div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Go from raw accounting exports to clean financial insights instantly. No more waiting hours 
                        for manual data cleanup and processing.
                      </p>
                      <div className="flex items-center gap-2 text-primary/70">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Minutes, not hours</span>
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
                          <div className="font-bold">Database as backbone</div>
                          <div className="text-sm text-muted-foreground font-normal mt-2">Built to scale</div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Data lives in a scalable, reliable system, not fragile Excel spreadsheets. 
                        Your finance infrastructure grows with your business.
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
                          <div className="font-bold">Standardized reporting</div>
                          <div className="text-sm text-muted-foreground font-normal mt-2">Ready-made templates</div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Use ready-made templates for P&L, balance sheet, and cash flow, or design custom structures 
                        to fit your business perfectly.
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
                          <div className="font-bold">More time for strategy</div>
                          <div className="text-sm text-muted-foreground font-normal mt-2">Focus on what matters</div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Close faster and redirect hours from cleanup to analysis and decision-making. 
                        Spend time on strategy, not spreadsheet maintenance.
                      </p>
                      <div className="flex items-center gap-2 text-primary/70">
                        <Zap className="h-4 w-4" />
                        <span className="text-sm">Strategic focus</span>
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
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow" onClick={showBetaDialog}>
                      <PlayCircle className="h-5 w-5 mr-2" />
                      Start Free Trial
                    </Button>
                    <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5" onClick={showBetaDialog}>
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
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground">Built for Startup Finance Teams</h2>
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
                      <h3 className="text-xl font-bold mb-2">FP&A Managers</h3>
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
                      <h3 className="text-xl font-bold mb-2">Founders</h3>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 flex flex-col h-full">
                    <div className="flex-1 space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Free</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold">€0</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                        <p className="text-muted-foreground mt-2">Get started with basic DATEV conversion</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>3 Uploads per Month</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>AI Conversion to clean xlsx file</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>GDPR compliance</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full mt-6" variant="outline" onClick={showBetaDialog}>
                      Get Started Free
                    </Button>
                  </Card>

                  <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 flex flex-col h-full">
                    <div className="flex-1 space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Starter</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold">€49</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                        <p className="text-muted-foreground mt-2">Perfect for getting started with properly storing data</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Unlimited Uploads per Month</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>AI Conversion to clean xlsx file</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>GDPR compliance</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Storage in SQL database</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Standard Report Templates</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full mt-6" variant="outline" onClick={showBetaDialog}>
                      Start Free Trial
                    </Button>
                  </Card>

                  <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 border-primary relative overflow-hidden flex flex-col h-full">
                    <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">Most Popular</Badge>
                    
                    <div className="flex-1 space-y-6 relative z-10">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Professional</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold">€99</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                        <p className="text-muted-foreground mt-2">For growing finance teams needing advanced features</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Unlimited Uploads per Month</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>AI Conversion to clean xlsx file</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>GDPR compliance</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Storage in SQL database</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Standard Report Templates</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Design your own reports</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>API for 3rd Party BI Tool</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow mt-6 relative z-10" onClick={showBetaDialog}>
                      Start Free Trial
                    </Button>
                  </Card>
                </div>

              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="relative bg-gradient-to-br from-primary to-primary-glow py-12 md:py-16 text-white overflow-hidden">
            {/* Dark overlay for better text contrast */}
            <div className="absolute inset-0 bg-black/30"></div>
            
            {/* Subtle pattern overlay for texture */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:24px_24px]"></div>
            </div>
            
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto text-center space-y-8">
                <div className="animate-fade-in space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">Ready to Escape Excel Hell?</h2>
                  <p className="text-xl text-white/95 max-w-3xl mx-auto drop-shadow-md">
                    Join startup CFOs who've transformed their finance operations and are making confident, 
                    data-driven decisions every day.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90 shadow-xl" onClick={showBetaDialog}>
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Start Free Trial - No Credit Card
                  </Button>
                  <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" onClick={showBetaDialog}>
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
      
      <BetaDialog />
    </div>
  );
};

export default Homepage;