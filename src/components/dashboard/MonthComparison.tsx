import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Order } from '@/types/orders';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ShoppingCart,
  IndianRupee,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';

interface MonthComparisonProps {
  orders: Order[];
}

interface ComparisonMetric {
  label: string;
  current: number;
  previous: number;
  format: 'number' | 'currency';
  icon: typeof TrendingUp;
}

export function MonthComparison({ orders }: MonthComparisonProps) {
  const comparison = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));

    const currentMonthOrders = orders.filter((order) => {
      const orderDate = new Date(order.order_date);
      return isWithinInterval(orderDate, { start: currentMonthStart, end: currentMonthEnd });
    });

    const previousMonthOrders = orders.filter((order) => {
      const orderDate = new Date(order.order_date);
      return isWithinInterval(orderDate, { start: previousMonthStart, end: previousMonthEnd });
    });

    const currentRevenue = currentMonthOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const previousRevenue = previousMonthOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

    const currentProfit = currentMonthOrders.reduce((sum, o) => sum + Number(o.net_settlement_amount), 0);
    const previousProfit = previousMonthOrders.reduce((sum, o) => sum + Number(o.net_settlement_amount), 0);

    const currentAOV = currentMonthOrders.length > 0 ? currentRevenue / currentMonthOrders.length : 0;
    const previousAOV = previousMonthOrders.length > 0 ? previousRevenue / previousMonthOrders.length : 0;

    const metrics: ComparisonMetric[] = [
      {
        label: 'Orders',
        current: currentMonthOrders.length,
        previous: previousMonthOrders.length,
        format: 'number',
        icon: ShoppingCart,
      },
      {
        label: 'Revenue',
        current: currentRevenue,
        previous: previousRevenue,
        format: 'currency',
        icon: IndianRupee,
      },
      {
        label: 'Net Profit',
        current: currentProfit,
        previous: previousProfit,
        format: 'currency',
        icon: Wallet,
      },
      {
        label: 'Avg. Order Value',
        current: currentAOV,
        previous: previousAOV,
        format: 'currency',
        icon: BarChart3,
      },
    ];

    return metrics;
  }, [orders]);

  const formatValue = (value: number, format: 'number' | 'currency') => {
    if (format === 'number') {
      return value.toLocaleString();
    }
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toFixed(0)}`;
  };

  const getChangePercent = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Minus;
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent" />
          Month-over-Month Comparison
        </CardTitle>
        <p className="text-sm text-muted-foreground">This month vs last month performance</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {comparison.map((metric) => {
            const change = getChangePercent(metric.current, metric.previous);
            const TrendIcon = getTrendIcon(change);
            const Icon = metric.icon;
            const isPositive = change > 0;
            const isNegative = change < 0;

            return (
              <div
                key={metric.label}
                className="p-4 rounded-xl bg-muted/50 border border-border hover:border-accent/30 transition-all duration-300"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                </div>

                <div className="space-y-2">
                  <p className="text-xl font-bold text-foreground">
                    {formatValue(metric.current, metric.format)}
                  </p>

                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                        isPositive && 'bg-success/10 text-success',
                        isNegative && 'bg-destructive/10 text-destructive',
                        !isPositive && !isNegative && 'bg-muted text-muted-foreground'
                      )}
                    >
                      <TrendIcon className="w-3 h-3" />
                      <span>{Math.abs(change).toFixed(1)}%</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Last month: {formatValue(metric.previous, metric.format)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
