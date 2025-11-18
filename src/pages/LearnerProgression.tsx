import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Sparkles, ArrowLeft, CheckCircle2, Lock, TrendingUp } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const RANK_PROGRESSION = [
  { rank: "Beginner", xp: 0, color: "#6b7280" },
  { rank: "Initiate", xp: 500, color: "#8b5cf6" },
  { rank: "Explorer", xp: 1200, color: "#3b82f6" },
  { rank: "Trainee", xp: 2000, color: "#10b981" },
  { rank: "Novice", xp: 3000, color: "#f59e0b" },
  { rank: "Apprentice", xp: 4500, color: "#ef4444" },
  { rank: "Operator", xp: 6000, color: "#ec4899" },
  { rank: "System Builder", xp: 8000, color: "#06b6d4" },
  { rank: "Flow Starter", xp: 10500, color: "#6366f1" },
  { rank: "Automation Rookie", xp: 13000, color: "#14b8a6" },
  { rank: "Specialist", xp: 16000, color: "#f97316" },
  { rank: "Mechanic", xp: 20000, color: "#eab308" },
  { rank: "Debugger", xp: 25000, color: "#22c55e" },
  { rank: "Workflow Adept", xp: 30000, color: "#3b82f6" },
  { rank: "Journeyman", xp: 36000, color: "#8b5cf6" },
  { rank: "Architect", xp: 43000, color: "#ec4899" },
  { rank: "Technician", xp: 51000, color: "#f59e0b" },
  { rank: "Engineer", xp: 60000, color: "#10b981" },
  { rank: "Senior Engineer", xp: 70000, color: "#06b6d4" },
  { rank: "Vault Specialist", xp: 82000, color: "#6366f1" },
  { rank: "Master Builder", xp: 95000, color: "#f97316" },
  { rank: "Systems Strategist", xp: 110000, color: "#eab308" },
  { rank: "Integration Pro", xp: 126000, color: "#22c55e" },
  { rank: "Automation Analyst", xp: 143000, color: "#3b82f6" },
  { rank: "High-Tier Automator", xp: 160000, color: "#8b5cf6" },
  { rank: "Elite Engineer", xp: 180000, color: "#ec4899" },
  { rank: "Grand Operator", xp: 205000, color: "#f59e0b" },
  { rank: "Legend of Workflows", xp: 235000, color: "#10b981" },
  { rank: "Vault Champion", xp: 270000, color: "#06b6d4" },
  { rank: "The Vault Master", xp: 300000, color: "#f5c84c" },
];

const LearnerProgression = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [learnerXP, setLearnerXP] = useState(0);
  const [learnerRank, setLearnerRank] = useState("Beginner");
  const [loading, setLoading] = useState(true);

  usePageMeta({
    title: "Progression - The Vault Network",
    description: "View your rank progression and XP milestones",
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchLearnerData();
    } else if (!authLoading && !user) {
      navigate("/learners");
    }
  }, [user, authLoading]);

  const fetchLearnerData = async () => {
    try {
      const { data: learner, error } = await supabase
        .from("learners")
        .select("current_xp, current_rank")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      if (learner) {
        setLearnerXP(learner.current_xp || 0);
        setLearnerRank(learner.current_rank || "Beginner");
      }
    } catch (error: any) {
      console.error("Error fetching learner data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentRankIndex = () => {
    return RANK_PROGRESSION.findIndex(r => r.rank === learnerRank);
  };

  const getRankProgress = (rankIndex: number) => {
    if (rankIndex === 0) return 0;
    const currentRankXP = RANK_PROGRESSION[rankIndex].xp;
    const previousRankXP = RANK_PROGRESSION[rankIndex - 1].xp;
    const xpInRank = learnerXP - previousRankXP;
    const xpNeededForRank = currentRankXP - previousRankXP;
    return Math.min(100, Math.max(0, (xpInRank / xpNeededForRank) * 100));
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-8 h-8 animate-pulse text-[#f5c84c] mx-auto mb-4" />
          <p className="text-muted-foreground">Loading progression...</p>
        </div>
      </div>
    );
  }

  const currentRankIndex = getCurrentRankIndex();
  const nextRank = currentRankIndex < RANK_PROGRESSION.length - 1 
    ? RANK_PROGRESSION[currentRankIndex + 1] 
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-12 pt-24">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/learner-dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-[#f5c84c]" />
            <h1 className="text-3xl md:text-4xl font-bold text-[#f5c84c]">Rank Progression</h1>
          </div>
          <p className="text-muted-foreground">
            Track your journey from Beginner to The Vault Master
          </p>
        </div>

        {/* Current Status */}
        <Card className="mb-8 border-[#f5c84c]/20 bg-gradient-to-r from-[#f5c84c]/10 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Rank</p>
                <p className="text-3xl font-bold text-[#f5c84c]">{learnerRank}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Total XP</p>
                <p className="text-3xl font-bold text-[#f5c84c]">{learnerXP.toLocaleString()}</p>
              </div>
            </div>
            {nextRank && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress to {nextRank.rank}</span>
                  <span className="text-[#f5c84c]">
                    {learnerXP.toLocaleString()} / {nextRank.xp.toLocaleString()} XP
                  </span>
                </div>
                <Progress 
                  value={getRankProgress(currentRankIndex + 1)} 
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground text-center">
                  {nextRank.xp - learnerXP} XP needed to reach {nextRank.rank}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rank List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {RANK_PROGRESSION.map((rank, index) => {
            const isUnlocked = learnerXP >= rank.xp;
            const isCurrent = rank.rank === learnerRank;
            const progress = index > 0 ? getRankProgress(index) : (learnerXP >= rank.xp ? 100 : 0);

            return (
              <Card
                key={rank.rank}
                className={`relative overflow-hidden transition-all ${
                  isCurrent
                    ? "border-[#f5c84c] border-2 shadow-lg scale-105 bg-gradient-to-br from-[#f5c84c]/20 to-transparent"
                    : isUnlocked
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-muted opacity-60"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {isCurrent ? (
                        <Trophy className="w-5 h-5 text-[#f5c84c]" />
                      ) : isUnlocked ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      )}
                      {rank.rank}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: rank.color, color: rank.color }}
                    >
                      {rank.xp.toLocaleString()} XP
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Rank #{index + 1}</span>
                      {isCurrent && (
                        <Badge className="bg-[#f5c84c] text-[#111111] text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    {index > 0 && !isUnlocked && (
                      <Progress value={progress} className="h-2" />
                    )}
                    {isUnlocked && index > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-500">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Unlocked</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                {isCurrent && (
                  <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-[#f5c84c]" />
                )}
              </Card>
            );
          })}
        </div>

        {/* XP Milestones Info */}
        <Card className="mt-8 border-[#f5c84c]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#f5c84c]" />
              How to Earn XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="font-semibold text-[#f5c84c]">Module Activities</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Adding a module: +200 XP</li>
                  <li>• Opening a module (first time): +150 XP</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-[#f5c84c]">Quiz Completion</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Quiz score: 0-1000 XP (scaled by percentage)</li>
                  <li>• Only higher scores award additional XP</li>
                  <li>• Maximum 3 attempts per quiz</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default LearnerProgression;

