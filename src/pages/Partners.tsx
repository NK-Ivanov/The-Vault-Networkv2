import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, DollarSign, Users, TrendingUp, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";

const Partners = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasApplication, setHasApplication] = useState(false);
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);

  const [name, setName] = useState("");
  const [isBusiness, setIsBusiness] = useState(false);
  const [website, setWebsite] = useState("");
  const [about, setAbout] = useState("");

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
      const referralCode = `REF-${user.id.substring(0, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      const { error } = await supabase.from("sellers").insert({
        user_id: user.id,
        business_name: name,
        website: website || null,
        about: about,
        status: "pending",
        referral_code: referralCode,
      });

      if (error) throw error;

      // Assign seller role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: "seller",
      }).select();

      if (roleError) {
        console.error("Error assigning seller role:", roleError);
        // Continue anyway - role might already exist
      }

      // Clear saved form data
      localStorage.removeItem("pending_partner_form");

      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you soon.",
      });

      navigate("/partner-dashboard");
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
      title: "Earn 20% Commission",
      description: "Get recurring commission on every sale you make"
    },
    {
      icon: Users,
      title: "Dedicated Dashboard",
      description: "Manage clients and track earnings in one place"
    },
    {
      icon: TrendingUp,
      title: "Grow Your Business",
      description: "Scale your income by helping businesses automate"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full"></div>
        {/* Gold divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        
        <div className="relative z-10 container mx-auto pt-20">
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 text-primary gold-glow">
              Become a Vault Partner
            </h1>
            <p className="text-xl md:text-2xl mb-4 max-w-3xl mx-auto text-foreground">
              Sell prebuilt automation systems to businesses and earn recurring income
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-card border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Application Form */}
          <Card className="max-w-2xl mx-auto bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-primary gold-glow">Partner Application</CardTitle>
              <CardDescription>Tell us about yourself and your business</CardDescription>
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
