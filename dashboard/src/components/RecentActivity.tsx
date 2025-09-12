import React, { useState, useEffect } from 'react';
import { Clock, Database, MessageSquare, Users, Shield, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiCall } from '@/utils/api';

interface QueryActivity {
  id: string;
  query: string;
  timestamp: string;
  duration: number;
  rows: number;
  status: string;
  error?: string;
  tool: string;
  target?: string;
}

const statusColors = {
  success: 'bg-success text-success-foreground',
  info: 'bg-primary text-primary-foreground',
  warning: 'bg-warning text-warning-foreground',
  error: 'bg-destructive text-destructive-foreground'
};

export function RecentActivity() {
  const [activities, setActivities] = useState<QueryActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentQueries = async () => {
      try {
        const queryHistory = await apiCall('/queries/history?limit=8');
        setActivities(queryHistory);
      } catch (error) {
        console.error('Failed to fetch recent activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentQueries();
  }, []);

  const formatTimeAgo = (timestampString: string) => {
    const timestamp = new Date(timestampString);
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  const getActivityIcon = (tool: string, status: string) => {
    if (status === 'error') return XCircle;
    
    switch (tool) {
      case 'runSQL':
      case 'runMongo':
      case 'runSheet':
        return MessageSquare;
      case 'listTables':
      case 'describeTable':
        return Database;
      default:
        return CheckCircle;
    }
  };

  const getActivityStatus = (status: string) => {
    return status === 'success' ? 'success' : 'error';
  };

  const truncateQuery = (query: string, maxLength: number = 50) => {
    if (query.length <= maxLength) return query;
    return query.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest actions and events in your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
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
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest queries and database operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1">Run your first query to see activity here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.tool, activity.status);
              const status = getActivityStatus(activity.status);
              
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${statusColors[status as keyof typeof statusColors]}`}>
                    <ActivityIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.status === 'success' ? 'Query executed successfully' : 'Query failed'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {truncateQuery(activity.query)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                      {activity.duration && (
                        <span className="text-xs text-muted-foreground">
                          • {activity.duration}ms
                        </span>
                      )}
                      {activity.rows !== null && activity.rows !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          • {activity.rows} rows
                        </span>
                      )}
                      {activity.target && (
                        <span className="text-xs text-muted-foreground">
                          • {activity.target}
                        </span>
                      )}
                    </div>
                    {activity.error && (
                      <p className="text-xs text-destructive mt-1">
                        Error: {activity.error}
                      </p>
                    )}
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

export default RecentActivity;