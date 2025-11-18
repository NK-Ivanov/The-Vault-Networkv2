import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePageMeta } from "@/hooks/usePageMeta";
import { CheckCircle2, XCircle, Clock, RefreshCw, ArrowLeft, Trophy, AlertCircle } from "lucide-react";
// Progress component removed - not needed for quiz

interface QuizQuestion {
  id: string;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  passing_score: number;
  time_limit_minutes?: number;
  max_attempts: number;
  module_id?: string;
}

const Quiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const quizFetchedRef = useRef(false);

  const sendRankUpNotification = async (learnerId: string, oldRank: string, newRank: string, currentXP: number) => {
    try {
      // Get learner data including Discord tag
      const { data: learner } = await supabase
        .from("learners")
        .select("discord_tag, full_name")
        .eq("id", learnerId)
        .single();

      if (!learner || !learner.discord_tag) {
        return; // No Discord tag, skip notification
      }

      const webhookUrl = "https://discord.com/api/webhooks/1440081131759472670/t8rAz113FcmJeYOOWqoGURrHQfB7wAuuMIFnfJQUwhUcZp9miLZ9aYWMMqZrV1Kv5aCH";

      // Create Discord embed
      const embed = {
        title: "🎉 Rank Up!",
        description: `${learner.full_name} has ranked up to **${newRank}**!`,
        color: 16119244, // Gold color #f5c84c
        fields: [
          {
            name: "Previous Rank",
            value: oldRank,
            inline: true
          },
          {
            name: "New Rank",
            value: newRank,
            inline: true
          },
          {
            name: "Total XP",
            value: `${currentXP.toLocaleString()} XP`,
            inline: true
          }
        ],
        footer: {
          text: "The Vault Network Academy"
        },
        timestamp: new Date().toISOString()
      };

      // Try to mention the user - Discord mentions need user ID, but we can try the tag format
      // Format: username#1234 or username
      // Note: Discord webhooks can't actually mention users by tag, but we'll include it in the message
      let mentionContent = '';
      if (learner.discord_tag) {
        // Include the Discord tag in the message content
        // Discord webhooks can't ping users directly, but we can include their tag
        mentionContent = `@${learner.discord_tag}`;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: mentionContent,
          embeds: [embed]
        }),
      });

      if (!response.ok) {
        console.error("Failed to send rank up notification:", await response.text());
      }
    } catch (error: any) {
      console.error("Error sending rank up notification:", error);
      // Don't throw - this shouldn't block the quiz submission
    }
  };

  usePageMeta({
    title: quiz ? `${quiz.title} - Quiz` : "Quiz - The Vault Network",
    description: quiz?.description || "Take the quiz",
  });

  useEffect(() => {
    // Reset ref when token changes (new quiz)
    quizFetchedRef.current = false;
    
    if (token && user) {
      fetchQuiz();
    } else if (!token) {
      toast({
        title: "Invalid Quiz Link",
        description: "No quiz token provided",
        variant: "destructive",
      });
      setLoading(false);
      navigate("/");
    } else if (!user) {
      // Wait for user to load
      setLoading(false);
    }
  }, [token, user?.id]); // Only depend on user.id, not the whole user object

  useEffect(() => {
    if (quiz?.time_limit_minutes && !submitted) {
      const totalSeconds = quiz.time_limit_minutes * 60;
      setTimeRemaining(totalSeconds);
      
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            if (prev === 1) {
              handleSubmit();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [quiz, submitted]);

  const fetchQuiz = async () => {
    if (!token || !user) {
      setLoading(false);
      return;
    }

    // Don't refetch if already loaded for this token
    if (quizFetchedRef.current) {
      return;
    }

    quizFetchedRef.current = true;
    setLoading(true);
    try {
      // Get learner ID
      const { data: learner, error: learnerError } = await supabase
        .from("learners")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (learnerError) {
        console.error("Error fetching learner:", learnerError);
        throw learnerError;
      }

      if (!learner) {
        toast({
          title: "Access Denied",
          description: "You must be enrolled as a learner to take quizzes",
          variant: "destructive",
        });
        setLoading(false);
        navigate("/learners");
        return;
      }

      setLearnerId(learner.id);

      // Get quiz token
      const { data: tokenData, error: tokenError } = await supabase
        .from("quiz_access_tokens")
        .select(`
          *,
          quizzes (*)
        `)
        .eq("token", token)
        .eq("is_active", true)
        .maybeSingle();

      if (tokenError) {
        console.error("Error fetching quiz token:", tokenError);
        throw tokenError;
      }

      if (!tokenData) {
        throw new Error("Invalid or expired quiz link");
      }

      // Check expiration
      if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
        throw new Error("This quiz link has expired");
      }

      // Check max uses
      if (tokenData.max_uses && tokenData.current_uses >= tokenData.max_uses) {
        throw new Error("This quiz link has reached its maximum uses");
      }

      const quizData = tokenData.quizzes as any;
      if (!quizData) {
        throw new Error("Quiz not found");
      }

      setQuiz(quizData);

      // Get questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizData.id)
        .order("question_number", { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Increment token usage
      await supabase
        .from("quiz_access_tokens")
        .update({ current_uses: (tokenData.current_uses || 0) + 1 })
        .eq("id", tokenData.id);

    } catch (error: any) {
      console.error("Error fetching quiz:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load quiz",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!quiz || !learnerId || submitting || submitted) return;

    setSubmitting(true);
    try {
      // Calculate score
      let correct = 0;
      const answerRecord: Record<string, string> = {};

      questions.forEach((q) => {
        answerRecord[q.question_number.toString()] = answers[q.question_number] || "";
        if (answers[q.question_number] === q.correct_answer) {
          correct++;
        }
      });

      const percentage = Math.round((correct / questions.length) * 100);
      const passedQuiz = percentage >= quiz.passing_score;

      setScore(percentage);
      setPassed(passedQuiz);

      // Check attempt count (max 3 attempts)
      const { data: previousAttempts } = await supabase
        .from("quiz_attempts")
        .select("id, score")
        .eq("quiz_id", quiz.id)
        .eq("learner_id", learnerId)
        .order("completed_at", { ascending: false });

      const attemptCount = previousAttempts?.length || 0;
      if (attemptCount >= quiz.max_attempts) {
        toast({
          title: "Max Attempts Reached",
          description: `You have reached the maximum of ${quiz.max_attempts} attempts for this quiz`,
          variant: "destructive",
        });
        return;
      }

      // Get best score so far
      const bestScore = previousAttempts && previousAttempts.length > 0
        ? Math.max(...previousAttempts.map(a => a.score))
        : 0;

      // Calculate XP: score% of 1000 XP
      const newXP = Math.round((percentage * 1000) / 100);
      const previousXP = Math.round((bestScore * 1000) / 100);
      const xpDifference = newXP - previousXP;

      // Verify learner_id is set
      if (!learnerId) {
        throw new Error("Learner ID is missing. Please ensure you are logged in as a learner.");
      }

      // Double-check that the learner exists and belongs to the current user
      const { data: learnerCheck, error: learnerCheckError } = await supabase
        .from("learners")
        .select("id, user_id")
        .eq("id", learnerId)
        .eq("user_id", user?.id)
        .single();

      if (learnerCheckError || !learnerCheck) {
        console.error("Learner verification failed:", learnerCheckError);
        throw new Error("Unable to verify learner account. Please ensure you are logged in as a learner.");
      }

      // Save attempt
      const { data: attemptData, error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert({
          quiz_id: quiz.id,
          learner_id: learnerId,
          score: percentage,
          passed: passedQuiz,
          answers: answerRecord,
          time_taken_seconds: quiz.time_limit_minutes 
            ? (quiz.time_limit_minutes * 60) - (timeRemaining || 0)
            : null,
        })
        .select()
        .single();

      if (attemptError) {
        console.error("Quiz attempt error details:", attemptError);
        // More detailed error message
        if (attemptError.code === '42501' || attemptError.message.includes('permission') || attemptError.message.includes('403')) {
          throw new Error("Permission denied. Please ensure you are logged in as a learner and have access to this quiz.");
        }
        throw attemptError;
      }

      // Award XP only if new score is higher than previous best
      if (xpDifference > 0) {
        // Get current rank before XP update
        const { data: learnerBefore } = await supabase
          .from("learners")
          .select("current_rank, current_xp")
          .eq("id", learnerId)
          .single();

        const oldRank = learnerBefore?.current_rank || 'Beginner';

        const { error: xpError } = await supabase.rpc('add_learner_xp', {
          _learner_id: learnerId,
          _xp_amount: xpDifference,
          _event_type: 'quiz_completed',
          _description: `Quiz: ${quiz.title} - Score: ${percentage}%`,
          _metadata: {
            quiz_id: quiz.id,
            quiz_title: quiz.title,
            score: percentage,
            attempt_number: attemptCount + 1
          }
        });

        if (xpError) {
          console.error("Error awarding XP:", xpError);
          // Fallback: direct update if RPC doesn't exist
          // First get current XP
          const { data: learnerData } = await supabase
            .from("learners")
            .select("current_xp, current_rank")
            .eq("id", learnerId)
            .single();

          const currentXP = learnerData?.current_xp || 0;
          const currentRank = learnerData?.current_rank || 'Beginner';
          
          const newXP = currentXP + xpDifference;
          const newRank = await supabase.rpc('calculate_learner_rank', { _xp: newXP });
          
          const { error: directXPError } = await supabase
            .from("learners")
            .update({ 
              current_xp: newXP,
              current_rank: newRank.data || currentRank
            })
            .eq("id", learnerId);

          if (directXPError) {
            console.error("Error updating XP directly:", directXPError);
          } else {
            toast({
              title: "XP Awarded!",
              description: `You earned ${xpDifference} XP (${newXP} total - ${previousXP} previous)`,
            });
            
            // Check for rank up and send notification
            if (oldRank !== (newRank.data || currentRank)) {
              await sendRankUpNotification(learnerId, oldRank, newRank.data || currentRank, newXP);
            }
          }
        } else {
          // Get new XP and rank after the RPC call
          const { data: learnerAfter } = await supabase
            .from("learners")
            .select("current_rank, current_xp")
            .eq("id", learnerId)
            .single();
          
          const finalXP = learnerAfter?.current_xp || newXP;
          
          toast({
            title: "XP Awarded!",
            description: `You earned ${xpDifference} XP (${finalXP} total - ${previousXP} previous)`,
          });
          
          if (learnerAfter && oldRank !== learnerAfter.current_rank) {
            await sendRankUpNotification(learnerId, oldRank, learnerAfter.current_rank, finalXP);
          }
        }
      } else if (percentage <= bestScore) {
        toast({
          title: "No XP Change",
          description: `Your score of ${percentage}% didn't beat your best of ${bestScore}%`,
        });
      }

      // If quiz passed, mark associated module as complete
      if (passedQuiz) {
        let moduleToComplete = null;

        // First, try to find module by quiz_id (most reliable)
        const { data: modulesByQuiz } = await supabase
          .from("learner_modules")
          .select("id, module_id")
          .eq("learner_id", learnerId)
          .eq("quiz_id", quiz.id);

        if (modulesByQuiz && modulesByQuiz.length > 0) {
          moduleToComplete = modulesByQuiz[0];
        }

        // If not found by quiz_id, try to find module by quiz.module_id
        if (!moduleToComplete && quiz.module_id) {
          const { data: learnerModules } = await supabase
            .from("learner_modules")
            .select("id, module_id")
            .eq("learner_id", learnerId)
            .eq("module_id", quiz.module_id);

          if (learnerModules && learnerModules.length > 0) {
            moduleToComplete = learnerModules[0];
          }
        }

        // If not found, try to find module that contains this quiz link in its HTML
        if (!moduleToComplete && token) {
          const { data: allModules } = await supabase
            .from("learner_modules")
            .select("id, module_id, module_content")
            .eq("learner_id", learnerId);

          if (allModules) {
            // Search for module that contains this quiz token in its HTML
            for (const module of allModules) {
              if (module.module_content && typeof module.module_content === 'object' && module.module_content.type === 'html') {
                const html = module.module_content.html || '';
                // Check if the HTML contains this quiz token
                if (html.includes(token)) {
                  moduleToComplete = module;
                  break;
                }
              }
            }
          }
        }

        // Mark the module as complete if found
        if (moduleToComplete) {
          const { error: updateError } = await supabase
            .from("learner_modules")
            .update({
              completed: true,
              completed_at: new Date().toISOString(),
            })
            .eq("id", moduleToComplete.id);

          if (updateError) {
            console.error("Error marking module as complete:", updateError);
          } else {
            console.log("Module marked as complete:", moduleToComplete.module_id);
            toast({
              title: "Module Completed! 🎉",
              description: "The associated module has been marked as complete",
            });
          }
        } else {
          console.warn("Could not find module to mark as complete. Quiz module_id:", quiz.module_id, "Token:", token);
        }
      }

      setSubmitted(true);

      toast({
        title: passedQuiz ? "Quiz Passed! 🎉" : "Quiz Completed",
        description: `You scored ${percentage}% (${correct}/${questions.length} correct)`,
      });
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      toast({
        title: "Error",
        description: "Failed to submit quiz",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12 pt-24 text-center">
          <p className="text-muted-foreground">Quiz not found</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Home
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-12 pt-24 max-w-4xl">
        {/* Quiz Header */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{quiz.title}</CardTitle>
                {quiz.description && (
                  <CardDescription className="text-base">{quiz.description}</CardDescription>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span>Passing Score: {quiz.passing_score}%</span>
                  <span>•</span>
                  <span>{questions.length} Questions</span>
                  {quiz.time_limit_minutes && (
                    <>
                      <span>•</span>
                      <span>Time Limit: {quiz.time_limit_minutes} minutes</span>
                    </>
                  )}
                </div>
              </div>
              {timeRemaining !== null && !submitted && (
                <Badge variant={timeRemaining < 60 ? "destructive" : "default"} className="text-lg px-3 py-1">
                  <Clock className="w-4 h-4 mr-2" />
                  {formatTime(timeRemaining)}
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {submitted ? (
          /* Results Screen */
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
                  passed ? "bg-green-500/20" : "bg-red-500/20"
                }`}>
                  {passed ? (
                    <Trophy className="w-10 h-10 text-green-500" />
                  ) : (
                    <XCircle className="w-10 h-10 text-red-500" />
                  )}
                </div>
                <h2 className="text-3xl font-bold">
                  {passed ? "Congratulations! 🎉" : "Quiz Completed"}
                </h2>
                <p className="text-2xl font-semibold">
                  Score: {score}%
                </p>
                <p className="text-muted-foreground">
                  {passed 
                    ? `You passed with ${score}%! Great job completing the quiz.`
                    : `You scored ${score}%. You need ${quiz.passing_score}% to pass. You can retake this quiz.`
                  }
                </p>
                
                {/* Question Review */}
                <div className="mt-8 space-y-4 text-left">
                  <h3 className="text-xl font-semibold">Question Review</h3>
                  {questions.map((q) => {
                    const userAnswer = answers[q.question_number];
                    const isCorrect = userAnswer === q.correct_answer;
                    return (
                      <Card key={q.id} className={isCorrect ? "border-green-500/50" : "border-red-500/50"}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-2 mb-3">
                            {isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="font-semibold mb-2">
                                Question {q.question_number}: {q.question_text}
                              </p>
                              <div className="space-y-1 text-sm">
                                <div className={userAnswer === "A" ? (isCorrect ? "text-green-600 font-semibold" : "text-red-600 font-semibold") : ""}>
                                  A. {q.option_a} {userAnswer === "A" && !isCorrect && " (Your answer)"}
                                </div>
                                <div className={userAnswer === "B" ? (isCorrect ? "text-green-600 font-semibold" : "text-red-600 font-semibold") : ""}>
                                  B. {q.option_b} {userAnswer === "B" && !isCorrect && " (Your answer)"}
                                </div>
                                <div className={userAnswer === "C" ? (isCorrect ? "text-green-600 font-semibold" : "text-red-600 font-semibold") : ""}>
                                  C. {q.option_c} {userAnswer === "C" && !isCorrect && " (Your answer)"}
                                </div>
                                <div className={userAnswer === "D" ? (isCorrect ? "text-green-600 font-semibold" : "text-red-600 font-semibold") : ""}>
                                  D. {q.option_d} {userAnswer === "D" && !isCorrect && " (Your answer)"}
                                </div>
                                <div className="mt-2 text-green-600 font-semibold">
                                  ✓ Correct Answer: {q.correct_answer}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex gap-4 justify-center mt-6">
                  <Button onClick={() => navigate("/learner-dashboard")}>
                    Back to Dashboard
                  </Button>
                  {!passed && (
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retake Quiz
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Quiz Questions */
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="space-y-6">
              {questions.map((question, index) => (
                <Card key={question.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-1">
                          {question.question_number}
                        </Badge>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-4">
                            {question.question_text}
                          </h3>
                          <RadioGroup
                            value={answers[question.question_number] || ""}
                            onValueChange={(value) => {
                              setAnswers(prev => ({
                                ...prev,
                                [question.question_number]: value
                              }));
                            }}
                          >
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                                <RadioGroupItem value="A" id={`q${question.id}-a`} />
                                <Label htmlFor={`q${question.id}-a`} className="flex-1 cursor-pointer">
                                  A. {question.option_a}
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                                <RadioGroupItem value="B" id={`q${question.id}-b`} />
                                <Label htmlFor={`q${question.id}-b`} className="flex-1 cursor-pointer">
                                  B. {question.option_b}
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                                <RadioGroupItem value="C" id={`q${question.id}-c`} />
                                <Label htmlFor={`q${question.id}-c`} className="flex-1 cursor-pointer">
                                  C. {question.option_c}
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                                <RadioGroupItem value="D" id={`q${question.id}-d`} />
                                <Label htmlFor={`q${question.id}-d`} className="flex-1 cursor-pointer">
                                  D. {question.option_d}
                                </Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {Object.keys(answers).length} of {questions.length} questions answered
              </div>
              <Button
                type="submit"
                disabled={submitting || Object.keys(answers).length < questions.length}
                className="bg-primary hover:bg-primary/90"
                size="lg"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Quiz
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Quiz;

