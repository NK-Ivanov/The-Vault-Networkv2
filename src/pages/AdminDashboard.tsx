import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { CheckCircle, XCircle, Users, DollarSign, Package, Plus, Eye, Settings, Edit, Search, ArrowUpDown, TrendingUp, TrendingDown, BarChart3, PieChart, Activity, MessageSquare, AlertCircle, Send, LayoutDashboard, UserCog, Building2, Boxes, Link2, Ticket, Mail, HelpCircle, Trophy, Zap, BookOpen, Copy, Trash2, Upload, Image as ImageIcon, X } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { callNetlifyFunction } from "@/lib/netlify-functions";
import { getNextRank, getPreviousRank, getRankInfo, getTasksForRank, type PartnerRank } from "@/lib/partner-progression";
// Removed module config import - using manual HTML pasting instead
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface SellerData {
  id: string;
  user_id: string;
  business_name: string;
  status: string;
  referral_code: string;
  created_at: string;
  current_xp?: number;
  current_rank?: string;
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
  seller: {
    business_name: string;
  } | null;
  replies: Array<{
    id: string;
    message: string;
    is_from_seller: boolean;
    created_at: string;
  }>;
}

interface ClientAutomationData {
  id: string;
  client_id: string;
  automation_id: string;
  seller_id: string | null;
  payment_status: 'unpaid' | 'paid';
  setup_status: 'pending_setup' | 'setup_in_progress' | 'setup_complete' | 'active';
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

interface AnalyticsData {
  totalRevenue: number;
  totalProfit: number;
  totalCommissionPaid: number;
  totalTransactions: number;
  monthlyVaultShare: number;
  monthlyRevenue: Array<{ month: string; revenue: number; profit: number }>;
  topSellers: Array<{
    id: string;
    business_name: string;
    total_sales: number;
    total_commission: number;
    transaction_count: number;
  }>;
  recentTransactions: Array<{
    id: string;
    created_at: string;
    amount: number;
    seller_earnings: number;
    vault_share: number;
    transaction_type: string;
    client: { business_name: string } | null;
    automation: { name: string } | null;
    seller: { business_name: string } | null;
  }>;
  revenueByAutomation: Array<{
    automation_name: string;
    revenue: number;
    transaction_count: number;
  }>;
  setupVsMonthly: {
    setup_revenue: number;
    monthly_revenue: number;
  };
}

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("analytics");
  const [sellers, setSellers] = useState<SellerData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryData[]>([]);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [sellerMessages, setSellerMessages] = useState<SellerMessageData[]>([]);
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
  
  // XP Management state
  const [selectedSellerForXP, setSelectedSellerForXP] = useState<string>("");
  const [xpAmount, setXpAmount] = useState<string>("");
  const [xpDescription, setXpDescription] = useState<string>("");
  const [givingXP, setGivingXP] = useState(false);
  const [xpSellerSearchOpen, setXpSellerSearchOpen] = useState(false);
  const [bypassingToVerified, setBypassingToVerified] = useState(false);
  const [advancingRank, setAdvancingRank] = useState(false);
  const [demotingRank, setDemotingRank] = useState(false);
  const [selectedTargetRank, setSelectedTargetRank] = useState<PartnerRank | "">("");
  const [settingRank, setSettingRank] = useState(false);
  const [selectedSellerForLoginDays, setSelectedSellerForLoginDays] = useState<string>("");
  const [loginDayDate, setLoginDayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [addingLoginDay, setAddingLoginDay] = useState(false);
  const [loginDaysData, setLoginDaysData] = useState<{ count: number; dates: string[] } | null>(null);
  
  // Module management state
  const [moduleTokens, setModuleTokens] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [newModuleToken, setNewModuleToken] = useState({
    module_id: "",
    module_title: "",
    module_description: "",
    module_content_html: "",
    quiz_link: "", // Quiz link to add to HTML
    expires_at: "",
    max_uses: "",
  });
  const [creatingModule, setCreatingModule] = useState(false);
  const [moduleHTMLPreview, setModuleHTMLPreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [moduleImages, setModuleImages] = useState<{ url: string; filename: string }[]>([]);
  const [selectedModuleForImages, setSelectedModuleForImages] = useState("");
  const [deletingModuleToken, setDeletingModuleToken] = useState<string | null>(null);
  const [sendingDiscordNotification, setSendingDiscordNotification] = useState<string | null>(null);
  
  // Quiz management state
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    module_id: "",
    passing_score: "70",
    time_limit_minutes: "",
    max_attempts: "3",
  });
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [selectedQuizForLink, setSelectedQuizForLink] = useState("");
  const [newQuizToken, setNewQuizToken] = useState({
    quiz_id: "",
    link_title: "",
    expires_at: "",
    max_uses: "",
  });
  const [quizTokens, setQuizTokens] = useState<any[]>([]);
  const [loadingQuizTokens, setLoadingQuizTokens] = useState(false);
  const [creatingQuizToken, setCreatingQuizToken] = useState(false);
  const [deletingQuizToken, setDeletingQuizToken] = useState<string | null>(null);
  
  // Vault Library Modules state
  const [vaultModules, setVaultModules] = useState<any[]>([]);
  const [loadingVaultModules, setLoadingVaultModules] = useState(false);
  const [newVaultModule, setNewVaultModule] = useState({
    min_rank: "Recruit Plus",
    module_data: "",
  });
  const [editingVaultModule, setEditingVaultModule] = useState<any | null>(null);
  const [creatingVaultModule, setCreatingVaultModule] = useState(false);
  const [publishingVaultModule, setPublishingVaultModule] = useState<string | null>(null);
  const [deletingVaultModule, setDeletingVaultModule] = useState<string | null>(null);
  
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
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  
  // Ticket and seller message state
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessageData[]>([]);
  const ticketMessagesEndRef = useRef<HTMLDivElement>(null);
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [sendingTicketMessage, setSendingTicketMessage] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  
  const [selectedSellerMessage, setSelectedSellerMessage] = useState<SellerMessageData | null>(null);
  const [sellerMessageReplies, setSellerMessageReplies] = useState<Array<{id: string; message: string; is_from_seller: boolean; created_at: string}>>([]);
  const [newSellerMessageReply, setNewSellerMessageReply] = useState("");
  const [sendingSellerReply, setSendingSellerReply] = useState(false);
  const [showSellerMessageDialog, setShowSellerMessageDialog] = useState(false);

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

