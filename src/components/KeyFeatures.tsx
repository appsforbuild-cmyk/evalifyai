import { UserCog, UserCheck, BarChart3, Mic, Gauge, TrendingUp, Target, Shield, LineChart } from "lucide-react";

const KeyFeatures = () => {
  const roles = [
    {
      title: "For Managers",
      icon: UserCog,
      features: [
        { icon: Mic, text: "Voice-first feedback capture" },
        { icon: Gauge, text: "Real-time tone & bias calibration" },
        { icon: TrendingUp, text: "Up to 80% faster review creation" }
      ]
    },
    {
      title: "For Employees",
      icon: UserCheck,
      features: [
        { icon: Target, text: "Actionable summaries & personalized growth roadmaps" },
        { icon: LineChart, text: "Progress tracking and proactive feedback requests" }
      ]
    },
    {
      title: "For HR & Leadership",
      icon: BarChart3,
      features: [
        { icon: Shield, text: "DEI & fairness analytics dashboards" },
        { icon: Target, text: "Goal & OKR alignment tools" },
        { icon: LineChart, text: "Predictive insights for engagement and retention" }
      ]
    }
  ];

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary">
            Designed for Every Role in the Feedback Loop.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {roles.map((role, index) => {
            const RoleIcon = role.icon;
            return (
              <div 
                key={index}
                className="bg-card p-8 rounded-2xl shadow-soft border border-border space-y-6 transition-smooth hover:shadow-medium"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-accent/10">
                    <RoleIcon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold text-card-foreground">{role.title}</h3>
                </div>
                
                <div className="space-y-4">
                  {role.features.map((feature, featureIndex) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                          <FeatureIcon className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-muted-foreground flex-1">{feature.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default KeyFeatures;
