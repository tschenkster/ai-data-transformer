import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Footer from '@/components/Footer';
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

export default function Home() {
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

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center space-y-12 max-w-6xl mx-auto">
            {/* Main Headline */}
            <div className="animate-fade-in space-y-6" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight bg-gradient-primary bg-clip-text text-transparent">
                Decision-Ready Finance Data for Startup CFOs
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Turn messy DATEV exports into clean, actionable insights — without Excel headaches or overpriced BI tools.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="animate-fade-in flex flex-col sm:flex-row gap-4 justify-center items-center" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-glow hover:shadow-xl group">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Visual Demo Preview */}
            <div className="animate-fade-in pt-16" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
              <div className="relative max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-destructive/20 to-primary/20 rounded-2xl p-8 border border-border shadow-2xl backdrop-blur-sm">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <div className="text-destructive">
                        <span className="font-medium">DATEV Reports & Excel Hell</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-destructive/20 rounded animate-pulse"></div>
                        <div className="h-3 bg-destructive/20 rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-destructive/20 rounded animate-pulse w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="text-primary">
                        <span className="font-medium">Clean Data & Warehouse Heaven</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-primary/20 rounded"></div>
                        <div className="h-3 bg-primary/20 rounded w-4/5"></div>
                        <div className="h-3 bg-primary/20 rounded w-3/5"></div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating transformation arrow */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="bg-background border border-primary p-3 rounded-full shadow-glow animate-pulse">
                    <ArrowRight className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Target Audience Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto text-center space-y-12">
            <div className="animate-fade-in space-y-4">
              <Badge variant="secondary" className="px-4 py-2 bg-primary/10 text-primary">Perfect For</Badge>
              <h2 className="text-4xl font-bold text-foreground">CFOs of Startups with 10–100 Employees</h2>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                You need board-ready insights yesterday, but you don't have a large finance team or expensive infrastructure. 
                You're stuck with DATEV outputs that tell you nothing useful and Excel sheets that break every time you breathe on them.
              </p>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="bg-gradient-to-br from-destructive/5 to-background py-20">
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
        <section className="bg-gradient-to-br from-primary/5 to-background py-20">
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
                        <Target className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="font-bold">Flexible reporting structures</div>
                        <div className="text-sm text-muted-foreground font-normal mt-2">Any format you need</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Map your accounts to any reporting structure you need. Board reports, investor updates, 
                      department budgets — all from the same clean data foundation.
                    </p>
                    <div className="flex items-center gap-2 text-primary/70">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm">50+ templates included</span>
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
                        <div className="font-bold">Plug into your favorite BI tools</div>
                        <div className="text-sm text-muted-foreground font-normal mt-2">Seamless integration</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Export clean data to Tableau, Power BI, or any visualization tool. Or keep it simple with 
                      our built-in dashboards for quick insights and trend analysis.
                    </p>
                    <div className="flex items-center gap-2 text-primary/70">
                      <Smartphone className="h-4 w-4" />
                      <span className="text-sm">Works with all major tools</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CTA in Solution */}
              <div className="text-center bg-primary/5 rounded-2xl p-8 border border-primary/20">
                <h3 className="text-2xl font-bold text-primary mb-4">Ready to Transform Your Finance Workflow?</h3>
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Join 2,000+ startup CFOs who've already made the switch from Excel chaos to data clarity.
                </p>
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-6">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Showcase Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <Badge variant="secondary" className="px-4 py-2 bg-primary/10 text-primary">Full Feature Set</Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">Everything You Need</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                A complete finance transformation platform designed for growing startups.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-primary/20 hover:border-primary/40 group">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <FileSpreadsheet className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">DATEV Import</h3>
                  <p className="text-muted-foreground text-sm">
                    One-click upload and instant processing of any DATEV export format.
                  </p>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-primary/20 hover:border-primary/40 group">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Zap className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">AI Categorization</h3>
                  <p className="text-muted-foreground text-sm">
                    Smart account mapping with 95% accuracy out of the box.
                  </p>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-primary/20 hover:border-primary/40 group">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Database className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">SQL Database</h3>
                  <p className="text-muted-foreground text-sm">
                    Enterprise-grade data storage that scales with your business.
                  </p>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-primary/20 hover:border-primary/40 group">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Target className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Custom Reports</h3>
                  <p className="text-muted-foreground text-sm">
                    50+ pre-built templates plus unlimited custom structures.
                  </p>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-primary/20 hover:border-primary/40 group">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <BarChart3 className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">BI Integration</h3>
                  <p className="text-muted-foreground text-sm">
                    Direct exports to Tableau, Power BI, and other visualization tools.
                  </p>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-primary/20 hover:border-primary/40 group">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Shield className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">SOC 2 Security</h3>
                  <p className="text-muted-foreground text-sm">
                    Bank-level security with full compliance and audit trails.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Persona Section */}
        <section className="bg-gradient-subtle/30 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto space-y-12">
              <div className="text-center animate-fade-in space-y-4">
                <Badge variant="secondary" className="px-4 py-2 bg-primary/10 text-primary">Perfect Match</Badge>
                <h2 className="text-4xl font-bold text-foreground">Who It's For</h2>
                <p className="text-xl text-muted-foreground">
                  Built specifically for finance leaders at growing startups.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="text-center p-8 hover:scale-105 transition-all duration-300 shadow-elegant hover:shadow-glow border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent group">
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                      <Users className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Startup CFOs</h3>
                      <p className="text-muted-foreground mb-4">Leading finance at companies with 10-100 employees</p>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span>Lean finance teams</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span>Board reporting pressure</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="text-center p-8 hover:scale-105 transition-all duration-300 shadow-elegant hover:shadow-glow border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent group">
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                      <Target className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Finance Managers</h3>
                      <p className="text-muted-foreground mb-4">Need insights without a dedicated data team</p>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span>Limited resources</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span>Growing complexity</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="text-center p-8 hover:scale-105 transition-all duration-300 shadow-elegant hover:shadow-glow border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent group">
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                      <Activity className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Finance-Responsible Founders</h3>
                      <p className="text-muted-foreground mb-4">Want clarity without complexity</p>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span>Multiple responsibilities</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span>Budget conscious</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing/Value Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <Badge className="px-4 py-2 bg-primary text-primary-foreground">Simple Pricing</Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">Start Free, Scale Smart</h2>
              <p className="text-xl text-muted-foreground">
                No setup fees, no long-term contracts. Pay only for what you use.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8 border-2 border-border hover:border-primary/50 transition-all duration-300 relative">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">Starter</h3>
                    <p className="text-muted-foreground">Perfect for getting started</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">Free</div>
                    <div className="text-sm text-muted-foreground">Up to 3 DATEV uploads/month</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-sm">Basic AI categorization</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-sm">5 standard report templates</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-sm">CSV export</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" size="lg">
                    Start Free Trial
                  </Button>
                </div>
              </Card>

              <Card className="p-8 border-2 border-primary bg-gradient-to-br from-primary/5 to-transparent relative">
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1">
                  Most Popular
                </Badge>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">Professional</h3>
                    <p className="text-muted-foreground">For growing finance teams</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">€99<span className="text-lg text-muted-foreground">/month</span></div>
                    <div className="text-sm text-muted-foreground">Unlimited uploads & reports</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-sm">Advanced AI with custom training</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-sm">50+ report templates + custom</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-sm">BI tool integrations</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-sm">Priority support</span>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-primary hover:opacity-90" size="lg">
                    Start 14-Day Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>

            {/* ROI Calculator Teaser */}
            <div className="text-center bg-primary/5 rounded-2xl p-8 border border-primary/20">
              <h3 className="text-2xl font-bold text-foreground mb-4">Calculate Your ROI</h3>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Typical customers save 15-20 hours per month and reduce reporting errors by 95%.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">€3,200</div>
                  <div className="text-sm text-muted-foreground">Monthly time savings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">95%</div>
                  <div className="text-sm text-muted-foreground">Error reduction</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">3x</div>
                  <div className="text-sm text-muted-foreground">Faster insights</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-gradient-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
          <div className="container mx-auto px-4 py-20 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="animate-fade-in space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  Stop Wrestling with Excel. Start Driving Your Startup with Real-Time, Decision-Ready Finance Data.
                </h2>
                <p className="text-xl opacity-90 max-w-2xl mx-auto">
                  Join 2,000+ startup CFOs who've transformed their finance operations. 
                  Get started in minutes, see results immediately.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <div className="pt-8 text-center opacity-80">
                <p className="text-lg">
                  Use the sidebar navigation to start transforming your DATEV exports today.
                </p>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute top-8 right-8 opacity-20">
              <TrendingUp className="h-16 w-16 animate-[bounce_2s_ease-in-out_infinite]" />
            </div>
            <div className="absolute bottom-8 left-8 opacity-20">
              <Database className="h-14 w-14 animate-[bounce_2s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
            </div>
            <div className="absolute top-1/2 right-16 opacity-10">
              <BarChart3 className="h-20 w-20 animate-[bounce_3s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
            </div>
          </div>
        </section>

        {/* Sticky CTA Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50 p-4 lg:hidden">
          <div className="container mx-auto">
            <div className="flex gap-3">
              <Button className="flex-1 bg-gradient-primary hover:opacity-90">
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>

        {/* Trust & Social Proof Section */}
        <section className="bg-gradient-subtle/30 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-12">
              <div className="animate-fade-in">
                <h2 className="text-lg font-medium text-muted-foreground mb-8">Trusted by startup finance teams at</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center opacity-60">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="bg-muted/20 h-12 rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground/60 font-medium">Company {i}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <Card className="text-center p-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:from-primary/10 transition-all duration-300 group">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary mb-1">SOC 2</div>
                      <div className="text-sm text-muted-foreground">Compliant & Secure</div>
                    </div>
                  </div>
                </Card>

                <Card className="text-center p-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:from-primary/10 transition-all duration-300 group">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                      <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary mb-1">10x</div>
                      <div className="text-sm text-muted-foreground">Faster Reporting</div>
                    </div>
                  </div>
                </Card>

                <Card className="text-center p-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:from-primary/10 transition-all duration-300 group">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary mb-1">4.9/5</div>
                      <div className="text-sm text-muted-foreground">User Rating</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}