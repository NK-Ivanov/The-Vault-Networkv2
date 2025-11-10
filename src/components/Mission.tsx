import { Zap, Users, TrendingUp } from "lucide-react";

const Mission = () => {
  const principles = [
    {
      icon: Zap,
      title: "Knowledge That Earns",
      description: "Every workflow and automation shared has tangible business value."
    },
    {
      icon: TrendingUp,
      title: "Freedom Through Systems",
      description: "Saving time through automation is the key to scaling freedom."
    },
    {
      icon: Users,
      title: "Network Over Isolation",
      description: "Learning happens faster inside a supportive community."
    }
  ];

  return (
    <section id="learn-more" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-vault-black to-vault-charcoal"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-primary/0 via-primary/20 to-primary/0"></div>
      
      <div className="relative z-10 container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 text-primary gold-glow uppercase">
            Our Mission
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-foreground leading-relaxed">
            To make AI and automation <span className="text-primary font-semibold">accessible, understandable, and profitable</span> for everyone — 
            turning everyday individuals into digital builders who can automate their work and create new income streams.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {principles.map((principle, index) => (
            <div 
              key={index}
              className="bg-card border border-border p-8 rounded-lg hover:border-primary/50 transition-smooth group"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-smooth">
                <principle.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{principle.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{principle.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Mission;
