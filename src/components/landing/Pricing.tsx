import { Button } from "@/components/ui/button";
import { Check, X, Star } from "lucide-react";

export const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/mo",
      description: "Perfect for trying out Celabyte",
      features: [
        "1 database connection",
        "50 queries per month",
        "Basic charts and tables",
        "Email support",
        "Community access"
      ],
      limitations: [
        "No advanced visualizations",
        "No team collaboration",
        "No API access"
      ],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "Pro",
      price: "$29",
      period: "/mo",
      description: "For growing teams and businesses",
      features: [
        "3 database connections",
        "1,000 queries per month",
        "Advanced visualizations",
        "Team collaboration",
        "Dashboard builder",
        "Priority email support",
        "Export capabilities"
      ],
      limitations: [
        "Limited to 5 team members",
        "No custom integrations"
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Team",
      price: "$79",
      period: "/mo",
      description: "For larger teams and departments",
      features: [
        "10 database connections",
        "Unlimited queries",
        "Advanced dashboards",
        "Unlimited team members",
        "Custom visualizations",
        "API access",
        "Phone support",
        "Custom integrations"
      ],
      limitations: [
        "No on-premise deployment"
      ],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations",
      features: [
        "Unlimited database connections",
        "Unlimited everything",
        "On-premise deployment",
        "Dedicated support team",
        "Custom training",
        "SLA guarantees",
        "Advanced security controls",
        "Custom development"
      ],
      limitations: [],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 gradient-hero">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Simple, <span className="text-gradient-accent">Transparent</span> Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`gradient-card p-8 rounded-2xl surface-elevated relative group hover:scale-105 transition-all-smooth ${
                plan.popular ? 'ring-2 ring-primary glow-accent' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-8">
                <h4 className="font-semibold text-primary">What's included:</h4>
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                
                {plan.limitations.length > 0 && (
                  <div className="pt-4">
                    <h4 className="font-semibold text-muted-foreground mb-3">Not included:</h4>
                    {plan.limitations.map((limitation, limitIndex) => (
                      <div key={limitIndex} className="flex items-start gap-3">
                        <X className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{limitation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                variant={plan.popular ? "hero" : "outline"} 
                className="w-full"
                size="lg"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <p className="text-sm text-muted-foreground">
            Questions? <a href="#" className="text-primary hover:underline">Contact our sales team</a>
          </p>
        </div>
      </div>
    </section>
  );
};