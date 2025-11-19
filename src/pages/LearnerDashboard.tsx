import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, GraduationCap, Lock, CheckCircle2, Clock, ArrowRight, RefreshCw, Plus, Trophy, TrendingUp, Sparkles } from "lucide-react";
import TemplateLibrary from "@/components/TemplateLibrary";
import { Progress } from "@/components/ui/progress";
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
  quiz_id?: string | null;
  quiz_score?: number;
  quiz_passed?: boolean;
  quiz_attempts_count?: number;
  quiz_max_attempts?: number;
  quiz_link?: string;
}

interface LeaderboardEntry {
  learner_id: string;
  full_name: string;
  current_xp: number;
  current_rank: string;
  modules_completed: number;
  total_modules: number;
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
  const [learnerXP, setLearnerXP] = useState(0);
  const [learnerRank, setLearnerRank] = useState("Beginner");
  const [nextRankInfo, setNextRankInfo] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const leaderboardLoadedRef = useRef(false);
  const [xpNotification, setXpNotification] = useState<{ xp: number; message: string } | null>(null);
  
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
      setLearnerXP(learner.current_xp || 0);
      setLearnerRank(learner.current_rank || 'Beginner');
      
      // Get next rank info
      const { data: rankInfo } = await supabase.rpc('get_next_learner_rank', {
        _xp: learner.current_xp || 0
      });
      if (rankInfo) {
        setNextRankInfo(rankInfo);
      }
      
      // Fetch learner modules
      await fetchModules(learner.id);
      
      // Fetch leaderboard (only if not already loaded)
      if (!leaderboardLoadedRef.current) {
        await fetchLeaderboard();
        leaderboardLoadedRef.current = true;
      }
      
      // Process any pending rank up notifications
      await processRankUpNotifications();
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

      // Fetch quiz attempts and quiz info for each module
      const modulesWithQuizResults = await Promise.all(
        (modulesData || []).map(async (module) => {
          let quizInfo: any = null;
          let quizAttempts: any[] = [];
          let quizLink: string | null = null;

          // First, try to get quiz_id from the module itself
          if (module.quiz_id) {
            // Get quiz info and attempts using quiz_id
            const { data: quizData } = await supabase
              .from("quizzes")
              .select("id, title, max_attempts")
              .eq("id", module.quiz_id)
              .single();

            if (quizData) {
              quizInfo = quizData;
              
              // Get all attempts for this quiz
              const { data: attempts } = await supabase
                .from("quiz_attempts")
                .select("score, passed, completed_at")
                .eq("learner_id", learnerId)
                .eq("quiz_id", module.quiz_id)
                .order("completed_at", { ascending: false });

              quizAttempts = attempts || [];

              // Get quiz access token link
              const { data: tokenData } = await supabase
                .from("quiz_access_tokens")
                .select("token, is_active")
                .eq("quiz_id", module.quiz_id)
                .eq("is_active", true)
                .limit(1)
                .single();

              if (tokenData) {
                quizLink = `${window.location.origin}/quiz?token=${tokenData.token}`;
              }
            }
          } else {
            // Fallback: Try to find quiz by module_id in quizzes table
            const { data: quizByModule } = await supabase
              .from("quizzes")
              .select("id, title, max_attempts, module_id")
              .eq("module_id", module.module_id)
              .limit(1)
              .maybeSingle();

            if (quizByModule) {
              quizInfo = quizByModule;
              
              const { data: attempts } = await supabase
                .from("quiz_attempts")
                .select("score, passed, completed_at")
                .eq("learner_id", learnerId)
                .eq("quiz_id", quizByModule.id)
                .order("completed_at", { ascending: false });

              quizAttempts = attempts || [];

              // Get quiz access token link
              const { data: tokenData } = await supabase
                .from("quiz_access_tokens")
                .select("token, is_active")
                .eq("quiz_id", quizByModule.id)
                .eq("is_active", true)
                .limit(1)
                .maybeSingle();

              if (tokenData) {
                quizLink = `${window.location.origin}/quiz?token=${tokenData.token}`;
              }
            }
          }

          // Get best score from attempts
          const bestAttempt = quizAttempts.length > 0 
            ? quizAttempts.reduce((best, current) => 
                current.score > best.score ? current : best
              )
            : null;

          return {
            ...module,
            quiz_id: quizInfo?.id || module.quiz_id,
            quiz_score: bestAttempt?.score,
            quiz_passed: bestAttempt?.passed,
            quiz_attempts_count: quizAttempts.length,
            quiz_max_attempts: quizInfo?.max_attempts || 3,
            quiz_link: quizLink,
          };
        })
      );

