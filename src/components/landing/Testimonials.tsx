import { Star, Quote } from "lucide-react";

export const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "VP of Data",
      company: "TechFlow Inc",
      avatar: "SC",
      content: "Celabyte transformed how our team works with data. We went from waiting days for analyst reports to getting instant insights. Our decision-making speed has increased 10x.",
      rating: 5,
    },
    {
      name: "Marcus Rodriguez",
      role: "Founder",
      company: "StartupXYZ",
      avatar: "MR",
      content: "As a non-technical founder, I can now directly query our database and understand our metrics without bothering our engineers. Game changer for early-stage startups.",
      rating: 5,
    },
    {
      name: "Jennifer Walsh",
      role: "Product Manager",
      company: "Enterprise Corp",
      avatar: "JW",
      content: "The natural language interface is incredibly intuitive. I can ask complex questions about user behavior and get beautiful visualizations instantly. Our product iterations are much faster now.",
      rating: 5,
    },
  ];

  return (
    <section className="py-24 bg-surface">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Loved by <span className="text-gradient-accent">Teams</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See what teams are saying about their experience with Celabyte.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="gradient-card p-8 rounded-2xl surface-elevated group hover:scale-105 transition-all-smooth"
            >
              <div className="flex items-center gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              
              <div className="relative mb-6">
                <Quote className="absolute -top-2 -left-2 w-8 h-8 text-primary/20" />
                <p className="text-foreground leading-relaxed relative z-10">
                  "{testimonial.content}"
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};