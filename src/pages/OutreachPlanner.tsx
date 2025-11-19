import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, CheckCircle, Mail, Phone, Building2, FileText, Calendar, MessageSquare } from "lucide-react";

interface OutreachContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  intro_message: string | null;
  notes: string | null;
  status: 'planned' | 'contacted' | 'moved_to_deal_tracker';
  created_at: string;
  updated_at: string;
}

const OutreachPlanner = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sellerData, setSellerData] = useState<any>(null);
  const [contacts, setContacts] = useState<OutreachContact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showMoveToDealTracker, setShowMoveToDealTracker] = useState(false);
  const [selectedContact, setSelectedContact] = useState<OutreachContact | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [introMessage, setIntroMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Deal tracker form state (when moving contact)
  const [dealDate, setDealDate] = useState("");
  const [dealChannel, setDealChannel] = useState("");
  const [dealStatus, setDealStatus] = useState("no_response");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSellerData();
    }
  }, [user]);

  const fetchSellerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: seller, error: sellerError } = await supabase
        .from("sellers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (sellerError) throw sellerError;
      if (!seller) {
        toast({
          title: "Access Denied",
          description: "You need to be a partner to access this page.",
          variant: "destructive",
        });
        navigate("/partners");
        return;
      }

      setSellerData(seller);
      fetchContacts(seller.id);
    } catch (error: any) {
      console.error("Error fetching seller data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async (sellerId: string) => {
    try {
      const { data, error } = await supabase
        .from("outreach_planner")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load contacts.",
        variant: "destructive",
      });
    }
  };

  const handleAddContact = async () => {
    if (!sellerData?.id || !name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("outreach_planner")
        .insert({
          seller_id: sellerData.id,
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          company: company.trim() || null,
          position: position.trim() || null,
          intro_message: introMessage.trim() || null,
          notes: notes.trim() || null,
          status: 'planned',
        })
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => [data, ...prev]);
      setShowAddContact(false);
      resetForm();
      
      toast({
        title: "Contact Added!",
        description: `${data.name} has been added to your outreach planner.`,
      });
    } catch (error: any) {
      console.error("Error adding contact:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add contact.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveToDealTracker = async () => {
    if (!selectedContact || !sellerData?.id) return;
    if (!dealDate || !dealChannel) {
      toast({
        title: "Validation Error",
        description: "Date and Channel are required.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Add to deal tracker
      const { error: dealError } = await supabase
        .from("deal_tracking")
        .insert({
          seller_id: sellerData.id,
          date: dealDate,
          channel: dealChannel,
          client_name: selectedContact.name,
          status: dealStatus,
          reflection: selectedContact.notes || selectedContact.intro_message || null,
        });

      if (dealError) throw dealError;

      // Update contact status
      const { error: updateError } = await supabase
        .from("outreach_planner")
        .update({ status: 'moved_to_deal_tracker', updated_at: new Date().toISOString() })
        .eq("id", selectedContact.id);

      if (updateError) throw updateError;

      // Remove from contacts list (or update in UI)
      setContacts(prev => prev.filter(c => c.id !== selectedContact.id));
      setShowMoveToDealTracker(false);
      setSelectedContact(null);
      
      toast({
        title: "Moved to Deal Tracker!",
        description: `${selectedContact.name} has been moved to deal tracker. You can view it in the Deal Tracking tab.`,
      });
      
      // Reset deal form
      setDealDate("");
      setDealChannel("");
      setDealStatus("no_response");
    } catch (error: any) {
      console.error("Error moving to deal tracker:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to move contact to deal tracker.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsContacted = async (contact: OutreachContact) => {
    try {
      const { error } = await supabase
        .from("outreach_planner")
        .update({ status: 'contacted', updated_at: new Date().toISOString() })
        .eq("id", contact.id);

      if (error) throw error;

      setContacts(prev => prev.map(c => 
        c.id === contact.id ? { ...c, status: 'contacted' as const } : c
      ));

      toast({
        title: "Marked as Contacted!",
        description: `${contact.name} has been marked as contacted.`,
      });
    } catch (error: any) {
      console.error("Error marking as contacted:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update contact.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContact = async (contactId: string, contactName: string) => {
    try {
      const { error } = await supabase
        .from("outreach_planner")
        .delete()
        .eq("id", contactId);

      if (error) throw error;

      setContacts(prev => prev.filter(c => c.id !== contactId));

      toast({
        title: "Contact Deleted",
        description: `${contactName} has been removed from your outreach planner.`,
      });
    } catch (error: any) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete contact.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setPosition("");
    setIntroMessage("");
    setNotes("");
  };

  const openMoveToDealTracker = (contact: OutreachContact) => {
    setSelectedContact(contact);
    setShowMoveToDealTracker(true);
    // Pre-fill date with today
    const today = new Date().toISOString().split('T')[0];
    setDealDate(today);
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const plannedContacts = contacts.filter(c => c.status === 'planned');
  const contactedContacts = contacts.filter(c => c.status === 'contacted');

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/partner-dashboard?tab=deal-tracking")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Deal Tracker
            </Button>
          </div>

          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-primary">Outreach Planner</CardTitle>
                  <CardDescription className="text-sm">
                    Plan your outreach contacts and track who you're going to reach out to
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddContact(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Planned Contacts */}
          <div className="space-y-6 mb-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-primary">
                  Planned Contacts ({plannedContacts.length})
                </CardTitle>
                <CardDescription className="text-sm">
                  Contacts you're planning to reach out to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {plannedContacts.length > 0 ? (
                  <div className="space-y-3">
                    {plannedContacts.map((contact) => (
                      <Card key={contact.id} className="bg-muted/20 border-border">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-base">{contact.name}</h4>
                                {contact.company && (
                                  <Badge variant="outline" className="text-xs">
                                    <Building2 className="w-3 h-3 mr-1" />
                                    {contact.company}
                                  </Badge>
                                )}
                                {contact.position && (
                                  <span className="text-xs text-muted-foreground">{contact.position}</span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                {contact.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    {contact.email}
                                  </div>
                                )}
                                {contact.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    {contact.phone}
                                  </div>
                                )}
                              </div>
                              {contact.intro_message && (
                                <div className="mt-2 p-2 bg-background rounded text-sm">
                                  <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-muted-foreground">
                                    <MessageSquare className="w-3 h-3" />
                                    Intro Message
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">{contact.intro_message}</p>
                                </div>
                              )}
                              {contact.notes && (
                                <div className="mt-2 p-2 bg-background rounded text-sm">
                                  <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-muted-foreground">
                                    <FileText className="w-3 h-3" />
                                    Notes
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsContacted(contact)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Contacted
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => openMoveToDealTracker(contact)}
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                Add to Deal Tracker
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No planned contacts yet. Add your first contact to start planning!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contacted Contacts */}
            {contactedContacts.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">
                    Contacted ({contactedContacts.length})
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Contacts you've already reached out to
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contactedContacts.map((contact) => (
                      <Card key={contact.id} className="bg-muted/20 border-border border-primary/20">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-base">{contact.name}</h4>
                                <Badge variant="default" className="text-xs">
                                  Contacted
                                </Badge>
                                {contact.company && (
                                  <Badge variant="outline" className="text-xs">
                                    <Building2 className="w-3 h-3 mr-1" />
                                    {contact.company}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                {contact.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    {contact.email}
                                  </div>
                                )}
                                {contact.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    {contact.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                onClick={() => openMoveToDealTracker(contact)}
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                Add to Deal Tracker
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
          </div>
        </div>
      </main>

      {/* Add Contact Dialog */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Add a contact to your outreach planner
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="ABC Company"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="CEO, Marketing Manager, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Intro Message</Label>
              <Textarea
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                placeholder="Your introduction message for this contact..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this contact..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddContact(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddContact}
                disabled={submitting || !name.trim()}
                className="flex-1"
              >
                {submitting ? 'Adding...' : 'Add Contact'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move to Deal Tracker Dialog */}
      <Dialog open={showMoveToDealTracker} onOpenChange={setShowMoveToDealTracker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Deal Tracker</DialogTitle>
            <DialogDescription>
              Add {selectedContact?.name} to your deal tracker. You'll need to provide the contact details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-semibold mb-2">Contact Information:</p>
              <p className="text-sm text-muted-foreground">{selectedContact?.name}</p>
              {selectedContact?.email && (
                <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
              )}
              {selectedContact?.phone && (
                <p className="text-sm text-muted-foreground">{selectedContact.phone}</p>
              )}
              {selectedContact?.company && (
                <p className="text-sm text-muted-foreground">{selectedContact.company}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={dealDate}
                  onChange={(e) => setDealDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Channel *</Label>
                <Select value={dealChannel} onValueChange={setDealChannel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="dm">DM / Social Media</SelectItem>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="meeting">In-Person Meeting</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={dealStatus} onValueChange={setDealStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_response">No Response</SelectItem>
                  <SelectItem value="follow_up">Follow Up Needed</SelectItem>
                  <SelectItem value="success">Success / Interested</SelectItem>
                  <SelectItem value="closed">Closed / Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMoveToDealTracker(false);
                  setSelectedContact(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMoveToDealTracker}
                disabled={submitting || !dealDate || !dealChannel}
                className="flex-1"
              >
                {submitting ? 'Adding...' : 'Add to Deal Tracker'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default OutreachPlanner;

