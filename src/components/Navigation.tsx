import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import vaultLogo from "@/assets/vault-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, LayoutDashboard, Bell, Menu, MessageCircle, Phone } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { formatDistanceToNow } from "date-fns";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(() => {
    // Initialize from cache if available
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('user_role');
      return cached || null;
    }
    return null;
  });
  const fetchingRef = useRef(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sellerStatus, setSellerStatus] = useState<string | null>(null);
  
  useEffect(() => {
    if (user && !fetchingRef.current) {
      // Check cache first
      const cachedRole = sessionStorage.getItem('user_role');
      const cachedUserId = sessionStorage.getItem('user_role_user_id');
      
      if (cachedRole && cachedUserId === user.id) {
        // Use cached role if it's for the same user
        setUserRole(cachedRole);
        // Fetch seller status if user is a seller
        if (cachedRole === 'seller') {
          fetchSellerStatus();
        }
      } else {
        // Fetch only if not cached or user changed
        fetchingRef.current = true;
        fetchUserRole();
      }
    } else if (!user) {
      setUserRole(null);
      setSellerStatus(null);
      sessionStorage.removeItem('user_role');
      sessionStorage.removeItem('user_role_user_id');
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?.id]); // Only depend on user.id, not the whole user object

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Set up real-time subscription
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => {
            fetchNotifications();
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const fetchUserRole = async () => {
    if (!user) return;
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const rolesList = roles?.map(r => r.role) || [];
      
      let role: string | null = null;
      // Priority: admin > seller > client > learner
      if (rolesList.includes("admin")) {
        role = "admin";
      } else if (rolesList.includes("seller")) {
        role = "seller";
      } else if (rolesList.includes("client")) {
        role = "client";
      } else if (rolesList.includes("learner")) {
        role = "learner";
      }
      
      setUserRole(role);
      
      // Cache the role
      if (role) {
        sessionStorage.setItem('user_role', role);
        sessionStorage.setItem('user_role_user_id', user.id);
      }
      
      // Fetch seller status if user is a seller
      if (role === "seller") {
        fetchSellerStatus();
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole(null);
    } finally {
      fetchingRef.current = false;
    }
  };

  const fetchSellerStatus = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("sellers")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setSellerStatus(data.status);
      }
    } catch (error) {
      console.error("Error fetching seller status:", error);
    }
  };

  const getDashboardPath = () => {
    switch (userRole) {
      case "admin":
        return "/admin-dashboard";
      case "seller":
        return "/partner-dashboard";
      case "client":
        return "/client-dashboard";
      case "learner":
        return "/learner-dashboard";
      default:
        return null;
    }
  };

  const getAccountTypeLabel = () => {
    switch (userRole) {
      case "admin":
        return "Admin";
      case "seller":
        return "Partner";
      case "client":
        return "Business";
      default:
        return null;
    }
  };
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await signOut();
    setUserRole(null);
    sessionStorage.removeItem('user_role');
    sessionStorage.removeItem('user_role_user_id');
    navigate("/");
  };

  const dashboardPath = getDashboardPath();
  const accountType = getAccountTypeLabel();

  return (
    <>
      <nav className="sticky top-0 z-50 bg-vault-black/80 backdrop-blur-lg border-b border-border relative">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo - Desktop, Text - Mobile */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <img 
              src={vaultLogo} 
              alt="The Vault Network" 
              className="w-6 h-6 sm:w-10 sm:h-10 transition-transform group-hover:scale-110 object-contain"
            />
            <span className="font-display text-base sm:text-lg md:text-xl font-bold text-primary gold-glow">
              THE VAULT NETWORK
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 md:gap-2 flex-1 justify-end">
            <Link to="/">
              <Button 
                variant="ghost" 
                size="sm"
                className={`transition-smooth text-xs sm:text-sm px-2 sm:px-3 ${
                  isActive('/') 
                    ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                    : 'text-foreground hover:text-primary hover:bg-accent/10'
                }`}
              >
                Home
              </Button>
            </Link>
            
            <Link to="/community">
              <Button 
                variant="ghost" 
                size="sm"
                className={`transition-smooth text-xs sm:text-sm px-2 sm:px-3 ${
                  isActive('/community') 
                    ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                    : 'text-foreground hover:text-primary hover:bg-accent/10'
                }`}
              >
                Community
              </Button>
            </Link>
            
            <Link to="/partners">
              <Button 
                variant="ghost" 
                size="sm"
                className={`transition-smooth text-xs sm:text-sm px-2 sm:px-3 ${
                  isActive('/partners') 
                    ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                    : 'text-foreground hover:text-primary hover:bg-accent/10'
                }`}
              >
                Partners
              </Button>
            </Link>
            
            <Link to="/for-businesses">
              <Button 
                variant="ghost" 
                size="sm"
                className={`transition-smooth text-xs sm:text-sm px-2 sm:px-3 ${
                  isActive('/for-businesses') 
                    ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                    : 'text-foreground hover:text-primary hover:bg-accent/10'
                }`}
              >
                For Businesses
              </Button>
            </Link>
          </div>

          {/* Right Side Actions - Badge, Dashboard, Logout, Notifications, Mobile Menu */}
          <div className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <>
                {/* Account Badge - Desktop Only */}
                {accountType && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs hidden md:inline-flex">
                    {accountType}
                  </Badge>
                )}
                
                {/* Dashboard Button - Desktop Only */}
                {dashboardPath && (
                  <Link to={dashboardPath} className="hidden md:block">
                    <Button 
                      variant="outline"
                      size="sm"
                      className={`transition-smooth text-xs sm:text-sm px-2 sm:px-3 ${
                        isActive(dashboardPath)
                          ? 'text-primary bg-primary/10 hover:bg-primary/20 border-primary/50' 
                          : 'border-primary/50 text-foreground hover:bg-primary/10'
                      } font-semibold gold-border-glow`}
                    >
                      <LayoutDashboard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                )}
                
                {/* Logout Button - Desktop Only */}
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="border-primary/50 text-foreground hover:bg-primary/10 font-semibold gold-border-glow transition-smooth text-xs sm:text-sm px-2 sm:px-3 hidden md:inline-flex"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Logout
                </Button>
                
                {/* Notifications Bell - Always Visible */}
                <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="relative transition-smooth hover:bg-primary/10 p-2 sm:p-2.5"
                    >
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 p-0" align="end">
                    <div className="flex items-center justify-between p-3 sm:p-4 border-b">
                      <h3 className="font-semibold text-sm sm:text-base">Notifications</h3>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          className="text-xs"
                        >
                          Mark all as read
                        </Button>
                      )}
                    </div>
                    <ScrollArea className="h-[300px] sm:h-[400px]">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-xs sm:text-sm">
                          No notifications
                        </div>
                      ) : (
                        <div className="divide-y">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 sm:p-4 hover:bg-accent/50 cursor-pointer transition-colors ${
                                !notification.read ? 'bg-primary/5' : ''
                              }`}
                              onClick={() => {
                                if (!notification.read) {
                                  markAsRead(notification.id);
                                }
                                if (notification.link) {
                                  // Handle query parameters in notification links
                                  const [path, query] = notification.link.split('?');
                                  navigate(path + (query ? `?${query}` : ''));
                                  
                                  // If notification has a related_id and it's a ticket, open it after navigation
                                  if (notification.related_id && (notification.type?.includes('ticket') || notification.title?.toLowerCase().includes('ticket'))) {
                                    setTimeout(() => {
                                      // This will be handled by the dashboard component
                                      window.dispatchEvent(new CustomEvent('openTicket', { detail: { ticketId: notification.related_id } }));
                                    }, 500);
                                  }
                                  
                                  // If notification has a related_id and it's a seller message, open it after navigation
                                  if (notification.related_id && (notification.type?.includes('seller_message') || notification.type?.includes('message'))) {
                                    setTimeout(() => {
                                      window.dispatchEvent(new CustomEvent('openSellerMessage', { detail: { messageId: notification.related_id } }));
                                    }, 500);
                                  }
                                }
                                setNotificationsOpen(false);
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs sm:text-sm font-medium ${!notification.read ? 'font-semibold' : ''} break-words`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1 break-words">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </>
            ) : (
              <Link to="/login" className="hidden md:block">
                <Button 
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gold-border-glow transition-smooth ml-1 sm:ml-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  Login
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="p-2 md:hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Main navigation menu</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-3 mb-4">
                      <img 
                        src={vaultLogo} 
                        alt="The Vault Network" 
                        className="w-10 h-10"
                      />
                      <span className="font-display text-lg font-bold text-primary gold-glow">
                        THE VAULT NETWORK
                      </span>
                    </div>
                    {user && accountType && (
                      <div className="space-y-2">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                          {accountType}
                        </Badge>
                        {sellerStatus === "pending" && (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">
                            Pending Approval
                          </Badge>
                        )}
                      </div>
                    )}
                    {user && sellerStatus === "pending" && (
                      <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-xs font-semibold text-foreground mb-2">
                          Next Steps - Verify Your Application:
                        </p>
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <MessageCircle className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-foreground mb-1">Discord</p>
                              <p>Create a ticket in <span className="font-mono text-primary">#partner-applications</span></p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Phone className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-foreground mb-1">WhatsApp</p>
                              <p>Message: <span className="font-mono text-primary">+44 XXXXX</span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-2">
                      <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                        <Button 
                          variant={isActive('/') ? "default" : "ghost"}
                          className={`w-full justify-start ${
                            isActive('/') 
                              ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                              : 'text-foreground hover:text-primary hover:bg-accent/10'
                          }`}
                        >
                          Home
                        </Button>
                      </Link>
                      
                      <Link to="/community" onClick={() => setMobileMenuOpen(false)}>
                        <Button 
                          variant={isActive('/community') ? "default" : "ghost"}
                          className={`w-full justify-start ${
                            isActive('/community') 
                              ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                              : 'text-foreground hover:text-primary hover:bg-accent/10'
                          }`}
                        >
                          Community
                        </Button>
                      </Link>
                      
                      <Link to="/partners" onClick={() => setMobileMenuOpen(false)}>
                        <Button 
                          variant={isActive('/partners') ? "default" : "ghost"}
                          className={`w-full justify-start ${
                            isActive('/partners') 
                              ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                              : 'text-foreground hover:text-primary hover:bg-accent/10'
                          }`}
                        >
                          Partners
                        </Button>
                      </Link>
                      
                      <Link to="/for-businesses" onClick={() => setMobileMenuOpen(false)}>
                        <Button 
                          variant={isActive('/for-businesses') ? "default" : "ghost"}
                          className={`w-full justify-start ${
                            isActive('/for-businesses') 
                              ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                              : 'text-foreground hover:text-primary hover:bg-accent/10'
                          }`}
                        >
                          For Businesses
                        </Button>
                      </Link>

                      {user && (
                        <>
                          {dashboardPath && (
                            <Link to={dashboardPath} onClick={() => setMobileMenuOpen(false)}>
                              <Button 
                                variant={isActive(dashboardPath) ? "default" : "ghost"}
                                className={`w-full justify-start mt-4 ${
                                  isActive(dashboardPath)
                                    ? 'text-primary bg-primary/10 hover:bg-primary/20 border-primary/50' 
                                    : 'border-primary/50 text-foreground hover:bg-primary/10'
                                } font-semibold`}
                              >
                                <LayoutDashboard className="w-4 h-4 mr-2" />
                                Dashboard
                              </Button>
                            </Link>
                          )}
                          <Button 
                            onClick={() => {
                              handleLogout();
                              setMobileMenuOpen(false);
                            }}
                            variant="outline"
                            className="w-full justify-start mt-2 border-primary/50 text-foreground hover:bg-primary/10 font-semibold"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                          </Button>
                        </>
                      )}
                      {!user && (
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button 
                            className="w-full justify-start mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                          >
                            Login
                          </Button>
                        </Link>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      {/* Gold divider at bottom of nav */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
    </nav>
    </>
  );
};

export default Navigation;
