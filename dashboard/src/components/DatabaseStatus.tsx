import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiCall } from '@/utils/api';

interface DatabaseConnection {
  id: string;
  name: string;
  kind: string;
  displayName: string;
  readOnly: boolean;
  status: string;
  createdAt: string;
  lastConnected: string;
}

const statusConfig = {
  connected: {
    icon: CheckCircle,
    color: 'text-success',
    badge: 'bg-success text-success-foreground'
  },
  warning: {
    icon: AlertCircle,
    color: 'text-warning',
    badge: 'bg-warning text-warning-foreground'
  },
  disconnected: {
    icon: XCircle,
    color: 'text-destructive',
    badge: 'bg-destructive text-destructive-foreground'
  }
};

export function DatabaseStatus() {
  const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const connections = await apiCall('/connections');
        setDatabases(connections);
      } catch (error) {
        console.error('Failed to fetch connections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, []);

  const formatLastSync = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  const getConnectionStatus = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'connected';
    if (diffHours < 24) return 'warning';
    return 'disconnected';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Connections
          </CardTitle>
          <CardDescription>
            Status of your connected data sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connections
        </CardTitle>
        <CardDescription>
          Status of your connected data sources
        </CardDescription>
      </CardHeader>
      <CardContent>
        {databases.length === 0 ? (
          <div className="text-center py-8">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">No databases connected yet</p>
            <p className="text-xs text-muted-foreground mt-1">Connect your first database to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {databases.map((db) => {
              const status = getConnectionStatus(db.createdAt);
              const StatusIcon = statusConfig[status as keyof typeof statusConfig].icon;
              const statusColor = statusConfig[status as keyof typeof statusConfig].color;
              const badgeColor = statusConfig[status as keyof typeof statusConfig].badge;
              
              return (
                <div key={db.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover-lift">
                  <div className="flex items-center space-x-3">
                    <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {db.displayName || db.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {db.kind} • Last connected: {formatLastSync(db.lastConnected)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {db.readOnly && (
                      <span className="text-xs text-muted-foreground">Read-only</span>
                    )}
                    <Badge className={badgeColor}>
                      {status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DatabaseStatus;