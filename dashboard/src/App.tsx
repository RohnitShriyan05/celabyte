import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Databases from "./pages/Databases";
import Console from "./pages/Console";
import Queries from "./pages/Queries";
import Team from "./pages/Team";
import ApiKeys from "./pages/ApiKeys";
import Billing from "./pages/Billing";
import Security from "./pages/Security";
import Notifications from "./pages/Notifications";
import Help from "./pages/Help";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <AuthGuard>
                  <Index />
                </AuthGuard>
              }
            />
            <Route
              path="/databases"
              element={
                <AuthGuard>
                  <Databases />
                </AuthGuard>
              }
            />
            <Route
              path="/console"
              element={
                <AuthGuard>
                  <Console />
                </AuthGuard>
              }
            />
            <Route
              path="/queries"
              element={
                <AuthGuard>
                  <Queries />
                </AuthGuard>
              }
            />
            <Route
              path="/team"
              element={
                <AuthGuard>
                  <Team />
                </AuthGuard>
              }
            />
            <Route
              path="/api-keys"
              element={
                <AuthGuard>
                  <ApiKeys />
                </AuthGuard>
              }
            />
            <Route
              path="/billing"
              element={
                <AuthGuard>
                  <Billing />
                </AuthGuard>
              }
            />
            <Route
              path="/security"
              element={
                <AuthGuard>
                  <Security />
                </AuthGuard>
              }
            />
            <Route
              path="/notifications"
              element={
                <AuthGuard>
                  <Notifications />
                </AuthGuard>
              }
            />
            <Route
              path="/help"
              element={
                <AuthGuard>
                  <Help />
                </AuthGuard>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              }
            />
            <Route
              path="/settings"
              element={
                <AuthGuard>
                  <Settings />
                </AuthGuard>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
