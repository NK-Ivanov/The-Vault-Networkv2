import { MessageSquare, Award, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Community = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Active Discord",
      description: "Join thousands of builders learning, sharing, and growing together in our organized digital workspace."
    },
    {
      icon: Award,
      title: "Get Certified",
      description: "Complete the free course and earn your Certified Builder badge to showcase your automation skills."
    },
    {
      icon: TrendingUp,
      title: "Grow Together",
      description: "Access new automations every 3 days, participate in challenges, and level up your skills continuously."
    },
    {
      icon: Users,
      title: "Expert Support",
      description: "Get help from experienced builders and mentors who understand the challenges you're facing."
    }
  ];

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-vault-black"></div>
      
      {/* Decorative gold lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
      
      <div className="relative z-10 container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 text-primary gold-glow uppercase">
            Join The Network
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
            The Vault Network isn't just a course — it's a movement where technology works for people, not the other way around.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card border-border p-8 hover:border-primary/50 transition-smooth">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <div className="inline-block bg-card border-2 border-primary/30 rounded-2xl p-8 md:p-12 gold-border-glow">
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
              Ready to Build Your Future?
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Join The Open Gate today and start your journey from complete beginner to confident automation builder — completely free.
            </p>
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xl px-12 py-7 gold-border-glow transition-smooth"
              onClick={() => window.open('https://discord.gg/ECNXpWjw9A', '_blank')}
            >
              Join The Vault Network - Free
            </Button>
            
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Instant access</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>30+ free templates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Community;
