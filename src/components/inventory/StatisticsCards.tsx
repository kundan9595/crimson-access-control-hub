import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatisticsCardsProps {
  statistics: {
    totalItems?: number;
    totalQuantity?: number;
    reservedQuantity?: number;
    availableQuantity?: number;
    totalClasses?: number;
    totalStyles?: number;
    warehouseCount?: number;
    damagedQuantity?: number;
    // Also support the original property names for backward compatibility
    total_items?: number;
    total_quantity?: number;
    reserved_quantity?: number;
    available_quantity?: number;
    total_classes?: number;
    total_styles?: number;
    // Support for consolidated SKU statistics
    total_skus?: number;
    total_warehouses?: number;
  } | null;
  viewType: 'sku' | 'class' | 'style';
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({ statistics, viewType }) => {
  const getCards = () => {
    switch (viewType) {
      case 'sku':
        return [
          {
            label: 'Total Items',
            value: statistics?.totalItems || statistics?.total_items || statistics?.total_skus || 0,
            color: 'blue',
            icon: '📦'
          },
          {
            label: 'Total Quantity',
            value: statistics?.totalQuantity || statistics?.total_quantity || 0,
            color: 'green',
            icon: '📊'
          },
          {
            label: 'Reserved',
            value: statistics?.reservedQuantity || statistics?.reserved_quantity || 0,
            color: 'orange',
            icon: '🔒'
          },
          {
            label: 'Available',
            value: statistics?.availableQuantity || statistics?.available_quantity || 0,
            color: 'purple',
            icon: '✅'
          }
        ];
        
      case 'class':
        return [
          {
            label: 'Total Classes',
            value: statistics?.totalClasses || statistics?.total_classes || 0,
            color: 'blue',
            icon: '📋'
          },
          {
            label: 'Total Quantity',
            value: statistics?.totalQuantity || statistics?.total_quantity || 0,
            color: 'green',
            icon: '📊'
          },
          {
            label: 'Reserved',
            value: statistics?.reservedQuantity || statistics?.reserved_quantity || 0,
            color: 'orange',
            icon: '🔒'
          },
          {
            label: 'Available',
            value: statistics?.availableQuantity || statistics?.available_quantity || 0,
            color: 'purple',
            icon: '✅'
          }
        ];
        
      case 'style':
        return [
          {
            label: 'Total Styles',
            value: statistics?.totalStyles || statistics?.total_styles || 0,
            color: 'blue',
            icon: '🎨'
          },
          {
            label: 'Total Quantity',
            value: statistics?.totalQuantity || statistics?.total_quantity || 0,
            color: 'green',
            icon: '📊'
          },
          {
            label: 'Reserved',
            value: statistics?.reservedQuantity || statistics?.reserved_quantity || 0,
            color: 'orange',
            icon: '🔒'
          },
          {
            label: 'Available',
            value: statistics?.availableQuantity || statistics?.available_quantity || 0,
            color: 'purple',
            icon: '✅'
          }
        ];
        
      default:
        return [];
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'border-l-blue-500 bg-blue-600';
      case 'green':
        return 'border-l-green-500 bg-green-600';
      case 'orange':
        return 'border-l-orange-500 bg-orange-600';
      case 'purple':
        return 'border-l-purple-500 bg-purple-600';
      default:
        return 'border-l-gray-500 bg-gray-600';
    }
  };

  const cards = getCards();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className={`border-l-4 border-l-${card.color}-500 shadow-sm`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 ${getColorClasses(card.color)} rounded-full`} />
              <div>
                <p className="text-sm text-gray-600 font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatisticsCards;
