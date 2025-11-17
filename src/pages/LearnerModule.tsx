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

      // Fetch module
      const { data: moduleData, error } = await supabase
        .from("learner_modules")
        .select("*")
        .eq("id", moduleId)
        .eq("learner_id", learner.id)
        .single();

      if (error) throw error;

      setModule(moduleData);
      
      // Update accessed_at
      await supabase
        .from("learner_modules")
        .update({ accessed_at: new Date().toISOString() })
        .eq("id", moduleId);
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
      
      // Scope styles to module-html-content to avoid conflicts
      const scopedStyles = styles 
        ? styles.replace(/(\.page|body|h1|h2|h3|h4|p|ul|ol|li|a|\.gold|\.muted|\.callout|\.badge|\.diagram-box|\.helper-img)/g, '.module-html-content $1')
               .replace(/\.module-html-content body/g, '.module-html-content')
        : '';
      
      // Combine scoped styles with base module styles
      const fullStyles = `
        .module-html-wrapper {
          background: #050505;
          padding: 40px 0;
          min-height: 100vh;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        ${scopedStyles}
        .module-html-content {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .module-html-content .page {
          background: #ffffff !important;
          max-width: 850px;
          margin: 0 auto 40px auto;
          padding: 64px 72px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
          box-sizing: border-box;
        }
        .module-html-content .cover {
          background: #050505 !important;
          color: #f7f7f7 !important;
        }
        .module-html-content h1,
        .module-html-content h2,
        .module-html-content h3,
        .module-html-content h4 {
          color: #111111 !important;
          margin-top: 0;
        }
        .module-html-content p {
          color: #111111 !important;
          font-size: 14px;
          line-height: 1.6;
          margin: 0 0 10px 0;
        }
        .module-html-content ul,
        .module-html-content ol {
          color: #111111 !important;
          font-size: 14px;
          line-height: 1.6;
        }
        .module-html-content li {
          color: #111111 !important;
        }
        .module-html-content .muted {
          color: #555555 !important;
        }
        .module-html-content .gold {
          color: #c99721 !important;
        }
        .module-html-content a {
          color: #c99721 !important;
          text-decoration: none;
        }
        .module-html-content a:hover {
          text-decoration: underline;
        }
      `;
      
      return (
        <div className="module-html-wrapper">
          <style dangerouslySetInnerHTML={{ __html: fullStyles }} />
          <div 
            className="module-html-content"
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
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Module Header */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-6 h-6 text-primary" />
                  <CardTitle className="text-2xl">{module.module_title}</CardTitle>
                </div>
                {module.module_description && (
                  <CardDescription className="text-base mt-2">
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
                <Badge variant="outline" className="text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1" />
                  In Progress
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Module Content */}
        {module.module_content && typeof module.module_content === 'object' && module.module_content.type === 'html' ? (
          <div className="w-full -mx-6 md:-mx-12">
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
          {!module.completed && (
            <Button
              onClick={markAsComplete}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
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

