import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderFilters, Marketplace } from '@/types/orders';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { MarketplaceChart } from '@/components/dashboard/MarketplaceChart';
import { OrdersTable } from '@/components/dashboard/OrdersTable';
import { ProductBreakdown } from '@/components/dashboard/ProductBreakdown';
import { MonthComparison } from '@/components/dashboard/MonthComparison';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { CSVUpload } from '@/components/dashboard/CSVUpload';
import { UploadHistory } from '@/components/dashboard/UploadHistory';
import { ExportMenu } from '@/components/dashboard/ExportMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  IndianRupee, 
  TrendingUp,
  LogOut,
  Loader2,
  Settings,
  FileText,
  Shield,
  BarChart3,
} from 'lucide-react';
import kartlyLogo from '@/assets/kartly-logo.png';

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadRefresh, setUploadRefresh] = useState(0);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({
    dateRange: { from: undefined, to: undefined },
    marketplace: 'all',
    search: '',
  });

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('order_date', { ascending: false });

      if (error) throw error;
      
      setOrders((data as unknown as Order[]) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleDataChange = useCallback(() => {
    fetchOrders();
    setUploadRefresh((prev) => prev + 1);
  }, [fetchOrders]);

  useEffect(() => {
    if (user) {
      fetchOrders();
      supabase
        .from('profiles')
        .select('business_name')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.business_name) setBusinessName(data.business_name);
        });
    }
  }, [user]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Marketplace filter
      if (filters.marketplace !== 'all' && order.marketplace !== filters.marketplace) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.from) {
        const orderDate = new Date(order.order_date);
        if (orderDate < filters.dateRange.from) return false;
      }
      if (filters.dateRange.to) {
        const orderDate = new Date(order.order_date);
        if (orderDate > filters.dateRange.to) return false;
      }

      return true;
    });
  }, [orders, filters]);

  const metrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const totalNetProfit = filteredOrders.reduce((sum, o) => sum + Number(o.net_settlement_amount), 0);

    const ordersByMarketplace: Record<Marketplace, number> = {
      amazon: 0,
      flipkart: 0,
      meesho: 0,
    };

    filteredOrders.forEach((order) => {
      ordersByMarketplace[order.marketplace]++;
    });

    return { totalOrders, totalRevenue, totalNetProfit, ordersByMarketplace };
  }, [filteredOrders]);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toFixed(0)}`;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={kartlyLogo} alt="Kartly" className="h-8 sm:h-9 w-auto" />
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            <CSVUpload onUploadComplete={handleDataChange} />
            <ExportMenu orders={filteredOrders} />
            <Button variant="outline" onClick={() => navigate('/reports')} className="hidden md:flex">
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/reports')} className="md:hidden h-8 w-8 sm:h-9 sm:w-9" title="Reports">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <ThemeToggle />
            {isAdmin && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} title="Admin Panel" className="h-8 w-8 sm:h-9 sm:w-9">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} title="Settings" className="h-8 w-8 sm:h-9 sm:w-9">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out" className="h-8 w-8 sm:h-9 sm:w-9">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground">
            {businessName ? businessName : 'Dashboard'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Welcome back! Here's your sales overview.
          </p>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} onFiltersChange={setFilters} />

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard
            title="Total Orders"
            value={metrics.totalOrders.toLocaleString()}
            icon={ShoppingCart}
            variant="default"
          />
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(metrics.totalRevenue)}
            icon={IndianRupee}
            variant="default"
          />
          <MetricCard
            title="Net Settlement"
            value={formatCurrency(metrics.totalNetProfit)}
            icon={TrendingUp}
            variant="default"
          />
          <MetricCard
            title="Avg. Order Value"
            value={metrics.totalOrders > 0 ? formatCurrency(metrics.totalRevenue / metrics.totalOrders) : '₹0'}
            icon={BarChart3}
            variant="default"
          />
        </div>

        {/* Marketplace Breakdown */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <MetricCard
            title="Amazon"
            value={metrics.ordersByMarketplace.amazon.toLocaleString()}
            icon={ShoppingCart}
            variant="amazon"
          />
          <MetricCard
            title="Flipkart"
            value={metrics.ordersByMarketplace.flipkart.toLocaleString()}
            icon={ShoppingCart}
            variant="flipkart"
          />
          <MetricCard
            title="Meesho"
            value={metrics.ordersByMarketplace.meesho.toLocaleString()}
            icon={ShoppingCart}
            variant="meesho"
          />
        </div>

        {/* Month Comparison */}
        <MonthComparison orders={orders} />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SalesChart orders={filteredOrders} />
          <MarketplaceChart orders={filteredOrders} />
        </div>

        {/* Product Breakdown */}
        <ProductBreakdown orders={filteredOrders} />

        {/* Upload History */}
        <UploadHistory refreshTrigger={uploadRefresh} onDeleteComplete={fetchOrders} />

        {/* Orders Table */}
        <OrdersTable orders={filteredOrders} loading={loading} />
      </main>
    </div>
  );
}
