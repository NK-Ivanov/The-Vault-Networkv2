import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Lock, CheckCircle2, Clock, ArrowRight, RefreshCw, Plus, ExternalLink, FileText, Video, GraduationCap, Sparkles, MessageSquare, Home } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VaultModuleViewer from "@/components/VaultModuleViewer";

interface VaultLibraryResource {
  id: string;
  seller_id: string;
  resource_id: string;
  resource_title: string;
  resource_description: string | null;
  resource_content: any;
  resource_type: string;
  resource_url: string | null;
  accessed_at: string;
  progress: any;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const VaultLibrary = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<VaultLibraryResource[]>([]);
  const [sellerData, setSellerData] = useState<any>(null);
  const [processingToken, setProcessingToken] = useState(false);
  const [tokenPreview, setTokenPreview] = useState<any>(null);
  const [loadingTokenPreview, setLoadingTokenPreview] = useState(false);
  const [showTokenPreview, setShowTokenPreview] = useState(false);
  const [vaultModules, setVaultModules] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [moduleProgress, setModuleProgress] = useState<Map<string, any>>(new Map());

  const resourceToken = searchParams.get("token");
  const moduleId = searchParams.get("module");

  usePageMeta({
    title: "Vault Library - The Vault Network",
    description: "Access extra learning modules and courses",
    ogTitle: "Vault Library - The Vault Network",
    ogDescription: "Access extra learning modules and courses",
    ogUrl: "https://vaultnet.work/vault-library",
  });

  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/login");
      return;
    }
    
    if (!hasFetchedRef.current && !isFetchingRef.current) {
      hasFetchedRef.current = true;
      checkPartnerAccess();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (resourceToken && sellerData) {
      fetchTokenPreview(resourceToken);
    }
  }, [resourceToken, sellerData]);

  useEffect(() => {
    if (moduleId && sellerData) {
      handleModuleFromLink(moduleId);
    }
  }, [moduleId, sellerData]);

  const fetchTokenPreview = async (token: string) => {
    setLoadingTokenPreview(true);
    try {
      const { data, error } = await supabase.rpc("get_vault_library_token_info", {
        _token: token,
      });

      if (error) throw error;

      if (data.success) {
        // Fetch current resources to check if already exists
        const { data: currentResources } = await supabase
          .from("vault_library")
          .select("resource_id")
          .eq("seller_id", sellerData.id);

        const hasResource = currentResources?.some(r => r.resource_id === data.resource_id);
        if (hasResource) {
          toast({
            title: "Already in Library",
            description: "You already have access to this resource",
          });
          navigate("/vault-library", { replace: true });
          return;
        }

        setTokenPreview(data);
        setShowTokenPreview(true);
      } else {
        toast({
          title: "Invalid Link",
          description: data.error || "This resource link is invalid or expired",
          variant: "destructive",
        });
        navigate("/vault-library", { replace: true });
      }
    } catch (error: any) {
      console.error("Error fetching token preview:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load resource preview",
        variant: "destructive",
      });
      navigate("/vault-library", { replace: true });
    } finally {
      setLoadingTokenPreview(false);
    }
  };

  const checkPartnerAccess = async () => {
    if (!user) {
      setLoading(false);
      isFetchingRef.current = false;
      return;
    }

    if (isFetchingRef.current) {
      return; // Already fetching, don't start another fetch
    }

    // Add a timeout to prevent infinite loading
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      
      // Set timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        console.warn("checkPartnerAccess taking too long, forcing completion");
        setLoading(false);
        isFetchingRef.current = false;
      }, 10000); // 10 second timeout
      
      // Check if user is a seller/partner
      const { data: seller, error: sellerError } = await supabase
        .from("sellers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (sellerError) throw sellerError;

      if (!seller) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        toast({
          title: "Not a Partner",
          description: "Please apply to become a partner first.",
        });
        navigate("/partners");
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }

      setSellerData(seller);
      
      // Check if this is first time opening Vault Library and award XP
      const { data: hasOpenedBefore } = await supabase
        .from("partner_activity_log")
        .select("id")
        .eq("seller_id", seller.id)
        .eq("event_type", "vault_library_first_open")
        .maybeSingle();

      if (!hasOpenedBefore) {
        // Award 100 XP for first time opening Vault Library
        const { error: xpError } = await supabase.rpc("add_seller_xp", {
          _seller_id: seller.id,
          _xp_amount: 100,
          _event_type: "vault_library_first_open",
          _description: "Opened Vault Library for the first time",
          _metadata: {},
        });

        if (xpError) {
          console.error("Error awarding XP for Vault Library:", xpError);
        } else {
          toast({
            title: "Welcome to Vault Library! 🎉",
            description: "You earned 100 XP for opening the Vault Library for the first time!",
          });
        }
      }
      
      // Fetch vault library resources
      try {
        await fetchResources(seller.id);
      } catch (error) {
        console.error("Error fetching resources:", error);
        // Continue even if resources fail
      }
      
      // Fetch published vault modules
      try {
        await fetchVaultModules(seller);
      } catch (error) {
        console.error("Error fetching vault modules:", error);
        // Continue even if modules fail
      }
    } catch (error: any) {
      console.error("Error checking partner access:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load library",
        variant: "destructive",
      });
      navigate("/partner-dashboard");
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const fetchResources = async (sellerId: string) => {
    try {
      const { data: resourcesData, error } = await supabase
        .from("vault_library")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setResources(resourcesData || []);
    } catch (error: any) {
      console.error("Error fetching resources:", error);
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive",
      });
    }
  };

  const fetchVaultModules = async (seller: any) => {
    setLoadingModules(true);
    try {
      // Only fetch modules that have been accessed (have progress entries)
      // Modules are added to library only when accessed via link
      const { data: progressData, error: progressError } = await supabase
        .from("vault_library_module_progress")
        .select(`
          *,
          module:vault_library_modules(*)
        `)
        .eq("seller_id", seller.id);

      if (progressError) {
        // If table doesn't exist, just return empty array
        if (progressError.message?.includes("does not exist") || progressError.message?.includes("relation") || progressError.code === "42P01") {
          console.warn("Vault library module progress table not found - migration may not be applied yet");
          setVaultModules([]);
          setModuleProgress(new Map());
          setLoadingModules(false);
          return;
        }
        throw progressError;
      }

      if (progressData && progressData.length > 0) {
        // Filter out progress entries where module is null (module deleted) or not published
        const validProgress = progressData.filter((p: any) => p.module !== null && p.module?.is_published === true);
        
        // Extract modules and check rank accessibility
        const modules: any[] = [];
        const progressMap = new Map();
        
        validProgress.forEach((p: any) => {
          const module = p.module;
          if (module) {
            // Check rank requirement
            const rankOrder = ['Recruit', 'Recruit Plus', 'Apprentice', 'Apprentice Plus', 'Agent', 'Agent Plus', 'Verified', 'Verified Plus', 'Partner', 'Partner Plus', 'Partner Pro'];
            const sellerRankIndex = rankOrder.indexOf(seller.current_rank || 'Recruit');
            const moduleRankIndex = rankOrder.indexOf(module.min_rank || 'Recruit');
            
            if (sellerRankIndex >= moduleRankIndex) {
              modules.push(module);
              progressMap.set(p.module_id, p);
            }
          }
        });

        setVaultModules(modules);
        setModuleProgress(progressMap);
      } else {
        // No modules accessed yet
        setVaultModules([]);
        setModuleProgress(new Map());
      }
    } catch (error: any) {
      console.error("Error fetching vault modules:", error);
      // Set empty arrays on error to prevent infinite loading
      setVaultModules([]);
      setModuleProgress(new Map());
      // Don't show toast - let parent handle errors or show a less intrusive message
    } finally {
      setLoadingModules(false);
    }
  };

  const handleModuleClick = async (module: any, openQuiz: boolean = false) => {
    if (!sellerData) return;

    // Check rank requirement
    const rankOrder = ['Recruit', 'Recruit Plus', 'Apprentice', 'Apprentice Plus', 'Agent', 'Agent Plus', 'Verified', 'Verified Plus', 'Partner', 'Partner Plus', 'Partner Pro'];
    const sellerRankIndex = rankOrder.indexOf(sellerData.current_rank || 'Recruit');
    const moduleRankIndex = rankOrder.indexOf(module.min_rank || 'Recruit');

    if (sellerRankIndex < moduleRankIndex) {
      toast({
        title: "Rank Requirement Not Met",
        description: `This module requires ${module.min_rank} rank or higher. Your current rank is ${sellerData.current_rank}.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedModule(module.id);
    if (openQuiz) {
      // Store flag to open quiz when module viewer loads
      sessionStorage.setItem(`openQuiz_${module.id}`, 'true');
    } else {
      // Clear any quiz flags when viewing module normally
      sessionStorage.removeItem(`openQuiz_${module.id}`);
    }
  };

  const handleModuleFromLink = async (moduleIdParam: string) => {
    if (!sellerData) return;

    try {
      // Fetch the module
      const { data: moduleData, error } = await supabase
        .from("vault_library_modules")
        .select("*")
        .eq("id", moduleIdParam)
        .eq("is_published", true)
        .single();

      if (error || !moduleData) {
        toast({
          title: "Module Not Found",
          description: "This module is not available or has been removed.",
          variant: "destructive",
        });
        navigate("/vault-library", { replace: true });
        return;
      }

      // Check rank requirement
      const rankOrder = ['Recruit', 'Recruit Plus', 'Apprentice', 'Apprentice Plus', 'Agent', 'Agent Plus', 'Verified', 'Verified Plus', 'Partner', 'Partner Plus', 'Partner Pro'];
      const sellerRankIndex = rankOrder.indexOf(sellerData.current_rank || 'Recruit');
      const moduleRankIndex = rankOrder.indexOf(moduleData.min_rank || 'Recruit');

      if (sellerRankIndex < moduleRankIndex) {
        toast({
          title: "Rank Requirement Not Met",
          description: `This module requires ${moduleData.min_rank} rank or higher. Your current rank is ${sellerData.current_rank}.`,
          variant: "destructive",
        });
        navigate("/vault-library", { replace: true });
        return;
      }

      // Create a progress entry so the module appears in the library
      // This ensures modules only appear after being accessed via link
      const { error: progressError } = await supabase
        .from("vault_library_module_progress")
        .upsert({
          seller_id: sellerData.id,
          module_id: moduleData.id,
          current_section: 0,
          completed_sections: [],
          quiz_answers: {},
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "seller_id,module_id",
        });

      if (progressError) {
        console.error("Error creating progress entry:", progressError);
      }

      // Module is accessible, show it
      setSelectedModule(moduleData.id);
      
      toast({
        title: "Module Added!",
        description: `${moduleData.title} is now available in your library.`,
      });

      // Remove module ID from URL
      navigate("/vault-library", { replace: true });
      
      // Refresh modules list to include the newly added module
      await fetchVaultModules(sellerData);
    } catch (error: any) {
      console.error("Error handling module link:", error);
      toast({
        title: "Error",
        description: "Failed to load module",
        variant: "destructive",
      });
      navigate("/vault-library", { replace: true });
    }
  };

  const handleAddToLibrary = async () => {
    if (!resourceToken || !sellerData || processingToken) return;

    setProcessingToken(true);
    try {
      const { data, error } = await supabase.rpc("redeem_vault_library_token", {
        _token: resourceToken,
        _seller_id: sellerData.id,
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Resource Added! 🎉",
          description: `${data.resource_title} has been added to your library`,
        });
        
        // Refresh resources
        await fetchResources(sellerData.id);
        
        // Close preview and remove token from URL
        setShowTokenPreview(false);
        setTokenPreview(null);
        navigate("/vault-library", { replace: true });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add resource",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error adding resource:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add resource",
        variant: "destructive",
      });
    } finally {
      setProcessingToken(false);
    }
  };

  const handleResourceClick = async (resource: VaultLibraryResource) => {
    // Update accessed_at
    await supabase
      .from("vault_library")
      .update({ accessed_at: new Date().toISOString() })
      .eq("id", resource.id);
    
    // If resource has external URL, open it
    if (resource.resource_url) {
      window.open(resource.resource_url, '_blank');
    } else {
      // For now, just show content in a dialog
      // You can create a dedicated resource viewer page later
      toast({
        title: "Resource Content",
        description: "Resource content viewer coming soon. Check back later!",
      });
    }
    
    // Refresh resources to update accessed_at
    await fetchResources(sellerData.id);
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'course':
        return GraduationCap;
      case 'video':
        return Video;
      case 'article':
        return FileText;
      case 'guide':
        return BookOpen;
      default:
        return BookOpen;
    }
  };

  const getResourceTypeBadge = (resourceType: string) => {
    const colors: Record<string, string> = {
      'module': 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      'course': 'bg-purple-500/20 text-purple-500 border-purple-500/30',
      'article': 'bg-green-500/20 text-green-500 border-green-500/30',
      'video': 'bg-red-500/20 text-red-500 border-red-500/30',
      'guide': 'bg-orange-500/20 text-orange-500 border-orange-500/30',
    };
    return colors[resourceType] || 'bg-muted text-muted-foreground border-border';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (!sellerData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Vault Library</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/partner-dashboard?tab=getting-started")}
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <p className="text-muted-foreground">
            Access extra learning modules, courses, and resources to enhance your skills beyond the daily XP cap.
          </p>
        </div>

        {/* Token Preview Dialog */}
        <Dialog open={showTokenPreview} onOpenChange={setShowTokenPreview}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl text-primary">Add Resource to Library</DialogTitle>
              <DialogDescription>
                Review the resource details before adding it to your library
              </DialogDescription>
            </DialogHeader>
            {tokenPreview && (
              <div className="space-y-4 py-4">
                <Card className="bg-muted/30 border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">{tokenPreview.resource_title}</CardTitle>
                    {tokenPreview.resource_description && (
                      <CardDescription>{tokenPreview.resource_description}</CardDescription>
                    )}
                  </CardHeader>
                  {tokenPreview.resource_type && (
                    <CardContent>
                      <Badge variant="outline" className={getResourceTypeBadge(tokenPreview.resource_type)}>
                        {tokenPreview.resource_type}
                      </Badge>
                    </CardContent>
                  )}
                </Card>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTokenPreview(false);
                      navigate("/vault-library", { replace: true });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddToLibrary}
                    disabled={processingToken}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {processingToken ? "Adding..." : "Add to Library"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Vault Modules Section */}
        {vaultModules.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Vault Library Modules
              </CardTitle>
              <CardDescription>
                Interactive modules with quizzes. Complete modules to earn XP! New modules are published in the Discord <strong>#vault-library</strong> channel - join to stay updated!
              </CardDescription>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => window.open("https://discord.gg/SsBuvNycTP", "_blank")}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-[#5865F2]"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Join Discord
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingModules ? (
                <div className="text-center py-8">
                  <div className="text-primary text-xl">Loading modules...</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vaultModules.map((module) => {
                    const progress = moduleProgress.get(module.id);
                    const moduleData = module.module_data as any;
                    const isCompleted = progress?.module_completed || false;
                    const quizCompleted = progress?.quiz_completed || false;
                    const quizAttempts = progress?.quiz_attempts || 0;
                    const quizScore = progress?.quiz_score || null;
                    const bestQuizScore = progress?.best_quiz_score || quizScore;
                    const canRetakeQuiz = quizCompleted && quizAttempts < 3;
                    const hasQuiz = moduleData?.quiz && moduleData.quiz.length > 0;
                    const completedSectionsCount = progress?.completed_sections?.length || 0;
                    const totalSections = moduleData?.sections?.length || 0;
                    const allSectionsCompleted = completedSectionsCount >= totalSections && totalSections > 0;
                    const progressPercent = totalSections > 0
                      ? (completedSectionsCount / totalSections) * 100
                      : 0;
                    // Show quiz button if: has quiz AND 
                    // - all sections completed (can take quiz), OR
                    // - quiz was attempted but can retake (attempts < 3)
                    const showQuizButton = hasQuiz && (allSectionsCompleted || (quizCompleted && canRetakeQuiz));

                    return (
                      <Card
                        key={module.id}
                        className="bg-card border-border hover:border-primary/50 transition-all"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-primary" />
                            </div>
                            {isCompleted && (
                              <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Completed
                                {bestQuizScore !== null && (
                                  <span className="ml-1">• {bestQuizScore}%</span>
                                )}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg">{module.title}</CardTitle>
                          <CardDescription className="text-sm mt-2">
                            {module.category}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <Badge variant="outline" className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                                {module.xp_reward} XP
                              </Badge>
                              <span className="text-muted-foreground">Min: {module.min_rank}</span>
                            </div>
                            {progress && !isCompleted && (
                              <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
                                </div>
                                <Progress value={progressPercent} className="h-2" />
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleModuleClick(module, false);
                                }}
                              >
                                View Module
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                              {showQuizButton && (
                                <Button
                                  variant={canRetakeQuiz ? "default" : "outline"}
                                  className={canRetakeQuiz ? "flex-1 bg-primary hover:bg-primary/90 text-primary-foreground min-w-0" : "flex-1"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleModuleClick(module, true);
                                  }}
                                  disabled={!allSectionsCompleted}
                                  title={!allSectionsCompleted ? "Complete all sections first" : undefined}
                                >
                                  <span className="truncate text-xs sm:text-sm">
                                    {canRetakeQuiz ? (
                                      `Retake (${3 - quizAttempts} left)`
                                    ) : (
                                      "Take Quiz"
                                    )}
                                  </span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resources Grid */}
        {resources.length === 0 && vaultModules.length === 0 ? (
          <Card className="bg-muted/30 border-border">
            <CardContent className="pt-12 pb-12 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Your Library is Empty</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add resources to your library by using shared links. Check the Getting Started tab for resources or ask an admin for access links.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/partner-dashboard")}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Go to Partner Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource) => {
              const Icon = getResourceIcon(resource.resource_type);
              return (
                <Card
                  key={resource.id}
                  className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => handleResourceClick(resource)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      {resource.completed && (
                        <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{resource.resource_title}</CardTitle>
                    {resource.resource_description && (
                      <CardDescription className="text-sm mt-2 line-clamp-2">
                        {resource.resource_description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={getResourceTypeBadge(resource.resource_type)}>
                        {resource.resource_type}
                      </Badge>
                      {resource.resource_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(resource.resource_url!, '_blank');
                          }}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Open
                        </Button>
                      )}
                    </div>
                    {resource.accessed_at && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Last accessed: {new Date(resource.accessed_at).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-semibold mb-2 text-primary">
                  About Vault Library
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  The Vault Library contains extra learning modules, courses, and resources that don't count toward your daily XP cap. 
                  New modules are published in the Discord <strong className="text-primary">#vault-library</strong> channel - join to stay updated!
                </p>
                <p className="text-sm text-muted-foreground">
                  Reached your daily XP cap? Explore the Vault Library to continue learning without limits!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Module Viewer Dialog */}
        {selectedModule && sellerData && (
          <Dialog open={!!selectedModule} onOpenChange={(open) => !open && setSelectedModule(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="sr-only">Vault Module</DialogTitle>
                <DialogDescription className="sr-only">
                  View and complete the module content and quiz
                </DialogDescription>
              </DialogHeader>
              <VaultModuleViewer
                moduleId={selectedModule}
                sellerId={sellerData.id}
                onComplete={() => {
                  setSelectedModule(null);
                  if (sellerData) {
                    fetchVaultModules(sellerData);
                  }
                }}
                onClose={() => setSelectedModule(null)}
              />
            </DialogContent>
          </Dialog>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default VaultLibrary;

