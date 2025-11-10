import { Check, Lock, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Offerings = () => {
  const tiers = [
    {
      name: "The Open Gate",
      subtitle: "Free Tier",
      status: "Active Now",
      icon: Check,
      features: [
        "Free course: 'How to Import Your First Automation'",
        "30+ ready-to-use automation templates",
        "Access to community channels",
        "1 new automation every 3 days",
        "Early access to announcements",
        "Certified Builder badge upon completion"
      ],
      highlight: true
    },
    {
      name: "The Hidden Room",
      subtitle: "Mid Tier",
      status: "Coming Soon",
      icon: Lock,
      features: [
        "Advanced guides & technical walkthroughs",
        "Exclusive templates for business resale",
        "Live discussions & workshops",
        "Blueprint channels access",
        "Case studies & system designs"
      ],
      highlight: false
    },
    {
      name: "The Vault",
      subtitle: "Premium Tier",
      status: "Coming Soon",
      icon: Crown,
      features: [
        "Private mastermind access",
        "Advanced AI agent automations",
        "1 premium automation per week",
        "Direct mentorship sessions",
        "Community challenges & collaboration"
      ],
      highlight: false
    }
  ];

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-vault-black"></div>
      
      {/* Gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
      
      <div className="relative z-10 container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 text-primary gold-glow uppercase">
            Choose Your Path
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
            Start free with The Open Gate. Unlock advanced tiers as you grow.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <Card 
              key={index}
              className={`relative p-8 ${
                tier.highlight 
                  ? 'bg-card border-primary/50 gold-border-glow' 
                  : 'bg-card border-border'
              } transition-smooth hover:scale-105`}
            >
              {tier.highlight && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1">
                  {tier.status}
                </Badge>
              )}
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">{tier.subtitle}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  tier.highlight ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  <tier.icon className={tier.highlight ? 'text-primary' : 'text-muted-foreground'} />
                </div>
              </div>
              
              {!tier.highlight && (
                <Badge variant="outline" className="mb-6 border-muted-foreground/30 text-muted-foreground">
                  {tier.status}
                </Badge>
              )}
              
              <ul className="space-y-3">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      tier.highlight ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Offerings;
