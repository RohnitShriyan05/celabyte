import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Database,
  MessageSquare,
  History,
  Users,
  Key,
  CreditCard,
  Shield,
  Bell,
  HelpCircle,
  Settings,
  User,
  BarChart3,
  LogOut,
  FileSpreadsheet,
  Mail,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: BarChart3,
    current: true,
  },
  {
    name: "Database Connections",
    href: "/databases",
    icon: Database,
    current: false,
  },
  {
    name: "Query Console",
    href: "/console",
    icon: MessageSquare,
    current: false,
  },
  {
    name: "Saved Queries",
    href: "/queries",
    icon: History,
    current: false,
  },
  {
    name: "Lead Management",
    href: "/leads",
    icon: FileSpreadsheet,
    current: false,
  },
  {
    name: "Email Templates",
    href: "/email-templates",
    icon: Mail,
    current: false,
  },
  {
    name: "Email Campaigns",
    href: "/email-campaigns",
    icon: Send,
    current: false,
  },
  {
    name: "Team Management",
    href: "/team",
    icon: Users,
    current: false,
  },
  {
    name: "API Keys",
    href: "/api-keys",
    icon: Key,
    current: false,
  },
  {
    name: "Billing",
    href: "/billing",
    icon: CreditCard,
    current: false,
  },
  {
    name: "Security",
    href: "/security",
    icon: Shield,
    current: false,
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
    current: false,
  },
  {
    name: "Help & Support",
    href: "/help",
    icon: HelpCircle,
    current: false,
  },
];

const profileNavigation = [
  {
    name: "Profile Settings",
    href: "/profile",
    icon: User,
    current: false,
  },
  {
    name: "Account Settings",
    href: "/settings",
    icon: Settings,
    current: false,
  },
];

export function Sidebar({
  mobile = false,
  onClose,
}: {
  mobile?: boolean;
  onClose?: () => void;
}) {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      if (onClose) onClose();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNavClick = () => {
    if (mobile && onClose) {
      onClose();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col w-full h-full bg-card">
      {/* Logo - only show on desktop */}
      {!mobile && (
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center shadow-sm">
              <Database className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">Cellabyte</span>
          </div>
          <ThemeToggle />
        </div>
      )}

      {/* Mobile Header */}
      {mobile && (
        <div className="flex items-center justify-center h-16 px-4 border-b border-border bg-muted/30">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center shadow-sm">
              <Database className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">Cellabyte</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary hover-lift"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className="px-4 py-4 border-t border-border mt-auto">
        <div className="space-y-2">
          {profileNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-4 w-4 transition-colors",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.name}
              </Link>
            );
          })}

          {/* User Info & Sign Out */}
          <div className="pt-2 mt-2 border-t border-border">
            <div className="flex items-center space-x-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || "No email"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (mobile) {
    return sidebarContent;
  }

  return (
    <div className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full">
      {sidebarContent}
    </div>
  );
}

export default Sidebar;
