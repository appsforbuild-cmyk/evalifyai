import { Mic, Zap, FileText, RefreshCw } from "lucide-react";

const Solution = () => {
  const features = [
    {
      icon: Mic,
      title: "Voice-first feedback sessions",
      description: "Speak naturally, just like a real conversation"
    },
    {
      icon: Zap,
      title: "AI tone and bias calibration",
      description: "Ensures fair and balanced feedback"
    },
    {
      icon: FileText,
      title: "Instant transcription and structure",
      description: "Converts voice to organized written feedback"
    },
    {
      icon: RefreshCw,
      title: "Continuous learning loop",
      description: "Gets better with every conversation"
    }
  ];

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary">
            Meet EvalifyAI — Your Conversational Feedback Companion.
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            EvalifyAI brings humanity back into performance conversations.
            Speak naturally with an AI voice agent that listens, structures, and transforms your spoken feedback into clear, actionable insights — aligned with your company's competency framework.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="text-center space-y-4 p-6 rounded-2xl bg-card border border-border transition-smooth hover:shadow-soft"
              >
                <div className="inline-flex p-4 rounded-2xl bg-accent/10">
                  <Icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-semibold text-lg text-card-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Solution;
