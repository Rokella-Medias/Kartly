import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Order, Marketplace } from '@/types/orders';

interface MarketplaceChartProps {
  orders: Order[];
}

const marketplaceColors: Record<Marketplace, string> = {
  amazon: 'hsl(var(--amazon))',
  flipkart: 'hsl(var(--flipkart))',
  meesho: 'hsl(var(--meesho))',
};

const marketplaceNames: Record<Marketplace, string> = {
  amazon: 'Amazon',
  flipkart: 'Flipkart',
  meesho: 'Meesho',
};

export function MarketplaceChart({ orders }: MarketplaceChartProps) {
  const chartData = useMemo(() => {
    const revenueByMarketplace = orders.reduce((acc, order) => {
      const marketplace = order.marketplace;
      if (!acc[marketplace]) {
        acc[marketplace] = { revenue: 0, orders: 0 };
      }
      acc[marketplace].revenue += Number(order.total_amount);
      acc[marketplace].orders += 1;
      return acc;
    }, {} as Record<Marketplace, { revenue: number; orders: number }>);

    return (['amazon', 'flipkart', 'meesho'] as Marketplace[]).map((marketplace) => ({
      marketplace,
      name: marketplaceNames[marketplace],
      revenue: revenueByMarketplace[marketplace]?.revenue || 0,
      orders: revenueByMarketplace[marketplace]?.orders || 0,
      color: marketplaceColors[marketplace],
    }));
  }, [orders]);

  const formatCurrency = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toFixed(0)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Revenue by Marketplace</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={formatCurrency}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 14, fontWeight: 500 }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => [
                  `₹${value.toLocaleString('en-IN')}`,
                  'Revenue'
                ]}
              />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={40}>
                {chartData.map((entry) => (
                  <Cell key={entry.marketplace} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
          {chartData.map((item) => (
            <div key={item.marketplace} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }} 
              />
              <span className="text-sm text-muted-foreground">{item.name}</span>
              <span className="text-sm font-medium text-foreground">({item.orders})</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
