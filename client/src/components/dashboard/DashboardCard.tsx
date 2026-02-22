import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  value?: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  onClick?: () => void;
}

export function DashboardCard({
  title,
  description,
  icon: Icon,
  value,
  change,
  trend = 'neutral',
  className,
  onClick
}: DashboardCardProps) {
  return (
    <Card 
      className={cn(
        'hover-lift cursor-pointer transition-all duration-200',
        onClick && 'hover:bg-card-hover',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value || '—'}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
        {change && (
          <div className={cn(
            'text-xs mt-1 font-medium',
            trend === 'up' && 'text-success',
            trend === 'down' && 'text-destructive',
            trend === 'neutral' && 'text-muted-foreground'
          )}>
            {change}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DashboardCard;