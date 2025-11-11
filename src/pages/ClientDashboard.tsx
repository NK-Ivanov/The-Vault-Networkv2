import { useEffect, useState } from "react";
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
import { DollarSign, Package, FileText, Send, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { callNetlifyFunction } from "@/lib/netlify-functions";

interface ClientData {
  id: string;
  business_name: string;
  contact_name: string;
  total_spent: number;
  seller_id: string | null;
}

interface TransactionData {
  id: string;
  amount: number;
  transaction_type: string;
  status: string;
  created_at: string;
}

interface EnquiryData {
  id: string;
  message: string;
  status: string;
  created_at: string;
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
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryData[]>([]);
  const [automations, setAutomations] = useState<AutomationData[]>([]);

  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

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
        .select("*")
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

      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      const { data: enquiriesData, error: enquiriesError } = await supabase
        .from("enquiries")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });

      if (enquiriesError) throw enquiriesError;
      setEnquiries(enquiriesData || []);

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

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from("enquiries").insert({
        client_id: clientData?.id,
        business_name: clientData?.business_name || "",
        contact_name: clientData?.contact_name || "",
        email: user?.email || "",
        message: enquiryMessage,
        status: "new",
      });

      if (error) throw error;

      toast({
        title: "Enquiry Submitted!",
        description: "We'll get back to you soon.",
      });

      setEnquiryMessage("");
      fetchClientData();
    } catch (error: any) {
      toast({
        title: "Failed to submit enquiry",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

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
                <CardTitle className="text-sm font-medium text-muted-foreground">Open Enquiries</CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {enquiries.filter(e => e.status === "new" || e.status === "contacted").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assigned Automations Section */}
          <Card className="mb-12 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-primary">Your Assigned Automations</CardTitle>
              <CardDescription>Automations assigned to you by your partner</CardDescription>
            </CardHeader>
            <CardContent>
              {automations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No automations assigned yet</p>
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
                        <Button
                          onClick={() => handleCheckout(automation)}
                          disabled={checkingOut === automation.id || !automation.stripe_setup_price_id}
                          className="w-full mt-4"
                          variant={automation.stripe_setup_price_id ? "default" : "outline"}
                        >
                          {checkingOut === automation.id ? (
                            <>Processing...</>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
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
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-primary">Submit Enquiry</CardTitle>
                <CardDescription>Have questions? Send us a message</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitEnquiry} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="enquiry-message">Your Message *</Label>
                    <Textarea
                      id="enquiry-message"
                      placeholder="What can we help you with?"
                      value={enquiryMessage}
                      onChange={(e) => setEnquiryMessage(e.target.value)}
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
                    {submitting ? "Sending..." : "Submit Enquiry"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-primary">Your Enquiries</CardTitle>
              <CardDescription>Track your messages and requests</CardDescription>
            </CardHeader>
            <CardContent>
              {enquiries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No enquiries yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enquiries.map((enquiry) => (
                    <div key={enquiry.id} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={
                          enquiry.status === "new" ? "default" :
                          enquiry.status === "contacted" ? "secondary" : "outline"
                        }>
                          {enquiry.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(enquiry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-foreground">{enquiry.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ClientDashboard;
