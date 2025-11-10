import Navigation from "@/components/Navigation";
import Mission from "@/components/Mission";
import Offerings from "@/components/Offerings";
import LearningPath from "@/components/LearningPath";
import Community from "@/components/Community";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const CommunityPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section for Community */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black via-vault-charcoal to-vault-black"></div>
        
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-vault-gold opacity-10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-vault-blue opacity-5 blur-[120px] rounded-full"></div>
        
        <div className="relative z-10 container mx-auto px-6 text-center py-20">
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in gold-glow text-primary uppercase tracking-tight">
            Vault Learning Hub
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto text-foreground">
            Master AI Automation & Build Your Future
          </p>
          
          <p className="text-lg mb-8 max-w-3xl mx-auto text-muted-foreground">
            Learn, build, and deploy automations with no-code tools. Join our Discord community for free access to templates, courses, and support.
          </p>
          
          <div className="mt-8">
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 gold-border-glow transition-smooth"
              onClick={() => window.open('https://discord.gg/ECNXpWjw9A', '_blank')}
            >
              Join Discord Community
            </Button>
          </div>
        </div>
      </section>

      <Mission />
      <Offerings />
      <LearningPath />
      <Community />
      <Footer />
    </div>
  );
};

export default CommunityPage;
