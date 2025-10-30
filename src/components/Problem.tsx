import { AlertCircle, Clock, Scale, Users } from "lucide-react";

const Problem = () => {
  const problems = [
    {
      icon: AlertCircle,
      text: "Feedback is vague, delayed, or emotionally charged."
    },
    {
      icon: Clock,
      text: "Managers spend hours writing reviews that nobody reads."
    },
    {
      icon: Scale,
      text: "HR struggles to maintain fairness, structure, and data integrity."
    },
    {
      icon: Users,
      text: "Remote employees get left out of meaningful feedback loops."
    }
  ];

  return (
    <section className="py-20 px-4 bg-muted">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary">
            Feedback isn't broken — it's just outdated.
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Feedback is supposed to drive growth, but most systems make it mechanical and biased.
            Employees feel unseen. Managers feel drained. HR feels stuck between people and policies.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <div 
                key={index}
                className="bg-card p-8 rounded-2xl shadow-soft border border-border transition-smooth hover:shadow-medium"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-lg text-card-foreground flex-1">{problem.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Problem;
