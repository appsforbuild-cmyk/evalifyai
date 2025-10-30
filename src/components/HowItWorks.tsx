import { MessageCircle, Brain, Network, Edit, Send } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: MessageCircle,
      title: "Talk",
      description: "Manager speaks casually in an AI feedback session."
    },
    {
      icon: Brain,
      title: "Understand",
      description: "AI transcribes and detects tone, bias, and intent."
    },
    {
      icon: Network,
      title: "Structure",
      description: "The system maps insights to competencies and goals."
    },
    {
      icon: Edit,
      title: "Refine",
      description: "EvalifyAI generates balanced, bias-free written feedback."
    },
    {
      icon: Send,
      title: "Deliver",
      description: "Feedback syncs with HR dashboards and employee portals."
    }
  ];

  return (
    <section className="py-20 px-4 bg-muted">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary">
            How EvalifyAI Turns Conversations into Growth.
          </h2>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-border"></div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative text-center space-y-4">
                  {/* Step Number Badge */}
                  <div className="relative inline-flex items-center justify-center">
                    <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl"></div>
                    <div className="relative bg-card border-4 border-background p-6 rounded-2xl shadow-soft">
                      <Icon className="w-8 h-8 text-accent" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl text-card-foreground">{step.title}</h3>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
