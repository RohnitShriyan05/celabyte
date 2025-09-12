import { Database, MessageCircle, BarChart3 } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      icon: Database,
      title: "Connect DB",
      description: "Securely connect to your existing database in seconds. Support for PostgreSQL, MySQL, MongoDB and more.",
      color: "google-blue"
    },
    {
      icon: MessageCircle,
      title: "Ask",
      description: "Type your questions naturally. 'Show me revenue trends' or 'Which customers bought the most this quarter?'",
      color: "google-green"
    },
    {
      icon: BarChart3,
      title: "Get Results",
      description: "Receive answers, charts, and insights immediately. No SQL knowledge required, no waiting for analysts.",
      color: "google-yellow"
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "google-blue":
        return "bg-google-blue";
      case "google-green":
        return "bg-google-green";
      case "google-yellow":
        return "bg-google-yellow";
      default:
        return "bg-google-blue";
    }
  };

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get from question to insight in three simple steps. No technical expertise required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              <div className="relative mb-8">
                {/* Step Number */}
                <div className={`absolute -top-2 -right-2 w-8 h-8 ${getColorClasses(step.color)} text-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-card`}>
                  {index + 1}
                </div>
                
                {/* Icon Container */}
                <div className="w-24 h-24 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-card card-hover border">
                  <step.icon className={`w-12 h-12 ${step.color}`} />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-4">
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