import { Sparkles } from "lucide-react";

const FutureVision = () => {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center space-y-8 relative">
          {/* Decorative Background */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="inline-flex p-4 rounded-2xl bg-accent/10">
            <Sparkles className="w-12 h-12 text-accent" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-primary">
            The Future of Feedback is Conversational.
          </h2>
          
          <div className="space-y-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            <p>
              EvalifyAI isn't just another HR tool — it's the start of a new feedback era.
            </p>
            <p>
              Imagine a world where managers simply talk, and growth documentation happens automatically.
              Where feedback feels human, actionable, and fair.
            </p>
            <p className="text-xl font-semibold text-primary">
              That's not futuristic — that's EvalifyAI.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FutureVision;
