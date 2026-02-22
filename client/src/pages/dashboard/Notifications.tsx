import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Mail, Smartphone, AlertTriangle, CheckCircle, Info, Settings, BellRing } from 'lucide-react';

const notifications = [
  {
    id: 1,
    title: 'Database Connection Lost',
    message: 'Production DB connection was interrupted. Attempting to reconnect...',
    type: 'error',
    timestamp: '2 minutes ago',
    read: false
  },
  {
    id: 2,
    title: 'Query Limit Warning',
    message: 'You have used 85% of your monthly query limit (8,500/10,000)',
    type: 'warning',
    timestamp: '1 hour ago',
    read: false
  },
  {
    id: 3,
    title: 'New Team Member Added',
    message: 'Sarah Wilson has been added to your team with Editor permissions',
    type: 'info',
    timestamp: '2 hours ago',
    read: true
  },
  {
    id: 4,
    title: 'Subscription Renewed',
    message: 'Your Pro subscription has been renewed for another month',
    type: 'success',
    timestamp: '1 day ago',
    read: true
  },
  {
    id: 5,
    title: 'API Key Rotation Reminder',
    message: 'Your API key "Production API Key" expires in 7 days',
    type: 'warning',
    timestamp: '2 days ago',
    read: true
  },
  {
    id: 6,
    title: 'Security Alert',
    message: 'New login detected from Chrome on Windows in San Francisco, CA',
    type: 'info',
    timestamp: '3 days ago',
    read: true
  }
];

const notificationSettings = [
  {
    category: 'Security',
    description: 'Login attempts, suspicious activity, and security events',
    settings: [
      { id: 'security-email', label: 'Email notifications', enabled: true },
      { id: 'security-push', label: 'Push notifications', enabled: true },
      { id: 'security-sms', label: 'SMS alerts', enabled: false }
    ]
  },
  {
    category: 'Database',
    description: 'Connection status, performance alerts, and database events',
    settings: [
      { id: 'db-email', label: 'Email notifications', enabled: true },
      { id: 'db-push', label: 'Push notifications', enabled: true },
      { id: 'db-sms', label: 'SMS alerts', enabled: true }
    ]
  },
  {
    category: 'Billing',
    description: 'Payment confirmations, usage alerts, and subscription updates',
    settings: [
      { id: 'billing-email', label: 'Email notifications', enabled: true },
      { id: 'billing-push', label: 'Push notifications', enabled: false },
      { id: 'billing-sms', label: 'SMS alerts', enabled: false }
    ]
  },
  {
    category: 'Team',
    description: 'Team member activities, permissions, and collaboration events',
    settings: [
      { id: 'team-email', label: 'Email notifications', enabled: true },
      { id: 'team-push', label: 'Push notifications', enabled: true },
      { id: 'team-sms', label: 'SMS alerts', enabled: false }
    ]
  }
];

export function Notifications() {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'success':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">Manage your notification preferences and view recent alerts</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button className="bg-primary hover:bg-primary-hover">
              <BellRing className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <div className="h-2 w-2 bg-primary rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">Database connection</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Delivery</CardTitle>
              <Mail className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.9%</div>
              <p className="text-xs text-muted-foreground">Success rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Notifications */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>Your latest alerts and system notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${
                        !notification.read ? 'bg-primary/5 border-primary/20' : 'hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{notification.title}</h4>
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <div className="h-2 w-2 bg-primary rounded-full"></div>
                            )}
                            <Badge variant={getBadgeVariant(notification.type)} className="text-xs">
                              {notification.type}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{notification.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    Load More Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notification Settings */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how you want to receive alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {notificationSettings.map((category) => (
                    <div key={category.category}>
                      <div className="mb-3">
                        <h4 className="text-sm font-medium">{category.category}</h4>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                      <div className="space-y-3">
                        {category.settings.map((setting) => (
                          <div key={setting.id} className="flex items-center justify-between">
                            <Label htmlFor={setting.id} className="text-sm flex items-center space-x-2">
                              {setting.label === 'Email notifications' && <Mail className="h-4 w-4" />}
                              {setting.label === 'Push notifications' && <Bell className="h-4 w-4" />}
                              {setting.label === 'SMS alerts' && <Smartphone className="h-4 w-4" />}
                              <span>{setting.label}</span>
                            </Label>
                            <Switch id={setting.id} defaultChecked={setting.enabled} />
                          </div>
                        ))}
                      </div>
                      {category !== notificationSettings[notificationSettings.length - 1] && (
                        <div className="mt-4 border-b"></div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Delivery Settings</CardTitle>
                <CardDescription>Global notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Do Not Disturb</Label>
                    <p className="text-sm text-muted-foreground">
                      Pause all notifications (except critical)
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Digest Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Bundle notifications into daily summary
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Real-time Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Instant notifications for critical events
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Notifications;