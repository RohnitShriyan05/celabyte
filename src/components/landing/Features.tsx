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
      title: "SQL Transparency",
      description: "See the auto-generated SQL queries behind your questions. Learn and optimize as you go.",
    },
    {
      icon: PieChart,
      title: "Rich Visualizations",
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
    <section id="features" className="py-24 bg-surface">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Powerful Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to unlock insights from your data, built for modern teams.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-2xl shadow-card border card-hover"
            >
              <div className="w-16 h-16 bg-google-blue/10 rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="w-8 h-8 google-blue" />
              </div>
              
              <h3 className="text-xl font-bold mb-4">
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