import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Package,
  Scissors,
  ArrowRight,
} from 'lucide-react';

interface ReportCategory {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  badge?: string;
}

const Reports = () => {
  const navigate = useNavigate();

  const reportCategories: ReportCategory[] = [
    {
      title: 'Custom Order Reports',
      description: 'View and download custom product order reports with customer details, order status, and totals',
      icon: ShoppingCart,
      path: '/reports/order-reports',
      color: 'text-blue-600',
      badge: 'Custom',
    },
    {
      title: 'RMP Order Reports',
      description: 'Ready Made Product order reports with SKU details, quantities, and pricing information',
      icon: Package,
      path: '/reports/rmp-order-reports',
      color: 'text-emerald-600',
      badge: 'RMP',
    },
    {
      title: 'Tailor Reports',
      description: 'Tailor assignment reports including order assignments, completion status, and work tracking',
      icon: Scissors,
      path: '/reports/tailor-reports',
      color: 'text-amber-600',
      badge: 'Tailor',
    },
  ];

  const ReportCard = ({ category }: { category: ReportCategory }) => {
    const Icon = category.icon;
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Icon className={`h-6 w-6 ${category.color}`} />
            <CardTitle className="text-xl">{category.title}</CardTitle>
            {category.badge && (
              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs">
                {category.badge}
              </Badge>
            )}
          </div>
          <CardDescription>{category.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => navigate(category.path)}
            className="w-full"
            variant="outline"
          >
            Open Report
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          View, search, and download operational reports for orders and tailor assignments
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportCategories.map((category) => (
          <ReportCard key={category.path} category={category} />
        ))}
      </div>
    </div>
  );
};

export default Reports;
