import { Brain, Zap, PieChart, Users, Shield, Database } from "lucide-react";

export const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "Conversational AI",
      description: "Natural language processing that understands your business context and data relationships.",
    },
    {
      icon: Zap,
      title: "Auto-SQL Generation",
      description: "Automatically converts your questions into optimized SQL queries behind the scenes.",
    },
    {
      icon: PieChart,
      title: "Smart Visualizations",
      description: "Intelligent chart selection and data visualization based on your query type and data.",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share insights, build dashboards together, and collaborate on data analysis projects.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "SOC 2 compliant with end-to-end encryption and granular access controls.",
    },
    {
      icon: Database,
      title: "Multi-DB Support",
      description: "Works with PostgreSQL, MySQL, MongoDB, BigQuery, Snowflake, and more databases.",
    },
  ];

  return (
    <section id="features" className="py-24 gradient-hero">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Powerful <span className="text-gradient-accent">Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to unlock insights from your data, built for modern teams.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="gradient-card p-8 rounded-2xl surface-elevated group hover:scale-105 transition-all-smooth cursor-pointer"
            >
              <div className="w-16 h-16 gradient-accent rounded-xl flex items-center justify-center mb-6 group-hover:glow-accent transition-all-smooth">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};