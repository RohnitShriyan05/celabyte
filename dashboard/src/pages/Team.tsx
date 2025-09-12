import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Shield, Edit, MoreHorizontal, Users, Crown, Eye } from 'lucide-react';

const teamMembers = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'Admin',
    avatar: '/api/placeholder/32/32',
    status: 'Active',
    lastActive: '2 minutes ago',
    queries: 1247,
    databases: ['Production DB', 'Analytics DB']
  },
  {
    id: 2,
    name: 'Sarah Wilson',
    email: 'sarah.wilson@company.com',
    role: 'Editor',
    avatar: '/api/placeholder/32/32',
    status: 'Active',
    lastActive: '1 hour ago',
    queries: 834,
    databases: ['Analytics DB']
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike.johnson@company.com',
    role: 'Viewer',
    avatar: '/api/placeholder/32/32',
    status: 'Invited',
    lastActive: 'Never',
    queries: 0,
    databases: []
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    role: 'Editor',
    avatar: '/api/placeholder/32/32',
    status: 'Active',
    lastActive: '3 days ago',
    queries: 456,
    databases: ['Production DB']
  }
];

const roleColors = {
  Admin: 'destructive',
  Editor: 'default',
  Viewer: 'secondary'
} as const;

const statusColors = {
  Active: 'default',
  Invited: 'secondary',
  Inactive: 'outline'
} as const;

export function Team() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
            <p className="text-muted-foreground">Manage team members and their database access permissions</p>
          </div>
          <Button className="bg-primary hover:bg-primary-hover">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.length}</div>
              <p className="text-xs text-muted-foreground">+1 this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <div className="h-2 w-2 bg-success rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.filter(m => m.status === 'Active').length}</div>
              <p className="text-xs text-muted-foreground">75% of team</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.filter(m => m.status === 'Invited').length}</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Crown className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.filter(m => m.role === 'Admin').length}</div>
              <p className="text-xs text-muted-foreground">Full access</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage roles and database access for your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{member.name}</h3>
                        <Badge variant={roleColors[member.role as keyof typeof roleColors]}>
                          {member.role === 'Admin' && <Crown className="mr-1 h-3 w-3" />}
                          {member.role === 'Editor' && <Edit className="mr-1 h-3 w-3" />}
                          {member.role === 'Viewer' && <Eye className="mr-1 h-3 w-3" />}
                          {member.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge variant={statusColors[member.status as keyof typeof statusColors]} className="text-xs">
                          {member.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Last active: {member.lastActive}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm font-medium">{member.queries} queries</p>
                      <p className="text-xs text-muted-foreground">
                        {member.databases.length > 0 
                          ? `${member.databases.length} database${member.databases.length > 1 ? 's' : ''}`
                          : 'No access'
                        }
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>Understanding what each role can do</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Crown className="h-5 w-5 text-warning" />
                  <h3 className="font-semibold">Admin</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Full database access</li>
                  <li>• Manage team members</li>
                  <li>• Create/delete connections</li>
                  <li>• Billing management</li>
                  <li>• Security settings</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Edit className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Editor</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Run queries</li>
                  <li>• Save queries</li>
                  <li>• Export results</li>
                  <li>• View team activity</li>
                  <li>• Access assigned DBs</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Viewer</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View saved queries</li>
                  <li>• Run existing queries</li>
                  <li>• Export results</li>
                  <li>• Read-only access</li>
                  <li>• Limited DB access</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default Team;