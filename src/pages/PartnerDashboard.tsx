import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, TrendingUp, Package, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SellerData {
  id: string;
  business_name: string;
  status: string;
  referral_code: string;
  commission_rate: number;
  total_sales: number;
  total_commission: number;
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
}

const PartnerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sellerData, setSellerData] = useState<SellerData | null>(null);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [availableAutomations, setAvailableAutomations] = useState<AutomationData[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedAutomation, setSelectedAutomation] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const [copied, setCopied] = useState(false);

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
            features
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
      }));
      
      setAvailableAutomations(transformedAutomations);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (sellerData?.status === "pending") {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-[80vh]">
          <Card className="max-w-md w-full bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Application Pending</CardTitle>
              <CardDescription>Your partner application is under review</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Thank you for applying to become a Vault Network partner.
              </p>
              <Button onClick={() => navigate("/")} className="w-full">
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
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
              Partner Dashboard
            </h1>
            <p className="text-xl text-muted-foreground">
              Welcome back, {sellerData?.business_name}
            </p>
          </div>

          <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Your Referral Link</CardTitle>
              <CardDescription>Share this link with potential clients to earn commission</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <div className="flex-1 p-3 bg-background rounded-lg border border-border font-mono text-sm overflow-x-auto">
                  {window.location.origin}/for-businesses?ref={sellerData?.referral_code}
                </div>
                <Button onClick={copyReferralLink} variant="outline" size="icon">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Your referral code: <span className="font-bold text-primary">{sellerData?.referral_code}</span>
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${sellerData?.total_sales.toFixed(2) || "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Commission Earned</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${sellerData?.total_commission.toFixed(2) || "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {clients.filter(c => c.status === "active").length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Commission Rate</CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {sellerData?.commission_rate}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assign Automation Section */}
          {availableAutomations.length > 0 && clients.length > 0 && (
            <Card className="mb-8 bg-card border-border">
              <CardHeader>
                <CardTitle className="text-primary">Assign Automation to Client</CardTitle>
                <CardDescription>Select a client and automation to assign</CardDescription>
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

          {/* Available Automations Section */}
          {availableAutomations.length > 0 && (
            <Card className="mb-8 bg-card border-border">
              <CardHeader>
                <CardTitle className="text-primary">Available Automations</CardTitle>
                <CardDescription>Automations you can assign to clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableAutomations.map((automation) => (
                    <Card key={automation.id} className="bg-muted/20 border-border">
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
                            <span className="text-sm text-muted-foreground">Setup:</span>
                            <span className="font-bold text-foreground">${automation.setup_price}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Monthly:</span>
                            <span className="font-bold text-primary">${automation.monthly_price}/mo</span>
                          </div>
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
              <CardTitle className="text-primary">Your Clients</CardTitle>
              <CardDescription>Manage and track your client relationships</CardDescription>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No clients yet. Share your referral link!</p>
                  <Button onClick={copyReferralLink}>
                    Copy Referral Link
                  </Button>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PartnerDashboard;
