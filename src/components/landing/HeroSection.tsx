import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import heroMockup from "@/assets/hero-mockup.jpg";

export const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center gradient-hero relative overflow-hidden">
      {/* Background Animation Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-gradient-accent">Chat With</span>
              <br />
              Your Database.
              <br />
              <span className="text-foreground">Instantly.</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-2xl">
              Celabyte lets you talk to your data in plain English—get answers, reports, 
              and insights without writing a single query.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="xl" className="group">
                Start Free Trial
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline_hero" size="xl" className="group">
                <Play className="mr-2 h-5 w-5" />
                Book a Demo
              </Button>
            </div>
            
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Setup in 2 minutes
              </div>
            </div>
          </div>
          
          {/* Right Content - Product Mockup */}
          <div className="relative">
            <div className="relative bg-surface rounded-2xl p-2 surface-elevated">
              <img 
                src={heroMockup} 
                alt="Celabyte chat interface showing database query results"
                className="w-full h-auto rounded-xl"
              />
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-primary text-white px-4 py-2 rounded-lg font-medium animate-bounce">
                SQL Free!
              </div>
              <div className="absolute -bottom-4 -left-4 bg-green-500 text-white px-4 py-2 rounded-lg font-medium animate-bounce delay-500">
                Instant Results
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};