import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Users, DollarSign, Package, Plus, Eye, Settings, Edit, Search, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { callNetlifyFunction } from "@/lib/netlify-functions";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SellerData {
  id: string;
  user_id: string;
  business_name: string;
  status: string;
  referral_code: string;
  created_at: string;
}

interface ClientData {
  id: string;
  business_name: string;
  contact_name: string;
  status: string;
  invited_by_code: string | null;
  seller_id: string | null;
  created_at: string;
  seller?: {
    id: string;
    business_name: string;
    referral_code: string | null;
  } | null;
}

interface EnquiryData {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
  client_id: string | null;
}

interface ClientAutomationData {
  id: string;
  client_id: string;
  automation_id: string;
  seller_id: string | null;
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
  seller: {
    business_name: string;
  } | null;
}

interface AutomationData {
  id: string;
  name: string;
  description: string;
  category: string;
  setup_price: number;
  monthly_price: number;
  is_active: boolean;
  image_url: string | null;
  features: string[] | null;
  stripe_product_id: string | null;
  stripe_setup_price_id: string | null;
  stripe_monthly_price_id: string | null;
}

interface SellerProfileData extends SellerData {
  email: string;
  full_name: string;
  website: string | null;
  about: string | null;
  clients: ClientData[];
  commission_rate: number;
}

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sellers, setSellers] = useState<SellerData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryData[]>([]);
  const [automations, setAutomations] = useState<AutomationData[]>([]);
  const [clientAutomations, setClientAutomations] = useState<ClientAutomationData[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<SellerProfileData | null>(null);
  const [showSellerDetails, setShowSellerDetails] = useState(false);
  const [showAddAutomation, setShowAddAutomation] = useState(false);
  const [showAssignAutomation, setShowAssignAutomation] = useState(false);
  const [showEditAutomation, setShowEditAutomation] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<AutomationData | null>(null);
  const [selectedSellerForAssignment, setSelectedSellerForAssignment] = useState<string>("");
  const [selectedAutomationsForAssignment, setSelectedAutomationsForAssignment] = useState<string[]>([]);
  const [sellerSearchOpen, setSellerSearchOpen] = useState(false);
  const [assignedAutomations, setAssignedAutomations] = useState<string[]>([]);
  const [clientsSearchQuery, setClientsSearchQuery] = useState("");
  const [partnersSearchQuery, setPartnersSearchQuery] = useState("");
  const [clientsSortBy, setClientsSortBy] = useState<"name" | "contact" | "status" | "date">("date");
  const [partnersSortBy, setPartnersSortBy] = useState<"name" | "status" | "date">("date");
  
  // Vault Network client management state
  const [vaultNetworkSellerId, setVaultNetworkSellerId] = useState<string | null>(null);
  const [vaultNetworkClients, setVaultNetworkClients] = useState<ClientData[]>([]);
  const [vaultNetworkAutomations, setVaultNetworkAutomations] = useState<AutomationData[]>([]);
  const [selectedVaultClient, setSelectedVaultClient] = useState<string>("");
  const [selectedVaultAutomation, setSelectedVaultAutomation] = useState<string>("");
  const [assigningVaultAutomation, setAssigningVaultAutomation] = useState(false);
  const [showVaultAssignDialog, setShowVaultAssignDialog] = useState(false);
  
  // New automation form state
  const [newAutomation, setNewAutomation] = useState({
    name: "",
    description: "",
    category: "",
    setup_price: "",
    monthly_price: "",
    image_url: "",
    features: "",
    default_commission_rate: "",
  });
  
  const [stats, setStats] = useState({
    totalSellers: 0,
    pendingSellers: 0,
    totalClients: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  const checkAdminRole = async () => {
    try {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id);

      if (error) throw error;

      const hasAdminRole = roles?.some(r => r.role === "admin");

      if (!hasAdminRole) {
        toast({
          title: "Access Denied",
          description: "You don't have admin permissions.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error checking permissions",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchAdminData = async () => {
    try {
      const { data: sellersData, error: sellersError } = await supabase
        .from("sellers")
        .select("*")
        .order("created_at", { ascending: false });

      if (sellersError) throw sellersError;
      setSellers(sellersData || []);

      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          business_name,
          contact_name,
          status,
          invited_by_code,
          seller_id,
          created_at,
          seller:sellers!clients_seller_id_fkey (
            id,
            business_name,
            referral_code
          )
        `)
        .order("created_at", { ascending: false });

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Fetch Vault Network seller and its clients
      const { data: vaultNetworkSeller, error: vaultError } = await supabase
        .from("sellers")
        .select("id")
        .eq("referral_code", "VAULT-NETWORK")
        .maybeSingle();

      if (!vaultError && vaultNetworkSeller) {
        setVaultNetworkSellerId(vaultNetworkSeller.id);
        
        // Fetch clients assigned to The Vault Network
        const { data: vaultClients, error: vaultClientsError } = await supabase
          .from("clients")
          .select(`
            id,
            business_name,
            contact_name,
            status,
            invited_by_code,
            seller_id,
            created_at,
            seller:sellers!clients_seller_id_fkey (
              id,
              business_name,
              referral_code
            )
          `)
          .eq("seller_id", vaultNetworkSeller.id)
          .order("created_at", { ascending: false });

        if (!vaultClientsError && vaultClients) {
          setVaultNetworkClients(vaultClients);
        }

        // Fetch automations available to The Vault Network seller
        const { data: vaultAutomations, error: vaultAutomationsError } = await supabase
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
              is_active
            )
          `)
          .eq("seller_id", vaultNetworkSeller.id);

        if (!vaultAutomationsError && vaultAutomations) {
          const transformedVaultAutomations = vaultAutomations
            .filter((sa: any) => sa.automations && sa.automations.is_active)
            .map((sa: any) => ({
              id: sa.automations.id,
              name: sa.automations.name,
              description: sa.automations.description,
              category: sa.automations.category,
              setup_price: sa.automations.setup_price,
              monthly_price: sa.automations.monthly_price,
              image_url: sa.automations.image_url,
              features: sa.automations.features,
              is_active: sa.automations.is_active,
            }));
          setVaultNetworkAutomations(transformedVaultAutomations);
        }
      }

      const { data: enquiriesData, error: enquiriesError } = await supabase
        .from("enquiries")
        .select("*, client_id")
        .order("created_at", { ascending: false });

      if (enquiriesError) throw enquiriesError;
      setEnquiries(enquiriesData || []);

      // Fetch all automations
      const { data: automationsData, error: automationsError } = await supabase
        .from("automations")
        .select("*")
        .order("created_at", { ascending: false });

      if (automationsError) throw automationsError;
      setAutomations(automationsData || []);

      // Fetch client automations with related data
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
          ),
          seller:sellers!client_automations_seller_id_fkey (
            business_name
          )
        `)
        .order("assigned_at", { ascending: false });

      if (clientAutomationsError) throw clientAutomationsError;
      
      // Transform the nested data
      const transformedClientAutomations = (clientAutomationsData || []).map((ca: any) => ({
        id: ca.id,
        client_id: ca.client_id,
        automation_id: ca.automation_id,
        seller_id: ca.seller_id,
        payment_status: ca.payment_status || 'unpaid',
        setup_status: ca.setup_status || 'pending_setup',
        assigned_at: ca.assigned_at,
        paid_at: ca.paid_at,
        client: ca.client,
        automation: ca.automation,
        seller: ca.seller,
      }));
      
      setClientAutomations(transformedClientAutomations);

      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("amount");

      const totalRevenue = transactionsData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setStats({
        totalSellers: sellersData?.length || 0,
        pendingSellers: sellersData?.filter(s => s.status === "pending").length || 0,
        totalClients: clientsData?.length || 0,
        totalRevenue,
      });
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSellerApproval = async (sellerId: string, sellerUserId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from("sellers")
        .update({ status: approved ? "approved" : "rejected" })
        .eq("id", sellerId);

      if (error) throw error;

      if (approved) {
        await supabase.from("user_roles").insert({
          user_id: sellerUserId,
          role: "seller",
        });
      }

      toast({
        title: approved ? "Seller Approved" : "Seller Rejected",
        description: `Application has been ${approved ? "approved" : "rejected"}.`,
      });

      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateEnquiryStatus = async (enquiryId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("enquiries")
        .update({ status })
        .eq("id", enquiryId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: "Enquiry status has been updated.",
      });

      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const viewSellerDetails = async (sellerId: string) => {
    try {
      const { data: seller, error: sellerError } = await supabase
        .from("sellers")
        .select("*")
        .eq("id", sellerId)
        .maybeSingle();

      if (sellerError) throw sellerError;
      if (!seller) return;

      // Get seller's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", seller.user_id)
        .maybeSingle();

      // Get seller's clients
      const { data: sellerClients } = await supabase
        .from("clients")
        .select("*")
        .eq("seller_id", sellerId);

      setSelectedSeller({
        ...seller,
        email: profile?.email || "",
        full_name: profile?.full_name || "",
        website: seller.website,
        about: seller.about,
        clients: sellerClients || [],
      });
      setShowSellerDetails(true);
    } catch (error: any) {
      toast({
        title: "Error loading seller details",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateSetupStatus = async (clientAutomationId: string, newStatus: 'pending_setup' | 'setup_in_progress' | 'active') => {
    try {
      const { error } = await supabase
        .from("client_automations")
        .update({ setup_status: newStatus })
        .eq("id", clientAutomationId);

      if (error) throw error;

      toast({
        title: "Status Updated!",
        description: `Setup status updated to ${newStatus.replace('_', ' ')}`,
      });

      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const syncStripeAutomation = async (automation: AutomationData) => {
    try {
      const result = await callNetlifyFunction('stripe-sync-automation', {
        id: automation.id,
        name: automation.name,
        description: automation.description || '',
        setup_price: automation.setup_price,
        monthly_price: automation.monthly_price,
      });

      // Refresh automations to get updated Stripe IDs
      await fetchAdminData();

      toast({
        title: "Synced with Stripe!",
        description: "Automation has been successfully synced with Stripe.",
      });

      return result;
    } catch (error: any) {
      toast({
        title: "Stripe Sync Failed",
        description: error.message || "Failed to sync with Stripe. Please check your Stripe configuration.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleAddAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const featuresArray = newAutomation.features
        .split(",")
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const { data: insertedData, error } = await supabase.from("automations").insert({
        name: newAutomation.name,
        description: newAutomation.description,
        category: newAutomation.category || null,
        setup_price: parseFloat(newAutomation.setup_price) || 0,
        monthly_price: parseFloat(newAutomation.monthly_price) || 0,
        image_url: newAutomation.image_url || null,
        features: featuresArray.length > 0 ? featuresArray : null,
        default_commission_rate: parseFloat(newAutomation.default_commission_rate) || 20.00,
        is_active: true,
      }).select().single();

      if (error) throw error;

      // Automatically assign to The Vault Network seller if it exists
      if (insertedData && vaultNetworkSellerId) {
        await supabase.from("seller_automations").insert({
          seller_id: vaultNetworkSellerId,
          automation_id: insertedData.id,
        }).then(({ error: assignError }) => {
          if (assignError) {
            console.warn("Failed to auto-assign to Vault Network:", assignError);
            // Don't throw - this is not critical
          }
        });
      }

      // Auto-sync with Stripe after creating
      try {
        await syncStripeAutomation(insertedData);
      } catch (syncError) {
        // Don't fail the whole operation if Stripe sync fails
        console.error("Stripe sync error:", syncError);
      }

      toast({
        title: "Automation Added!",
        description: "New automation has been added to the system" + (vaultNetworkSellerId ? ", assigned to The Vault Network," : "") + " and synced with Stripe.",
      });

      setNewAutomation({
        name: "",
        description: "",
        category: "",
        setup_price: "",
        monthly_price: "",
        image_url: "",
        features: "",
        default_commission_rate: "",
      });
      setShowAddAutomation(false);
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Failed to add automation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditAutomation = (automation: AutomationData) => {
    setEditingAutomation(automation);
    setNewAutomation({
      name: automation.name,
      description: automation.description || "",
      category: automation.category || "",
      setup_price: automation.setup_price.toString(),
      monthly_price: automation.monthly_price.toString(),
      image_url: automation.image_url || "",
      features: automation.features ? (Array.isArray(automation.features) ? automation.features.join(", ") : "") : "",
      default_commission_rate: (automation as any).default_commission_rate?.toString() || "20.00",
    });
    setShowEditAutomation(true);
  };

  const handleUpdateAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAutomation) return;

    try {
      const featuresArray = newAutomation.features
        .split(",")
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const { data: updatedData, error } = await supabase
        .from("automations")
        .update({
          name: newAutomation.name,
          description: newAutomation.description,
          category: newAutomation.category || null,
          setup_price: parseFloat(newAutomation.setup_price) || 0,
          monthly_price: parseFloat(newAutomation.monthly_price) || 0,
          image_url: newAutomation.image_url || null,
          features: featuresArray.length > 0 ? featuresArray : null,
          default_commission_rate: parseFloat(newAutomation.default_commission_rate) || 20.00,
        })
        .eq("id", editingAutomation.id)
        .select()
        .single();

      if (error) throw error;

      // Auto-sync with Stripe after updating
      try {
        await syncStripeAutomation(updatedData);
      } catch (syncError) {
        // Don't fail the whole operation if Stripe sync fails
        console.error("Stripe sync error:", syncError);
      }

      toast({
        title: "Automation Updated!",
        description: "Automation has been updated successfully and synced with Stripe.",
      });

      setShowEditAutomation(false);
      setEditingAutomation(null);
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Failed to update automation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateSellerCommission = async (sellerId: string, commissionRate: number | null) => {
    try {
      const { error } = await supabase
        .from("sellers")
        .update({ commission_rate: commissionRate })
        .eq("id", sellerId);

      if (error) throw error;

      toast({
        title: "Commission Rate Updated!",
        description: commissionRate 
          ? `Seller now has a custom commission rate of ${commissionRate}% that overrides all automation defaults.`
          : "Seller will now use each automation's default commission rate.",
      });

      if (selectedSeller) {
        setSelectedSeller({ ...selectedSeller, commission_rate: commissionRate || 0 });
      }
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAssignAutomationToSeller = async () => {
    if (!selectedSellerForAssignment || selectedAutomationsForAssignment.length === 0) {
      toast({
        title: "Selection required",
        description: "Please select a seller and at least one automation",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check which automations are already assigned
      const { data: existing } = await supabase
        .from("seller_automations")
        .select("automation_id")
        .eq("seller_id", selectedSellerForAssignment)
        .in("automation_id", selectedAutomationsForAssignment);

      const existingIds = existing?.map(e => e.automation_id) || [];
      const newAutomations = selectedAutomationsForAssignment.filter(id => !existingIds.includes(id));

      if (newAutomations.length === 0) {
        toast({
          title: "Already assigned",
          description: "All selected automations are already assigned to this seller",
          variant: "destructive",
        });
        return;
      }

      // Insert new assignments
      const assignments = newAutomations.map(automation_id => ({
        seller_id: selectedSellerForAssignment,
        automation_id,
      }));

      const { error } = await supabase.from("seller_automations").insert(assignments);

      if (error) throw error;

      toast({
        title: "Automations Assigned!",
        description: `${newAutomations.length} automation(s) have been assigned to the seller`,
      });

      setSelectedSellerForAssignment("");
      setSelectedAutomationsForAssignment([]);
      setShowAssignAutomation(false);
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Assignment failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAssignVaultAutomation = async () => {
    if (!selectedVaultClient || !selectedVaultAutomation || !vaultNetworkSellerId) {
      toast({
        title: "Selection required",
        description: "Please select both a client and an automation",
        variant: "destructive",
      });
      return;
    }

    setAssigningVaultAutomation(true);
    try {
      // Check if already assigned
      const { data: existing } = await supabase
        .from("client_automations")
        .select("id")
        .eq("client_id", selectedVaultClient)
        .eq("automation_id", selectedVaultAutomation)
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
        client_id: selectedVaultClient,
        automation_id: selectedVaultAutomation,
        seller_id: vaultNetworkSellerId,
        status: "active",
      });

      if (error) throw error;

      toast({
        title: "Automation Assigned!",
        description: "The automation has been assigned to the client",
      });

      setSelectedVaultClient("");
      setSelectedVaultAutomation("");
      setShowVaultAssignDialog(false);
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Assignment failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAssigningVaultAutomation(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const query = clientsSearchQuery.toLowerCase();
    return (
      client.business_name.toLowerCase().includes(query) ||
      client.contact_name.toLowerCase().includes(query) ||
      (client.invited_by_code?.toLowerCase().includes(query) ?? false)
    );
  }).sort((a, b) => {
    switch (clientsSortBy) {
      case "name":
        return a.business_name.localeCompare(b.business_name);
      case "contact":
        return a.contact_name.localeCompare(b.contact_name);
      case "status":
        return a.status.localeCompare(b.status);
      case "date":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const filteredPartners = sellers.filter(seller => {
    const query = partnersSearchQuery.toLowerCase();
    return (
      seller.business_name.toLowerCase().includes(query) ||
      (seller.referral_code?.toLowerCase().includes(query) ?? false)
    );
  }).sort((a, b) => {
    switch (partnersSortBy) {
      case "name":
        return a.business_name.localeCompare(b.business_name);
      case "status":
        return a.status.localeCompare(b.status);
      case "date":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  if (authLoading || loading || !isAdmin) {
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
              Admin Dashboard
            </h1>
            <p className="text-xl text-muted-foreground">
              Manage partners, clients, and enquiries
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Partners</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.totalSellers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.pendingSellers} pending approval
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.totalClients}</div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${stats.totalRevenue.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Open Enquiries</CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {enquiries.filter(e => e.status === "new").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <Dialog open={showAddAutomation} onOpenChange={setShowAddAutomation}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Automation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Automation</DialogTitle>
                  <DialogDescription>Add a new automation to the system</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddAutomation} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newAutomation.name}
                      onChange={(e) => setNewAutomation({ ...newAutomation, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newAutomation.description}
                      onChange={(e) => setNewAutomation({ ...newAutomation, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={newAutomation.category}
                        onChange={(e) => setNewAutomation({ ...newAutomation, category: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image_url">Image URL</Label>
                      <Input
                        id="image_url"
                        value={newAutomation.image_url}
                        onChange={(e) => setNewAutomation({ ...newAutomation, image_url: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="setup_price">Setup Price *</Label>
                      <Input
                        id="setup_price"
                        type="number"
                        step="0.01"
                        value={newAutomation.setup_price}
                        onChange={(e) => setNewAutomation({ ...newAutomation, setup_price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthly_price">Monthly Price *</Label>
                      <Input
                        id="monthly_price"
                        type="number"
                        step="0.01"
                        value={newAutomation.monthly_price}
                        onChange={(e) => setNewAutomation({ ...newAutomation, monthly_price: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="features">Features (comma-separated)</Label>
                    <Textarea
                      id="features"
                      value={newAutomation.features}
                      onChange={(e) => setNewAutomation({ ...newAutomation, features: e.target.value })}
                      placeholder="Feature 1, Feature 2, Feature 3"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default_commission_rate">Default Commission Rate (%) *</Label>
                    <Input
                      id="default_commission_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={newAutomation.default_commission_rate}
                      onChange={(e) => setNewAutomation({ ...newAutomation, default_commission_rate: e.target.value })}
                      placeholder="20.00"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddAutomation(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Automation</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Automation Dialog */}
            <Dialog open={showEditAutomation} onOpenChange={setShowEditAutomation}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Automation</DialogTitle>
                  <DialogDescription>Update automation details</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateAutomation} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name *</Label>
                    <Input
                      id="edit-name"
                      value={newAutomation.name}
                      onChange={(e) => setNewAutomation({ ...newAutomation, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={newAutomation.description}
                      onChange={(e) => setNewAutomation({ ...newAutomation, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Category</Label>
                      <Input
                        id="edit-category"
                        value={newAutomation.category}
                        onChange={(e) => setNewAutomation({ ...newAutomation, category: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-image_url">Image URL</Label>
                      <Input
                        id="edit-image_url"
                        value={newAutomation.image_url}
                        onChange={(e) => setNewAutomation({ ...newAutomation, image_url: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-setup_price">Setup Price *</Label>
                      <Input
                        id="edit-setup_price"
                        type="number"
                        step="0.01"
                        value={newAutomation.setup_price}
                        onChange={(e) => setNewAutomation({ ...newAutomation, setup_price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-monthly_price">Monthly Price *</Label>
                      <Input
                        id="edit-monthly_price"
                        type="number"
                        step="0.01"
                        value={newAutomation.monthly_price}
                        onChange={(e) => setNewAutomation({ ...newAutomation, monthly_price: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-features">Features (comma-separated)</Label>
                    <Textarea
                      id="edit-features"
                      value={newAutomation.features}
                      onChange={(e) => setNewAutomation({ ...newAutomation, features: e.target.value })}
                      placeholder="Feature 1, Feature 2, Feature 3"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-default_commission_rate">Default Commission Rate (%) *</Label>
                    <Input
                      id="edit-default_commission_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={newAutomation.default_commission_rate}
                      onChange={(e) => setNewAutomation({ ...newAutomation, default_commission_rate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setShowEditAutomation(false);
                      setEditingAutomation(null);
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit">Update Automation</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={showAssignAutomation} onOpenChange={setShowAssignAutomation}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Assign Automation to Seller
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Assign Automation to Seller</DialogTitle>
                  <DialogDescription>Select a seller and one or more automations to assign</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Seller</Label>
                    <Popover open={sellerSearchOpen} onOpenChange={setSellerSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {selectedSellerForAssignment
                            ? sellers.find(s => s.id === selectedSellerForAssignment)?.business_name
                            : "Choose a seller..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search sellers..." />
                          <CommandList>
                            <CommandEmpty>No seller found.</CommandEmpty>
                            <CommandGroup>
                              {sellers.filter(s => s.status === "approved").map((seller) => (
                                <CommandItem
                                  key={seller.id}
                                  value={seller.business_name}
                                  onSelect={async () => {
                                    setSelectedSellerForAssignment(seller.id);
                                    setSellerSearchOpen(false);
                                    // Fetch already assigned automations for this seller
                                    const { data: assigned } = await supabase
                                      .from("seller_automations")
                                      .select("automation_id")
                                      .eq("seller_id", seller.id);
                                    const assignedIds = assigned?.map(a => a.automation_id) || [];
                                    setAssignedAutomations(assignedIds);
                                    // Don't pre-select - user should select new ones to assign
                                    setSelectedAutomationsForAssignment([]);
                                  }}
                                >
                                  {seller.business_name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Automations (Multiple)</Label>
                    <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                      {automations.filter(a => a.is_active).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No active automations available</p>
                      ) : (
                        <div className="space-y-3">
                          {automations.filter(a => a.is_active).map((automation) => {
                            const isAssigned = assignedAutomations.includes(automation.id);
                            const isSelected = selectedAutomationsForAssignment.includes(automation.id);
                            return (
                              <div key={automation.id} className="flex items-start space-x-3">
                                <Checkbox
                                  id={`automation-${automation.id}`}
                                  checked={isAssigned || isSelected}
                                  disabled={isAssigned}
                                  onCheckedChange={(checked) => {
                                    if (isAssigned) return; // Can't uncheck already assigned
                                    if (checked) {
                                      setSelectedAutomationsForAssignment([...selectedAutomationsForAssignment, automation.id]);
                                    } else {
                                      setSelectedAutomationsForAssignment(
                                        selectedAutomationsForAssignment.filter(id => id !== automation.id)
                                      );
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`automation-${automation.id}`}
                                  className={`flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isAssigned ? 'opacity-60' : ''}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{automation.name}</span>
                                    {isAssigned && (
                                      <Badge variant="secondary" className="text-xs">Already Assigned</Badge>
                                    )}
                                  </div>
                                  {automation.description && (
                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {automation.description}
                                    </div>
                                  )}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {selectedAutomationsForAssignment.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedAutomationsForAssignment.length} new automation(s) selected for assignment
                      </p>
                    )}
                    {assignedAutomations.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {assignedAutomations.length} automation(s) already assigned to this seller
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setShowAssignAutomation(false);
                      setSelectedSellerForAssignment("");
                      setSelectedAutomationsForAssignment([]);
                      setAssignedAutomations([]);
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleAssignAutomationToSeller}>Assign</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Vault Network Client Management Section */}
          {vaultNetworkSellerId && (
            <Card className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  The Vault Network Clients
                </CardTitle>
                <CardDescription>
                  Manage clients assigned to The Vault Network {vaultNetworkClients.length > 0 && `(${vaultNetworkClients.length} client${vaultNetworkClients.length !== 1 ? 's' : ''})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vaultNetworkClients.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        No clients assigned to The Vault Network yet.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Clients who sign up without a referral code will be automatically assigned here.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Clients List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {vaultNetworkClients.map((client) => (
                          <Card key={client.id} className="bg-background/50 border-border">
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <p className="font-medium text-foreground">{client.business_name}</p>
                                  <p className="text-sm text-muted-foreground">{client.contact_name}</p>
                                </div>
                                <Badge variant={client.status === "active" ? "default" : "secondary"}>
                                  {client.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Joined: {new Date(client.created_at).toLocaleDateString()}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Assign Automation Button */}
                      <Dialog open={showVaultAssignDialog} onOpenChange={setShowVaultAssignDialog}>
                        <DialogTrigger asChild>
                          <Button className="w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            Assign Automation to Client
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Assign Automation to Vault Network Client</DialogTitle>
                            <DialogDescription>
                              Select a client and automation to assign
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Select Client</Label>
                              <Select value={selectedVaultClient} onValueChange={setSelectedVaultClient}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a client..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {vaultNetworkClients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                      {client.business_name} - {client.contact_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Select Automation</Label>
                              {vaultNetworkAutomations.length === 0 ? (
                                <div className="p-4 border border-border rounded-md bg-muted/20">
                                  <p className="text-sm text-muted-foreground">
                                    No automations available. Please assign automations to The Vault Network seller first using the "Assign Automation" button above.
                                  </p>
                                </div>
                              ) : (
                                <Select value={selectedVaultAutomation} onValueChange={setSelectedVaultAutomation}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose an automation..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vaultNetworkAutomations.map((automation) => (
                                      <SelectItem key={automation.id} value={automation.id}>
                                        {automation.name} - ${automation.setup_price} setup / ${automation.monthly_price}/mo
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setShowVaultAssignDialog(false);
                                  setSelectedVaultClient("");
                                  setSelectedVaultAutomation("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleAssignVaultAutomation}
                                disabled={!selectedVaultClient || !selectedVaultAutomation || assigningVaultAutomation || vaultNetworkAutomations.length === 0}
                              >
                                {assigningVaultAutomation ? "Assigning..." : "Assign Automation"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <Tabs defaultValue="sellers" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-6">
                  <TabsTrigger value="sellers">Partners</TabsTrigger>
                  <TabsTrigger value="clients">Clients</TabsTrigger>
                  <TabsTrigger value="automations">Automations</TabsTrigger>
                  <TabsTrigger value="client-automations">Client Automations</TabsTrigger>
                  <TabsTrigger value="enquiries">Enquiries</TabsTrigger>
                </TabsList>

                <TabsContent value="sellers">
                  <div className="space-y-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search partners..."
                            value={partnersSearchQuery}
                            onChange={(e) => setPartnersSearchQuery(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <Select value={partnersSortBy} onValueChange={(value: "name" | "status" | "date") => setPartnersSortBy(value)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date (Newest)</SelectItem>
                          <SelectItem value="name">Name (A-Z)</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Referral Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartners.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No partners found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPartners.map((seller) => (
                          <TableRow key={seller.id}>
                            <TableCell className="font-medium">{seller.business_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">Business</Badge>
                            </TableCell>
                            <TableCell className="font-mono">{seller.referral_code || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant={
                                seller.status === "approved" ? "default" :
                                seller.status === "pending" ? "secondary" : "destructive"
                              }>
                                {seller.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => viewSellerDetails(seller.id)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                {seller.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSellerApproval(seller.id, seller.user_id, true)}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleSellerApproval(seller.id, seller.user_id, false)}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="clients">
                  <div className="space-y-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search clients..."
                            value={clientsSearchQuery}
                            onChange={(e) => setClientsSearchQuery(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <Select value={clientsSortBy} onValueChange={(value: "name" | "contact" | "status" | "date") => setClientsSortBy(value)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date (Newest)</SelectItem>
                          <SelectItem value="name">Business Name (A-Z)</SelectItem>
                          <SelectItem value="contact">Contact Name (A-Z)</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Referral Code Used</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No clients found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredClients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.business_name}</TableCell>
                            <TableCell>{client.contact_name}</TableCell>
                            <TableCell>
                              {client.seller ? (
                                <Badge variant="secondary">{client.seller.business_name}</Badge>
                              ) : (
                                <Badge variant="outline">The Vault Network</Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-mono">{client.invited_by_code || "Direct"}</TableCell>
                            <TableCell>
                              <Badge variant={client.status === "active" ? "default" : "secondary"}>
                                {client.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="automations">
                  <div className="space-y-4">
                    {automations.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No automations yet. Add one to get started!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {automations.map((automation) => (
                          <Card key={automation.id} className="bg-muted/20 border-border">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg text-foreground">{automation.name}</CardTitle>
                                <Badge variant={automation.is_active ? "default" : "secondary"}>
                                  {automation.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <CardDescription className="line-clamp-2">{automation.description}</CardDescription>
                              {automation.category && (
                                <Badge variant="outline" className="mt-2">{automation.category}</Badge>
                              )}
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Setup:</span>
                                  <span className="font-bold text-foreground">${automation.setup_price}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Monthly:</span>
                                  <span className="font-bold text-primary">${automation.monthly_price}/mo</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Default Commission:</span>
                                  <span className="font-bold text-primary">{(automation as any).default_commission_rate || 20}%</span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-border">
                                  <span className="text-xs text-muted-foreground">Stripe Status:</span>
                                  {automation.stripe_product_id ? (
                                    <Badge variant="default" className="text-xs">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Synced
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Not Synced
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 mt-4">
                                <Button
                                  onClick={() => handleEditAutomation(automation)}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => syncStripeAutomation(automation)}
                                  variant={automation.stripe_product_id ? "outline" : "default"}
                                  size="sm"
                                  className="flex-1"
                                >
                                  <Settings className="w-4 h-4 mr-2" />
                                  {automation.stripe_product_id ? "Re-sync" : "Sync Stripe"}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="client-automations">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Paid Client Automations</h3>
                        <p className="text-sm text-muted-foreground">
                          Showing {clientAutomations.filter(ca => ca.payment_status === 'paid').length} paid automation(s) requiring setup
                        </p>
                      </div>
                    </div>
                    {clientAutomations.filter(ca => ca.payment_status === 'paid').length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No paid client automations yet.</p>
                        <p className="text-sm text-muted-foreground mt-2">Automations will appear here once clients complete payment.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Automation</TableHead>
                            <TableHead>Partner</TableHead>
                            <TableHead>Payment Status</TableHead>
                            <TableHead>Setup Status</TableHead>
                            <TableHead>Assigned Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clientAutomations.filter(ca => ca.payment_status === 'paid').map((ca) => (
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
                                {ca.seller?.business_name || 'N/A'}
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
                                    {new Date(ca.paid_at).toLocaleDateString()}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={ca.setup_status}
                                  onValueChange={(value: 'pending_setup' | 'setup_in_progress' | 'active') => 
                                    handleUpdateSetupStatus(ca.id, value)
                                  }
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending_setup">Pending Setup</SelectItem>
                                    <SelectItem value="setup_in_progress">Setup In Progress</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                  </SelectContent>
                                </Select>
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
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="enquiries">
                  <div className="space-y-6">
                    {/* Registered Account Enquiries */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-foreground">
                        From Registered Accounts ({enquiries.filter(e => e.client_id).length})
                      </h3>
                      {enquiries.filter(e => e.client_id).length === 0 ? (
                        <p className="text-sm text-muted-foreground mb-4">No enquiries from registered accounts</p>
                      ) : (
                        <div className="space-y-4 mb-6">
                          {enquiries.filter(e => e.client_id).map((enquiry) => (
                            <Card key={enquiry.id} className="bg-muted/20">
                              <CardHeader>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-lg">{enquiry.business_name}</CardTitle>
                                    <CardDescription>
                                      {enquiry.contact_name} • {enquiry.email}
                                    </CardDescription>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge variant={
                                      enquiry.status === "new" ? "default" :
                                      enquiry.status === "contacted" ? "secondary" : "outline"
                                    }>
                                      {enquiry.status}
                                    </Badge>
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                      Registered
                                    </Badge>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-foreground mb-4">{enquiry.message}</p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateEnquiryStatus(enquiry.id, "contacted")}
                                  >
                                    Mark Contacted
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateEnquiryStatus(enquiry.id, "converted")}
                                  >
                                    Mark Converted
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateEnquiryStatus(enquiry.id, "closed")}
                                  >
                                    Close
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Non-Registered Enquiries */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-foreground">
                        From Website Visitors ({enquiries.filter(e => !e.client_id).length})
                      </h3>
                      {enquiries.filter(e => !e.client_id).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No enquiries from website visitors</p>
                      ) : (
                        <div className="space-y-4">
                          {enquiries.filter(e => !e.client_id).map((enquiry) => (
                            <Card key={enquiry.id} className="bg-muted/20">
                              <CardHeader>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-lg">{enquiry.business_name}</CardTitle>
                                    <CardDescription>
                                      {enquiry.contact_name} • {enquiry.email}
                                    </CardDescription>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge variant={
                                      enquiry.status === "new" ? "default" :
                                      enquiry.status === "contacted" ? "secondary" : "outline"
                                    }>
                                      {enquiry.status}
                                    </Badge>
                                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                                      Visitor
                                    </Badge>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-foreground mb-4">{enquiry.message}</p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateEnquiryStatus(enquiry.id, "contacted")}
                                  >
                                    Mark Contacted
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateEnquiryStatus(enquiry.id, "converted")}
                                  >
                                    Mark Converted
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateEnquiryStatus(enquiry.id, "closed")}
                                  >
                                    Close
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Seller Details Dialog */}
      <Dialog open={showSellerDetails} onOpenChange={setShowSellerDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seller Profile: {selectedSeller?.business_name}</DialogTitle>
            <DialogDescription>View seller details and linked clients</DialogDescription>
          </DialogHeader>
          {selectedSeller && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Business Name</Label>
                  <p className="font-medium">{selectedSeller.business_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Contact Name</Label>
                  <p className="font-medium">{selectedSeller.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedSeller.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Badge variant={selectedSeller.status === "approved" ? "default" : "secondary"}>
                    {selectedSeller.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Referral Code</Label>
                  <p className="font-mono text-sm">{selectedSeller.referral_code}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Commission Rate</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={selectedSeller.commission_rate ? selectedSeller.commission_rate.toString() : ''}
                      placeholder="Auto (uses automation default)"
                      onChange={(e) => {
                        const newRate = e.target.value === '' ? null : parseFloat(e.target.value);
                        setSelectedSeller({ ...selectedSeller, commission_rate: newRate || 0 });
                      }}
                      onBlur={(e) => {
                        // Only update if value actually changed
                        const currentValue = selectedSeller.commission_rate;
                        const inputValue = e.target.value === '' ? null : parseFloat(e.target.value);
                        if (currentValue !== inputValue) {
                          handleUpdateSellerCommission(selectedSeller.id, inputValue);
                        }
                      }}
                      className="w-32"
                      autoFocus={false}
                      readOnly={false}
                    />
                    <span className="text-sm">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedSeller.commission_rate 
                      ? `Custom rate: ${selectedSeller.commission_rate}% (overrides all automation defaults)`
                      : 'Uses each automation\'s default commission rate'}
                  </p>
                </div>
                {selectedSeller.website && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Website</Label>
                    <p className="font-medium">
                      <a href={selectedSeller.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {selectedSeller.website}
                      </a>
                    </p>
                  </div>
                )}
                {selectedSeller.about && (
                  <div className="col-span-2">
                    <Label className="text-sm text-muted-foreground">About</Label>
                    <p className="text-sm">{selectedSeller.about}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-lg font-semibold mb-4 block">Linked Clients ({selectedSeller.clients.length})</Label>
                {selectedSeller.clients.length === 0 ? (
                  <p className="text-muted-foreground">No clients linked yet</p>
                ) : (
                  <div className="space-y-2">
                    {selectedSeller.clients.map((client) => (
                      <Card key={client.id} className="bg-muted/20">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{client.business_name}</p>
                              <p className="text-sm text-muted-foreground">{client.contact_name}</p>
                            </div>
                            <Badge variant={client.status === "active" ? "default" : "secondary"}>
                              {client.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
