import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Key, AlertTriangle, CheckCircle, Users, Clock, Globe } from 'lucide-react';

const securityEvents = [
  {
    id: 1,
    event: 'New login from Chrome on Windows',
    location: 'San Francisco, CA',
    timestamp: '2 minutes ago',
    status: 'success',
    ip: '192.168.1.100'
  },
  {
    id: 2,
    event: 'API key rotated',
    location: 'System',
    timestamp: '1 hour ago',
    status: 'info',
    ip: 'N/A'
  },
  {
    id: 3,
    event: 'Failed login attempt',
    location: 'Unknown location',
    timestamp: '2 days ago',
    status: 'warning',
    ip: '185.123.45.67'
  }
];

const activeSessions = [
  {
    id: 1,
    device: 'Chrome on MacOS',
    location: 'San Francisco, CA',
    ip: '192.168.1.100',
    lastActive: '2 minutes ago',
    current: true
  },
  {
    id: 2,
    device: 'Firefox on Windows',
    location: 'New York, NY',
    ip: '10.0.0.50',
    lastActive: '2 hours ago',
    current: false
  },
  {
    id: 3,
    device: 'Safari on iPhone',
    location: 'Los Angeles, CA',
    ip: '172.16.0.25',
    lastActive: '1 day ago',
    current: false
  }
];

export function Security() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
            <p className="text-muted-foreground">Manage your account security and monitor access</p>
          </div>
          <Button className="bg-primary hover:bg-primary-hover">
            <Shield className="mr-2 h-4 w-4" />
            Security Audit
          </Button>
        </div>

        {/* Security Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Shield className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">95/100</div>
              <p className="text-xs text-muted-foreground">Excellent security</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">2FA Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Enabled</div>
              <p className="text-xs text-muted-foreground">TOTP authentication</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSessions.length}</div>
              <p className="text-xs text-muted-foreground">Across all devices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Security Event</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2m</div>
              <p className="text-xs text-muted-foreground">New login detected</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Security Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="mr-2 h-5 w-5" />
                  Authentication Settings
                </CardTitle>
                <CardDescription>Configure your login and authentication preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="2fa">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch id="2fa" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="login-notifications">Login Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified of new login attempts
                    </p>
                  </div>
                  <Switch id="login-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="session-timeout">Auto Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically log out after 8 hours of inactivity
                    </p>
                  </div>
                  <Switch id="session-timeout" defaultChecked />
                </div>
                
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    <Key className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  Access Control
                </CardTitle>
                <CardDescription>Control how and where your account can be accessed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ip-whitelist">IP Address Whitelist</Label>
                    <p className="text-sm text-muted-foreground">
                      Only allow access from specific IP addresses
                    </p>
                  </div>
                  <Switch id="ip-whitelist" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="geo-blocking">Geographic Restrictions</Label>
                    <p className="text-sm text-muted-foreground">
                      Block access from certain countries
                    </p>
                  </div>
                  <Switch id="geo-blocking" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="api-rate-limit">API Rate Limiting</Label>
                    <p className="text-sm text-muted-foreground">
                      Limit API requests per hour (1000/hr)
                    </p>
                  </div>
                  <Switch id="api-rate-limit" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Monitoring */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
                <CardDescription>Monitor important security activities on your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className={`p-1 rounded-full ${
                        event.status === 'success' ? 'bg-success/20' :
                        event.status === 'warning' ? 'bg-warning/20' :
                        'bg-primary/20'
                      }`}>
                        {event.status === 'success' && <CheckCircle className="h-4 w-4 text-success" />}
                        {event.status === 'warning' && <AlertTriangle className="h-4 w-4 text-warning" />}
                        {event.status === 'info' && <Shield className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{event.event}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                          <span>{event.location}</span>
                          <span>•</span>
                          <span>{event.timestamp}</span>
                          {event.ip !== 'N/A' && (
                            <>
                              <span>•</span>
                              <span>{event.ip}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Devices and locations where you're currently signed in</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">{session.device}</p>
                            {session.current && (
                              <Badge variant="default" className="text-xs">Current</Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{session.location}</span>
                            <span>•</span>
                            <span>{session.ip}</span>
                            <span>•</span>
                            <span>{session.lastActive}</span>
                          </div>
                        </div>
                      </div>
                      {!session.current && (
                        <Button variant="outline" size="sm">
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    Revoke All Other Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Security;