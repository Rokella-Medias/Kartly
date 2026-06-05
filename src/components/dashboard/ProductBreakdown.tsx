import { useMemo, useState } from 'react';
import { Package, TrendingUp, TrendingDown, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Order, Marketplace } from '@/types/orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ProductBreakdownProps {
  orders: Order[];
}

interface ProductMetrics {
  sku: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  orderCount: number;
  marketplaces: Marketplace[];
  avgSellingPrice: number;
}

type SortField = 'productName' | 'totalQuantity' | 'totalRevenue' | 'netProfit' | 'profitMargin' | 'orderCount';
type SortDirection = 'asc' | 'desc';

export function ProductBreakdown({ orders }: ProductBreakdownProps) {
  const [sortField, setSortField] = useState<SortField>('totalRevenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showAll, setShowAll] = useState(false);

  const productMetrics = useMemo(() => {
    const productMap = new Map<string, ProductMetrics>();

    orders.forEach((order) => {
      // Use SKU if available, otherwise use product name as key
      const key = order.sku || order.product_name;
      
      const existing = productMap.get(key);
      const revenue = Number(order.total_amount);
      const costs = Number(order.marketplace_commission) + Number(order.shipping_charges) + Number(order.tax);
      const profit = Number(order.net_settlement_amount);
      const quantity = order.quantity;

      if (existing) {
        existing.totalQuantity += quantity;
        existing.totalRevenue += revenue;
        existing.totalCosts += costs;
        existing.netProfit += profit;
        existing.orderCount += 1;
        if (!existing.marketplaces.includes(order.marketplace)) {
          existing.marketplaces.push(order.marketplace);
        }
        existing.avgSellingPrice = existing.totalRevenue / existing.totalQuantity;
        existing.profitMargin = existing.totalRevenue > 0 
          ? (existing.netProfit / existing.totalRevenue) * 100 
          : 0;
      } else {
        productMap.set(key, {
          sku: order.sku || '-',
          productName: order.product_name,
          totalQuantity: quantity,
          totalRevenue: revenue,
          totalCosts: costs,
          netProfit: profit,
          profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
          orderCount: 1,
          marketplaces: [order.marketplace],
          avgSellingPrice: revenue / quantity,
        });
      }
    });

    return Array.from(productMap.values());
  }, [orders]);

  const sortedProducts = useMemo(() => {
    return [...productMetrics].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'productName':
          comparison = a.productName.localeCompare(b.productName);
          break;
        case 'totalQuantity':
          comparison = a.totalQuantity - b.totalQuantity;
          break;
        case 'totalRevenue':
          comparison = a.totalRevenue - b.totalRevenue;
          break;
        case 'netProfit':
          comparison = a.netProfit - b.netProfit;
          break;
        case 'profitMargin':
          comparison = a.profitMargin - b.profitMargin;
          break;
        case 'orderCount':
          comparison = a.orderCount - b.orderCount;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [productMetrics, sortField, sortDirection]);

  const displayedProducts = showAll ? sortedProducts : sortedProducts.slice(0, 10);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toFixed(0)}`;
  };

  const getMarketplaceBadge = (marketplace: Marketplace) => {
    const styles: Record<Marketplace, string> = {
      amazon: 'bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]/20',
      flipkart: 'bg-[#2874F0]/10 text-[#2874F0] border-[#2874F0]/20',
      meesho: 'bg-[#F43397]/10 text-[#F43397] border-[#F43397]/20',
    };
    return (
      <Badge variant="outline" className={cn('text-xs capitalize', styles[marketplace])}>
        {marketplace}
      </Badge>
    );
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="w-5 h-5" />
            Product-Wise Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No orders available. Upload your marketplace CSV files to see product analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Summary metrics
  const totalProducts = productMetrics.length;
  const avgMargin = productMetrics.reduce((sum, p) => sum + p.profitMargin, 0) / totalProducts;
  const topPerformer = sortedProducts.find(p => p.profitMargin === Math.max(...productMetrics.map(m => m.profitMargin)));
  const lowPerformer = sortedProducts.find(p => p.profitMargin === Math.min(...productMetrics.map(m => m.profitMargin)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="w-5 h-5" />
          Product-Wise Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold">{totalProducts}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Avg. Margin</p>
            <p className="text-2xl font-bold">{avgMargin.toFixed(1)}%</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" /> Best Margin
            </p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400 truncate" title={topPerformer?.productName}>
              {topPerformer?.profitMargin.toFixed(1)}%
            </p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-500" /> Lowest Margin
            </p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400 truncate" title={lowPerformer?.productName}>
              {lowPerformer?.profitMargin.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[200px]">
                    <SortButton field="productName">Product</SortButton>
                  </TableHead>
                  <TableHead className="text-center">SKU</TableHead>
                  <TableHead className="text-center">
                    <SortButton field="orderCount">Orders</SortButton>
                  </TableHead>
                  <TableHead className="text-center">
                    <SortButton field="totalQuantity">Qty Sold</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="totalRevenue">Revenue</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="netProfit">Net Profit</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="profitMargin">Margin</SortButton>
                  </TableHead>
                  <TableHead className="text-center">Platforms</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedProducts.map((product, index) => (
                  <TableRow key={product.sku + index}>
                    <TableCell className="font-medium">
                      <span className="line-clamp-2" title={product.productName}>
                        {product.productName}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {product.sku}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.orderCount}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.totalQuantity}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={product.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {formatCurrency(product.netProfit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        product.profitMargin >= 20 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        product.profitMargin >= 10 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      )}>
                        {product.profitMargin.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {product.marketplaces.map((mp) => (
                          <span key={mp}>{getMarketplaceBadge(mp)}</span>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Show More/Less */}
        {sortedProducts.length > 10 && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => setShowAll(!showAll)}
              className="text-muted-foreground"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Show All {sortedProducts.length} Products
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
