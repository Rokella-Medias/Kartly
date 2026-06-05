export type Marketplace = 'amazon' | 'flipkart' | 'meesho';
export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface Order {
  id: string;
  user_id: string;
  order_id: string;
  order_date: string;
  marketplace: Marketplace;
  product_name: string;
  sku: string | null;
  quantity: number;
  selling_price: number;
  marketplace_commission: number;
  shipping_charges: number;
  tax: number;
  total_amount: number;
  net_settlement_amount: number;
  order_status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface CSVUpload {
  id: string;
  user_id: string;
  filename: string;
  marketplace: Marketplace;
  rows_imported: number;
  rows_skipped: number;
  status: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  business_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  totalNetProfit: number;
  ordersByMarketplace: Record<Marketplace, number>;
  revenueByMarketplace: Record<Marketplace, number>;
}

export interface DateFilter {
  from: Date | undefined;
  to: Date | undefined;
}

export interface OrderFilters {
  dateRange: DateFilter;
  marketplace: Marketplace | 'all';
  search: string;
}
