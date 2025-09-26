import React from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Linkedin, Lightbulb, Rocket, Zap, Clock } from 'lucide-react';
import { useUITranslations } from '@/hooks/useUITranslations';

export default function About() {
  const { t } = useUITranslations();
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <div className="space-y-8">
          {/* Welcome Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                Hi, I'm Thomas Schenkelberg —<br />the Startup CFO who is building the DATEV Converter app.
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              {/* Thomas's Photo */}
              <div className="flex justify-center">
                <img 
                  src="/lovable-uploads/9a572706-2163-4eff-83f4-31746c12f3a9.png" 
                  alt="Thomas Schenkelberg - Startup CFO" 
                  className="w-48 h-48 rounded-full object-cover"
                />
              </div>
              
              {/* LinkedIn Link */}
              <Button variant="outline" asChild>
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
                    <Rocket className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">What I'm building</h3>
                </div>
                <div className="pl-11 space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="h-4 w-4 text-background" />
                    </div>
                    <div>
                      <span className="text-lg"><strong className="text-foreground">Lightweight solution</strong>: No need to implement anything. Upload an xlsx, pdf or csv file. Done.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="h-4 w-4 text-background" />
                    </div>
                    <div>
                      <span className="text-lg"><strong className="text-foreground">Fast</strong>: Minutes to a usable P&L/Balance Sheet — no need to set up and maintain a complicated Excel model.</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About Building the App */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">About Building the App</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full mb-4">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/arxz2xINLLg" 
                  title="About Building the DATEV Converter App"
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                  className="rounded-lg"
                ></iframe>
              </div>
            </CardContent>
          </Card>

          {/* About Fractional CFO Work */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">{t('HEADING_CFO_WORK', 'About my Fractional CFO Work')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-text-body leading-relaxed">
                Think of me as your senior finance sparring partner. 
                I share my hands-on experience from working 20+ years in finance. 
                My sweet spot is tech companies with 30–300 employees. 

                Common Situations
                <strong>You want to apply AI</strong>  - ..but don't know where to start and where it makes really sense.
               <strong>Your senior Finance Person Left</strong>  - …and the tax authorities, investors, banks, etc. are still around and want some numbers from you.
              <strong>Lack of a senior Finance sparring partner</strong>  - You’re leading the Finance team or the entire company. The company is growing and you have to grow the Finance team or make changes to your finance tech stack. You’re looking for a senior sparring partner to bounce off your ideas. 
              <strong>Lack of Financial Insights</strong> - You’re receiving nothing but confusing (DATEV) reports from your tax firm that are absolutely meaningless to you. Because, let’s face it, these reports are pretty useless. You can’t steer your business and make decisions based on these reports. 
                <strong>You are paying steep U.S. consulting fees</strong> - 800 USD for a 1 hour meeting and you feel confused.  You’re not speaking the same language. In many ways. You need someone with pragmatic advice on what to do in the U.S..
              </p>
              
              <div>
                <h4 className="text-lg font-medium mb-3 text-text-heading">What I bring:</h4>
                <ul className="space-y-3 text-text-body">
                  <li><strong>Hands‑on leadership</strong>: Built and led finance teams up to 20 people across 7 countries.</li>
                  <li><strong>End‑to‑end finance expertise</strong>: Accounting, FP&A, tax, treasury, and corporate finance.</li>
                  <li><strong>Data & insights</strong>: From cleaning up messy numbers to building BI dashboards that actually help run the business.</li>
                  <li><strong>Transformation & scaling</strong>: Took multiple companies from Series A to Series C structures, set up in‑house accounting, and reduced reporting cycles from 30 to 6 days.</li>
                  <li><strong>Compliance & audits</strong>: Delivered first‑time consolidated audits with zero adjustments; ensured global VAT and payroll tax compliance in 30+ countries.</li>
                  <li><strong>Corporate finance projects</strong>: Supported acquisitions, credit facilities, and share buybacks by preparing clean, reliable data.</li>
                </ul>
              </div>
              
              <p className="text-text-body leading-relaxed font-medium">
                
              </p>
            </CardContent>
          </Card>

          {/* CV Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">{t('HEADING_CV_SUMMARY', 'CV Summary — Thomas Schenkelberg')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-text-body">
                <li><strong>20+ Years of Experience</strong> across leading finance departments in startups & scaleups, auditing, and tax advisory.</li>
                <li><strong>Leadership</strong>: Scaled international finance teams from 1 to 20 people across Europe and North America.</li>
                <li><strong>Finance Tech Stack</strong>: Migrated companies to modern finance stacks (NetSuite, Power BI, Azure, LucaNet, Agicap).</li>
                <li><strong>Governance</strong>: Delivered first‑time Big Four audits, implemented international tax compliance (TP, PE, contractor risks).</li>
                <li><strong>Board/Investor Engagement</strong>: Built board‑ready reporting, FP&A processes, and liquidity management.</li>
                <li><strong>Style</strong>: Pragmatic, hands-on, and empathetic — with a strong bias for getting things done.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Companies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">{t('HEADING_COMPANIES', 'Companies I used to work for')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6 text-text-body">
                <div className="flex items-center gap-4">
                  <img 
                    src="/company-logos/eyeo-logo.png?v=20250925-2" 
                    alt="eyeo GmbH logo" 
                    className="w-32 h-12 object-contain bg-white p-2 rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-text-heading">eyeo GmbH (AdTech / SaaS)</h4>
                    <p className="text-sm text-text-subtle">VP Finance</p>
                    <p>Grew from 150 → 350 employees, €100m revenue, scaled finance team, built finance tech stack, led M&A and share buyback.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <img 
                    src="/company-logos/sharecharge-logo.png" 
                    alt="Share&Charge Foundation logo" 
                    className="w-32 h-12 object-contain bg-white p-2 rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-text-heading">Share&Charge Foundation (Web3 / Crypto)</h4>
                    <p className="text-sm text-text-subtle">Co‑Founder & CFO</p>
                    <p>Grew from 1 → 15 employees, managed fundraising and compliance, set up Euro stablecoin, prepared ICO.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <img 
                    src="/company-logos/cleverbridge-logo.png?v=20250925-2" 
                    alt="cleverbridge AG logo" 
                    className="w-32 h-12 object-contain bg-white p-2 rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-text-heading">cleverbridge AG (E‑commerce / SaaS marketplace)</h4>
                    <p className="text-sm text-text-subtle">Director Finance & Tax</p>
                    <p>Grew from 100 → 300 employees, scaled finance team, €60m revenue, €500m GMV, built consolidation and BI systems.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <img 
                    src="/company-logos/roedl-logo.png?v=20250925-2" 
                    alt="Rödl & Partner logo" 
                    className="w-32 h-12 object-contain bg-white p-2 rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-text-heading">Rödl & Partner USA (Audit & Tax Consulting)</h4>
                    <p className="text-sm text-text-subtle">Senior Manager</p>
                    <p>Advised international clients with U.S.–Germany footprint, managed audits, IFRS/US‑GAAP/German‑GAAP conversions.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <img 
                    src="/company-logos/ey-logo.png" 
                    alt="Ernst & Young logo" 
                    className="w-32 h-12 object-contain bg-white p-2 rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-text-heading">Ernst & Young GER (Tax Accounting, Germany)</h4>
                    <p className="text-sm text-text-subtle">Senior Assistant</p>
                    <p>Tax accounting for large international corporations, tax risk reviews, SEC client reporting, US GAAP/IFRS training.</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-text-subtle mt-4">
                Other roles include interim CFO mandates at InsurTech, E‑commerce, and SaaS startups, 
                building finance functions from scratch and optimizing processes in growth stage.
              </p>
            </CardContent>
          </Card>

          {/* Completed Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">{t('HEADING_PROJECTS', 'Completed Projects & Achievements')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 text-text-body">
                <div>
                  <h4 className="font-medium text-text-heading mb-2">Finance Team Leadership & Development</h4>
                  <p>Grew finance departments from 1 → 20 employees, led remote teams across 7 countries, hired 50+ finance professionals, and managed scale‑up transformations (Series A → Series C).</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-text-heading mb-2">Accounting</h4>
                  <p>Transitioned accounting in‑house, implemented LucaNet, reduced monthly reporting cycles from 30 → 6 days, prepared consolidated statements under German GAAP, US GAAP, and IFRS, delivered Big Four audits with zero findings.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-text-heading mb-2">FP&A, BI & Reporting</h4>
                  <p>Built budgeting and forecasting from scratch, created KPI systems, set up data warehouses and BI dashboards (Power BI, BOARD), and designed cost/profit center logic.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-text-heading mb-2">Finance Tech & Process Optimization</h4>
                  <p>Automated workflows (Circula, Harvest, Candis), migrated from DATEV to Scopevisio ERP, implemented high‑ROI finance tools, integrated merchant‑of‑record providers.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-text-heading mb-2">Tax Compliance & Risk Management</h4>
                  <p>Ran global VAT compliance for 10m+ transactions (€500m GMV), implemented payroll tax strategies across 30+ countries, managed transfer pricing and tax due diligences, filed US voluntary disclosures.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-text-heading mb-2">Corporate Finance & Treasury</h4>
                  <p>Supported M&A (two acquisitions €10m & €40m), managed sell‑side due diligences, prepared data rooms, supported €50m credit facility and €100m share buyback with clean, accurate financial data.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-text-heading mb-2">Strategic & Entrepreneurial Initiatives</h4>
                  <p>Co‑founded Web3 e‑mobility startup, prepared an ICO, managed open‑source licensing, and gained hands‑on entrepreneurial experience.</p>
                </div>
              </div>
              
              <p className="text-text-subtle font-medium mt-6">
                These achievements reflect the core of my CFO work: scaling teams, cleaning up data, building reliable systems, and enabling growth.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}