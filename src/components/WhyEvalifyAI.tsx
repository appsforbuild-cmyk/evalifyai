import { Check } from "lucide-react";

const WhyEvalifyAI = () => {
  const reasons = [
    "Voice-first feedback experience that mirrors human conversation",
    "Framework-mapped and compliance-ready",
    "Built-in tone and bias correction engine",
    "Consistency and fairness across all reviews",
    "Secure, private-cloud and on-prem deployment options",
    "Empathy meets analytics — the best of both worlds"
  ];

  return (
    <section className="py-20 px-4 bg-muted">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary">
            Why Teams Choose EvalifyAI.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {reasons.map((reason, index) => (
            <div 
              key={index}
              className="flex items-start gap-4 bg-card p-6 rounded-xl shadow-soft border border-border transition-smooth hover:shadow-medium"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center mt-0.5">
                <Check className="w-4 h-4 text-accent-foreground" />
              </div>
              <p className="text-card-foreground font-medium">{reason}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyEvalifyAI;
