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

const ForBusinesses = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [automations, setAutomations] = useState<any[]>([]);
  
  // Get referral code from URL or localStorage
  const urlReferralCode = searchParams.get("ref");
  const storedReferralCode = localStorage.getItem("referral_code");
  const referralCode = urlReferralCode || storedReferralCode;

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
    fetchAutomations();
    if (user) {
      checkExistingAccount();
    }
  }, [user]);

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
      // Preserve referral code when redirecting to login
      if (referralCode) {
        localStorage.setItem("referral_code", referralCode);
      }
      navigate("/login");
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
        const { data: seller } = await supabase
          .from("sellers")
          .select("id")
          .eq("referral_code", referralCode)
          .eq("status", "approved")
          .maybeSingle();
        
        sellerId = seller?.id || null;
      }

      const { error } = await supabase.from("clients").insert({
        user_id: user.id,
        business_name: businessName,
        contact_name: contactName,
        industry: industry || null,
        description: description || null,
        seller_id: sellerId,
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

      toast({
        title: "Account Created!",
        description: "Welcome to Vault Network. Explore our automations.",
      });

      // Clear referral code from localStorage after successful signup
      if (referralCode) {
        localStorage.removeItem("referral_code");
      }

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>

        <div className="relative z-10 container mx-auto pt-20">
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 text-primary">
              Prebuilt AI Automation Systems
            </h1>
            <p className="text-xl md:text-2xl mb-4 max-w-3xl mx-auto text-foreground">
              Deploy ready-made automation systems that save time and scale your business
            </p>
            {referralCode && (
              <Badge variant="secondary" className="text-lg py-2 px-4">
                Invited by Partner: {referralCode}
              </Badge>
            )}
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Available Automations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {automations.length === 0 ? (
                <div className="col-span-3 text-center py-12">
                  <p className="text-muted-foreground">No automations available yet</p>
                </div>
              ) : (
                automations.map((automation) => (
                  <Card key={automation.id} className="bg-card border-border">
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
                        <Badge variant="secondary">{automation.category}</Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Setup Fee:</span>
                          <span className="font-bold text-foreground">${automation.setup_price}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Monthly:</span>
                          <span className="font-bold text-primary">${automation.monthly_price}/mo</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <Card className="max-w-3xl mx-auto bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Get Started</CardTitle>
              <CardDescription>Create an account or send us an enquiry</CardDescription>
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
