import { BookOpen, Download, Settings, Rocket, DollarSign } from "lucide-react";

const LearningPath = () => {
  const steps = [
    {
      icon: BookOpen,
      title: "Learn",
      description: "Understand what automation is and why it matters for your business and life."
    },
    {
      icon: Download,
      title: "Import",
      description: "Bring working templates into your own n8n workspace with one click."
    },
    {
      icon: Settings,
      title: "Modify",
      description: "Customize automations slightly to fit your specific goals and needs."
    },
    {
      icon: Rocket,
      title: "Deploy",
      description: "Connect them to real business use cases and watch them work."
    },
    {
      icon: DollarSign,
      title: "Sell",
      description: "Resell tested workflows to businesses and create new income streams."
    }
  ];

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-vault-charcoal via-vault-black to-vault-charcoal"></div>
      
      <div className="relative z-10 container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 text-primary gold-glow uppercase">
            Your Learning Path
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
            A structured, simple progression from complete beginner to automation entrepreneur.
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
              {steps.map((step, index) => (
                <div key={index} className="relative flex flex-col items-center text-center group">
                  <div className="w-32 h-32 bg-card border-2 border-border rounded-full flex items-center justify-center mb-6 group-hover:border-primary transition-smooth group-hover:gold-border-glow z-10">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
                      <step.icon className="w-10 h-10 text-primary" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  
                  {/* Step number */}
                  <div className="absolute top-2 right-2 md:right-auto md:top-2 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearningPath;
