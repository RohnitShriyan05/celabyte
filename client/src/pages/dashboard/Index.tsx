import React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { DatabaseStatus } from "@/components/dashboard/DatabaseStatus";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  BarChart3,
  BookOpen,
  Sparkles,
} from "lucide-react";

const DashboardIndex = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
          <div className="relative p-4 sm:p-6 md:p-8 text-left">
            <div className="max-w-2xl">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered Database Assistant
              </Badge>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 gradient-text">
                Welcome to Celabyte
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 leading-relaxed">
                Chat with your databases in natural language. Connect
                PostgreSQL, MySQL, MongoDB, and Excel files to get instant
                insights from your data.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Get Started Guide
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          <div className="xl:col-span-2 space-y-4 md:space-y-6">
            <QuickActions />
            <RecentActivity />
          </div>
          <div className="space-y-4 md:space-y-6">
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

export default DashboardIndex;
