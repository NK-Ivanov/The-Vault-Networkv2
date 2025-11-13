import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, DollarSign, Users, TrendingUp, Link as LinkIcon, BarChart3, Zap, Shield, Clock, Target, Award, Building2, ArrowRight, MessageCircle, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { usePageMeta } from "@/hooks/usePageMeta";

// Contact information for partner applications
const CONTACT_INFO = {
  whatsapp: "+44 XXXXX", // Update with actual WhatsApp number
  discordChannel: "#partner-applications", // Update with actual Discord channel name
};

const Partners = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasApplication, setHasApplication] = useState(false);
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);

  usePageMeta({
    title: "Become a Partner - The Vault Network",
    description: "Join The Vault Network as a partner and earn recurring commissions by selling proven AI automations. Get your own dashboard, referral links, and competitive commission rates. Build a sustainable automation business.",
    ogTitle: "Become a Partner - The Vault Network",
    ogDescription: "Join The Vault Network as a partner and earn recurring commissions by selling proven AI automations. Get your own dashboard, referral links, and competitive commission rates.",
    ogUrl: "https://vaultnet.work/partners",
  });

  const [name, setName] = useState("");
  const [isBusiness, setIsBusiness] = useState(false);
  const [website, setWebsite] = useState("");
  const [about, setAbout] = useState("");
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Check for referral code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      // Store in localStorage for later use
      localStorage.setItem("partner_referral_code", ref);
    } else {
      // Check localStorage for saved referral code
      const savedRef = localStorage.getItem("partner_referral_code");
      if (savedRef) {
        setReferralCode(savedRef);
      }
    }
  }, []);

  useEffect(() => {
    if (shouldAutoSubmit && user && !hasApplication && name && about) {
      // Auto-submit the form after data is restored
      const timer = setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSubmit(fakeEvent);
        setShouldAutoSubmit(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoSubmit, user, hasApplication, name, about]);

  useEffect(() => {
    if (user) {
      checkExistingApplication();
      // Check for saved form data and restore it
      const savedForm = localStorage.getItem("pending_partner_form");
      if (savedForm && !hasApplication) {
        try {
          const formData = JSON.parse(savedForm);
          setName(formData.name || "");
          setIsBusiness(formData.isBusiness || false);
          setWebsite(formData.website || "");
          setAbout(formData.about || "");
          // Set flag to auto-submit after form data is restored
          setShouldAutoSubmit(true);
        } catch (error) {
          console.error("Error restoring form data:", error);
        }
      }
    }
  }, [user, hasApplication]);

  const checkExistingApplication = async () => {
    try {
      const { data, error } = await supabase
        .from("sellers")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (data) {
        setHasApplication(true);
      }
    } catch (error) {
      console.error("Error checking application:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to apply as a partner.",
        variant: "destructive",
      });
      // Save form data to localStorage before redirecting
      localStorage.setItem("pending_partner_form", JSON.stringify({
        name,
        isBusiness,
        website,
        about,
      }));
      navigate("/login?redirect=/partners");
      return;
    }

    if (hasApplication) {
      navigate("/partner-dashboard");
      return;
    }

    setLoading(true);

    try {
      // Generate a unique referral code
      const newReferralCode = `REF-${user.id.substring(0, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      // Look up referrer if referral code exists
      let referredBySellerId: string | null = null;
      if (referralCode) {
        const { data: referrerSeller, error: referrerError } = await supabase
          .from("sellers")
          .select("id, referral_code, status")
          .eq("referral_code", referralCode)
          .eq("status", "approved")
          .maybeSingle();
        
        if (referrerError) {
          console.error("Error looking up referrer:", referrerError);
        }
        
        if (referrerSeller) {
          referredBySellerId = referrerSeller.id;
        }
      }
      
      const { data: newSeller, error } = await supabase.from("sellers").insert({
        user_id: user.id,
        business_name: name,
        website: website || null,
        about: about,
        status: "pending",
        referral_code: newReferralCode,
        referred_by_seller_id: referredBySellerId,
      }).select().single();

      if (error) throw error;

      // XP will be awarded automatically via trigger when partner is approved
      // No need to call award function here - it happens when status changes to 'approved'

      // Assign seller role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: "seller",
      }).select();

      if (roleError) {
        console.error("Error assigning seller role:", roleError);
        // Continue anyway - role might already exist
      }

      // Clear saved form data and referral code
      localStorage.removeItem("pending_partner_form");
      localStorage.removeItem("partner_referral_code");

      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you soon.",
      });

      // Show success dialog with contact instructions
      setTimeout(() => {
        navigate("/partner-dashboard");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Application failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: DollarSign,
      title: "Competitive Commission Rates",
      description: "Earn competitive commission rates on every sale. Rates vary by automation, with opportunities for custom rates based on performance and volume."
    },
    {
      icon: Users,
      title: "Dedicated Partner Dashboard",
      description: "Manage your entire client portfolio, track real-time earnings, view transaction history, and monitor your performance metrics all in one powerful dashboard."
    },
    {
      icon: TrendingUp,
      title: "Recurring Revenue Stream",
      description: "Build a sustainable income stream with recurring monthly commissions. Every client you bring in generates ongoing revenue, not just one-time payments."
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Access detailed analytics and insights about your sales performance, client engagement, and earnings trends to optimize your strategy."
    },
    {
      icon: Zap,
      title: "Instant Access to Products",
      description: "Get immediate access to our entire catalog of prebuilt automation systems. No need to develop products yourself - sell proven solutions."
    },
    {
      icon: Shield,
      title: "Full Support System",
      description: "Benefit from our comprehensive support infrastructure. We handle technical support, so you can focus on building relationships and closing deals."
    }
  ];

  const opportunityPoints = [
    {
      icon: Target,
      title: "Massive Market Opportunity",
      description: "Businesses are actively seeking automation solutions to reduce costs and increase efficiency. The automation market is growing exponentially, creating unprecedented opportunities for partners who can connect businesses with the right solutions."
    },
    {
      icon: Building2,
      title: "Zero Technical Overhead",
      description: "You don't need to be a developer or technical expert. Our platform provides everything you need - products, infrastructure, and support. Your role is to identify opportunities and build relationships with businesses that need automation."
    },
    {
      icon: Clock,
      title: "Scalable Business Model",
      description: "Start small and scale as you grow. Whether you're bringing in one client or hundreds, the system scales with you. Each new client adds to your recurring revenue base, creating compound growth over time."
    },
    {
      icon: Award,
      title: "Recognition & Rewards",
      description: "Compete on our partner leaderboard and earn recognition for top performance. Top partners receive additional benefits, custom commission rates, and exclusive opportunities."
    }
  ];

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
          <div className="text-center mb-20">
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in gold-glow text-primary uppercase tracking-tight">
              Become a Vault Partner
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl mb-6 max-w-4xl mx-auto text-foreground font-medium">
              Transform your network into a recurring revenue engine. Sell proven automation solutions to businesses and build a sustainable income stream.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Join a select group of partners who are capitalizing on the automation revolution. No technical skills required - just the ability to connect businesses with solutions that transform their operations.
            </p>
            <div className="mt-8">
              <Button
                onClick={() => {
                  const formElement = document.getElementById('partner-form');
                  if (formElement) {
                    formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 gold-border-glow transition-smooth group"
              >
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner Section - Custom Design */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal/50 to-vault-charcoal"></div>
        {/* Gold divider top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        {/* Gold divider bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto relative z-10 pt-6 md:pt-12 pb-6 md:pb-12">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-primary gold-glow">
              Why Become a Vault Partner?
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              The automation market is exploding. Businesses are desperate for solutions that save time and money. As a Vault Partner, you're positioned at the intersection of demand and supply, with everything you need to succeed.
            </p>
          </div>

          {/* Custom Visual Layout */}
          <div className="max-w-6xl mx-auto">
            {/* Center connecting line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary/50 to-primary/20 transform -translate-x-1/2"></div>
            
            <div className="space-y-8 md:space-y-12">
              {opportunityPoints.map((point, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div 
                    key={index} 
                    className={`relative flex flex-col lg:flex-row items-center gap-6 md:gap-8 ${
                      isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                    }`}
                  >
                    {/* Content Side */}
                    <div className={`flex-1 ${isEven ? 'lg:text-right lg:pr-8' : 'lg:text-left lg:pl-8'}`}>
                      <div className="inline-block">
                        <div className={`flex items-center gap-3 md:gap-4 mb-3 md:mb-4 ${isEven ? 'lg:justify-end' : 'lg:justify-start'}`}>
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/30 group-hover:border-primary transition-all relative">
                            <point.icon className="w-8 h-8 text-primary" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                              {index + 1}
                            </div>
                          </div>
                          <h3 className="text-2xl font-bold text-foreground">{point.title}</h3>
                        </div>
                        <p className="text-muted-foreground leading-relaxed max-w-lg lg:max-w-none">
                          {point.description}
                        </p>
                      </div>
                    </div>

                    {/* Center Icon/Connector */}
                    <div className="relative flex-shrink-0">
                      <div className="w-20 h-20 bg-card border-2 border-primary/50 rounded-full flex items-center justify-center relative z-10 group hover:border-primary transition-all hover:gold-border-glow">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-all">
                          <point.icon className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      {/* Connecting lines to center */}
                      <div className={`hidden lg:block absolute top-1/2 w-1/2 h-0.5 bg-gradient-to-r ${
                        isEven ? 'left-0 from-primary/20 to-primary/50' : 'right-0 from-primary/50 to-primary/20'
                      }`} style={{ top: '50%' }}></div>
                    </div>

                    {/* Visual Element Side */}
                    <div className={`flex-1 ${isEven ? 'lg:text-left lg:pl-8' : 'lg:text-right lg:pr-8'}`}>
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl"></div>
                        <div className="relative bg-card/50 border border-primary/20 rounded-2xl p-6 backdrop-blur-sm">
                          {index === 0 && (
                            <div className="text-center">
                              <div className="text-4xl font-bold text-primary gold-glow mb-2">$50B+</div>
                              <div className="text-sm text-muted-foreground">Automation Market Size</div>
                            </div>
                          )}
                          {index === 1 && (
                            <div className="text-center">
                              <div className="text-4xl font-bold text-primary gold-glow mb-2">0%</div>
                              <div className="text-sm text-muted-foreground">Technical Skills Required</div>
                            </div>
                          )}
                          {index === 2 && (
                            <div className="text-center">
                              <div className="text-4xl font-bold text-primary gold-glow mb-2">∞</div>
                              <div className="text-sm text-muted-foreground">Scalability Potential</div>
                            </div>
                          )}
                          {index === 3 && (
                            <div className="text-center">
                              <div className="text-4xl font-bold text-primary gold-glow mb-2">#1</div>
                              <div className="text-sm text-muted-foreground">Partner Leaderboard</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-charcoal via-vault-charcoal/80 to-vault-black"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto relative z-10 pt-6 md:pt-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary gold-glow">
            What You Get as a Partner
          </h2>
          <p className="text-center text-lg text-muted-foreground mb-6 md:mb-12 max-w-3xl mx-auto">
            Everything you need to build a successful automation sales business, all in one platform.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all">
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                        <benefit.icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl text-foreground">{benefit.title}</CardTitle>
                      <CardDescription className="text-base leading-relaxed">{benefit.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal/50 to-vault-charcoal"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto relative z-10 pt-6 md:pt-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 md:mb-12 text-primary gold-glow">
            How It Works
          </h2>
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-foreground">Apply & Get Approved</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Submit your application with details about your background and how you plan to help businesses. Our team reviews applications quickly, typically within 24-48 hours.
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-foreground">Access Your Partner Dashboard</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Once approved, you'll receive instant access to your dedicated dashboard. Get your unique referral link, browse available automations, and access all partner resources.
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-foreground">Start Connecting Businesses</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Share your referral link with businesses that need automation. When they sign up and purchase, you earn commission. Every sale generates recurring monthly revenue.
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-foreground">Scale & Grow</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    As you bring in more clients, your recurring revenue grows. Track your performance, compete on the leaderboard, and unlock additional benefits as you scale your partner business.
                  </p>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-charcoal via-vault-black/90 to-vault-black"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto relative z-10 pt-6 md:pt-12">
          <Card className="max-w-5xl mx-auto mb-8 md:mb-16 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-primary gold-glow">
                Ready to Build Your Partner Business?
              </h2>
              <p className="text-lg md:text-xl text-foreground mb-8 max-w-2xl mx-auto">
                Join the automation revolution and start earning recurring income today. The opportunity is massive, the tools are ready, and the market is waiting.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <p className="text-muted-foreground text-sm md:text-base">
                  Apply now - approval typically takes 24-48 hours
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal/50 to-vault-charcoal"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto relative z-10 pt-6 md:pt-12">
          <Card id="partner-form" className="max-w-2xl mx-auto bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl text-primary gold-glow">Start Your Partner Journey</CardTitle>
              <CardDescription className="text-base">Complete the application below to begin. Tell us about yourself and your vision for helping businesses automate.</CardDescription>
            </CardHeader>
            <CardContent>
              {hasApplication ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-lg text-foreground mb-4">You already have an application!</p>
                  <Button onClick={() => navigate("/partner-dashboard")}>
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                    <Switch
                      id="is-business"
                      checked={isBusiness}
                      onCheckedChange={setIsBusiness}
                    />
                    <Label htmlFor="is-business" className="cursor-pointer">
                      {isBusiness ? "Registering as a Business" : "Registering as an Individual"}
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">{isBusiness ? "Business Name" : "Your Name"} *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={isBusiness ? "Your Company LLC" : "John Doe"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="about">Tell us about yourself *</Label>
                    <Textarea
                      id="about"
                      placeholder="Share your experience, why you want to be a partner, and how you plan to help businesses..."
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      required
                      rows={6}
                      className="bg-input border-border"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit Application"}
                  </Button>
                  
                  {/* Contact Information Section */}
                  <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm font-semibold text-foreground mb-3">
                      After submitting your application:
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Please contact us via Discord or WhatsApp to verify your application and join our partner community.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Discord</p>
                          <p className="text-sm text-muted-foreground">
                            Join our Discord server and create a ticket in the <span className="font-mono text-primary">{CONTACT_INFO.discordChannel}</span> channel
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            In your ticket, include: "I just applied to be a partner - [Your Name/Business Name]" or "Partner application verification - [Your Email]"
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">WhatsApp</p>
                          <p className="text-sm text-muted-foreground">
                            Message us at: <span className="font-mono text-primary">{CONTACT_INFO.whatsapp}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Send: "Partner application verification - [Your Name/Business Name] - [Your Email]"
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-primary/10">
                      <strong>Privacy Note:</strong> Only share your application name/business name and email address to verify your identity. We'll match it with your application.
                    </p>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Partners;
