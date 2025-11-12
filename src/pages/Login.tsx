import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, User, Shield, Sparkles, ArrowRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const redirectPath = searchParams.get("redirect") || null;

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Login failed - no user data returned");
      }

      // Check user roles and redirect accordingly
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
      }

      const userRoles = roles?.map(r => r.role) || [];

      // If no roles found, check for client/seller records as fallback
      if (userRoles.length === 0) {
        const [clientCheck, sellerCheck] = await Promise.all([
          supabase.from("clients").select("id").eq("user_id", data.user.id).maybeSingle(),
          supabase.from("sellers").select("id").eq("user_id", data.user.id).maybeSingle(),
        ]);

        // Assign roles based on existing records
        if (clientCheck.data) {
          await supabase.from("user_roles").insert({
            user_id: data.user.id,
            role: "client",
          });
          userRoles.push("client");
        } else if (sellerCheck.data) {
          await supabase.from("user_roles").insert({
            user_id: data.user.id,
            role: "seller",
          });
          userRoles.push("seller");
        }
      }

      // Clear navigation cache to force refresh
      sessionStorage.removeItem('user_role');
      sessionStorage.removeItem('user_role_user_id');

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });

      // Check for referral code in localStorage
      const referralCode = localStorage.getItem("referral_code");
      
      // If there's a redirect path (from form submission), go there first
      if (redirectPath) {
        navigate(redirectPath);
        return;
      }
      
      // Redirect based on role priority: admin > seller > client
      if (userRoles.includes("admin")) {
        navigate("/admin-dashboard");
      } else if (userRoles.includes("seller")) {
        navigate("/partner-dashboard");
      } else if (userRoles.includes("client")) {
        navigate("/client-dashboard");
      } else {
        // No role assigned yet - redirect to for-businesses if referral code exists
        if (referralCode) {
          navigate(`/for-businesses?ref=${referralCode}`);
        } else {
          navigate("/");
        }
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      if (!signupEmail || !signupPassword || !signupFullName) {
        throw new Error("Please fill in all fields");
      }

      if (signupPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // Debug: Show which Supabase instance we're connecting to
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKeyPrefix = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) + "...";
      console.log("🔗 Connecting to Supabase:", {
        url: supabaseUrl,
        keyPrefix: supabaseKeyPrefix,
        origin: window.location.origin
      });

      // Test database connection by checking if we can query a table
      console.log("🔍 Testing database connection...");
      const { error: testError } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);

      if (testError && testError.code !== "PGRST116" && testError.code !== "42P01") {
        console.error("❌ Database connection test failed:", testError);
        throw new Error(`Database connection issue: ${testError.message}. Please verify your Supabase URL and key are correct.`);
      }
      console.log("✅ Database connection verified");

      console.log("📝 Attempting signup for:", signupEmail);

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: signupFullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        console.error("❌ Signup error:", error);
        throw error;
      }

      console.log("📦 Signup response:", { 
        user: data.user ? { id: data.user.id, email: data.user.email } : null, 
        session: data.session ? "Session created" : "No session (email confirmation required)",
        emailConfirmed: data.user?.email_confirmed_at ? "Yes" : "No"
      });

      // Check if user was created
      if (!data.user) {
        throw new Error("Failed to create user account. Please try again.");
      }

      console.log("👤 User created with ID:", data.user.id);

      // Verify profile was created (trigger should handle this)
      if (data.user) {
        // Wait a moment for the trigger to execute
        console.log("⏳ Waiting for database trigger to create profile...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("❌ Error checking profile:", profileError);
          console.error("Profile error details:", {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          });
        } else if (!profile) {
          console.warn("⚠️ Profile not created automatically");
          console.warn("This may be normal if email confirmation is required, OR the database trigger may not be set up correctly.");
          console.warn("Please check:");
          console.warn("1. Supabase Dashboard → Database → Triggers → 'on_auth_user_created' exists");
          console.warn("2. The trigger function 'handle_new_user()' exists and is working");
          console.warn("3. Email confirmation settings in Authentication → Settings");
        } else {
          console.log("✅ Profile created successfully:", {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name
          });
        }
      }

      // If user is automatically logged in (email confirmation disabled)
      if (data.user && data.session) {
        // Check user roles and redirect accordingly
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

        const userRoles = roles?.map(r => r.role) || [];

        // Clear navigation cache to force refresh
        sessionStorage.removeItem('user_role');
        sessionStorage.removeItem('user_role_user_id');

        toast({
          title: "Account created!",
          description: "Welcome! You've been automatically logged in.",
        });

        // Check for referral code in localStorage
        const referralCode = localStorage.getItem("referral_code");
        
        // If there's a redirect path (from form submission), go there first
        if (redirectPath) {
          navigate(redirectPath);
          return;
        }
        
        // Redirect based on role priority: admin > seller > client
        if (userRoles.includes("admin")) {
          navigate("/admin-dashboard");
        } else if (userRoles.includes("seller")) {
          navigate("/partner-dashboard");
        } else if (userRoles.includes("client")) {
          navigate("/client-dashboard");
        } else {
          // No role assigned yet - redirect to for-businesses if referral code exists
          if (referralCode) {
            navigate(`/for-businesses?ref=${referralCode}`);
          } else {
            navigate("/");
          }
        }
      } else {
        // Email confirmation required
        toast({
          title: "Account created!",
          description: "Please check your email to confirm your account, then log in.",
          duration: 5000,
        });

        // Clear form
        setSignupEmail("");
        setSignupPassword("");
        setSignupFullName("");

        // Switch to login tab after a delay
        setTimeout(() => {
          setLoginEmail(signupEmail);
        }, 1000);
      }
    } catch (error: any) {
      console.error("Signup failed:", error);
      toast({
        title: "Signup failed",
        description: error.message || "An error occurred during signup. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="relative h-screen flex items-center justify-center overflow-hidden px-6">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal to-vault-black"></div>
        
        {/* Gold glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-vault-gold opacity-10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-vault-gold opacity-5 blur-[120px] rounded-full"></div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-10 right-10 opacity-20">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        
        <div className="relative z-10 w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2 border border-primary/20">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-1 text-primary gold-glow">
              Welcome to The Vault Network
            </h1>
            <p className="text-sm text-muted-foreground">
              Secure access to your automation platform
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 p-1">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <Card className="bg-card/80 backdrop-blur-sm border-border shadow-xl relative overflow-hidden">
                {/* Card glow effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
                
                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Lock className="w-4 h-4 text-primary" />
                    </div>
                    <CardTitle className="text-xl text-primary gold-glow">Welcome Back</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 pt-0">
                  <form onSubmit={handleLogin} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email" className="text-xs font-medium flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="your@email.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          className="bg-input border-border pl-9 h-10 text-sm focus:border-primary focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="login-password" className="text-xs font-medium flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-primary" />
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          className="bg-input border-border pl-9 h-10 text-sm focus:border-primary focus:ring-primary"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 text-sm gold-border-glow transition-all group mt-2"
                      disabled={loading}
                    >
                      {loading ? (
                        "Logging in..."
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                  
                  {/* Security Note */}
                  <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium text-foreground mb-0.5">Secure Login</p>
                        <p>Your credentials are encrypted and secure.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <Card className="bg-card/80 backdrop-blur-sm border-border shadow-xl relative overflow-hidden">
                {/* Card glow effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
                
                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <CardTitle className="text-xl text-primary gold-glow">Create Account</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Join The Vault Network and start your automation journey
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 pt-0">
                  <form onSubmit={handleSignup} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-name" className="text-xs font-medium flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" />
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          value={signupFullName}
                          onChange={(e) => setSignupFullName(e.target.value)}
                          required
                          className="bg-input border-border pl-9 h-10 text-sm focus:border-primary focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email" className="text-xs font-medium flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                          className="bg-input border-border pl-9 h-10 text-sm focus:border-primary focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-xs font-medium flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-primary" />
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          minLength={6}
                          className="bg-input border-border pl-9 h-10 text-sm focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Must be at least 6 characters
                      </p>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 text-sm gold-border-glow transition-all group mt-2"
                      disabled={loading}
                    >
                      {loading ? (
                        "Creating account..."
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Login;
