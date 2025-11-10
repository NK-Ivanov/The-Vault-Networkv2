import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import vaultLogo from "@/assets/vault-logo.png";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal to-vault-black"></div>
      
      {/* Gold glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-vault-gold opacity-10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-vault-blue opacity-5 blur-[120px] rounded-full"></div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="flex justify-center mb-8 animate-fade-in">
          <img 
            src={vaultLogo} 
            alt="The Vault Network" 
            className="w-32 h-32 md:w-40 md:h-40 gold-border-glow"
          />
        </div>
        
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in gold-glow text-primary uppercase tracking-tight">
          The Vault Network
        </h1>
        
        <p className="text-xl md:text-2xl lg:text-3xl mb-4 max-w-4xl mx-auto animate-fade-in text-foreground font-medium">
          Master AI Automation & Build Your Future
        </p>
        
        <p className="text-base md:text-lg lg:text-xl mb-12 max-w-3xl mx-auto text-muted-foreground animate-fade-in">
          Turn complex AI and automation into accessible systems that work for you. 
          Learn, build, deploy, and even resell business automations with no-code tools.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 gold-border-glow transition-smooth group"
            onClick={() => window.open('https://discord.gg/vaultnetwork', '_blank')}
          >
            Join The Open Gate - Free
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <Button 
            size="lg" 
            variant="outline"
            className="border-primary/50 text-foreground hover:bg-primary/10 font-semibold text-lg px-8 py-6 transition-smooth"
            onClick={() => document.getElementById('learn-more')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Learn More
          </Button>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary gold-glow mb-2">30+</div>
            <div className="text-muted-foreground">Free Automation Templates</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary gold-glow mb-2">3 Days</div>
            <div className="text-muted-foreground">New Automation Every 3 Days</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary gold-glow mb-2">Community</div>
            <div className="text-muted-foreground">Active Discord Support</div>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
