import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles, BookOpen, X, ChevronRight, ChevronLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface VaultModuleViewerProps {
  moduleId: string;
  sellerId: string;
  onComplete?: () => void;
  onClose?: () => void;
}

interface SlideElement {
  type: 'heading' | 'paragraph' | 'list' | 'image' | 'code' | 'quote' | 'alert' | 'button' | 'separator' | 'badge';
  content?: string;
  level?: number; // For heading
  items?: string[]; // For list
  src?: string; // For image
  alt?: string; // For image
  language?: string; // For code
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'; // For alert, badge
  url?: string; // For button
  text?: string; // For button, badge
}

interface Slide {
  id: string;
  title: string;
  elements: SlideElement[];
}

interface QuizQuestion {
  question: string;
  answers: string[];
  correct: number;
  explanation?: string;
}

interface ModuleData {
  title: string;
  category: string;
  xp_reward: number;
  slides: Slide[];
  quiz: QuizQuestion[];
}

const VaultModuleViewer = ({ moduleId, sellerId, onComplete, onClose }: VaultModuleViewerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState<any>(null);
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [completedSlides, setCompletedSlides] = useState<string[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [bestQuizScore, setBestQuizScore] = useState<number | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [hideQuizResults, setHideQuizResults] = useState(false);
  const [showModuleContent, setShowModuleContent] = useState(true); // Always show module content initially
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0); // Track current quiz question

  useEffect(() => {
    fetchModule();
  }, [moduleId, sellerId]);

  useEffect(() => {
    if (moduleData) {
      fetchProgress();
    }
  }, [moduleData, moduleId, sellerId]);

  // Handle quiz opening from library card
  useEffect(() => {
    if (moduleData && progress) {
      const shouldOpenQuiz = sessionStorage.getItem(`openQuiz_${moduleId}`);
      if (shouldOpenQuiz) {
        sessionStorage.removeItem(`openQuiz_${moduleId}`);
        
        // If quiz is completed and can retake, show results first (not quiz dialog)
        if (progress?.quiz_completed && (progress?.quiz_attempts || 0) < 3) {
          // Show quiz results card with retake option
          setQuizSubmitted(true);
          setQuizScore(progress.quiz_score || null);
          setQuizAttempts(progress.quiz_attempts || 0);
          setBestQuizScore(progress.best_quiz_score || null);
          setShowQuiz(false);
          setShowModuleContent(false); // Don't show module content, show results
          setHideQuizResults(false); // Show quiz results
          setQuizAnswers({}); // Clear answers for retake
        } else if (completedSlides.length >= moduleData.slides.length && !progress?.quiz_completed) {
          // First time taking quiz - open quiz dialog directly
          setShowQuiz(true);
          setShowModuleContent(false);
          setHideQuizResults(true);
          setCurrentQuizQuestion(0);
        }
      }
    }
  }, [completedSlides, moduleData, progress, moduleId]);

  const fetchModule = async () => {
    try {
      const { data, error } = await supabase
        .from("vault_library_modules")
        .select("*")
        .eq("id", moduleId)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Module not found");

      setModule(data);
      
      // Handle both old and new format
      const dataObj = data.module_data as any;
      if (dataObj.slides) {
        // New format with slides
        setModuleData(data.module_data as ModuleData);
      } else if (dataObj.sections) {
        // Old format with sections - convert to slides
        const convertedData: ModuleData = {
          title: dataObj.title,
          category: dataObj.category,
          xp_reward: dataObj.xp_reward,
          slides: dataObj.sections.map((section: any, index: number) => ({
            id: `slide-${index}`,
            title: section.title,
            elements: [
              {
                type: 'paragraph',
                content: section.content
              }
            ]
          })),
          quiz: dataObj.quiz || []
        };
        setModuleData(convertedData);
      } else {
        setModuleData(data.module_data as ModuleData);
      }
    } catch (error: any) {
      console.error("Error fetching module:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load module",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from("vault_library_module_progress")
        .select("*")
        .eq("seller_id", sellerId)
        .eq("module_id", moduleId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProgress(data);
        
        // Handle both old format (indices) and new format (slide IDs)
        const completed = (data.completed_sections as (string | number)[]) || [];
        const slideIds = moduleData ? moduleData.slides.map(s => s.id) : [];
        
        // Convert to slide IDs if they're indices (backward compatibility)
        const completedSlidesList = completed.map(c => {
          if (typeof c === 'number' && moduleData) {
            // Old format - convert index to slide ID
            return moduleData.slides[c]?.id || c.toString();
          }
          return c.toString();
        });
        
        setCompletedSlides(completedSlidesList);
        setQuizAttempts(data.quiz_attempts || 0);
        setBestQuizScore(data.best_quiz_score || null);
        
        // Set current slide based on progress
        if (moduleData && completedSlidesList.length > 0) {
          const lastCompleted = completedSlidesList[completedSlidesList.length - 1];
          const slideIndex = moduleData.slides.findIndex(s => s.id === lastCompleted);
          if (slideIndex >= 0 && slideIndex < moduleData.slides.length - 1) {
            setCurrentSlideIndex(slideIndex + 1);
          } else {
            setCurrentSlideIndex(slideIndex >= 0 ? slideIndex : 0);
          }
        } else {
          setCurrentSlideIndex(data.current_section || 0);
        }
        
        if (data.quiz_completed && data.quiz_attempts >= 3) {
          setQuizAnswers((data.quiz_answers as Record<number, number>) || {});
          setQuizSubmitted(true);
          setQuizScore(data.quiz_score || null);
          setShowQuiz(false);
          setShowModuleContent(true);
          setHideQuizResults(true); // Hide results when viewing completed module
        } else if (data.quiz_completed && data.quiz_attempts < 3) {
          setQuizAnswers({});
          setQuizSubmitted(true);
          setQuizScore(data.quiz_score || null);
          setShowQuiz(false);
          setShowModuleContent(true);
          setHideQuizResults(true); // Hide results when viewing module normally
        } else {
          setQuizAnswers({});
          setQuizSubmitted(false);
          setQuizScore(null);
          setHideQuizResults(true); // Hide results when viewing module normally
          setShowModuleContent(true); // Show module content
        }
      } else {
        // Initialize progress if doesn't exist
        setCurrentSlideIndex(0);
        setCompletedSlides([]);
        setQuizSubmitted(false);
        setQuizScore(null);
        setQuizAttempts(0);
        setBestQuizScore(null);
        setHideQuizResults(true); // Hide results initially
        setShowModuleContent(true); // Show module content
      }
    } catch (error: any) {
      console.error("Error fetching progress:", error);
    }
  };

  const handleSlideComplete = async () => {
    if (!moduleData) return;

    const currentSlide = moduleData.slides[currentSlideIndex];
    if (!currentSlide || completedSlides.includes(currentSlide.id)) return;

    const newCompletedSlides = [...completedSlides, currentSlide.id];
    setCompletedSlides(newCompletedSlides);

    try {
      const progressData = {
        seller_id: sellerId,
        module_id: moduleId,
        current_section: currentSlideIndex,
        completed_sections: newCompletedSlides,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("vault_library_module_progress")
        .upsert(progressData, {
          onConflict: "seller_id,module_id",
        });

      if (error) throw error;

      // Move to next slide if not the last one
      if (currentSlideIndex < moduleData.slides.length - 1) {
        setCurrentSlideIndex(currentSlideIndex + 1);
      }
    } catch (error: any) {
      console.error("Error saving progress:", error);
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive",
      });
    }
  };

  const handleQuizSubmit = async () => {
    if (!moduleData) {
      toast({
        title: "Error",
        description: "Module data not loaded",
        variant: "destructive",
      });
      return;
    }

    // Validate all questions are answered
    if (Object.keys(quizAnswers).length < moduleData.quiz.length) {
      toast({
        title: "Incomplete Quiz",
        description: `Please answer all ${moduleData.quiz.length} questions before submitting.`,
        variant: "destructive",
      });
      return;
    }

    // Check for unanswered questions (including index 0)
    for (let i = 0; i < moduleData.quiz.length; i++) {
      if (quizAnswers[i] === undefined || quizAnswers[i] === null) {
        toast({
          title: "Incomplete Quiz",
          description: `Please answer question ${i + 1} before submitting.`,
          variant: "destructive",
        });
        setCurrentQuizQuestion(i); // Navigate to unanswered question
        return;
      }
    }

    setSubmittingQuiz(true);
    try {
      let correct = 0;
      moduleData.quiz.forEach((q, index) => {
        if (quizAnswers[index] === q.correct) {
          correct++;
        }
      });
      const score = Math.round((correct / moduleData.quiz.length) * 100);

      const currentAttempts = progress?.quiz_attempts || 0;
      const currentBestScore = progress?.best_quiz_score || null;
      
      // Cap attempts at 3
      if (currentAttempts >= 3) {
        toast({
          title: "Quiz Already Completed",
          description: "You have already used all 3 attempts for this quiz.",
          variant: "destructive",
        });
        setSubmittingQuiz(false);
        return;
      }
      
      const newAttempts = Math.min(currentAttempts + 1, 3); // Cap at 3
      const newBestScore = currentBestScore === null ? score : Math.max(currentBestScore, score);

      setQuizScore(score);
      setQuizAttempts(newAttempts);
      setBestQuizScore(newBestScore);
      const isFinalAttempt = newAttempts >= 3;
      setQuizSubmitted(true);
      setShowQuiz(false);
      setShowModuleContent(false); // Don't show module content immediately, show results first
      setHideQuizResults(false); // Show quiz results
      setCurrentQuizQuestion(0); // Reset to first question for next attempt

      const progressData = {
        seller_id: sellerId,
        module_id: moduleId,
        quiz_answers: quizAnswers,
        quiz_score: score,
        quiz_attempts: newAttempts,
        best_quiz_score: newBestScore,
        quiz_completed: isFinalAttempt,
        module_completed: isFinalAttempt,
        completed_at: isFinalAttempt ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { error: progressError, data: savedProgress } = await supabase
        .from("vault_library_module_progress")
        .upsert(progressData, {
          onConflict: "seller_id,module_id",
        })
        .select()
        .single();

      if (progressError) {
        console.error("Error saving quiz progress:", progressError);
        throw progressError;
      }

      // Update local progress state immediately
      if (savedProgress) {
        setProgress(savedProgress);
        // Sync quiz attempts with saved progress to ensure UI is correct
        const savedAttempts = savedProgress.quiz_attempts || newAttempts;
        setQuizAttempts(savedAttempts);
        setBestQuizScore(savedProgress.best_quiz_score || newBestScore);
        console.log('Progress saved and synced:', { 
          savedAttempts, 
          newAttempts, 
          quizAttempts: savedAttempts,
          canRetake: savedAttempts < 3 
        });
        
        // Check if XP should be awarded using saved progress (more reliable)
        const shouldAwardXP = !savedProgress.xp_awarded;
        
        if (shouldAwardXP) {
          console.log('Awarding XP for module completion:', {
            seller_id: sellerId,
            xp_amount: moduleData.xp_reward,
            module_title: moduleData.title
          });
          
          const { data: xpResult, error: xpError } = await supabase.rpc("add_seller_xp", {
            _seller_id: sellerId,
            _xp_amount: moduleData.xp_reward,
            _event_type: "vault_module_completed",
            _description: `Completed module: ${moduleData.title}`,
            _metadata: {
              module_id: moduleId,
              module_title: moduleData.title,
              quiz_score: score,
              quiz_attempt: newAttempts,
              best_score: newBestScore,
            },
          });

          if (xpError) {
            console.error("Error awarding XP:", xpError);
            toast({
              title: "XP Award Error",
              description: `Failed to award XP: ${xpError.message}`,
              variant: "destructive",
            });
          } else {
            console.log('XP awarded successfully:', xpResult);
            
            // Mark XP as awarded
            const { error: updateError } = await supabase
              .from("vault_library_module_progress")
              .update({ xp_awarded: true })
              .eq("seller_id", sellerId)
              .eq("module_id", moduleId);
              
            if (updateError) {
              console.error("Error updating xp_awarded flag:", updateError);
            } else {
              // Update local progress state
              setProgress({ ...savedProgress, xp_awarded: true });
            }
          }
        } else {
          console.log('XP already awarded for this module');
        }
      }
      
      // Check if XP was awarded from saved progress
      const xpWasAwarded = savedProgress?.xp_awarded || false;

      if (isFinalAttempt) {
        toast({
          title: "Module Completed! 🎉",
          description: `You scored ${score}% on attempt ${newAttempts}. Best score: ${newBestScore}%. ${xpWasAwarded ? `Earned ${moduleData.xp_reward} XP!` : 'XP already awarded.'}`,
        });
        if (onComplete) {
          onComplete();
        }
      } else {
        toast({
          title: `Quiz Attempt ${newAttempts} of 3`,
          description: `You scored ${score}%. Best score: ${newBestScore}%. ${xpWasAwarded ? `Earned ${moduleData.xp_reward} XP! ` : ''}You can retake ${3 - newAttempts} more time${3 - newAttempts === 1 ? '' : 's'}.`,
        });
        
        // Update local state immediately for UI
        setQuizAttempts(newAttempts);
        setBestQuizScore(newBestScore);
        
        setQuizAnswers({});
        
        // Refetch progress to ensure UI is up to date with latest data
        await fetchProgress();
      }
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      console.error("Error details:", {
        error,
        quizAnswers,
        moduleId,
        sellerId,
        score,
        newAttempts
      });
      
      // Revert UI state on error
      setSubmittingQuiz(false);
      setShowQuiz(true); // Show quiz again if error
      
      toast({
        title: "Error Submitting Quiz",
        description: error.message || "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const renderElement = (element: SlideElement, index: number) => {
    switch (element.type) {
      case 'heading':
        const HeadingTag = `h${element.level || 2}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag key={index} className={`font-bold text-foreground mb-4 ${
            element.level === 1 ? 'text-3xl' :
            element.level === 2 ? 'text-2xl' :
            element.level === 3 ? 'text-xl' :
            'text-lg'
          }`}>
            {element.content}
          </HeadingTag>
        );
      
      case 'paragraph':
        return (
          <p key={index} className="mb-4 text-foreground whitespace-pre-line leading-relaxed">
            {element.content?.split('**').map((part, i) => 
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </p>
        );
      
      case 'list':
        return (
          <ul key={index} className="mb-4 space-y-2 list-disc list-inside text-foreground">
            {element.items?.map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        );
      
      case 'image':
        return (
          <div key={index} className="mb-6">
            <img 
              src={element.src} 
              alt={element.alt || ''} 
              className="w-full rounded-lg border border-border"
            />
            {element.alt && (
              <p className="text-xs text-muted-foreground mt-2 italic">{element.alt}</p>
            )}
          </div>
        );
      
      case 'code':
        return (
          <pre key={index} className="mb-4 p-4 bg-muted rounded-lg overflow-x-auto">
            <code className={`text-sm ${element.language || ''}`}>{element.content}</code>
          </pre>
        );
      
      case 'quote':
        return (
          <blockquote key={index} className="mb-4 pl-4 border-l-4 border-primary/50 italic text-muted-foreground">
            {element.content}
          </blockquote>
        );
      
      case 'alert':
        const alertVariants: Record<string, string> = {
          destructive: "destructive",
          success: "default",
          warning: "default",
          info: "default"
        };
        return (
          <Alert key={index} variant={alertVariants[element.variant || 'default'] as any} className="mb-4">
            <AlertDescription>{element.content}</AlertDescription>
          </Alert>
        );
      
      case 'button':
        return (
          <div key={index} className="mb-4">
            <Button
              variant={element.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={() => element.url && window.open(element.url, '_blank')}
            >
              {element.text || element.content}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );
      
      case 'badge':
        return (
          <div key={index} className="mb-4">
            <Badge variant={element.variant === 'destructive' ? 'destructive' : 'outline'}>
              {element.text || element.content}
            </Badge>
          </div>
        );
      
      case 'separator':
        return <Separator key={index} className="my-6" />;
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-primary text-xl">Loading module...</div>
      </div>
    );
  }

  if (!module || !moduleData) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive text-xl">Module not found</div>
      </div>
    );
  }

  const currentSlide = moduleData.slides[currentSlideIndex];
  const progressPercentage = moduleData.slides.length > 0
    ? ((completedSlides.length + (completedSlides.includes(currentSlide?.id || '') ? 0 : (currentSlideIndex === moduleData.slides.length - 1 ? 1 : 0))) / moduleData.slides.length) * 100
    : 0;
  const isSlideCompleted = currentSlide ? completedSlides.includes(currentSlide.id) : false;
  const isLastSlide = currentSlideIndex === moduleData.slides.length - 1;
  const allSlidesCompleted = completedSlides.length >= moduleData.slides.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{moduleData.title}</CardTitle>
              <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{moduleData.category}</Badge>
                <span>
                  {moduleData.xp_reward} XP • Min Rank: {module.min_rank}
                </span>
              </div>
            </div>
            {onClose && !showQuiz && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-muted-foreground">
                Slide {currentSlideIndex + 1} of {moduleData.slides.length}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Quiz Dialog - Can be closed, shows one question at a time */}
      {showQuiz && (
        <Dialog open={showQuiz} onOpenChange={(open) => {
          if (!open) {
            setShowQuiz(false);
            setShowModuleContent(true);
            setHideQuizResults(true);
            setCurrentQuizQuestion(0); // Reset to first question
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>Module Quiz</span>
                  {quizAttempts > 0 && (
                    <Badge variant="outline">
                      Attempt {quizAttempts + 1} of 3
                    </Badge>
                  )}
                </div>
              </DialogTitle>
              <DialogDescription>
                {quizAttempts === 0 
                  ? `Complete the quiz to finish the module and earn ${moduleData.xp_reward} XP`
                  : quizAttempts < 3
                  ? `Retake the quiz to improve your score (Attempt ${quizAttempts + 1} of 3). Best score: ${bestQuizScore}%`
                  : `Final attempt. Best score so far: ${bestQuizScore}%`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4">
              {moduleData.quiz.length > 0 && currentQuizQuestion < moduleData.quiz.length && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg">
                        Question {currentQuizQuestion + 1} of {moduleData.quiz.length}
                      </CardTitle>
                      <Progress 
                        value={((currentQuizQuestion + 1) / moduleData.quiz.length) * 100} 
                        className="w-24 h-2" 
                      />
                    </div>
                    <p className="text-base text-foreground mt-2 font-medium">
                      {moduleData.quiz[currentQuizQuestion].question}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {moduleData.quiz[currentQuizQuestion].answers.map((answer, aIndex) => (
                        <Button
                          key={aIndex}
                          variant={quizAnswers[currentQuizQuestion] === aIndex ? "default" : "outline"}
                          className="w-full justify-start text-left h-auto py-4 px-4 text-base"
                          onClick={() => {
                            setQuizAnswers({ ...quizAnswers, [currentQuizQuestion]: aIndex });
                          }}
                        >
                          <span className="flex-1 text-left">{answer}</span>
                          {quizAnswers[currentQuizQuestion] === aIndex && (
                            <CheckCircle2 className="w-5 h-5 ml-2 flex-shrink-0" />
                          )}
                        </Button>
                      ))}
                    </div>
                    {moduleData.quiz[currentQuizQuestion].explanation && quizSubmitted && (
                      <div className={`mt-4 p-4 rounded-lg ${
                        quizAnswers[currentQuizQuestion] === moduleData.quiz[currentQuizQuestion].correct 
                          ? 'bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30'
                      }`}>
                        <p className="text-sm font-medium mb-1">Explanation:</p>
                        <p className="text-sm">{moduleData.quiz[currentQuizQuestion].explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentQuizQuestion > 0) {
                    setCurrentQuizQuestion(currentQuizQuestion - 1);
                  }
                }}
                disabled={currentQuizQuestion === 0}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <div className="text-sm text-muted-foreground px-4">
                {currentQuizQuestion + 1} / {moduleData.quiz.length}
              </div>
              {currentQuizQuestion < moduleData.quiz.length - 1 ? (
                <Button
                  onClick={() => {
                    if (currentQuizQuestion < moduleData.quiz.length - 1) {
                      setCurrentQuizQuestion(currentQuizQuestion + 1);
                    }
                  }}
                  disabled={!quizAnswers[currentQuizQuestion] && quizAnswers[currentQuizQuestion] !== 0}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleQuizSubmit}
                  disabled={submittingQuiz}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {submittingQuiz ? "Submitting..." : "Submit Quiz"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
            <div className="pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowQuiz(false);
                  setShowModuleContent(true);
                  setHideQuizResults(true);
                  setCurrentQuizQuestion(0);
                }}
                className="w-full"
              >
                Close Quiz
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Quiz Results - Only show when quiz is completed and not hidden, not when viewing module content normally */}
      {quizSubmitted && quizScore !== null && !showQuiz && !hideQuizResults && (
        <>
          {quizAttempts >= 3 ? (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Quiz Complete!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">{bestQuizScore || quizScore}%</div>
                    {bestQuizScore !== null && bestQuizScore !== quizScore && (
                      <div className="text-sm text-muted-foreground">
                        Final attempt: {quizScore}%
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      Completed in {quizAttempts} attempt{quizAttempts === 1 ? '' : 's'}
                    </div>
                  </div>
                  {progress?.xp_awarded && (
                    <p className="text-muted-foreground">
                      You earned <strong className="text-primary">{moduleData.xp_reward} XP</strong> for completing this module!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Quiz Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Score Display */}
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold text-primary">{quizScore}%</div>
                    {bestQuizScore !== null && bestQuizScore !== quizScore && (
                      <div className="text-sm text-muted-foreground">
                        Best score: <strong className="text-primary">{bestQuizScore}%</strong>
                      </div>
                    )}
                  </div>
                  
                  {/* Attempt Info Badge */}
                  <div className="flex justify-center">
                    <Badge variant="outline" className="text-sm py-2 px-4 bg-primary/10 border-primary/30 text-primary font-medium">
                      Attempt {quizAttempts} of 3
                    </Badge>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {quizAttempts < 3 ? (
                      <Button
                        onClick={() => {
                          setQuizAnswers({});
                          setQuizSubmitted(false);
                          setQuizScore(null);
                          setShowQuiz(true);
                          setShowModuleContent(false);
                          setHideQuizResults(true); // Hide results when starting quiz
                          setCurrentQuizQuestion(0);
                        }}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Retake Quiz ({3 - quizAttempts} attempt{3 - quizAttempts === 1 ? '' : 's'} remaining)
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setHideQuizResults(true);
                        setShowModuleContent(true);
                        setShowQuiz(false);
                      }}
                      className={quizAttempts < 3 ? "flex-1" : "w-full"}
                    >
                      View Module
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Module Content - Always visible when not showing quiz */}
      {showModuleContent && !showQuiz && currentSlide && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{currentSlide.title}</CardTitle>
              {isSlideCompleted && (
                <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentSlide.elements.map((element, index) => renderElement(element, index))}
            </div>
            <Separator className="my-6" />
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentSlideIndex > 0) {
                    setCurrentSlideIndex(currentSlideIndex - 1);
                  }
                }}
                disabled={currentSlideIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Slide {currentSlideIndex + 1} of {moduleData.slides.length}
              </div>
              {isLastSlide && allSlidesCompleted ? (
                <Button
                  onClick={() => {
                    setShowQuiz(true);
                    setShowModuleContent(false);
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={!moduleData.quiz || moduleData.quiz.length === 0}
                >
                  {moduleData.quiz && moduleData.quiz.length > 0 ? (
                    <>
                      Take Quiz
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    "Complete"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (isLastSlide) {
                      // Complete last slide and show quiz
                      handleSlideComplete();
                      if (moduleData.quiz && moduleData.quiz.length > 0) {
                        setShowQuiz(true);
                        setShowModuleContent(true); // Keep module content visible
                        setHideQuizResults(true); // Hide quiz results when starting quiz
                        setCurrentQuizQuestion(0);
                      }
                    } else {
                      handleSlideComplete();
                    }
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSlideCompleted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Completed
                    </>
                  ) : isLastSlide ? (
                    <>
                      Complete Slide
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Next Slide
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slide Navigation Sidebar (Optional - for quick navigation) */}
      {showModuleContent && !showQuiz && moduleData.slides.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Slide Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {moduleData.slides.map((slide, index) => (
                <Button
                  key={slide.id}
                  variant={currentSlideIndex === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentSlideIndex(index)}
                  className="relative"
                >
                  {index + 1}
                  {completedSlides.includes(slide.id) && (
                    <CheckCircle2 className="w-3 h-3 absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full" />
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VaultModuleViewer;