      setModules(modulesWithQuizResults);
    } catch (error: any) {
      console.error("Error fetching modules:", error);
      toast({
        title: "Error",
        description: "Failed to load modules",
        variant: "destructive",
      });
    }
  };

  const fetchLeaderboard = async (force = false) => {
    // Don't refetch if already loaded unless forced
    if (!force && leaderboardLoadedRef.current) {
      return;
    }
    
    setLoadingLeaderboard(true);
    try {
      const { data, error } = await supabase.rpc('get_learner_leaderboard', {
        _limit: 50
      });

      if (error) throw error;
      setLeaderboard(data || []);
      leaderboardLoadedRef.current = true;
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Helper function to show XP notification
  const showXPNotification = (xp: number, message: string) => {
    setXpNotification({ xp, message });
    setTimeout(() => setXpNotification(null), 5000);
  };

  const processRankUpNotifications = async () => {
    if (!learnerData) return;

    try {
      // Get unprocessed rank up notifications for this learner
      const { data: notifications, error } = await supabase
        .from("learner_rank_up_queue")
        .select("*")
        .eq("learner_id", learnerData.id)
        .eq("processed", false)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (notifications && notifications.length > 0) {
        const webhookUrl = "https://discord.com/api/webhooks/1440081131759472670/t8rAz113FcmJeYOOWqoGURrHQfB7wAuuMIFnfJQUwhUcZp9miLZ9aYWMMqZrV1Kv5aCH";

        for (const notification of notifications) {
          try {
            // Format Discord mention
            let mention = notification.discord_tag || '';
            // If it's in format username#1234, we can try to mention it
            // Discord mentions require user ID, but we can try the format
            const mentionText = mention ? `@${mention}` : notification.full_name;

            // Create Discord embed
            const embed = {
              title: "🎉 Rank Up!",
              description: `${mentionText} has ranked up to **${notification.new_rank}**!`,
              color: 16119244, // Gold color #f5c84c
              fields: [
                {
                  name: "Previous Rank",
                  value: notification.old_rank,
                  inline: true
                },
                {
                  name: "New Rank",
                  value: notification.new_rank,
                  inline: true
                },
                {
                  name: "Total XP",
                  value: `${notification.current_xp.toLocaleString()} XP`,
                  inline: true
                }
              ],
              footer: {
                text: "The Vault Network Academy"
              },
              timestamp: new Date(notification.created_at).toISOString()
            };

            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: mention ? `@${mention}` : undefined, // Include Discord tag in message
                embeds: [embed]
              }),
            });

            if (response.ok) {
              // Mark as processed
              await supabase
                .from("learner_rank_up_queue")
                .update({ processed: true })
                .eq("id", notification.id);
            }
          } catch (error: any) {
            console.error("Error sending rank up notification:", error);
          }
        }
      }
    } catch (error: any) {
      console.error("Error processing rank up notifications:", error);
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
        // Award XP for adding module (+200 XP)
        const { error: xpError } = await supabase.rpc('add_learner_xp', {
          _learner_id: learnerData.id,
          _xp_amount: 200,
          _event_type: 'module_added',
          _description: `Added module: ${data.module_title}`,
          _metadata: { module_id: data.module_id }
        });

        if (xpError) {
          console.error("Error awarding XP:", xpError);
          // Fallback direct update
          const { data: learner } = await supabase
            .from("learners")
            .select("current_xp")
            .eq("id", learnerData.id)
            .single();
          
          if (learner) {
            await supabase
              .from("learners")
              .update({ current_xp: (learner.current_xp || 0) + 200 })
              .eq("id", learnerData.id);
          }
        } else {
          // Show XP notification
          showXPNotification(200, `Added module: ${data.module_title}`);
        }

        // Refresh learner data to get updated XP and rank
        const { data: updatedLearner } = await supabase
          .from("learners")
          .select("current_xp, current_rank")
          .eq("id", learnerData.id)
          .single();
        
        if (updatedLearner) {
          setLearnerXP(updatedLearner.current_xp || 0);
          setLearnerRank(updatedLearner.current_rank || 'Beginner');
          
          const { data: rankInfo } = await supabase.rpc('get_next_learner_rank', {
            _xp: updatedLearner.current_xp || 0
          });
          if (rankInfo) {
            setNextRankInfo(rankInfo);
          }
        }

        // Refresh modules first to check if already exists
        await fetchModules(learnerData.id);
        
        // Refresh leaderboard (force refresh after adding module)
        await fetchLeaderboard(true);
        
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
      
      {/* XP Notification */}
      {xpNotification && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
          <Card className="bg-[#f5c84c] text-[#111111] border-[#f5c84c] shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <div>
                  <p className="font-bold">+{xpNotification.xp} XP</p>
                  <p className="text-sm opacity-90">{xpNotification.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="container mx-auto px-6 py-12 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="w-8 h-8 text-[#f5c84c]" />
            <h1 className="text-3xl md:text-4xl font-bold text-[#f5c84c]">Learner Dashboard</h1>
          </div>
          {learnerData && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Welcome back, <span className="font-semibold text-foreground">{learnerData.full_name}</span>
              </p>
              
              {/* XP Bar and Rank */}
              <Card className="border-[#f5c84c]/20 bg-background">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-[#f5c84c]" />
                        <div>
                          <p className="text-sm text-muted-foreground">Current Rank</p>
                          <p className="text-xl font-bold text-[#f5c84c]">{learnerRank}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total XP</p>
                          <p className="text-xl font-bold text-[#f5c84c]">{learnerXP.toLocaleString()}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#f5c84c]/30 text-[#f5c84c] hover:bg-[#f5c84c]/10"
                          onClick={() => navigate("/learner-progression")}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          View Progression
                        </Button>
                      </div>
                    </div>
                    
                    {nextRankInfo && nextRankInfo.next_rank && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progress to {nextRankInfo.next_rank}</span>
                          <span>{nextRankInfo.xp_needed} XP needed</span>
                        </div>
                        <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                          <div 
                            className="h-full bg-[#f5c84c] transition-all"
                            style={{ width: `${nextRankInfo.xp_for_next ? Math.min(100, (learnerXP / nextRankInfo.xp_for_next) * 100) : 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {learnerXP} / {nextRankInfo.xp_for_next} XP
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
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
                        <Badge variant="outline" className="text-[#f5c84c] border-[#f5c84c]/30">
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
                    <div className="space-y-3">
                      {/* Quiz Status Section */}
                      {module.quiz_link && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                          {module.quiz_attempts_count === 0 ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                                  <GraduationCap className="w-3 h-3 mr-1" />
                                  Quiz to do
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full border-[#f5c84c]/30 text-[#f5c84c] hover:bg-[#f5c84c]/10"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (module.quiz_link) {
                                    window.open(module.quiz_link, '_blank');
                                  }
                                }}
                              >
                                Start Quiz
                                <ArrowRight className="w-3 h-3 ml-2" />
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant={module.quiz_passed ? "default" : "secondary"}
                                  className={module.quiz_passed 
                                    ? "bg-green-500/20 text-green-500 border-green-500/30" 
                                    : "bg-orange-500/20 text-orange-500 border-orange-500/30"}
                                >
                                  <GraduationCap className="w-3 h-3 mr-1" />
                                  Quiz done: {module.quiz_attempts_count}/{module.quiz_max_attempts} attempts
                                </Badge>
                                {module.quiz_score !== undefined && (
                                  <span className="text-sm font-semibold text-[#f5c84c]">
                                    {module.quiz_score}%
                                  </span>
                                )}
                              </div>
                              {module.quiz_passed && (
                                <p className="text-xs text-green-500">✓ Passed</p>
                              )}
                              {module.quiz_attempts_count < module.quiz_max_attempts && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full border-[#f5c84c]/30 text-[#f5c84c] hover:bg-[#f5c84c]/10"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (module.quiz_link) {
                                      window.open(module.quiz_link, '_blank');
                                    }
                                  }}
                                >
                                  Retry Quiz
                                  <ArrowRight className="w-3 h-3 ml-2" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
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
                        className="w-full border-[#f5c84c]/30 text-[#f5c84c] hover:bg-[#f5c84c]/10"
                        onClick={async (e) => {
                          e.stopPropagation();
                          
                          // If first time accessing, award XP before navigating
                          if (!module.accessed_at && learnerData) {
                            const { error: xpError } = await supabase.rpc('add_learner_xp', {
                              _learner_id: learnerData.id,
                              _xp_amount: 150,
                              _event_type: 'module_opened',
                              _description: `Opened module: ${module.module_title}`,
                              _metadata: { module_id: module.module_id }
                            });

                            if (xpError) {
                              console.error("Error awarding XP:", xpError);
                              // Fallback direct update
                              const { data: learner } = await supabase
                                .from("learners")
                                .select("current_xp")
                                .eq("id", learnerData.id)
                                .single();
                              
                              if (learner) {
                                await supabase
                                  .from("learners")
                                  .update({ current_xp: (learner.current_xp || 0) + 150 })
                                  .eq("id", learnerData.id);
                              }
                            } else {
                              // Show XP notification
                              showXPNotification(150, `Opened module: ${module.module_title}`);
                            }

                            // Mark as accessed
                            await supabase
                              .from("learner_modules")
                              .update({ accessed_at: new Date().toISOString() })
                              .eq("id", module.id);
                          }
                          
                          navigate(`/learner-module/${module.id}`);
                        }}
                      >
                        {module.completed 
                          ? "Review Module" 
                          : module.accessed_at 
                            ? "Continue Learning" 
                            : "Start Module"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[#f5c84c]" />
              Leaderboard
            </h2>
            <Badge variant="outline" className="text-[#f5c84c] border-[#f5c84c]/30">
              Top Learners
            </Badge>
          </div>

          {loadingLeaderboard ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#f5c84c] mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading leaderboard...</p>
                </div>
              </CardContent>
            </Card>
          ) : leaderboard.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No leaderboard data yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => {
                    const isCurrentUser = entry.learner_id === learnerData?.id;
                    return (
                      <div
                        key={entry.learner_id}
                        className={`flex items-center gap-4 p-3 rounded-lg ${
                          isCurrentUser 
                            ? 'bg-[#f5c84c]/10 border border-[#f5c84c]/30' 
                            : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-[#f5c84c] text-[#111111]' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate ${isCurrentUser ? 'text-[#f5c84c]' : 'text-foreground'}`}>
                              {entry.full_name} {isCurrentUser && '(You)'}
                            </p>
                            <p className="text-xs text-muted-foreground">{entry.current_rank}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <p className="font-semibold text-[#f5c84c]">{entry.current_xp.toLocaleString()} XP</p>
                            <p className="text-xs text-muted-foreground">{entry.modules_completed} modules</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* n8n Template Library Section */}
        <div className="mb-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                n8n Template Library
              </CardTitle>
              <CardDescription>
                Browse and download ready-to-use n8n workflow templates from our Foundation Pack
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateLibrary />
            </CardContent>
          </Card>
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

