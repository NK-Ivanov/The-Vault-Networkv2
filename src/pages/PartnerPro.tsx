import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Trophy, Zap, Users, Shield, TrendingUp, Headphones, Star, Lock, BookOpen, BarChart3, Palette, Award, Sparkles, Rocket, Target, Briefcase, Layers, Gauge } from "lucide-react";

const PartnerPro = () => {
  const navigate = useNavigate();

  usePageMeta({
    title: "Partner Pro - The Vault Network",
    description: "Upgrade to Partner Pro for advanced features, premium support, and exclusive benefits to accelerate your automation business.",
    ogTitle: "Partner Pro - The Vault Network",
    ogDescription: "Upgrade to Partner Pro for advanced features, premium support, and exclusive benefits.",
    ogUrl: "https://vaultnet.work/partner-pro",
  });

  const corePillars = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Premium Automations",
      description: "Access to 50+ high-ticket, business-grade automations that Free/Standard partners can't sell.",
      examples: "CRM integrations, multi-channel marketing, AI lead scoring, e-commerce connectors"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Advanced Tools & Portals",
      description: "Dedicated client-management dashboards and analytics.",
      examples: "Client automation page, live metrics, activity history"
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Education & Templates",
      description: "Step-by-step guides, advanced scripts, and sales playbooks.",
      examples: "Video walkthroughs, objection-handling scripts, niche-specific templates"
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: "Brand and Trust Assets",
      description: "Everything needed to look like an automation agency.",
      examples: "Custom sub-domain, branded client portal, 'Partner Pro Verified' badge"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Profit & Priority",
      description: "Higher commission, early automation access, and direct support.",
      examples: "45–50% commission, private support line, beta automation testing"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal to-vault-black"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-vault-gold opacity-10 blur-[120px] rounded-full"></div>
        
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1.5 text-sm">
              <Trophy className="w-4 h-4 mr-2" />
              Professional Tier
            </Badge>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 gold-glow text-primary">
            Partner Pro
          </h1>
          <p className="text-xl md:text-2xl text-foreground mb-4 max-w-3xl mx-auto font-medium">
            Built for Verified Partners Who Want to Scale Beyond Single-Client Sales
          </p>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Move from "selling automations" to "managing automation businesses" with premium tools, higher commissions, and agency-grade features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 gold-border-glow"
              onClick={() => navigate('/partner-dashboard')}
            >
              Upgrade Now - $24.99/month
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary/50 text-foreground hover:bg-primary/10 font-semibold px-8 py-6"
              onClick={() => navigate('/partner-dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Entry Requirements */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl text-primary flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Entry Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm font-semibold text-primary mb-2">Available to All Partners</p>
                <p className="text-sm text-muted-foreground">Partner Pro can be purchased at any rank. You'll automatically receive 45% commission on all sales, regardless of your current rank.</p>
              </div>
              <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                <p className="text-sm font-semibold text-accent mb-2">Starting Commission: 45%</p>
                <p className="text-sm text-muted-foreground">Base commission on all automations. Future commissions (high-ticket exclusives) can go up to 50%. You'll continue through normal rank progression while maintaining your 45% commission rate.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Core Value Pillars */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
              Core Value Pillars
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Five foundational pillars that transform how you operate as a partner
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {corePillars.map((pillar, index) => (
              <Card key={index} className="bg-card border-border hover:border-primary/30 transition-all">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-3">
                    {pillar.icon}
                  </div>
                  <CardTitle className="text-xl">{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">{pillar.description}</p>
                  <p className="text-xs text-primary font-medium">Examples: {pillar.examples}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto max-w-6xl px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      </div>

      {/* Features by Category - Using Dividers */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
              Features by Category
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to operate as your own automation agency
            </p>
          </div>

          <div className="space-y-16">
            {/* Automation Access */}
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Rocket className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary">Automation Access</h3>
                  <p className="text-muted-foreground">Premium automations and early access</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">50+ Premium Automations</h4>
                      <p className="text-sm text-muted-foreground">High-value systems (Lead-to-CRM Pipelines, AI Follow-up Agents, Advanced Reporting Bots)</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Early Access to New Drops</h4>
                      <p className="text-sm text-muted-foreground">Partner Pro sees new automations 2 weeks before Standard partners</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Automation Catalog Filters</h4>
                      <p className="text-sm text-muted-foreground">"High-Ticket Only", "Recurring Revenue Strong", "Enterprise-Grade"</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Direct Admin Assignment Requests</h4>
                      <p className="text-sm text-muted-foreground">Can request unlisted automations for enterprise clients</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

            {/* Client Management Upgrades */}
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary">Client Management Upgrades</h3>
                  <p className="text-muted-foreground">Professional client management tools</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Custom Client Pages</h4>
                      <p className="text-sm text-muted-foreground">Automatically generated branded portal for each client showing their active automations, billing, and status</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Client Analytics Dashboard</h4>
                      <p className="text-sm text-muted-foreground">KPIs: uptime, automation ROI, ticket resolution time</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">White-Label Branding</h4>
                      <p className="text-sm text-muted-foreground">Upload logo, custom color theme, and sub-domain (yourbrand.vaultnet.work)</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Client CRM Sync</h4>
                      <p className="text-sm text-muted-foreground">Connect their portal to HubSpot / Pipedrive via API</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

            {/* Training & Guides */}
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary">Training & Guides</h3>
                  <p className="text-muted-foreground">Advanced education and resources</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Vault Pro Academy</h4>
                      <p className="text-sm text-muted-foreground">Advanced course library (videos + text) inside dashboard</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Sales Mastery Module</h4>
                      <p className="text-sm text-muted-foreground">How to close retainer clients, negotiate high-ticket deals</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Automation Architecture Guides</h4>
                      <p className="text-sm text-muted-foreground">Building multi-automation bundles for a single client</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Industry Playbooks</h4>
                      <p className="text-sm text-muted-foreground">Pre-built sales scripts & outreach templates by niche (e.g., Cleaning Services, Agencies, E-Commerce)</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Monthly Master Drops</h4>
                      <p className="text-sm text-muted-foreground">New guide or case study added monthly (XP + recognition)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

            {/* Revenue & Commission */}
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary">Revenue & Commission</h3>
                  <p className="text-muted-foreground">Maximize your earnings potential</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">45% Base Commission</h4>
                      <p className="text-sm text-muted-foreground">Automatic on upgrade; no XP needed</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">50% Elite Commission</h4>
                      <p className="text-sm text-muted-foreground">Unlock after 3 consecutive sales months or £5k sales threshold</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">High-Ticket Setup Bonuses</h4>
                      <p className="text-sm text-muted-foreground">One-time £50–£150 bonuses on select automations</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Recurring Retainer Split Tracking</h4>
                      <p className="text-sm text-muted-foreground">Dashboard shows recurring vs setup earnings</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

            {/* Support & Recognition */}
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Headphones className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary">Support & Recognition</h3>
                  <p className="text-muted-foreground">Priority support and exclusive recognition</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Priority Support</h4>
                      <p className="text-sm text-muted-foreground">Direct chat with Vault Team (separate support queue)</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Private Partner Pro Feed</h4>
                      <p className="text-sm text-muted-foreground">Announcement area for new automations and case studies</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Feature Spotlights</h4>
                      <p className="text-sm text-muted-foreground">"Partner of the Month" showcased on homepage & community</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Certificate & Badge</h4>
                      <p className="text-sm text-muted-foreground">Downloadable certificate + dashboard badge ("Partner Pro Certified")</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Private Feedback Form</h4>
                      <p className="text-sm text-muted-foreground">Suggest automations or features directly to Vault core team</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* XP & Progression */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl text-primary flex items-center gap-2">
                <Star className="w-6 h-6" />
                XP & Progression Continuity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                XP continues to accumulate normally (no reset). Partners can still earn XP for:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Closing sales (+2000 XP)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Case studies (+1000 XP)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Training completions (+300 XP each)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Client satisfaction surveys (+500 XP)</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm font-semibold text-primary">Weekly XP cap increases to 3000 for Partner Pro</p>
                <p className="text-xs text-muted-foreground mt-1">Cosmetic rewards continue (themes, gold borders, etc.)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Summary */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
              Partner Pro Benefits Overview
            </h2>
          </div>
          
          <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">45% Commission</h3>
                    <p className="text-sm text-muted-foreground">On all sales, with potential to reach 50%</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">50+ Premium Automations</h3>
                    <p className="text-sm text-muted-foreground">High-ticket, business-grade systems</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Vault Pro Academy</h3>
                    <p className="text-sm text-muted-foreground">Advanced training library with videos & guides</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Client Management Portals</h3>
                    <p className="text-sm text-muted-foreground">Personalized branded portals for each client</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">White-Label Branding</h3>
                    <p className="text-sm text-muted-foreground">Logo, colors, and custom sub-domain</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Priority Support</h3>
                    <p className="text-sm text-muted-foreground">Direct chat with Vault Team</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Partner Pro Badge</h3>
                    <p className="text-sm text-muted-foreground">Certification and dashboard badge</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Early Access</h3>
                    <p className="text-sm text-muted-foreground">New automations 2 weeks before Standard partners</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30">
            <CardContent className="p-12">
              <Lock className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
                Become a Vault Partner Pro
              </h2>
              <p className="text-lg text-muted-foreground mb-2 max-w-2xl mx-auto">
                Upgrade your toolkit, earn more, and manage clients like an agency.
              </p>
              <p className="text-base text-muted-foreground mb-8 max-w-xl mx-auto">
                Partner Pro = more earnings, more automations, more authority. Once you subscribe, you unlock the tools to operate as your own mini-automation agency.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 gold-border-glow"
                  onClick={() => navigate('/partner-dashboard')}
                >
                  Upgrade to Partner Pro - $24.99/month
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary/50 text-foreground hover:bg-primary/10 font-semibold px-8 py-6"
                  onClick={() => navigate('/partner-dashboard')}
                >
                  Back to Dashboard
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Cancel anytime • No long-term commitment • Automatic upgrade once payment confirmed
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PartnerPro;
