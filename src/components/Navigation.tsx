import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import vaultLogo from "@/assets/vault-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, LayoutDashboard } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

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
  
  useEffect(() => {
    if (user && !fetchingRef.current) {
      // Check cache first
      const cachedRole = sessionStorage.getItem('user_role');
      const cachedUserId = sessionStorage.getItem('user_role_user_id');
      
      if (cachedRole && cachedUserId === user.id) {
        // Use cached role if it's for the same user
        setUserRole(cachedRole);
        return;
      }
      
      // Fetch only if not cached or user changed
      fetchingRef.current = true;
      fetchUserRole();
    } else if (!user) {
      setUserRole(null);
      sessionStorage.removeItem('user_role');
      sessionStorage.removeItem('user_role_user_id');
    }
  }, [user?.id]); // Only depend on user.id, not the whole user object

  const fetchUserRole = async () => {
    if (!user) return;
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const rolesList = roles?.map(r => r.role) || [];
      
      let role: string | null = null;
      // Priority: admin > seller > client
      if (rolesList.includes("admin")) {
        role = "admin";
      } else if (rolesList.includes("seller")) {
        role = "seller";
      } else if (rolesList.includes("client")) {
        role = "client";
      }
      
      setUserRole(role);
      
      // Cache the role
      if (role) {
        sessionStorage.setItem('user_role', role);
        sessionStorage.setItem('user_role_user_id', user.id);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole(null);
    } finally {
      fetchingRef.current = false;
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-vault-black/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={vaultLogo} 
              alt="The Vault Network" 
              className="w-10 h-10 transition-transform group-hover:scale-110"
            />
            <span className="font-display text-xl font-bold text-primary gold-glow hidden sm:inline">
              THE VAULT NETWORK
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 md:gap-2">
            <Link to="/">
              <Button 
                variant="ghost" 
                className={`transition-smooth ${
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
                className={`transition-smooth ${
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
                className={`transition-smooth ${
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
                className={`transition-smooth ${
                  isActive('/for-businesses') 
                    ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                    : 'text-foreground hover:text-primary hover:bg-accent/10'
                }`}
              >
                For Businesses
              </Button>
            </Link>

            {user ? (
              <>
                {accountType && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mr-2">
                    {accountType}
                  </Badge>
                )}
                {dashboardPath && (
                  <Link to={dashboardPath}>
                    <Button 
                      variant="outline"
                      className={`transition-smooth ${
                        isActive(dashboardPath)
                          ? 'text-primary bg-primary/10 hover:bg-primary/20 border-primary/50' 
                          : 'border-primary/50 text-foreground hover:bg-primary/10'
                      } font-semibold gold-border-glow`}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="border-primary/50 text-foreground hover:bg-primary/10 font-semibold gold-border-glow transition-smooth ml-2"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gold-border-glow transition-smooth ml-2"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
