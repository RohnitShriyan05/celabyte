import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Plus, Copy, RotateCcw, Trash2, Eye, EyeOff, Shield } from 'lucide-react';

const apiKeys = [
  {
    id: 1,
    name: 'Production API Key',
    key: 'dk_live_5a8b9c2d1e3f4g5h6i7j8k9l0m1n2o3p',
    created: '2024-01-15',
    lastUsed: '2 hours ago',
    requests: 15847,
    status: 'Active',
    permissions: ['read', 'query']
  },
  {
    id: 2,
    name: 'Development Key',
    key: 'dk_test_9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k',
    created: '2024-02-01',
    lastUsed: '1 day ago',
    requests: 3421,
    status: 'Active',
    permissions: ['read', 'query', 'write']
  },
  {
    id: 3,
    name: 'Analytics Dashboard',
    key: 'dk_live_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
    created: '2024-01-20',
    lastUsed: '1 week ago',
    requests: 8934,
    status: 'Inactive',
    permissions: ['read']
  }
];

export function ApiKeys() {
  const [showKeys, setShowKeys] = useState<{[key: number]: boolean}>({});
  const [newKeyName, setNewKeyName] = useState('');

  const toggleKeyVisibility = (keyId: number) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const maskKey = (key: string) => {
    return key.substring(0, 8) + '••••••••••••••••••••••••••••••••' + key.substring(key.length - 4);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API Keys & Integrations</h1>
            <p className="text-muted-foreground">Manage API keys for programmatic access to your databases</p>
          </div>
          <Button className="bg-primary hover:bg-primary-hover">
            <Plus className="mr-2 h-4 w-4" />
            Create API Key
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apiKeys.length}</div>
              <p className="text-xs text-muted-foreground">+1 this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
              <div className="h-2 w-2 bg-success rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apiKeys.filter(k => k.status === 'Active').length}</div>
              <p className="text-xs text-muted-foreground">67% of total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Requests</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28.2K</div>
              <p className="text-xs text-muted-foreground">+12% from last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rate Limit</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1000/hr</div>
              <p className="text-xs text-muted-foreground">Current plan limit</p>
            </CardContent>
          </Card>
        </div>

        {/* Create New Key */}
        <Card>
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
            <CardDescription>Generate a new API key for your applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Mobile App Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                    Read
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                    Query
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                    Write
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button className="bg-primary hover:bg-primary-hover">
                <Key className="mr-2 h-4 w-4" />
                Generate API Key
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Keys */}
        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>Manage your existing API keys and monitor usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{apiKey.name}</h3>
                        <Badge variant={apiKey.status === 'Active' ? 'default' : 'secondary'}>
                          {apiKey.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="text-sm bg-secondary/50 px-2 py-1 rounded font-mono">
                          {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        >
                          {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {apiKey.permissions.map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm font-medium">{apiKey.requests.toLocaleString()} requests</p>
                      <p className="text-xs text-muted-foreground">Last used: {apiKey.lastUsed}</p>
                      <p className="text-xs text-muted-foreground">Created: {apiKey.created}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Integration Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Examples</CardTitle>
            <CardDescription>How to use your API keys in different environments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">cURL Example</h4>
                <div className="bg-secondary/50 p-3 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     -d '{"query": "SELECT * FROM users LIMIT 10"}' \\
     https://api.dbchat.com/v1/query`}
                  </pre>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">JavaScript Example</h4>
                <div className="bg-secondary/50 p-3 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">
{`fetch('https://api.dbchat.com/v1/query', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({query: 'SELECT * FROM users'})
})`}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default ApiKeys;
