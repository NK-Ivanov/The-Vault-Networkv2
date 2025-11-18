import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Bookmark, BookmarkCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface AutomationData {
  id: string;
  name: string;
  description: string;
  category: string | null;
  setup_price: number;
  monthly_price: number;
  image_url: string | null;
  features: string[] | null;
  default_commission_rate: number | null;
  is_premium: boolean;
  rank_required: string | null;
}

const AutomationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [automation, setAutomation] = useState<AutomationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellerData, setSellerData] = useState<any>(null);
  const [bookmarkedAutomations, setBookmarkedAutomations] = useState<Set<string>>(new Set());
  const [fullyReadAutomations, setFullyReadAutomations] = useState<Set<string>>(new Set());
  const [briefViewStartTime, setBriefViewStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchAutomation = async () => {
      try {
        const { data, error } = await supabase
          .from("automations")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setAutomation(data);
        setLoading(false);

        // Track view time for "Read One Automation in Full" task
        setBriefViewStartTime(Date.now());
      } catch (error: any) {
        console.error("Error fetching automation:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load automation details.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchAutomation();
  }, [id, toast]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchSellerData = async () => {
      try {
        const { data, error } = await supabase
          .from("sellers")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setSellerData(data);

          // Fetch bookmarked automations
          const { data: bookmarksData } = await supabase
            .from("automation_bookmarks")
            .select("automation_id")
            .eq("seller_id", data.id);

          if (bookmarksData) {
            const bookmarkIds = new Set(
              bookmarksData.map((b: any) => b.automation_id).filter((id: any) => id)
            );
            setBookmarkedAutomations(bookmarkIds);
          }

          // Fetch fully read automations for task tracking
          const { data: activityData } = await supabase
            .from("partner_activity_log")
            .select("metadata")
            .eq("seller_id", data.id)
            .eq("event_type", "automation_fully_read");

          if (activityData) {
            const readIds = new Set(
              activityData
                .map((a: any) => a.metadata?.automation_id)
                .filter((id: any) => id)
            );
            setFullyReadAutomations(readIds);
          }
        }
      } catch (error: any) {
        console.error("Error fetching seller data:", error);
      }
    };

    fetchSellerData();
  }, [user?.id]);

  // Check if automation was read for 5+ seconds and mark as completed
  useEffect(() => {
    if (!briefViewStartTime || !sellerData?.id || !automation?.id) return;
    if (fullyReadAutomations.has(automation.id)) return; // Already read

    const checkReadDuration = () => {
      const viewDuration = Date.now() - briefViewStartTime;
      if (viewDuration >= 5000) {
        // 5+ seconds
        (async () => {
          try {
            // Check if already logged
            const { data: existing } = await supabase
              .from("partner_activity_log")
              .select("id")
              .eq("seller_id", sellerData.id)
              .eq("event_type", "automation_fully_read")
              .eq("metadata->>automation_id", automation.id)
              .maybeSingle();

            if (!existing) {
              await supabase.from("partner_activity_log").insert({
                seller_id: sellerData.id,
                event_type: "automation_fully_read",
                xp_value: 0,
                description: `Fully read automation: ${automation.name}`,
                metadata: { automation_id: automation.id },
              });

              setFullyReadAutomations((prev) => new Set([...prev, automation.id]));

              // Task completion will be handled by PartnerDashboard's useEffect when user returns
              // The activity log entry is sufficient - PartnerDashboard will detect it
            }
          } catch (error) {
            console.error("Error logging full read:", error);
          }
        })();
      }
    };

    const timer = setTimeout(checkReadDuration, 5000);
    return () => clearTimeout(timer);
  }, [briefViewStartTime, sellerData?.id, automation?.id, fullyReadAutomations]);

  const handleToggleBookmark = async () => {
    if (!sellerData?.id || !automation?.id) {
      toast({
        title: "Error",
        description: "Unable to bookmark. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    try {
      const isBookmarked = bookmarkedAutomations.has(automation.id);

      if (isBookmarked) {
        const { error } = await supabase
          .from("automation_bookmarks")
          .delete()
          .eq("seller_id", sellerData.id)
          .eq("automation_id", automation.id);

        if (error) throw error;

        setBookmarkedAutomations((prev) => {
          const updated = new Set(prev);
          updated.delete(automation.id);
          return updated;
        });

        toast({
          title: "Bookmark Removed",
          description: "Automation removed from bookmarks.",
        });
      } else {
        const { error } = await supabase.from("automation_bookmarks").insert({
          seller_id: sellerData.id,
          automation_id: automation.id,
        });

        if (error) throw error;

        setBookmarkedAutomations((prev) => new Set([...prev, automation.id]));

        toast({
          title: "Bookmarked!",
          description: "Automation added to bookmarks.",
        });
      }
    } catch (error: any) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading automation details...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!automation) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Automation Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The automation you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/partner-dashboard")}>Go to Dashboard</Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/partner-dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="bg-card border-border">
            {automation.image_url && (
              <div className="h-64 md:h-96 overflow-hidden rounded-t-lg">
                <img
                  src={automation.image_url}
                  alt={automation.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl md:text-3xl">{automation.name}</CardTitle>
                    {automation.category && (
                      <Badge variant="secondary" className="text-sm">
                        {automation.category}
                      </Badge>
                    )}
                    {fullyReadAutomations.has(automation.id) && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Read
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">
                    {automation.description}
                  </CardDescription>
                </div>
                {sellerData && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleBookmark}
                    title={
                      bookmarkedAutomations.has(automation.id)
                        ? "Remove bookmark"
                        : "Bookmark"
                    }
                  >
                    {bookmarkedAutomations.has(automation.id) ? (
                      <BookmarkCheck className="w-5 h-5 text-primary" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Pricing Section */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h3 className="text-lg font-semibold">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Setup Fee</p>
                    <p className="text-2xl font-bold">${automation.setup_price}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Monthly Subscription</p>
                    <p className="text-2xl font-bold text-primary">
                      ${automation.monthly_price}
                      <span className="text-sm font-normal">/mo</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Commission Rate</p>
                    <p className="text-2xl font-bold text-primary">
                      {sellerData?.commission_rate
                        ? `${sellerData.commission_rate}%`
                        : automation.default_commission_rate
                          ? `${automation.default_commission_rate}%`
                          : "20%"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sellerData?.commission_rate
                        ? "Your custom rate"
                        : automation.default_commission_rate
                          ? "Automation default rate"
                          : "Default rate"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              {automation.features && automation.features.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Features</h3>
                  <ul className="space-y-2">
                    {automation.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={() => navigate("/partner-dashboard")} variant="outline">
                  Back to Dashboard
                </Button>
                {sellerData && (
                  <Button
                    variant={bookmarkedAutomations.has(automation.id) ? "secondary" : "default"}
                    onClick={handleToggleBookmark}
                  >
                    {bookmarkedAutomations.has(automation.id) ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 mr-2" />
                        Bookmarked
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 mr-2" />
                        Bookmark
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AutomationDetail;

