import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Trash2, Save, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClientJourneyMapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  onComplete?: () => void;
}

interface JourneyStep {
  id: string;
  step_name: string;
  description: string;
}

const ClientJourneyMapper: React.FC<ClientJourneyMapperProps> = ({
  open,
  onOpenChange,
  sellerId,
  onComplete
}) => {
  const [journeyName, setJourneyName] = useState<string>("");
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([
    { id: '1', step_name: 'Client clicks referral link', description: '' },
    { id: '2', step_name: 'Creates account', description: '' },
    { id: '3', step_name: 'Chooses automation', description: '' },
    { id: '4', step_name: 'Pays setup fee', description: '' },
    { id: '5', step_name: 'Goes through onboarding', description: '' },
  ]);
  const [savedJourneys, setSavedJourneys] = useState<any[]>([]);
  const [editingJourneyId, setEditingJourneyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchJourneys();
    }
  }, [open, sellerId]);

  const fetchJourneys = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("partner_client_journey")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedJourneys(data || []);

      // Load editing journey if any
      if (editingJourneyId && data) {
        const journey = data.find(j => j.id === editingJourneyId);
        if (journey) {
          setJourneyName(journey.journey_name);
          if (journey.journey_data && typeof journey.journey_data === 'object') {
            const steps = (journey.journey_data as any).steps || [];
            if (steps.length > 0) {
              setJourneySteps(steps);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching journeys:", error);
      toast({
        title: "Error",
        description: "Failed to load journeys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStep = (index: number, field: keyof JourneyStep, value: string) => {
    const newSteps = [...journeySteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setJourneySteps(newSteps);
  };

  const addStep = () => {
    const newStepId = String(Date.now());
    const newStep: JourneyStep = {
      id: newStepId,
      step_name: `Step ${journeySteps.length + 1}`,
      description: ''
    };
    setJourneySteps([...journeySteps, newStep]);
  };

  const removeStep = (index: number) => {
    if (journeySteps.length <= 1) {
      toast({
        title: "Cannot remove step",
        description: "Journey must have at least one step.",
        variant: "destructive",
      });
      return;
    }
    const newSteps = journeySteps.filter((_, i) => i !== index);
    setJourneySteps(newSteps);
  };

  const handleSaveJourney = async () => {
    if (!journeyName.trim()) {
      toast({
        title: "Journey name required",
        description: "Please give your journey a name",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const journeyData = {
        steps: journeySteps,
      };

      let error;
      if (editingJourneyId) {
        // Update existing journey
        const { error: updateError } = await supabase
          .from("partner_client_journey")
          .update({
            journey_name: journeyName.trim(),
            journey_data: journeyData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingJourneyId);
        error = updateError;
      } else {
        // Insert new journey
        const { error: insertError } = await supabase
          .from("partner_client_journey")
          .insert([{
            seller_id: sellerId,
            journey_name: journeyName.trim(),
            journey_data: journeyData,
          }]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingJourneyId ? "Journey Updated!" : "Journey Saved!",
        description: editingJourneyId 
          ? "Your client journey has been updated."
          : "Your client journey has been saved.",
      });

      // Refresh journeys list
      await fetchJourneys();

      // Reset form
      if (!editingJourneyId) {
        setJourneyName("");
        setJourneySteps([
          { id: '1', step_name: 'Client clicks referral link', description: '' },
          { id: '2', step_name: 'Creates account', description: '' },
          { id: '3', step_name: 'Chooses automation', description: '' },
          { id: '4', step_name: 'Pays setup fee', description: '' },
          { id: '5', step_name: 'Goes through onboarding', description: '' },
        ]);
      }

      // Check for task completion: Map a Client Journey From Click to Activation (700 XP)
      if (!editingJourneyId && onComplete) {
        onComplete();
      }
    } catch (error: any) {
      toast({
        title: "Error saving journey",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditJourney = (journey: any) => {
    setEditingJourneyId(journey.id);
    setJourneyName(journey.journey_name);
    if (journey.journey_data && typeof journey.journey_data === 'object') {
      const steps = (journey.journey_data as any).steps || [];
      if (steps.length > 0) {
        setJourneySteps(steps);
      }
    }
  };

  const handleDeleteJourney = async (journeyId: string) => {
    if (!confirm("Are you sure you want to delete this journey?")) return;

    try {
      const { error } = await supabase
        .from("partner_client_journey")
        .delete()
        .eq("id", journeyId);

      if (error) throw error;

      toast({
        title: "Journey Deleted",
        description: "Your client journey has been deleted.",
      });

      await fetchJourneys();
      
      if (editingJourneyId === journeyId) {
        setEditingJourneyId(null);
        setJourneyName("");
        setJourneySteps([
          { id: '1', step_name: 'Client clicks referral link', description: '' },
          { id: '2', step_name: 'Creates account', description: '' },
          { id: '3', step_name: 'Chooses automation', description: '' },
          { id: '4', step_name: 'Pays setup fee', description: '' },
          { id: '5', step_name: 'Goes through onboarding', description: '' },
        ]);
      }
    } catch (error: any) {
      toast({
        title: "Error deleting journey",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Map Client Journey From Click to Activation
          </DialogTitle>
          <DialogDescription>
            Map out the complete client journey from when they click your referral link to when their automation is activated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Saved Journeys List */}
          {savedJourneys.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg text-primary">Your Saved Journeys</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  View and edit your saved client journeys
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {savedJourneys.map((journey) => (
                    <Card key={journey.id} className="border-border">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <h4 className="font-semibold">{journey.journey_name}</h4>
                            {journey.journey_data && typeof journey.journey_data === 'object' && (journey.journey_data as any).steps && (
                              <div className="text-sm text-muted-foreground">
                                {(journey.journey_data as any).steps.length} steps mapped
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditJourney(journey)}
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteJourney(journey.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Journey Form */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg text-primary">
                {editingJourneyId ? 'Edit Journey' : 'Create New Journey'}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {editingJourneyId 
                  ? 'Update your client journey below'
                  : 'Map out each step of the client journey from click to activation'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="journey-name">Journey Name *</Label>
                <Input
                  id="journey-name"
                  value={journeyName}
                  onChange={(e) => setJourneyName(e.target.value)}
                  placeholder="e.g., Standard Client Journey"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Journey Steps</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStep}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Step
                  </Button>
                </div>
                {journeySteps.map((step, index) => (
                  <Card key={step.id} className="border-border bg-muted/20">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Step {index + 1}
                          </Badge>
                          <Input
                            value={step.step_name}
                            onChange={(e) => updateStep(index, 'step_name', e.target.value)}
                            placeholder="Step name"
                            className="flex-1"
                          />
                          {journeySteps.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStep(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <Textarea
                          value={step.description}
                          onChange={(e) => updateStep(index, 'description', e.target.value)}
                          placeholder="Describe what happens in this step..."
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={handleSaveJourney}
                  disabled={saving || !journeyName.trim()}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving 
                    ? 'Saving...' 
                    : editingJourneyId 
                      ? 'Update Journey' 
                      : 'Save Journey'}
                </Button>
                {editingJourneyId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingJourneyId(null);
                      setJourneyName("");
                      setJourneySteps([
                        { id: '1', step_name: 'Client clicks referral link', description: '' },
                        { id: '2', step_name: 'Creates account', description: '' },
                        { id: '3', step_name: 'Chooses automation', description: '' },
                        { id: '4', step_name: 'Pays setup fee', description: '' },
                        { id: '5', step_name: 'Goes through onboarding', description: '' },
                      ]);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientJourneyMapper;

