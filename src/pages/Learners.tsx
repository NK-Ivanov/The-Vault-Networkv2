import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, GraduationCap, ArrowRight, Shield, Users, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePageMeta } from "@/hooks/usePageMeta";

const Learners = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [enrolling, setEnrolling] = useState(false);
  
  // Check if there's a module token in the URL
  const moduleToken = searchParams.get("token");
  
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupDiscordTag, setSignupDiscordTag] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  usePageMeta({
    title: "Learning Path - The Vault Network",
    description: "Welcome to The Vault Network Learning Path. A secret path only accessible through Discord. Enroll to access exclusive learning modules.",
    ogTitle: "Learning Path - The Vault Network",
    ogDescription: "Welcome to The Vault Network Learning Path. A secret path only accessible through Discord.",
    ogUrl: "https://vaultnet.work/learners",
  });

  // Check if user is already a learner and redirect
  useEffect(() => {
    if (!authLoading && user) {
      checkLearnerStatus();
    }
  }, [user, authLoading]);

  const checkLearnerStatus = async () => {
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "learner");

    if (roles && roles.length > 0) {
      // User is already a learner, redirect to dashboard
      navigate("/learner-dashboard" + (moduleToken ? `?token=${moduleToken}` : ""));
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrolling(true);

    try {
      // Check if user is logged in
      if (!user) {
        // Sign up new user first
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: signupEmail,
          password: signupPassword,
          options: {
            data: {
              full_name: signupFullName,
            },
          },
        });

        if (signupError) throw signupError;

        if (!signupData.user) {
          throw new Error("Signup failed - no user data returned");
        }

        // Wait a moment for user to be created
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Enroll as learner
        const { data: enrollData, error: enrollError } = await supabase.rpc("enroll_as_learner", {
          _full_name: signupFullName,
          _email: signupEmail,
          _discord_tag: signupDiscordTag || null,
        });

        if (enrollError) throw enrollError;

        toast({
          title: "Welcome to the Learning Path!",
          description: "You've successfully enrolled. Redirecting to your dashboard...",
        });

        // Redirect to dashboard with token if present
        setTimeout(() => {
          navigate("/learner-dashboard" + (moduleToken ? `?token=${moduleToken}` : ""));
        }, 1500);
      } else {
        // User is logged in, just enroll them
        const { data: enrollData, error: enrollError } = await supabase.rpc("enroll_as_learner", {
          _full_name: signupFullName || user.user_metadata?.full_name || user.email?.split("@")[0] || "Learner",
          _email: user.email || "",
          _discord_tag: signupDiscordTag || null,
        });

        if (enrollError) {
          if (enrollError.message.includes("Already enrolled")) {
            toast({
              title: "Already Enrolled",
              description: "You're already a learner! Redirecting to dashboard...",
            });
            setTimeout(() => {
              navigate("/learner-dashboard" + (moduleToken ? `?token=${moduleToken}` : ""));
            }, 1000);
            return;
          }
          throw enrollError;
        }

        toast({
          title: "Welcome to the Learning Path!",
          description: "You've successfully enrolled. Redirecting to your dashboard...",
        });

        setTimeout(() => {
          navigate("/learner-dashboard" + (moduleToken ? `?token=${moduleToken}` : ""));
        }, 1500);
      }
    } catch (error: any) {
      console.error("Enrollment error:", error);
      toast({
        title: "Enrollment Failed",
        description: error.message || "Failed to enroll. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrolling(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Login failed - no user data returned");
      }

      toast({
        title: "Welcome back!",
        description: "Redirecting to your learner dashboard...",
      });

      // Check if they're a learner
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "learner");

      if (roles && roles.length > 0) {
        navigate("/learner-dashboard" + (moduleToken ? `?token=${moduleToken}` : ""));
      } else {
        // They logged in but aren't enrolled yet, show enroll form
        navigate("/learners" + (moduleToken ? `?token=${moduleToken}` : ""));
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Failed to login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal to-vault-black"></div>
        
        {/* Gold glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-vault-gold opacity-10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-vault-blue opacity-5 blur-[120px] rounded-full"></div>
        
        <div className="relative z-10 container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Shield className="w-12 h-12 text-primary" />
                <BookOpen className="w-12 h-12 text-primary" />
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-primary gold-glow">
                Welcome to the Learning Path
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-4">
                This is a secret learning path only accessible through Discord
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
                <Users className="w-4 h-4" />
                <span>Exclusive access for Discord community members</span>
              </div>
            </div>

            {/* Enrollment Card */}
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                  <GraduationCap className="w-6 h-6 text-primary" />
                  Enroll as a Learner
                </CardTitle>
                <CardDescription className="text-center text-base">
                  Join the learning path to access exclusive modules shared through Discord
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Sign Up Form */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">New Learner</h3>
                    <form onSubmit={handleEnroll} className="space-y-4">
                      {!user && (
                        <>
                          <div>
                            <Label htmlFor="signup-name">Full Name</Label>
                            <Input
                              id="signup-name"
                              type="text"
                              placeholder="John Doe"
                              value={signupFullName}
                              onChange={(e) => setSignupFullName(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="signup-email">Email</Label>
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="you@example.com"
                              value={signupEmail}
                              onChange={(e) => setSignupEmail(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="signup-discord">Discord Tag</Label>
                            <Input
                              id="signup-discord"
                              type="text"
                              placeholder="username#1234 or username"
                              value={signupDiscordTag}
                              onChange={(e) => setSignupDiscordTag(e.target.value)}
                              required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Your Discord username so we know who you are
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="signup-password">Password</Label>
                            <Input
                              id="signup-password"
                              type="password"
                              placeholder="••••••••"
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              required
                              minLength={6}
                            />
                          </div>
                        </>
                      )}
                      {user && (
                        <>
                          <div>
                            <Label htmlFor="signup-name-loggedin">Full Name</Label>
                            <Input
                              id="signup-name-loggedin"
                              type="text"
                              placeholder={user.user_metadata?.full_name || user.email?.split("@")[0] || "Your Name"}
                              value={signupFullName}
                              onChange={(e) => setSignupFullName(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="signup-discord-loggedin">Discord Tag</Label>
                            <Input
                              id="signup-discord-loggedin"
                              type="text"
                              placeholder="username#1234 or username"
                              value={signupDiscordTag}
                              onChange={(e) => setSignupDiscordTag(e.target.value)}
                              required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Your Discord username so we know who you are
                            </p>
                          </div>
                        </>
                      )}
                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={enrolling}
                      >
                        {enrolling ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <GraduationCap className="w-4 h-4 mr-2" />
                            Enroll Now
                          </>
                        )}
                      </Button>
                    </form>
                  </div>

                  {/* Login Form */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Existing Learner</h3>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full border-primary text-primary hover:bg-primary/10"
                        disabled={enrolling}
                      >
                        {enrolling ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          <>
                            Sign In
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Info Section */}
                <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground">How it works:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Enroll to get access to the learner dashboard</li>
                        <li>Special Discord links will add modules to your dashboard</li>
                        <li>You can only access modules shared through Discord</li>
                        <li>Progress is saved automatically</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Learners;

