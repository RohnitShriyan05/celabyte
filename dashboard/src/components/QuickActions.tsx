import React from 'react';
import { Plus, Database, MessageSquare, Key, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Connect Database',
      description: 'Add PostgreSQL, MySQL, MongoDB or Excel',
      icon: Database,
      variant: 'default' as const,
      onClick: () => navigate('/databases')
    },
    {
      title: 'New Query',
      description: 'Chat with your data in natural language',
      icon: MessageSquare,
      variant: 'secondary' as const,
      onClick: () => navigate('/console')
    },
    {
      title: 'Generate API Key',
      description: 'Create keys for programmatic access',
      icon: Key,
      variant: 'outline' as const,
      onClick: () => navigate('/api-keys')
    },
    {
      title: 'Invite Team',
      description: 'Add team members to collaborate',
      icon: Users,
      variant: 'outline' as const,
      onClick: () => navigate('/team')
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Get started with common tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant={action.variant}
              className="h-auto p-4 justify-start hover-lift"
              onClick={action.onClick}
            >
              <div className="flex items-start space-x-3">
                <action.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default QuickActions;