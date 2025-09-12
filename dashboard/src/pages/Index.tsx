import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatsOverview } from '@/components/StatsOverview';
import { QuickActions } from '@/components/QuickActions';
import { RecentActivity } from '@/components/RecentActivity';
import { DatabaseStatus } from '@/components/DatabaseStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Database, MessageSquare, BarChart3, Shield, LogIn, BookOpen, Sparkles } from 'lucide-react';
import heroImage from '@/assets/dashboard-hero.jpg';

const Index = () => {
  const { user, loading } = useAuth();

  // If user is not authenticated, show landing page
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-primary/5">
        {/* Navigation */}
        <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2">
                <Database className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Cellabyte
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                    Chat with your{' '}
                    <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                      databases
                    </span>
                  </h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Connect PostgreSQL, MySQL, MongoDB, Excel and Sheets. Query your data using natural language 
                    and get instant insights without writing SQL.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/auth">
                    <Button size="lg" className="bg-primary hover:bg-primary/90">
                      Start Free Trial
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg">
                    Watch Demo
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">500+</div>
                    <div className="text-sm text-muted-foreground">Companies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">1M+</div>
                    <div className="text-sm text-muted-foreground">Queries</div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-2xl" />
                <img
                  src={heroImage}
                  alt="Database Dashboard"
                  className="rounded-2xl shadow-2xl backdrop-blur-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-secondary/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold">Everything you need to query your data</h2>
              <p className="text-xl text-muted-foreground">
                Powerful features to help you understand your data better
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Natural Language Queries</h3>
                <p className="text-muted-foreground">
                  Ask questions in plain English and get instant SQL results. No technical knowledge required.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Visual Analytics</h3>
                <p className="text-muted-foreground">
                  Automatically generate charts and graphs from your query results for better insights.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Enterprise Security</h3>
                <p className="text-muted-foreground">
                  Bank-grade security with read-only access, encrypted connections, and role-based permissions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, show dashboard
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-white/10 to-transparent" />
          <div className="relative p-8 text-left">
            <div className="max-w-2xl">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered Database Assistant
              </Badge>
              <h1 className="text-4xl font-bold mb-4 gradient-text">
                Welcome to Cellabyte
              </h1>
              <p className="text-xl text-neutral-300 mb-6">
                Chat with your databases in natural language. Connect PostgreSQL, MySQL, MongoDB, and Excel files to get instant insights from your data.
              </p>
              <div className="flex space-x-4">
                <Button size="lg" className="bg-primary hover:bg-primary-hover">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Get Started Guide
                </Button>
                <Button variant="outline" size="lg">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsOverview />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <QuickActions />
            <RecentActivity />
          </div>
          <div className="space-y-6">
            <DatabaseStatus />
            
            {/* Support Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
                <CardDescription>
                  Get assistance with setup and queries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Documentation
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
