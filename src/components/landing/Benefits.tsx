import { Clock, Users, TrendingUp, Building } from "lucide-react";

export const Benefits = () => {
  const benefits = [
    {
      icon: Clock,
      title: "Save Time",
      description: "Reduce time-to-insight from hours to seconds. No more waiting for analysts or learning SQL.",
      stat: "95% faster",
      highlight: "than traditional methods"
    },
    {
      icon: Users,
      title: "Empower Teams",
      description: "Give everyone in your organization direct access to data insights, regardless of technical skill.",
      stat: "10x more",
      highlight: "people can access data"
    },
    {
      icon: TrendingUp,
      title: "Decision Velocity",
      description: "Make data-driven decisions in real-time. Get answers when you need them, not when it's convenient.",
      stat: "3x faster",
      highlight: "decision making"
    },
    {
      icon: Building,
      title: "Startup to Enterprise",
      description: "Scale from your first database query to enterprise-wide data democratization seamlessly.",
      stat: "500+",
      highlight: "companies trust us"
    },
  ];

  return (
    <section className="py-24 gradient-hero">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Why Choose <span className="text-gradient-accent">Celabyte</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform how your team works with data. No more bottlenecks, no more barriers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center group">
              <div className="w-20 h-20 mx-auto gradient-accent rounded-2xl flex items-center justify-center mb-6 group-hover:glow-accent transition-all-smooth group-hover:scale-110">
                <benefit.icon className="w-10 h-10 text-white" />
              </div>
              
              <div className="mb-4">
                <div className="text-3xl font-bold text-primary mb-1">
                  {benefit.stat}
                </div>
                <div className="text-sm text-muted-foreground">
                  {benefit.highlight}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                {benefit.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};