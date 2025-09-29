import React from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Linkedin, Lightbulb, Zap, Clock, Target, HandHeart, DollarSign, Users, Building2 } from 'lucide-react';
import { useUITranslations } from '@/hooks/useUITranslations';

export default function About() {
  const { t } = useUITranslations();
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <div className="space-y-8">
          {/* Welcome Message */}
          <Card className="bg-white border-2 border-border">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center text-foreground">
                Hi, I'm Thomas Schenkelberg —<br />the Startup CFO who is building the DATEV Converter app.
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              {/* Thomas's Photo */}
              <div className="flex justify-center">
                 <div className="relative">
                   <img 
                     src="/profile-picture-thomas-new.png" 
                     alt="Thomas Schenkelberg - Startup CFO" 
                     className="w-48 h-48 rounded-full object-cover border-4 border-primary/20 shadow-lg"
                   />
                   <div className="absolute inset-0 rounded-full ring-2 ring-primary/10 ring-offset-2 ring-offset-background"></div>
                 </div>
              </div>
              
              {/* LinkedIn Link */}
              <Button 
                variant="outline" 
                asChild
                className="bg-[#0077b5] hover:bg-[#005885] text-white border-[#0077b5] hover:border-[#005885]"
              >
                <a href="https://www.linkedin.com/in/thomas-schenkelberg/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  {t('BTN_CONNECT_LINKEDIN', 'Connect on LinkedIn')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* About DATEV Converter App */}
          <Card className="relative overflow-hidden border-2 border-border bg-white">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/10 to-transparent"></div>
            <CardHeader className="relative">
              <CardTitle className="text-3xl font-bold text-center text-foreground">
                {t('HEADING_ABOUT_APP', 'About DATEV Converter App')}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-8">
              <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{t('HEADING_WHY_EXISTS', 'Why this app exists')}</h3>
                </div>
                <div className="pl-11">
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    Without having Accounting in‑house and an ERP/BI stack, getting <strong className="text-foreground">reliable financial insights</strong> is oddly hard.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-lg mt-4">
                    I kept running into the same wall in startups: messy (DATEV) exports, fragile models in Excel / Google Sheets, zero time for analysis.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-lg mt-4 font-medium text-foreground">
                    So I'm building the tool I always wished I had.
                  </p>
                </div>
              </div>
              
              <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Target className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">What I'm building</h3>
                </div>
                <div className="pl-11 space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="h-4 w-4 text-background" />
                    </div>
                    <div>
                      <span className="text-lg"><strong className="text-foreground">An app that is lightweight</strong>: I don't need to implement anything. I upload an xlsx, pdf or csv file. Done.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="h-4 w-4 text-background" />
                    </div>
                    <div>
                      <span className="text-lg"><strong className="text-foreground">An app that speeds up my work</strong>: In minutes I get a usable P&L/Balance Sheet — no need to set up and maintain a complicated Excel model.</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About Building the App */}
          <Card className="relative overflow-hidden border-2 border-border bg-white">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/10 to-transparent"></div>
            <CardHeader className="relative">
              <CardTitle className="text-3xl font-bold text-center text-foreground">{t('HEADING_CFO_WORK', 'About Building the App')}</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-6">
              <div className="aspect-video w-full mb-4 mt-6">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/arxz2xINLLg" 
                  title="About Building the DATEV Converter App"
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                  className="rounded-lg border border-border/50"
                ></iframe>
              </div>
            </CardContent>
          </Card>

          {/* About Fractional CFO Work */}
          <Card className="relative overflow-hidden border-2 border-border bg-white">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/10 to-transparent"></div>
            <CardHeader className="relative">
              <CardTitle className="text-3xl font-bold text-center text-foreground">{t('HEADING_CFO_WORK', 'About my Fractional CFO Work')}</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-8">
              <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">My Approach</h3>
                </div>
                <div className="pl-11">
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    I earn my living by sharing my hands-on experience from working <strong className="text-foreground">20+ years in finance</strong>.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-lg mt-4">
                    Think of me as your <strong className="text-foreground">senior finance sparring partner</strong>. My sweet spot is tech companies with 30–300 employees.
                  </p>
                </div>
              </div>
              
              <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <HandHeart className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Common Scenarios Where I Help</h3>
                </div>
                <div className="pl-11 space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="h-4 w-4 text-background" />
                    </div>
                    <div>
                      <span className="text-lg"><strong className="text-foreground">You want to apply AI</strong> — but don't know where to start and where it makes really sense.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="h-4 w-4 text-background" />
                    </div>
                    <div>
                      <span className="text-lg"><strong className="text-foreground">Your senior finance person left</strong> — and the tax authorities, investors, banks, etc. are still around and want some numbers from you.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ExternalLink className="h-4 w-4 text-background" />
                    </div>
                    <div>
                      <span className="text-lg"><strong className="text-foreground">You need a sounding board for your ideas</strong> — You're leading the Finance team or the entire company. The company is growing and you have to grow the Finance team or make changes to your finance tech stack. You're looking for a senior sparring partner to bounce off your ideas.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lightbulb className="h-4 w-4 text-background" />
                    </div>
                    <div>
                      <span className="text-lg"><strong className="text-foreground">You are lacking of financial insights</strong> — You're receiving nothing but confusing (DATEV) reports from your tax firm that are absolutely meaningless to you. Because, let's face it, these reports are pretty useless. You can't steer your business and make decisions based on these reports.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                      <DollarSign className="h-4 w-4 text-background" />
                    </div>
                    <div>
                      <span className="text-lg"><strong className="text-foreground">You are paying steep U.S. consulting fees</strong> — 800 USD for a 1 hour meeting with U.S. tax consultant and you feel confused. You're not speaking the same language. In many ways. You need someone with pragmatic advice on what to do in the U.S.</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Companies */}
          <Card className="relative overflow-hidden border-2 border-border bg-white">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/10 to-transparent"></div>
            <CardHeader className="relative">
              <CardTitle className="text-3xl font-bold text-center text-foreground">{t('HEADING_COMPANIES', 'Companies I used to work for')}</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-8">
              <div className="space-y-8">
                <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                  <div className="flex items-center gap-4 mb-5">
                    <img 
                      src="/company-logos/eyeo-logo.png?v=20250925-2" 
                      alt="eyeo GmbH logo" 
                      className="w-24 h-8 object-contain bg-white p-1 rounded border border-border/30"
                    />
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-foreground">eyeo GmbH</h4>
                      <p className="text-sm text-muted-foreground">VP Finance • AdTech / SaaS</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      <span>Scaled company from 150 to 350 employees at €100m revenue</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      <span>Built comprehensive finance tech stack and processes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      <span>Led M&A transactions and share buyback initiatives</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                  <div className="flex items-center gap-4 mb-5">
                    <img 
                      src="/company-logos/sharecharge-logo.png" 
                      alt="Share&Charge Foundation logo" 
                      className="w-24 h-8 object-contain bg-white p-1 rounded border border-border/30"
                    />
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-foreground">Share&Charge Foundation</h4>
                      <p className="text-sm text-muted-foreground">Co‑Founder & CFO • Web3 / Crypto</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      <span>Grew from startup to 15 employees as founding team member</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      <span>Managed fundraising rounds and regulatory compliance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      <span>Set up Euro stablecoin infrastructure and prepared ICO</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                  <div className="flex items-center gap-4 mb-5">
                    <img 
                      src="/company-logos/cleverbridge-logo.png?v=20250925-2" 
                      alt="cleverbridge AG logo" 
                      className="w-24 h-8 object-contain bg-white p-1 rounded border border-border/30"
                    />
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-foreground">cleverbridge AG</h4>
                      <p className="text-sm text-muted-foreground">Director Finance & Tax • E‑commerce / SaaS</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      <span>Scaled operations from 100 to 300 employees</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      <span>Managed €60m revenue and €500m GMV operations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      <span>Built consolidation systems and BI infrastructure</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                  <div className="flex items-center gap-4 mb-5">
                    <img 
                      src="/company-logos/roedl-logo.png?v=20250925-2" 
                      alt="Rödl & Partner logo" 
                      className="w-24 h-8 object-contain bg-white p-1 rounded border border-border/30"
                    />
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-foreground">Rödl & Partner USA</h4>
                      <p className="text-sm text-muted-foreground">Senior Manager • Audit & Tax Consulting</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      <span>U.S.–Germany cross-border consulting expertise</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      <span>IFRS/US‑GAAP/German‑GAAP conversions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      <span>International audit management</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                  <div className="flex items-center gap-4 mb-5">
                    <img 
                      src="/company-logos/ey-logo.png" 
                      alt="Ernst & Young logo" 
                      className="w-24 h-8 object-contain bg-white p-1 rounded border border-border/30"
                    />
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-foreground">Ernst & Young</h4>
                      <p className="text-sm text-muted-foreground">Senior Assistant • Tax Accounting (Germany)</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      <span>Tax accounting for large international corporations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      <span>SEC client reporting and compliance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      <span>US GAAP/IFRS training and implementation</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                <h3 className="text-xl font-semibold text-foreground mb-4">Additional Experience</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Multiple interim CFO mandates at InsurTech, E‑commerce, and SaaS startups, building finance functions from scratch and optimizing processes during growth phases.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Completed Projects & Achievements */}
          <Card className="relative overflow-hidden border-2 border-border bg-white">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/10 to-transparent"></div>
            <CardHeader className="relative">
              <CardTitle className="text-3xl font-bold text-center text-foreground">{t('HEADING_CV_SUMMARY', 'Completed Projects & Achievements')}</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-6">
              <div className="space-y-6">
                <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-5 w-5 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold text-foreground">Finance Team Leadership & Development</h4>
                  </div>
                  <div className="pl-11">
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      Grew finance departments from <strong className="text-foreground">1 → 20 employees</strong>, led remote teams across 7 countries, hired 50+ finance professionals, and managed scale-up transformations (Series A → Series C).
                    </p>
                  </div>
                </div>

                <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="h-5 w-5 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold text-foreground">Accounting</h4>
                  </div>
                  <div className="pl-11">
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      Transitioned accounting in-house, implemented LucaNet, reduced monthly reporting cycles from <strong className="text-foreground">30 → 6 days</strong>, prepared consolidated statements under German GAAP, US GAAP, and IFRS, delivered Big Four audits with zero findings.
                    </p>
                  </div>
                </div>

                <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Lightbulb className="h-5 w-5 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold text-foreground">FP&A, BI & Reporting</h4>
                  </div>
                  <div className="pl-11">
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      Built budgeting and forecasting from scratch, created KPI systems, set up data warehouses and BI dashboards <strong className="text-foreground">(Power BI, BOARD)</strong>, and designed cost/profit center logic.
                    </p>
                  </div>
                </div>

                <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Zap className="h-5 w-5 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold text-foreground">Finance Tech & Process Optimization</h4>
                  </div>
                  <div className="pl-11">
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      Automated workflows <strong className="text-foreground">(Circula, Harvest, Candis)</strong>, migrated from DATEV to Scopevisio ERP, implemented high-ROI finance tools, integrated merchant-of-record providers.
                    </p>
                  </div>
                </div>

                <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <ExternalLink className="h-5 w-5 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold text-foreground">Tax Compliance & Risk Management</h4>
                  </div>
                  <div className="pl-11">
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      Ran global VAT compliance for <strong className="text-foreground">10m+ transactions (€500m GMV)</strong>, implemented payroll tax strategies across 30+ countries, managed transfer pricing and tax due diligences, filed US voluntary disclosures.
                    </p>
                  </div>
                </div>

                <div className="bg-card/50 rounded-lg p-6 border border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold text-foreground">Corporate Finance & Treasury</h4>
                  </div>
                  <div className="pl-11">
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      Supported M&A <strong className="text-foreground">(two acquisitions €10m & €40m)</strong>, managed sell-side due diligences, prepared data rooms, supported €50m credit facility and €100m share buyback with clean, accurate financial data.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tools I've Worked With */}
          <Card className="bg-white border-2 border-border">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-foreground">{t('HEADING_TOOLS', 'About Tools I\'ve Worked With')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed text-lg">
                Throughout my career, I've worked hands-on with a wide range of finance, accounting, and business tools. 
                Here's a selection of the software and platforms I've implemented, managed, or used extensively:
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[
                  { name: "LucaNet", category: "Consolidation", favicon: "/tool-logos/lucanet-favicon.png" },
                  { name: "AGICAP", category: "Cash Management", favicon: "/tool-logos/agicap-favicon.ico" },
                  { name: "Power BI", category: "Business Intelligence", favicon: "/tool-logos/powerbi-favicon.png" },
                  { name: "BOARD", category: "CPM Platform", favicon: "/tool-logos/board-favicon-new.png" },
                  { name: "Circula", category: "Expense Management", favicon: "/tool-logos/circula-favicon.png" },
                  { name: "CANDIS", category: "Invoice Processing", favicon: "/tool-logos/candis-favicon.ico" },
                  { name: "DATEV", category: "Accounting Software", favicon: "/tool-logos/datev-favicon.ico" },
                  { name: "Lexware", category: "Accounting Software", favicon: "/tool-logos/lexware-favicon.ico" },
                  { name: "Xero", category: "Cloud Accounting", favicon: "/tool-logos/xero-favicon.ico" },
                  { name: "QuickBooks", category: "Accounting Software", favicon: "/tool-logos/quickbooks-favicon.png" },
                  { name: "Spendesk", category: "Spend Management", favicon: "/tool-logos/spendesk-favicon.ico" },
                  { name: "Stripe", category: "Payment Processing", favicon: "/tool-logos/stripe-favicon.ico" },
                  { name: "SAP", category: "ERP System", favicon: "/tool-logos/sap-favicon.png" },
                  { name: "Avalara", category: "Tax Compliance", favicon: "/tool-logos/avalara-favicon.png" },
                  { name: "Jira", category: "Project Management", favicon: "/tool-logos/jira-favicon.ico" },
                  { name: "Trello", category: "Project Management", favicon: "/tool-logos/trello-favicon.ico" },
                  { name: "Confluence", category: "Documentation", favicon: "/tool-logos/confluence-favicon.ico" },
                  { name: "GitHub", category: "Version Control", favicon: "/tool-logos/github-favicon.ico" },
                  { name: "Mixpanel", category: "Analytics", favicon: "/tool-logos/mixpanel-favicon.ico" },
                  { name: "Personio", category: "HR Management", favicon: "/tool-logos/personio-favicon.ico" },
                  { name: "Peakon", category: "Employee Engagement", favicon: "/tool-logos/peakon-favicon.ico" },
                  { name: "Leapsome", category: "Performance Management", favicon: "/tool-logos/leapsome-favicon.png" },
                  { name: "Greenhouse", category: "Recruiting", favicon: "/tool-logos/greenhouse-favicon.png" },
                  { name: "Harvest", category: "Time Tracking", favicon: "/tool-logos/harvest-favicon.ico" }
                ].map((tool) => (
                  <div key={tool.name} className="bg-white rounded-lg p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                     <div className="h-20 flex items-center justify-center mb-4">
                       {(tool as any).favicon || (tool as any).logo ? (
                         <img 
                           src={(tool as any).favicon || (tool as any).logo} 
                           alt={`${tool.name} favicon`} 
                           className="w-16 h-16 object-contain"
                         />
                       ) : (
                         <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                           <span className="text-2xl font-bold text-foreground">
                             {tool.name.charAt(0)}
                           </span>
                         </div>
                       )}
                     </div>
                    <h4 className="font-semibold text-foreground text-center mb-1">{tool.name}</h4>
                    <p className="text-xs text-muted-foreground text-center">{tool.category}</p>
                  </div>
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg border border-border/50">
                This represents just a selection of the tools I've used. The key is not just knowing the software, 
                but understanding how to integrate these tools effectively into finance workflows and business processes.
              </p>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
}