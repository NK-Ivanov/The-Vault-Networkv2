import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import vaultLogo from "@/assets/vault-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

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
              THE VAULT
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 md:gap-2">
            <Link to="/">
              <Button 
                variant="ghost" 
                className={`transition-smooth ${
                  isActive('/') 
                    ? 'text-primary' 
                    : 'text-foreground hover:text-primary'
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
                    ? 'text-primary' 
                    : 'text-foreground hover:text-primary'
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
                    ? 'text-primary' 
                    : 'text-foreground hover:text-primary'
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
                    ? 'text-primary' 
                    : 'text-foreground hover:text-primary'
                }`}
              >
                For Businesses
              </Button>
            </Link>

            {user ? (
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="border-primary/50 text-foreground hover:bg-primary/10 font-semibold gold-border-glow transition-smooth ml-2"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
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
