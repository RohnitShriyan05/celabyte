import React, { useState, useEffect } from 'react';
import { Database, MessageSquare, Users, Zap, TrendingUp, Clock } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { apiCall } from '@/utils/api';

interface QueryStats {
  totalQueries: number;
  successRate: number;
  avgDuration: number;
  avgRowsReturned: number;
  totalRowsProcessed: number;
  period: string;
}

interface Connection {
  id: string;
  name: string;
  kind: string;
  status: string;
  createdAt: string;
}

export function StatsOverview() {
  const [stats, setStats] = useState<QueryStats | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch query statistics and connections in parallel
        const [queryStats, connectionsData] = await Promise.all([
          apiCall('/queries/stats?days=30').catch(() => ({
            totalQueries: 0,
            successRate: 0,
            avgDuration: 0,
            avgRowsReturned: 0,
            totalRowsProcessed: 0,
            period: '30 days'
          })),
          apiCall('/connections').catch(() => [])
        ]);
        
        setStats(queryStats);
        setConnections(connectionsData);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const connectedDatabases = connections.filter(conn => conn.status === 'connected').length;
  const totalDatabases = connections.length;

  const dashboardStats = [
    {
      title: 'Total Databases',
      value: totalDatabases.toString(),
      description: `${connectedDatabases} connected, ${totalDatabases - connectedDatabases} offline`,
      change: totalDatabases > 0 ? 'Active connections' : 'No connections',
      trend: connectedDatabases > 0 ? 'up' as const : 'neutral' as const,
      icon: Database
    },
    {
      title: 'Queries This Month',
      value: stats?.totalQueries.toLocaleString() || '0',
      description: 'Natural language queries',
      change: `${Math.round(stats?.successRate || 0)}% success rate`,
      trend: (stats?.successRate || 0) >= 90 ? 'up' as const : 'down' as const,
      icon: MessageSquare
    },
    {
      title: 'Avg Response Time',
      value: stats?.avgDuration ? `${(stats.avgDuration / 1000).toFixed(1)}s` : '0s',
      description: 'Query execution time',
      change: stats?.avgDuration ? `${stats.avgDuration}ms average` : 'No data',
      trend: (stats?.avgDuration || 0) < 2000 ? 'up' as const : 'down' as const,
      icon: Clock
    },
    {
      title: 'Rows Processed',
      value: stats?.totalRowsProcessed?.toLocaleString() || '0',
      description: 'Total data processed',
      change: `Avg ${stats?.avgRowsReturned || 0} per query`,
      trend: (stats?.totalRowsProcessed || 0) > 0 ? 'up' as const : 'neutral' as const,
      icon: TrendingUp
    },
    {
      title: 'Database Types',
      value: new Set(connections.map(c => c.kind)).size.toString(),
      description: connections.map(c => c.kind).join(', ') || 'None configured',
      change: `${totalDatabases} total connections`,
      trend: 'neutral' as const,
      icon: Zap
    },
    {
      title: 'Active Period',
      value: stats?.period || '30 days',
      description: 'Statistics timeframe',
      change: stats?.totalQueries ? 'Data available' : 'No activity',
      trend: 'neutral' as const,
      icon: Users
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {dashboardStats.map((stat) => (
        <DashboardCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          description={stat.description}
          change={stat.change}
          trend={stat.trend}
          icon={stat.icon}
        />
      ))}
    </div>
  );
}

export default StatsOverview;