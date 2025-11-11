import { ArrowRight, Users, TrendingUp, Briefcase, Sparkles, Shield, Rocket, Target, Award, Clock, Zap, DollarSign, BarChart3, CheckCircle2, Network, BookOpen, MessageSquare, Star, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-8">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal to-vault-black"></div>
        
        {/* Gold glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-vault-gold opacity-10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-vault-blue opacity-5 blur-[120px] rounded-full"></div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 text-center py-12">
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in gold-glow text-primary uppercase tracking-tight">
            Build. Automate. Grow. Together.
          </h1>
          
          <p className="text-xl md:text-2xl lg:text-3xl mb-4 max-w-5xl mx-auto animate-fade-in text-foreground font-medium">
            The Vault Network is where individuals learn automation, businesses find solutions, and sellers earn through innovation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in mt-12">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 gold-border-glow transition-smooth group"
              onClick={() => window.open('https://discord.gg/ECNXpWjw9A', '_blank')}
            >
              Join the Community
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary/50 text-foreground hover:bg-primary/10 font-semibold text-lg px-8 py-6 transition-smooth"
              onClick={() => window.location.href = '/partners'}
            >
              Become a Partner
            </Button>

            <Button 
              size="lg" 
              variant="outline"
              className="border-primary/50 text-foreground hover:bg-primary/10 font-semibold text-lg px-8 py-6 transition-smooth"
              onClick={() => window.location.href = '/for-businesses'}
            >
              For Businesses
            </Button>
          </div>
        </div>
      </section>

      {/* The Vault Network Ecosystem */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Gradient transition from hero */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal/50 to-vault-charcoal"></div>
        {/* Gold divider line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto relative z-10 pt-6 md:pt-12">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 md:mb-6 text-primary gold-glow">
              One Platform, Three Paths to Success
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Whether you're learning, selling, or automating — The Vault Network connects everyone in the automation economy.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto mb-8 md:mb-16">
            {/* Learners Card */}
            <Card className="bg-card border-border hover:border-primary/50 transition-all p-8 group cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Learn & Build</h3>
                <p className="text-muted-foreground mb-6">
                  Master automation with 30+ free templates, daily workshops, and a community of 3,000+ builders. Start your journey from zero to automation expert.
                </p>
                <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Free Discord access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>30+ automation templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Daily workshops & support</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50 group-hover:border-primary transition-all"
                  onClick={() => window.open('https://discord.gg/ECNXpWjw9A', '_blank')}
                >
                  Join Community Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>

            {/* Partners Card */}
            <Card className="bg-card border-border hover:border-primary/50 transition-all p-8 group cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Sell & Earn</h3>
                <p className="text-muted-foreground mb-6">
                  Become a Vault Partner and build recurring income by selling proven automations. Get your own dashboard, referral links, and competitive commissions.
                </p>
                <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Recurring commission income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Partner dashboard & tools</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Dedicated support & training</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50 group-hover:border-primary transition-all"
                  onClick={() => window.location.href = '/partners'}
                >
                  Apply as Partner
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>

            {/* Businesses Card */}
            <Card className="bg-card border-border hover:border-primary/50 transition-all p-8 group cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Automate & Scale</h3>
                <p className="text-muted-foreground mb-6">
                  Deploy battle-tested automation systems in days, not months. Save 20+ hours per week and scale without hiring.
                </p>
                <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Prebuilt automation solutions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>24/7 automated workflows</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Dedicated partner support</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50 group-hover:border-primary transition-all"
                  onClick={() => window.location.href = '/for-businesses'}
                >
                  Explore Solutions
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Smooth gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-charcoal via-vault-charcoal/80 to-vault-black"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 md:mb-6 text-primary gold-glow">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From learning to earning to automating — we've built the complete ecosystem for the automation economy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-card border-border hover:border-primary/50 transition-all p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Partner Dashboard</h3>
                  <p className="text-muted-foreground">
                    Track sales, commissions, clients, and performance metrics. Everything you need to manage your automation business.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-all p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Integrated Support</h3>
                  <p className="text-muted-foreground">
                    Built-in ticketing system connects clients, partners, and The Vault Network. Get help when you need it, fast.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-all p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Network className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Referral System</h3>
                  <p className="text-muted-foreground">
                    Unique referral codes for every partner. Track conversions, manage clients, and build your automation sales network.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-all p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Secure Payments</h3>
                  <p className="text-muted-foreground">
                    Stripe-powered checkout with automated commission tracking. Partners get paid automatically on every sale.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* The Network Effect */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Smooth gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal/50 to-vault-charcoal"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 md:mb-6 text-primary gold-glow">
                The Network Effect
              </h2>
              <p className="text-xl text-muted-foreground mb-4 md:mb-6 leading-relaxed">
                When learners become partners, and partners serve businesses, everyone wins. The Vault Network creates a self-sustaining ecosystem where success compounds.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <ArrowUpRight className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Learners Build Skills</h4>
                    <p className="text-muted-foreground">Master automation and join the partner program</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <ArrowUpRight className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Partners Earn Income</h4>
                    <p className="text-muted-foreground">Sell automations and build recurring revenue streams</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <ArrowUpRight className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Businesses Scale Faster</h4>
                    <p className="text-muted-foreground">Deploy proven solutions and accelerate growth</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <Card className="bg-card border-border p-8">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary gold-glow mb-2">3,000+</div>
                    <div className="text-muted-foreground">Active Community Members</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary mb-1">30+</div>
                      <div className="text-sm text-muted-foreground">Free Templates</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary mb-1">24/7</div>
                      <div className="text-sm text-muted-foreground">Support</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary mb-1">1/3</div>
                      <div className="text-sm text-muted-foreground">Days New Template</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary mb-1">100%</div>
                      <div className="text-sm text-muted-foreground">No-Code</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Vault */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Smooth gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-charcoal via-vault-black/90 to-vault-black"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-8 md:mb-16 text-primary gold-glow">
            Why Choose The Vault Network?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <Card className="bg-card border-border hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-foreground">No-Code First</CardTitle>
                <CardDescription>
                  Build powerful automations without writing a single line of code. Perfect for beginners and experts alike.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-foreground">Proven Systems</CardTitle>
                <CardDescription>
                  Access battle-tested automations used by hundreds of successful businesses worldwide.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Rocket className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-foreground">Fast Implementation</CardTitle>
                <CardDescription>
                  Get up and running in days, not months. Our automations are designed for rapid deployment.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-foreground">ROI Focused</CardTitle>
                <CardDescription>
                  Every automation is designed to save time and money. See results from day one.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-foreground">Expert Support</CardTitle>
                <CardDescription>
                  Learn from automation specialists and a thriving community of 3,000+ members.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-foreground">Constant Innovation</CardTitle>
                <CardDescription>
                  New automations released every 3 days. Stay ahead with cutting-edge AI tools.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Smooth gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal/50 to-vault-charcoal"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-4 text-primary gold-glow">
            Success Stories
          </h2>
          <p className="text-xl text-center text-muted-foreground mb-8 md:mb-16">
            Real results from real businesses
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <div className="text-3xl font-bold text-primary mb-2">10x</div>
                  <div className="text-sm text-muted-foreground">Faster Processing</div>
                </div>
                <p className="text-foreground mb-4">
                  "The Vault Network helped us automate our entire customer onboarding process. What used to take days now happens in hours."
                </p>
                <div className="text-sm text-muted-foreground">
                  - Sarah M., E-commerce Director
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <div className="text-3xl font-bold text-primary mb-2">$50K+</div>
                  <div className="text-sm text-muted-foreground">Monthly Savings</div>
                </div>
                <p className="text-foreground mb-4">
                  "We reduced our operational costs by over $50,000 per month by implementing Vault automations. ROI in the first month."
                </p>
                <div className="text-sm text-muted-foreground">
                  - Michael T., SaaS Founder
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <div className="text-3xl font-bold text-primary mb-2">20+</div>
                  <div className="text-sm text-muted-foreground">Clients Signed</div>
                </div>
                <p className="text-foreground mb-4">
                  "As a Vault partner, I've signed 20+ clients in 6 months. The automation templates make selling easy and implementation fast."
                </p>
                <div className="text-sm text-muted-foreground">
                  - James R., Automation Consultant
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Smooth gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-charcoal via-vault-black/90 to-vault-black"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-primary gold-glow">
            Ready to Automate Your Future?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 md:mb-12">
            Join thousands of entrepreneurs, businesses, and automation specialists building the future with AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 gold-border-glow"
              onClick={() => window.open('https://discord.gg/ECNXpWjw9A', '_blank')}
            >
              Join the Community
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-primary/50 text-foreground hover:bg-primary/10 font-semibold px-8 py-6"
              onClick={() => window.location.href = '/partners'}
            >
              Become a Partner
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-primary/50 text-foreground hover:bg-primary/10 font-semibold px-8 py-6"
              onClick={() => window.location.href = '/for-businesses'}
            >
              For Businesses
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
