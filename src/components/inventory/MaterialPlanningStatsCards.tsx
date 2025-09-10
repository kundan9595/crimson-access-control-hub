import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  AlertTriangle, 
  AlertCircle, 
  TrendingUp
} from 'lucide-react';
import { MaterialPlanningStatistics } from '@/services/inventory/materialPlanningTypes';

interface MaterialPlanningStatsCardsProps {
  statistics?: MaterialPlanningStatistics;
  isLoading: boolean;
}

const MaterialPlanningStatsCards: React.FC<MaterialPlanningStatsCardsProps> = ({
  statistics,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const statsCards = [
    {
      title: 'Total SKUs',
      value: statistics.total_skus,
      icon: Package,
      description: 'Active SKUs in system',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Critical Items',
      value: statistics.critical_count,
      icon: AlertCircle,
      description: 'Below minimum threshold',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Low Stock Items',
      value: statistics.low_count,
      icon: AlertTriangle,
      description: 'Near minimum threshold',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Overstocked Items',
      value: statistics.overstocked_count,
      icon: TrendingUp,
      description: 'Above optimal threshold',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
};

export default MaterialPlanningStatsCards;