  // Fetch login days data when seller is selected
  useEffect(() => {
    const fetchLoginDays = async () => {
      const sellerId = selectedSellerForLoginDays || selectedSellerForXP;
      if (!sellerId) {
        setLoginDaysData(null);
        return;
      }

      try {
        const { data: loginDays } = await supabase
          .from("partner_activity_log")
          .select("metadata")
          .eq("seller_id", sellerId)
          .eq("event_type", "login_day");

        if (loginDays) {
          const uniqueDates = new Set(
            loginDays.map((log: any) => log.metadata?.login_date).filter(Boolean)
          );
          const sortedDates = Array.from(uniqueDates).sort().reverse();
          setLoginDaysData({ count: uniqueDates.size, dates: sortedDates });
        } else {
          setLoginDaysData({ count: 0, dates: [] });
        }
      } catch (error) {
        console.error("Error fetching login days:", error);
        setLoginDaysData(null);
      }
    };

    fetchLoginDays();
  }, [selectedSellerForLoginDays, selectedSellerForXP]);

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
      fetchAnalyticsData();
      fetchModuleTokens();
      fetchQuizzes();
      fetchVaultModules();
      fetchQuizTokens();
    } catch (error: any) {
      toast({
        title: "Error checking permissions",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchAnalyticsData = async () => {
    setLoadingAnalytics(true);
    try {
      // Fetch all transactions with related data
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select(`
          id,
          amount,
          seller_earnings,
          vault_share,
          commission_rate_used,
          transaction_type,
          created_at,
          client:clients!transactions_client_id_fkey (
            business_name
          ),
          automation:automations!transactions_automation_id_fkey (
            name
          ),
          seller:sellers!transactions_seller_id_fkey (
            id,
            business_name
          )
        `)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (transactionsError) throw transactionsError;

      // Calculate totals
      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;
      const totalProfit = transactions?.reduce((sum, t) => sum + Number(t.vault_share || 0), 0) || 0;
      const totalCommissionPaid = transactions?.reduce((sum, t) => sum + Number(t.seller_earnings || 0), 0) || 0;

      // Group by month for revenue chart
      const monthlyMap = new Map<string, { revenue: number; profit: number }>();
      transactions?.forEach((t) => {
        const date = new Date(t.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { revenue: 0, profit: 0 });
        }
        const monthData = monthlyMap.get(monthKey)!;
        monthData.revenue += Number(t.amount || 0);
        monthData.profit += Number(t.vault_share || 0);
      });

      const monthlyRevenue = Array.from(monthlyMap.entries())
        .map(([key, data]) => ({
          month: new Date(key + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          revenue: data.revenue,
          profit: data.profit,
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      // Top sellers
      const sellerMap = new Map<string, { id: string; business_name: string; total_sales: number; total_commission: number; transaction_count: number }>();
      transactions?.forEach((t) => {
        if (t.seller) {
          const sellerId = t.seller.id;
          if (!sellerMap.has(sellerId)) {
            sellerMap.set(sellerId, {
              id: sellerId,
              business_name: t.seller.business_name || "Unknown",
              total_sales: 0,
              total_commission: 0,
              transaction_count: 0,
            });
          }
          const sellerData = sellerMap.get(sellerId)!;
          sellerData.total_sales += Number(t.amount || 0);
          sellerData.total_commission += Number(t.seller_earnings || 0);
          sellerData.transaction_count += 1;
        }
      });

      const topSellers = Array.from(sellerMap.values())
        .sort((a, b) => b.total_sales - a.total_sales)
        .slice(0, 10);

      // Revenue by automation
      const automationMap = new Map<string, { automation_name: string; revenue: number; transaction_count: number }>();
      transactions?.forEach((t) => {
        if (t.automation) {
          const automationName = t.automation.name || "Unknown";
          if (!automationMap.has(automationName)) {
            automationMap.set(automationName, {
              automation_name: automationName,
              revenue: 0,
              transaction_count: 0,
            });
          }
          const automationData = automationMap.get(automationName)!;
          automationData.revenue += Number(t.amount || 0);
          automationData.transaction_count += 1;
        }
      });

      const revenueByAutomation = Array.from(automationMap.values())
        .sort((a, b) => b.revenue - a.revenue);

      // Setup vs Monthly breakdown
      const setupVsMonthly = transactions?.reduce(
        (acc, t) => {
          if (t.transaction_type === "setup") {
            acc.setup_revenue += Number(t.amount || 0);
          } else if (t.transaction_type === "monthly") {
            acc.monthly_revenue += Number(t.amount || 0);
          }
          return acc;
        },
        { setup_revenue: 0, monthly_revenue: 0 }
      ) || { setup_revenue: 0, monthly_revenue: 0 };

      // Calculate monthly vault share (The Vault Network's monthly cut)
      const monthlyVaultShare = transactions?.reduce((sum, t) => {
        if (t.transaction_type === "monthly") {
          return sum + Number(t.vault_share || 0);
        }
        return sum;
      }, 0) || 0;

      setAnalytics({
        totalRevenue,
        totalProfit,
        totalCommissionPaid,
        totalTransactions: transactions?.length || 0,
        monthlyVaultShare,
        monthlyRevenue,
        topSellers,
        recentTransactions: transactions?.slice(0, 50).map((t) => ({
          id: t.id,
          created_at: t.created_at,
          amount: Number(t.amount || 0),
          seller_earnings: Number(t.seller_earnings || 0),
          vault_share: Number(t.vault_share || 0),
          transaction_type: t.transaction_type,
          client: t.client,
          automation: t.automation,
          seller: t.seller,
        })) || [],
        revenueByAutomation,
        setupVsMonthly,
      });
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error loading analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchQuizzes = async () => {
    setLoadingQuizzes(true);
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error: any) {
      console.error("Error fetching quizzes:", error);
      toast({
        title: "Error",
        description: "Failed to load quizzes",
        variant: "destructive",
      });
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const fetchQuizTokens = async () => {
    setLoadingQuizTokens(true);
    try {
      const { data, error } = await supabase
        .from("quiz_access_tokens")
        .select(`
          *,
          quizzes (
            id,
            title,
            description
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuizTokens(data || []);
    } catch (error: any) {
      console.error("Error fetching quiz tokens:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz links",
        variant: "destructive",
      });
    } finally {
      setLoadingQuizTokens(false);
    }
  };

  const handleCreateQuiz = async (questions: any[]) => {
    if (!newQuiz.title || questions.length === 0) {
      toast({
        title: "Missing fields",
        description: "Quiz title and at least one question are required",
        variant: "destructive",
      });
      return;
    }

    setCreatingQuiz(true);
    try {
      // Create quiz
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          title: newQuiz.title,
          description: newQuiz.description || null,
          module_id: newQuiz.module_id || null,
          passing_score: parseInt(newQuiz.passing_score),
          time_limit_minutes: newQuiz.time_limit_minutes ? parseInt(newQuiz.time_limit_minutes) : null,
          max_attempts: parseInt(newQuiz.max_attempts),
          created_by: user?.id,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Create questions
      const questionsToInsert = questions.map((q, index) => ({
        quiz_id: quizData.id,
        question_number: index + 1,
        question_text: q.question,
        option_a: q.optionA,
        option_b: q.optionB,
        option_c: q.optionC,
        option_d: q.optionD,
        correct_answer: q.correctAnswer,
        points: 1,
      }));

      const { error: questionsError } = await supabase
        .from("quiz_questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({
        title: "Quiz Created!",
        description: `"${newQuiz.title}" has been created with ${questions.length} questions`,
      });

      // Reset form
      setNewQuiz({
        title: "",
        description: "",
        module_id: "",
        passing_score: "70",
        time_limit_minutes: "",
        max_attempts: "3",
      });
      setQuizQuestions([]);

      // Refresh quizzes
      await fetchQuizzes();
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create quiz",
        variant: "destructive",
      });
    } finally {
      setCreatingQuiz(false);
    }
  };

  const handleCreateQuizToken = async () => {
    if (!newQuizToken.quiz_id) {
      toast({
        title: "Missing fields",
        description: "Please select a quiz",
        variant: "destructive",
      });
      return;
    }

    setCreatingQuizToken(true);
    try {
      // Generate a random token
      const token = `quiz_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      const linkTitle = newQuizToken.link_title || "Quiz Link";

      const { data, error } = await supabase
        .from("quiz_access_tokens")
        .insert({
          token,
          quiz_id: newQuizToken.quiz_id,
          link_title: linkTitle,
          expires_at: newQuizToken.expires_at || null,
          max_uses: newQuizToken.max_uses ? parseInt(newQuizToken.max_uses) : null,
          current_uses: 0,
          is_active: true,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Quiz Link Created!",
        description: "Share this link for learners to take the quiz",
      });

      // Reset form
      setNewQuizToken({
        quiz_id: "",
        link_title: "",
        expires_at: "",
        max_uses: "",
      });

      // Refresh tokens
      await fetchQuizTokens();
    } catch (error: any) {
      console.error("Error creating quiz token:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create quiz link",
        variant: "destructive",
      });
    } finally {
      setCreatingQuizToken(false);
    }
  };

  const handleDeleteQuizToken = async (tokenId: string) => {
    if (!confirm("Are you sure you want to delete this quiz link? This action cannot be undone.")) {
      return;
    }

    setDeletingQuizToken(tokenId);
    try {
      const { error } = await supabase
        .from("quiz_access_tokens")
        .delete()
        .eq("id", tokenId);

      if (error) throw error;

      toast({
        title: "Quiz Link Deleted",
        description: "The quiz access link has been successfully deleted",
      });

      await fetchQuizTokens();
    } catch (error: any) {
      console.error("Error deleting quiz token:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete quiz link",
        variant: "destructive",
      });
    } finally {
      setDeletingQuizToken(null);
    }
  };

  const fetchModuleTokens = async () => {
    setLoadingModules(true);
    try {
      const { data, error } = await supabase
        .from("module_access_tokens")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setModuleTokens(data || []);
    } catch (error: any) {
      console.error("Error fetching module tokens:", error);
      toast({
        title: "Error",
        description: "Failed to load module tokens",
        variant: "destructive",
      });
    } finally {
      setLoadingModules(false);
    }
  };

  const handleImageUpload = async (file: File, moduleId: string) => {
    if (!file) return null;

    try {
      // Create a unique filename with module ID prefix
      const fileExt = file.name.split('.').pop();
      const fileName = `${moduleId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage (bucket: module-images)
      const { data, error: uploadError } = await supabase.storage
        .from('module-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // If bucket doesn't exist, try to create it or use a fallback
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
          throw new Error("Storage Bucket Not Found. Please create a 'module-images' bucket in Supabase Storage with public access");
        }
        throw uploadError;
      }

      // Get public URL from Supabase Storage
      const { data: urlData } = supabase.storage
        .from('module-images')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      
      // Use the Supabase public URL directly
      // If you have a CDN/custom domain configured, you can replace the domain here
      // For now, we'll use the Supabase URL which works immediately
      const vaultnetUrl = publicUrl;

      return { url: vaultnetUrl, filename: file.name };
    } catch (error: any) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleMultipleImageUpload = async (files: File[], moduleId: string) => {
    if (!files || files.length === 0 || !moduleId) return;

    setUploadingImage(true);
    const uploadedImages: { url: string; filename: string }[] = [];
    const failedUploads: string[] = [];

    try {
      // Upload all files in parallel
      const uploadPromises = files.map(async (file) => {
        try {
          const result = await handleImageUpload(file, moduleId);
          if (result) {
            uploadedImages.push(result);
          }
        } catch (error: any) {
          console.error(`Failed to upload ${file.name}:`, error);
          failedUploads.push(file.name);
        }
      });

      await Promise.all(uploadPromises);

      // Add all successfully uploaded images to the list
      if (uploadedImages.length > 0) {
        setModuleImages(prev => [...prev, ...uploadedImages]);
        
        // Copy the last uploaded image URL to clipboard
        const lastUrl = uploadedImages[uploadedImages.length - 1].url;
        navigator.clipboard.writeText(lastUrl);

        toast({
          title: `${uploadedImages.length} Image${uploadedImages.length > 1 ? 's' : ''} Uploaded!`,
          description: failedUploads.length > 0 
            ? `${failedUploads.length} image(s) failed to upload: ${failedUploads.join(', ')}`
            : `All images uploaded successfully. Last URL copied to clipboard.`,
        });
      } else if (failedUploads.length > 0) {
        toast({
          title: "Upload Failed",
          description: `Failed to upload all images. Make sure the 'module-images' storage bucket exists and is public.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload images. Make sure the 'module-images' storage bucket exists and is public.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Fetch Vault Library Modules
  const fetchVaultModules = async () => {
    setLoadingVaultModules(true);
    try {
      const { data, error } = await supabase
        .from("vault_library_modules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVaultModules(data || []);
    } catch (error: any) {
      console.error("Error fetching vault modules:", error);
      toast({
        title: "Error",
        description: "Failed to load vault modules",
        variant: "destructive",
      });
    } finally {
      setLoadingVaultModules(false);
    }
  };

  // Send Discord webhook notification
  const sendDiscordWebhook = async (module: any) => {
    try {
      const webhookUrl = "https://discord.com/api/webhooks/1440844889846841466/QdlQk2k2_BcJxVQ70FxCpvnEh475y6z2_nlFG8oq3GUtE2ik_jt3iEtPdjEOCf_YtKw3";
      
      // Create shareable link for partners to add module to their library
      const moduleLink = `${window.location.origin}/vault-library?module=${module.id}`;
      
      const embed = {
        title: "📚 New Vault Library Module Published!",
        description: `**${module.title}**\n\n${module.category}\n\n[**Add to Your Library →**](${moduleLink})`,
        color: 0x00ff00, // Green
        fields: [
          {
            name: "XP Reward",
            value: `${module.xp_reward} XP`,
            inline: true,
          },
          {
            name: "Minimum Rank",
            value: module.min_rank,
            inline: true,
          },
          {
            name: "Link",
            value: `[Click here to add to your library](${moduleLink})`,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          embeds: [embed],
        }),
      });
    } catch (error) {
      console.error("Error sending Discord webhook:", error);
      // Don't throw - webhook failure shouldn't block publishing
    }
  };

  // Create Vault Module
  const handleCreateVaultModule = async () => {
    if (!newVaultModule.module_data || !newVaultModule.min_rank) {
      toast({
        title: "Missing Fields",
        description: "Please provide module JSON and select a minimum rank",
        variant: "destructive",
      });
      return;
    }

    setCreatingVaultModule(true);
    try {
      let moduleData;
      try {
        moduleData = typeof newVaultModule.module_data === 'string' 
          ? JSON.parse(newVaultModule.module_data)
          : newVaultModule.module_data;
      } catch (error) {
        throw new Error("Invalid JSON format. Please check your module data.");
      }

      // Extract title, category, and xp_reward from JSON
      if (!moduleData.title || !moduleData.category || !moduleData.xp_reward) {
        throw new Error("JSON must include 'title', 'category', and 'xp_reward' fields");
      }

      const { data, error } = await supabase
        .from("vault_library_modules")
        .insert({
          title: moduleData.title,
          category: moduleData.category,
          xp_reward: parseInt(moduleData.xp_reward),
          min_rank: newVaultModule.min_rank,
          module_data: moduleData,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Module Created!",
        description: `${moduleData.title} has been created successfully`,
      });

      // Reset form
      setNewVaultModule({
        min_rank: "Recruit Plus",
        module_data: "",
      });

      // Refresh modules
      await fetchVaultModules();
    } catch (error: any) {
      console.error("Error creating vault module:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create module",
        variant: "destructive",
      });
    } finally {
      setCreatingVaultModule(false);
    }
  };

  // Update Vault Module
  const handleUpdateVaultModule = async () => {
    if (!editingVaultModule) return;

    setCreatingVaultModule(true);
    try {
      let moduleData;
      try {
        moduleData = typeof editingVaultModule.module_data === 'string'
          ? JSON.parse(editingVaultModule.module_data)
          : editingVaultModule.module_data;
      } catch (error) {
        throw new Error("Invalid JSON format. Please check your module data.");
      }

      // Extract title, category, and xp_reward from JSON
      if (!moduleData.title || !moduleData.category || !moduleData.xp_reward) {
        throw new Error("JSON must include 'title', 'category', and 'xp_reward' fields");
      }

      const { error } = await supabase
        .from("vault_library_modules")
        .update({
          title: moduleData.title,
          category: moduleData.category,
          xp_reward: parseInt(moduleData.xp_reward),
          min_rank: editingVaultModule.min_rank,
          module_data: moduleData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingVaultModule.id);

      if (error) throw error;

      toast({
        title: "Module Updated!",
        description: `${moduleData.title} has been updated successfully`,
      });

      setEditingVaultModule(null);
      await fetchVaultModules();
    } catch (error: any) {
      console.error("Error updating vault module:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update module",
        variant: "destructive",
      });
    } finally {
      setCreatingVaultModule(false);
    }
  };

  // Publish Vault Module
  const handlePublishVaultModule = async (moduleId: string) => {
    setPublishingVaultModule(moduleId);
    try {
      const { data, error } = await supabase
        .from("vault_library_modules")
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", moduleId)
        .select()
        .single();

      if (error) throw error;

      // Send Discord webhook
      await sendDiscordWebhook(data);

      toast({
        title: "Module Published!",
        description: `${data.title} has been published and announced on Discord`,
      });

      await fetchVaultModules();
    } catch (error: any) {
      console.error("Error publishing vault module:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to publish module",
        variant: "destructive",
      });
    } finally {
      setPublishingVaultModule(null);
    }
  };

  // Delete Vault Module
  const handleDeleteVaultModule = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module? This action cannot be undone.")) {
      return;
    }

    setDeletingVaultModule(moduleId);
    try {
      const { error } = await supabase
        .from("vault_library_modules")
        .delete()
        .eq("id", moduleId);

      if (error) throw error;

      toast({
        title: "Module Deleted",
        description: "The module has been deleted successfully",
      });

      await fetchVaultModules();
    } catch (error: any) {
      console.error("Error deleting vault module:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete module",
        variant: "destructive",
      });
    } finally {
      setDeletingVaultModule(null);
    }
  };

  const handleDeleteModuleToken = async (tokenId: string) => {
    if (!confirm("Are you sure you want to delete this module access link? This action cannot be undone.")) {
      return;
    }

    setDeletingModuleToken(tokenId);
    try {
      const { error } = await supabase
        .from("module_access_tokens")
        .delete()
        .eq("id", tokenId);

      if (error) throw error;

      toast({
        title: "Module Link Deleted",
        description: "The module access link has been successfully deleted",
      });

      // Refresh tokens
      await fetchModuleTokens();
    } catch (error: any) {
      console.error("Error deleting module token:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete module access link",
        variant: "destructive",
      });
    } finally {
      setDeletingModuleToken(null);
    }
  };

  const handleSendDiscordNotification = async (token: any) => {
    setSendingDiscordNotification(token.id);
    try {
      const moduleLink = `${window.location.origin}/learner-dashboard?token=${token.token}`;
      const webhookUrl = "https://discord.com/api/webhooks/1440081454741848185/XP546Z4FmaIKtdbIR3sbcsKLurcMpF52dAXRsi8nxW9rAOU4956jMYVEIvj5_osU7IbS";

      // Create Discord embed message
      // Discord color is decimal: #f5c84c = 16119244
      const embed = {
        title: "📚 New Module Available!",
        description: `**${token.module_title}**\n\n${token.module_description || "A new learning module is now available."}`,
        color: 16119244, // Gold color #f5c84c in decimal
        fields: [
          {
            name: "🔗 Add to Your Dashboard",
            value: `[Click here to add this module](${moduleLink})`,
            inline: false
          }
        ],
        footer: {
          text: "The Vault Network Academy"
        },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [embed]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Discord webhook failed: ${response.status} ${errorText}`);
      }

      toast({
        title: "Discord Notification Sent!",
        description: "The module has been announced in Discord",
      });
    } catch (error: any) {
      console.error("Error sending Discord notification:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send Discord notification",
        variant: "destructive",
      });
    } finally {
      setSendingDiscordNotification(null);
    }
  };

  const handleCreateModuleToken = async () => {
    if (!newModuleToken.module_id || !newModuleToken.module_title) {
      toast({
        title: "Missing fields",
        description: "Module ID and Title are required",
        variant: "destructive",
      });
      return;
    }

    setCreatingModule(true);
    try {
      // Generate a random token
      const token = `learn_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      // Parse HTML content if provided - don't modify it, just store as-is
      const moduleContent = newModuleToken.module_content_html ? {
        type: 'html',
        html: newModuleToken.module_content_html,
        styles: moduleHTMLPreview || ''
      } : null;

      // Extract quiz_id from quiz_link if provided
      let quizId = null;
      if (newModuleToken.quiz_link) {
        // Extract token from quiz link
        const quizTokenMatch = newModuleToken.quiz_link.match(/token=([^&]+)/);
        if (quizTokenMatch) {
          const quizToken = quizTokenMatch[1];
          // Get quiz_id from quiz_access_tokens
          const { data: tokenData } = await supabase
            .from("quiz_access_tokens")
            .select("quiz_id")
            .eq("token", quizToken)
            .single();
          
          if (tokenData) {
            quizId = tokenData.quiz_id;
          }
        }
      }

      const { data, error } = await supabase
        .from("module_access_tokens")
        .insert({
          token,
          module_id: newModuleToken.module_id,
          module_title: newModuleToken.module_title,
          module_description: newModuleToken.module_description || null,
          module_content: moduleContent,
          quiz_id: quizId,
          expires_at: newModuleToken.expires_at || null,
          max_uses: newModuleToken.max_uses ? parseInt(newModuleToken.max_uses) : null,
          current_uses: 0,
          is_active: true,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Generate the module link
      const moduleLink = `${window.location.origin}/learner-dashboard?token=${token}`;

      toast({
        title: "Module Token Created!",
        description: "Share this link in Discord for learners to access the module",
      });

      // Store the created module data for Discord notification
      const createdModuleData = {
        id: data.id,
        token: token,
        module_title: newModuleToken.module_title,
        module_description: newModuleToken.module_description,
        module_link: moduleLink,
      };

      // Reset form
      setNewModuleToken({
        module_id: "",
        module_title: "",
        module_description: "",
        module_content_html: "",
        quiz_link: "",
        expires_at: "",
        max_uses: "",
      });
      setModuleHTMLPreview("");
      setModuleImages([]);
      setSelectedModuleForImages("");

      // Refresh tokens
      await fetchModuleTokens();
    } catch (error: any) {
      console.error("Error creating module token:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create module token",
        variant: "destructive",
      });
    } finally {
      setCreatingModule(false);
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

      // Fetch all tickets
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
        .order("created_at", { ascending: false });

      if (ticketsError) throw ticketsError;
      setTickets(ticketsData || []);

      // Fetch all seller messages
      const { data: sellerMessagesData, error: sellerMessagesError } = await supabase
        .from("seller_messages")
        .select(`
          *,
          seller:sellers!seller_messages_seller_id_fkey (
            business_name
          )
        `)
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
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Enrich messages with sender info
      const enrichedMessages = await identifyMessageSender(messages || [], ticket);
      setTicketMessages(enrichedMessages);
      
      // Set up real-time subscription
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
            // Refresh messages when new one is inserted
            const { data: updatedMessages } = await supabase
              .from("ticket_messages")
              .select("*")
              .eq("ticket_id", ticket.id)
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
      
      // Store channel for cleanup
      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error: any) {
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
      const { data: insertedMessages, error } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user?.id,
          message: newTicketMessage.trim(),
          is_internal: false,
        })
        .select();

      if (error) {
        console.error("Error inserting message:", error);
        throw error;
      }

      // Clear the input immediately
      const messageText = newTicketMessage.trim();
      setNewTicketMessage("");
      
      // Small delay to ensure the insert is committed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Refresh messages - try multiple times if needed
      let messages;
      let fetchError;
      let retries = 3;
      
      while (retries > 0) {
        const result = await supabase
          .from("ticket_messages")
          .select("*")
          .eq("ticket_id", selectedTicket.id)
          .order("created_at", { ascending: true });
        
        messages = result.data;
        fetchError = result.error;
        
        // Check if our message is in the results
        const ourMessageFound = messages?.some(m => 
          m.user_id === user?.id && 
          m.message === messageText &&
          Math.abs(new Date(m.created_at).getTime() - Date.now()) < 5000 // Within last 5 seconds
        );
        
        if (ourMessageFound || !fetchError) {
          break;
        }
        
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      if (fetchError) {
        console.error("Error fetching messages:", fetchError);
        throw fetchError;
      }

      // Enrich messages with sender info using helper function
      const enrichedMessages = await identifyMessageSender(messages || [], selectedTicket);
      setTicketMessages(enrichedMessages);
      
      // Scroll to bottom after messages are set
      setTimeout(() => {
        ticketMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
      
      fetchAdminData();
    } catch (error: any) {
      console.error("Failed to send message:", error);
      toast({
        title: "Failed to send message",
        description: error.message || "An error occurred while sending your message.",
        variant: "destructive",
      });
    } finally {
      setSendingTicketMessage(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status })
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: "Ticket status has been updated.",
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
        is_from_seller: false,
      });

      if (error) throw error;

      // Update message status to in_progress if it was open
      if (selectedSellerMessage.status === "open") {
        await supabase
          .from("seller_messages")
          .update({ status: "in_progress" })
          .eq("id", selectedSellerMessage.id);
      }

      setNewSellerMessageReply("");
      // Refresh replies
      const { data: replies } = await supabase
        .from("seller_message_replies")
        .select("*")
        .eq("seller_message_id", selectedSellerMessage.id)
        .order("created_at", { ascending: true });

      setSellerMessageReplies(replies || []);
      fetchAdminData();
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

  const updateSellerMessageStatus = async (messageId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("seller_messages")
        .update({ status })
        .eq("id", messageId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: "Message status has been updated.",
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

  // Handle URL query parameter and notification events (after functions are defined)
  useEffect(() => {
    // Handle URL query parameter for tab navigation
    const tab = searchParams.get('tab');
    if (tab && ['analytics', 'sellers', 'clients', 'automations', 'client-automations', 'tickets', 'seller-messages', 'enquiries', 'xp-management'].includes(tab)) {
      setActiveTab(tab);
    }
    
    // Handle opening ticket from notification
    const handleOpenTicket = (event: CustomEvent) => {
      const ticketId = event.detail.ticketId;
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        setActiveTab('tickets');
        openTicketChat(ticket);
      }
    };
    
    // Handle opening seller message from notification
    const handleOpenSellerMessage = (event: CustomEvent) => {
      const messageId = event.detail.messageId;
      const message = sellerMessages.find(m => m.id === messageId);
      if (message) {
        setActiveTab('seller-messages');
        openSellerMessage(message);
      }
    };
    
    window.addEventListener('openTicket', handleOpenTicket as EventListener);
    window.addEventListener('openSellerMessage', handleOpenSellerMessage as EventListener);
    
    return () => {
      window.removeEventListener('openTicket', handleOpenTicket as EventListener);
      window.removeEventListener('openSellerMessage', handleOpenSellerMessage as EventListener);
    };
  }, [searchParams, tickets, sellerMessages]);

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

  const handleUpdateSetupStatus = async (clientAutomationId: string, newStatus: 'pending_setup' | 'setup_in_progress' | 'setup_complete' | 'active') => {
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

  const syncPartnerProStripe = async () => {
    try {
      const result = await callNetlifyFunction('stripe-sync-partner-pro', {
        monthlyPrice: 24.99,
      });

      toast({
        title: "Partner Pro Synced!",
        description: result.message || "Partner Pro has been successfully synced with Stripe. Please set the STRIPE_PARTNER_PRO_PRICE_ID environment variable.",
      });

      return result;
    } catch (error: any) {
      toast({
        title: "Stripe Sync Failed",
        description: error.message || "Failed to sync Partner Pro with Stripe. Please check your Stripe configuration.",
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

  const handleGiveXP = async () => {
    if (!selectedSellerForXP || !xpAmount) {
      toast({
        title: "Selection required",
        description: "Please select a partner and enter an XP amount",
        variant: "destructive",
      });
      return;
    }

    const xpValue = parseInt(xpAmount);
    if (isNaN(xpValue) || xpValue <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number for XP",
        variant: "destructive",
      });
      return;
    }

    setGivingXP(true);
    try {
      const { data, error } = await supabase.rpc('add_seller_xp', {
        _seller_id: selectedSellerForXP,
        _xp_amount: xpValue,
        _event_type: 'admin_grant',
        _description: xpDescription || `Admin granted ${xpValue} XP`,
        _metadata: { 
          granted_by: user?.id,
          reason: xpDescription || 'Admin grant'
        }
      });

      if (error) throw error;

      toast({
        title: "XP Granted!",
        description: `Successfully granted ${xpValue} XP to ${sellers.find(s => s.id === selectedSellerForXP)?.business_name || 'partner'}`,
      });

      // Reset form
      setSelectedSellerForXP("");
      setXpAmount("");
      setXpDescription("");
      setXpSellerSearchOpen(false);

      // Refresh seller data
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Failed to grant XP",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGivingXP(false);
    }
  };

  const handleDemoteRank = async () => {
    if (!selectedSellerForXP) {
      toast({
        title: "Selection required",
        description: "Please select a partner to demote",
        variant: "destructive",
      });
      return;
    }

    const seller = sellers.find(s => s.id === selectedSellerForXP);
    if (!seller) {
      toast({
        title: "Partner not found",
        description: "Selected partner could not be found",
        variant: "destructive",
      });
      return;
    }

    const currentRank = seller.current_rank as PartnerRank;
    const previousRank = getPreviousRank(currentRank);

    if (!previousRank) {
      toast({
        title: "Already at minimum rank",
        description: `${seller.business_name} is already at the lowest rank (Recruit)`,
        variant: "destructive",
      });
      return;
    }

    // Confirm demotion
    if (!confirm(`Are you sure you want to demote ${seller.business_name} from ${currentRank} to ${previousRank}? They will need to manually rank up again unless you promote them through this panel.`)) {
      return;
    }

    setDemotingRank(true);
    try {
      const previousRankInfo = getRankInfo(previousRank);

      // Update rank and commission rate (don't update highest_rank when demoting)
      const { error: updateError } = await supabase
        .from('sellers')
        .update({
          current_rank: previousRank,
          commission_rate: previousRankInfo.commissionRate,
          // Don't update highest_rank when demoting - keep their achievement
        })
        .eq('id', selectedSellerForXP);

      if (updateError) throw updateError;

      // Log rank demotion
      await supabase
        .from('partner_activity_log')
        .insert({
          seller_id: selectedSellerForXP,
          event_type: 'rank_up',
          xp_value: 0,
          description: `Admin demotion: Demoted from ${currentRank} to ${previousRank}`,
          metadata: {
            old_rank: currentRank,
            new_rank: previousRank,
            admin_demotion: true,
            demoted_by: user?.id,
          },
        });

      toast({
        title: "Rank Demoted!",
        description: `${seller.business_name} has been demoted from ${currentRank} to ${previousRank}. They will need to manually rank up again unless promoted through this panel.`,
      });

      // Reset form
      setSelectedSellerForXP("");
      setXpSellerSearchOpen(false);

      // Refresh seller data
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Failed to demote rank",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDemotingRank(false);
    }
  };

  const handleAdvanceToNextRank = async () => {
    if (!selectedSellerForXP) {
      toast({
        title: "Selection required",
        description: "Please select a partner to advance",
        variant: "destructive",
      });
      return;
    }

    const seller = sellers.find(s => s.id === selectedSellerForXP);
    if (!seller) {
      toast({
        title: "Partner not found",
        description: "Selected partner could not be found",
        variant: "destructive",
      });
      return;
    }

    const currentRank = seller.current_rank as PartnerRank;
    const nextRank = getNextRank(currentRank);

    if (!nextRank) {
      toast({
        title: "Already at max rank",
        description: `${seller.business_name} is already at the highest rank (Partner Pro)`,
        variant: "destructive",
      });
      return;
    }

    setAdvancingRank(true);
    try {
      // Get all tasks required for the next rank
      const requiredTasks = getTasksForRank(nextRank);
      const rankInfo = getRankInfo(nextRank);

      // Check which tasks are already completed
      const { data: existingCompletions } = await supabase
        .from('partner_activity_log')
        .select('metadata')
        .eq('seller_id', selectedSellerForXP)
        .in('event_type', ['task_completed', 'quiz_completed']);

      const completedLessonIds = new Set(
        existingCompletions?.map(c => c.metadata?.lesson_id).filter(Boolean) || []
      );

      // Mark all missing tasks as completed
      const tasksToComplete = requiredTasks.filter(taskId => !completedLessonIds.has(taskId));
      
      if (tasksToComplete.length > 0) {
        const taskCompletions = tasksToComplete.map(taskId => ({
          seller_id: selectedSellerForXP,
          event_type: 'task_completed',
          xp_value: 0, // XP will be awarded separately
          description: `Admin bypass: Auto-completed task ${taskId} for ${nextRank} rank`,
          metadata: {
            lesson_id: taskId,
            admin_bypass: true,
            bypassed_by: user?.id,
            target_rank: nextRank,
          },
        }));

        const { error: logError } = await supabase
          .from('partner_activity_log')
          .insert(taskCompletions);

        if (logError) throw logError;
      }

      // Set XP to next rank threshold if current XP is less
      const currentXp = seller.current_xp || 0;
      const nextRankXpThreshold = rankInfo.xpThreshold;
      
      if (currentXp < nextRankXpThreshold) {
        const xpNeeded = nextRankXpThreshold - currentXp;
        const { error: xpError } = await supabase.rpc('add_seller_xp', {
          _seller_id: selectedSellerForXP,
          _xp_amount: xpNeeded,
          _event_type: 'admin_grant',
          _description: `Admin bypass: Set to ${nextRank} rank threshold`,
          _metadata: { 
            granted_by: user?.id,
            reason: `Admin bypass to ${nextRank}`,
            bypass_progression: true
          }
        });

        if (xpError) throw xpError;
      }

      // Update rank and commission rate
      const { error: updateError } = await supabase
        .from('sellers')
        .update({
          current_rank: nextRank,
          commission_rate: rankInfo.commissionRate,
          highest_rank: nextRank, // Update highest rank if this is higher
        })
        .eq('id', selectedSellerForXP);

      if (updateError) throw updateError;

      // Log rank up
      await supabase
        .from('partner_activity_log')
        .insert({
          seller_id: selectedSellerForXP,
          event_type: 'rank_up',
          xp_value: 0,
          description: `Admin bypass: Ranked up to ${nextRank}`,
          metadata: {
            old_rank: currentRank,
            new_rank: nextRank,
            admin_bypass: true,
            bypassed_by: user?.id,
          },
        });

      toast({
        title: "Rank Advanced!",
        description: `${seller.business_name} has been advanced from ${currentRank} to ${nextRank}. All required tasks have been auto-completed.`,
      });

      // Reset form
      setSelectedSellerForXP("");
      setXpSellerSearchOpen(false);

      // Refresh seller data
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Failed to advance rank",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAdvancingRank(false);
    }
  };

  const handleSetRank = async () => {
    if (!selectedSellerForXP) {
      toast({
        title: "Selection required",
        description: "Please select a partner to set rank",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTargetRank) {
      toast({
        title: "Rank required",
        description: "Please select a target rank",
        variant: "destructive",
      });
      return;
    }

    const seller = sellers.find(s => s.id === selectedSellerForXP);
    if (!seller) {
      toast({
        title: "Partner not found",
        description: "Selected partner could not be found",
        variant: "destructive",
      });
      return;
    }

    const currentRank = seller.current_rank as PartnerRank;
    const targetRank = selectedTargetRank as PartnerRank;

    if (currentRank === targetRank) {
      toast({
        title: "Already at target rank",
        description: `${seller.business_name} is already at ${targetRank} rank`,
        variant: "destructive",
      });
      return;
    }

    // Confirm rank change
    if (!confirm(`Are you sure you want to set ${seller.business_name}'s rank from ${currentRank} to ${targetRank}? This will complete all required tasks and set XP to the appropriate threshold.`)) {
      return;
    }

    setSettingRank(true);
    try {
      const targetRankInfo = getRankInfo(targetRank);
      const targetRankTasks = getTasksForRank(targetRank);

      // Check which tasks are already completed
      const { data: existingCompletions } = await supabase
        .from('partner_activity_log')
        .select('metadata')
        .eq('seller_id', selectedSellerForXP)
        .in('event_type', ['task_completed', 'quiz_completed']);

      const completedLessonIds = new Set(
        existingCompletions?.map(c => c.metadata?.lesson_id).filter(Boolean) || []
      );

      // Mark all missing tasks as completed
      const tasksToComplete = targetRankTasks.filter(taskId => !completedLessonIds.has(taskId));
      
      if (tasksToComplete.length > 0) {
        const taskCompletions = tasksToComplete.map(taskId => ({
          seller_id: selectedSellerForXP,
          event_type: 'task_completed',
          xp_value: 0,
          description: `Admin bypass: Auto-completed task ${taskId} for ${targetRank} rank`,
          metadata: {
            lesson_id: taskId,
            admin_bypass: true,
            bypassed_by: user?.id,
            target_rank: targetRank,
          },
        }));

        const { error: logError } = await supabase
          .from('partner_activity_log')
          .insert(taskCompletions);

        if (logError) throw logError;
      }

      // Set XP to target rank threshold if current XP is less
      const currentXp = seller.current_xp || 0;
      const targetRankXpThreshold = targetRankInfo.xpThreshold;
      
      if (currentXp < targetRankXpThreshold) {
        const xpNeeded = targetRankXpThreshold - currentXp;
        const { error: xpError } = await supabase.rpc('add_seller_xp', {
          _seller_id: selectedSellerForXP,
          _xp_amount: xpNeeded,
          _event_type: 'admin_grant',
          _description: `Admin bypass: Set to ${targetRank} rank threshold`,
          _metadata: { 
            granted_by: user?.id,
            reason: `Admin bypass to ${targetRank}`,
            bypass_progression: true
          }
        });

        if (xpError) throw xpError;
      }

      // Update rank and commission rate
      const { error: updateError } = await supabase
        .from('sellers')
        .update({
          current_rank: targetRank,
          commission_rate: targetRankInfo.commissionRate,
          highest_rank: targetRank, // Update highest rank if this is higher
        })
        .eq('id', selectedSellerForXP);

      if (updateError) throw updateError;

      // Log rank change
      await supabase
        .from('partner_activity_log')
        .insert({
          seller_id: selectedSellerForXP,
          event_type: 'rank_up',
          xp_value: 0,
          description: `Admin bypass: Rank set to ${targetRank}`,
          metadata: {
            old_rank: currentRank,
            new_rank: targetRank,
            admin_bypass: true,
            bypassed_by: user?.id,
            set_rank: true,
          },
        });

      toast({
        title: "Rank Set!",
        description: `${seller.business_name}'s rank has been set from ${currentRank} to ${targetRank}. All required tasks have been auto-completed.`,
      });

      // Reset form
      setSelectedTargetRank("");
      setSelectedSellerForXP("");
      setXpSellerSearchOpen(false);

      // Refresh seller data
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Failed to set rank",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSettingRank(false);
    }
  };

  const handleBypassToVerified = async () => {
    if (!selectedSellerForXP) {
      toast({
        title: "Selection required",
        description: "Please select a partner to bypass progression",
        variant: "destructive",
      });
      return;
    }

    const seller = sellers.find(s => s.id === selectedSellerForXP);
    if (!seller) {
      toast({
        title: "Partner not found",
        description: "Selected partner could not be found",
        variant: "destructive",
      });
      return;
    }

    setBypassingToVerified(true);
    try {
      // Get all tasks for Verified rank
      const verifiedTasks = [
        'stage-1-recruit-3', // Complete Getting Started
        'stage-2-apprentice-6', // Suggest New Automation
        'stage-3-agent-9', // Create Sales Script
        'stage-3-agent-10', // Log First Outreach
        'stage-4-partner-12', // Add Demo Client
        'stage-4-partner-13', // Assign Demo Automation
        'stage-4-partner-14', // Pitch Reflection
        'stage-4-partner-15', // Invite Friend
        'stage-5-verified-17', // Invite First Real Client
        'stage-5-verified-18', // Assign First Automation
        'stage-5-verified-19', // Mark First Sale
        'stage-5-verified-20', // Submit Case Summary
      ];

      // Check which tasks are already completed
      const { data: existingCompletions } = await supabase
        .from('partner_activity_log')
        .select('metadata')
        .eq('seller_id', selectedSellerForXP)
        .in('event_type', ['task_completed', 'quiz_completed']);

      const completedLessonIds = new Set(
        existingCompletions?.map(c => c.metadata?.lesson_id).filter(Boolean) || []
      );

      // Mark all tasks as completed
      const tasksToComplete = verifiedTasks.filter(taskId => !completedLessonIds.has(taskId));
      
      if (tasksToComplete.length > 0) {
        const taskCompletions = tasksToComplete.map(taskId => ({
          seller_id: selectedSellerForXP,
          event_type: 'task_completed',
          xp_value: 0, // XP will be awarded separately
          description: `Admin bypass: Auto-completed task ${taskId}`,
          metadata: {
            lesson_id: taskId,
            admin_bypass: true,
            bypassed_by: user?.id,
          },
        }));

        const { error: logError } = await supabase
          .from('partner_activity_log')
          .insert(taskCompletions);

        if (logError) throw logError;
      }

      // Set XP to 7000 (Verified threshold) if current XP is less
      const verifiedXpThreshold = 7000;
      const currentXp = seller.current_xp || 0;
      
      if (currentXp < verifiedXpThreshold) {
        const xpNeeded = verifiedXpThreshold - currentXp;
        const { error: xpError } = await supabase.rpc('add_seller_xp', {
          _seller_id: selectedSellerForXP,
          _xp_amount: xpNeeded,
          _event_type: 'admin_grant',
          _description: `Admin bypass: Set to Verified rank threshold`,
          _metadata: { 
            granted_by: user?.id,
            reason: 'Admin bypass to Verified',
            bypass_progression: true
          }
        });

        if (xpError) throw xpError;
      }

      // Update rank to Verified and commission rate to 40%
      const { error: updateError } = await supabase
        .from('sellers')
        .update({
          current_rank: 'Verified',
          commission_rate: 40,
          highest_rank: 'Verified',
        })
        .eq('id', selectedSellerForXP);

      if (updateError) throw updateError;

      // Log rank up
      await supabase
        .from('partner_activity_log')
        .insert({
          seller_id: selectedSellerForXP,
          event_type: 'rank_up',
          xp_value: 0,
          description: 'Admin bypass: Ranked up to Verified',
          metadata: {
            old_rank: seller.current_rank || 'Recruit',
            new_rank: 'Verified',
            admin_bypass: true,
            bypassed_by: user?.id,
          },
        });

      toast({
        title: "Progression Bypassed!",
        description: `${seller.business_name} has been set to Verified rank with all tasks completed. They will see the Partner Pro popup on their next dashboard visit.`,
      });

      // Reset form
      setSelectedSellerForXP("");
      setXpSellerSearchOpen(false);

      // Refresh seller data
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Failed to bypass progression",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBypassingToVerified(false);
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
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 mb-6 h-auto p-1 bg-muted/50">
                  <TabsTrigger value="analytics" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </TabsTrigger>
                  <TabsTrigger value="sellers" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <UserCog className="w-4 h-4" />
                    <span className="hidden sm:inline">Partners</span>
                  </TabsTrigger>
                  <TabsTrigger value="clients" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Clients</span>
                  </TabsTrigger>
                  <TabsTrigger value="automations" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <Package className="w-4 h-4" />
                    <span className="hidden sm:inline">Automations</span>
                  </TabsTrigger>
                  <TabsTrigger value="client-automations" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <Link2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Assignments</span>
                  </TabsTrigger>
                  <TabsTrigger value="tickets" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <Ticket className="w-4 h-4" />
                    <span className="hidden sm:inline">Tickets</span>
                  </TabsTrigger>
                  <TabsTrigger value="seller-messages" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <Mail className="w-4 h-4" />
                    <span className="hidden sm:inline">Messages</span>
                  </TabsTrigger>
                  <TabsTrigger value="enquiries" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <HelpCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Enquiries</span>
                  </TabsTrigger>
                  <TabsTrigger value="xp-management" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <Trophy className="w-4 h-4" />
                    <span className="hidden sm:inline">Give XP</span>
                  </TabsTrigger>
                  <TabsTrigger value="modules" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">Modules</span>
                  </TabsTrigger>
                  <TabsTrigger value="quizzes" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <HelpCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Quizzes</span>
                  </TabsTrigger>
                  <TabsTrigger value="vault-modules" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">Vault Modules</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="analytics">
                  {loadingAnalytics ? (
                    <div className="text-center py-12">
                      <div className="text-primary text-xl">Loading analytics...</div>
                    </div>
                  ) : analytics ? (
                    <div className="space-y-6">
                      {/* Key Metrics Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-card border-border">
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-primary" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                              ${analytics.totalRevenue.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              All-time revenue from transactions
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
                            <TrendingUp className="h-4 w-4 text-primary" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-primary">
                              ${analytics.totalProfit.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Vault Network's share after commissions
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Commission Paid</CardTitle>
                            <Users className="h-4 w-4 text-primary" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                              ${analytics.totalCommissionPaid.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Total commissions paid to partners
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
                            <Activity className="h-4 w-4 text-primary" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                              {analytics.totalTransactions}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Completed transactions
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Revenue & Profit Chart */}
                      {analytics.monthlyRevenue.length > 0 && (
                        <Card className="bg-card border-border">
                          <CardHeader>
                            <CardTitle className="text-primary">Revenue & Profit Trends</CardTitle>
                            <CardDescription>Monthly breakdown of revenue and profit</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ChartContainer
                              config={{
                                revenue: {
                                  label: "Revenue",
                                  color: "hsl(var(--primary))",
                                },
                                profit: {
                                  label: "Profit",
                                  color: "hsl(var(--chart-2))",
                                },
                              }}
                              className="h-[300px]"
                            >
                              <LineChart data={analytics.monthlyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Line
                                  type="monotone"
                                  dataKey="revenue"
                                  stroke="var(--color-revenue)"
                                  strokeWidth={2}
                                  name="Revenue"
                                />
                                <Line
                                  type="monotone"
                                  dataKey="profit"
                                  stroke="var(--color-profit)"
                                  strokeWidth={2}
                                  name="Profit"
                                />
                              </LineChart>
                            </ChartContainer>
                          </CardContent>
                        </Card>
                      )}

                      {/* Top Performing Sellers */}
                      {analytics.topSellers.length > 0 && (
                        <Card className="bg-card border-border">
                          <CardHeader>
                            <CardTitle className="text-primary">Top Performing Partners</CardTitle>
                            <CardDescription>Partners ranked by total sales</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Rank</TableHead>
                                  <TableHead>Partner</TableHead>
                                  <TableHead className="text-right">Total Sales</TableHead>
                                  <TableHead className="text-right">Commission Earned</TableHead>
                                  <TableHead className="text-right">Transactions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {analytics.topSellers.map((seller, index) => (
                                  <TableRow key={seller.id}>
                                    <TableCell className="font-medium">#{index + 1}</TableCell>
                                    <TableCell>{seller.business_name}</TableCell>
                                    <TableCell className="text-right font-medium">
                                      ${seller.total_sales.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right text-primary">
                                      ${seller.total_commission.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {seller.transaction_count}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      )}

                      {/* Revenue by Automation */}
                      {analytics.revenueByAutomation.length > 0 && (
                        <Card className="bg-card border-border">
                          <CardHeader>
                            <CardTitle className="text-primary">Revenue by Automation</CardTitle>
                            <CardDescription>Breakdown of revenue by automation type</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ChartContainer
                              config={{
                                revenue: {
                                  label: "Revenue",
                                  color: "hsl(var(--primary))",
                                },
                              }}
                              className="h-[300px]"
                            >
                              <BarChart data={analytics.revenueByAutomation}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="automation_name" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="revenue" fill="var(--color-revenue)" />
                              </BarChart>
                            </ChartContainer>
                          </CardContent>
                        </Card>
                      )}

                      {/* Setup vs Monthly Revenue */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card className="bg-card border-border">
                          <CardHeader>
                            <CardTitle className="text-primary">Setup Fees</CardTitle>
                            <CardDescription>One-time setup revenue</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-foreground">
                              ${analytics.setupVsMonthly.setup_revenue.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {analytics.totalRevenue > 0 ? ((analytics.setupVsMonthly.setup_revenue / analytics.totalRevenue) * 100).toFixed(1) : 0}% of total revenue
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                          <CardHeader>
                            <CardTitle className="text-primary">Monthly Recurring</CardTitle>
                            <CardDescription>Recurring monthly revenue</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-primary">
                              ${analytics.setupVsMonthly.monthly_revenue.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {analytics.totalRevenue > 0 ? ((analytics.setupVsMonthly.monthly_revenue / analytics.totalRevenue) * 100).toFixed(1) : 0}% of total revenue
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                          <CardHeader>
                            <CardTitle className="text-primary">Monthly Cut</CardTitle>
                            <CardDescription>The Vault Network's monthly share</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-primary">
                              ${analytics.monthlyVaultShare.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {analytics.setupVsMonthly.monthly_revenue > 0 ? ((analytics.monthlyVaultShare / analytics.setupVsMonthly.monthly_revenue) * 100).toFixed(1) : 0}% of monthly revenue
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Recent Transactions */}
                      {analytics.recentTransactions.length > 0 && (
                        <Card className="bg-card border-border">
                          <CardHeader>
                            <CardTitle className="text-primary">Recent Transactions</CardTitle>
                            <CardDescription>Latest transaction history</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Automation</TableHead>
                                    <TableHead>Partner</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Vault Share</TableHead>
                                    <TableHead className="text-right">Commission</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {analytics.recentTransactions.slice(0, 20).map((transaction) => (
                                    <TableRow key={transaction.id}>
                                      <TableCell className="text-sm">
                                        {new Date(transaction.created_at).toLocaleDateString()}
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        {transaction.client?.business_name || "Unknown"}
                                      </TableCell>
                                      <TableCell>
                                        {transaction.automation?.name || "Unknown"}
                                      </TableCell>
                                      <TableCell>
                                        {transaction.seller?.business_name || "Direct"}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                          {transaction.transaction_type}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        ${transaction.amount.toFixed(2)}
                                      </TableCell>
                                      <TableCell className="text-right text-primary">
                                        ${transaction.vault_share.toFixed(2)}
                                      </TableCell>
                                      <TableCell className="text-right text-muted-foreground">
                                        ${transaction.seller_earnings.toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No analytics data available</p>
                    </div>
                  )}
                </TabsContent>

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
                    {/* Partner Pro Stripe Sync Section */}
                    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-primary flex items-center gap-2">
                          <Trophy className="w-5 h-5" />
                          Partner Pro Stripe Integration
                        </CardTitle>
                        <CardDescription>
                          Sync Partner Pro subscription product with Stripe. This creates the product and price needed for Partner Pro subscriptions.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Monthly Price: <span className="font-semibold text-foreground">$24.99</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              After syncing, set <code className="bg-muted px-1 py-0.5 rounded">STRIPE_PARTNER_PRO_PRICE_ID</code> environment variable with the returned price ID.
                            </p>
                          </div>
                          <Button onClick={syncPartnerProStripe} className="bg-primary hover:bg-primary/90">
                            <Settings className="w-4 h-4 mr-2" />
                            Sync Partner Pro with Stripe
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Automations</h3>
                        <p className="text-sm text-muted-foreground">
                          Manage all automation products and their Stripe integration
                        </p>
                      </div>
                      <Button onClick={() => setShowAddAutomation(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Automation
                      </Button>
                    </div>

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
                                  onValueChange={(value: 'pending_setup' | 'setup_in_progress' | 'setup_complete' | 'active') => 
                                    handleUpdateSetupStatus(ca.id, value)
                                  }
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending_setup">Pending Setup</SelectItem>
                                    <SelectItem value="setup_in_progress">Setup In Progress</SelectItem>
                                    <SelectItem value="setup_complete">Setup Complete</SelectItem>
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

                <TabsContent value="tickets">
                  <Tabs defaultValue="open" className="w-full">
                    <TabsList className="mb-6">
                      <TabsTrigger value="open">
                        Open ({tickets.filter(t => t.status === "open" || t.status === "waiting_for_seller" || t.status === "waiting_for_client" || t.status === "in_progress").length})
                      </TabsTrigger>
                      <TabsTrigger value="vault-network">
                        Vault Network ({tickets.filter(t => t.needs_vault_help).length})
                      </TabsTrigger>
                      <TabsTrigger value="resolved">
                        Resolved/Closed ({tickets.filter(t => t.status === "resolved" || t.status === "closed").length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="open">
                      <div className="space-y-4">
                        {tickets.filter(t => t.status === "open" || t.status === "waiting_for_seller" || t.status === "waiting_for_client" || t.status === "in_progress").length === 0 ? (
                          <p className="text-sm text-muted-foreground">No open tickets</p>
                        ) : (
                          tickets
                            .filter(t => t.status === "open" || t.status === "waiting_for_seller" || t.status === "waiting_for_client" || t.status === "in_progress")
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((ticket) => (
                              <Card key={ticket.id} className="bg-muted/20 border-border">
                                <CardHeader>
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <CardTitle className="text-lg">{ticket.title}</CardTitle>
                                        <Badge variant={
                                          ticket.status === "open" ? "default" :
                                          ticket.status === "waiting_for_seller" ? "secondary" :
                                          ticket.status === "waiting_for_client" ? "secondary" : "outline"
                                        }>
                                          {ticket.status === "open" ? "Open" :
                                           ticket.status === "waiting_for_seller" ? "Waiting for Partner" :
                                           ticket.status === "waiting_for_client" ? "Waiting for Client" :
                                           ticket.status === "in_progress" ? "In Progress" : ticket.status}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-1">
                                        Client: {ticket.client?.business_name || "Unknown"} • Partner: {ticket.seller?.business_name || "The Vault Network"}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                                      </p>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-foreground mb-4 whitespace-pre-wrap">{ticket.description}</p>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => openTicketChat(ticket)}
                                      variant="outline"
                                      size="sm"
                                    >
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      View & Reply
                                    </Button>
                                    <Select value={ticket.status} onValueChange={(value) => updateTicketStatus(ticket.id, value)}>
                                      <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="waiting_for_client">Waiting for Client</SelectItem>
                                        <SelectItem value="waiting_for_seller">Waiting for Partner</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="vault-network">
                      <div className="space-y-4">
                        {tickets.filter(t => t.needs_vault_help).length === 0 ? (
                          <p className="text-sm text-muted-foreground">No tickets in Vault Network queue</p>
                        ) : (
                          tickets
                            .filter(t => t.needs_vault_help)
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((ticket) => (
                              <Card key={ticket.id} className="bg-muted/20 border-border border-primary/50">
                                <CardHeader>
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <CardTitle className="text-lg">{ticket.title}</CardTitle>
                                        <Badge variant="destructive" className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">
                                          Vault Network
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-1">
                                        Client: {ticket.client?.business_name || "Unknown"} • Partner: {ticket.seller?.business_name || "The Vault Network"}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                                      </p>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-foreground mb-4 whitespace-pre-wrap">{ticket.description}</p>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => openTicketChat(ticket)}
                                      variant="outline"
                                      size="sm"
                                    >
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      View & Reply
                                    </Button>
                                    <Select value={ticket.status} onValueChange={(value) => updateTicketStatus(ticket.id, value)}>
                                      <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="resolved">
                      <div className="space-y-4">
                        {tickets.filter(t => t.status === "resolved" || t.status === "closed").length === 0 ? (
                          <p className="text-sm text-muted-foreground">No resolved tickets</p>
                        ) : (
                          tickets
                            .filter(t => t.status === "resolved" || t.status === "closed")
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((ticket) => (
                              <Card key={ticket.id} className="bg-muted/20 border-border opacity-75">
                                <CardHeader>
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <CardTitle className="text-lg">{ticket.title}</CardTitle>
                                      <Badge variant="outline" className="mt-2">
                                        {ticket.status === "resolved" ? "Resolved" : "Closed"}
                                      </Badge>
                                      <p className="text-sm text-muted-foreground mt-2">
                                        Client: {ticket.client?.business_name || "Unknown"} • Partner: {ticket.seller?.business_name || "The Vault Network"}
                                      </p>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-foreground mb-2 whitespace-pre-wrap">{ticket.description}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {ticket.status === "resolved" ? "Resolved" : "Closed"} {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                                  </p>
                                </CardContent>
                              </Card>
                            ))
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                <TabsContent value="seller-messages">
                  <Tabs defaultValue="open" className="w-full">
                    <TabsList className="mb-6">
                      <TabsTrigger value="open">
                        Open ({sellerMessages.filter(m => m.status === "open").length})
                      </TabsTrigger>
                      <TabsTrigger value="in-progress">
                        In Progress ({sellerMessages.filter(m => m.status === "in_progress").length})
                      </TabsTrigger>
                      <TabsTrigger value="resolved">
                        Resolved/Closed ({sellerMessages.filter(m => m.status === "resolved" || m.status === "closed").length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="open">
                      <div className="space-y-4">
                        {sellerMessages.filter(m => m.status === "open").length === 0 ? (
                          <p className="text-sm text-muted-foreground">No open messages</p>
                        ) : (
                          sellerMessages
                            .filter(m => m.status === "open")
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((message) => (
                              <Card key={message.id} className="bg-muted/20 border-border">
                                <CardHeader>
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <CardTitle className="text-lg">{message.subject}</CardTitle>
                                      <Badge variant="default" className="mt-2">Open</Badge>
                                      <p className="text-sm text-muted-foreground mt-2">
                                        From: {message.seller?.business_name || "Unknown Partner"}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
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
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => openSellerMessage(message)}
                                      variant="outline"
                                      size="sm"
                                    >
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      View & Reply
                                    </Button>
                                    <Select value={message.status} onValueChange={(value) => updateSellerMessageStatus(message.id, value)}>
                                      <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="in-progress">
                      <div className="space-y-4">
                        {sellerMessages.filter(m => m.status === "in_progress").length === 0 ? (
                          <p className="text-sm text-muted-foreground">No messages in progress</p>
                        ) : (
                          sellerMessages
                            .filter(m => m.status === "in_progress")
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((message) => (
                              <Card key={message.id} className="bg-muted/20 border-border">
                                <CardHeader>
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <CardTitle className="text-lg">{message.subject}</CardTitle>
                                      <Badge variant="secondary" className="mt-2">In Progress</Badge>
                                      <p className="text-sm text-muted-foreground mt-2">
                                        From: {message.seller?.business_name || "Unknown Partner"}
                                      </p>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-foreground mb-4 whitespace-pre-wrap">{message.message}</p>
                                  <Button
                                    onClick={() => openSellerMessage(message)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    View & Reply
                                  </Button>
                                </CardContent>
                              </Card>
                            ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="resolved">
                      <div className="space-y-4">
                        {sellerMessages.filter(m => m.status === "resolved" || m.status === "closed").length === 0 ? (
                          <p className="text-sm text-muted-foreground">No resolved messages</p>
                        ) : (
                          sellerMessages
                            .filter(m => m.status === "resolved" || m.status === "closed")
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((message) => (
                              <Card key={message.id} className="bg-muted/20 border-border opacity-75">
                                <CardHeader>
                                  <CardTitle className="text-lg">{message.subject}</CardTitle>
                                  <Badge variant="outline" className="mt-2">
                                    {message.status === "resolved" ? "Resolved" : "Closed"}
                                  </Badge>
                                  <p className="text-sm text-muted-foreground mt-2">
                                    From: {message.seller?.business_name || "Unknown Partner"}
                                  </p>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-foreground mb-2 whitespace-pre-wrap">{message.message}</p>
                                </CardContent>
                              </Card>
                            ))
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                <TabsContent value="enquiries">
                  <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="mb-6">
                      <TabsTrigger value="pending">
                        New/Pending ({enquiries.filter(e => e.status === "new" || e.status === "contacted").length})
                      </TabsTrigger>
                      <TabsTrigger value="closed">
                        Closed/Dealt With ({enquiries.filter(e => e.status === "closed" || e.status === "converted").length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending">
                      <div className="space-y-6">
                        {/* Registered Account Enquiries */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-foreground">
                            From Registered Accounts ({enquiries.filter(e => e.client_id && (e.status === "new" || e.status === "contacted")).length})
                          </h3>
                          {enquiries.filter(e => e.client_id && (e.status === "new" || e.status === "contacted")).length === 0 ? (
                            <p className="text-sm text-muted-foreground mb-4">No pending enquiries from registered accounts</p>
                          ) : (
                            <div className="space-y-4 mb-6">
                              {enquiries
                                .filter(e => e.client_id && (e.status === "new" || e.status === "contacted"))
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map((enquiry) => (
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
                            From Website Visitors ({enquiries.filter(e => !e.client_id && (e.status === "new" || e.status === "contacted")).length})
                          </h3>
                          {enquiries.filter(e => !e.client_id && (e.status === "new" || e.status === "contacted")).length === 0 ? (
                            <p className="text-sm text-muted-foreground">No pending enquiries from website visitors</p>
                          ) : (
                            <div className="space-y-4">
                              {enquiries
                                .filter(e => !e.client_id && (e.status === "new" || e.status === "contacted"))
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map((enquiry) => (
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

                    <TabsContent value="closed">
                      <div className="space-y-6">
                        {/* Closed Registered Account Enquiries */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-foreground">
                            From Registered Accounts ({enquiries.filter(e => e.client_id && (e.status === "closed" || e.status === "converted")).length})
                          </h3>
                          {enquiries.filter(e => e.client_id && (e.status === "closed" || e.status === "converted")).length === 0 ? (
                            <p className="text-sm text-muted-foreground mb-4">No closed enquiries from registered accounts</p>
                          ) : (
                            <div className="space-y-4 mb-6">
                              {enquiries
                                .filter(e => e.client_id && (e.status === "closed" || e.status === "converted"))
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map((enquiry) => (
                                  <Card key={enquiry.id} className="bg-muted/20 opacity-75">
                                    <CardHeader>
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <CardTitle className="text-lg">{enquiry.business_name}</CardTitle>
                                          <CardDescription>
                                            {enquiry.contact_name} • {enquiry.email}
                                          </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                          <Badge variant="outline">
                                            {enquiry.status}
                                          </Badge>
                                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                            Registered
                                          </Badge>
                                        </div>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-foreground mb-2">{enquiry.message}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Closed: {new Date(enquiry.created_at).toLocaleDateString()}
                                      </p>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Closed Non-Registered Enquiries */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-foreground">
                            From Website Visitors ({enquiries.filter(e => !e.client_id && (e.status === "closed" || e.status === "converted")).length})
                          </h3>
                          {enquiries.filter(e => !e.client_id && (e.status === "closed" || e.status === "converted")).length === 0 ? (
                            <p className="text-sm text-muted-foreground">No closed enquiries from website visitors</p>
                          ) : (
                            <div className="space-y-4">
                              {enquiries
                                .filter(e => !e.client_id && (e.status === "closed" || e.status === "converted"))
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map((enquiry) => (
                                  <Card key={enquiry.id} className="bg-muted/20 opacity-75">
                                    <CardHeader>
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <CardTitle className="text-lg">{enquiry.business_name}</CardTitle>
                                          <CardDescription>
                                            {enquiry.contact_name} • {enquiry.email}
                                          </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                          <Badge variant="outline">
                                            {enquiry.status}
                                          </Badge>
                                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                                            Visitor
                                          </Badge>
                                        </div>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-foreground mb-2">{enquiry.message}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Closed: {new Date(enquiry.created_at).toLocaleDateString()}
                                      </p>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                <TabsContent value="xp-management">
                  <div className="space-y-6">
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Give XP to Partner
                      </CardTitle>
                      <CardDescription>
                        Grant experience points to any partner. This will update their XP total and may trigger a rank up.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="seller-select">Select Partner</Label>
                          <Popover open={xpSellerSearchOpen} onOpenChange={setXpSellerSearchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={xpSellerSearchOpen}
                                className="w-full justify-between"
                              >
                                {selectedSellerForXP
                                  ? sellers.find(s => s.id === selectedSellerForXP)?.business_name
                                  : "Choose a partner..."}
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search partners..." />
                                <CommandList>
                                  <CommandEmpty>No partner found.</CommandEmpty>
                                  <CommandGroup>
                                    {sellers.map((seller) => (
                                      <CommandItem
                                        key={seller.id}
                                        value={seller.business_name}
                                        onSelect={() => {
                                          setSelectedSellerForXP(seller.id === selectedSellerForXP ? "" : seller.id);
                                          setXpSellerSearchOpen(false);
                                        }}
                                      >
                                        <CheckCircle
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedSellerForXP === seller.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span>{seller.business_name}</span>
                                          {seller.current_xp !== undefined && (
                                            <span className="text-xs text-muted-foreground">
                                              Current XP: {seller.current_xp} • Rank: {seller.current_rank || 'Recruit'}
                                            </span>
                                          )}
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          {selectedSellerForXP && (
                            <div className="text-sm text-muted-foreground">
                              {(() => {
                                const seller = sellers.find(s => s.id === selectedSellerForXP);
                                return seller && seller.current_xp !== undefined ? (
                                  <span>
                                    Current: {seller.current_xp} XP • Rank: {seller.current_rank || 'Recruit'}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="xp-amount">XP Amount</Label>
                          <Input
                            id="xp-amount"
                            type="number"
                            min="1"
                            placeholder="Enter XP amount"
                            value={xpAmount}
                            onChange={(e) => setXpAmount(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter the amount of XP to grant. This will be added to their current total.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="xp-description">Description (Optional)</Label>
                          <Textarea
                            id="xp-description"
                            placeholder="Reason for granting XP (e.g., 'Bonus for exceptional performance')"
                            value={xpDescription}
                            onChange={(e) => setXpDescription(e.target.value)}
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground">
                            This description will be logged in the partner's activity log.
                          </p>
                        </div>

                        <Button
                          onClick={handleGiveXP}
                          disabled={givingXP || !selectedSellerForXP || !xpAmount}
                          className="w-full"
                        >
                          {givingXP ? (
                            <>
                              <Activity className="mr-2 h-4 w-4 animate-spin" />
                              Granting XP...
                            </>
                          ) : (
                            <>
                              <Trophy className="mr-2 h-4 w-4" />
                              Grant XP
                            </>
                          )}
                        </Button>
                      </div>

                      {selectedSellerForXP && (() => {
                        const seller = sellers.find(s => s.id === selectedSellerForXP);
                        if (!seller || seller.current_xp === undefined) return null;
                        const currentXP = seller.current_xp;
                        const newXP = currentXP + (parseInt(xpAmount) || 0);
                        return (
                          <Card className="bg-muted/20">
                            <CardContent className="pt-6">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Current XP:</span>
                                  <span className="font-semibold">{currentXP}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">XP to Add:</span>
                                  <span className="font-semibold text-primary">+{xpAmount || 0}</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between items-center">
                                  <span className="text-sm font-medium">New Total:</span>
                                  <span className="font-bold text-lg">{newXP}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Testing: Add Login Days */}
                  <Card className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-500">
                        <Zap className="w-5 h-5" />
                        Testing: Add Login Days
                      </CardTitle>
                      <CardDescription>
                        For testing purposes only. Manually add login days to a partner's account. This will help test the "Log In on 2 Different Days" task and login streak tracking.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-days-seller-select">Select Partner</Label>
                          <Popover open={false}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                                onClick={() => {
                                  // Use the same seller selector as XP management
                                  setSelectedSellerForLoginDays(selectedSellerForXP || "");
                                }}
                              >
                                {selectedSellerForLoginDays
                                  ? sellers.find(s => s.id === selectedSellerForLoginDays)?.business_name
                                  : selectedSellerForXP
                                    ? sellers.find(s => s.id === selectedSellerForXP)?.business_name
                                    : "Choose a partner..."}
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                          </Popover>
                          <p className="text-xs text-muted-foreground">
                            Tip: Select a partner from the "Give XP to Partner" section above, or use the dropdown.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="login-day-date">Login Date</Label>
                          <Input
                            id="login-day-date"
                            type="date"
                            value={loginDayDate}
                            onChange={(e) => setLoginDayDate(e.target.value)}
                            className="w-full"
                          />
                          <p className="text-xs text-muted-foreground">
                            Select the date to add as a login day. Defaults to today.
                          </p>
                        </div>

                        <Button
                          onClick={async () => {
                            const sellerId = selectedSellerForLoginDays || selectedSellerForXP;
                            if (!sellerId) {
                              toast({
                                title: "Partner Required",
                                description: "Please select a partner first.",
                                variant: "destructive",
                              });
                              return;
                            }

                            if (!loginDayDate) {
                              toast({
                                title: "Date Required",
                                description: "Please select a date.",
                                variant: "destructive",
                              });
                              return;
                            }

                            setAddingLoginDay(true);
                            try {
                              // Check if login day already exists for this date
                              const { data: existing } = await supabase
                                .from("partner_activity_log")
                                .select("id")
                                .eq("seller_id", sellerId)
                                .eq("event_type", "login_day")
                                .eq("metadata->>login_date", loginDayDate)
                                .maybeSingle();

                              if (existing) {
                                toast({
                                  title: "Login Day Already Exists",
                                  description: `This partner already has a login day recorded for ${loginDayDate}.`,
                                  variant: "destructive",
                                });
                                setAddingLoginDay(false);
                                return;
                              }

                              // Add login day entry
                              const { error } = await supabase.from("partner_activity_log").insert({
                                seller_id: sellerId,
                                event_type: "login_day",
                                xp_value: 0,
                                description: `Admin test: Logged in on ${loginDayDate}`,
                                metadata: { 
                                  login_date: loginDayDate,
                                  admin_test: true,
                                  added_by: user?.id
                                }
                              });

                              if (error) throw error;

                              toast({
                                title: "Login Day Added!",
                                description: `Successfully added login day ${loginDayDate} for ${sellers.find(s => s.id === sellerId)?.business_name || 'partner'}.`,
                              });

                              // Fetch current login days count
                              const { data: loginDays } = await supabase
                                .from("partner_activity_log")
                                .select("metadata")
                                .eq("seller_id", sellerId)
                                .eq("event_type", "login_day");

                              if (loginDays) {
                                const uniqueDates = new Set(
                                  loginDays.map((log: any) => log.metadata?.login_date).filter(Boolean)
                                );
                                const sortedDates = Array.from(uniqueDates).sort().reverse();
                                setLoginDaysData({ count: uniqueDates.size, dates: sortedDates });
                                toast({
                                  title: "Login Days Count",
                                  description: `This partner now has ${uniqueDates.size} unique login day(s).`,
                                });
                              }

                              // Reset date to today for next entry
                              setLoginDayDate(new Date().toISOString().split('T')[0]);
                            } catch (error: any) {
                              console.error("Error adding login day:", error);
                              toast({
                                title: "Error",
                                description: error.message || "Failed to add login day.",
                                variant: "destructive",
                              });
                            } finally {
                              setAddingLoginDay(false);
                            }
                          }}
                          disabled={addingLoginDay || (!selectedSellerForLoginDays && !selectedSellerForXP)}
                          className="w-full"
                        >
                          {addingLoginDay ? (
                            <>
                              <Activity className="mr-2 h-4 w-4 animate-spin" />
                              Adding Login Day...
                            </>
                          ) : (
                            <>
                              <Zap className="mr-2 h-4 w-4" />
                              Add Login Day
                            </>
                          )}
                        </Button>
                      </div>

                      {(selectedSellerForLoginDays || selectedSellerForXP) && loginDaysData && (
                        <Card className="bg-muted/20">
                          <CardContent className="pt-6">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Total Login Days:</span>
                                <span className="font-semibold">{loginDaysData.count}</span>
                              </div>
                              {loginDaysData.dates.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                  <p className="text-xs text-muted-foreground mb-2">Login Dates:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {loginDaysData.dates.slice(0, 10).map((date: string) => (
                                      <Badge key={date} variant="secondary" className="text-xs">
                                        {date}
                                      </Badge>
                                    ))}
                                    {loginDaysData.dates.length > 10 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{loginDaysData.dates.length - 10} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </CardContent>
                  </Card>

                  {/* Testing: Bypass to Verified */}
                  <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-primary">
                        <Zap className="w-5 h-5" />
                        Testing: Bypass to Verified
                      </CardTitle>
                      <CardDescription>
                        For testing purposes only. This will set a partner to Verified rank, complete all tasks, and set XP to 7000. They will see the Partner Pro popup on their next dashboard visit.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong className="text-primary">Selected Partner:</strong>{' '}
                          {selectedSellerForXP ? (
                            <span className="text-foreground">
                              {sellers.find(s => s.id === selectedSellerForXP)?.business_name || 'Unknown'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Select a partner from above</span>
                          )}
                        </p>
                        {selectedSellerForXP && (
                          <div className="text-xs text-muted-foreground space-y-1 mt-2">
                            <p>• Will be set to <strong className="text-primary">Verified</strong> rank</p>
                            <p>• XP will be set to <strong className="text-primary">7000</strong> (if below threshold)</p>
                            <p>• All <strong className="text-primary">12 tasks</strong> will be auto-completed</p>
                            <p>• Commission rate will be set to <strong className="text-primary">40%</strong></p>
                            <p>• Partner Pro popup will appear on next dashboard visit</p>
                          </div>
                        )}
                      </div>
                      {selectedSellerForXP && (() => {
                        const seller = sellers.find(s => s.id === selectedSellerForXP);
                        if (!seller) return null;
                        const currentRank = seller.current_rank as PartnerRank;
                        const nextRank = getNextRank(currentRank);
                        const previousRank = getPreviousRank(currentRank);
                        const nextRankInfo = nextRank ? getRankInfo(nextRank) : null;
                        const previousRankInfo = previousRank ? getRankInfo(previousRank) : null;
                        const requiredTasks = nextRank ? getTasksForRank(nextRank) : [];
                        return (
                          <>
                            {nextRank && (
                              <Card className="bg-muted/20 mb-3">
                                <CardContent className="pt-6">
                                  <div className="space-y-2 text-sm">
                                    <p className="font-semibold text-primary">Advance to Next Rank</p>
                                    <p className="text-muted-foreground">
                                      This will advance <strong>{seller.business_name}</strong> from <strong>{currentRank}</strong> to <strong>{nextRank}</strong>
                                    </p>
                                    <div className="space-y-1 text-xs text-muted-foreground">
                                      <p>• All <strong className="text-primary">{requiredTasks.length} required tasks</strong> will be auto-completed</p>
                                      <p>• XP will be set to <strong className="text-primary">{nextRankInfo?.xpThreshold}</strong> (if below threshold)</p>
                                      <p>• Commission rate will be set to <strong className="text-primary">{nextRankInfo?.commissionRate}%</strong></p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            {previousRank && (
                              <Card className="bg-muted/20 mb-3 border-destructive/20">
                                <CardContent className="pt-6">
                                  <div className="space-y-2 text-sm">
                                    <p className="font-semibold text-destructive">Demote to Previous Rank</p>
                                    <p className="text-muted-foreground">
                                      This will demote <strong>{seller.business_name}</strong> from <strong>{currentRank}</strong> to <strong>{previousRank}</strong>
                                    </p>
                                    <div className="space-y-1 text-xs text-muted-foreground">
                                      <p>• Commission rate will be set to <strong className="text-destructive">{previousRankInfo?.commissionRate}%</strong></p>
                                      <p>• They will need to <strong className="text-destructive">manually rank up</strong> again unless you promote them</p>
                                      <p>• Their <strong>highest rank achievement</strong> will be preserved</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </>
                        );
                      })()}
                      <div className="flex gap-2 mb-3">
                        <Button
                          onClick={handleAdvanceToNextRank}
                          disabled={advancingRank || demotingRank || !selectedSellerForXP}
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                          variant="default"
                        >
                          {advancingRank ? (
                            <>
                              <Activity className="w-4 h-4 mr-2 animate-spin" />
                              Advancing...
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Advance Rank
                            </>
                          )}
                        </Button>
                        {selectedSellerForXP && (() => {
                          const seller = sellers.find(s => s.id === selectedSellerForXP);
                          if (!seller) return null;
                          const currentRank = seller.current_rank as PartnerRank;
                          const previousRank = getPreviousRank(currentRank);
                          if (!previousRank) return null;
                          return (
                            <Button
                              onClick={handleDemoteRank}
                              disabled={advancingRank || demotingRank || !selectedSellerForXP}
                              className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              variant="default"
                            >
                              {demotingRank ? (
                                <>
                                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                                  Demoting...
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="w-4 h-4 mr-2" />
                                  Demote Rank
                                </>
                              )}
                            </Button>
                          );
                        })()}
                      </div>

                      {/* Set to Specific Rank */}
                      <Card className="bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/20 mt-4">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-secondary-foreground">
                            <UserCog className="w-5 h-5" />
                            Set to Specific Rank
                          </CardTitle>
                          <CardDescription>
                            Set a partner's rank directly to any rank. This will complete all required tasks and set XP to the appropriate threshold.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {selectedSellerForXP && (() => {
                            const seller = sellers.find(s => s.id === selectedSellerForXP);
                            if (!seller) return null;
                            const currentRank = seller.current_rank as PartnerRank;
                            return (
                              <div className="space-y-3">
                                <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
                                  <p className="text-sm text-muted-foreground mb-2">
                                    <strong className="text-secondary-foreground">Selected Partner:</strong>{' '}
                                    <span className="text-foreground">{seller.business_name}</span>
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    <strong className="text-secondary-foreground">Current Rank:</strong>{' '}
                                    <span className="text-foreground">{currentRank}</span>
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="target-rank">Target Rank</Label>
                                  <Select
                                    value={selectedTargetRank}
                                    onValueChange={(value) => setSelectedTargetRank(value as PartnerRank)}
                                    disabled={settingRank}
                                  >
                                    <SelectTrigger id="target-rank">
                                      <SelectValue placeholder="Select target rank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Recruit">Recruit</SelectItem>
                                      <SelectItem value="Recruit Plus">Recruit Plus</SelectItem>
                                      <SelectItem value="Apprentice">Apprentice</SelectItem>
                                      <SelectItem value="Apprentice Plus">Apprentice Plus</SelectItem>
                                      <SelectItem value="Agent">Agent</SelectItem>
                                      <SelectItem value="Agent Plus">Agent Plus</SelectItem>
                                      <SelectItem value="Verified">Verified</SelectItem>
                                      <SelectItem value="Verified Plus">Verified Plus</SelectItem>
                                      <SelectItem value="Partner">Partner</SelectItem>
                                      <SelectItem value="Partner Plus">Partner Plus</SelectItem>
                                      <SelectItem value="Partner Pro">Partner Pro</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {selectedTargetRank && selectedTargetRank !== currentRank && (() => {
                                  const targetRankInfo = getRankInfo(selectedTargetRank as PartnerRank);
                                  const targetRankTasks = getTasksForRank(selectedTargetRank as PartnerRank);
                                  return (
                                    <Card className="bg-muted/20">
                                      <CardContent className="pt-6">
                                        <div className="space-y-2 text-sm">
                                          <p className="font-semibold text-secondary-foreground">Rank Change Preview</p>
                                          <p className="text-muted-foreground">
                                            This will set <strong>{seller.business_name}</strong> from <strong>{currentRank}</strong> to <strong>{selectedTargetRank}</strong>
                                          </p>
                                          <div className="space-y-1 text-xs text-muted-foreground">
                                            <p>• All <strong className="text-secondary-foreground">{targetRankTasks.length} required tasks</strong> will be auto-completed</p>
                                            <p>• XP will be set to <strong className="text-secondary-foreground">{targetRankInfo.xpThreshold}</strong> (if below threshold)</p>
                                            <p>• Commission rate will be set to <strong className="text-secondary-foreground">{targetRankInfo.commissionRate}%</strong></p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })()}
                                <Button
                                  onClick={handleSetRank}
                                  disabled={settingRank || !selectedSellerForXP || !selectedTargetRank || selectedTargetRank === (seller?.current_rank as PartnerRank)}
                                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                                  variant="default"
                                >
                                  {settingRank ? (
                                    <>
                                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                                      Setting Rank...
                                    </>
                                  ) : (
                                    <>
                                      <UserCog className="w-4 h-4 mr-2" />
                                      Set to {selectedTargetRank || "Selected Rank"}
                                    </>
                                  )}
                                </Button>
                              </div>
                            );
                          })()}
                          {!selectedSellerForXP && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Select a partner from above to set their rank
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      <Button
                        onClick={handleBypassToVerified}
                        disabled={bypassingToVerified || !selectedSellerForXP}
                        className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground mt-4"
                        variant="default"
                      >
                        {bypassingToVerified ? (
                          <>
                            <Activity className="w-4 h-4 mr-2 animate-spin" />
                            Bypassing Progression...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Bypass to Verified Rank
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                  </div>
                </TabsContent>

                <TabsContent value="modules">
                  <div className="space-y-6">
                    {/* Create Module Token */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          Create Module Access Link
                        </CardTitle>
                        <CardDescription>
                          Create a shareable link for learners to access a module through Discord
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Step 1: Module ID and Basic Info */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-foreground">Step 1: Module Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="module-id">Module ID *</Label>
                              <Input
                                id="module-id"
                                placeholder="module-1-foundations"
                                value={newModuleToken.module_id}
                                onChange={(e) => {
                                  setNewModuleToken({ ...newModuleToken, module_id: e.target.value });
                                  setSelectedModuleForImages(e.target.value);
                                }}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="module-title">Module Title *</Label>
                              <Input
                                id="module-title"
                                placeholder="Module 1: Foundations of Business Automation"
                                value={newModuleToken.module_title}
                                onChange={(e) => setNewModuleToken({ ...newModuleToken, module_title: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="module-description">Description</Label>
                            <Textarea
                              id="module-description"
                              placeholder="Learn how automation saves time, reduces errors..."
                              value={newModuleToken.module_description}
                              onChange={(e) => setNewModuleToken({ ...newModuleToken, module_description: e.target.value })}
                              rows={2}
                            />
                          </div>
                        </div>

                        {/* Step 2: Image Upload */}
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="text-sm font-semibold text-foreground">Step 2: Upload Images (Optional)</h3>
                          <p className="text-xs text-muted-foreground">
                            Upload images for this module. You'll get vaultnet.work URLs to use in your HTML code.
                          </p>
                          
                          {newModuleToken.module_id ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length > 0 && newModuleToken.module_id) {
                                      handleMultipleImageUpload(files, newModuleToken.module_id);
                                    }
                                    // Reset input
                                    e.target.value = '';
                                  }}
                                  disabled={uploadingImage}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={uploadingImage || !newModuleToken.module_id}
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.multiple = true;
                                    input.onchange = (e: any) => {
                                      const files = Array.from(e.target.files || []);
                                      if (files.length > 0 && newModuleToken.module_id) {
                                        handleMultipleImageUpload(files, newModuleToken.module_id);
                                      }
                                    };
                                    input.click();
                                  }}
                                >
                                  {uploadingImage ? (
                                    <>
                                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4 mr-2" />
                                      Upload Multiple
                                    </>
                                  )}
                                </Button>
                              </div>
                              {uploadingImage && (
                                <p className="text-xs text-muted-foreground italic">
                                  Uploading images... Please wait.
                                </p>
                              )}

                              {moduleImages.length > 0 && (
                                <div className="space-y-2">
                                  <Label>Uploaded Images:</Label>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {moduleImages.map((img, idx) => (
                                      <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                        <ImageIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium truncate">{img.filename}</p>
                                          <Input
                                            value={img.url}
                                            readOnly
                                            className="text-xs font-mono mt-1"
                                            onClick={(e) => (e.target as HTMLInputElement).select()}
                                          />
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            navigator.clipboard.writeText(img.url);
                                            toast({
                                              title: "Copied!",
                                              description: "Image URL copied to clipboard",
                                            });
                                          }}
                                        >
                                          <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setModuleImages(prev => prev.filter((_, i) => i !== idx));
                                          }}
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              Enter a Module ID first to upload images
                            </p>
                          )}
                        </div>

                        {/* Step 3: HTML Content */}
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="text-sm font-semibold text-foreground">Step 3: Paste HTML Content *</h3>
                          <div className="space-y-2">
                            <Label htmlFor="module-html">HTML Content</Label>
                            <Textarea
                              id="module-html"
                              placeholder="Paste the HTML content from your module file (body content)"
                              value={newModuleToken.module_content_html}
                              onChange={(e) => {
                                setNewModuleToken({ ...newModuleToken, module_content_html: e.target.value });
                                // Extract styles if present
                                const htmlMatch = e.target.value.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
                                if (htmlMatch) {
                                  setModuleHTMLPreview(htmlMatch[1]);
                                }
                              }}
                              rows={12}
                              className="font-mono text-xs"
                            />
                            <p className="text-xs text-muted-foreground">
                              Paste the full HTML body content from your module file. Use the image URLs from Step 2 in your HTML.
                            </p>
                          </div>
                        </div>

                        {/* Step 4: Assign Quiz (Optional) */}
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="text-sm font-semibold text-foreground">Step 4: Assign Quiz (Optional)</h3>
                          <div className="space-y-2">
                            <Label htmlFor="quiz-link-select">Select Quiz Link</Label>
                            <div className="space-y-2">
                              <Select
                                value={newModuleToken.quiz_link ? newModuleToken.quiz_link.split('token=')[1] : "none"}
                                onValueChange={(tokenValue) => {
                                  if (tokenValue && tokenValue !== "none") {
                                    const quizLink = `${window.location.origin}/quiz?token=${tokenValue}`;
                                    setNewModuleToken({ ...newModuleToken, quiz_link: quizLink });
                                  } else {
                                    setNewModuleToken({ ...newModuleToken, quiz_link: "" });
                                  }
                                }}
                              >
                                <SelectTrigger id="quiz-link-select">
                                  <SelectValue placeholder="Choose a quiz link (optional)..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None (No quiz)</SelectItem>
                                  {quizTokens.filter(t => t.is_active).map((token) => {
                                    const quiz = token.quizzes as any;
                                    const isExpired = token.expires_at && new Date(token.expires_at) < new Date();
                                    const isMaxedOut = token.max_uses && token.current_uses >= token.max_uses;
                                    return (
                                      <SelectItem 
                                        key={token.id} 
                                        value={token.token}
                                        disabled={isExpired || isMaxedOut}
                                      >
                                        {token.link_title || quiz?.title} {isExpired ? '(Expired)' : isMaxedOut ? '(Maxed Out)' : ''}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              {newModuleToken.quiz_link && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setNewModuleToken({ ...newModuleToken, quiz_link: "" })}
                                  className="text-xs"
                                >
                                  Clear Quiz Link
                                </Button>
                              )}
                            </div>
                            {newModuleToken.quiz_link && (
                              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                                <p className="text-xs font-medium text-foreground mb-1">Quiz Link:</p>
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={newModuleToken.quiz_link}
                                    readOnly
                                    className="text-xs font-mono flex-1"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(newModuleToken.quiz_link);
                                      toast({
                                        title: "Copied!",
                                        description: "Quiz link copied to clipboard",
                                      });
                                    }}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Add this link to your HTML as a button. Example: &lt;a href="{newModuleToken.quiz_link}"&gt;Take Quiz&lt;/a&gt;
                                </p>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Select a quiz link to assign to this module. You can add this link as a button in your HTML content.
                            </p>
                          </div>
                        </div>

                        {/* Step 5: Link Settings */}
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="text-sm font-semibold text-foreground">Step 5: Link Settings</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="expires-at">Expires At (Optional)</Label>
                              <Input
                                id="expires-at"
                                type="datetime-local"
                                value={newModuleToken.expires_at}
                                onChange={(e) => setNewModuleToken({ ...newModuleToken, expires_at: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="max-uses">Max Uses (Optional)</Label>
                              <Input
                                id="max-uses"
                                type="number"
                                min="1"
                                placeholder="Unlimited"
                                value={newModuleToken.max_uses}
                                onChange={(e) => setNewModuleToken({ ...newModuleToken, max_uses: e.target.value })}
                              />
                              <p className="text-xs text-muted-foreground">
                                Leave empty for unlimited uses
                              </p>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={handleCreateModuleToken}
                          disabled={creatingModule || !newModuleToken.module_id || !newModuleToken.module_title || !newModuleToken.module_content_html}
                          className="w-full"
                        >
                          {creatingModule ? (
                            <>
                              <Activity className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Create Module Access Link
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Existing Module Tokens */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Link2 className="w-5 h-5" />
                          Module Access Links
                        </CardTitle>
                        <CardDescription>
                          All active module access links. Share these in Discord for learners.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingModules ? (
                          <div className="text-center py-8">
                            <Activity className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                            <p className="text-muted-foreground">Loading module links...</p>
                          </div>
                        ) : moduleTokens.length === 0 ? (
                          <div className="text-center py-8">
                            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground">No module links created yet</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Create your first module access link above
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {moduleTokens.map((token) => {
                              const shareLink = `${window.location.origin}/learner-dashboard?token=${token.token}`;
                              const isExpired = token.expires_at && new Date(token.expires_at) < new Date();
                              const isMaxedOut = token.max_uses && token.current_uses >= token.max_uses;
                              
                              return (
                                <Card key={token.id} className={!token.is_active || isExpired || isMaxedOut ? "opacity-60" : ""}>
                                  <CardContent className="pt-6">
                                    <div className="space-y-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <h4 className="font-semibold text-lg">{token.module_title}</h4>
                                          {token.module_description && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                              {token.module_description}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span>ID: {token.module_id}</span>
                                            <span>•</span>
                                            <span>Uses: {token.current_uses}{token.max_uses ? ` / ${token.max_uses}` : ''}</span>
                                            {token.expires_at && (
                                              <>
                                                <span>•</span>
                                                <span>
                                                  {isExpired ? 'Expired' : `Expires: ${new Date(token.expires_at).toLocaleDateString()}`}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        <Badge variant={token.is_active && !isExpired && !isMaxedOut ? "default" : "secondary"}>
                                          {!token.is_active ? "Inactive" : isExpired ? "Expired" : isMaxedOut ? "Maxed Out" : "Active"}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2 pt-2 border-t">
                                        <Input
                                          value={shareLink}
                                          readOnly
                                          className="flex-1 font-mono text-xs"
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            navigator.clipboard.writeText(shareLink);
                                            toast({
                                              title: "Copied!",
                                              description: "Link copied to clipboard",
                                            });
                                          }}
                                        >
                                          <Copy className="w-4 h-4 mr-2" />
                                          Copy Link
                                        </Button>
                                        <Button
                                          variant="default"
                                          size="sm"
                                          onClick={() => handleSendDiscordNotification(token)}
                                          disabled={sendingDiscordNotification === token.id || !token.is_active || isExpired || isMaxedOut}
                                          className="bg-[#f5c84c] hover:bg-[#f5c84c]/90 text-[#111111]"
                                        >
                                          {sendingDiscordNotification === token.id ? (
                                            <>
                                              <Activity className="w-4 h-4 mr-2 animate-spin" />
                                              Sending...
                                            </>
                                          ) : (
                                            <>
                                              <MessageSquare className="w-4 h-4 mr-2" />
                                              Send to Discord
                                            </>
                                          )}
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => handleDeleteModuleToken(token.id)}
                                          disabled={deletingModuleToken === token.id}
                                        >
                                          {deletingModuleToken === token.id ? (
                                            <>
                                              <Activity className="w-4 h-4 mr-2 animate-spin" />
                                              Deleting...
                                            </>
                                          ) : (
                                            <>
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Delete
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="quizzes">
                  <div className="space-y-6">
                    {/* Create Quiz Link */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <HelpCircle className="w-5 h-5" />
                          Create Quiz Access Link
                        </CardTitle>
                        <CardDescription>
                          Create a shareable link for learners to take a quiz
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="quiz-select">Select Quiz *</Label>
                          <Select
                            value={newQuizToken.quiz_id}
                            onValueChange={(value) => {
                              const selectedQuiz = quizzes.find(q => q.id === value);
                              setNewQuizToken({ 
                                ...newQuizToken, 
                                quiz_id: value,
                                link_title: selectedQuiz?.title || ""
                              });
                            }}
                          >
                            <SelectTrigger id="quiz-select">
                              <SelectValue placeholder="Choose a quiz..." />
                            </SelectTrigger>
                            <SelectContent>
                              {quizzes.filter(q => q.is_active).map((quiz) => (
                                <SelectItem key={quiz.id} value={quiz.id}>
                                  {quiz.title} ({quiz.module_id || 'No module'})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {newQuizToken.quiz_id && (() => {
                            const selectedQuiz = quizzes.find(q => q.id === newQuizToken.quiz_id);
                            return selectedQuiz ? (
                              <p className="text-xs text-muted-foreground mt-1">
                                {selectedQuiz.description || 'No description'}
                              </p>
                            ) : null;
                          })()}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quiz-link-title">Link Title (Optional - defaults to quiz title)</Label>
                          <Input
                            id="quiz-link-title"
                            placeholder="Custom title for this shareable link"
                            value={newQuizToken.link_title}
                            onChange={(e) => setNewQuizToken({ ...newQuizToken, link_title: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="quiz-expires-at">Expires At (Optional)</Label>
                            <Input
                              id="quiz-expires-at"
                              type="datetime-local"
                              value={newQuizToken.expires_at}
                              onChange={(e) => setNewQuizToken({ ...newQuizToken, expires_at: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="quiz-max-uses">Max Uses (Optional)</Label>
                            <Input
                              id="quiz-max-uses"
                              type="number"
                              min="1"
                              placeholder="Unlimited"
                              value={newQuizToken.max_uses}
                              onChange={(e) => setNewQuizToken({ ...newQuizToken, max_uses: e.target.value })}
                            />
                          </div>
                        </div>
                        <Button
                          onClick={handleCreateQuizToken}
                          disabled={creatingQuizToken || !newQuizToken.quiz_id}
                          className="w-full"
                        >
                          {creatingQuizToken ? (
                            <>
                              <Activity className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Create Quiz Link
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Existing Quiz Links */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Link2 className="w-5 h-5" />
                          Quiz Access Links
                        </CardTitle>
                        <CardDescription>
                          All active quiz access links. Share these in your module HTML.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingQuizTokens ? (
                          <div className="text-center py-8">
                            <Activity className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                            <p className="text-muted-foreground">Loading quiz links...</p>
                          </div>
                        ) : quizTokens.length === 0 ? (
                          <div className="text-center py-8">
                            <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground">No quiz links created yet</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Create your first quiz link above
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {quizTokens.map((token) => {
                              const quizLink = `${window.location.origin}/quiz?token=${token.token}`;
                              const isExpired = token.expires_at && new Date(token.expires_at) < new Date();
                              const isMaxedOut = token.max_uses && token.current_uses >= token.max_uses;
                              const quiz = token.quizzes as any;
                              
                              return (
                                <Card key={token.id} className={!token.is_active || isExpired || isMaxedOut ? "opacity-60" : ""}>
                                  <CardContent className="pt-6">
                                    <div className="space-y-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <h4 className="font-semibold text-lg">{token.link_title || quiz?.title}</h4>
                                          {quiz?.description && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                              {quiz.description}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span>Quiz: {quiz?.title}</span>
                                            <span>•</span>
                                            <span>Uses: {token.current_uses}{token.max_uses ? ` / ${token.max_uses}` : ''}</span>
                                            {token.expires_at && (
                                              <>
                                                <span>•</span>
                                                <span>
                                                  {isExpired ? 'Expired' : `Expires: ${new Date(token.expires_at).toLocaleDateString()}`}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        <Badge variant={token.is_active && !isExpired && !isMaxedOut ? "default" : "secondary"}>
                                          {!token.is_active ? "Inactive" : isExpired ? "Expired" : isMaxedOut ? "Maxed Out" : "Active"}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2 pt-2 border-t">
                                        <Input
                                          value={quizLink}
                                          readOnly
                                          className="flex-1 font-mono text-xs"
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            navigator.clipboard.writeText(quizLink);
                                            toast({
                                              title: "Copied!",
                                              description: "Quiz link copied to clipboard",
                                            });
                                          }}
                                        >
                                          <Copy className="w-4 h-4 mr-2" />
                                          Copy Link
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => handleDeleteQuizToken(token.id)}
                                          disabled={deletingQuizToken === token.id}
                                        >
                                          {deletingQuizToken === token.id ? (
                                            <>
                                              <Activity className="w-4 h-4 mr-2 animate-spin" />
                                              Deleting...
                                            </>
                                          ) : (
                                            <>
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Delete
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Create New Quiz */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="w-5 h-5" />
                          Create New Quiz
                        </CardTitle>
                        <CardDescription>
                          Create a new quiz with questions. You can then create a shareable link for it.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <p className="text-sm text-foreground font-medium mb-2">📝 Quick Quiz Creation</p>
                          <p className="text-xs text-muted-foreground mb-3">
                            To create the "Foundations of Business Automation" quiz, run the SQL migration file:
                          </p>
                          <code className="text-xs bg-background p-2 rounded block">
                            supabase/migrations/create_foundations_quiz.sql
                          </code>
                          <p className="text-xs text-muted-foreground mt-3">
                            This will create the quiz with all 25 questions. Then you can create a shareable link above.
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="quiz-title">Quiz Title *</Label>
                              <Input
                                id="quiz-title"
                                placeholder="Foundations of Business Automation"
                                value={newQuiz.title}
                                onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="quiz-module-id">Module ID (Optional)</Label>
                              <Input
                                id="quiz-module-id"
                                placeholder="module-1-foundations"
                                value={newQuiz.module_id}
                                onChange={(e) => setNewQuiz({ ...newQuiz, module_id: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="quiz-desc">Description</Label>
                            <Textarea
                              id="quiz-desc"
                              placeholder="Test your knowledge of business automation..."
                              value={newQuiz.description}
                              onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                              rows={2}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="quiz-passing">Passing Score (%)</Label>
                              <Input
                                id="quiz-passing"
                                type="number"
                                min="0"
                                max="100"
                                value={newQuiz.passing_score}
                                onChange={(e) => setNewQuiz({ ...newQuiz, passing_score: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="quiz-time">Time Limit (minutes, optional)</Label>
                              <Input
                                id="quiz-time"
                                type="number"
                                min="1"
                                placeholder="No limit"
                                value={newQuiz.time_limit_minutes}
                                onChange={(e) => setNewQuiz({ ...newQuiz, time_limit_minutes: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="quiz-attempts">Max Attempts</Label>
                              <Input
                                id="quiz-attempts"
                                type="number"
                                min="1"
                                value={newQuiz.max_attempts}
                                onChange={(e) => setNewQuiz({ ...newQuiz, max_attempts: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm font-medium mb-2">Quiz Questions</p>
                          <p className="text-xs text-muted-foreground">
                            For now, quizzes are created via SQL migrations. Use the migration file provided above to create the Foundations quiz, or create your own migration following the same pattern.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Existing Quizzes */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          All Quizzes
                        </CardTitle>
                        <CardDescription>
                          View all created quizzes
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingQuizzes ? (
                          <div className="text-center py-8">
                            <Activity className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                            <p className="text-muted-foreground">Loading quizzes...</p>
                          </div>
                        ) : quizzes.length === 0 ? (
                          <div className="text-center py-8">
                            <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground">No quizzes created yet</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Create quizzes using SQL migrations or the form above
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {quizzes.map((quiz) => (
                              <Card key={quiz.id}>
                                <CardContent className="pt-6">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-lg">{quiz.title}</h4>
                                      {quiz.description && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {quiz.description}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                        <span>Module: {quiz.module_id || 'None'}</span>
                                        <span>•</span>
                                        <span>Passing: {quiz.passing_score}%</span>
                                        <span>•</span>
                                        <span>Max Attempts: {quiz.max_attempts}</span>
                                      </div>
                                    </div>
                                    <Badge variant={quiz.is_active ? "default" : "secondary"}>
                                      {quiz.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="vault-modules">
                  <div className="space-y-6">
                    {/* Create New Vault Module */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="w-5 h-5" />
                          {editingVaultModule ? "Edit Vault Module" : "Create New Vault Module"}
                        </CardTitle>
                        <CardDescription>
                          Create modules for the Vault Library with JSON content, quizzes, and rank requirements
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="vault-module-rank">Minimum Rank to View *</Label>
                          <Select
                            value={editingVaultModule ? editingVaultModule.min_rank : newVaultModule.min_rank}
                            onValueChange={(value) => {
                              if (editingVaultModule) {
                                setEditingVaultModule({ ...editingVaultModule, min_rank: value });
                              } else {
                                setNewVaultModule({ ...newVaultModule, min_rank: value });
                              }
                            }}
                          >
                            <SelectTrigger id="vault-module-rank">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Recruit">Recruit</SelectItem>
                              <SelectItem value="Recruit Plus">Recruit Plus</SelectItem>
                              <SelectItem value="Apprentice">Apprentice</SelectItem>
                              <SelectItem value="Apprentice Plus">Apprentice Plus</SelectItem>
                              <SelectItem value="Agent">Agent</SelectItem>
                              <SelectItem value="Agent Plus">Agent Plus</SelectItem>
                              <SelectItem value="Verified">Verified</SelectItem>
                              <SelectItem value="Verified Plus">Verified Plus</SelectItem>
                              <SelectItem value="Partner">Partner</SelectItem>
                              <SelectItem value="Partner Plus">Partner Plus</SelectItem>
                              <SelectItem value="Partner Pro">Partner Pro</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Select the minimum rank required to view this module
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vault-module-json">Module JSON *</Label>
                          <Textarea
                            id="vault-module-json"
                            placeholder='{"title": "...", "category": "...", "xp_reward": 250, "sections": [...], "quiz": [...]}'
                            value={editingVaultModule ? JSON.stringify(editingVaultModule.module_data, null, 2) : newVaultModule.module_data}
                            onChange={(e) => {
                              if (editingVaultModule) {
                                try {
                                  setEditingVaultModule({ ...editingVaultModule, module_data: JSON.parse(e.target.value) });
                                } catch {
                                  // Invalid JSON, store as string for now
                                }
                              } else {
                                setNewVaultModule({ ...newVaultModule, module_data: e.target.value });
                              }
                            }}
                            rows={15}
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Paste the complete module JSON including <strong>title</strong>, <strong>category</strong>, <strong>xp_reward</strong>, <strong>slides</strong>, and <strong>quiz</strong>. 
                            Title, category, and XP reward will be extracted from the JSON.
                            <br />
                            <strong>New Format:</strong> Use <code className="text-xs">slides</code> array with custom elements (heading, paragraph, list, image, code, quote, alert, button, badge, separator).
                            <br />
                            <strong>Old Format:</strong> Still supported - uses <code className="text-xs">sections</code> array with title and content strings.
                            <br />
                            See <code className="text-xs">VAULT_MODULE_FORMAT_EXAMPLE.json</code> and <code className="text-xs">VAULT_MODULE_CUSTOM_ELEMENTS_GUIDE.md</code> for examples and documentation.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={editingVaultModule ? handleUpdateVaultModule : handleCreateVaultModule}
                            disabled={creatingVaultModule}
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            {creatingVaultModule ? (
                              <>
                                <Activity className="w-4 h-4 mr-2 animate-spin" />
                                {editingVaultModule ? "Updating..." : "Creating..."}
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-2" />
                                {editingVaultModule ? "Update Module" : "Create Module"}
                              </>
                            )}
                          </Button>
                          {editingVaultModule && (
                            <Button
                              variant="outline"
                              onClick={() => setEditingVaultModule(null)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Existing Vault Modules */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          All Vault Modules
                        </CardTitle>
                        <CardDescription>
                          View and manage all Vault Library modules
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingVaultModules ? (
                          <div className="text-center py-8">
                            <Activity className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                            <p className="text-muted-foreground">Loading modules...</p>
                          </div>
                        ) : vaultModules.length === 0 ? (
                          <div className="text-center py-8">
                            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground">No modules created yet</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Create your first module above
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {vaultModules.map((module) => (
                              <Card key={module.id} className={!module.is_published ? "opacity-60" : ""}>
                                <CardContent className="pt-6">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold text-lg">{module.title}</h4>
                                        {module.is_published && (
                                          <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
                                            Published
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        {module.category}
                                      </p>
                                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>XP: {module.xp_reward}</span>
                                        <span>•</span>
                                        <span>Min Rank: {module.min_rank}</span>
                                        {module.published_at && (
                                          <>
                                            <span>•</span>
                                            <span>Published: {new Date(module.published_at).toLocaleDateString()}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      {!module.is_published && (
                                        <Button
                                          variant="default"
                                          size="sm"
                                          onClick={() => handlePublishVaultModule(module.id)}
                                          disabled={publishingVaultModule === module.id}
                                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                        >
                                          {publishingVaultModule === module.id ? (
                                            <>
                                              <Activity className="w-4 h-4 mr-2 animate-spin" />
                                              Publishing...
                                            </>
                                          ) : (
                                            <>
                                              <Send className="w-4 h-4 mr-2" />
                                              Publish
                                            </>
                                          )}
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingVaultModule(module)}
                                      >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteVaultModule(module.id)}
                                        disabled={deletingVaultModule === module.id}
                                      >
                                        {deletingVaultModule === module.id ? (
                                          <>
                                            <Activity className="w-4 h-4 mr-2 animate-spin" />
                                            Deleting...
                                          </>
                                        ) : (
                                          <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Ticket Chat Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.title}</DialogTitle>
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
              {ticketMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                ticketMessages.map((msg) => {
                  const isAdmin = msg.senderType === "admin";
                  const isClient = msg.senderType === "client";
                  const isSeller = msg.senderType === "seller";
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isAdmin || isSeller ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          isAdmin
                            ? 'bg-muted text-foreground'
                            : isSeller
                            ? 'bg-muted text-foreground'
                            : 'bg-muted text-foreground'
                        }`}
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
                })
              )}
              <div ref={ticketMessagesEndRef} />
            </div>
          </ScrollArea>
          <div className="flex gap-2 pt-4 border-t">
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
        </DialogContent>
      </Dialog>

      {/* Seller Message Dialog */}
      <Dialog open={showSellerMessageDialog} onOpenChange={setShowSellerMessageDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedSellerMessage?.subject}</DialogTitle>
            <DialogDescription>
              From: {selectedSellerMessage?.seller?.business_name || "Unknown Partner"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-[400px] max-h-[500px] pr-4">
            <div className="space-y-4">
              {/* Original message */}
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted text-foreground">
                  <p className="text-sm font-medium mb-1">
                    {selectedSellerMessage?.seller?.business_name || "Partner"}
                  </p>
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
                  className={`flex ${reply.is_from_seller ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      reply.is_from_seller
                        ? 'bg-muted text-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {reply.is_from_seller ? (selectedSellerMessage?.seller?.business_name || "Partner") : 'The Vault Network'}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                    <p className={`text-xs mt-1 ${
                      reply.is_from_seller ? 'text-muted-foreground' : 'text-primary-foreground/70'
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
