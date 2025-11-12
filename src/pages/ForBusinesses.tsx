import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Clock, TrendingUp, Shield, Users, ArrowRight, CheckCircle, BarChart3, Target, Rocket } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const ForBusinesses = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [automations, setAutomations] = useState<any[]>([]);
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);

  usePageMeta({
    title: "For Businesses - Automate Your Operations | The Vault Network",
    description: "Discover proven AI automations to streamline your business operations. Reduce costs, increase efficiency, and scale your business with ready-to-deploy automation solutions. Get started today.",
    ogTitle: "For Businesses - Automate Your Operations | The Vault Network",
    ogDescription: "Discover proven AI automations to streamline your business operations. Reduce costs, increase efficiency, and scale your business with ready-to-deploy automation solutions.",
    ogUrl: "https://vaultnet.work/for-businesses",
  });
  
  // Get referral code from URL or localStorage
  const urlReferralCode = searchParams.get("ref");
  const storedReferralCode = localStorage.getItem("referral_code");
  const referralCode = urlReferralCode || storedReferralCode;
  
  // Debug: Log referral code extraction
  useEffect(() => {
    if (referralCode) {
      console.log("Referral code detected:", referralCode, "from URL:", !!urlReferralCode, "from storage:", !!storedReferralCode);
    }
  }, [referralCode, urlReferralCode, storedReferralCode]);

  // Save referral code to localStorage when it's in URL, or restore it in URL if only in localStorage
  useEffect(() => {
    if (urlReferralCode) {
      // Save URL referral code to localStorage
      localStorage.setItem("referral_code", urlReferralCode);
    } else if (storedReferralCode && !urlReferralCode) {
      // Restore referral code from localStorage to URL if not already in URL
      navigate(`/for-businesses?ref=${storedReferralCode}`, { replace: true });
    }
  }, [urlReferralCode, storedReferralCode, navigate]);

  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");

  const [enquiryBusinessName, setEnquiryBusinessName] = useState("");
  const [enquiryContactName, setEnquiryContactName] = useState("");
  const [enquiryEmail, setEnquiryEmail] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");

  useEffect(() => {
    if (shouldAutoSubmit && user && !hasAccount && businessName && contactName) {
      // Auto-submit the form after data is restored
      const timer = setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSignup(fakeEvent);
        setShouldAutoSubmit(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoSubmit, user, hasAccount, businessName, contactName]);

  useEffect(() => {
    fetchAutomations();
    if (user) {
      checkExistingAccount();
      // Check for saved form data and restore it
      const savedForm = localStorage.getItem("pending_business_form");
      if (savedForm && !hasAccount) {
        try {
          const formData = JSON.parse(savedForm);
          setBusinessName(formData.businessName || "");
          setContactName(formData.contactName || "");
          setIndustry(formData.industry || "");
          setDescription(formData.description || "");
          if (formData.referralCode) {
            localStorage.setItem("referral_code", formData.referralCode);
          }
          // Set flag to auto-submit after form data is restored
          setShouldAutoSubmit(true);
        } catch (error) {
          console.error("Error restoring form data:", error);
        }
      }
    }
  }, [user, hasAccount]);

  const fetchAutomations = async () => {
    try {
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAutomations(data || []);
    } catch (error: any) {
      console.error("Error fetching automations:", error);
    }
  };

  const checkExistingAccount = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (data) {
        setHasAccount(true);
      }
    } catch (error) {
      console.error("Error checking account:", error);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a business account.",
        variant: "destructive",
      });
      // Save form data to localStorage before redirecting
      localStorage.setItem("pending_business_form", JSON.stringify({
        businessName,
        contactName,
        industry,
        description,
        referralCode,
      }));
      // Preserve referral code when redirecting to login
      if (referralCode) {
        localStorage.setItem("referral_code", referralCode);
      }
      navigate("/login?redirect=/for-businesses");
      return;
    }

    if (hasAccount) {
      navigate("/client-dashboard");
      return;
    }

    setLoading(true);

    try {
      let sellerId = null;
      if (referralCode) {
        console.log("Looking up referral code:", referralCode);
        const { data: seller, error: sellerError } = await supabase
          .from("sellers")
          .select("id, referral_code, status")
          .eq("referral_code", referralCode)
          .eq("status", "approved")
          .maybeSingle();
        
        if (sellerError) {
          console.error("Error looking up seller:", sellerError);
        }
        
        if (seller) {
          console.log("Found seller:", seller);
          sellerId = seller.id;
        } else {
          console.log("No approved seller found with referral code:", referralCode);
        }
      } else {
        // No referral code - assign to "The Vault Network"
        console.log("No referral code provided, assigning to The Vault Network");
        const { data: vaultNetworkSeller, error: vaultError } = await supabase
          .from("sellers")
          .select("id")
          .eq("referral_code", "VAULT-NETWORK")
          .maybeSingle();
        
        if (vaultError) {
          console.error("Error looking up Vault Network seller:", vaultError);
        }
        
        if (vaultNetworkSeller) {
          sellerId = vaultNetworkSeller.id;
          console.log("Assigned to The Vault Network seller:", sellerId);
        } else {
          console.warn("Vault Network seller not found. Client will be created without seller_id.");
        }
      }

      console.log("Creating client with seller_id:", sellerId, "invited_by_code:", referralCode);

      const { error } = await supabase.from("clients").insert({
        user_id: user.id,
        business_name: businessName,
        contact_name: contactName,
        industry: industry || null,
        description: description || null,
        seller_id: sellerId,
        invited_by_code: referralCode || null,
        status: "active",
      });

      if (error) throw error;

      // Assign client role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: "client",
      }).select();

      if (roleError) {
        console.error("Error assigning client role:", roleError);
        // Continue anyway - role might already exist
      }

      // Clear saved form data
      localStorage.removeItem("pending_business_form");

      toast({
        title: "Account Created!",
        description: "Welcome to Vault Network. Explore our automations.",
      });

      // Don't clear referral code - keep it for future reference
      // The seller_id is now locked in the database

      navigate("/client-dashboard");
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("enquiries").insert({
        business_name: enquiryBusinessName,
        contact_name: enquiryContactName,
        email: enquiryEmail,
        phone: enquiryPhone || null,
        message: enquiryMessage,
        status: "new",
      });

      if (error) throw error;

      toast({
        title: "Enquiry Submitted!",
        description: "We'll get back to you within 24 hours.",
      });

      setEnquiryBusinessName("");
      setEnquiryContactName("");
      setEnquiryEmail("");
      setEnquiryPhone("");
      setEnquiryMessage("");
    } catch (error: any) {
      toast({
        title: "Enquiry failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: Clock,
      title: "Save 20+ Hours Per Week",
      description: "Automate repetitive tasks and free up your team to focus on high-value work that drives growth."
    },
    {
      icon: TrendingUp,
      title: "Scale Without Hiring",
      description: "Handle 10x more work with the same team. Automations work 24/7 without breaks, vacations, or sick days."
    },
    {
      icon: Shield,
      title: "Reduce Human Error",
      description: "Eliminate costly mistakes from manual processes. Our automations execute flawlessly every single time."
    },
    {
      icon: BarChart3,
      title: "Real-Time Insights",
      description: "Get instant visibility into your operations with automated reporting and analytics dashboards."
    },
    {
      icon: Zap,
      title: "Instant Deployment",
      description: "No months of development. Our prebuilt automations are ready to deploy in days, not months."
    },
    {
      icon: Users,
      title: "Dedicated Support",
      description: "Work with expert partners who understand your business and ensure your automations deliver results."
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Choose Your Automation",
      description: "Browse our library of proven automation solutions. Each one is battle-tested and ready to deploy."
    },
    {
      step: 2,
      title: "Quick Setup & Configuration",
      description: "Your dedicated partner handles the entire setup process. Connect your tools, configure workflows, and test everything."
    },
    {
      step: 3,
      title: "Go Live & Monitor",
      description: "Launch your automation and watch it work. Monitor performance through your dashboard and get real-time alerts."
    },
    {
      step: 4,
      title: "Scale & Optimize",
      description: "As your business grows, your automations scale with you. Continuous optimization ensures peak performance."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

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
              Transform Your Business with AI Automation
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl mb-6 max-w-4xl mx-auto text-foreground font-medium">
              Stop wasting time on repetitive tasks. Deploy proven automation systems that work 24/7 to scale your operations and drive growth.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Join hundreds of businesses that have automated their workflows, reduced costs, and accelerated growth with our battle-tested automation solutions.
            </p>
            {referralCode && (
              <Badge variant="secondary" className="text-lg py-2 px-4 mb-8">
                Invited by Partner: {referralCode}
              </Badge>
            )}
            <div className="mt-8">
              <Button
                onClick={() => {
                  const formElement = document.getElementById('business-form');
                  if (formElement) {
                    formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 gold-border-glow transition-smooth group"
              >
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Automate Section */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal/50 to-vault-charcoal"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto relative z-10 pt-6 md:pt-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary gold-glow">
            Why Automate Your Business?
          </h2>
          <p className="text-center text-lg text-muted-foreground mb-6 md:mb-12 max-w-3xl mx-auto">
            The businesses that automate today are the market leaders of tomorrow. Don't get left behind while your competitors scale effortlessly.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
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
        <div className="absolute inset-0 bg-gradient-to-b from-vault-charcoal via-vault-charcoal/80 to-vault-black"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto relative z-10 pt-6 md:pt-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 md:mb-12 text-primary gold-glow">
            How It Works
          </h2>
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Automations Section */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal/50 to-vault-charcoal"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto relative z-10 pt-6 md:pt-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4 text-primary gold-glow">
            Available Automation Solutions
          </h2>
          <p className="text-center text-lg text-muted-foreground mb-6 md:mb-12 max-w-3xl mx-auto">
            Choose from our library of proven automation systems. Each solution is battle-tested and ready to deploy.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {automations.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-muted-foreground">No automations available yet. Check back soon!</p>
              </div>
            ) : (
              automations.map((automation) => (
                <Card key={automation.id} className="bg-card border-border hover:border-primary/50 transition-all">
                  {automation.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={automation.image_url}
                        alt={automation.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-foreground">{automation.name}</CardTitle>
                    <CardDescription>{automation.description}</CardDescription>
                    {automation.category && (
                      <Badge variant="secondary" className="mt-2">{automation.category}</Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Setup Fee:</span>
                        <span className="font-bold text-foreground">${automation.setup_price}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Monthly:</span>
                        <span className="font-bold text-primary">${automation.monthly_price}/mo</span>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary gold-glow">
                Ready to Transform Your Business?
              </h2>
              <p className="text-lg md:text-xl text-foreground mb-8 max-w-2xl mx-auto">
                Join the automation revolution and start saving time, reducing costs, and scaling your operations today. The future of business is automated.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={() => {
                    const formElement = document.getElementById('business-form');
                    if (formElement) {
                      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 gold-border-glow"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-muted-foreground text-sm md:text-base">
                  Setup typically takes 24-48 hours
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Get Started Form Section */}
      <section className="py-8 md:py-20 px-6 relative overflow-hidden">
        {/* Gradient transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal/50 to-vault-charcoal"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="container mx-auto relative z-10 pt-6 md:pt-12">
          <Card id="business-form" className="max-w-3xl mx-auto bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl text-primary gold-glow">Start Your Automation Journey</CardTitle>
              <CardDescription className="text-base">Create an account to get started, or send us an enquiry if you have questions.</CardDescription>
            </CardHeader>
            <CardContent>
                  <Tabs defaultValue="signup" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="signup">Create Account</TabsTrigger>
                      <TabsTrigger value="enquiry">Send Enquiry</TabsTrigger>
                    </TabsList>

                    <TabsContent value="signup">
                      {hasAccount ? (
                        <div className="text-center py-8">
                          <p className="text-lg text-foreground mb-4">You already have an account!</p>
                          <Button onClick={() => navigate("/client-dashboard")}>
                            Go to Dashboard
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={handleSignup} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="business-name">Business Name *</Label>
                        <Input
                          id="business-name"
                          type="text"
                          placeholder="Your Company LLC"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          required
                          className="bg-input border-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact-name">Contact Name *</Label>
                        <Input
                          id="contact-name"
                          type="text"
                          placeholder="John Doe"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          required
                          className="bg-input border-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          type="text"
                          placeholder="E-commerce, SaaS, etc."
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          className="bg-input border-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Tell us about your business</Label>
                        <Textarea
                          id="description"
                          placeholder="What does your business do? What are your automation needs?"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={4}
                          className="bg-input border-border"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6"
                        disabled={loading}
                      >
                        {loading ? "Creating Account..." : "Create Business Account"}
                      </Button>
                    </form>
                  )}
                </TabsContent>

                <TabsContent value="enquiry">
                  <form onSubmit={handleEnquiry} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="enquiry-business-name">Business Name *</Label>
                      <Input
                        id="enquiry-business-name"
                        type="text"
                        placeholder="Your Company LLC"
                        value={enquiryBusinessName}
                        onChange={(e) => setEnquiryBusinessName(e.target.value)}
                        required
                        className="bg-input border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enquiry-contact-name">Contact Name *</Label>
                      <Input
                        id="enquiry-contact-name"
                        type="text"
                        placeholder="John Doe"
                        value={enquiryContactName}
                        onChange={(e) => setEnquiryContactName(e.target.value)}
                        required
                        className="bg-input border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enquiry-email">Email *</Label>
                      <Input
                        id="enquiry-email"
                        type="email"
                        placeholder="john@company.com"
                        value={enquiryEmail}
                        onChange={(e) => setEnquiryEmail(e.target.value)}
                        required
                        className="bg-input border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enquiry-phone">Phone (Optional)</Label>
                      <Input
                        id="enquiry-phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={enquiryPhone}
                        onChange={(e) => setEnquiryPhone(e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enquiry-message">Message *</Label>
                      <Textarea
                        id="enquiry-message"
                        placeholder="Tell us about your automation needs..."
                        value={enquiryMessage}
                        onChange={(e) => setEnquiryMessage(e.target.value)}
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
                      {loading ? "Sending..." : "Send Enquiry"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ForBusinesses;
