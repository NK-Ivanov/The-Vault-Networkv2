import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Users, TrendingUp, Package, Copy, Check, CheckCircle, XCircle, MessageSquare, AlertCircle, HelpCircle, Send, RefreshCw, LayoutDashboard, Building2, Boxes, CreditCard, Ticket, Mail, Trophy, MessageCircle, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface SellerData {
  id: string;
  business_name: string;
  status: string;
  referral_code: string;
  commission_rate: number;
  total_sales: number;
  total_commission: number;
}

interface TransactionData {
  id: string;
  amount: number;
  commission: number;
  seller_earnings: number;
  vault_share: number;
  commission_rate_used: number | null;
  transaction_type: string;
  status: string;
  created_at: string;
  client: {
    business_name: string;
  } | null;
  automation: {
    name: string;
  } | null;
}

interface ClientAutomationData {
  id: string;
  client_id: string;
  automation_id: string;
  payment_status: 'unpaid' | 'paid';
  setup_status: 'pending_setup' | 'setup_in_progress' | 'active';
  assigned_at: string;
  paid_at: string | null;
  client: {
    business_name: string;
    contact_name: string;
  };
  automation: {
    name: string;
    description: string;
  };
}

interface ClientData {
  id: string;
  business_name: string;
  contact_name: string;
  status: string;
  total_spent: number;
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
  default_commission_rate: number | null;
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
    contact_name: string;
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

interface SellerMessageData {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  replies: Array<{
    id: string;
    message: string;
    is_from_seller: boolean;
    created_at: string;
  }>;
}

interface LeaderboardEntry {
  rank: number;
  business_name: string;
  total_sales: number;
  total_commission: number;
  isCurrentUser: boolean;
}

const PartnerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sellerData, setSellerData] = useState<SellerData | null>(null);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [availableAutomations, setAvailableAutomations] = useState<AutomationData[]>([]);
  const [clientAutomations, setClientAutomations] = useState<ClientAutomationData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [sellerMessages, setSellerMessages] = useState<SellerMessageData[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedAutomation, setSelectedAutomation] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingReferralCode, setEditingReferralCode] = useState(false);
  const [newReferralCode, setNewReferralCode] = useState("");
  const [updatingReferralCode, setUpdatingReferralCode] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Ticket chat state
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessageData[]>([]);
  const ticketMessagesEndRef = useRef<HTMLDivElement>(null);
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [sendingTicketMessage, setSendingTicketMessage] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [requestingVaultHelp, setRequestingVaultHelp] = useState(false);
  const [ticketChannel, setTicketChannel] = useState<any>(null);
  
  // Seller message state
  const [newSellerMessageSubject, setNewSellerMessageSubject] = useState("");
  const [newSellerMessageBody, setNewSellerMessageBody] = useState("");
  const [selectedSellerMessage, setSelectedSellerMessage] = useState<SellerMessageData | null>(null);
  const [sellerMessageReplies, setSellerMessageReplies] = useState<Array<{id: string; message: string; is_from_seller: boolean; created_at: string}>>([]);
  const [newSellerMessageReply, setNewSellerMessageReply] = useState("");
  const [sendingSellerReply, setSendingSellerReply] = useState(false);
  const [showSellerMessageDialog, setShowSellerMessageDialog] = useState(false);
  const [submittingSellerMessage, setSubmittingSellerMessage] = useState(false);
  
  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

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
      const { data: seller, error: sellerError } = await supabase
        .from("sellers")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (sellerError) throw sellerError;

      if (!seller) {
        toast({
          title: "No seller account found",
          description: "Please apply to become a partner first.",
          variant: "destructive",
        });
        navigate("/partners");
        return;
      }

      setSellerData(seller);

      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("seller_id", seller.id);

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Fetch automations available to this seller
      const { data: automationsData, error: automationsError } = await supabase
        .from("seller_automations")
        .select(`
          automation_id,
          automations (
            id,
            name,
            description,
            category,
            setup_price,
            monthly_price,
            image_url,
            features,
            default_commission_rate
          )
        `)
        .eq("seller_id", seller.id);

      if (automationsError) throw automationsError;
      
      // Transform the data
      const transformedAutomations = (automationsData || []).map((sa: any) => ({
        id: sa.automations.id,
        name: sa.automations.name,
        description: sa.automations.description,
        category: sa.automations.category,
        setup_price: sa.automations.setup_price,
        monthly_price: sa.automations.monthly_price,
        image_url: sa.automations.image_url,
        features: sa.automations.features,
        default_commission_rate: sa.automations.default_commission_rate,
      }));
      
      setAvailableAutomations(transformedAutomations);
      
      // Fetch client automations with payment and setup status
      const { data: clientAutomationsData, error: clientAutomationsError } = await supabase
        .from("client_automations")
        .select(`
          *,
          client:clients!client_automations_client_id_fkey (
            business_name,
            contact_name
          ),
          automation:automations!client_automations_automation_id_fkey (
            name,
            description
          )
        `)
        .eq("seller_id", seller.id)
        .order("assigned_at", { ascending: false });

      if (clientAutomationsError) throw clientAutomationsError;
      
      // Transform client automations data
      const transformedClientAutomations = (clientAutomationsData || []).map((ca: any) => ({
        id: ca.id,
        client_id: ca.client_id,
        automation_id: ca.automation_id,
        payment_status: ca.payment_status || 'unpaid',
        setup_status: ca.setup_status || 'pending_setup',
        assigned_at: ca.assigned_at,
        paid_at: ca.paid_at,
        client: ca.client,
        automation: ca.automation,
      }));
      
      setClientAutomations(transformedClientAutomations);
      
      // Fetch transactions for this seller
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select(`
          *,
          client:clients!transactions_client_id_fkey (
            business_name
          ),
          automation:automations!transactions_automation_id_fkey (
            name
          )
        `)
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;
      
      const transformedTransactions = (transactionsData || []).map((t: any) => ({
        id: t.id,
        amount: t.amount,
        commission: t.commission || 0,
        seller_earnings: t.seller_earnings || t.commission || 0,
        vault_share: t.vault_share || (t.amount - (t.commission || 0)),
        commission_rate_used: t.commission_rate_used,
        transaction_type: t.transaction_type,
        status: t.status,
        created_at: t.created_at,
        client: t.client,
        automation: t.automation,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setTransactions(transformedTransactions);
      
      // Fetch tickets from seller's clients
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("tickets")
        .select(`
          *,
          client:clients!tickets_client_id_fkey (
            id,
            business_name,
            contact_name,
            user_id
          ),
          seller:sellers!tickets_seller_id_fkey (
            id,
            business_name,
            user_id
          )
        `)
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false });

      if (ticketsError) throw ticketsError;
      setTickets(ticketsData || []);
      
      // Fetch seller messages to Vault Network
      const { data: sellerMessagesData, error: sellerMessagesError } = await supabase
        .from("seller_messages")
        .select("*")
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false });

      if (sellerMessagesError) throw sellerMessagesError;
      
      // Fetch replies for each message
      const messagesWithReplies = await Promise.all(
        (sellerMessagesData || []).map(async (msg) => {
          const { data: replies } = await supabase
            .from("seller_message_replies")
            .select("*")
            .eq("seller_message_id", msg.id)
            .order("created_at", { ascending: true });
          
          return {
            ...msg,
            replies: replies || [],
          };
        })
      );
      
      setSellerMessages(messagesWithReplies);
      
      // Set initial referral code for editing
      if (seller.referral_code) {
        setNewReferralCode(seller.referral_code);
      }
      
      // Fetch leaderboard
      fetchLeaderboard(seller.id);
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

  const handleUpdateReferralCode = async () => {
    if (!newReferralCode.trim()) {
      toast({
        title: "Referral code required",
        description: "Please enter a referral code",
        variant: "destructive",
      });
      return;
    }

    // Validate format (alphanumeric, dashes, underscores only)
    if (!/^[A-Za-z0-9_-]+$/.test(newReferralCode.trim())) {
      toast({
        title: "Invalid format",
        description: "Referral code can only contain letters, numbers, dashes, and underscores",
        variant: "destructive",
      });
      return;
    }

    setUpdatingReferralCode(true);
    try {
      const { error } = await supabase
        .from("sellers")
        .update({ referral_code: newReferralCode.trim().toUpperCase() })
        .eq("id", sellerData?.id);

      if (error) {
        if (error.message.includes("unique") || error.message.includes("already exists")) {
          throw new Error("This referral code is already taken. Please choose another one.");
        }
        throw error;
      }

      toast({
        title: "Referral Code Updated!",
        description: "Your referral code has been updated successfully.",
      });

      setEditingReferralCode(false);
      fetchSellerData();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingReferralCode(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/for-businesses?ref=${sellerData?.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Share this link with potential clients",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchLeaderboard = async (currentSellerId: string) => {
    setLoadingLeaderboard(true);
    try {
      // Fetch top sellers by total_sales (excluding "The Vault Network")
      const { data: sellers, error } = await supabase
        .from("sellers")
        .select("id, business_name, total_sales, total_commission")
        .neq("business_name", "The Vault Network")
        .order("total_sales", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Transform to leaderboard entries with ranks
      const entries: LeaderboardEntry[] = (sellers || []).map((seller, index) => ({
        rank: index + 1,
        business_name: seller.business_name,
        total_sales: seller.total_sales || 0,
        total_commission: seller.total_commission || 0,
        isCurrentUser: seller.id === currentSellerId,
      }));

      setLeaderboard(entries);
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
      // Don't show error toast - leaderboard is not critical
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleAssignAutomation = async () => {
    if (!selectedClient || !selectedAutomation) {
      toast({
        title: "Selection required",
        description: "Please select both a client and an automation",
        variant: "destructive",
      });
      return;
    }

    setAssigning(true);
    try {
      // Check if already assigned
      const { data: existing } = await supabase
        .from("client_automations")
        .select("id")
        .eq("client_id", selectedClient)
        .eq("automation_id", selectedAutomation)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Already assigned",
          description: "This automation is already assigned to this client",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("client_automations").insert({
        client_id: selectedClient,
        automation_id: selectedAutomation,
        seller_id: sellerData?.id,
        status: "active",
      });

      if (error) throw error;

      toast({
        title: "Automation Assigned!",
        description: "The automation has been assigned to the client",
      });

      setSelectedClient("");
      setSelectedAutomation("");
    } catch (error: any) {
      toast({
        title: "Assignment failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const openTicketChat = async (ticket: TicketData) => {
    setSelectedTicket(ticket);
    setShowTicketDialog(true);
    
    // Clean up any existing subscription
    if (ticketChannel) {
      supabase.removeChannel(ticketChannel);
      setTicketChannel(null);
    }
    
    // Fetch messages for this ticket
    await fetchTicketMessages(ticket);
    
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
        async (payload) => {
          console.log("Real-time message received:", payload);
          // Refresh messages when new one is inserted
          await fetchTicketMessages(ticket);
        }
      )
      .subscribe();
    
    setTicketChannel(channel);
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

  const fetchTicketMessages = async (ticket: TicketData) => {
    try {
      const { data: messages, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }
      
      // Enrich messages with sender info
      const enrichedMessages = await identifyMessageSender(messages || [], ticket);
      setTicketMessages(enrichedMessages);
    } catch (error: any) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendTicketMessage = async () => {
    if (!newTicketMessage.trim() || !selectedTicket) return;

    setSendingTicketMessage(true);
    try {
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: selectedTicket.id,
        user_id: user?.id,
        message: newTicketMessage.trim(),
      });

      if (error) throw error;

      setNewTicketMessage("");
      
      // Refresh messages using the fetch function
      if (selectedTicket) {
        await fetchTicketMessages(selectedTicket);
        setTimeout(() => {
          ticketMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
      
      fetchSellerData();
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingTicketMessage(false);
    }
  };

  const requestVaultHelp = async () => {
    if (!selectedTicket) return;

    setRequestingVaultHelp(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ 
          needs_vault_help: true,
          status: "needs_vault_help"
        })
        .eq("id", selectedTicket.id);

      if (error) throw error;

      toast({
        title: "Help Requested!",
        description: "The Vault Network team has been notified and will assist with this ticket.",
      });

      fetchSellerData();
      setShowTicketDialog(false);
    } catch (error: any) {
      toast({
        title: "Failed to request help",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRequestingVaultHelp(false);
    }
  };

  const handleCreateSellerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSellerMessageSubject.trim() || !newSellerMessageBody.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a subject and message.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingSellerMessage(true);
    try {
      const { error } = await supabase.from("seller_messages").insert({
        seller_id: sellerData?.id,
        subject: newSellerMessageSubject.trim(),
        message: newSellerMessageBody.trim(),
        status: "open",
      });

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: "Your message has been sent to The Vault Network team.",
      });

      setNewSellerMessageSubject("");
      setNewSellerMessageBody("");
      fetchSellerData();
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingSellerMessage(false);
    }
  };

  const openSellerMessage = async (message: SellerMessageData) => {
    setSelectedSellerMessage(message);
    setSellerMessageReplies(message.replies || []);
    setShowSellerMessageDialog(true);
  };

  const sendSellerMessageReply = async () => {
    if (!newSellerMessageReply.trim() || !selectedSellerMessage) return;

    setSendingSellerReply(true);
    try {
      const { error } = await supabase.from("seller_message_replies").insert({
        seller_message_id: selectedSellerMessage.id,
        user_id: user?.id,
        message: newSellerMessageReply.trim(),
        is_from_seller: true,
      });

      if (error) throw error;

      setNewSellerMessageReply("");
      // Refresh replies
      const { data: replies } = await supabase
        .from("seller_message_replies")
        .select("*")
        .eq("seller_message_id", selectedSellerMessage.id)
        .order("created_at", { ascending: true });

      setSellerMessageReplies(replies || []);
      fetchSellerData();
    } catch (error: any) {
      toast({
        title: "Failed to send reply",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingSellerReply(false);
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
    
    // Handle opening seller message from notification
    const handleOpenSellerMessage = (event: CustomEvent) => {
      const messageId = event.detail.messageId;
      const message = sellerMessages.find(m => m.id === messageId);
      if (message) {
        openSellerMessage(message);
      }
    };
    
    window.addEventListener('openTicket', handleOpenTicket as EventListener);
    window.addEventListener('openSellerMessage', handleOpenSellerMessage as EventListener);
    
    return () => {
      window.removeEventListener('openTicket', handleOpenTicket as EventListener);
      window.removeEventListener('openSellerMessage', handleOpenSellerMessage as EventListener);
    };
  }, [tickets, sellerMessages]);

  // Refresh messages when dialog opens
  useEffect(() => {
    if (showTicketDialog && selectedTicket) {
      fetchTicketMessages(selectedTicket);
    }
  }, [showTicketDialog, selectedTicket?.id]);

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

  if (sellerData?.status === "pending") {
    // Contact information for partner applications
    const CONTACT_INFO = {
      whatsapp: "+44 XXXXX", // Update with actual WhatsApp number
      discordChannel: "#partner-applications", // Update with actual Discord channel name
    };

    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-[80vh]">
          <Card className="max-w-2xl w-full bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Application Pending</CardTitle>
              <CardDescription>Your partner application is under review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Thank you for applying to become a Vault Network partner. Your application is currently under review and we'll get back to you soon.
              </p>
              
              {/* Contact Information Section */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm font-semibold text-foreground mb-3">
                  Next Steps - Verify Your Application:
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Please contact us via Discord or WhatsApp to verify your application and join our partner community.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">Discord</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Join our Discord server and create a ticket in the <span className="font-mono text-primary">{CONTACT_INFO.discordChannel}</span> channel
                      </p>
                      <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border border-border">
                        <strong>In your ticket, include:</strong> "I just applied to be a partner - {sellerData?.business_name || 'Your Name'}" or "Partner application verification - {user?.email || 'Your Email'}"
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">WhatsApp</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Message us at: <span className="font-mono text-primary">{CONTACT_INFO.whatsapp}</span>
                      </p>
                      <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border border-border">
                        <strong>Message example:</strong> "Partner application verification - {sellerData?.business_name || 'Your Name'} - {user?.email || 'Your Email'}"
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-primary/10">
                  <strong>Privacy Note:</strong> Only share your application name/business name and email address to verify your identity. We'll match it with your application.
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                  Return Home
                </Button>
                <Button onClick={() => window.location.reload()} className="flex-1">
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <section className="relative py-8 sm:py-12 md:py-20 px-4 sm:px-6 flex-1">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-background to-muted/10"></div>
        
        <div className="relative z-10 container mx-auto">
          <div className="mb-6 sm:mb-8 md:mb-12">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 text-primary">
              Partner Dashboard
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
              Welcome back, {sellerData?.business_name}
            </p>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="pt-4 sm:pt-6">
              {/* Mobile Select Navigation */}
              <div className="md:hidden mb-4">
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="clients">Clients</SelectItem>
                    <SelectItem value="automations">Automations</SelectItem>
                    <SelectItem value="earnings">Earnings</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop Tabs Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="hidden md:grid w-full grid-cols-5 mb-6 h-auto p-1 bg-muted/50 gap-1">
                  <TabsTrigger value="overview" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="clients" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <Building2 className="w-4 h-4" />
                    <span>Clients</span>
                  </TabsTrigger>
                  <TabsTrigger value="automations" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <Boxes className="w-4 h-4" />
                    <span>Automations</span>
                  </TabsTrigger>
                  <TabsTrigger value="earnings" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <CreditCard className="w-4 h-4" />
                    <span>Earnings</span>
                  </TabsTrigger>
                  <TabsTrigger value="support" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <Ticket className="w-4 h-4" />
                    <span>Support</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 sm:space-y-6 min-h-[400px] sm:min-h-[500px]">
                  <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg text-primary">Your Referral Link</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Share this link with potential clients to earn commission</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center mb-3 sm:mb-4">
                        <div className="flex-1 w-full p-3 sm:p-4 md:p-5 bg-background rounded-lg border border-border font-mono text-sm sm:text-base md:text-lg overflow-x-auto">
                          {window.location.origin}/for-businesses?ref={sellerData?.referral_code || "YOUR-CODE"}
                        </div>
                        <Button onClick={copyReferralLink} variant="outline" size="icon" className="shrink-0 w-full sm:w-auto h-10 sm:h-11 md:h-12">
                          {copied ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : <Copy className="h-4 w-4 sm:h-5 sm:w-5" />}
                        </Button>
                      </div>
                      
                      {!editingReferralCode ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Your referral code: <span className="font-bold text-primary">{sellerData?.referral_code || "Not set"}</span>
                          </p>
                          <Button 
                            onClick={() => {
                              setEditingReferralCode(true);
                              setNewReferralCode(sellerData?.referral_code || "");
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            Edit Code
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              value={newReferralCode}
                              onChange={(e) => setNewReferralCode(e.target.value.toUpperCase())}
                              placeholder="Enter your referral code"
                              className="font-mono text-xs sm:text-sm"
                              maxLength={50}
                            />
                            <Button 
                              onClick={handleUpdateReferralCode}
                              disabled={updatingReferralCode}
                              size="sm"
                              className="w-full sm:w-auto"
                            >
                              {updatingReferralCode ? "Saving..." : "Save"}
                            </Button>
                            <Button 
                              onClick={() => {
                                setEditingReferralCode(false);
                                setNewReferralCode(sellerData?.referral_code || "");
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                            >
                              Cancel
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Referral codes must be unique. Use letters, numbers, dashes, and underscores only.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="bg-card border-border">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 sm:h-6 sm:w-6"
                            onClick={fetchSellerData}
                            title="Refresh"
                          >
                            <TrendingUp className="h-3 w-3" />
                          </Button>
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-foreground">
                          ${sellerData?.total_sales?.toFixed(2) || "0.00"}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Commission Earned</CardTitle>
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-foreground">
                          ${sellerData?.total_commission?.toFixed(2) || "0.00"}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-foreground">
                          {clients.filter(c => c.status === "active").length}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Commission Rate</CardTitle>
                        <Package className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-foreground">
                          {sellerData?.commission_rate ? `${sellerData.commission_rate}%` : 'Auto'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {sellerData?.commission_rate 
                            ? 'Custom rate (overrides automation defaults)'
                            : 'Uses each automation\'s default rate'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Stats Summary */}
                  <Card className="bg-card border-border mt-4 sm:mt-6">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg text-primary">Quick Overview</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Summary of your partner activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Total Automations Assigned</span>
                            <span className="font-bold text-foreground">{clientAutomations.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Active Automations</span>
                            <span className="font-bold text-primary">
                              {clientAutomations.filter(ca => ca.setup_status === 'active').length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Pending Setup</span>
                            <span className="font-bold text-muted-foreground">
                              {clientAutomations.filter(ca => ca.setup_status === 'pending_setup').length}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Open Tickets</span>
                            <span className="font-bold text-foreground">
                              {tickets.filter(t => t.status === 'open' || t.status === 'waiting_for_seller').length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Total Transactions</span>
                            <span className="font-bold text-primary">{transactions.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Available Automations</span>
                            <span className="font-bold text-primary">{availableAutomations.length}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Partner Leaderboard */}
                  <Card className="bg-card border-border mt-4 sm:mt-6">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary" />
                        <CardTitle className="text-base sm:text-lg text-primary">Top Partners Leaderboard</CardTitle>
                      </div>
                      <CardDescription className="text-xs sm:text-sm">See how you rank among top-performing partners</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingLeaderboard ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Loading leaderboard...
                        </div>
                      ) : leaderboard.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No leaderboard data available yet
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {leaderboard.map((entry) => (
                            <div
                              key={entry.rank}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                entry.isCurrentUser
                                  ? 'bg-primary/10 border-primary/30 shadow-sm'
                                  : 'bg-muted/30 border-border'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                  entry.rank === 1
                                    ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                                    : entry.rank === 2
                                    ? 'bg-gray-400/20 text-gray-600 dark:text-gray-400'
                                    : entry.rank === 3
                                    ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {entry.rank}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`font-semibold text-sm sm:text-base truncate ${
                                    entry.isCurrentUser ? 'text-primary' : 'text-foreground'
                                  }`}>
                                    {entry.business_name}
                                    {entry.isCurrentUser && (
                                      <Badge variant="outline" className="ml-2 text-xs bg-primary/20 text-primary border-primary/30">
                                        You
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    ${entry.total_sales.toFixed(2)} sales
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <div className="text-xs sm:text-sm font-bold text-primary">
                                  ${entry.total_commission.toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  earned
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="clients" className="space-y-4 sm:space-y-6">
                  {availableAutomations.length > 0 && clients.length > 0 && (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg text-primary">Assign Automation to Client</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Select a client and automation to assign</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Select Client</label>
                    <select
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className="w-full p-2 bg-input border border-border rounded-md text-foreground"
                    >
                      <option value="">Choose a client...</option>
                      {clients.filter(c => c.status === "active").map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.business_name} - {client.contact_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Select Automation</label>
                    <select
                      value={selectedAutomation}
                      onChange={(e) => setSelectedAutomation(e.target.value)}
                      className="w-full p-2 bg-input border border-border rounded-md text-foreground"
                    >
                      <option value="">Choose an automation...</option>
                      {availableAutomations.map((automation) => (
                        <option key={automation.id} value={automation.id}>
                          {automation.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button
                  onClick={handleAssignAutomation}
                  disabled={assigning || !selectedClient || !selectedAutomation}
                  className="w-full"
                >
                  {assigning ? "Assigning..." : "Assign Automation"}
                </Button>
              </CardContent>
            </Card>
          )}

                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg text-primary">Your Clients</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Manage and track your client relationships</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {clients.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                          <p className="text-sm sm:text-base text-muted-foreground mb-4">No clients yet. Share your referral link!</p>
                          <Button onClick={copyReferralLink} size="sm" className="sm:size-default">
                            Copy Referral Link
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Mobile Card Layout */}
                          <div className="md:hidden space-y-3">
                            {clients.map((client) => (
                              <Card key={client.id} className="bg-muted/20 border-border p-3">
                                <div className="space-y-2">
                                  <div className="font-medium text-sm">{client.business_name}</div>
                                  <div className="text-xs text-muted-foreground">{client.contact_name}</div>
                                  <div className="flex items-center justify-between pt-2 border-t border-border">
                                    <Badge variant={client.status === "active" ? "default" : "secondary"} className="text-xs">
                                      {client.status}
                                    </Badge>
                                    <div className="text-right">
                                      <div className="text-xs text-muted-foreground">Total Spent</div>
                                      <div className="font-medium">${client.total_spent.toFixed(2)}</div>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                          
                          {/* Desktop Table Layout */}
                          <div className="hidden md:block overflow-x-auto">
                            <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Business Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total Spent</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {clients.map((client) => (
                                <TableRow key={client.id}>
                                  <TableCell className="font-medium">{client.business_name}</TableCell>
                                  <TableCell>{client.contact_name}</TableCell>
                                  <TableCell>
                                    <Badge variant={client.status === "active" ? "default" : "secondary"}>
                                      {client.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">${client.total_spent.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="automations" className="space-y-4 sm:space-y-6">
                  {availableAutomations.length > 0 && (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg text-primary">Available Automations</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Automations you can assign to clients</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 sm:space-y-4">
                  {availableAutomations.map((automation) => (
                    <Card key={automation.id} className="bg-muted/20 border-border">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              <CardTitle className="text-base sm:text-lg text-foreground flex-1">{automation.name}</CardTitle>
                              {automation.category && (
                                <Badge variant="secondary" className="shrink-0">{automation.category}</Badge>
                              )}
                            </div>
                            <CardDescription className="text-xs sm:text-sm line-clamp-2 mb-2">{automation.description}</CardDescription>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm">
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Setup:</span>
                                <span className="font-bold text-foreground">${automation.setup_price}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Monthly:</span>
                                <span className="font-bold text-primary">${automation.monthly_price}/mo</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Commission:</span>
                                <span className="font-bold text-primary">
                                  {sellerData?.commission_rate 
                                    ? `${sellerData.commission_rate}%` 
                                    : automation.default_commission_rate 
                                      ? `${automation.default_commission_rate}%`
                                      : '20%'}
                                </span>
                              </div>
                            </div>
                            {(sellerData?.commission_rate || automation.default_commission_rate) && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {sellerData?.commission_rate ? 'Your custom rate' : 'Automation default rate'}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

                  {clientAutomations.length > 0 && (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg text-primary">Client Automations</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Track automations assigned to your clients and their payment/setup status</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Mobile Card Layout */}
                        <div className="md:hidden space-y-3">
                          {clientAutomations.map((ca) => (
                            <Card key={ca.id} className="bg-muted/20 border-border p-3">
                              <div className="space-y-2">
                                <div>
                                  <div className="font-medium text-sm">{ca.client?.business_name || 'Unknown'}</div>
                                  <div className="text-xs text-muted-foreground">{ca.client?.contact_name}</div>
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{ca.automation?.name || 'Unknown'}</div>
                                  <div className="text-xs text-muted-foreground line-clamp-2">{ca.automation?.description}</div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant={ca.payment_status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                                    {ca.payment_status === 'paid' ? (
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
                                  {ca.paid_at && (
                                    <span className="text-xs text-muted-foreground">
                                      Paid: {new Date(ca.paid_at).toLocaleDateString()}
                                    </span>
                                  )}
                                  <Badge 
                                    variant={
                                      ca.setup_status === 'active' ? 'default' :
                                      ca.setup_status === 'setup_in_progress' ? 'secondary' : 'outline'
                                    }
                                    className="text-xs"
                                  >
                                    {ca.setup_status === 'active' ? 'Active' :
                                     ca.setup_status === 'setup_in_progress' ? 'Setup In Progress' : 'Pending Setup'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Assigned: {new Date(ca.assigned_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                        
                        {/* Desktop Table Layout */}
                        <div className="hidden md:block overflow-x-auto">
                          <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Automation</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Setup Status</TableHead>
                      <TableHead>Assigned Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientAutomations.map((ca) => (
                      <TableRow key={ca.id}>
                        <TableCell className="font-medium">
                          {ca.client?.business_name || 'Unknown'}
                          <div className="text-xs text-muted-foreground">
                            {ca.client?.contact_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{ca.automation?.name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {ca.automation?.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ca.payment_status === 'paid' ? 'default' : 'secondary'}>
                            {ca.payment_status === 'paid' ? (
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
                          {ca.paid_at && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Paid: {new Date(ca.paid_at).toLocaleDateString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              ca.setup_status === 'active' ? 'default' :
                              ca.setup_status === 'setup_in_progress' ? 'secondary' : 'outline'
                            }
                          >
                            {ca.setup_status === 'active' ? 'Active' :
                             ca.setup_status === 'setup_in_progress' ? 'Setup In Progress' : 'Pending Setup'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            {new Date(ca.assigned_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="earnings" className="space-y-4 sm:space-y-6">
                  {transactions.length > 0 ? (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg text-primary">Transaction History & Earnings</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          View your sales and commission breakdown. Each transaction shows how the payment was split.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Mobile Card Layout */}
                        <div className="md:hidden space-y-3">
                          {transactions
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((transaction) => (
                            <Card key={transaction.id} className="bg-muted/20 border-border p-3">
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium text-sm">{transaction.client?.business_name || 'Unknown'}</div>
                                    <div className="text-xs text-muted-foreground">{transaction.automation?.name || 'Unknown'}</div>
                                  </div>
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {transaction.transaction_type}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(transaction.created_at).toLocaleDateString()}
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                                  <div>
                                    <div className="text-xs text-muted-foreground">Sale Amount</div>
                                    <div className="font-medium">${transaction.amount.toFixed(2)}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Your Earnings</div>
                                    <div className="font-bold text-primary">${transaction.seller_earnings.toFixed(2)}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Vault Share</div>
                                    <div className="text-muted-foreground">${transaction.vault_share.toFixed(2)}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Rate Used</div>
                                    <div className="text-xs font-mono">
                                      {transaction.commission_rate_used !== null ? `${transaction.commission_rate_used}%` : 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                        
                        {/* Desktop Table Layout */}
                        <div className="hidden md:block overflow-x-auto">
                          <Table>
                            <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Automation</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Sale Amount</TableHead>
                      <TableHead className="text-right">Your Earnings</TableHead>
                      <TableHead className="text-right">Vault Share</TableHead>
                      <TableHead>Rate Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-sm">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.client?.business_name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {transaction.automation?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {transaction.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${transaction.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          ${transaction.seller_earnings.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ${transaction.vault_share.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {transaction.commission_rate_used !== null ? (
                            <span className="text-sm font-mono">{transaction.commission_rate_used}%</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                        </div>
                        <div className="mt-4 p-4 bg-muted/20 rounded-lg border border-border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Sales:</span>
                      <span className="font-bold ml-2">${transactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Earnings:</span>
                      <span className="font-bold text-primary ml-2">${transactions.reduce((sum, t) => sum + t.seller_earnings, 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
                  ) : (
                    <Card className="bg-card border-border">
                      <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                          <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No transactions yet. Start assigning automations to clients!</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="support" className="space-y-4 sm:space-y-6">
                  {tickets.length > 0 && (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg text-primary">Client Support Tickets</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Manage support tickets from your clients</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 sm:space-y-4">
                          {tickets
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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
                                ticket.status === "waiting_for_client" ? "secondary" :
                                ticket.status === "needs_vault_help" ? "destructive" : "outline"
                              } className="text-xs">
                                {ticket.status === "open" ? "Open" :
                                 ticket.status === "waiting_for_seller" ? "Waiting for You" :
                                 ticket.status === "waiting_for_client" ? "Waiting for Client" :
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
                            <span>From: {ticket.client?.business_name || "Unknown Client"}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0">
                        <p className="text-sm sm:text-base text-foreground mb-3 sm:mb-4 whitespace-pre-wrap break-words">{ticket.description}</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={() => openTicketChat(ticket)}
                            variant="outline"
                            className="flex-1 w-full sm:w-auto"
                            size="sm"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            View & Reply
                          </Button>
                          {!ticket.needs_vault_help && (
                            <Button
                              onClick={() => {
                                setSelectedTicket(ticket);
                                requestVaultHelp();
                              }}
                              variant="outline"
                              className="flex-1 w-full sm:w-auto"
                              size="sm"
                            >
                              <HelpCircle className="w-4 h-4 mr-2" />
                              Request Vault Help
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg text-primary">Message The Vault Network</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Have questions or need assistance? Send a message directly to The Vault Network team</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateSellerMessage} className="space-y-3 sm:space-y-4">
                        <div className="space-y-2">
                  <Label htmlFor="seller-message-subject">Subject *</Label>
                  <Input
                    id="seller-message-subject"
                    placeholder="What is this about?"
                    value={newSellerMessageSubject}
                    onChange={(e) => setNewSellerMessageSubject(e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seller-message-body">Message *</Label>
                  <Textarea
                    id="seller-message-body"
                    placeholder="Describe your question or issue..."
                    value={newSellerMessageBody}
                    onChange={(e) => setNewSellerMessageBody(e.target.value)}
                    required
                    rows={6}
                    className="bg-input border-border"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submittingSellerMessage}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submittingSellerMessage ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>

                  {sellerMessages.length > 0 && (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg text-primary">Your Messages to Vault Network</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">View your conversation history with The Vault Network</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 sm:space-y-4">
                          {sellerMessages.map((message) => (
                    <Card key={message.id} className="bg-muted/20 border-border">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{message.subject}</CardTitle>
                            <Badge variant={
                              message.status === "open" ? "default" :
                              message.status === "in_progress" ? "secondary" : "outline"
                            } className="mt-2">
                              {message.status === "open" ? "Open" :
                               message.status === "in_progress" ? "In Progress" :
                               message.status === "resolved" ? "Resolved" : "Closed"}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground mb-4 whitespace-pre-wrap">{message.message}</p>
                        {message.replies.length > 0 && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {message.replies.length} reply{message.replies.length !== 1 ? 's' : ''}
                          </p>
                        )}
                        <Button
                          onClick={() => openSellerMessage(message)}
                          variant="outline"
                          className="w-full"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          View Conversation
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
                </TabsContent>
              </Tabs>
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
                        className={`flex ${isSeller ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 bg-muted text-foreground`}
                        >
                          <p className={`text-xs font-semibold mb-1 ${
                            isAdmin ? 'text-yellow-600 dark:text-yellow-400 opacity-100 drop-shadow-[0_0_4px_rgba(234,179,8,0.6)]' : 
                            isSeller ? 'text-green-600 dark:text-green-400 opacity-100' :
                            'text-sky-400 dark:text-sky-300 opacity-100'
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
                </div>
              </ScrollArea>
              <div className="flex flex-col gap-2 pt-4 border-t">
                {!selectedTicket?.needs_vault_help && (
                  <Button
                    onClick={requestVaultHelp}
                    variant="outline"
                    disabled={requestingVaultHelp}
                    className="w-full"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {requestingVaultHelp ? "Requesting..." : "Request Vault Network Help"}
                  </Button>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newTicketMessage}
                    onChange={(e) => setNewTicketMessage(e.target.value)}
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
                    disabled={!newTicketMessage.trim() || sendingTicketMessage}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sendingTicketMessage ? "Sending..." : "Send"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Seller Message Dialog */}
          <Dialog open={showSellerMessageDialog} onOpenChange={setShowSellerMessageDialog}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>{selectedSellerMessage?.subject || "Message to The Vault Network"}</DialogTitle>
                <DialogDescription>
                  Conversation with The Vault Network
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 min-h-[400px] max-h-[500px] pr-4">
                <div className="space-y-4">
                  {/* Original message */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 bg-muted text-foreground">
                      <p className="text-sm font-medium mb-1">You</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedSellerMessage?.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedSellerMessage && formatDistanceToNow(new Date(selectedSellerMessage.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {/* Replies */}
                  {sellerMessageReplies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`flex ${reply.is_from_seller ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          reply.is_from_seller
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">
                          {reply.is_from_seller ? 'You' : 'The Vault Network'}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                        <p className={`text-xs mt-1 ${
                          reply.is_from_seller ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2 pt-4 border-t">
                <Input
                  placeholder="Type your reply..."
                  value={newSellerMessageReply}
                  onChange={(e) => setNewSellerMessageReply(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendSellerMessageReply();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={sendSellerMessageReply}
                  disabled={!newSellerMessageReply.trim() || sendingSellerReply}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendingSellerReply ? "Sending..." : "Send"}
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

export default PartnerDashboard;
