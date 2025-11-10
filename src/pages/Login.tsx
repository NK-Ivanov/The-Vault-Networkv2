import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });

      // Check for referral code in localStorage
      const referralCode = localStorage.getItem("referral_code");
      
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

        toast({
          title: "Account created!",
          description: "Welcome! You've been automatically logged in.",
        });

        // Check for referral code in localStorage
        const referralCode = localStorage.getItem("referral_code");
        
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
      
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal to-vault-black"></div>
        
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-vault-gold opacity-10 blur-[120px] rounded-full"></div>
        
        <div className="relative z-10 w-full max-w-md py-20">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary gold-glow">Welcome Back</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="bg-input border-border"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                      disabled={loading}
                    >
                      {loading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary gold-glow">Create Account</CardTitle>
                  <CardDescription>Sign up to get started with The Vault Network</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        required
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={6}
                        className="bg-input border-border"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                      disabled={loading}
                    >
                      {loading ? "Creating account..." : "Sign Up"}
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
