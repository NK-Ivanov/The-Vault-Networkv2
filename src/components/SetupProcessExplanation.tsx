import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SetupProcessExplanationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  onComplete?: () => void;
}

const SetupProcessExplanation: React.FC<SetupProcessExplanationProps> = ({
  open,
  onOpenChange,
  sellerId,
  onComplete
}) => {
  const [explanation, setExplanation] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchExplanation();
    }
  }, [open, sellerId]);

  const fetchExplanation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("partner_setup_explanation")
        .select("*")
        .eq("seller_id", sellerId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      
      if (data) {
        setExplanation(data.explanation_content || "");
      } else {
        setExplanation("");
      }
    } catch (error: any) {
      console.error("Error fetching explanation:", error);
      toast({
        title: "Error",
        description: "Failed to load explanation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExplanation = async () => {
    if (!explanation.trim()) {
      toast({
        title: "Explanation required",
        description: "Please write your setup process explanation",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Check if explanation exists
      const { data: existing } = await supabase
        .from("partner_setup_explanation")
        .select("id")
        .eq("seller_id", sellerId)
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from("partner_setup_explanation")
          .update({
            explanation_content: explanation.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        error = updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from("partner_setup_explanation")
          .insert([{
            seller_id: sellerId,
            explanation_content: explanation.trim(),
          }]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: existing ? "Explanation Updated!" : "Explanation Saved!",
        description: existing 
          ? "Your setup process explanation has been updated."
          : "Your setup process explanation has been saved.",
      });

      // Check for task completion: Write Your Own Setup Process Explanation (650 XP)
      if (!existing && onComplete) {
        onComplete();
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error saving explanation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Write Your Own Setup Process Explanation
          </DialogTitle>
          <DialogDescription>
            Explain in your own words how setup works, what the client can expect, and how long it takes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-2">
                <strong className="text-primary">What to include:</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>How setup works</li>
                <li>What the client can expect</li>
                <li>How long it takes</li>
                <li>Any important details or steps</li>
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label>Your Setup Process Explanation *</Label>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain how the setup process works, what clients can expect, and how long it typically takes..."
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Tip: This explanation helps you prepare for answering real client questions later. Be clear and detailed.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveExplanation}
            disabled={saving || !explanation.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Explanation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SetupProcessExplanation;

