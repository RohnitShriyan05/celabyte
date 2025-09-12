import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export const FinalCTA = () => {
  return (
    <section className="py-24 bg-surface relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">
            Your Data.{" "}
            <span className="text-gradient-accent">One Chat Away.</span>
          </h2>
          
          <p className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Start today for free and see why teams love Celabyte. 
            No credit card required, setup in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Button variant="hero" size="xl" className="group">
              Get Started Free
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline_hero" size="xl" className="group">
              <Play className="mr-2 h-5 w-5" />
              Request a Demo
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="group">
              <div className="text-3xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                14 days
              </div>
              <div className="text-muted-foreground">Free trial</div>
            </div>
            <div className="group">
              <div className="text-3xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                2 minutes
              </div>
              <div className="text-muted-foreground">Setup time</div>
            </div>
            <div className="group">
              <div className="text-3xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                500+
              </div>
              <div className="text-muted-foreground">Happy customers</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};