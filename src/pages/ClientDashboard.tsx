import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, FileText, Send, CreditCard, CheckCircle, XCircle, UserCheck, Sparkles, ArrowRight, Clock, Users, MessageSquare, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { callNetlifyFunction } from "@/lib/netlify-functions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface ClientData {
  id: string;
  business_name: string;
  contact_name: string;
  total_spent: number;
  seller_id: string | null;
  invited_by_code: string | null;
  created_at: string;
}

interface PartnerData {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  referral_code: string | null;
}

interface TransactionData {
  id: string;
  amount: number;
  transaction_type: string;
  status: string;
  created_at: string;
}

interface TicketData {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  needs_vault_help: boolean;
  created_at: string;
  updated_at: string;
  client: {
    id: string;
    business_name: string;
    user_id: string;
  } | null;
  seller: {
    id: string;
    business_name: string;
    user_id: string;
  } | null;
}

interface TicketMessageData {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  is_internal: boolean;
  senderName?: string;
  senderType?: "admin" | "client" | "seller" | "unknown";
}

interface AutomationData {
  id: string;
  name: string;
  description: string;
  category: string;
  setup_price: number;
  monthly_price: number;
  image_url: string | null;
  features: string[] | null;
  assigned_at: string;
  status: string;
  payment_status: 'unpaid' | 'paid';
  setup_status: 'pending_setup' | 'setup_in_progress' | 'active';
  stripe_product_id: string | null;
  stripe_setup_price_id: string | null;
  stripe_monthly_price_id: string | null;
}

const ClientDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [automations, setAutomations] = useState<AutomationData[]>([]);

  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDescription, setNewTicketDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  
  // Ticket chat state
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessageData[]>([]);
  const ticketMessagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [ticketChannel, setTicketChannel] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchClientData();
    }
  }, [user]);

  const fetchClientData = async () => {
    try {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id, business_name, contact_name, total_spent, seller_id, invited_by_code, created_at")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (clientError) throw clientError;

      if (!client) {
        toast({
          title: "No client account found",
          description: "Please create a business account first.",
          variant: "destructive",
        });
        navigate("/for-businesses");
        return;
      }

      setClientData(client);

      // Fetch partner/seller information if seller_id exists
      if (client.seller_id) {
        try {
          const { data: partner, error: partnerError } = await supabase
            .from("sellers")
            .select("id, business_name, referral_code")
            .eq("id", client.seller_id)
            .maybeSingle();

          if (partnerError) {
            console.error("Error fetching partner:", partnerError);
          }

          if (partner) {
            // Partner found - use their data
            setPartnerData({
              id: partner.id,
              business_name: partner.business_name || 'The Vault Network',
              contact_name: partner.business_name === 'The Vault Network' ? 'Support Team' : 'Partner',
              email: 'support@vaultnetwork.com', // Default email, can be updated
              referral_code: partner.referral_code,
            });
          } else {
            // Partner not found - default to The Vault Network
            console.log("Partner not found for seller_id:", client.seller_id, "defaulting to The Vault Network");
            setPartnerData({
              id: client.seller_id,
              business_name: 'The Vault Network',
              contact_name: 'Support Team',
              email: 'support@vaultnetwork.com',
              referral_code: 'VAULT-NETWORK',
            });
          }
        } catch (error) {
          console.error("Error in partner fetch:", error);
          // Fallback to The Vault Network
          setPartnerData({
            id: client.seller_id || 'system',
            business_name: 'The Vault Network',
            contact_name: 'Support Team',
            email: 'support@vaultnetwork.com',
            referral_code: 'VAULT-NETWORK',
          });
        }
      } else {
        // If no seller_id, show The Vault Network as partner
        setPartnerData({
          id: 'system',
          business_name: 'The Vault Network',
          contact_name: 'Support Team',
          email: 'support@vaultnetwork.com',
          referral_code: 'VAULT-NETWORK',
        });
      }

      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      // Fetch tickets with seller info
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("tickets")
        .select(`
          *,
          client:clients!tickets_client_id_fkey (
            id,
            business_name,
            user_id
          ),
          seller:sellers!tickets_seller_id_fkey (
            id,
            business_name,
            user_id
          )
        `)
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });

      if (ticketsError) throw ticketsError;
      setTickets(ticketsData || []);

      // Fetch assigned automations
      const { data: automationsData, error: automationsError } = await supabase
        .from("client_automations")
        .select(`
          *,
          automations (
            id,
            name,
            description,
            category,
            setup_price,
            monthly_price,
            image_url,
            features,
            stripe_product_id,
            stripe_setup_price_id,
            stripe_monthly_price_id
          )
        `)
        .eq("client_id", client.id)
        .eq("status", "active")
        .order("assigned_at", { ascending: false });

      if (automationsError) throw automationsError;
      
      // Transform the data to flatten the automation details
      const transformedAutomations = (automationsData || []).map((ca: any) => ({
        id: ca.automations.id,
        name: ca.automations.name,
        description: ca.automations.description,
        category: ca.automations.category,
        setup_price: ca.automations.setup_price,
        monthly_price: ca.automations.monthly_price,
        image_url: ca.automations.image_url,
        features: ca.automations.features,
        assigned_at: ca.assigned_at,
        status: ca.status,
        payment_status: ca.payment_status || 'unpaid',
        setup_status: ca.setup_status || 'pending_setup',
        stripe_product_id: ca.automations.stripe_product_id,
        stripe_setup_price_id: ca.automations.stripe_setup_price_id,
        stripe_monthly_price_id: ca.automations.stripe_monthly_price_id,
      }));
      
      setAutomations(transformedAutomations);
    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (automation: AutomationData) => {
    if (!user?.email || !clientData?.id) {
      toast({
        title: "Error",
        description: "Please ensure you're logged in and have a client account.",
        variant: "destructive",
      });
      return;
    }

    if (!automation.stripe_setup_price_id || !automation.stripe_monthly_price_id) {
      toast({
        title: "Not Available",
        description: "This automation is not yet set up for payments. Please contact your partner.",
        variant: "destructive",
      });
      return;
    }

    setCheckingOut(automation.id);
    try {
      const result = await callNetlifyFunction('stripe-checkout', {
        automationId: automation.id,
        clientEmail: user.email,
        clientId: clientData.id,
      });

      if (result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to initiate checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckingOut(null);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle.trim() || !newTicketDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and description for your ticket.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: ticket, error } = await supabase.from("tickets").insert({
        client_id: clientData?.id,
        seller_id: clientData?.seller_id,
        title: newTicketTitle.trim(),
        description: newTicketDescription.trim(),
        status: "open",
        priority: "normal",
        created_by: user?.id,
      }).select().single();

      if (error) throw error;

      // Add initial message
      if (ticket) {
        await supabase.from("ticket_messages").insert({
          ticket_id: ticket.id,
          user_id: user?.id,
          message: newTicketDescription.trim(),
        });
      }

      toast({
        title: "Ticket Created!",
        description: "Your support ticket has been created. Your partner will respond soon.",
      });

      setNewTicketTitle("");
      setNewTicketDescription("");
      fetchClientData();
    } catch (error: any) {
      toast({
        title: "Failed to create ticket",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to identify message sender
  const identifyMessageSender = async (messages: any[], ticket: TicketData) => {
    const userIds = [...new Set(messages?.map(m => m.user_id).filter(Boolean) || [])];
    if (userIds.length === 0) return messages.map(m => ({ ...m, senderName: "Unknown", senderType: "unknown" }));
    
    // Fetch user roles to identify admins
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);
    
    const adminUserIds = new Set(
      userRoles?.filter(ur => ur.role === "admin").map(ur => ur.user_id) || []
    );
    
    // Process of elimination: if not client or seller, must be admin
    const clientUserId = ticket.client?.user_id;
    const sellerUserId = ticket.seller?.user_id;
    
    return messages.map(msg => {
      let senderName = "Unknown";
      let senderType: "admin" | "client" | "seller" | "unknown" = "unknown";
      
      // Check if admin (by role or process of elimination)
      if (adminUserIds.has(msg.user_id) || (msg.user_id !== clientUserId && msg.user_id !== sellerUserId && msg.user_id)) {
        senderName = "The Vault Network";
        senderType = "admin";
      } else if (msg.user_id === clientUserId) {
        senderName = ticket.client?.business_name || "Client";
        senderType = "client";
      } else if (msg.user_id === sellerUserId) {
        senderName = ticket.seller?.business_name || "Partner";
        senderType = "seller";
      }
      
      return { ...msg, senderName, senderType };
    });
  };

  const openTicketChat = async (ticket: TicketData) => {
    setSelectedTicket(ticket);
    setShowTicketDialog(true);
    
    // Fetch messages for this ticket
    try {
      const { data: messages, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticket.id)
        .eq("is_internal", false) // Don't show internal notes to clients
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Enrich messages with sender info
      const enrichedMessages = await identifyMessageSender(messages || [], ticket);
      setTicketMessages(enrichedMessages);
      
      // Set up real-time subscription for new messages
      const channel = supabase
        .channel(`ticket_messages_${ticket.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ticket_messages',
            filter: `ticket_id=eq.${ticket.id}`,
          },
          async () => {
            // Fetch updated messages
            const { data: updatedMessages } = await supabase
              .from("ticket_messages")
              .select("*")
              .eq("ticket_id", ticket.id)
              .eq("is_internal", false)
              .order("created_at", { ascending: true });
            
            if (updatedMessages) {
              const reEnriched = await identifyMessageSender(updatedMessages, ticket);
              setTicketMessages(reEnriched);
              setTimeout(() => {
                ticketMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }
          }
        )
        .subscribe();
      
      setTicketChannel(channel);
    } catch (error: any) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendTicketMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: selectedTicket.id,
        user_id: user?.id,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      // Refresh messages using helper function
      const { data: messages } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", selectedTicket.id)
        .eq("is_internal", false)
        .order("created_at", { ascending: true });

      if (messages) {
        const enriched = await identifyMessageSender(messages, selectedTicket);
        setTicketMessages(enriched);
        setTimeout(() => {
          ticketMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
      
      // Refresh ticket list
      fetchClientData();
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle notification events (after functions are defined)
  useEffect(() => {
    // Handle opening ticket from notification
    const handleOpenTicket = (event: CustomEvent) => {
      const ticketId = event.detail.ticketId;
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        openTicketChat(ticket);
      }
    };
    
    window.addEventListener('openTicket', handleOpenTicket as EventListener);
    
    return () => {
      window.removeEventListener('openTicket', handleOpenTicket as EventListener);
    };
  }, [tickets]);

  // Cleanup ticket channel subscription when dialog closes
  useEffect(() => {
    return () => {
      if (ticketChannel) {
        supabase.removeChannel(ticketChannel);
        setTicketChannel(null);
      }
    };
  }, [ticketChannel]);

  // Cleanup subscription when dialog closes
  useEffect(() => {
    if (!showTicketDialog && ticketChannel) {
      supabase.removeChannel(ticketChannel);
      setTicketChannel(null);
    }
  }, [showTicketDialog, ticketChannel]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="relative py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-background to-muted/10"></div>
        
        <div className="relative z-10 container mx-auto">
          <div className="mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-primary">
              Client Dashboard
            </h1>
            <p className="text-xl text-muted-foreground">
              Welcome back, {clientData?.business_name}
            </p>
          </div>

          {/* Onboarding Section - Show for new clients or clients without automations */}
          {(automations.length === 0 || (clientData && new Date(clientData.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000)) && (
            <Card className="mb-12 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Welcome to Vault Network!
                </CardTitle>
                <CardDescription>Here's how your automation journey works</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Partner Information */}
                  {partnerData ? (
                    <div className="p-4 bg-background/50 rounded-lg border border-border">
                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">Your Partner</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            You're working with <span className="font-medium text-foreground">{partnerData.business_name}</span>
                            {partnerData.contact_name && ` (${partnerData.contact_name})`}
                          </p>
                          {partnerData.email && (
                            <p className="text-xs text-muted-foreground">
                              Contact: <a href={`mailto:${partnerData.email}`} className="text-primary hover:underline">{partnerData.email}</a>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/30 rounded-lg border border-border">
                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">No Partner Assigned</h3>
                          <p className="text-sm text-muted-foreground">
                            You signed up without a referral code. Contact support if you need assistance.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Workflow Steps */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Your Automation Workflow</h3>
                    
                    {/* Step 1 */}
                    <div className="flex gap-4 p-4 rounded-lg border bg-primary/5 border-primary/20">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold bg-primary text-primary-foreground">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">Account Created</h4>
                          {clientData && <CheckCircle className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Your business account has been successfully created.
                        </p>
                        {clientData && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Created: {new Date(clientData.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className={`flex gap-4 p-4 rounded-lg border ${automations.length === 0 ? 'bg-muted/20 border-border' : 'bg-primary/5 border-primary/20'}`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        automations.length === 0 
                          ? 'bg-muted text-muted-foreground' 
                          : 'bg-primary text-primary-foreground'
                      }`}>
                        2
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">
                            {automations.length === 0 ? 'Waiting for Automation Assignment' : 'Automations Assigned'}
                          </h4>
                          {automations.length > 0 ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        {automations.length === 0 ? (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {partnerData 
                                ? `Your partner (${partnerData.business_name}) will assign automations to you. They'll select the best solutions for your business needs.`
                                : 'Automations will be assigned to you by your partner. Contact support if you need assistance.'}
                            </p>
                            {partnerData && (
                              <p className="text-xs text-muted-foreground">
                                💡 Tip: You can reach out to your partner if you have specific automation needs.
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Great! You have {automations.length} automation{automations.length !== 1 ? 's' : ''} assigned. Review them below.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className={`flex gap-4 p-4 rounded-lg border ${
                      automations.length > 0 && automations.some(a => a.payment_status === 'paid')
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-muted/20 border-border'
                    }`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        automations.length > 0 && automations.some(a => a.payment_status === 'paid')
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        3
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">Purchase & Setup</h4>
                          {automations.some(a => a.payment_status === 'paid') ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : automations.length > 0 ? (
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          ) : null}
                        </div>
                        {automations.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Once automations are assigned, you can review and purchase them here.
                          </p>
                        ) : automations.some(a => a.payment_status === 'paid') ? (
                          <p className="text-sm text-muted-foreground">
                            You've purchased automation{automations.filter(a => a.payment_status === 'paid').length !== 1 ? 's' : ''}! Setup will begin soon.
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Review the assigned automations below and click "Purchase Now" to get started.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className={`flex gap-4 p-4 rounded-lg border ${
                      automations.some(a => a.setup_status === 'active')
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-muted/20 border-border'
                    }`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        automations.some(a => a.setup_status === 'active')
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        4
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">Automation Active</h4>
                          {automations.some(a => a.setup_status === 'active') && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Once setup is complete, your automations will be active and running for your business.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${clientData?.total_spent.toFixed(2) || "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Services</CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {transactions.filter(t => t.transaction_type === "monthly").length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {tickets.filter(t => t.status === "open" || t.status === "waiting_for_seller" || t.status === "in_progress").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assigned Automations Section */}
          <Card className="mb-12 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-primary">Your Assigned Automations</CardTitle>
              <CardDescription>
                {automations.length === 0 
                  ? "Automations assigned to you by your partner will appear here"
                  : "Automations assigned to you by your partner"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {automations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Automations Assigned Yet</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    {partnerData 
                      ? `Your partner (${partnerData.business_name}) will assign automations to you soon. They'll select the best solutions tailored to your business needs.`
                      : 'Automations will be assigned to you by your partner. Contact support if you need assistance.'}
                  </p>
                  {partnerData && (
                    <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border max-w-md mx-auto">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong className="text-foreground">Need help?</strong> Reach out to your partner:
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{partnerData.business_name}</span>
                        {partnerData.email && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <a 
                              href={`mailto:${partnerData.email}`} 
                              className="text-sm text-primary hover:underline"
                            >
                              {partnerData.email}
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {automations.map((automation) => (
                    <Card key={automation.id} className="bg-muted/20 border-border">
                      {automation.image_url && (
                        <div className="h-48 overflow-hidden rounded-t-lg">
                          <img
                            src={automation.image_url}
                            alt={automation.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-lg text-foreground">{automation.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{automation.description}</CardDescription>
                        {automation.category && (
                          <Badge variant="secondary" className="mt-2">{automation.category}</Badge>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Setup Fee:</span>
                            <span className="font-bold text-foreground">${automation.setup_price}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Monthly:</span>
                            <span className="font-bold text-primary">${automation.monthly_price}/mo</span>
                          </div>
                        </div>
                        {automation.features && Array.isArray(automation.features) && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-foreground mb-2">Features:</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {automation.features.slice(0, 3).map((feature: string, idx: number) => (
                                <li key={idx}>• {feature}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-4">
                          Assigned: {new Date(automation.assigned_at).toLocaleDateString()}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Payment:</span>
                              <Badge variant={automation.payment_status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                                {automation.payment_status === 'paid' ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Paid
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Unpaid
                                  </>
                                )}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Setup:</span>
                              <Badge 
                                variant={
                                  automation.setup_status === 'active' ? 'default' :
                                  automation.setup_status === 'setup_in_progress' ? 'secondary' : 'outline'
                                } 
                                className="text-xs"
                              >
                                {automation.setup_status === 'active' ? 'Active' :
                                 automation.setup_status === 'setup_in_progress' ? 'Setup In Progress' : 'Pending Setup'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleCheckout(automation)}
                          disabled={checkingOut === automation.id || !automation.stripe_setup_price_id || automation.payment_status === 'paid'}
                          className="w-full mt-4"
                          variant={automation.payment_status === 'paid' ? 'outline' : automation.stripe_setup_price_id ? "default" : "outline"}
                        >
                          {checkingOut === automation.id ? (
                            <>Processing...</>
                          ) : automation.payment_status === 'paid' ? (
                            <>Already Purchased</>
                          ) : automation.stripe_setup_price_id ? (
                            <>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Purchase Now
                            </>
                          ) : (
                            <>Not Available</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-primary">Transaction History</CardTitle>
                <CardDescription>Your recent payments and purchases</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No transactions yet</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card Layout */}
                    <div className="md:hidden space-y-3">
                      {transactions
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((transaction) => (
                        <Card key={transaction.id} className="bg-muted/20 border-border p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm capitalize">{transaction.transaction_type}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-3">
                              <div className="font-bold text-primary">${transaction.amount.toFixed(2)}</div>
                              <Badge variant={transaction.status === "completed" ? "default" : "secondary"} className="text-xs">
                                {transaction.status}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Desktop Table Layout */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="capitalize">{transaction.transaction_type}</TableCell>
                              <TableCell>
                                <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                                  {transaction.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">${transaction.amount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-primary">Create Support Ticket</CardTitle>
                <CardDescription>Have questions or need help? Submit a support ticket and we'll get back to you</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticket-title">Ticket Title *</Label>
                    <Input
                      id="ticket-title"
                      placeholder="Brief summary of your issue..."
                      value={newTicketTitle}
                      onChange={(e) => setNewTicketTitle(e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticket-description">Description *</Label>
                    <Textarea
                      id="ticket-description"
                      placeholder="Describe your issue or question in detail..."
                      value={newTicketDescription}
                      onChange={(e) => setNewTicketDescription(e.target.value)}
                      required
                      rows={6}
                      className="bg-input border-border"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? "Creating..." : "Create Ticket"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-primary">Your Support Tickets</CardTitle>
              <CardDescription>View and manage your support tickets</CardDescription>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">No support tickets yet</p>
                  <p className="text-xs text-muted-foreground">Create a ticket above to get help</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {tickets
                    .sort((a, b) => {
                      // Sort by status priority first, then by date
                      const statusPriority: Record<string, number> = {
                        'open': 1,
                        'waiting_for_seller': 2,
                        'in_progress': 3,
                        'waiting_for_client': 4,
                        'needs_vault_help': 5,
                        'resolved': 6,
                        'closed': 7
                      };
                      const statusDiff = (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
                      if (statusDiff !== 0) return statusDiff;
                      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    })
                    .map((ticket) => (
                    <Card key={ticket.id} className={`bg-muted/20 border-border ${
                      ticket.status === "open" || ticket.status === "waiting_for_seller" ? "border-primary/50" : ""
                    }`}>
                      <CardHeader className="p-3 sm:p-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-start gap-2">
                            <CardTitle className="text-base sm:text-lg flex-1 min-w-0 break-words">{ticket.title}</CardTitle>
                            <div className="flex flex-wrap gap-2 shrink-0">
                              <Badge variant={
                                ticket.status === "open" || ticket.status === "waiting_for_seller" ? "default" :
                                ticket.status === "in_progress" || ticket.status === "waiting_for_client" ? "secondary" :
                                ticket.status === "resolved" ? "default" : "outline"
                              } className="text-xs">
                                {ticket.status === "open" ? "Open" :
                                 ticket.status === "waiting_for_seller" ? "Waiting for Partner" :
                                 ticket.status === "waiting_for_client" ? "Waiting for You" :
                                 ticket.status === "in_progress" ? "In Progress" :
                                 ticket.status === "needs_vault_help" ? "Needs Vault Help" :
                                 ticket.status === "resolved" ? "Resolved" : "Closed"}
                              </Badge>
                              {ticket.needs_vault_help && (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                                  Vault Help
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                            <span>{ticket.seller ? `Partner: ${ticket.seller.business_name}` : "The Vault Network"}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0">
                        <p className="text-sm sm:text-base text-foreground mb-3 sm:mb-4 whitespace-pre-wrap break-words">{ticket.description}</p>
                        <Button
                          onClick={() => openTicketChat(ticket)}
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          View Conversation
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket Chat Dialog */}
          <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>{selectedTicket?.title || "Ticket Details"}</DialogTitle>
                <DialogDescription>
                  Ticket Details
                </DialogDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTicket?.client && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Client: {selectedTicket.client.business_name}
                    </Badge>
                  )}
                  {selectedTicket?.seller && (
                    <Badge variant="outline" className="bg-secondary/10 text-secondary-foreground border-secondary/20">
                      Partner: {selectedTicket.seller.business_name}
                    </Badge>
                  )}
                  {/* The Vault Network is always part of ticket chats */}
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                    The Vault Network
                  </Badge>
                </div>
              </DialogHeader>
              <ScrollArea className="flex-1 min-h-[400px] max-h-[500px] pr-4">
                <div className="space-y-4">
                  {ticketMessages.map((msg) => {
                    const isAdmin = msg.senderType === "admin";
                    const isClient = msg.senderType === "client";
                    const isSeller = msg.senderType === "seller";
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 bg-muted text-foreground`}
                        >
                          <p className={`text-xs font-semibold mb-1 ${
                            isAdmin ? 'text-yellow-600 dark:text-yellow-400 opacity-100 drop-shadow-[0_0_4px_rgba(234,179,8,0.6)]' : 
                            isClient ? 'text-sky-400 dark:text-sky-300 opacity-100' :
                            'text-green-600 dark:text-green-400 opacity-100'
                          }`}>
                            {msg.senderName || "Unknown"}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <p className={`text-xs mt-1 text-muted-foreground`}>
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={ticketMessagesEndRef} />
                </div>
              </ScrollArea>
              <div className="flex gap-2 pt-4 border-t">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendTicketMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={sendTicketMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendingMessage ? "Sending..." : "Send"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ClientDashboard;
