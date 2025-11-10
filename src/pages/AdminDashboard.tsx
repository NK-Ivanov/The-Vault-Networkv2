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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Users, DollarSign, Package, Plus, Eye, Settings } from "lucide-react";
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
}

interface SellerProfileData extends SellerData {
  email: string;
  full_name: string;
  website: string | null;
  about: string | null;
  clients: ClientData[];
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
  const [selectedSeller, setSelectedSeller] = useState<SellerProfileData | null>(null);
  const [showSellerDetails, setShowSellerDetails] = useState(false);
  const [showAddAutomation, setShowAddAutomation] = useState(false);
  const [showAssignAutomation, setShowAssignAutomation] = useState(false);
  const [selectedSellerForAssignment, setSelectedSellerForAssignment] = useState<string>("");
  const [selectedAutomationForAssignment, setSelectedAutomationForAssignment] = useState<string>("");
  
  // New automation form state
  const [newAutomation, setNewAutomation] = useState({
    name: "",
    description: "",
    category: "",
    setup_price: "",
    monthly_price: "",
    image_url: "",
    features: "",
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

      // Fetch all automations
      const { data: automationsData, error: automationsError } = await supabase
        .from("automations")
        .select("*")
        .order("created_at", { ascending: false });

      if (automationsError) throw automationsError;
      setAutomations(automationsData || []);

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

  const handleAddAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const featuresArray = newAutomation.features
        .split(",")
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const { error } = await supabase.from("automations").insert({
        name: newAutomation.name,
        description: newAutomation.description,
        category: newAutomation.category || null,
        setup_price: parseFloat(newAutomation.setup_price) || 0,
        monthly_price: parseFloat(newAutomation.monthly_price) || 0,
        image_url: newAutomation.image_url || null,
        features: featuresArray.length > 0 ? featuresArray : null,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Automation Added!",
        description: "New automation has been added to the system.",
      });

      setNewAutomation({
        name: "",
        description: "",
        category: "",
        setup_price: "",
        monthly_price: "",
        image_url: "",
        features: "",
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

  const handleAssignAutomationToSeller = async () => {
    if (!selectedSellerForAssignment || !selectedAutomationForAssignment) {
      toast({
        title: "Selection required",
        description: "Please select both a seller and an automation",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if already assigned
      const { data: existing } = await supabase
        .from("seller_automations")
        .select("id")
        .eq("seller_id", selectedSellerForAssignment)
        .eq("automation_id", selectedAutomationForAssignment)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Already assigned",
          description: "This automation is already assigned to this seller",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("seller_automations").insert({
        seller_id: selectedSellerForAssignment,
        automation_id: selectedAutomationForAssignment,
      });

      if (error) throw error;

      toast({
        title: "Automation Assigned!",
        description: "The automation has been assigned to the seller",
      });

      setSelectedSellerForAssignment("");
      setSelectedAutomationForAssignment("");
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
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddAutomation(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Automation</Button>
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Automation to Seller</DialogTitle>
                  <DialogDescription>Select a seller and automation to assign</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Seller</Label>
                    <Select value={selectedSellerForAssignment} onValueChange={setSelectedSellerForAssignment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a seller..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sellers.filter(s => s.status === "approved").map((seller) => (
                          <SelectItem key={seller.id} value={seller.id}>
                            {seller.business_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Automation</Label>
                    <Select value={selectedAutomationForAssignment} onValueChange={setSelectedAutomationForAssignment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an automation..." />
                      </SelectTrigger>
                      <SelectContent>
                        {automations.filter(a => a.is_active).map((automation) => (
                          <SelectItem key={automation.id} value={automation.id}>
                            {automation.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowAssignAutomation(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAssignAutomationToSeller}>Assign</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <Tabs defaultValue="sellers" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="sellers">Partners</TabsTrigger>
                  <TabsTrigger value="clients">Clients</TabsTrigger>
                  <TabsTrigger value="automations">Automations</TabsTrigger>
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
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
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
                  <p className="font-medium">{selectedSeller.commission_rate}%</p>
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
