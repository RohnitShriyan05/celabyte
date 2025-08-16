import { Database, MessageCircle, BarChart3 } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      icon: Database,
      title: "Connect Your Database",
      description: "Securely connect to your existing database in seconds. Support for PostgreSQL, MySQL, MongoDB and more.",
    },
    {
      icon: MessageCircle,
      title: "Ask in Plain English",
      description: "Type your questions naturally. 'Show me revenue trends' or 'Which customers bought the most this quarter?'",
    },
    {
      icon: BarChart3,
      title: "Get Instant Results",
      description: "Receive answers, charts, and insights immediately. No SQL knowledge required, no waiting for analysts.",
    },
  ];

  return (
    <section className="py-24 bg-surface">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            How It <span className="text-gradient-accent">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get from question to insight in three simple steps. No technical expertise required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              <div className="relative mb-8">
                {/* Step Number */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold z-10">
                  {index + 1}
                </div>
                
                {/* Icon Container */}
                <div className="w-24 h-24 mx-auto gradient-card rounded-2xl flex items-center justify-center group-hover:glow-accent transition-all-smooth group-hover:scale-110">
                  <step.icon className="w-12 h-12 text-primary" />
                </div>
                
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent transform translate-x-4"></div>
                )}
              </div>
              
              <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};