import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowLeft, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePageMeta } from "@/hooks/usePageMeta";

interface LearnerModule {
  id: string;
  module_id: string;
  module_title: string;
  module_description: string | null;
  module_content: any;
  progress: any;
  completed: boolean;
  completed_at: string | null;
}

const LearnerModule = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState<LearnerModule | null>(null);
  const [saving, setSaving] = useState(false);
  const [quizLink, setQuizLink] = useState<string | null>(null);

  usePageMeta({
    title: module ? `${module.module_title} - The Vault Network` : "Learning Module",
    description: module?.module_description || "View your learning module",
  });

  useEffect(() => {
    if (user && moduleId) {
      fetchModule();
    } else if (!user) {
      navigate("/learners");
    }
  }, [user, moduleId]);

  const fetchModule = async () => {
    if (!user || !moduleId) return;

    try {
      // Get learner ID
      const { data: learner } = await supabase
        .from("learners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!learner) {
        navigate("/learners");
        return;
      }

      // Fetch module record from database (with HTML content)
      const { data: moduleData, error } = await supabase
        .from("learner_modules")
        .select("*")
        .eq("id", moduleId)
        .eq("learner_id", learner.id)
        .single();

      if (error) throw error;

      // Use module content directly from database (pasted HTML)
      setModule(moduleData);
      
      // Extract quiz link from HTML if present
      if (moduleData.module_content && typeof moduleData.module_content === 'object' && moduleData.module_content.type === 'html') {
        const html = moduleData.module_content.html || '';
        const quizLinkMatch = html.match(/href=["']([^"']*\/quiz\?token=[^"']+)["']/i);
        if (quizLinkMatch) {
          setQuizLink(quizLinkMatch[1]);
        }
      }
      
      // Update accessed_at if not already set (but don't award XP here - that's done on button click)
      if (!moduleData.accessed_at) {
        await supabase
          .from("learner_modules")
          .update({ accessed_at: new Date().toISOString() })
          .eq("id", moduleId);
      }
    } catch (error: any) {
      console.error("Error fetching module:", error);
      toast({
        title: "Error",
        description: "Failed to load module",
        variant: "destructive",
      });
      navigate("/learner-dashboard");
    } finally {
      setLoading(false);
    }
  };

  const markAsComplete = async () => {
    if (!moduleId || !module) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("learner_modules")
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", moduleId);

      if (error) throw error;

      setModule({ ...module, completed: true, completed_at: new Date().toISOString() });

      toast({
        title: "Module Completed!",
        description: `Congratulations on completing "${module.module_title}"`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark module as complete",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading module...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12 pt-24 text-center">
          <p className="text-muted-foreground">Module not found</p>
          <Button onClick={() => navigate("/learner-dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Render module content based on structure
  const renderModuleContent = () => {
    if (!module.module_content) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Module content is being prepared...</p>
        </div>
      );
    }

    // If content is HTML type (from module tokens)
    if (module.module_content && typeof module.module_content === 'object' && module.module_content.type === 'html') {
      const { html, styles } = module.module_content;
      
      // Simple wrapper styles - just fix the black bars issue by overriding body padding
      const wrapperStyles = `
        .module-html-wrapper {
          background: transparent !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 100%;
        }
        .module-html-wrapper body,
        body {
          padding: 0 !important;
          margin: 0 !important;
        }
        .module-html-wrapper .page {
          margin: 0 auto 40px auto !important;
        }
        .module-html-wrapper section {
          margin: 0 auto !important;
        }
      `;
      
      return (
        <div className="module-html-wrapper" style={{ border: 'none', outline: 'none' }}>
          <style dangerouslySetInnerHTML={{ __html: wrapperStyles }} />
          <div 
            style={{ border: 'none', outline: 'none' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      );
    }

    // If content is a string (markdown-like), render it
    if (typeof module.module_content === 'string') {
      return (
        <div className="prose prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: module.module_content }} />
        </div>
      );
    }

    // If content is an object with slides/modules structure
    if (module.module_content && typeof module.module_content === 'object') {
      if (module.module_content.modules && Array.isArray(module.module_content.modules)) {
        return (
          <div className="space-y-8">
            {module.module_content.modules.map((mod: any, index: number) => (
              <Card key={index} className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline" className="mr-2">Module {index + 1}</Badge>
                    {mod.title || `Module ${index + 1}`}
                  </CardTitle>
                  {mod.description && (
                    <CardDescription>{mod.description}</CardDescription>
                  )}
                </CardHeader>
                {mod.content && (
                  <CardContent>
                    <div className="prose prose-invert max-w-none">
                      {typeof mod.content === 'string' ? (
                        <div dangerouslySetInnerHTML={{ __html: mod.content }} />
                      ) : (
                        <pre className="text-sm text-muted-foreground">
                          {JSON.stringify(mod.content, null, 2)}
                        </pre>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        );
      }

      // If it's a simple object, render key-value pairs
      return (
        <div className="prose prose-invert max-w-none">
          <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(module.module_content, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Module content format not recognized</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-12 pt-24">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/learner-dashboard")}
          className="mb-6 text-white hover:text-white/80 hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Module Header */}
        <Card className="mb-6 border-none bg-background">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-6 h-6 text-[#f5c84c]" />
                  <CardTitle className="text-2xl text-[#f5c84c]">{module.module_title}</CardTitle>
                </div>
                {module.module_description && (
                  <CardDescription className="text-base mt-2 text-[#f5c84c]/80">
                    {module.module_description}
                  </CardDescription>
                )}
              </div>
              {module.completed ? (
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Completed
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[#f5c84c] border-[#f5c84c]/30">
                  <Clock className="w-4 h-4 mr-1" />
                  In Progress
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Module Content */}
        {module.module_content && typeof module.module_content === 'object' && module.module_content.type === 'html' ? (
          <div className="w-full -mx-6 md:-mx-12 lg:-mx-24" style={{ display: 'flex', justifyContent: 'center' }}>
            {renderModuleContent()}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="max-h-[calc(100vh-300px)] pr-4">
                <div className="prose prose-invert max-w-none">
                  {renderModuleContent()}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          {!module.completed && quizLink && (
            <Button
              onClick={() => window.open(quizLink, '_blank')}
              className="bg-[#f5c84c] hover:bg-[#f5c84c]/90 text-[#111111] border border-[#f5c84c]"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Take Quiz
            </Button>
          )}
          {!module.completed && !quizLink && (
            <Button
              onClick={markAsComplete}
              disabled={saving}
              className="bg-[#f5c84c] hover:bg-[#f5c84c]/90 text-[#111111] border border-[#f5c84c]"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Complete
                </>
              )}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate("/learner-dashboard")}
            className="border-[#f5c84c]/30 text-[#f5c84c] hover:bg-[#f5c84c]/10"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LearnerModule;

