import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center gradient-hero relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
                Chat With Your Database.{" "}
                <span className="text-gradient-accent">
                  Instantly.
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Celabyte lets you talk to your data in plain English—get answers, reports, and insights without writing a single query.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8 py-4 bg-google-blue hover:bg-google-blue/90 glow-accent font-semibold">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-2 border-muted-foreground text-muted-foreground hover:bg-muted hover:text-foreground font-semibold">
                Book a Demo
              </Button>
            </div>

            <div className="bg-surface p-6 rounded-xl border shadow-card">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Try it now:</div>
                  <div className="text-base text-foreground">"Show me sales by region this month"</div>
                </div>
                <div className="text-2xl">📊</div>
              </div>
            </div>
          </div>

          {/* Right Content - Product Mockup */}
          <div className="relative">
            <div className="relative bg-card border rounded-2xl shadow-elevated p-6">
              <div className="bg-surface rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-google-blue rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">C</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Chat with your database</div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 shadow-card border-l-4 border-l-google-blue">
                    <div className="text-sm text-muted-foreground mb-1">You asked:</div>
                    <div className="font-medium">"Show me sales by region this month"</div>
                  </div>
                  
                  <div className="bg-gradient-card rounded-lg p-4 shadow-card">
                    <div className="text-sm text-muted-foreground mb-3">Here's your data:</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>North:</span>
                        <span className="font-semibold google-blue">$124K</span>
                      </div>
                      <div className="flex justify-between">
                        <span>South:</span>
                        <span className="font-semibold google-green">$98K</span>
                      </div>
                      <div className="flex justify-between">
                        <span>East:</span>
                        <span className="font-semibold google-yellow">$156K</span>
                      </div>
                      <div className="flex justify-between">
                        <span>West:</span>
                        <span className="font-semibold google-red">$87K</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-3 -left-3 bg-google-green text-white px-3 py-1 rounded-full text-sm font-semibold shadow-card">
                No SQL needed!
              </div>
              <div className="absolute -bottom-3 -right-3 bg-google-yellow text-white px-3 py-1 rounded-full text-sm font-semibold shadow-card">
                Instant insights
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};