import vaultLogo from "@/assets/vault-logo.png";

const Footer = () => {
  return (
    <footer className="relative py-12 border-t border-border">
      <div className="absolute inset-0 bg-vault-charcoal"></div>
      
      <div className="relative z-10 container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src={vaultLogo} alt="The Vault Network" className="w-12 h-12" />
            <div>
              <div className="font-display font-bold text-primary text-lg">The Vault Network</div>
              <div className="text-sm text-muted-foreground">Master AI Automation</div>
            </div>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} The Vault Network. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Built by automation enthusiasts, for automation entrepreneurs.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
