import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, DollarSign, Users, Zap, Target, ArrowRight, CheckCircle2, MessageSquare, BarChart3, Rocket, Shield, TrendingUp, Download, Settings, Award, Star, Clock, Sparkles } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const CommunityPage = () => {
  usePageMeta({
    title: "Community - Learn & Build Automations | The Vault Network",
    description: "Join our community of 3,000+ automation builders. Access free templates, daily workshops, step-by-step tutorials, and expert support. Learn automation from zero to expert and start selling your own automations.",
    ogTitle: "Community - Learn & Build Automations | The Vault Network",
    ogDescription: "Join our community of 3,000+ automation builders. Access free templates, daily workshops, step-by-step tutorials, and expert support.",
    ogUrl: "https://vaultnet.work/community",
  });
  const learnerPath = [
    {
      icon: BookOpen,
      title: "Start Here",
      description: "Get oriented with our welcome guide and community rules"
    },
    {
      icon: Zap,
      title: "Vault Lessons",
      description: "Step-by-step automation tutorials and walkthroughs"
    },
    {
      icon: MessageSquare,
      title: "Lesson Discussion",
      description: "Ask questions and share insights with fellow learners"
    },
    {
      icon: Rocket,
      title: "Automation Showcase",
      description: "See what others have built and get inspired"
    },
    {
      icon: Shield,
      title: "Resources & Help",
      description: "Access templates, guides, and get support when stuck"
    },
    {
      icon: Target,
      title: "Level Up",
      description: "Advanced techniques and optimization strategies"
    }
  ];

  const sellerPath = [
    {
      icon: BookOpen,
      title: "Getting Started",
      description: "Partner onboarding and platform introduction"
    },
    {
      icon: BarChart3,
      title: "Available Automations",
      description: "Browse ready-to-sell automation solutions"
    },
    {
      icon: MessageSquare,
      title: "Sales Scripts",
      description: "Proven scripts and templates for closing deals"
    },
    {
      icon: TrendingUp,
      title: "Deal Tracking",
      description: "Share wins, get feedback, and learn from successful sales"
    },
    {
      icon: Shield,
      title: "Partner Support",
      description: "Get help with client issues and technical questions"
    },
    {
      icon: Rocket,
      title: "Vault Updates",
      description: "New automations, features, and platform announcements"
    }
  ];

  const learnerModules = [
    {
      icon: BookOpen,
      title: "Learn",
      description: "Understand what automation is and why it matters for your business and life.",
      step: 1
    },
    {
      icon: Download,
      title: "Import",
      description: "Bring working templates into your own workspace with one click.",
      step: 2
    },
    {
      icon: Settings,
      title: "Modify",
      description: "Customize automations to fit your specific goals and needs.",
      step: 3
    },
    {
      icon: Rocket,
      title: "Deploy",
      description: "Connect them to real business use cases and watch them work.",
      step: 4
    },
    {
      icon: Target,
      title: "Master",
      description: "Build advanced automations and optimize for maximum efficiency.",
      step: 5
    }
  ];

  const sellerModules = [
    {
      icon: BookOpen,
      title: "Get Approved",
      description: "Apply as a partner and get access to the seller dashboard and tools.",
      step: 1
    },
    {
      icon: BarChart3,
      title: "Browse Catalog",
      description: "Explore available automations you can sell to businesses.",
      step: 2
    },
    {
      icon: MessageSquare,
      title: "Learn Sales",
      description: "Master sales scripts, objection handling, and closing techniques.",
      step: 3
    },
    {
      icon: Rocket,
      title: "Close Deals",
      description: "Connect with businesses and sell automation solutions.",
      step: 4
    },
    {
      icon: TrendingUp,
      title: "Scale Income",
      description: "Build recurring revenue streams and grow your partner business.",
      step: 5
    }
  ];

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
            Vault Learning Hub
          </h1>
          
          <p className="text-xl md:text-2xl mb-4 max-w-4xl mx-auto text-foreground font-medium">
            Master AI Automation & Build Your Future
          </p>
          
          <p className="text-lg mb-8 max-w-3xl mx-auto text-muted-foreground">
            Choose your path: Learn automation from scratch, or sell proven solutions to businesses. Both paths start free in our Discord community.
          </p>
          
          <div className="mt-8">
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 gold-border-glow transition-smooth group"
              onClick={() => window.open('https://discord.gg/ECNXpWjw9A', '_blank')}
            >
              Join Discord Community
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Choose Your Path Section */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal/50 to-vault-charcoal"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto relative z-10 pt-6 md:pt-12">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-primary gold-glow">
              Choose Your Path
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              React in Discord to unlock your path. Each path has its own channels, resources, and trajectory.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Learner Path */}
            <Card className="bg-card border-border hover:border-primary/50 transition-all p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Learner Path</h3>
                    <p className="text-sm text-muted-foreground">Master automation from zero</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">
                  Start your automation journey with step-by-step lessons, templates, and community support. Build your skills and eventually become a partner.
                </p>
                <div className="space-y-3 mb-6">
                  {learnerPath.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-foreground text-sm">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50"
                  onClick={() => window.open('https://discord.gg/ECNXpWjw9A', '_blank')}
                >
                  Join as Learner
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>

            {/* Seller Path */}
            <Card className="bg-card border-border hover:border-primary/50 transition-all p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Seller Path</h3>
                    <p className="text-sm text-muted-foreground">Sell automations & earn income</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">
                  Access ready-to-sell automation solutions, sales training, and partner support. Build recurring income by connecting businesses with automations.
                </p>
                <div className="space-y-3 mb-6">
                  {sellerPath.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-foreground text-sm">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50"
                  onClick={() => window.open('https://discord.gg/ECNXpWjw9A', '_blank')}
                >
                  Join as Seller
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Learning Paths Side by Side */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-charcoal via-vault-charcoal/80 to-vault-black"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto relative z-10 pt-6 md:pt-12">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-primary gold-glow">
              Your Journey
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose your path and follow the steps to build your automation future.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
            {/* Learner Path */}
            <div>
              <div className="text-center mb-6 md:mb-8">
                <h3 className="text-2xl md:text-3xl font-display font-bold mb-3 text-primary gold-glow">
                  Learner Path
                </h3>
                <p className="text-muted-foreground text-sm">
                  A structured progression from complete beginner to automation expert. Once you master automations, you can submit them for sale and earn commission.
                </p>
              </div>
              
              <div className="relative">
                {/* Vertical connecting line */}
                <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary/50 to-primary/20"></div>
                
                <div className="space-y-4 md:space-y-6">
                  {learnerModules.map((module, index) => (
                    <div key={index} className="relative flex items-start gap-4 group">
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-16 h-16 bg-card border-2 border-border rounded-full flex items-center justify-center group-hover:border-primary transition-smooth group-hover:gold-border-glow">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
                            <module.icon className="w-6 h-6 text-primary" />
                          </div>
                        </div>
                        {/* Step number */}
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                          {module.step}
                        </div>
                      </div>
                      
                      <div className="flex-1 pt-2">
                        <h4 className="text-lg font-bold mb-1 text-foreground">{module.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{module.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Seller Path */}
            <div>
              <div className="text-center mb-8">
                <h3 className="text-2xl md:text-3xl font-display font-bold mb-3 text-primary gold-glow">
                  Seller Path
                </h3>
                <p className="text-muted-foreground text-sm">
                  From partner approval to scaling your automation sales business. Follow these steps to build recurring income.
                </p>
              </div>
              
              <div className="relative">
                {/* Vertical connecting line */}
                <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary/50 to-primary/20"></div>
                
                <div className="space-y-4 md:space-y-6">
                  {sellerModules.map((module, index) => (
                    <div key={index} className="relative flex items-start gap-4 group">
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-16 h-16 bg-card border-2 border-border rounded-full flex items-center justify-center group-hover:border-primary transition-smooth group-hover:gold-border-glow">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
                            <module.icon className="w-6 h-6 text-primary" />
                          </div>
                        </div>
                        {/* Step number */}
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                          {module.step}
                        </div>
                      </div>
                      
                      <div className="flex-1 pt-2">
                        <h4 className="text-lg font-bold mb-1 text-foreground">{module.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{module.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-charcoal via-vault-charcoal/80 to-vault-black"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto relative z-10 pt-6 md:pt-12">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-primary gold-glow">
              What Members Say
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real stories from learners and sellers building their automation future.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="bg-card border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground mb-4 italic">
                "I went from zero automation knowledge to building my first workflow in 3 days. The step-by-step lessons made it so easy."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Alex M.</div>
                  <div className="text-xs text-muted-foreground">Learner Path</div>
                </div>
              </div>
            </Card>

            <Card className="bg-card border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground mb-4 italic">
                "As a seller, I've closed 15+ deals in 4 months. The sales scripts and partner support made all the difference."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Jordan K.</div>
                  <div className="text-xs text-muted-foreground">Seller Path</div>
                </div>
              </div>
            </Card>

            <Card className="bg-card border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground mb-4 italic">
                "The community is incredibly supportive. Every question gets answered, and the daily workshops are gold."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Sam T.</div>
                  <div className="text-xs text-muted-foreground">Learner Path</div>
                </div>
              </div>
            </Card>

            <Card className="bg-card border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground mb-4 italic">
                "Started as a learner, became a partner, now earning $5K+ monthly. The path is clear and the support is unmatched."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Casey R.</div>
                  <div className="text-xs text-muted-foreground">Learner → Seller</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal/50 to-vault-charcoal"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10 pt-6 md:pt-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-primary gold-glow">
            Our Mission
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-6">
            To make AI and automation <span className="text-primary font-semibold">accessible, understandable, and profitable</span> for everyone — 
            turning everyday individuals into digital builders who can automate their work and create new income streams.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-12">
            <Card className="bg-card border-border p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Knowledge That Earns</h3>
              <p className="text-sm text-muted-foreground">Every workflow and automation shared has tangible business value.</p>
            </Card>
            <Card className="bg-card border-border p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Freedom Through Systems</h3>
              <p className="text-sm text-muted-foreground">Saving time through automation is the key to scaling freedom.</p>
            </Card>
            <Card className="bg-card border-border p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Network Over Isolation</h3>
              <p className="text-sm text-muted-foreground">Learning happens faster inside a supportive community.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Path Comparison */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-charcoal via-vault-charcoal/80 to-vault-black"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto relative z-10 pt-6 md:pt-12">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-primary gold-glow">
              Which Path Is Right For You?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Both paths are free to start. Choose based on your goals and current experience level.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="bg-card border-border p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Start as a Learner</h3>
                    <p className="text-sm text-muted-foreground">Perfect if you're new to automation</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-foreground">No experience needed</div>
                      <div className="text-sm text-muted-foreground">Start from absolute zero</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-foreground">Build skills first</div>
                      <div className="text-sm text-muted-foreground">Learn before you earn</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-foreground">Can become a seller later</div>
                      <div className="text-sm text-muted-foreground">Upgrade path available</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-card border-border p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Start as a Seller</h3>
                    <p className="text-sm text-muted-foreground">Perfect if you want to earn now</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-foreground">Sales experience helps</div>
                      <div className="text-sm text-muted-foreground">But not required</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-foreground">Earn from day one</div>
                      <div className="text-sm text-muted-foreground">Start selling immediately</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-foreground">Full partner support</div>
                      <div className="text-sm text-muted-foreground">Training and resources included</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal/50 to-vault-black"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10 pt-6 md:pt-12">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-primary gold-glow">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 md:mb-12">
            Join our Discord community free. Choose your path when you arrive and unlock the resources you need.
          </p>
          <Button 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 gold-border-glow"
            onClick={() => window.open('https://discord.gg/ECNXpWjw9A', '_blank')}
          >
            Join Discord Community Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CommunityPage;
