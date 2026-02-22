import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/dashboard/AuthGuard";

// Landing pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Dashboard pages
import Auth from "./pages/dashboard/Auth";
import DashboardIndex from "./pages/dashboard/Index";
import Databases from "./pages/dashboard/Databases";
import Console from "./pages/dashboard/Console";
import Queries from "./pages/dashboard/Queries";
import Team from "./pages/dashboard/Team";
import ApiKeys from "./pages/dashboard/ApiKeys";
import Billing from "./pages/dashboard/Billing";
import Security from "./pages/dashboard/Security";
import Notifications from "./pages/dashboard/Notifications";
import Help from "./pages/dashboard/Help";
import Profile from "./pages/dashboard/Profile";
import Settings from "./pages/dashboard/Settings";
import Leads from "./pages/dashboard/Leads";
import EmailTemplates from "./pages/dashboard/EmailTemplates";
import EmailCampaigns from "./pages/dashboard/EmailCampaigns";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<Index />} />

            {/* Auth */}
            <Route path="/auth" element={<Auth />} />

            {/* Dashboard routes (protected) */}
            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <DashboardIndex />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/databases"
              element={
                <AuthGuard>
                  <Databases />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/console"
              element={
                <AuthGuard>
                  <Console />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/queries"
              element={
                <AuthGuard>
                  <Queries />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/team"
              element={
                <AuthGuard>
                  <Team />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/api-keys"
              element={
                <AuthGuard>
                  <ApiKeys />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/billing"
              element={
                <AuthGuard>
                  <Billing />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/security"
              element={
                <AuthGuard>
                  <Security />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/notifications"
              element={
                <AuthGuard>
                  <Notifications />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/help"
              element={
                <AuthGuard>
                  <Help />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <AuthGuard>
                  <Settings />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/leads"
              element={
                <AuthGuard>
                  <Leads />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/email-templates"
              element={
                <AuthGuard>
                  <EmailTemplates />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/email-campaigns"
              element={
                <AuthGuard>
                  <EmailCampaigns />
                </AuthGuard>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
