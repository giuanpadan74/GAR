import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  FileText, 
  DollarSign, 
  Users,
  ShoppingCart,
  Calendar,
  BarChart3,
  Target
} from 'lucide-react';

interface StatData {
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
  description?: string;
}

interface StatsCardProps {
  title: string;
  stats: StatData[];
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  stats,
  className = ''
}) => {
  const formatChange = (change: number, changeType: 'increase' | 'decrease' | 'neutral') => {
    const isPositive = changeType === 'increase';
    const isNegative = changeType === 'decrease';
    
    return (
      <div className={`flex items-center text-sm ${
        isPositive ? 'text-green-600' : 
        isNegative ? 'text-red-600' : 
        'text-gray-500'
      }`}>
        {isPositive && <TrendingUp className="w-3 h-3 mr-1" />}
        {isNegative && <TrendingDown className="w-3 h-3 mr-1" />}
        <span>
          {isPositive && '+'}
          {change}%
        </span>
      </div>
    );
  };

  const formatValue = (value: string | number) => {
    if (typeof value === 'number') {
      // Se è un numero con decimali, formattalo come valuta
      if (value % 1 !== 0 && value > 100) {
        return new Intl.NumberFormat('it-IT', {
          style: 'currency',
          currency: 'EUR'
        }).format(value);
      }
      // Altrimenti formattalo come numero
      return new Intl.NumberFormat('it-IT').format(value);
    }
    return value;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </div>
                </div>
                
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatValue(stat.value)}
                </div>
                
                {stat.change !== undefined && stat.changeType && (
                  <div className="mb-2">
                    {formatChange(stat.change, stat.changeType)}
                  </div>
                )}
                
                {stat.description && (
                  <div className="text-xs text-gray-500">
                    {stat.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componenti predefiniti per statistiche comuni
export const ProductStatsCard: React.FC<{
  totalProducts: number;
  activeProducts: number;
  averagePrice: number;
  className?: string;
}> = ({ totalProducts, activeProducts, averagePrice, className }) => {
  const stats: StatData[] = [
    {
      label: 'Prodotti Totali',
      value: totalProducts,
      icon: <Package className="w-4 h-4" />,
      color: 'bg-blue-100 text-blue-600',
      description: 'Prodotti nel catalogo'
    },
    {
      label: 'Prodotti Attivi',
      value: activeProducts,
      change: Math.round((activeProducts / totalProducts) * 100),
      changeType: 'neutral',
      icon: <Target className="w-4 h-4" />,
      color: 'bg-green-100 text-green-600',
      description: 'Disponibili per vendita'
    },
    {
      label: 'Prezzo Medio',
      value: averagePrice,
      icon: <DollarSign className="w-4 h-4" />,
      color: 'bg-yellow-100 text-yellow-600',
      description: 'Prezzo medio catalogo'
    }
  ];

  return (
    <StatsCard
      title="Statistiche Prodotti"
      stats={stats}
      className={className}
    />
  );
};

export const QuoteStatsCard: React.FC<{
  totalQuotes: number;
  pendingQuotes: number;
  approvedQuotes: number;
  totalValue: number;
  averageValue: number;
  className?: string;
}> = ({ totalQuotes, pendingQuotes, approvedQuotes, totalValue, averageValue, className }) => {
  const stats: StatData[] = [
    {
      label: 'Preventivi Totali',
      value: totalQuotes,
      icon: <FileText className="w-4 h-4" />,
      color: 'bg-blue-100 text-blue-600',
      description: 'Preventivi creati'
    },
    {
      label: 'In Attesa',
      value: pendingQuotes,
      change: totalQuotes > 0 ? Math.round((pendingQuotes / totalQuotes) * 100) : 0,
      changeType: 'neutral',
      icon: <Calendar className="w-4 h-4" />,
      color: 'bg-orange-100 text-orange-600',
      description: 'Da approvare'
    },
    {
      label: 'Approvati',
      value: approvedQuotes,
      change: totalQuotes > 0 ? Math.round((approvedQuotes / totalQuotes) * 100) : 0,
      changeType: 'increase',
      icon: <Target className="w-4 h-4" />,
      color: 'bg-green-100 text-green-600',
      description: 'Confermati'
    },
    {
      label: 'Valore Totale',
      value: totalValue,
      icon: <DollarSign className="w-4 h-4" />,
      color: 'bg-emerald-100 text-emerald-600',
      description: 'Valore complessivo'
    },
    {
      label: 'Valore Medio',
      value: averageValue,
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'bg-indigo-100 text-indigo-600',
      description: 'Per preventivo'
    }
  ];

  return (
    <StatsCard
      title="Statistiche Preventivi"
      stats={stats}
      className={className}
    />
  );
};

export const SalesStatsCard: React.FC<{
  monthlyRevenue: number;
  monthlyGrowth: number;
  className?: string;
}> = ({ monthlyRevenue, monthlyGrowth, className }) => {
  const stats: StatData[] = [
    {
      label: 'Fatturato Mensile',
      value: monthlyRevenue,
      change: monthlyGrowth,
      changeType: monthlyGrowth > 0 ? 'increase' : monthlyGrowth < 0 ? 'decrease' : 'neutral',
      icon: <DollarSign className="w-4 h-4" />,
      color: 'bg-green-100 text-green-600',
      description: 'Rispetto al mese scorso'
    },
    {
      label: 'Clienti Attivi',
      value: 0, // Da implementare
      icon: <Users className="w-4 h-4" />,
      color: 'bg-purple-100 text-purple-600',
      description: 'Questo mese'
    },
    {
      label: 'Ordini',
      value: 0, // Da implementare
      icon: <ShoppingCart className="w-4 h-4" />,
      color: 'bg-orange-100 text-orange-600',
      description: 'Completati'
    }
  ];

  return (
    <StatsCard
      title="Statistiche Vendite"
      stats={stats}
      className={className}
    />
  );
};