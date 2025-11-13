import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { DollarSign, Users, TrendingUp, Package, Copy, Check, CheckCircle, XCircle, MessageSquare, AlertCircle, HelpCircle, Send, RefreshCw, LayoutDashboard, Building2, Boxes, CreditCard, Ticket, Mail, Trophy, MessageCircle, Phone, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { isTabUnlocked, getTabUnlockRequirement, calculateProgressToNextRank, getNextRank, getRankInfo, RANK_INFO, getTasksForRank, type PartnerRank } from "@/lib/partner-progression";
import { getWeeklyChallenges, getCurrentWeek, type WeeklyChallenge } from "@/lib/weekly-challenges";
import { getLessonsForRank, type PartnerLesson as HardcodedLesson } from "@/lib/partner-lessons";
import { BookOpen, Target, FileText, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// Simple markdown to HTML converter with Vault Network styling
const markdownToHtml = (markdown: string): string => {
  if (!markdown || typeof markdown !== 'string') return '';
  
  let html = markdown;
  
  // Process lists first (before headers/paragraphs)
  // Match list items and wrap them
  html = html.replace(/((?:^[-*] .*$(?:\n|$))+)/gm, (match) => {
    const items = match
      .split('\n')
      .filter(line => line.trim().match(/^[-*] /))
      .map(line => line.replace(/^[-*] /, '').trim())
      .filter(item => item.length > 0)
      .map(item => {
        // Process bold text within list items
        const processed = item.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-primary">$1</strong>');
        return `<li class="text-sm text-muted-foreground mb-2 leading-relaxed">${processed}</li>`;
      })
      .join('\n');
    return items ? `<ul class="list-disc list-inside mb-4 space-y-2 ml-4">${items}</ul>` : match;
  });
  
  // Headers with Vault colors and spacing
  html = html.replace(/^### (.*)$/gim, '<h3 class="text-base font-semibold mb-3 mt-6 text-primary first:mt-0">$1</h3>');
  html = html.replace(/^## (.*)$/gim, '<h2 class="text-lg font-semibold mb-4 mt-8 text-primary border-b border-primary/20 pb-2 first:mt-0">$1</h2>');
  html = html.replace(/^# (.*)$/gim, '<h1 class="text-xl font-bold mb-4 mt-8 text-primary first:mt-0">$1</h1>');
  
  // Bold with primary color (Vault yellow)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-primary">$1</strong>');
  
  // Italic (only single asterisks that aren't part of bold)
  html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em class="italic text-muted-foreground">$1</em>');
  
  // Process arrows and special formatting
  html = html.replace(/→/g, '<span class="text-primary mx-1">→</span>');
  
  // Split into paragraphs (by double newlines)
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map(para => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      // If already contains HTML tags (from headers/lists), return as-is
      if (trimmed.match(/^<[h|u|o|l]/)) return trimmed;
      // Otherwise wrap in paragraph with proper spacing
      return `<p class="mb-4 text-sm text-foreground leading-relaxed">${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .filter(p => p.length > 0)
    .join('\n');
  
  return html;
};

interface SellerData {
  id: string;
  business_name: string;
  status: string;
  referral_code: string;
  commission_rate: number;
  total_sales: number;
  total_commission: number;
  current_xp?: number;
  current_rank?: PartnerRank;
  custom_sales_script?: string;
  partner_pro_subscription_status?: string;
  partner_pro_subscription_id?: string;
  season_xp?: number;
  weekly_xp?: number;
  login_streak?: number;
  last_login_date?: string;
  highest_rank?: string;
  theme_preference?: string;
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
}

interface ClientData {
  id: string;
  business_name: string;
  contact_name: string;
  status: string;
  total_spent: number;
  is_demo?: boolean;
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
  is_premium?: boolean;
  rank_required?: string;
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

interface PartnerLesson {
  id: string;
  stage: number;
  rank_required: string;
  lesson_type: 'course' | 'task' | 'quiz';
  title: string;
  content: string | null;
  quiz_questions: any[] | null;
  quiz_answers: any[] | null;
  xp_reward: number;
  unlock_action: string | null;
  order_index: number;
}

interface QuizResult {
  id: string;
  seller_id: string;
  lesson_id: string;
  score: number;
  answers: any;
  completed_at: string;
}

interface DealTrackingEntry {
  id: string;
  seller_id: string;
  date: string;
  channel: string;
  client_name: string | null;
  status: string;
  reflection: string | null;
  created_at: string;
}

interface PartnerChallenge {
  id: string;
  challenge_type: string;
  title: string;
  description: string;
  xp_reward: number;
  active_start_date?: string;
  active_end_date?: string;
  is_active?: boolean;
  requirements: any;
}

interface PartnerBadge {
  id: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  requirement_type: string;
  requirement_value: any;
  xp_reward: number;
}

interface BadgeEarning {
  id: string;
  seller_id: string;
  badge_id: string;
  earned_at: string;
  badge?: PartnerBadge;
}

// Helper function to mask business name: first letter + ****** + last letter
const maskBusinessName = (name: string): string => {
  if (!name || name.length <= 1) {
    return name || ''; // Too short to mask
  }
  if (name.length === 2) {
    return `${name[0]}******${name[1]}`;
  }
  const firstLetter = name[0];
  const lastLetter = name[name.length - 1];
  return `${firstLetter}******${lastLetter}`;
};

const PartnerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sellerData, setSellerData] = useState<SellerData | null>(null);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [availableAutomations, setAvailableAutomations] = useState<AutomationData[]>([]);
  const [lockedAutomations, setLockedAutomations] = useState<AutomationData[]>([]);
  const [loadingAutomations, setLoadingAutomations] = useState(true);
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
  const [activeTab, setActiveTab] = useState<string>("getting-started");
  
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
  
  // Progression state
  const [lessons, setLessons] = useState<PartnerLesson[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<PartnerLesson | null>(null);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [xpNotification, setXpNotification] = useState<{ xp: number; message: string } | null>(null);
  const [viewedAutomations, setViewedAutomations] = useState<Set<string>>(new Set());
  const [showRanksDialog, setShowRanksDialog] = useState(false);
  const [showVerifiedRankPopup, setShowVerifiedRankPopup] = useState(false);
  const [expandedLessonId, setExpandedLessonId] = useState<string | undefined>(undefined);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<PartnerLesson | null>(null);
  const [currentCourseSlide, setCurrentCourseSlide] = useState(0);
  const [challengeProgress, setChallengeProgress] = useState<Map<string, boolean>>(new Map());
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  
  // Sales Scripts state
  const [salesScriptTemplate, setSalesScriptTemplate] = useState<string>("");
  const [customScript, setCustomScript] = useState<string>("");
  const [savingScript, setSavingScript] = useState(false);
  
  // Deal Tracking state
  const [dealEntries, setDealEntries] = useState<DealTrackingEntry[]>([]);
  const [newDealDate, setNewDealDate] = useState<string>("");
  const [newDealChannel, setNewDealChannel] = useState<string>("");
  const [newDealClientName, setNewDealClientName] = useState<string>("");
  const [newDealStatus, setNewDealStatus] = useState<string>("no_response");
  const [newDealReflection, setNewDealReflection] = useState<string>("");
  const [submittingDeal, setSubmittingDeal] = useState(false);
  
  // Automation suggestion state
  const [suggestionTitle, setSuggestionTitle] = useState<string>("");
  const [suggestionProblem, setSuggestionProblem] = useState<string>("");
  const [suggestionClientType, setSuggestionClientType] = useState<string>("");
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  
  // Case study state
  const [caseStudyClientName, setCaseStudyClientName] = useState<string>("");
  const [caseStudyAutomation, setCaseStudyAutomation] = useState<string>("");
  const [caseStudyResult, setCaseStudyResult] = useState<string>("");
  const [caseStudyLessons, setCaseStudyLessons] = useState<string>("");
  const [submittingCaseStudy, setSubmittingCaseStudy] = useState(false);
  
  // Demo client state
  const [newDemoClientName, setNewDemoClientName] = useState<string>("");
  const [newDemoContactName, setNewDemoContactName] = useState<string>("");
  const [newDemoContactEmail, setNewDemoContactEmail] = useState<string>("");
  const [newDemoIndustry, setNewDemoIndustry] = useState<string>("");
  const [addingDemoClient, setAddingDemoClient] = useState(false);
  
  // Pitch reflection state
  const [pitchReflection, setPitchReflection] = useState<string>("");
  const [submittingPitchReflection, setSubmittingPitchReflection] = useState(false);
  const [checkingReferrals, setCheckingReferrals] = useState(false);
  
  // Challenges and badges state
  const [activeChallenges, setActiveChallenges] = useState<PartnerChallenge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<BadgeEarning[]>([]);
  const [allBadges, setAllBadges] = useState<PartnerBadge[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && !sellerData) {
      fetchSellerData();
    }
  }, [user]);

  const fetchSellerData = async () => {
    try {
      // Check for subscription success
      const subscriptionSuccess = searchParams.get('subscription');
      const sessionId = searchParams.get('session_id');
      
      if (subscriptionSuccess === 'success' && sessionId) {
        // Verify subscription with Stripe and update seller
        try {
          const { callNetlifyFunction } = await import('@/lib/netlify-functions');
          await callNetlifyFunction('verify-partner-pro-subscription', {
            sessionId: sessionId,
          });
          toast({
            title: "Welcome to Partner Pro! 🎉",
            description: "Your subscription is now active. Enjoy all the premium features!",
          });
          // Remove query params
          navigate('/partner-dashboard', { replace: true });
        } catch (error: any) {
          console.error('Error verifying subscription:', error);
        }
      }

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

      // Set loading state for automations
      setLoadingAutomations(true);
      
      // Fetch automations available to this seller
      // Note: is_premium and rank_required may not exist in the schema yet
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

      if (automationsError) {
        console.warn("Error fetching seller automations:", automationsError);
        // Continue with empty array instead of throwing
        setLoadingAutomations(false);
      }
      
      // Fetch all automations to find premium/locked ones
      const { data: allAutomationsData, error: allAutomationsError } = await supabase
        .from("automations")
        .select("*")
        .eq("is_active", true);

      if (allAutomationsError) {
        console.warn("Error fetching all automations for locked section:", allAutomationsError);
      }
      
      // Get assigned automation IDs
      const assignedIds = new Set((automationsData || []).map((sa: any) => sa.automations?.id).filter(Boolean));
      
      // Transform the assigned automations
      const transformedAutomations = (automationsData || []).map((sa: any) => ({
        id: sa.automations?.id,
        name: sa.automations?.name,
        description: sa.automations?.description,
        category: sa.automations?.category,
        setup_price: sa.automations?.setup_price,
        monthly_price: sa.automations?.monthly_price,
        image_url: sa.automations?.image_url,
        features: sa.automations?.features,
        default_commission_rate: sa.automations?.default_commission_rate,
        is_premium: sa.automations?.is_premium || false,
        rank_required: sa.automations?.rank_required || null,
      })).filter(a => a.id); // Filter out any null entries
      
      // Transform all automations to find locked premium ones
      const allAutomations = (allAutomationsData || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        category: a.category,
        setup_price: a.setup_price,
        monthly_price: a.monthly_price,
        image_url: a.image_url,
        features: a.features,
        default_commission_rate: a.default_commission_rate,
        is_premium: a.is_premium || false,
        rank_required: a.rank_required || null,
      }));
      
      // Separate available and locked automations
      // For now, since is_premium/rank_required may not exist, show all assigned automations as available
      const available = transformedAutomations;
      const locked: AutomationData[] = []; // Empty for now until premium columns are added to schema
      
      setAvailableAutomations(available);
      setLockedAutomations(locked);
      setLoadingAutomations(false);
      
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
      
      // Set custom script if exists
      if (seller.custom_sales_script) {
        setCustomScript(seller.custom_sales_script);
      }
      
      // Fetch progression data when seller data is loaded
      await fetchProgressionData(seller.id, seller.current_rank as PartnerRank);
      
      // Check if user just reached Verified rank and show popup (first time only)
      if (seller.current_rank === 'Verified') {
        const hasSeenPopup = localStorage.getItem('verified_rank_popup_seen');
        if (!hasSeenPopup) {
          // Check if they recently reached Verified (within last 24 hours)
          const { data: recentRankUp } = await supabase
            .from('partner_activity_log')
            .select('created_at')
            .eq('seller_id', seller.id)
            .eq('event_type', 'rank_up')
            .eq("metadata->>new_rank", 'Verified')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (recentRankUp) {
            const rankUpTime = new Date(recentRankUp.created_at).getTime();
            const now = Date.now();
            const hoursSinceRankUp = (now - rankUpTime) / (1000 * 60 * 60);
            
            // Show popup if rank up was within last 24 hours
            if (hoursSinceRankUp < 24) {
              setShowVerifiedRankPopup(true);
              localStorage.setItem('verified_rank_popup_seen', 'true');
            }
          }
        }
      }
      
      // Update login streak
      if (seller.id) {
        const { error: streakError } = await supabase.rpc('update_login_streak', {
          _seller_id: seller.id
        });
        if (streakError) console.error("Error updating login streak:", streakError);
        // Check weekly challenges for login (after sellerData is set)
        setTimeout(async () => {
          await checkWeeklyChallenges('login');
        }, 1000);
      }
      
      // Fetch leaderboard
      fetchLeaderboard(seller.id);
    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive",
      });
      setLoadingAutomations(false);
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

  const copyReferralLink = (type: 'client' | 'partner') => {
    const link = type === 'client' 
      ? `${window.location.origin}/for-businesses?ref=${sellerData?.referral_code}`
      : `${window.location.origin}/partners?ref=${sellerData?.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: type === 'client' 
        ? "Share this link with potential clients"
        : "Share this link with potential partners",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const [loadingLessons, setLoadingLessons] = useState(true);

  const fetchProgressionData = async (sellerId: string, sellerRank?: PartnerRank) => {
    try {
      setLoadingLessons(true);
      // Use passed rank or fallback to sellerData or 'Recruit'
      const rank = sellerRank || sellerData?.current_rank || 'Recruit';
      
      // Get hardcoded lessons instead of fetching from SQL
      const hardcodedLessons = getLessonsForRank(rank);
      
      // Transform hardcoded lessons to match the expected format
      const lessonsData = hardcodedLessons.map(lesson => ({
        id: lesson.id,
        stage: lesson.stage,
        rank_required: lesson.rank_required,
        lesson_type: lesson.lesson_type,
        title: lesson.title,
        content: lesson.content,
        quiz_questions: lesson.quiz_questions || null,
        quiz_answers: lesson.quiz_answers || null,
        xp_reward: lesson.xp_reward,
        unlock_action: lesson.unlock_action || null,
        order_index: lesson.order_index
      }));
      
      setLessons(lessonsData);

      // Store lessonsData for referral check (before async operations)
      const inviteTaskLessonData = lessonsData.find((l: any) => l.title === 'Invite a Friend' && l.rank_required === 'Partner');

      // Fetch quiz results and completions from activity log (using hardcoded lesson IDs)
      const { data: quizResultsData, error: quizResultsError } = await supabase
        .from("partner_activity_log")
        .select("metadata")
        .eq("seller_id", sellerId)
        .eq("event_type", "quiz_completed");

      if (quizResultsError) {
        console.warn("Error fetching quiz results:", quizResultsError);
      }
      
      // Fetch completed tasks from activity log
      const { data: taskCompletionsData, error: taskCompletionsError } = await supabase
        .from("partner_activity_log")
        .select("metadata")
        .eq("seller_id", sellerId)
        .eq("event_type", "task_completed");

      if (taskCompletionsError) {
        console.warn("Error fetching task completions:", taskCompletionsError);
      }
      
      // Combine quiz results and task completions (using lesson_id from metadata)
      const quizCompletedIds = new Set(
        (quizResultsData || [])
          .map((qr: any) => qr.metadata?.lesson_id)
          .filter((id: any) => id) // Filter out null/undefined
      );
      const taskCompletedIds = new Set(
        (taskCompletionsData || [])
          .map((tc: any) => tc.metadata?.lesson_id)
          .filter((id: any) => id) // Filter out null/undefined
      );
      
      // Merge both sets - preserve existing state and merge with fetched data
      const fetchedCompleted = new Set([...quizCompletedIds, ...taskCompletedIds]);
      
      // Set quiz results for display (transform activity log entries)
      setQuizResults((quizResultsData || []).map((qr: any) => ({
        id: qr.id || '',
        seller_id: sellerId,
        lesson_id: qr.metadata?.lesson_id || '',
        score: qr.metadata?.score || 0,
        answers: qr.metadata?.answers || [],
        completed_at: qr.created_at || new Date().toISOString()
      })));
      
      // Merge with existing state to prevent race conditions
      setCompletedLessons(prev => {
        const merged = new Set([...prev, ...fetchedCompleted]);
        return merged;
      });
      
      setLoadingLessons(false);

      // Automatically check for referred partners if "Invite a Friend" task is available
      // This ensures the task gets marked as completed if someone has already signed up
      if (inviteTaskLessonData && rank === 'Partner' && sellerId) {
        // Check if task is not already completed
        const inviteTaskCompleted = fetchedCompleted.has(inviteTaskLessonData.id);
        if (!inviteTaskCompleted) {
          // Check for referred partners in the background (don't await to avoid blocking)
          // We'll check after a short delay to ensure state is updated
          setTimeout(() => {
            checkReferredPartners().catch(err => {
              console.log("Background referral check failed (non-critical):", err);
            });
          }, 500);
        }
      }

      // Fetch deal tracking entries
      const { data: dealEntriesData, error: dealEntriesError } = await supabase
        .from("deal_tracking")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      if (dealEntriesError) throw dealEntriesError;
      setDealEntries(dealEntriesData || []);

      // Calculate current week (1-4) based on date
      const currentWeekNumber = getCurrentWeek();
      setCurrentWeek(currentWeekNumber);

      // Get weekly challenges from hardcoded configuration, filtered by rank
      const weeklyChallenges = getWeeklyChallenges(currentWeekNumber, rank);
      setActiveChallenges(weeklyChallenges);

      // Fetch challenge progress for this seller from activity_log
      if (weeklyChallenges.length > 0) {
        const challengeIds = weeklyChallenges.map(c => c.id);
        const { data: progressData, error: progressError } = await supabase
          .from("partner_activity_log")
          .select("metadata")
          .eq("seller_id", sellerId)
          .eq("event_type", "challenge_completed");

        if (!progressError && progressData) {
          const progressMap = new Map<string, boolean>();
          progressData.forEach((p: any) => {
            const challengeId = p.metadata?.challenge_id;
            if (challengeId && challengeIds.includes(challengeId)) {
              progressMap.set(challengeId, true);
            }
          });
          setChallengeProgress(progressMap);
        }
      }

      // Fetch all badges
      const { data: badgesData, error: badgesError } = await supabase
        .from("partner_badges")
        .select("*")
        .order("xp_reward", { ascending: false });

      if (badgesError) throw badgesError;
      setAllBadges(badgesData || []);

      // Fetch earned badges
      const { data: earnedBadgesData, error: earnedBadgesError } = await supabase
        .from("partner_badge_earnings")
        .select(`
          *,
          badge:partner_badges(*)
        `)
        .eq("seller_id", sellerId)
        .order("earned_at", { ascending: false });

      if (earnedBadgesError) throw earnedBadgesError;
      setEarnedBadges(earnedBadgesData || []);

      // Fetch viewed automations for Automation Preview task tracking
      // Use partner_activity_log with event_type 'automation_view' and metadata containing automation_id
      const { data: automationViewsData, error: automationViewsError } = await supabase
        .from("partner_activity_log")
        .select("metadata")
        .eq("seller_id", sellerId)
        .eq("event_type", "automation_view");

      if (automationViewsError) {
        // If error, just log it and continue - this is not critical
        console.warn("Error fetching automation views:", automationViewsError);
        setViewedAutomations(new Set());
      } else {
        const viewedIds = new Set(
          (automationViewsData || [])
            .map((av: any) => av.metadata?.automation_id)
            .filter((id: any) => id) // Filter out null/undefined
        );
        setViewedAutomations(viewedIds);
      }
      
      setLoadingLessons(false);
    } catch (error: any) {
      console.error("Error fetching progression data:", error);
      setLoadingLessons(false);
    }
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

  // Helper function to show XP notification
  const showXPNotification = (xp: number, message: string) => {
    setXpNotification({ xp, message });
    setTimeout(() => setXpNotification(null), 5000);
  };

  // Helper function to check and complete weekly challenges
  const checkWeeklyChallenges = async (actionType: string, count: number = 1) => {
    if (!sellerData?.id || activeChallenges.length === 0) return;

    const currentWeekNumber = getCurrentWeek();
    const weeklyChallenges = getWeeklyChallenges(currentWeekNumber);

    for (const challenge of weeklyChallenges) {
      // Skip if already completed
      if (challengeProgress.get(challenge.id)) continue;

      const req = challenge.requirements;
      let shouldComplete = false;
      let currentCount = 0;

      // Check challenge requirements based on type
      switch (req.type) {
        case 'login_days':
          if (actionType === 'login' && sellerData.login_streak) {
            currentCount = sellerData.login_streak;
            shouldComplete = currentCount >= req.target;
          }
          break;
        case 'new_clients':
          if (actionType === 'client_added') {
            // Count clients added this week
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const { data: weekClients } = await supabase
              .from('clients')
              .select('id')
              .eq('seller_id', sellerData.id)
              .gte('created_at', weekStart.toISOString());
            currentCount = weekClients?.length || 0;
            shouldComplete = currentCount >= req.target;
          }
          break;
        case 'automation_assignments':
          if (actionType === 'automation_assigned') {
            // Count assignments this week
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const { data: weekAssignments } = await supabase
              .from('client_automations')
              .select('id')
              .eq('seller_id', sellerData.id)
              .gte('created_at', weekStart.toISOString());
            currentCount = weekAssignments?.length || 0;
            shouldComplete = currentCount >= req.target;
          }
          break;
        case 'quiz_completion':
          if (actionType === 'quiz_completed') {
            // Count quizzes completed this week
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const { data: weekQuizzes } = await supabase
              .from('partner_quiz_results')
              .select('id')
              .eq('seller_id', sellerData.id)
              .gte('completed_at', weekStart.toISOString());
            currentCount = weekQuizzes?.length || 0;
            shouldComplete = currentCount >= req.target;
          }
          break;
        case 'course_completion':
          if (actionType === 'course_completed') {
            // Count courses completed this week
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const { data: weekCourses } = await supabase
              .from('partner_activity_log')
              .select('id')
              .eq('seller_id', sellerData.id)
              .eq('event_type', 'course_completed')
              .gte('created_at', weekStart.toISOString());
            currentCount = weekCourses?.length || 0;
            shouldComplete = currentCount >= req.target;
          }
          break;
        case 'course_or_quiz':
          if (actionType === 'quiz_completed' || actionType === 'course_completed') {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const { data: weekActivities } = await supabase
              .from('partner_activity_log')
              .select('id')
              .eq('seller_id', sellerData.id)
              .in('event_type', ['quiz_completed', 'course_completed'])
              .gte('created_at', weekStart.toISOString());
            currentCount = weekActivities?.length || 0;
            shouldComplete = currentCount >= req.target;
          }
          break;
        case 'automation_suggestion':
          if (actionType === 'automation_suggestion') {
            // Count suggestions this week
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const { data: weekSuggestions } = await supabase
              .from('automation_suggestions')
              .select('id')
              .eq('seller_id', sellerData.id)
              .gte('created_at', weekStart.toISOString());
            currentCount = weekSuggestions?.length || 0;
            shouldComplete = currentCount >= req.target;
          }
          break;
        case 'deal_entries':
          if (actionType === 'deal_logged') {
            // Count deal entries this week
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const { data: weekDeals } = await supabase
              .from('deal_tracking')
              .select('id')
              .eq('seller_id', sellerData.id)
              .gte('created_at', weekStart.toISOString());
            currentCount = weekDeals?.length || 0;
            shouldComplete = currentCount >= req.target;
          }
          break;
        case 'case_study':
          if (actionType === 'case_study') {
            // Count case studies this week
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const { data: weekCaseStudies } = await supabase
              .from('partner_case_studies')
              .select('id')
              .eq('seller_id', sellerData.id)
              .gte('created_at', weekStart.toISOString());
            currentCount = weekCaseStudies?.length || 0;
            shouldComplete = currentCount >= req.target;
          }
          break;
      }

      if (shouldComplete) {
        // Mark challenge as completed in activity_log (hardcoded challenge IDs are strings, not UUIDs)
        const { error: progressError } = await supabase
          .from('partner_activity_log')
          .insert({
            seller_id: sellerData.id,
            event_type: 'challenge_completed',
            xp_value: challenge.xp_reward,
            description: `Completed Challenge: ${challenge.title}`,
            metadata: {
              challenge_id: challenge.id,
              challenge_type: challenge.challenge_type,
              challenge_title: challenge.title
            }
          });

        if (!progressError) {
          // Award XP for challenge completion (this counts towards rank progression)
          await addXP(challenge.xp_reward, 'challenge_completed', `Completed Challenge: ${challenge.title}`, {
            challenge_id: challenge.id,
            challenge_type: challenge.challenge_type
          });

          // Update local state
          setChallengeProgress(prev => {
            const updated = new Map(prev);
            updated.set(challenge.id, true);
            return updated;
          });

          toast({
            title: "Challenge Completed! 🎉",
            description: `${challenge.title} - Earned ${challenge.xp_reward} XP!`,
          });
        }
      }
    }
  };

  // Handle manual rank up
  const handleManualRankUp = async () => {
    if (!sellerData?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('manual_rank_up', {
        _seller_id: sellerData.id
      });

      if (error) {
        const errorData = error as any;
        if (errorData.message) {
          toast({
            title: "Cannot advance rank",
            description: errorData.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to advance rank",
            variant: "destructive",
          });
        }
        return;
      }

      if (data && data.success) {
        toast({
          title: "Rank Up Successful!",
          description: `Congratulations! You've advanced to ${data.new_rank}!`,
        });
        
        // Refresh seller data to get updated rank
        await fetchSellerData();
        await fetchProgressionData(sellerData.id, data.new_rank as PartnerRank);
        
        // Show Verified rank popup if user just reached Verified
        if (data.new_rank === 'Verified') {
          // Check if we've shown this popup before
          const hasSeenPopup = localStorage.getItem('verified_rank_popup_seen');
          if (!hasSeenPopup) {
            setShowVerifiedRankPopup(true);
            localStorage.setItem('verified_rank_popup_seen', 'true');
          }
        }
      } else if (data && !data.success) {
        toast({
          title: "Cannot advance rank",
          description: data.message || "Requirements not met",
          variant: data.error === 'not_enough_xp' ? 'default' : 'destructive',
        });
      }
    } catch (error: any) {
      console.error("Error advancing rank:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to advance rank",
        variant: "destructive",
      });
    }
  };

  // Handle Partner Pro checkout
  const handlePartnerProCheckout = async () => {
    if (!sellerData?.id || !user?.email) {
      toast({
        title: "Error",
        description: "Please ensure you're logged in.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { callNetlifyFunction } = await import('@/lib/netlify-functions');
      const result = await callNetlifyFunction('partner-pro-checkout', {
        sellerId: sellerData.id,
        sellerEmail: user.email,
      });

      if (result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error initiating Partner Pro checkout:', error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to initiate checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to add XP via database function
  const addXP = async (xpAmount: number, eventType: string, description: string, metadata?: any) => {
    if (!sellerData?.id) {
      console.error("Cannot add XP: sellerData.id is missing");
      return;
    }
    
    try {
      console.log("Adding XP:", { xpAmount, eventType, description, metadata, sellerId: sellerData.id });
      
      const { data, error } = await supabase.rpc('add_seller_xp', {
        _seller_id: sellerData.id,
        _xp_amount: xpAmount,
        _event_type: eventType,
        _description: description,
        _metadata: metadata || null
      });

      if (error) {
        console.error("RPC Error:", error);
        toast({
          title: "Error awarding XP",
          description: error.message || "Failed to award XP. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
      
      console.log("XP added successfully:", data);
      
      // Refresh seller data to get updated XP and rank (this is critical!)
      await fetchSellerData();
      
      // Refresh progression data to update completion status and lessons
      await fetchProgressionData(sellerData.id, sellerData?.current_rank as PartnerRank);
      
      showXPNotification(xpAmount, description);
    } catch (error: any) {
      console.error("Error adding XP:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to award XP",
        variant: "destructive",
      });
      throw error; // Re-throw so callers can handle it
    }
  };

  // Handle completing a lesson/task
  const handleCompleteLesson = async (lesson: PartnerLesson) => {
    if (!sellerData?.id || completedLessons.has(lesson.id)) return;

    try {
      if (lesson.lesson_type === 'course' && lesson.quiz_questions) {
        // Open quiz dialog - reset all quiz state
        setSelectedLesson(lesson);
        setQuizAnswers({});
        setCurrentQuizQuestion(0);
        setShowQuizDialog(true);
      } else if (lesson.lesson_type === 'task') {
        // For tasks, we'll handle them individually based on the task
        // This will be handled by specific task handlers
        try {
          await addXP(lesson.xp_reward, 'task_completed', `Completed: ${lesson.title}`, { lesson_id: lesson.id });
          // Mark as completed
          setCompletedLessons(prev => new Set([...prev, lesson.id]));
          toast({
            title: "Task Completed!",
            description: `You earned ${lesson.xp_reward} XP for completing: ${lesson.title}`,
          });
        } catch (error) {
          console.error("Error completing task:", error);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle quiz submission
  const handleSubmitQuiz = async () => {
    if (!selectedLesson || !sellerData?.id) return;

    setSubmittingQuiz(true);
    try {
      const questions = selectedLesson.quiz_questions || [];
      const correctAnswers = selectedLesson.quiz_answers || [];
      
      let correctCount = 0;
      const userAnswers: any[] = [];

      questions.forEach((q: any, index: number) => {
        const userAnswer = quizAnswers[index];
        userAnswers.push(userAnswer);
        
        if (q.type === 'text_input') {
          // For text input, we'll accept any answer (could be improved with AI checking)
          correctCount++;
        } else if (userAnswer === correctAnswers[index]?.toString()) {
          correctCount++;
        }
      });

      const score = Math.round((correctCount / questions.length) * 100);

      // Award XP (this will also create an activity_log entry via the RPC function)
      // addXP already refreshes seller data and progression data, so no need to refresh again
      await addXP(selectedLesson.xp_reward, 'quiz_completed', `Completed quiz: ${selectedLesson.title}`, {
        lesson_id: selectedLesson.id,
        score,
        answers: userAnswers,
        lesson_title: selectedLesson.title
      });

      // Mark as completed (addXP already refreshes progression data)
      setCompletedLessons(prev => new Set([...prev, selectedLesson.id]));
      
      // Check weekly challenges
      await checkWeeklyChallenges('quiz_completed');
      
      toast({
        title: "Quiz Completed!",
        description: `You scored ${score}% and earned ${selectedLesson.xp_reward} XP!`,
      });

      setShowQuizDialog(false);
      setSelectedLesson(null);
      setQuizAnswers({});
      setCurrentQuizQuestion(0);
    } catch (error: any) {
      toast({
        title: "Error submitting quiz",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Handle saving sales script
  const handleSaveSalesScript = async () => {
    if (!sellerData?.id || !customScript.trim()) {
      toast({
        title: "Script required",
        description: "Please enter your sales script",
        variant: "destructive",
      });
      return;
    }

    setSavingScript(true);
    try {
      const { error } = await supabase
        .from("sellers")
        .update({ custom_sales_script: customScript.trim() })
        .eq("id", sellerData.id);

      if (error) throw error;

      toast({
        title: "Script Saved!",
        description: "Your sales script has been saved successfully.",
      });

      // Award XP if this is first time (Task 5)
      // addXP already refreshes seller data and progression data
      const task5Lesson = lessons.find(l => l.title === 'Create Your Sales Script');
      if (task5Lesson && !completedLessons.has(task5Lesson.id)) {
        try {
          await addXP(task5Lesson.xp_reward, 'task_completed', `Completed: ${task5Lesson.title}`, { lesson_id: task5Lesson.id });
          setCompletedLessons(prev => new Set([...prev, task5Lesson.id]));
          toast({
            title: "Task Completed!",
            description: `You earned ${task5Lesson.xp_reward} XP for creating your sales script!`,
          });
        } catch (error) {
          console.error("Error awarding XP for sales script:", error);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error saving script",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingScript(false);
    }
  };

  // Handle submitting deal entry
  const handleSubmitDeal = async () => {
    if (!sellerData?.id || !newDealDate || !newDealChannel) {
      toast({
        title: "Required fields",
        description: "Please fill in date and channel",
        variant: "destructive",
      });
      return;
    }

    setSubmittingDeal(true);
    try {
      // Check if this is the first deal BEFORE inserting (for task completion)
      // Query database directly to ensure accurate count
      const { count: dealCount } = await supabase
        .from("deal_tracking")
        .select("*", { count: 'exact', head: true })
        .eq("seller_id", sellerData.id);
      
      const isFirstDeal = (dealCount || 0) === 0;
      
      // Get the task lesson - try from current lessons first, then from hardcoded lessons
      let task6Lesson = lessons.find(l => l.title === 'Log First Outreach in Deal Diary');
      if (!task6Lesson) {
        // If not in current lessons, get it from hardcoded lessons
        const allLessons = getLessonsForRank(sellerData?.current_rank || 'Recruit');
        task6Lesson = allLessons.find(l => l.title === 'Log First Outreach in Deal Diary');
      }
      
      // Check if task is already completed by querying activity log
      let isTaskCompleted = false;
      if (task6Lesson) {
        const { data: completionData } = await supabase
          .from("partner_activity_log")
          .select("id")
          .eq("seller_id", sellerData.id)
          .eq("event_type", "task_completed")
          .eq("metadata->>lesson_id", task6Lesson.id)
          .limit(1);
        isTaskCompleted = (completionData?.length || 0) > 0;
      }
      
      const shouldAwardTaskXP = task6Lesson && !isTaskCompleted && isFirstDeal;

      const { error } = await supabase
        .from("deal_tracking")
        .insert({
          seller_id: sellerData.id,
          date: newDealDate,
          channel: newDealChannel,
          client_name: newDealClientName || null,
          status: newDealStatus,
          reflection: newDealReflection || null,
        });

      if (error) throw error;

      // Reset form immediately
      setNewDealDate("");
      setNewDealChannel("");
      setNewDealClientName("");
      setNewDealStatus("no_response");
      setNewDealReflection("");

      toast({
        title: "Deal Logged!",
        description: "Your outreach has been logged successfully.",
      });

      // Award XP if this is first deal (Task 6)
      // addXP will handle refreshing seller data and progression data
      if (shouldAwardTaskXP && task6Lesson) {
        try {
          await addXP(task6Lesson.xp_reward, 'task_completed', `Completed: ${task6Lesson.title}`, { lesson_id: task6Lesson.id });
          setCompletedLessons(prev => new Set([...prev, task6Lesson.id]));
          toast({
            title: "Task Completed!",
            description: `You earned ${task6Lesson.xp_reward} XP for logging your first outreach!`,
          });
        } catch (error) {
          console.error("Error awarding XP for deal logging:", error);
          toast({
            title: "Error completing task",
            description: "XP was awarded but task completion may not be recorded. Please refresh the page.",
            variant: "destructive",
          });
        }
      }
      
      // Check weekly challenges
      await checkWeeklyChallenges('deal_logged');
      
      // Refresh deal entries (addXP already refreshes seller data and progression data)
      // Only refresh deal entries here since addXP doesn't refresh them
      const { data: dealEntriesData } = await supabase
        .from("deal_tracking")
        .select("*")
        .eq("seller_id", sellerData.id)
        .order("created_at", { ascending: false });
      setDealEntries(dealEntriesData || []);
    } catch (error: any) {
      toast({
        title: "Error logging deal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingDeal(false);
    }
  };

  // Handle submitting automation suggestion
  const handleSubmitSuggestion = async () => {
    if (!sellerData?.id || !suggestionTitle.trim() || !suggestionProblem.trim()) {
      toast({
        title: "Required fields",
        description: "Please fill in title and problem",
        variant: "destructive",
      });
      return;
    }

    setSubmittingSuggestion(true);
    try {
      const { error } = await supabase
        .from("automation_suggestions")
        .insert({
          seller_id: sellerData.id,
          title: suggestionTitle.trim(),
          problem_solves: suggestionProblem.trim(),
          estimated_client_type: suggestionClientType || null,
        });

      if (error) throw error;

      toast({
        title: "Suggestion Submitted!",
        description: "Thank you for your automation suggestion!",
      });

      // Award XP (Task 4)
      // addXP already refreshes seller data and progression data
      const task4Lesson = lessons.find(l => l.title === 'Suggest New Automation');
      if (task4Lesson && !completedLessons.has(task4Lesson.id)) {
        try {
          await addXP(task4Lesson.xp_reward, 'task_completed', `Completed: ${task4Lesson.title}`, { lesson_id: task4Lesson.id });
          setCompletedLessons(prev => new Set([...prev, task4Lesson.id]));
          toast({
            title: "Task Completed!",
            description: `You earned ${task4Lesson.xp_reward} XP for suggesting a new automation!`,
          });
        } catch (error) {
          console.error("Error awarding XP for automation suggestion:", error);
        }
      }

      // Check weekly challenges
      await checkWeeklyChallenges('automation_suggestion');

      // Reset form
      setSuggestionTitle("");
      setSuggestionProblem("");
      setSuggestionClientType("");
    } catch (error: any) {
      toast({
        title: "Error submitting suggestion",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  // Handle submitting case study
  // Handle adding demo client
  const handleAddDemoClient = async () => {
    if (!sellerData?.id || !newDemoClientName.trim() || !newDemoContactName.trim() || !newDemoContactEmail.trim()) {
      toast({
        title: "Required fields",
        description: "Please fill in business name, contact name, and email",
        variant: "destructive",
      });
      return;
    }

    setAddingDemoClient(true);
    try {
      const { error } = await supabase
        .from("clients")
        .insert({
          seller_id: sellerData.id,
          business_name: newDemoClientName.trim(),
          contact_name: newDemoContactName.trim(),
          contact_email: newDemoContactEmail.trim() || null,
          industry: newDemoIndustry || null,
          is_demo: true,
          status: "active",
        });

      if (error) throw error;

      toast({
        title: "Demo Client Added!",
        description: "Your demo client has been added successfully.",
      });

      // Award XP (Task 7)
      const task7Lesson = lessons.find(l => l.title === 'Add Demo Client' && l.rank_required === 'Partner');
      if (task7Lesson && !completedLessons.has(task7Lesson.id)) {
        await addXP(task7Lesson.xp_reward, 'task_completed', `Completed: ${task7Lesson.title}`, { lesson_id: task7Lesson.id });
        setCompletedLessons(prev => new Set([...prev, task7Lesson.id]));
      }

      // Check weekly challenges
      await checkWeeklyChallenges('client_added');

      // Reset form
      setNewDemoClientName("");
      setNewDemoContactName("");
      setNewDemoContactEmail("");
      setNewDemoIndustry("");

      // Refresh clients
      await fetchSellerData();
    } catch (error: any) {
      toast({
        title: "Error adding demo client",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAddingDemoClient(false);
    }
  };

  // Handle submitting pitch reflection
  const handleSubmitPitchReflection = async () => {
    if (!sellerData?.id || !pitchReflection.trim()) {
      toast({
        title: "Reflection required",
        description: "Please write your pitch reflection",
        variant: "destructive",
      });
      return;
    }

    setSubmittingPitchReflection(true);
    try {
      // Award XP (Task 9) - get lesson first
      const task9Lesson = lessons.find(l => l.title === 'Pitch Reflection' && l.rank_required === 'Partner');
      
      // Store reflection in activity log
      const { error } = await supabase
        .from("partner_activity_log")
        .insert({
          seller_id: sellerData.id,
          event_type: "task_completed",
          description: pitchReflection.trim(),
          metadata: { task: "Pitch Reflection", lesson_id: task9Lesson?.id },
        });

      if (error) throw error;

      toast({
        title: "Reflection Submitted!",
        description: "Thank you for sharing your reflection!",
      });

      // Award XP (Task 9)
      if (task9Lesson && !completedLessons.has(task9Lesson.id)) {
        try {
          await addXP(task9Lesson.xp_reward, 'task_completed', `Completed: ${task9Lesson.title}`, { lesson_id: task9Lesson.id });
          setCompletedLessons(prev => new Set([...prev, task9Lesson.id]));
          toast({
            title: "Task Completed!",
            description: `You earned ${task9Lesson.xp_reward} XP for your pitch reflection!`,
          });
        } catch (error) {
          console.error("Error awarding XP for pitch reflection:", error);
        }
      }

      // Reset form
      setPitchReflection("");
    } catch (error: any) {
      toast({
        title: "Error submitting reflection",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingPitchReflection(false);
    }
  };

  // Check for referred partners and complete "Invite a Friend" task if applicable
  const checkReferredPartners = async () => {
    if (!sellerData?.id) return;

    setCheckingReferrals(true);
    try {
      // Find the "Invite a Friend" task
      const inviteTaskLesson = lessons.find(l => l.title === 'Invite a Friend' && l.rank_required === 'Partner');
      if (!inviteTaskLesson) {
        setCheckingReferrals(false);
        return;
      }

      // Check if task is already completed
      if (completedLessons.has(inviteTaskLesson.id)) {
        toast({
          title: "Task Already Completed",
          description: "You've already completed the 'Invite a Friend' task!",
        });
        setCheckingReferrals(false);
        return;
      }

      // Check if any partners were referred by this seller and are approved
      const { data: referredPartners, error } = await supabase
        .from("sellers")
        .select("id, business_name, status, created_at")
        .eq("referred_by_seller_id", sellerData.id)
        .eq("status", "approved");

      if (error) {
        console.error("Error checking referred partners:", error);
        toast({
          title: "Error",
          description: "Failed to check for referred partners. Please try again.",
          variant: "destructive",
        });
        setCheckingReferrals(false);
        return;
      }

      // If there are approved referred partners, mark the task as completed
      if (referredPartners && referredPartners.length > 0) {
        // Check if task completion already exists in activity log
        const { data: existingCompletion } = await supabase
          .from("partner_activity_log")
          .select("id")
          .eq("seller_id", sellerData.id)
          .eq("event_type", "task_completed")
          .eq("metadata->>lesson_id", inviteTaskLesson.id)
          .maybeSingle();

        if (!existingCompletion) {
          // Store task completion in activity log
          const { error: logError } = await supabase
            .from("partner_activity_log")
            .insert({
              seller_id: sellerData.id,
              event_type: "task_completed",
              description: `Referred ${referredPartners.length} partner(s)`,
              metadata: { 
                task: "Invite a Friend", 
                lesson_id: inviteTaskLesson.id,
                referred_partners_count: referredPartners.length,
                referred_partner_ids: referredPartners.map(p => p.id)
              },
            });

          if (logError) {
            console.error("Error logging task completion:", logError);
            toast({
              title: "Error",
              description: "Failed to log task completion. Please try again.",
              variant: "destructive",
            });
            setCheckingReferrals(false);
            return;
          }

          // Award XP (the trigger should handle this, but we'll also call addXP to ensure it happens)
          // Note: The trigger awards XP when a partner is approved, so we might have already received XP
          // But we still need to mark the task as completed
          try {
            await addXP(inviteTaskLesson.xp_reward, 'task_completed', `Completed: ${inviteTaskLesson.title}`, { lesson_id: inviteTaskLesson.id });
            setCompletedLessons(prev => new Set([...prev, inviteTaskLesson.id]));
            
            toast({
              title: "Task Completed!",
              description: `You've successfully referred ${referredPartners.length} partner(s)! You earned ${inviteTaskLesson.xp_reward} XP.`,
            });
          } catch (xpError: any) {
            // XP might have already been awarded by the trigger, so just mark as completed
            console.log("XP may have already been awarded:", xpError);
            setCompletedLessons(prev => new Set([...prev, inviteTaskLesson.id]));
            
            toast({
              title: "Task Completed!",
              description: `You've successfully referred ${referredPartners.length} partner(s)!`,
            });
          }
        } else {
          toast({
            title: "Task Already Completed",
            description: "You've already completed the 'Invite a Friend' task!",
          });
        }
      } else {
        toast({
          title: "No Referrals Found",
          description: "No approved partners have signed up using your referral code yet. Keep sharing your link!",
        });
      }
    } catch (error: any) {
      console.error("Error checking referred partners:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to check for referred partners",
        variant: "destructive",
      });
    } finally {
      setCheckingReferrals(false);
    }
  };

  const handleSubmitCaseStudy = async () => {
    if (!sellerData?.id || !caseStudyAutomation.trim() || !caseStudyResult.trim()) {
      toast({
        title: "Required fields",
        description: "Please fill in automation and result summary",
        variant: "destructive",
      });
      return;
    }

    setSubmittingCaseStudy(true);
    try {
      const { error } = await supabase
        .from("partner_case_studies")
        .insert({
          seller_id: sellerData.id,
          client_name: caseStudyClientName || null,
          automation_sold: caseStudyAutomation.trim(),
          result_summary: caseStudyResult.trim(),
          lessons_learned: caseStudyLessons || null,
        });

      if (error) throw error;

      toast({
        title: "Case Study Submitted!",
        description: "Thank you for sharing your success story!",
      });

      // Award XP (Task 14)
      const task14Lesson = lessons.find(l => l.title === 'Submit Case Summary');
      if (task14Lesson && !completedLessons.has(task14Lesson.id)) {
        await addXP(task14Lesson.xp_reward, 'task_completed', `Completed: ${task14Lesson.title}`, { lesson_id: task14Lesson.id });
        setCompletedLessons(prev => new Set([...prev, task14Lesson.id]));
      }

      // Check weekly challenges
      await checkWeeklyChallenges('case_study');

      // Reset form
      setCaseStudyClientName("");
      setCaseStudyAutomation("");
      setCaseStudyResult("");
      setCaseStudyLessons("");
    } catch (error: any) {
      toast({
        title: "Error submitting case study",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingCaseStudy(false);
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

      // Check if this is a demo client
      const client = clients.find(c => c.id === selectedClient);
      const isDemoClient = client?.is_demo || false;

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

      // Track task completion for demo automation assignment
      if (isDemoClient) {
        const assignDemoLesson = lessons.find(l => l.title === 'Assign Demo Automation' && l.rank_required === 'Partner');
        if (assignDemoLesson && !completedLessons.has(assignDemoLesson.id)) {
          await addXP(assignDemoLesson.xp_reward, 'task_completed', `Completed: ${assignDemoLesson.title}`, { lesson_id: assignDemoLesson.id });
          setCompletedLessons(prev => new Set([...prev, assignDemoLesson.id]));
        }
      }

      // Check weekly challenges
      await checkWeeklyChallenges('automation_assigned');

      // Refresh client automations
      await fetchProgressionData(sellerData?.id || '');

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

          {/* Progress Banner */}
          {sellerData?.current_xp !== undefined && sellerData?.current_rank && (
            <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30 mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-3">
                      <Trophy className="w-6 h-6 text-primary" />
                      <div>
                        <h3 className="text-lg font-bold text-primary">
                          Rank: {sellerData.partner_pro_subscription_status === 'active' ? 'Partner Pro' : sellerData.current_rank} • {sellerData.current_xp} XP
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Commission Rate: {sellerData.commission_rate}%
                          {sellerData.partner_pro_subscription_status === 'active' && (
                            <Badge className="ml-2 bg-primary/20 text-primary border-primary/30">Partner Pro</Badge>
                          )}
                        </p>
                      </div>
                    </div>
                    {(() => {
                      // If user has Partner Pro subscription, show different UI
                      const hasPartnerPro = sellerData.partner_pro_subscription_status === 'active';
                      const effectiveRank = hasPartnerPro ? 'Partner Pro' : sellerData.current_rank;
                      const nextRank = getNextRank(sellerData.current_rank);
                      const isVerifiedRank = sellerData.current_rank === 'Verified';
                      const showPartnerProUpgrade = isVerifiedRank && !hasPartnerPro;
                      
                      // For Verified rank, Partner Pro is a paid upgrade, not free
                      if (showPartnerProUpgrade) {
                        return (
                          <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-primary" />
                                <p className="text-sm text-muted-foreground">
                                  Ready to unlock <strong className="text-primary">Partner Pro</strong>?
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => navigate('/partner-pro')}
                                  variant="outline"
                                  size="sm"
                                  className="border-primary/50 text-primary hover:bg-primary/10"
                                >
                                  Find out more
                                </Button>
                                <Button
                                  onClick={handlePartnerProCheckout}
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                  size="sm"
                                >
                                  <Trophy className="w-4 h-4 mr-2" />
                                  Upgrade - $24.99/mo
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // For other ranks, show normal progression
                      if (!nextRank) return null;
                      
                      const progress = calculateProgressToNextRank(sellerData.current_xp || 0, sellerData.current_rank);
                      const requiredTasks = getTasksForRank(sellerData.current_rank);
                      const completedTasks = requiredTasks.filter(taskId => completedLessons.has(taskId));
                      const allTasksCompleted = requiredTasks.length === 0 || completedTasks.length === requiredTasks.length;
                      const nextRankThreshold = nextRank ? getRankInfo(nextRank).xpThreshold : 0;
                      const xpThresholdMet = (sellerData.current_xp || 0) >= nextRankThreshold;
                      const canAdvance = allTasksCompleted && xpThresholdMet;
                      
                      return (
                        <>
                          <Progress value={progress.percentage} className="h-2 mb-1" />
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-muted-foreground">
                              {sellerData?.current_rank === 'Verified' && nextRank === 'Partner Pro' 
                                ? 'Ready to upgrade to Partner Pro' 
                                : `${progress.current} / ${progress.next} XP to ${nextRank}`}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-primary hover:text-primary/80"
                              onClick={() => setShowRanksDialog(true)}
                            >
                              View All Ranks
                            </Button>
                          </div>
                          
                          {/* XP Requirement Check */}
                          {!xpThresholdMet && (
                            <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-primary mb-1">
                                    Not enough XP
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    You need {nextRankThreshold - (sellerData.current_xp || 0)} more XP to reach {nextRank} rank.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Tasks Requirement Check (only show if XP is met) */}
                          {xpThresholdMet && !allTasksCompleted && (
                            <div className="mt-3 p-3 bg-accent/10 border border-accent/20 rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-accent mb-1">
                                    Complete all tasks to advance
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    You have enough XP, but you need to complete all {requiredTasks.length} task{requiredTasks.length !== 1 ? 's' : ''} for {sellerData.current_rank} rank before advancing to {nextRank}.
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Completed: {completedTasks.length} / {requiredTasks.length} tasks
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Rank Up Button (only show if both requirements met) */}
                          {canAdvance && (
                            <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                              <div className="flex items-start gap-2 mb-3">
                                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-primary mb-1">
                                    Ready to advance!
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    You've completed all tasks and reached the XP threshold for {nextRank}.
                                  </p>
                                </div>
                              </div>
                              <Button
                                onClick={sellerData?.current_rank === 'Verified' && nextRank === 'Partner Pro' ? handlePartnerProCheckout : handleManualRankUp}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                size="sm"
                              >
                                <Trophy className="w-4 h-4 mr-2" />
                                {sellerData?.current_rank === 'Verified' && nextRank === 'Partner Pro' ? 'Upgrade to Partner Pro - $24.99/month' : `Advance to ${nextRank}`}
                              </Button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    {!getNextRank(sellerData.current_rank) && (
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary hover:text-primary/80"
                          onClick={() => setShowRanksDialog(true)}
                        >
                          View All Ranks
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verified Rank Popup */}
          <Dialog open={showVerifiedRankPopup} onOpenChange={setShowVerifiedRankPopup}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl text-primary flex items-center gap-2">
                  <Trophy className="w-6 h-6" />
                  Congratulations! You've Reached Verified Rank
                </DialogTitle>
                <DialogDescription className="text-base pt-2">
                  You're now up to speed with all the basics and ready to pitch to clients!
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm text-foreground mb-3">
                    You've completed all the essential training and tasks. You now have everything you need to start pitching to real clients and building your automation business.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If you want more guidance, advanced features, and premium support, consider upgrading to <strong className="text-primary">Partner Pro</strong>.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowVerifiedRankPopup(false);
                      navigate('/partner-pro');
                    }}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Learn About Partner Pro
                  </Button>
                  <Button
                    onClick={() => setShowVerifiedRankPopup(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* View All Ranks Dialog */}
          <Dialog open={showRanksDialog} onOpenChange={setShowRanksDialog}>
            <DialogContent className="max-w-4xl max-h-[85vh]">
              <DialogHeader>
                <DialogTitle className="text-primary text-xl">Partner Rank Progression</DialogTitle>
                <DialogDescription>
                  Your journey from Recruit to Partner Pro
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
                  {(['Recruit', 'Apprentice', 'Agent', 'Partner', 'Verified', 'Partner Pro'] as PartnerRank[]).map((rank, index) => {
                    const rankInfo = RANK_INFO[rank];
                    const isCurrentRank = sellerData?.current_rank === rank;
                    const isUnlocked = (sellerData?.current_xp || 0) >= rankInfo.xpThreshold;
                    const nextRank = index < 5 ? (['Recruit', 'Apprentice', 'Agent', 'Partner', 'Verified', 'Partner Pro'] as PartnerRank[])[index + 1] : null;
                    const xpToNext = nextRank ? RANK_INFO[nextRank].xpThreshold - rankInfo.xpThreshold : 0;
                    
                    return (
                      <Card 
                        key={rank} 
                        className={`relative border-2 transition-all hover:shadow-lg ${
                          isCurrentRank 
                            ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-primary/20 shadow-lg' 
                            : isUnlocked 
                              ? 'border-green-500/50 bg-gradient-to-br from-green-500/10 to-green-500/5' 
                              : 'border-border bg-muted/20 opacity-75'
                        }`}
                      >
                        <CardContent className="p-5">
                          {/* Rank Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-lg ${
                                isCurrentRank 
                                  ? 'bg-primary/20' 
                                  : isUnlocked 
                                    ? 'bg-green-500/20' 
                                    : 'bg-muted'
                              }`}>
                                <Trophy className={`w-5 h-5 ${
                                  isCurrentRank 
                                    ? 'text-primary' 
                                    : isUnlocked 
                                      ? 'text-green-500' 
                                      : 'text-muted-foreground'
                                }`} />
                              </div>
                              <div>
                                <h3 className={`text-lg font-bold ${
                                  isCurrentRank 
                                    ? 'text-primary' 
                                    : isUnlocked 
                                      ? 'text-green-500' 
                                      : 'text-muted-foreground'
                                }`}>
                                  {rank}
                                </h3>
                                {isCurrentRank && (
                                  <Badge variant="default" className="mt-1 text-xs">Current Rank</Badge>
                                )}
                                {isUnlocked && !isCurrentRank && (
                                  <Badge variant="outline" className="mt-1 text-xs text-green-500 border-green-500">Unlocked</Badge>
                                )}
                              </div>
                            </div>
                            {index < 5 && (
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground mb-1">Next Rank</div>
                                <div className="text-lg font-bold text-primary">{xpToNext.toLocaleString()} XP</div>
                              </div>
                            )}
                          </div>

                          {/* Rank Details */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                              <span className="text-sm text-muted-foreground">XP Required</span>
                              <span className="text-sm font-semibold text-foreground">{rankInfo.xpThreshold.toLocaleString()} XP</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                              <span className="text-sm text-muted-foreground">Commission</span>
                              <span className="text-sm font-bold text-primary">{rankInfo.commissionRate}%</span>
                            </div>

                            {rankInfo.unlocks.length > 0 && (
                              <div className="pt-2 border-t border-border">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">Unlocks:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {rankInfo.unlocks.map((unlock) => (
                                    <Badge 
                                      key={unlock} 
                                      variant="secondary" 
                                      className="text-xs px-2 py-0.5"
                                    >
                                      {unlock.replace(/_/g, ' ')}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Progress Indicator */}
                          {index < 5 && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                <span>Progress to</span>
                                <span className="font-semibold text-foreground">
                                  {(['Recruit', 'Apprentice', 'Agent', 'Partner', 'Verified', 'Partner Pro'] as PartnerRank[])[index + 1]}
                                </span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* XP Notification */}
          {xpNotification && (
            <div className="fixed top-20 right-4 z-50 animate-bounce">
              <Card className="bg-primary text-primary-foreground border-primary shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    <div>
                      <p className="font-bold">+{xpNotification.xp} XP</p>
                      <p className="text-sm opacity-90">{xpNotification.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="bg-card border-border">
            <CardContent className="pt-4 sm:pt-6">
              {/* Mobile Select Navigation */}
              <div className="md:hidden mb-4">
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {isTabUnlocked('getting_started', sellerData?.current_rank || 'Recruit') && (
                      <SelectItem value="getting-started">Getting Started</SelectItem>
                    )}
                    <SelectItem value="overview">Overview</SelectItem>
                    {(isTabUnlocked('clients_real', sellerData?.current_rank || 'Recruit') || isTabUnlocked('clients_demo', sellerData?.current_rank || 'Recruit')) && (
                      <SelectItem value="clients">Clients</SelectItem>
                    )}
                    {isTabUnlocked('automations_view', sellerData?.current_rank || 'Recruit') && (
                      <SelectItem value="automations">Automations</SelectItem>
                    )}
                    {isTabUnlocked('sales_scripts', sellerData?.current_rank || 'Recruit') && (
                      <SelectItem value="sales-scripts">Sales Scripts</SelectItem>
                    )}
                    {isTabUnlocked('deal_tracking', sellerData?.current_rank || 'Recruit') && (
                      <SelectItem value="deal-tracking">Deal Tracking</SelectItem>
                    )}
                    {isTabUnlocked('earnings', sellerData?.current_rank || 'Recruit') && (
                      <SelectItem value="earnings">Earnings</SelectItem>
                    )}
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop Tabs Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="hidden md:grid w-full grid-cols-8 mb-6 h-auto p-1 bg-muted/50 gap-1">
                  {isTabUnlocked('getting_started', sellerData?.current_rank || 'Recruit') ? (
                    <TabsTrigger value="getting-started" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                      <BookOpen className="w-4 h-4" />
                      <span>Getting Started</span>
                    </TabsTrigger>
                  ) : (
                    <div className="flex items-center justify-center gap-2 opacity-50 cursor-not-allowed relative group">
                      <BookOpen className="w-4 h-4" />
                      <span>Getting Started</span>
                      <Lock className="w-3 h-3 absolute -top-1 -right-1" />
                      {(() => {
                        const req = getTabUnlockRequirement('getting_started');
                        return req && (
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-popover text-popover-foreground p-2 rounded text-xs shadow-lg z-10 whitespace-nowrap">
                            Unlock at {req.rank} ({req.xp} XP)
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  <TabsTrigger value="overview" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Overview</span>
                  </TabsTrigger>
                  {(isTabUnlocked('clients_real', sellerData?.current_rank || 'Recruit') || isTabUnlocked('clients_demo', sellerData?.current_rank || 'Recruit')) ? (
                    <TabsTrigger value="clients" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                      <Building2 className="w-4 h-4" />
                      <span>Clients</span>
                    </TabsTrigger>
                  ) : (
                    <div className="flex items-center justify-center gap-2 opacity-50 cursor-not-allowed relative group">
                      <Building2 className="w-4 h-4" />
                      <span>Clients</span>
                      <Lock className="w-3 h-3 absolute -top-1 -right-1" />
                      {(() => {
                        const req = getTabUnlockRequirement('clients_demo');
                        return req && (
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-popover text-popover-foreground p-2 rounded text-xs shadow-lg z-10 whitespace-nowrap">
                            Unlock at {req.rank} ({req.xp} XP)
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {isTabUnlocked('automations_view', sellerData?.current_rank || 'Recruit') ? (
                    <TabsTrigger value="automations" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                      <Boxes className="w-4 h-4" />
                      <span>Automations</span>
                    </TabsTrigger>
                  ) : (
                    <div className="flex items-center justify-center gap-2 opacity-50 cursor-not-allowed relative group">
                      <Boxes className="w-4 h-4" />
                      <span>Automations</span>
                      <Lock className="w-3 h-3 absolute -top-1 -right-1" />
                      {(() => {
                        const req = getTabUnlockRequirement('automations_view');
                        return req && (
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-popover text-popover-foreground p-2 rounded text-xs shadow-lg z-10 whitespace-nowrap">
                            Unlock at {req.rank} ({req.xp} XP)
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {isTabUnlocked('sales_scripts', sellerData?.current_rank || 'Recruit') ? (
                    <TabsTrigger value="sales-scripts" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                      <FileText className="w-4 h-4" />
                      <span>Scripts</span>
                    </TabsTrigger>
                  ) : (
                    <div className="flex items-center justify-center gap-2 opacity-50 cursor-not-allowed relative group">
                      <FileText className="w-4 h-4" />
                      <span>Scripts</span>
                      <Lock className="w-3 h-3 absolute -top-1 -right-1" />
                      {(() => {
                        const req = getTabUnlockRequirement('sales_scripts');
                        return req && (
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-popover text-popover-foreground p-2 rounded text-xs shadow-lg z-10 whitespace-nowrap">
                            Unlock at {req.rank} ({req.xp} XP)
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {isTabUnlocked('deal_tracking', sellerData?.current_rank || 'Recruit') ? (
                    <TabsTrigger value="deal-tracking" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                      <Target className="w-4 h-4" />
                      <span>Deals</span>
                    </TabsTrigger>
                  ) : (
                    <div className="flex items-center justify-center gap-2 opacity-50 cursor-not-allowed relative group">
                      <Target className="w-4 h-4" />
                      <span>Deals</span>
                      <Lock className="w-3 h-3 absolute -top-1 -right-1" />
                      {(() => {
                        const req = getTabUnlockRequirement('deal_tracking');
                        return req && (
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-popover text-popover-foreground p-2 rounded text-xs shadow-lg z-10 whitespace-nowrap">
                            Unlock at {req.rank} ({req.xp} XP)
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {isTabUnlocked('earnings', sellerData?.current_rank || 'Recruit') ? (
                    <TabsTrigger value="earnings" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                      <CreditCard className="w-4 h-4" />
                      <span>Earnings</span>
                    </TabsTrigger>
                  ) : (
                    <div className="flex items-center justify-center gap-2 opacity-50 cursor-not-allowed relative group">
                      <CreditCard className="w-4 h-4" />
                      <span>Earnings</span>
                      <Lock className="w-3 h-3 absolute -top-1 -right-1" />
                      {(() => {
                        const req = getTabUnlockRequirement('earnings');
                        return req && (
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-popover text-popover-foreground p-2 rounded text-xs shadow-lg z-10 whitespace-nowrap">
                            Unlock at {req.rank} ({req.xp} XP)
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  <TabsTrigger value="support" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
                    <Ticket className="w-4 h-4" />
                    <span>Support</span>
                  </TabsTrigger>
                </TabsList>

                {/* Getting Started Tab */}
                <TabsContent value="getting-started" className="space-y-4 sm:space-y-6 min-h-[400px] sm:min-h-[500px]">
                  {/* Daily Tasks Section */}
                  <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg text-primary flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Daily Tasks & Challenges
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Complete daily tasks to earn XP and maintain your streak
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-4 bg-background rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm">Login Streak</span>
                            <Badge variant="outline">{sellerData?.login_streak || 0} days</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {sellerData?.login_streak && sellerData.login_streak >= 3 
                              ? `Keep it up! ${sellerData.login_streak >= 7 ? '7+ day streak bonus active!' : '3+ day streak bonus active!'}`
                              : 'Log in daily to build your streak and earn bonuses'}
                          </p>
                        </div>
                        <div className="p-4 bg-background rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm">Weekly XP Progress</span>
                            <Badge variant="outline">
                              {sellerData?.weekly_xp || 0} / {sellerData?.current_rank === 'Partner Pro' ? '3000' : '2000'} XP
                            </Badge>
                          </div>
                          <Progress 
                            value={((sellerData?.weekly_xp || 0) / (sellerData?.current_rank === 'Partner Pro' ? 3000 : 2000)) * 100} 
                            className="h-2 mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {sellerData?.weekly_xp && sellerData.weekly_xp >= (sellerData.current_rank === 'Partner Pro' ? 3000 : 2000)
                              ? 'Weekly cap reached! New XP available Monday.'
                              : 'Complete tasks to earn more XP this week'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Active Challenges */}
                  {activeChallenges.length > 0 && (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base sm:text-lg text-primary">Weekly Challenges</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                              Week {currentWeek} of 4 • Complete challenges to earn bonus XP
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="text-primary border-primary">
                            Week {currentWeek}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {activeChallenges.map((challenge) => {
                            const isCompleted = challengeProgress.get(challenge.id) || false;
                            return (
                              <Card 
                                key={challenge.id} 
                                className={`bg-muted/20 border-border ${isCompleted ? 'border-primary/50' : ''}`}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-primary">
                                          {challenge.challenge_type}
                                        </Badge>
                                        <span className="font-semibold text-sm">{challenge.title}</span>
                                        {isCompleted && (
                                          <Badge variant="default" className="bg-primary text-primary-foreground">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Completed
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground mb-2">{challenge.description}</p>
                                      <p className="text-xs font-medium text-primary">
                                        Reward: +{challenge.xp_reward} XP
                                      </p>
                                    </div>
                                    {isCompleted && (
                                      <div className="shrink-0">
                                        <CheckCircle className="w-6 h-6 text-primary" />
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Badges Collection */}
                  {earnedBadges.length > 0 && (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg text-primary">Your Badges</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Earned achievements and milestones
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {earnedBadges.map((earning) => (
                            <Card key={earning.id} className="bg-muted/20 border-border text-center p-3">
                              <div className="text-2xl mb-1">{earning.badge?.badge_icon || '🏅'}</div>
                              <p className="text-xs font-semibold">{earning.badge?.badge_name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(earning.earned_at).toLocaleDateString()}
                              </p>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Current Stage Lessons */}
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg text-primary">Your Learning Journey</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Complete courses, quizzes, and tasks for your current rank to progress
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingLessons ? (
                        <div className="space-y-6">
                          {/* Loading skeleton for stages */}
                          {[1, 2].map((stage) => (
                            <div key={stage} className="space-y-3">
                              <div className="flex items-center gap-2 pb-2 border-b border-border">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-5 w-24" />
                              </div>
                              <div className="space-y-2">
                                {[1, 2, 3].map((item) => (
                                  <div key={item} className="border border-border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                      <Skeleton className="w-5 h-5 rounded-full" />
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Skeleton className="h-5 w-48" />
                                          <Skeleton className="h-5 w-16" />
                                          <Skeleton className="h-5 w-20" />
                                        </div>
                                        <Skeleton className="h-4 w-32" />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : lessons.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No lessons available
                        </div>
                      ) : (() => {
                        // Filter lessons to only show current rank and next rank
                        const currentRank = sellerData?.current_rank || 'Recruit';
                        const rankOrder = ['Recruit', 'Apprentice', 'Agent', 'Partner', 'Verified', 'Partner Pro'];
                        const currentRankIndex = rankOrder.indexOf(currentRank);
                        const nextRank = currentRankIndex < rankOrder.length - 1 ? rankOrder[currentRankIndex + 1] : null;
                        
                        const filteredLessons = lessons.filter(lesson => 
                          lesson.rank_required === currentRank || 
                          (nextRank && lesson.rank_required === nextRank)
                        );
                        
                        // Group by stage
                        const lessonsByStage = filteredLessons.reduce((acc, lesson) => {
                          if (!acc[lesson.stage]) acc[lesson.stage] = [];
                          acc[lesson.stage].push(lesson);
                          return acc;
                        }, {} as Record<number, PartnerLesson[]>);
                        
                        return (
                          <div className="space-y-6">
                            {Object.entries(lessonsByStage).map(([stage, stageLessons]) => (
                              <div key={stage} className="space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-border">
                                  <h3 className="font-semibold text-sm">Stage {stage}</h3>
                                  <Badge variant="outline">
                                    {stageLessons[0]?.rank_required}
                                  </Badge>
                                </div>
                                <Accordion 
                                  type="single" 
                                  collapsible 
                                  className="w-full"
                                  value={expandedLessonId}
                                  onValueChange={(value) => setExpandedLessonId(value)}
                                >
                                  {stageLessons.map((lesson) => {
                                    const isCompleted = completedLessons.has(lesson.id);
                                    const canAccess = sellerData?.current_rank === lesson.rank_required || 
                                      (sellerData?.current_xp || 0) >= (lesson.rank_required === 'Recruit' ? 0 : 
                                      lesson.rank_required === 'Apprentice' ? 1000 :
                                      lesson.rank_required === 'Agent' ? 2500 :
                                      lesson.rank_required === 'Partner' ? 4500 :
                                      lesson.rank_required === 'Verified' ? 7000 : 10000);
                                    
                                    // Don't show lessons from future ranks
                                    if (!canAccess && sellerData?.current_rank !== lesson.rank_required) {
                                      return null;
                                    }
                                    
                                    return (
                                      <AccordionItem key={lesson.id} value={lesson.id} className="border-border" id={`lesson-${lesson.id}`}>
                                        <AccordionTrigger className="hover:no-underline">
                                          <div className="flex items-center gap-3 flex-1">
                                            {isCompleted ? (
                                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            ) : (
                                              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                            )}
                                            <div className="text-left flex-1">
                                              <div className="flex items-center gap-2">
                                                <span className="font-semibold">{lesson.title}</span>
                                                <Badge variant={lesson.lesson_type === 'course' ? 'default' : lesson.lesson_type === 'quiz' ? 'secondary' : 'outline'}>
                                                  {lesson.lesson_type}
                                                </Badge>
                                                {lesson.xp_reward > 0 && (
                                                  <Badge variant="outline" className="text-primary">
                                                    +{lesson.xp_reward} XP
                                                  </Badge>
                                                )}
                                              </div>
                                              <p className="text-xs text-muted-foreground mt-1">
                                                Stage {lesson.stage} • {lesson.rank_required}
                                              </p>
                                            </div>
                                          </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                          <div className="pt-4 space-y-4">
                                            {/* Only show content if it's NOT a popup-style course */}
                                            {lesson.content && !(lesson.title === 'Understanding Automations' || lesson.title === 'The 6 Default Automations' || lesson.title === 'Sales Basics for Automation Partners' || lesson.title === 'How to Manage Clients') && (
                                              <div 
                                                className="prose prose-sm dark:prose-invert max-w-none text-foreground"
                                                style={{ 
                                                  '--tw-prose-headings': 'rgb(var(--primary))',
                                                  '--tw-prose-bold': 'rgb(var(--primary))',
                                                } as React.CSSProperties}
                                                dangerouslySetInnerHTML={{
                                                  __html: markdownToHtml(typeof lesson.content === 'string' ? lesson.content : String(lesson.content || ''))
                                                }}
                                              />
                                            )}
                                            
                                            {/* Show preview text for Sales Basics course */}
                                            {lesson.content && lesson.title === 'Sales Basics for Automation Partners' && (
                                              <div className="p-4 bg-muted/50 rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-2">
                                                  Master the art of selling automations! Learn how to handle objections, position ROI, and craft effective outreach messages. Click "View Course" to start the interactive course.
                                                </p>
                                              </div>
                                            )}
                                            
                                            {/* Show preview text for How to Manage Clients course */}
                                            {lesson.content && lesson.title === 'How to Manage Clients' && (
                                              <div className="p-4 bg-muted/50 rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-2">
                                                  Learn how to add clients, assign automations, and track the setup process. Master client management with our interactive course!
                                                </p>
                                              </div>
                                            )}
                                            
                                            {/* Show preview text for popup courses */}
                                            {lesson.content && (lesson.title === 'Understanding Automations' || lesson.title === 'The 6 Default Automations') && (
                                              <div className="p-4 bg-muted/50 rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-2">
                                                  Learn about the 6 default automations, pricing structure, and how automations are delivered. Click "View Course" to start the interactive course.
                                                </p>
                                              </div>
                                            )}
                                            
                                            {lesson.lesson_type === 'course' && (
                                              <div className="space-y-2">
                                                {lesson.title === 'Understanding Automations' || lesson.title === 'The 6 Default Automations' || lesson.title === 'Sales Basics for Automation Partners' || lesson.title === 'How to Manage Clients' ? (
                                                  <>
                                                    <Button
                                                      onClick={() => {
                                                        setSelectedCourse(lesson);
                                                        setCurrentCourseSlide(0);
                                                        setShowCourseDialog(true);
                                                      }}
                                                      disabled={!canAccess}
                                                      className="w-full"
                                                      variant="outline"
                                                    >
                                                      <BookOpen className="w-4 h-4 mr-2" />
                                                      View Course
                                                    </Button>
                                                    {lesson.quiz_questions && (
                                                      <Button
                                                        onClick={() => handleCompleteLesson(lesson)}
                                                        disabled={isCompleted || !canAccess}
                                                        className="w-full"
                                                      >
                                                        {isCompleted ? 'Quiz Completed' : 'Take Quiz'}
                                                      </Button>
                                                    )}
                                                  </>
                                                ) : (
                                                  <>
                                                    {lesson.content && (
                                                      <div 
                                                        className="prose prose-sm dark:prose-invert max-w-none text-foreground mb-4"
                                                        style={{ 
                                                          '--tw-prose-headings': 'rgb(var(--primary))',
                                                          '--tw-prose-bold': 'rgb(var(--primary))',
                                                        } as React.CSSProperties}
                                                        dangerouslySetInnerHTML={{
                                                          __html: markdownToHtml(typeof lesson.content === 'string' ? lesson.content : String(lesson.content || ''))
                                                        }}
                                                      />
                                                    )}
                                                    {lesson.quiz_questions && (
                                                      <Button
                                                        onClick={() => handleCompleteLesson(lesson)}
                                                        disabled={isCompleted || !canAccess}
                                                        className="w-full"
                                                      >
                                                        {isCompleted ? 'Quiz Completed' : 'Take Quiz'}
                                                      </Button>
                                                    )}
                                                  </>
                                                )}
                                              </div>
                                            )}
                                            
                                            {lesson.lesson_type === 'task' && (
                                              <div className="space-y-4">
                                                {lesson.title === 'Automation Matching Game' && (
                                          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                                            {/* Only show instruction if not in content */}
                                            {lesson.content && !lesson.content.includes('Match each automation') && (
                                              <p className="text-sm text-muted-foreground mb-4">
                                                {lesson.content}
                                              </p>
                                            )}
                                            {lesson.quiz_questions && Array.isArray(lesson.quiz_questions) ? (
                                              <div className="space-y-6">
                                                {lesson.quiz_questions.map((question: any, qIndex: number) => {
                                                  const selectedAnswer = quizAnswers[qIndex];
                                                  const isCorrect = selectedAnswer === String(question.correct);
                                                  const automationName = question.question.replace(' → ?', '').trim();
                                                  
                                                  return (
                                                    <Card key={qIndex} className={`bg-card border-border ${isCompleted && selectedAnswer !== undefined ? (isCorrect ? 'border-green-500/50' : 'border-red-500/50') : ''}`}>
                                                      <CardContent className="p-4">
                                                        <div className="space-y-4">
                                                          <div className="flex items-center gap-2 mb-3">
                                                            <Badge variant="outline" className="text-primary">
                                                              Match {qIndex + 1}
                                                            </Badge>
                                                            <p className="font-semibold text-sm text-primary">{automationName}</p>
                                                          </div>
                                                          
                                                          {/* Automation Card */}
                                                          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 mb-3">
                                                            <p className="font-medium text-sm">{automationName}</p>
                                                          </div>
                                                          
                                                          {/* Industry Options - Clickable Cards */}
                                                          <div className="grid grid-cols-2 gap-2">
                                                            {question.options && question.options.map((option: string, optIndex: number) => {
                                                              const isSelected = selectedAnswer === String(optIndex);
                                                              const isCorrectOption = optIndex === question.correct;
                                                              
                                                              return (
                                                                <button
                                                                  key={optIndex}
                                                                  onClick={() => {
                                                                    if (!isCompleted) {
                                                                      setQuizAnswers(prev => ({ ...prev, [qIndex]: String(optIndex) }));
                                                                    }
                                                                  }}
                                                                  disabled={isCompleted}
                                                                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                                                                    isCompleted && isSelected
                                                                      ? isCorrectOption
                                                                        ? 'border-green-500 bg-green-500/20'
                                                                        : 'border-red-500 bg-red-500/20'
                                                                      : isSelected && !isCompleted
                                                                      ? 'border-primary bg-primary/10'
                                                                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                                                  } ${isCompleted ? 'cursor-default' : 'cursor-pointer'}`}
                                                                >
                                                                  <div className="flex items-center justify-between">
                                                                    <span className="text-sm font-medium">{option}</span>
                                                                    {isCompleted && isSelected && (
                                                                      <span className={`text-xs ${isCorrectOption ? 'text-green-400' : 'text-red-400'}`}>
                                                                        {isCorrectOption ? '✓' : '✗'}
                                                                      </span>
                                                                    )}
                                                                  </div>
                                                                </button>
                                                              );
                                                            })}
                                                          </div>
                                                          
                                                          {isCompleted && (
                                                            <div className={`p-2 rounded text-xs ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                              {isCorrect ? '✓ Correct match!' : `✗ Incorrect. Correct match: ${question.options[question.correct]}`}
                                                            </div>
                                                          )}
                                                        </div>
                                                      </CardContent>
                                                    </Card>
                                                  );
                                                })}
                                                
                                                {!isCompleted && (
                                                  <Button
                                                    onClick={async () => {
                                                      if (!lesson.quiz_questions) return;
                                                      
                                                      // Check if all questions are answered
                                                      const allAnswered = lesson.quiz_questions.every((_: any, index: number) => quizAnswers[index] !== undefined);
                                                      
                                                      if (!allAnswered) {
                                                        toast({
                                                          title: "Complete All Matches",
                                                          description: "Please match all automations before submitting.",
                                                          variant: "destructive",
                                                        });
                                                        return;
                                                      }
                                                      
                                                      let correctCount = 0;
                                                      lesson.quiz_questions.forEach((q: any, index: number) => {
                                                        if (quizAnswers[index] === String(q.correct)) {
                                                          correctCount++;
                                                        }
                                                      });
                                                      
                                                      const score = Math.round((correctCount / lesson.quiz_questions.length) * 100);
                                                      const passingScore = 80;
                                                      
                                                      if (score >= passingScore) {
                                                        await handleCompleteLesson(lesson);
                                                      } else {
                                                        toast({
                                                          title: "Not Quite!",
                                                          description: `You got ${correctCount}/${lesson.quiz_questions.length} correct. You need ${passingScore}% to pass.`,
                                                          variant: "destructive",
                                                        });
                                                      }
                                                    }}
                                                    disabled={Object.keys(quizAnswers).length < lesson.quiz_questions.length || submittingQuiz}
                                                    className="w-full"
                                                  >
                                                    {submittingQuiz ? 'Submitting...' : `Submit Matching Game & Earn ${lesson.xp_reward} XP`}
                                                  </Button>
                                                )}
                                              </div>
                                            ) : (
                                              <p className="text-sm text-muted-foreground">Loading matching game...</p>
                                            )}
                                          </div>
                                        )}
                                        
                                                {lesson.title === 'Automation Preview' && (
                                          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                            <div>
                                              <p className="text-sm text-muted-foreground mb-1">
                                                View at least 3 automations in the Automations tab to earn {lesson.xp_reward} XP.
                                              </p>
                                              <div className="flex items-center gap-2 mt-2">
                                                <Progress 
                                                  value={(viewedAutomations.size / 3) * 100} 
                                                  className="h-2 flex-1"
                                                />
                                                <span className="text-xs font-semibold text-primary whitespace-nowrap">
                                                  {viewedAutomations.size} / 3 viewed
                                                </span>
                                              </div>
                                            </div>
                                            <Button
                                              onClick={() => {
                                                if (isTabUnlocked('automations_view', sellerData?.current_rank || 'Recruit')) {
                                                  setActiveTab('automations');
                                                  setExpandedLessonId(undefined);
                                                  // Scroll to top and ensure tab is visible
                                                  setTimeout(() => {
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    // Force tab to be visible by scrolling to tab bar
                                                    const tabBar = document.querySelector('[role="tablist"]');
                                                    if (tabBar) {
                                                      tabBar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                                    }
                                                  }, 100);
                                                } else {
                                                  toast({
                                                    title: "Locked",
                                                    description: "Complete previous lessons to unlock automations",
                                                    variant: "destructive",
                                                  });
                                                }
                                              }}
                                              variant="outline"
                                              size="sm"
                                              disabled={!isTabUnlocked('automations_view', sellerData?.current_rank || 'Recruit')}
                                              className="w-full"
                                            >
                                              View Automations
                                            </Button>
                                          </div>
                                        )}
                                        
                                                {lesson.title === 'Suggest New Automation' && (
                                          <div className="space-y-3">
                                            <div className="space-y-2">
                                              <Label>Automation Title *</Label>
                                              <Input
                                                value={suggestionTitle}
                                                onChange={(e) => setSuggestionTitle(e.target.value)}
                                                placeholder="e.g., Customer Feedback Collector"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Problem It Solves *</Label>
                                              <Textarea
                                                value={suggestionProblem}
                                                onChange={(e) => setSuggestionProblem(e.target.value)}
                                                placeholder="Describe what business problem this automation solves..."
                                                rows={4}
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Estimated Client Type</Label>
                                              <Input
                                                value={suggestionClientType}
                                                onChange={(e) => setSuggestionClientType(e.target.value)}
                                                placeholder="e.g., E-commerce, SaaS, Agencies"
                                              />
                                            </div>
                                            <Button
                                              onClick={handleSubmitSuggestion}
                                              disabled={submittingSuggestion || isCompleted || !canAccess}
                                              className="w-full"
                                            >
                                              {submittingSuggestion ? 'Submitting...' : isCompleted ? 'Submitted' : `Submit & Earn ${lesson.xp_reward} XP`}
                                            </Button>
                                          </div>
                                        )}
                                        
                                                {lesson.title === 'Create Your Sales Script' && (
                                          <div className="space-y-3">
                                            <div className="space-y-2">
                                              <Label>Choose Template</Label>
                                              <Select value={salesScriptTemplate} onValueChange={setSalesScriptTemplate}>
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Select a template" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="conversational">Conversational DM Script</SelectItem>
                                                  <SelectItem value="email">Professional Email Template</SelectItem>
                                                  <SelectItem value="pitch">Consultative Pitch Outline</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            {salesScriptTemplate && (
                                              <div className="p-4 bg-muted/50 rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-2">
                                                  {salesScriptTemplate === 'conversational' && 'Hi [Name]! I noticed your business could benefit from automation. Would you be open to a quick chat?'}
                                                  {salesScriptTemplate === 'email' && 'Subject: Automate Your Business Operations\n\nDear [Name],\n\nI help businesses like yours automate repetitive tasks and reduce costs. Would you be interested in learning more?'}
                                                  {salesScriptTemplate === 'pitch' && '1. Identify pain point\n2. Present automation solution\n3. Show ROI\n4. Next steps'}
                                                </p>
                                              </div>
                                            )}
                                            <div className="space-y-2">
                                              <Label>Your Custom Script *</Label>
                                              <Textarea
                                                value={customScript}
                                                onChange={(e) => setCustomScript(e.target.value)}
                                                placeholder="Customize your script here..."
                                                rows={8}
                                              />
                                            </div>
                                            <Button
                                              onClick={handleSaveSalesScript}
                                              disabled={savingScript || !customScript.trim() || isCompleted || !canAccess}
                                              className="w-full"
                                            >
                                              {savingScript ? 'Saving...' : isCompleted ? 'Script Saved' : `Save Script & Earn ${lesson.xp_reward} XP`}
                                            </Button>
                                          </div>
                                        )}
                                        
                                                {lesson.title === 'Log First Outreach in Deal Diary' && (
                                          <div className="p-4 bg-muted/50 rounded-lg">
                                            <p className="text-sm text-muted-foreground mb-2">
                                              Log your first outreach in the Deal Tracking tab to earn {lesson.xp_reward} XP.
                                            </p>
                                            <Button
                                              onClick={() => {
                                                if (isTabUnlocked('deal_tracking', sellerData?.current_rank || 'Recruit')) {
                                                  setActiveTab('deal-tracking');
                                                } else {
                                                  toast({
                                                    title: "Locked",
                                                    description: "Complete previous lessons to unlock deal tracking",
                                                    variant: "destructive",
                                                  });
                                                }
                                              }}
                                              variant="outline"
                                              size="sm"
                                              disabled={!isTabUnlocked('deal_tracking', sellerData?.current_rank || 'Recruit')}
                                            >
                                              Go to Deal Tracking
                                            </Button>
                                          </div>
                                        )}
                                        
                                                {lesson.title === 'Add Demo Client' && (
                                          <div className="space-y-3">
                                            <div className="space-y-2">
                                              <Label>Business Name *</Label>
                                              <Input
                                                value={newDemoClientName}
                                                onChange={(e) => setNewDemoClientName(e.target.value)}
                                                placeholder="e.g., Test Business Inc"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Contact Name *</Label>
                                              <Input
                                                value={newDemoContactName}
                                                onChange={(e) => setNewDemoContactName(e.target.value)}
                                                placeholder="e.g., John Doe"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Contact Email *</Label>
                                              <Input
                                                type="email"
                                                value={newDemoContactEmail}
                                                onChange={(e) => setNewDemoContactEmail(e.target.value)}
                                                placeholder="e.g., test@example.com"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Industry (Optional)</Label>
                                              <Input
                                                value={newDemoIndustry}
                                                onChange={(e) => setNewDemoIndustry(e.target.value)}
                                                placeholder="e.g., E-commerce, SaaS"
                                              />
                                            </div>
                                            <Button
                                              onClick={handleAddDemoClient}
                                              disabled={addingDemoClient || isCompleted || !canAccess}
                                              className="w-full"
                                            >
                                              {addingDemoClient ? 'Adding...' : isCompleted ? 'Added' : `Add Demo Client & Earn ${lesson.xp_reward} XP`}
                                            </Button>
                                          </div>
                                        )}
                                        
                                                {lesson.title === 'Assign Demo Automation' && (
                                          <div className="p-4 bg-muted/50 rounded-lg">
                                            <p className="text-sm text-muted-foreground mb-2">
                                              Assign an automation to a demo client in the Clients tab to earn {lesson.xp_reward} XP.
                                            </p>
                                            <Button
                                              onClick={() => {
                                                if (isTabUnlocked('clients_demo', sellerData?.current_rank || 'Recruit')) {
                                                  setActiveTab('clients');
                                                } else {
                                                  toast({
                                                    title: "Locked",
                                                    description: "Complete previous lessons to unlock clients",
                                                    variant: "destructive",
                                                  });
                                                }
                                              }}
                                              variant="outline"
                                              size="sm"
                                              disabled={!isTabUnlocked('clients_demo', sellerData?.current_rank || 'Recruit')}
                                            >
                                              Go to Clients
                                            </Button>
                                          </div>
                                        )}
                                        
                                                {lesson.title === 'Pitch Reflection' && (
                                          <div className="space-y-3">
                                            <div className="space-y-2">
                                              <Label>Your Pitch Reflection *</Label>
                                              <Textarea
                                                value={pitchReflection}
                                                onChange={(e) => setPitchReflection(e.target.value)}
                                                placeholder="What did you say to your test client? What worked well? What would you do differently?"
                                                rows={6}
                                              />
                                            </div>
                                            <Button
                                              onClick={handleSubmitPitchReflection}
                                              disabled={submittingPitchReflection || isCompleted || !canAccess}
                                              className="w-full"
                                            >
                                              {submittingPitchReflection ? 'Submitting...' : isCompleted ? 'Submitted' : `Submit Reflection & Earn ${lesson.xp_reward} XP`}
                                            </Button>
                                          </div>
                                        )}
                                        
                                                {lesson.title === 'Invite a Friend' && (
                                          <div className="p-4 bg-muted/50 rounded-lg">
                                            <p className="text-sm text-muted-foreground mb-2">
                                              Share your <strong>partner referral link</strong> with a friend. When they sign up as a partner using your link and get approved, you'll earn {lesson.xp_reward} XP!
                                            </p>
                                            <div className="space-y-2">
                                              <div className="p-3 bg-background rounded-lg border border-border font-mono text-xs overflow-x-auto">
                                                {window.location.origin}/partners?ref={sellerData?.referral_code || "YOUR-CODE"}
                                              </div>
                                              <div className="flex gap-2">
                                                <Button
                                                  onClick={() => {
                                                    copyReferralLink('partner');
                                                    toast({
                                                      title: "Partner Referral Link Copied!",
                                                      description: "Share this link with potential partners to earn XP!",
                                                    });
                                                  }}
                                                  variant="outline"
                                                  size="sm"
                                                  className="flex-1"
                                                >
                                                  <Copy className="w-4 h-4 mr-2" />
                                                  Copy Link
                                                </Button>
                                                <Button
                                                  onClick={checkReferredPartners}
                                                  disabled={checkingReferrals || isCompleted}
                                                  variant="outline"
                                                  size="sm"
                                                  className="flex-1"
                                                >
                                                  <RefreshCw className={`w-4 h-4 mr-2 ${checkingReferrals ? 'animate-spin' : ''}`} />
                                                  {checkingReferrals ? 'Checking...' : 'Check Status'}
                                                </Button>
                                              </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                              <strong>Note:</strong> This link is for referring partners, not clients. Partners who sign up using your link will be tracked, and you'll earn XP when they're approved. Click "Check Status" to see if anyone has signed up using your referral code.
                                            </p>
                                          </div>
                                        )}
                                        
                                                {lesson.title === 'Submit Case Summary' && (
                                          <div className="space-y-3">
                                            <div className="space-y-2">
                                              <Label>Client Name (Optional)</Label>
                                              <Input
                                                value={caseStudyClientName}
                                                onChange={(e) => setCaseStudyClientName(e.target.value)}
                                                placeholder="e.g., ABC Company"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Automation Sold *</Label>
                                              <Input
                                                value={caseStudyAutomation}
                                                onChange={(e) => setCaseStudyAutomation(e.target.value)}
                                                placeholder="e.g., Google Review Booster"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Result Summary *</Label>
                                              <Textarea
                                                value={caseStudyResult}
                                                onChange={(e) => setCaseStudyResult(e.target.value)}
                                                placeholder="Describe the outcomes achieved..."
                                                rows={4}
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Lessons Learned</Label>
                                              <Textarea
                                                value={caseStudyLessons}
                                                onChange={(e) => setCaseStudyLessons(e.target.value)}
                                                placeholder="What did you learn from this sale?"
                                                rows={3}
                                              />
                                            </div>
                                            <Button
                                              onClick={handleSubmitCaseStudy}
                                              disabled={submittingCaseStudy || isCompleted || !canAccess}
                                              className="w-full"
                                            >
                                              {submittingCaseStudy ? 'Submitting...' : isCompleted ? 'Submitted' : `Submit & Earn ${lesson.xp_reward} XP`}
                                            </Button>
                                          </div>
                                        )}
                                              </div>
                                            )}
                                          </div>
                                        </AccordionContent>
                                  </AccordionItem>
                                  );
                                  })}
                                </Accordion>
                                
                                {/* Rank Up Section at End of Learning Journey */}
                                {(() => {
                                  const currentRank = sellerData?.current_rank || 'Recruit';
                                  const hasPartnerPro = sellerData?.partner_pro_subscription_status === 'active';
                                  const isVerifiedRank = currentRank === 'Verified';
                                  const showPartnerProUpgrade = isVerifiedRank && !hasPartnerPro;
                                  const nextRank = getNextRank(currentRank);
                                  
                                  // Show Partner Pro upgrade for Verified rank
                                  if (showPartnerProUpgrade) {
                                    return (
                                      <div className="mt-6 pt-6 border-t border-border">
                                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                              <Zap className="w-5 h-5 text-primary" />
                                              <div>
                                                <h3 className="text-base font-semibold text-primary">
                                                  Upgrade to Partner Pro
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                  Unlock premium features, advanced automations, and exclusive benefits
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                              <Button
                                                onClick={() => navigate('/partner-pro')}
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 sm:flex-none border-primary/50 text-primary hover:bg-primary/10"
                                              >
                                                Find out more
                                              </Button>
                                              <Button
                                                onClick={handlePartnerProCheckout}
                                                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground"
                                                size="sm"
                                              >
                                                <Trophy className="w-4 h-4 mr-2" />
                                                Upgrade - $24.99/mo
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                  
                                  // For other ranks, show normal progression
                                  if (!nextRank) return null;
                                  
                                  const requiredTasks = getTasksForRank(currentRank);
                                  const completedTasks = requiredTasks.filter(taskId => completedLessons.has(taskId));
                                  const allTasksCompleted = requiredTasks.length === 0 || completedTasks.length === requiredTasks.length;
                                  const nextRankThreshold = nextRank ? getRankInfo(nextRank).xpThreshold : 0;
                                  const xpThresholdMet = (sellerData?.current_xp || 0) >= nextRankThreshold;
                                  const canAdvance = allTasksCompleted && xpThresholdMet;
                                  
                                  return (
                                    <div className="mt-6 pt-6 border-t border-border">
                                      <Card className={canAdvance ? "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20" : "bg-muted/20 border-border"}>
                                        <CardContent className="pt-6">
                                          <div className="flex items-start gap-3">
                                            <Trophy className={`w-5 h-5 flex-shrink-0 mt-0.5 ${canAdvance ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <div className="flex-1">
                                              <h3 className={`text-base font-semibold mb-2 ${canAdvance ? 'text-primary' : 'text-foreground'}`}>
                                                {currentRank === 'Verified' && nextRank === 'Partner Pro' ? 'Upgrade to Partner Pro' : `Advance to ${nextRank}`}
                                              </h3>
                                              
                                              {/* XP Requirement Check */}
                                              {!xpThresholdMet && (
                                                <div className="mb-3">
                                                  <div className="flex items-start gap-2 mb-2">
                                                    <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                                    <p className="text-sm text-muted-foreground">
                                                      <strong className="text-primary">Not enough XP:</strong> You need {nextRankThreshold - (sellerData?.current_xp || 0)} more XP to reach {nextRank} rank.
                                                    </p>
                                                  </div>
                                                </div>
                                              )}
                                              
                                              {/* Tasks Requirement Check (only show if XP is met) */}
                                              {xpThresholdMet && !allTasksCompleted && (
                                                <div className="mb-3">
                                                  <div className="flex items-start gap-2 mb-2">
                                                    <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                                                    <p className="text-sm text-muted-foreground">
                                                      <strong className="text-accent">Complete all tasks:</strong> You have enough XP, but you need to complete all {requiredTasks.length} task{requiredTasks.length !== 1 ? 's' : ''} for {currentRank} rank.
                                                    </p>
                                                  </div>
                                                  <p className="text-xs text-muted-foreground ml-6">
                                                    Completed: {completedTasks.length} / {requiredTasks.length} tasks
                                                  </p>
                                                </div>
                                              )}
                                              
                                              {/* Rank Up Button (only show if both requirements met) */}
                                              {canAdvance && (
                                                <div className="mt-4">
                                                  <Button
                                                    onClick={currentRank === 'Verified' && nextRank === 'Partner Pro' ? handlePartnerProCheckout : handleManualRankUp}
                                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                                    size="lg"
                                                  >
                                                    <Trophy className="w-5 h-5 mr-2" />
                                                    {currentRank === 'Verified' && nextRank === 'Partner Pro' ? 'Upgrade to Partner Pro - $24.99/month' : `Advance to ${nextRank}`}
                                                  </Button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  );
                                })()}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="overview" className="space-y-4 sm:space-y-6 min-h-[400px] sm:min-h-[500px]">
                  {/* Referral Links - Only accessible at Partner rank and above */}
                  {isTabUnlocked('referral_link', sellerData?.current_rank || 'Recruit') ? (
                    <>
                      {/* Client Referral Link */}
                      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                        <CardHeader>
                          <CardTitle className="text-base sm:text-lg text-primary flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Client Referral Link
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm">Share this link with potential clients to earn commission</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center mb-3 sm:mb-4">
                            <div className="flex-1 w-full p-3 sm:p-4 md:p-5 bg-background rounded-lg border border-border font-mono text-sm sm:text-base md:text-lg overflow-x-auto">
                              {window.location.origin}/for-businesses?ref={sellerData?.referral_code || "YOUR-CODE"}
                            </div>
                            <Button onClick={() => copyReferralLink('client')} variant="outline" size="icon" className="shrink-0 w-full sm:w-auto h-10 sm:h-11 md:h-12">
                              {copied ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : <Copy className="h-4 w-4 sm:h-5 sm:w-5" />}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Partner Referral Link */}
                      <Card className="bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/20">
                        <CardHeader>
                          <CardTitle className="text-base sm:text-lg text-green-500 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Partner Referral Link
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm">Share this link with potential partners to earn 1,200 XP when they sign up</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center mb-3 sm:mb-4">
                            <div className="flex-1 w-full p-3 sm:p-4 md:p-5 bg-background rounded-lg border border-border font-mono text-sm sm:text-base md:text-lg overflow-x-auto">
                              {window.location.origin}/partners?ref={sellerData?.referral_code || "YOUR-CODE"}
                            </div>
                            <Button onClick={() => copyReferralLink('partner')} variant="outline" size="icon" className="shrink-0 w-full sm:w-auto h-10 sm:h-11 md:h-12">
                              {copied ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : <Copy className="h-4 w-4 sm:h-5 sm:w-5" />}
                            </Button>
                          </div>
                          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-xs text-green-500">
                              <strong>Note:</strong> You'll earn 1,200 XP when someone signs up as a partner using your referral link. This completes the "Invite a Friend" task!
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Referral Code Management */}
                      <Card className="bg-card border-border">
                        <CardContent className="pt-6">
                        
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
                    </>
                  ) : (
                    <Card className="bg-muted/20 border-border relative overflow-hidden">
                      <div className="blur-sm pointer-events-none">
                        <CardHeader>
                          <CardTitle className="text-base sm:text-lg text-primary">Your Referral Link</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">Share this link with potential clients to earn commission</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center mb-3 sm:mb-4">
                            <div className="flex-1 w-full p-3 sm:p-4 md:p-5 bg-background rounded-lg border border-border font-mono text-sm sm:text-base md:text-lg overflow-x-auto">
                              {window.location.origin}/for-businesses?ref=XXXX-XXXX
                            </div>
                            <Button variant="outline" size="icon" className="shrink-0 w-full sm:w-auto h-10 sm:h-11 md:h-12" disabled>
                              <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Your referral code: <span className="font-bold text-primary">XXXX-XXXX</span>
                          </p>
                        </CardContent>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                        <div className="text-center p-6">
                          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <h3 className="text-lg font-semibold mb-2">Referral Link Locked</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Unlock at Partner rank (4,500 XP)
                          </p>
                          <Badge variant="outline" className="text-primary border-primary">
                            Current: {sellerData?.current_rank || 'Recruit'} • {sellerData?.current_xp || 0} XP
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  )}

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
                                    {entry.isCurrentUser ? entry.business_name : maskBusinessName(entry.business_name)}
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
                                  ${entry.total_sales.toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  revenue
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
                  {loadingAutomations ? (
                    <Card className="bg-card border-border">
                      <CardContent className="py-12">
                        <div className="text-center space-y-4">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <p className="text-sm text-muted-foreground">Loading automations...</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : availableAutomations.length > 0 ? (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg text-primary">Available Automations</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Automations you can assign to clients</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 sm:space-y-4">
                          {availableAutomations.map((automation) => (
                            <Card 
                              key={automation.id} 
                              className="bg-muted/20 border-border hover:border-primary/50 transition-all"
                            >
                              <CardContent className="p-3 sm:p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2 mb-1">
                                      <CardTitle className="text-base sm:text-lg text-foreground flex-1">{automation.name}</CardTitle>
                                      {automation.category && (
                                        <Badge variant="secondary" className="shrink-0">{automation.category}</Badge>
                                      )}
                                      {viewedAutomations.has(automation.id) && (
                                        <Badge variant="outline" className="shrink-0 text-xs">
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Viewed
                                        </Badge>
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
                                  {!viewedAutomations.has(automation.id) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        if (!sellerData?.id) {
                                          toast({
                                            title: "Error",
                                            description: "Unable to mark as viewed. Please refresh the page.",
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                        
                                        try {
                                          // Check if already viewed to prevent duplicates
                                          if (viewedAutomations.has(automation.id)) {
                                            toast({
                                              title: "Already Viewed",
                                              description: "This automation has already been marked as viewed.",
                                            });
                                            return;
                                          }

                                          const { error: logError } = await supabase
                                            .from("partner_activity_log")
                                            .insert({
                                              seller_id: sellerData.id,
                                              event_type: "automation_view",
                                              xp_value: 0,
                                              description: `Viewed automation: ${automation.name}`,
                                              metadata: { automation_id: automation.id }
                                            });

                                          if (logError) {
                                            console.error("Error logging automation view:", logError);
                                            toast({
                                              title: "Error",
                                              description: logError.message || "Failed to mark automation as viewed. Please try again.",
                                              variant: "destructive",
                                            });
                                            return;
                                          }

                                          // Update state immediately for UI feedback
                                          // Create a new Set to ensure React detects the change
                                          const updatedViewed = new Set(viewedAutomations);
                                          updatedViewed.add(automation.id);
                                          setViewedAutomations(updatedViewed);
                                          
                                          console.log("Automation marked as viewed:", automation.id, "Total viewed:", updatedViewed.size);
                                          
                                          // Check if this completes the Automation Preview task
                                          const automationPreviewLesson = lessons.find(l => l.title === 'Automation Preview' && l.rank_required === 'Recruit');
                                          if (automationPreviewLesson && !completedLessons.has(automationPreviewLesson.id)) {
                                            if (updatedViewed.size >= 3) {
                                              // Award XP for completing the task
                                              try {
                                                await addXP(automationPreviewLesson.xp_reward, 'task_completed', `Completed: ${automationPreviewLesson.title}`, { 
                                                  lesson_id: automationPreviewLesson.id 
                                                });
                                                setCompletedLessons(prev => new Set([...prev, automationPreviewLesson.id]));
                                                toast({
                                                  title: "Task Completed! 🎉",
                                                  description: `You've viewed 3 automations and earned ${automationPreviewLesson.xp_reward} XP!`,
                                                });
                                                // Refresh progression data to update XP and rank
                                                if (sellerData?.id) {
                                                  await fetchProgressionData(sellerData.id);
                                                }
                                              } catch (error: any) {
                                                console.error("Error completing automation preview task:", error);
                                                toast({
                                                  title: "Error",
                                                  description: "Failed to award XP. Please contact support.",
                                                  variant: "destructive",
                                                });
                                              }
                                            } else {
                                              // Show progress toast
                                              toast({
                                                title: "Automation Viewed ✓",
                                                description: `You've viewed ${updatedViewed.size} of 3 automations. Keep going!`,
                                              });
                                            }
                                          } else {
                                            // Still show success even if task is already completed
                                            toast({
                                              title: "Automation Viewed ✓",
                                              description: "This automation has been marked as viewed.",
                                            });
                                          }
                                        } catch (error: any) {
                                          console.error("Error logging automation view:", error);
                                          toast({
                                            title: "Error",
                                            description: error.message || "Failed to mark automation as viewed",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                      className="shrink-0"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Mark as Viewed
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-card border-border">
                      <CardContent className="py-12">
                        <div className="text-center space-y-4">
                          <Boxes className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">No Automations Available</h3>
                            <p className="text-sm text-muted-foreground">
                              Automations will be assigned to you as you progress through your partner journey.
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Complete the "Automation Preview" task in your Learning Journey to get started!
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Locked Automations Section */}
                  {lockedAutomations.length > 0 && sellerData?.current_rank !== 'Partner Pro' && (
                    <Card className="bg-card border-border border-primary/20">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Lock className="w-5 h-5 text-primary" />
                          <CardTitle className="text-base sm:text-lg text-primary">Premium Automations</CardTitle>
                        </div>
                        <CardDescription className="text-xs sm:text-sm">
                          Unlock exclusive automations by reaching Seller Pro rank
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 sm:space-y-4">
                          {lockedAutomations.map((automation) => (
                            <Card 
                              key={automation.id} 
                              className="bg-muted/10 border-border opacity-75 relative"
                            >
                              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                                <div className="text-center p-4">
                                  <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                                  <p className="text-sm font-semibold text-primary mb-1">Unlock with Seller Pro</p>
                                  <p className="text-xs text-muted-foreground">
                                    Reach 10,000 XP to unlock premium automations
                                  </p>
                                </div>
                              </div>
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
                                        <span className="font-bold text-primary">45%</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {clientAutomations.length > 0 && isTabUnlocked('clients_real', sellerData?.current_rank || 'Recruit') && (
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
                                      ca.setup_status === 'setup_complete' ? 'secondary' :
                                      ca.setup_status === 'setup_in_progress' ? 'secondary' : 'outline'
                                    }
                                    className="text-xs"
                                  >
                                    {ca.setup_status === 'active' ? 'Active' :
                                     ca.setup_status === 'setup_complete' ? 'Setup Complete' :
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
                                ca.setup_status === 'setup_complete' ? 'secondary' :
                                ca.setup_status === 'setup_in_progress' ? 'secondary' : 'outline'
                              }
                            >
                              {ca.setup_status === 'active' ? 'Active' :
                               ca.setup_status === 'setup_complete' ? 'Setup Complete' :
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

                {/* Sales Scripts Tab */}
                <TabsContent value="sales-scripts" className="space-y-4 sm:space-y-6">
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg text-primary">Your Sales Scripts</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Create and customize your sales scripts for different outreach scenarios
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Choose Template</Label>
                          <Select value={salesScriptTemplate} onValueChange={setSalesScriptTemplate}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template to get started" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="conversational">Conversational DM Script</SelectItem>
                              <SelectItem value="email">Professional Email Template</SelectItem>
                              <SelectItem value="pitch">Consultative Pitch Outline</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {salesScriptTemplate && (
                          <Card className="bg-muted/50 border-border">
                            <CardContent className="p-4">
                              <p className="text-sm font-semibold mb-2">Template Preview:</p>
                              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {salesScriptTemplate === 'conversational' && 'Hi [Name]! I noticed your business could benefit from automation. Would you be open to a quick chat about how we can help you save time and reduce costs?'}
                                {salesScriptTemplate === 'email' && 'Subject: Automate Your Business Operations\n\nDear [Name],\n\nI help businesses like yours automate repetitive tasks and reduce costs. Our proven automation solutions can help you:\n\n• Save 10+ hours per week\n• Reduce operational costs\n• Scale without hiring\n\nWould you be interested in a 15-minute call to see if automation could benefit your business?\n\nBest regards,\n[Your Name]'}
                                {salesScriptTemplate === 'pitch' && '1. Identify Pain Point\n   "What tasks take up most of your team\'s time?"\n\n2. Present Solution\n   "We have an automation that can handle [specific task]"\n\n3. Show ROI\n   "This typically saves businesses [X hours/$Y per month]"\n\n4. Next Steps\n   "Would you like to see how this works for your business?"'}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        
                        <div className="space-y-2">
                          <Label>Your Custom Script *</Label>
                          <Textarea
                            value={customScript}
                            onChange={(e) => setCustomScript(e.target.value)}
                            placeholder="Customize your script here. You can use the template above as a starting point or write your own..."
                            rows={12}
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Tip: Personalize your script with placeholders like [Name], [Business], [Pain Point] that you can replace for each client.
                          </p>
                        </div>
                        
                        <Button
                          onClick={handleSaveSalesScript}
                          disabled={savingScript || !customScript.trim()}
                          className="w-full"
                        >
                          {savingScript ? 'Saving...' : customScript ? 'Update Script' : 'Save Script'}
                        </Button>
                        
                        {customScript && (
                          <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="p-4">
                              <p className="text-sm font-semibold text-primary mb-2">Your Saved Script:</p>
                              <div className="text-sm whitespace-pre-wrap bg-background p-3 rounded border border-border">
                                {customScript}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Deal Tracking Tab */}
                <TabsContent value="deal-tracking" className="space-y-4 sm:space-y-6">
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg text-primary">Deal Tracking</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Log your outreach attempts and track your sales pipeline
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Card className="bg-muted/50 border-border">
                        <CardHeader>
                          <CardTitle className="text-sm">Log New Outreach</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Date *</Label>
                              <Input
                                type="date"
                                value={newDealDate}
                                onChange={(e) => setNewDealDate(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Channel *</Label>
                              <Select value={newDealChannel} onValueChange={setNewDealChannel}>
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
                            <Label>Client Name (Optional)</Label>
                            <Input
                              value={newDealClientName}
                              onChange={(e) => setNewDealClientName(e.target.value)}
                              placeholder="e.g., ABC Company"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Status *</Label>
                            <Select value={newDealStatus} onValueChange={setNewDealStatus}>
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
                          
                          <div className="space-y-2">
                            <Label>Reflection / Notes</Label>
                            <Textarea
                              value={newDealReflection}
                              onChange={(e) => setNewDealReflection(e.target.value)}
                              placeholder="What did you learn? What worked well? What would you do differently?"
                              rows={4}
                            />
                          </div>
                          
                          <Button
                            onClick={handleSubmitDeal}
                            disabled={submittingDeal || !newDealDate || !newDealChannel}
                            className="w-full"
                          >
                            {submittingDeal ? 'Logging...' : 'Log Outreach'}
                          </Button>
                        </CardContent>
                      </Card>
                      
                      {dealEntries.length > 0 ? (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm">Your Outreach History</h3>
                          <div className="space-y-2">
                            {dealEntries.map((deal) => (
                              <Card key={deal.id} className="bg-muted/20 border-border">
                                <CardContent className="p-4">
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant={
                                          deal.status === 'success' ? 'default' :
                                          deal.status === 'follow_up' ? 'secondary' :
                                          deal.status === 'closed' ? 'outline' : 'secondary'
                                        }>
                                          {deal.status === 'no_response' ? 'No Response' :
                                           deal.status === 'follow_up' ? 'Follow Up' :
                                           deal.status === 'success' ? 'Success' : 'Closed'}
                                        </Badge>
                                        <span className="text-sm font-medium">{deal.channel}</span>
                                        {deal.client_name && (
                                          <span className="text-sm text-muted-foreground">• {deal.client_name}</span>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(deal.date).toLocaleDateString()}
                                      </p>
                                      {deal.reflection && (
                                        <p className="text-sm mt-2 text-muted-foreground">{deal.reflection}</p>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No outreach logged yet. Start tracking your deals!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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

          {/* Quiz Dialog */}
          <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>{selectedLesson?.title || "Quiz"}</DialogTitle>
                <DialogDescription>
                  Answer the questions below to complete this lesson
                </DialogDescription>
                {/* Progress Bar */}
                {selectedLesson?.quiz_questions && selectedLesson.quiz_questions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Question {currentQuizQuestion + 1} of {selectedLesson.quiz_questions.length}</span>
                      <span>{Math.round(((currentQuizQuestion + 1) / selectedLesson.quiz_questions.length) * 100)}%</span>
                    </div>
                    <Progress 
                      value={((currentQuizQuestion + 1) / selectedLesson.quiz_questions.length) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
              </DialogHeader>
              <ScrollArea className="flex-1 min-h-[300px] max-h-[500px] pr-4">
                {selectedLesson?.quiz_questions && selectedLesson.quiz_questions[currentQuizQuestion] && (() => {
                  const question = selectedLesson.quiz_questions[currentQuizQuestion];
                  const index = currentQuizQuestion;
                  
                  return (
                    <Card className="bg-muted/20 border-border">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="font-semibold text-base">
                            <span className="text-primary">Question {index + 1}: </span>
                            <span dangerouslySetInnerHTML={{
                              __html: (typeof question.question === 'string' ? question.question : String(question.question || ''))
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            }} />
                          </div>
                          
                          {question.type === 'multiple_choice' && question.options ? (
                            <RadioGroup
                              value={quizAnswers[index] || ''}
                              onValueChange={(value) => {
                                setQuizAnswers(prev => ({ ...prev, [index]: value }));
                              }}
                              className="space-y-3"
                            >
                              {question.options.map((option: string, optIndex: number) => {
                                const isSelected = quizAnswers[index] === optIndex.toString();
                                return (
                                  <div key={optIndex} className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                                    isSelected ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
                                  }`}>
                                    <RadioGroupItem value={optIndex.toString()} id={`q${index}-opt${optIndex}`} />
                                    <Label htmlFor={`q${index}-opt${optIndex}`} className="text-sm cursor-pointer flex-1">
                                      <span dangerouslySetInnerHTML={{
                                        __html: (typeof option === 'string' ? option : String(option || ''))
                                          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>')
                                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                      }} />
                                    </Label>
                                  </div>
                                );
                              })}
                            </RadioGroup>
                          ) : question.type === 'text_input' ? (
                            <div className="space-y-2">
                              <Input
                                value={quizAnswers[index] || ''}
                                onChange={(e) => {
                                  setQuizAnswers(prev => ({ ...prev, [index]: e.target.value }));
                                }}
                                placeholder={question.hint || "Type your answer..."}
                                className="text-base"
                              />
                              {question.hint && (
                                <p className="text-xs text-muted-foreground">{question.hint}</p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </ScrollArea>
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowQuizDialog(false);
                    setSelectedLesson(null);
                    setQuizAnswers({});
                    setCurrentQuizQuestion(0);
                  }}
                >
                  Cancel
                </Button>
                <div className="flex gap-2 flex-1">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentQuizQuestion > 0) {
                        setCurrentQuizQuestion(currentQuizQuestion - 1);
                      }
                    }}
                    disabled={currentQuizQuestion === 0}
                  >
                    Back
                  </Button>
                  {selectedLesson?.quiz_questions && currentQuizQuestion < selectedLesson.quiz_questions.length - 1 ? (
                    <Button
                      onClick={() => {
                        if (currentQuizQuestion < (selectedLesson?.quiz_questions?.length || 0) - 1) {
                          setCurrentQuizQuestion(currentQuizQuestion + 1);
                        }
                      }}
                      disabled={!quizAnswers[currentQuizQuestion]}
                      className="flex-1"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmitQuiz}
                      disabled={submittingQuiz || !selectedLesson || !quizAnswers[currentQuizQuestion]}
                      className="flex-1"
                    >
                      {submittingQuiz ? 'Submitting...' : `Submit Quiz & Earn ${selectedLesson?.xp_reward || 0} XP`}
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Course Dialog for Popup-Style Courses (Slide-Based) */}
          {showCourseDialog && selectedCourse && (() => {
            // Parse course content into slides
            const content = typeof selectedCourse.content === 'string' ? selectedCourse.content : String(selectedCourse.content || '');
            const slides: string[] = [];
            
            // Split by major headings (##) to create slides
            if (content.includes('##')) {
              const sections = content.split(/(?=##)/);
              sections.forEach(section => {
                if (section.trim()) {
                  slides.push(section.trim());
                }
              });
            } else {
              // If no ## headings, split by # headings
              const sections = content.split(/(?=# )/);
              sections.forEach(section => {
                if (section.trim()) {
                  slides.push(section.trim());
                }
              });
            }
            
            // If still no slides, use the whole content as one slide
            if (slides.length === 0) {
              slides.push(content);
            }
            
            const totalSlides = slides.length;
            const currentSlideContent = slides[currentCourseSlide] || slides[0];
            
            return (
              <Dialog open={showCourseDialog} onOpenChange={(open) => {
                setShowCourseDialog(open);
                if (!open) {
                  setCurrentCourseSlide(0);
                }
              }}>
                <DialogContent className={`${selectedCourse.title === 'How to Manage Clients' ? 'max-w-5xl' : 'max-w-4xl'} max-h-[90vh] overflow-hidden flex flex-col`}>
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-primary">{selectedCourse.title}</DialogTitle>
                    <DialogDescription>
                      Stage {selectedCourse.stage} • {selectedCourse.rank_required} • {selectedCourse.xp_reward} XP Reward
                    </DialogDescription>
                    {totalSlides > 1 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Progress 
                          value={((currentCourseSlide + 1) / totalSlides) * 100} 
                          className="h-2 flex-1"
                        />
                        <span className="text-xs font-semibold text-primary whitespace-nowrap">
                          Slide {currentCourseSlide + 1} of {totalSlides}
                        </span>
                      </div>
                    )}
                  </DialogHeader>
                  <ScrollArea className="flex-1 pr-4">
                    {selectedCourse.title === 'How to Manage Clients' ? (
                      <div className="py-4 space-y-4">
                        {/* Slide 1: Welcome */}
                        {currentCourseSlide === 0 && (
                          <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30">
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/20 rounded-lg">
                                  <Users className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                  <h3 className="text-2xl font-semibold mb-2">Welcome to Client Management</h3>
                                  <p className="text-base text-muted-foreground mb-4">
                                    Master the client management system and learn how to assign automations effectively.
                                  </p>
                                  <p className="text-lg font-medium text-primary">
                                    Practice makes perfect! 🎯
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Slide 2: Demo vs Real Clients */}
                        {currentCourseSlide === 1 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                Demo vs Real Clients
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-blue-500" />
                                    Demo Clients
                                  </h4>
                                  <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                      <span>Practice with fake data</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                      <span>Learn the system safely</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                      <span>No real consequences</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                      <span>Marked with demo flag</span>
                                    </li>
                                  </ul>
                                </div>
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Real Clients
                                  </h4>
                                  <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                      <span>Actual businesses</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                      <span>Real transactions</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                      <span>Earn real commissions</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                      <span>Start here after practice</span>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                <p className="text-sm font-semibold text-primary">
                                  Always start with demo clients to learn the system!
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Slide 3: Adding a Client */}
                        {currentCourseSlide === 2 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Adding a Client
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="p-4 bg-muted/50 rounded-lg border">
                                <p className="font-semibold mb-3">Steps to Add a Client:</p>
                                <div className="space-y-3">
                                  <div className="flex items-start gap-3">
                                    <div className="text-lg font-bold text-primary">1</div>
                                    <p className="text-sm">Go to <strong>Clients</strong> tab</p>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <div className="text-lg font-bold text-primary">2</div>
                                    <p className="text-sm">Click <strong>"Add Demo Client"</strong> (for practice)</p>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <div className="text-lg font-bold text-primary">3</div>
                                    <p className="text-sm">Fill in: Business Name, Contact Name, Contact Email, Industry (optional)</p>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <div className="text-lg font-bold text-primary">4</div>
                                    <p className="text-sm">Click <strong>"Add Client"</strong></p>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <p className="text-sm font-semibold text-yellow-500">
                                  Use fake information for demo clients - this is practice!
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Slide 4: Assigning Automations */}
                        {currentCourseSlide === 3 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Boxes className="w-5 h-5 text-primary" />
                                Assigning Automations
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="p-4 bg-muted/50 rounded-lg border">
                                <p className="font-semibold mb-3">How to Assign:</p>
                                <div className="space-y-3">
                                  <div className="flex items-start gap-3">
                                    <div className="text-lg font-bold text-primary">1</div>
                                    <p className="text-sm">Select a client from your client list</p>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <div className="text-lg font-bold text-primary">2</div>
                                    <p className="text-sm">Choose an automation from available automations</p>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <div className="text-lg font-bold text-primary">3</div>
                                    <p className="text-sm">Click <strong>"Assign Automation"</strong></p>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <div className="text-lg font-bold text-primary">4</div>
                                    <p className="text-sm">Track the setup process</p>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                <p className="text-sm">
                                  The automation will appear in the client's dashboard once assigned.
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Slide 5: Setup Stages */}
                        {currentCourseSlide === 4 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <RefreshCw className="w-5 h-5 text-primary" />
                                Understanding Setup Stages
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <Badge className="bg-yellow-500 text-yellow-950">pending_setup</Badge>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold mb-1">Automation assigned, awaiting setup by Vault Network</p>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <Badge className="bg-blue-500 text-blue-950">setup_in_progress</Badge>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold mb-1">Vault Network is configuring the automation</p>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <Badge className="bg-green-500 text-green-950">setup_complete</Badge>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold mb-1">Setup finished, finalizing activation</p>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <Badge className="bg-primary text-primary-foreground">active</Badge>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold mb-1">Automation is live and working</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Slide 6: Vault Handles Delivery */}
                        {currentCourseSlide === 5 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-primary" />
                                How Vault Handles Delivery
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <p className="text-sm text-muted-foreground mb-4">
                                Once you assign an automation:
                              </p>
                              <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                  <div className="text-lg font-bold text-primary">1</div>
                                  <p className="text-sm">Vault Network receives the assignment</p>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                  <div className="text-lg font-bold text-primary">2</div>
                                  <p className="text-sm">Our team contacts the client for setup details</p>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                  <div className="text-lg font-bold text-primary">3</div>
                                  <p className="text-sm">We configure and deploy the automation</p>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                  <div className="text-lg font-bold text-primary">4</div>
                                  <p className="text-sm">Client receives access and training</p>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                  <div className="text-lg font-bold text-primary">5</div>
                                  <p className="text-sm">You earn commission when payment processes</p>
                                </div>
                              </div>
                              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                <p className="text-sm font-semibold text-primary">
                                  You don't need to do any technical work - we handle everything!
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Slide 7: Key Takeaways */}
                        {currentCourseSlide === 6 && (
                          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-primary" />
                                Key Takeaways
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid md:grid-cols-2 gap-3">
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                  <p className="text-sm"><strong>Start with demo clients</strong> to practice</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                  <p className="text-sm"><strong>Assign automations</strong> through the Clients tab</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                  <p className="text-sm"><strong>Track status</strong> to see progress</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                  <p className="text-sm"><strong>Vault handles</strong> all technical setup</p>
                                </div>
                                <div className="flex items-start gap-2 md:col-span-2">
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                  <p className="text-sm"><strong>You earn</strong> commission automatically</p>
                                </div>
                              </div>
                              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                <p className="text-center text-base font-semibold text-primary">
                                  Ready to practice? Complete the quiz to test your knowledge! 🎯
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ) : selectedCourse.title === 'Sales Basics for Automation Partners' ? (
                      <div className="py-4 space-y-4">
                        {/* Slide 1: Welcome */}
                        {currentCourseSlide === 0 && (
                          <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30">
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/20 rounded-lg">
                                  <Target className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                  <h3 className="text-2xl font-semibold mb-2">Welcome to Sales Mastery</h3>
                                  <p className="text-base text-muted-foreground mb-4">
                                    This course will teach you how to effectively communicate the value of automations and handle common client concerns.
                                  </p>
                                  <p className="text-lg font-medium text-primary">
                                    Master these skills and you'll be closing deals like a pro! 🎯
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Slide 2: "It's too expensive" */}
                        {currentCourseSlide === 1 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-destructive" />
                                Understanding Client Objections - "It's too expensive"
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                                <p className="font-semibold mb-3">The Strategy:</p>
                                <ul className="space-y-2 text-sm">
                                  <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                    <span><strong>Focus on ROI:</strong> Show how automation saves time and money long-term</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                    <span><strong>Break down costs:</strong> Compare automation cost vs. manual labor costs</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                    <span><strong>Emphasize recurring value:</strong> Monthly automation fee vs. full-time employee salary</span>
                                  </li>
                                </ul>
                              </div>
                              <div className="p-4 bg-muted/50 border border-border rounded-lg">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Example Response:</p>
                                <p className="text-sm italic">
                                  "I understand cost is a concern. Let's break this down: This automation saves your team 10 hours per week. At $25/hour, that's $1,000/month in saved labor costs. The automation costs $300/month - you're saving $700/month while scaling your operations."
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Slide 3: "We don't need automation" */}
                        {currentCourseSlide === 2 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-yellow-500" />
                                Understanding Client Objections - "We don't need automation"
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <p className="font-semibold mb-3">The Strategy:</p>
                                <ul className="space-y-2 text-sm">
                                  <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                    <span><strong>Identify pain points:</strong> Ask about their current challenges</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                    <span><strong>Show specific solutions:</strong> Connect automation features to their problems</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                    <span><strong>Share success stories:</strong> Use real examples from similar businesses</span>
                                  </li>
                                </ul>
                              </div>
                              <div className="p-4 bg-muted/50 border border-border rounded-lg">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Example Response:</p>
                                <p className="text-sm italic">
                                  "I hear you. Many businesses think they're fine until they see what they're missing. Can I ask - how many hours does your team spend on [specific task]? I worked with a similar business that saved 15 hours/week with this automation."
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Slide 4: "We'll do it ourselves" */}
                        {currentCourseSlide === 3 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-500" />
                                Understanding Client Objections - "We'll do it ourselves"
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="font-semibold mb-3">The Strategy:</p>
                                <ul className="space-y-2 text-sm">
                                  <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                    <span><strong>Explain technical complexity:</strong> Show what's involved behind the scenes</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                    <span><strong>Highlight time investment:</strong> Development, maintenance, updates</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                    <span><strong>Emphasize expertise:</strong> Vault Network handles everything</span>
                                  </li>
                                </ul>
                              </div>
                              <div className="p-4 bg-muted/50 border border-border rounded-lg">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Example Response:</p>
                                <p className="text-sm italic">
                                  "That's totally understandable! Building this internally typically takes 3-6 months of development time, plus ongoing maintenance. Vault Network has already built and tested this - you get a proven solution immediately, and we handle all updates and support."
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Slide 5: ROI Tools */}
                        {currentCourseSlide === 4 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Positioning Automations as ROI Tools
                              </CardTitle>
                              <CardDescription>
                                Always frame automations as investments, not costs.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid md:grid-cols-3 gap-4">
                                <div className="p-4 bg-muted/50 rounded-lg border">
                                  <div className="text-2xl font-bold text-primary mb-2">1</div>
                                  <h4 className="font-semibold mb-2">Calculate Time Saved</h4>
                                  <ul className="text-sm space-y-1 text-muted-foreground">
                                    <li>• Hours per week/month</li>
                                    <li>• Multiply by hourly rate</li>
                                    <li>• Show monthly savings</li>
                                  </ul>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg border">
                                  <div className="text-2xl font-bold text-primary mb-2">2</div>
                                  <h4 className="font-semibold mb-2">Compare to Hiring</h4>
                                  <ul className="text-sm space-y-1 text-muted-foreground">
                                    <li>• Employee: $3-5K/month</li>
                                    <li>• Automation: $200-500/month</li>
                                    <li>• Show 10x savings</li>
                                  </ul>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg border">
                                  <div className="text-2xl font-bold text-primary mb-2">3</div>
                                  <h4 className="font-semibold mb-2">Demonstrate Scalability</h4>
                                  <ul className="text-sm space-y-1 text-muted-foreground">
                                    <li>• Manual: Limited by team</li>
                                    <li>• Automation: Scales infinitely</li>
                                    <li>• Show growth potential</li>
                                  </ul>
                                </div>
                              </div>
                              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                <p className="text-xs font-medium text-primary mb-2">Example ROI Calculation:</p>
                                <p className="text-sm">
                                  "Your team spends 20 hours/week on invoice follow-ups. At $30/hour, that's $2,400/month. The Invoice Reminder System costs $250/month. You're saving $2,150/month while ensuring nothing falls through the cracks."
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Slide 6: Tone & Style */}
                        {currentCourseSlide === 5 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Tone & Style of Outreach - Be Consultative
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Be Consultative, Not Salesy
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <p className="font-medium">Do:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                      <li>Ask questions about their business</li>
                                      <li>Listen to their pain points first</li>
                                      <li>Offer solutions based on their needs</li>
                                      <li>Position yourself as a consultant</li>
                                    </ul>
                                  </div>
                                </div>
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    Don't:
                                  </h4>
                                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                                    <li>Push products immediately</li>
                                    <li>Use aggressive sales language</li>
                                    <li>Ignore their concerns</li>
                                    <li>Make it all about commission</li>
                                  </ul>
                                </div>
                              </div>
                              <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm font-medium mb-2">Be Professional but Friendly:</p>
                                <ul className="text-sm space-y-1">
                                  <li>• Use their name: Personalization matters</li>
                                  <li>• Reference specifics: Mention their business details</li>
                                  <li>• Keep it concise: Respect their time</li>
                                  <li>• Add value: Every message should help them</li>
                                </ul>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Slide 7: Example Outreach */}
                        {currentCourseSlide === 6 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-primary" />
                                Example Outreach Templates
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="p-4 bg-muted/50 rounded-lg border">
                                <p className="text-xs font-medium mb-2">Example Outreach:</p>
                                <p className="text-sm italic mb-4">
                                  "Hi [Name], I noticed [specific detail about their business]. Many [industry] businesses struggle with [pain point]. I have a solution that's helped similar companies save [X hours/$X] per month. Worth a quick chat?"
                                </p>
                              </div>
                              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                <p className="text-sm font-semibold mb-3">Key Elements:</p>
                                <div className="grid md:grid-cols-2 gap-2">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                    <span className="text-sm">Personalization</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                    <span className="text-sm">Specific pain point</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                    <span className="text-sm">Social proof</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                    <span className="text-sm">Clear value proposition</span>
                                  </div>
                                  <div className="flex items-center gap-2 md:col-span-2">
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                    <span className="text-sm">Low-pressure ask</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Slide 8: Follow-Up Reminders */}
                        {currentCourseSlide === 7 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-primary" />
                                Setting Follow-Up Reminders
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <p className="text-sm text-muted-foreground mb-4">
                                Use the Deal Tracking system effectively:
                              </p>
                              <div className="space-y-3">
                                <div className="p-4 bg-muted/50 rounded-lg border">
                                  <div className="flex items-start gap-3">
                                    <div className="text-lg font-bold text-primary">1</div>
                                    <div>
                                      <h4 className="font-semibold mb-2">Log all outreach attempts</h4>
                                      <ul className="text-sm space-y-1 text-muted-foreground">
                                        <li>• Track every touchpoint</li>
                                        <li>• Note their responses</li>
                                        <li>• Record next steps</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg border">
                                  <div className="flex items-start gap-3">
                                    <div className="text-lg font-bold text-primary">2</div>
                                    <div>
                                      <h4 className="font-semibold mb-2">Set strategic reminders</h4>
                                      <ul className="text-sm space-y-1 text-muted-foreground">
                                        <li>• Follow up within 48 hours</li>
                                        <li>• Re-engage after 1 week if no response</li>
                                        <li>• Check in quarterly for future needs</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg border">
                                  <div className="flex items-start gap-3">
                                    <div className="text-lg font-bold text-primary">3</div>
                                    <div>
                                      <h4 className="font-semibold mb-2">Track conversation status</h4>
                                      <ul className="text-sm space-y-1 text-muted-foreground">
                                        <li>• Interested → Schedule demo</li>
                                        <li>• Not now → Follow up in 3 months</li>
                                        <li>• Not interested → Respect their decision</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg border">
                                  <div className="flex items-start gap-3">
                                    <div className="text-lg font-bold text-primary">4</div>
                                    <div>
                                      <h4 className="font-semibold mb-2">Learn from what works</h4>
                                      <ul className="text-sm space-y-1 text-muted-foreground">
                                        <li>• Review successful conversations</li>
                                        <li>• Identify patterns</li>
                                        <li>• Refine your approach</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Slide 9: Key Takeaways */}
                        {currentCourseSlide === 8 && (
                          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-primary" />
                                Key Takeaways
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid md:grid-cols-2 gap-3">
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                  <p className="text-sm"><strong>Objections are opportunities</strong> to show value</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                  <p className="text-sm"><strong>ROI is your best friend</strong> - always calculate it</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                  <p className="text-sm"><strong>Be consultative</strong> - help, don't sell</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                  <p className="text-sm"><strong>Follow up strategically</strong> - persistence pays off</p>
                                </div>
                                <div className="flex items-start gap-2 md:col-span-2">
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                  <p className="text-sm"><strong>Track everything</strong> - data drives improvement</p>
                                </div>
                              </div>
                              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                <p className="text-center text-base font-semibold text-primary">
                                  Ready to put this into practice? Complete the quiz to test your knowledge! 🎯
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <div 
                        className="prose prose-lg dark:prose-invert max-w-none text-foreground py-4"
                        style={{ 
                          '--tw-prose-headings': 'rgb(var(--primary))',
                          '--tw-prose-bold': 'rgb(var(--primary))',
                        } as React.CSSProperties}
                        dangerouslySetInnerHTML={{
                          __html: markdownToHtml(currentSlideContent)
                        }}
                      />
                    )}
                  </ScrollArea>
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCourseDialog(false);
                        setCurrentCourseSlide(0);
                      }}
                    >
                      Close
                    </Button>
                    <div className="flex gap-2 flex-1">
                      {totalSlides > 1 && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (currentCourseSlide > 0) {
                                setCurrentCourseSlide(currentCourseSlide - 1);
                              }
                            }}
                            disabled={currentCourseSlide === 0}
                          >
                            Back
                          </Button>
                          {currentCourseSlide < totalSlides - 1 ? (
                            <Button
                              onClick={() => {
                                if (currentCourseSlide < totalSlides - 1) {
                                  setCurrentCourseSlide(currentCourseSlide + 1);
                                }
                              }}
                              className="flex-1"
                            >
                              Next
                            </Button>
                          ) : (
                            selectedCourse.quiz_questions && (
                              <Button
                                onClick={() => {
                                  setShowCourseDialog(false);
                                  setCurrentCourseSlide(0);
                                  handleCompleteLesson(selectedCourse);
                                }}
                                disabled={completedLessons.has(selectedCourse.id)}
                                className="flex-1"
                              >
                                {completedLessons.has(selectedCourse.id) ? 'Quiz Completed' : 'Take Quiz'}
                              </Button>
                            )
                          )}
                        </>
                      )}
                      {totalSlides === 1 && selectedCourse.quiz_questions && (
                        <Button
                          onClick={() => {
                            setShowCourseDialog(false);
                            setCurrentCourseSlide(0);
                            handleCompleteLesson(selectedCourse);
                          }}
                          disabled={completedLessons.has(selectedCourse.id)}
                          className="flex-1"
                        >
                          {completedLessons.has(selectedCourse.id) ? 'Quiz Completed' : 'Take Quiz'}
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })()}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PartnerDashboard;
