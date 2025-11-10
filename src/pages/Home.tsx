import { ArrowRight, Users, TrendingUp, Briefcase, Sparkles, Shield, Rocket, Target, Award, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal to-vault-black"></div>
        
        {/* Gold glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-vault-gold opacity-10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-vault-blue opacity-5 blur-[120px] rounded-full"></div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 text-center py-20">
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

      {/* Who It's For Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Gradient transition from hero */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal/50 to-vault-charcoal"></div>
        {/* Subtle divider line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        <div className="container mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-16 text-primary gold-glow">
            Who It's For
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Learners Card */}
            <Card className="bg-card border-border hover:border-primary/50 transition-all p-8 group cursor-pointer">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">Learners</h3>
              <p className="text-muted-foreground mb-6">
                Learn to build and understand automations that create income.
              </p>
              <Button 
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50"
                onClick={() => window.open('https://discord.gg/ECNXpWjw9A', '_blank')}
              >
                Join Community
              </Button>
            </Card>

            {/* Sellers Card */}
            <Card className="bg-card border-border hover:border-primary/50 transition-all p-8 group cursor-pointer">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">Sellers</h3>
              <p className="text-muted-foreground mb-6">
                Sell prebuilt automations and manage clients with your own dashboard.
              </p>
              <Button 
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50"
                onClick={() => window.location.href = '/partners'}
              >
                Apply as Partner
              </Button>
            </Card>

            {/* Businesses Card */}
            <Card className="bg-card border-border hover:border-primary/50 transition-all p-8 group cursor-pointer">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">Businesses</h3>
              <p className="text-muted-foreground mb-6">
                Automate your workflows with ready-made or custom systems.
              </p>
              <Button 
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50"
                onClick={() => window.location.href = '/for-businesses'}
              >
                Get Started
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Smooth gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-charcoal via-vault-charcoal/80 to-vault-black"></div>
        {/* Subtle divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-primary gold-glow">
            Our Mission
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            To make AI and automation accessible, understandable, and profitable for everyone — from individual creators to global businesses.
          </p>
        </div>
      </section>

      {/* Why Choose Vault */}
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Smooth gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-charcoal via-vault-black/90 to-vault-black"></div>
        {/* Subtle divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-16 text-primary gold-glow">
            Why Choose The Vault Network?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Smooth gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal/50 to-vault-charcoal"></div>
        {/* Subtle divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-4 text-primary gold-glow">
            Success Stories
          </h2>
          <p className="text-xl text-center text-muted-foreground mb-16">
            Real results from real businesses
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

      {/* How It Works */}
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Smooth gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-charcoal via-vault-charcoal/80 to-vault-black"></div>
        {/* Subtle divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
        <div className="container mx-auto max-w-4xl relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-16 text-primary gold-glow">
            How It Works
          </h2>

          <div className="space-y-12">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0 font-bold text-primary-foreground">
                1
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Join The Community</h3>
                <p className="text-muted-foreground">
                  Start with our free Discord community. Get access to 30+ free automation templates, daily workshops, and connect with 3,000+ members.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0 font-bold text-primary-foreground">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Learn & Build</h3>
                <p className="text-muted-foreground">
                  Follow our structured learning path. Master no-code tools like Make, Zapier, and AI platforms. Build your first automation in days.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0 font-bold text-primary-foreground">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Deploy or Sell</h3>
                <p className="text-muted-foreground">
                  Use automations in your own business or become a partner. Sell prebuilt systems to clients and earn recurring income.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0 font-bold text-primary-foreground">
                4
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Scale & Grow</h3>
                <p className="text-muted-foreground">
                  As you grow, access advanced training, premium templates, and exclusive partnership opportunities. Build a sustainable automation business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Smooth gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal/50 to-vault-charcoal"></div>
        {/* Subtle divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl font-bold text-primary gold-glow mb-2">3,000+</div>
              <div className="text-muted-foreground">Active Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary gold-glow mb-2">30+</div>
              <div className="text-muted-foreground">Free Templates</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary gold-glow mb-2">24/7</div>
              <div className="text-muted-foreground">Community Support</div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 gold-border-glow"
              onClick={() => window.open('https://discord.gg/ECNXpWjw9A', '_blank')}
            >
              Join The Vault Community Free
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Smooth gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-charcoal via-vault-black/90 to-vault-black"></div>
        {/* Subtle divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-primary gold-glow">
            Ready to Automate Your Future?
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Join thousands of entrepreneurs, businesses, and automation specialists building the future with AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 gold-border-glow"
              onClick={() => window.open('https://discord.gg/ECNXpWjw9A', '_blank')}
            >
              Start Learning Free
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-primary/50 text-foreground hover:bg-primary/10 font-semibold px-8 py-6"
              onClick={() => window.location.href = '/partners'}
            >
              Become a Partner
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
