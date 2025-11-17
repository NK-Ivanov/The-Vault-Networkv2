import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, GraduationCap, Lock, CheckCircle2, Clock, ArrowRight, RefreshCw, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePageMeta } from "@/hooks/usePageMeta";

interface LearnerModule {
  id: string;
  module_id: string;
  module_title: string;
  module_description: string | null;
  module_content: any;
  accessed_at: string;
  progress: any;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

const LearnerDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<LearnerModule[]>([]);
  const [learnerData, setLearnerData] = useState<any>(null);
  const [processingToken, setProcessingToken] = useState(false);
  const [tokenPreview, setTokenPreview] = useState<any>(null);
  const [loadingTokenPreview, setLoadingTokenPreview] = useState(false);
  const [showTokenPreview, setShowTokenPreview] = useState(false);
  
  const moduleToken = searchParams.get("token");

  usePageMeta({
    title: "Learner Dashboard - The Vault Network",
    description: "Access your learning modules and track your progress",
    ogTitle: "Learner Dashboard - The Vault Network",
    ogDescription: "Access your learning modules and track your progress",
    ogUrl: "https://vaultnet.work/learner-dashboard",
  });

  useEffect(() => {
    if (!authLoading && user) {
      checkLearnerAccess();
    } else if (!authLoading && !user) {
      navigate("/learners");
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (moduleToken && learnerData) {
      fetchTokenPreview(moduleToken);
    }
  }, [moduleToken, learnerData]);

  const fetchTokenPreview = async (token: string) => {
    setLoadingTokenPreview(true);
    try {
      const { data, error } = await supabase.rpc("get_module_token_info", {
        _token: token,
      });

      if (error) throw error;

      if (data.success) {
        // Fetch current modules to check if already exists
        const { data: currentModules } = await supabase
          .from("learner_modules")
          .select("module_id")
          .eq("learner_id", learnerData.id);
        
        const hasModule = currentModules?.some(m => m.module_id === data.module_id);
        if (hasModule) {
          toast({
            title: "Already in Library",
            description: "You already have access to this module",
          });
          navigate("/learner-dashboard", { replace: true });
          return;
        }
        
        setTokenPreview(data);
        setShowTokenPreview(true);
      } else {
        toast({
          title: "Invalid Link",
          description: data.error || "This module link is invalid or expired",
          variant: "destructive",
        });
        navigate("/learner-dashboard", { replace: true });
      }
    } catch (error: any) {
      console.error("Error fetching token preview:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load module preview",
        variant: "destructive",
      });
      navigate("/learner-dashboard", { replace: true });
    } finally {
      setLoadingTokenPreview(false);
    }
  };

  const checkLearnerAccess = async () => {
    if (!user) return;

    try {
      // Check if user is a learner
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "learner");

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) {
        // Not a learner, redirect to enrollment
        toast({
          title: "Not Enrolled",
          description: "Please enroll as a learner first.",
        });
        navigate("/learners");
        return;
      }

      // Fetch learner data
      const { data: learner, error: learnerError } = await supabase
        .from("learners")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (learnerError) throw learnerError;

      setLearnerData(learner);
      
      // Fetch learner modules
      await fetchModules(learner.id);
    } catch (error: any) {
      console.error("Error checking learner access:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard",
        variant: "destructive",
      });
      navigate("/learners");
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async (learnerId: string) => {
    try {
      const { data: modulesData, error } = await supabase
        .from("learner_modules")
        .select("*")
        .eq("learner_id", learnerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setModules(modulesData || []);
    } catch (error: any) {
      console.error("Error fetching modules:", error);
      toast({
        title: "Error",
        description: "Failed to load modules",
        variant: "destructive",
      });
    }
  };

  const handleAddToLibrary = async () => {
    if (!moduleToken || !learnerData || processingToken) return;

    setProcessingToken(true);
    try {
      const { data, error } = await supabase.rpc("redeem_module_token", {
        _token: moduleToken,
        _learner_id: learnerData.id,
      });

      if (error) throw error;

      if (data.success) {
        // Refresh modules first to check if already exists
        await fetchModules(learnerData.id);
        
        // Check if module was actually added (might already exist)
        const updatedModules = await supabase
          .from("learner_modules")
          .select("*")
          .eq("learner_id", learnerData.id)
          .order("created_at", { ascending: false });

        if (updatedModules.data) {
          const hasModule = updatedModules.data.some(m => m.module_id === data.module_id);
          if (hasModule) {
            toast({
              title: "Module Added!",
              description: `${data.module_title} has been added to your library`,
            });
          } else {
            toast({
              title: "Already in Library",
              description: "You already have access to this module",
            });
          }
        }

        // Close preview and remove token from URL
        setShowTokenPreview(false);
        setTokenPreview(null);
        navigate("/learner-dashboard", { replace: true });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add module",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error adding module:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add module",
        variant: "destructive",
      });
    } finally {
      setProcessingToken(false);
    }
  };

  const handleDismissPreview = () => {
    setShowTokenPreview(false);
    setTokenPreview(null);
    navigate("/learner-dashboard", { replace: true });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-12 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-primary">Learner Dashboard</h1>
          </div>
          {learnerData && (
            <p className="text-muted-foreground">
              Welcome back, <span className="font-semibold text-foreground">{learnerData.full_name}</span>
            </p>
          )}
        </div>

        {/* Module Token Preview Card */}
        {showTokenPreview && tokenPreview && (
          <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                New Module Available
              </CardTitle>
              <CardDescription>
                You can add this module to your library to access it anytime
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">{tokenPreview.module_title}</h3>
                {tokenPreview.module_description && (
                  <p className="text-muted-foreground">{tokenPreview.module_description}</p>
                )}
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleAddToLibrary}
                  disabled={processingToken}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {processingToken ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Library
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDismissPreview}
                  variant="outline"
                  disabled={processingToken}
                >
                  Maybe Later
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading Token Preview */}
        {loadingTokenPreview && (
          <Card className="mb-6 border-primary/20 bg-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading module preview...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modules Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Your Modules
            </h2>
            <Badge variant="outline" className="text-sm">
              {modules.length} {modules.length === 1 ? "module" : "modules"}
            </Badge>
          </div>

          {modules.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Modules Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Your dashboard is empty. Modules will appear here when you access special links from Discord.
                </p>
                <p className="text-sm text-muted-foreground">
                  Keep an eye on Discord for exclusive learning content!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <Card
                  key={module.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-primary/20 hover:border-primary/40"
                  onClick={() => navigate(`/learner-module/${module.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">{module.module_title}</CardTitle>
                      {module.completed ? (
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          In Progress
                        </Badge>
                      )}
                    </div>
                    {module.module_description && (
                      <CardDescription className="line-clamp-2">
                        {module.module_description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span>
                        Added {new Date(module.created_at).toLocaleDateString()}
                      </span>
                      {module.accessed_at && (
                        <span>
                          Last accessed {new Date(module.accessed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-primary text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/learner-module/${module.id}`);
                      }}
                    >
                      {module.completed ? "Review Module" : "Continue Learning"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              How to Get More Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Modules are added to your dashboard through special Discord links. When you click on a module link in Discord, it will automatically appear here.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Join our Discord community to receive module links</li>
                <li>Click on module links shared in Discord</li>
                <li>Modules will automatically appear in your dashboard</li>
                <li>You can only access modules shared through Discord links</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default LearnerDashboard;

