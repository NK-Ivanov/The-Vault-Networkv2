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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Users, DollarSign, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

interface EnquiryData {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
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
        .select("*")
        .order("created_at", { ascending: false });

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      const { data: enquiriesData, error: enquiriesError } = await supabase
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (enquiriesError) throw enquiriesError;
      setEnquiries(enquiriesData || []);

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

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <Tabs defaultValue="sellers" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="sellers">Partners</TabsTrigger>
                  <TabsTrigger value="clients">Clients</TabsTrigger>
                  <TabsTrigger value="enquiries">Enquiries</TabsTrigger>
                </TabsList>

                <TabsContent value="sellers">
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
                      {sellers.map((seller) => (
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
                            {seller.status === "pending" && (
                              <div className="flex gap-2">
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
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="clients">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Referral Code Used</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.business_name}</TableCell>
                          <TableCell>{client.contact_name}</TableCell>
                          <TableCell className="font-mono">{client.invited_by_code || "Direct"}</TableCell>
                          <TableCell>
                            <Badge variant={client.status === "active" ? "default" : "secondary"}>
                              {client.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="enquiries">
                  <div className="space-y-4">
                    {enquiries.map((enquiry) => (
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
