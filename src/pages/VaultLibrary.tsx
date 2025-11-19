import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Lock, CheckCircle2, Clock, ArrowRight, RefreshCw, Plus, ExternalLink, FileText, Video, GraduationCap, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

  const resourceToken = searchParams.get("token");

  usePageMeta({
    title: "Vault Library - The Vault Network",
    description: "Access extra learning modules and courses",
    ogTitle: "Vault Library - The Vault Network",
    ogDescription: "Access extra learning modules and courses",
    ogUrl: "https://vaultnet.work/vault-library",
  });

  useEffect(() => {
    if (!authLoading && user) {
      checkPartnerAccess();
    } else if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (resourceToken && sellerData) {
      fetchTokenPreview(resourceToken);
    }
  }, [resourceToken, sellerData]);

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
    if (!user) return;

    try {
      // Check if user is a seller/partner
      const { data: seller, error: sellerError } = await supabase
        .from("sellers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (sellerError) throw sellerError;

      if (!seller) {
        toast({
          title: "Not a Partner",
          description: "Please apply to become a partner first.",
        });
        navigate("/partners");
        return;
      }

      setSellerData(seller);
      
      // Fetch vault library resources
      await fetchResources(seller.id);
    } catch (error: any) {
      console.error("Error checking partner access:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load library",
        variant: "destructive",
      });
      navigate("/partner-dashboard");
    } finally {
      setLoading(false);
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
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Vault Library</h1>
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

        {/* Resources Grid */}
        {resources.length === 0 ? (
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
                  Use shared links from admins or community channels to add resources to your library.
                </p>
                <p className="text-sm text-muted-foreground">
                  Reached your daily XP cap? Explore the Vault Library to continue learning without limits!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default VaultLibrary;

