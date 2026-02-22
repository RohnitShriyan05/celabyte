import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Filter, Star, Play, Edit, Trash2, Download } from 'lucide-react';

const savedQueries = [
  {
    id: 1,
    name: 'Top Customers by Revenue',
    description: 'Monthly report of highest value customers',
    query: 'SELECT customer_name, SUM(revenue) FROM orders GROUP BY customer_name ORDER BY revenue DESC LIMIT 10',
    tags: ['revenue', 'customers', 'monthly'],
    lastRun: '2 hours ago',
    executions: 45,
    favorite: true,
    duration: '234ms'
  },
  {
    id: 2,
    name: 'Weekly Active Users',
    description: 'Count of unique users active in the past 7 days',
    query: 'SELECT COUNT(DISTINCT user_id) FROM user_activity WHERE created_at >= NOW() - INTERVAL 7 DAY',
    tags: ['users', 'activity', 'weekly'],
    lastRun: '1 day ago',
    executions: 28,
    favorite: false,
    duration: '156ms'
  },
  {
    id: 3,
    name: 'Product Performance',
    description: 'Sales performance by product category',
    query: 'SELECT category, COUNT(*) as sales, AVG(price) as avg_price FROM products p JOIN orders o ON p.id = o.product_id GROUP BY category',
    tags: ['products', 'sales', 'performance'],
    lastRun: '3 days ago',
    executions: 67,
    favorite: true,
    duration: '445ms'
  },
  {
    id: 4,
    name: 'Monthly Signups',
    description: 'New user registrations by month',
    query: 'SELECT DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as signups FROM users GROUP BY month ORDER BY month DESC',
    tags: ['users', 'signups', 'growth'],
    lastRun: '1 week ago',  
    executions: 23,
    favorite: false,
    duration: '189ms'
  }
];

export function Queries() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Saved Queries</h1>
            <p className="text-muted-foreground">Manage and organize your frequently used queries</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button className="bg-primary hover:bg-primary-hover">
              <Star className="mr-2 h-4 w-4" />
              New Query
            </Button>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savedQueries.length}</div>
              <p className="text-xs text-muted-foreground">+2 this week</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorites</CardTitle>
              <Star className="h-4 w-4 text-warning fill-current" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savedQueries.filter(q => q.favorite).length}</div>
              <p className="text-xs text-muted-foreground">Most used queries</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Search Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, description, or tags..." 
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queries List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          {savedQueries.map((query) => (
            <Card key={query.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg">{query.name}</CardTitle>
                    {query.favorite && (
                      <Star className="h-4 w-4 text-warning fill-current" />
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{query.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Query Preview */}
                  <div className="bg-secondary/50 p-3 rounded-lg">
                    <code className="text-sm text-muted-foreground font-mono break-all">
                      {query.query}
                    </code>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {query.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Stats and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-4 text-sm text-muted-foreground">
                      <span>Last run: {query.lastRun}</span>
                      <span>•</span>
                      <span>{query.executions} executions</span>
                      <span>•</span>
                      <span>Avg: {query.duration}</span>
                    </div>
                    <Button size="sm" className="bg-primary hover:bg-primary-hover">
                      <Play className="mr-2 h-4 w-4" />
                      Run
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Queries;