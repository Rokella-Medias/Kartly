import { Marketplace } from './orders';

export interface GSTSummary {
  marketplace: Marketplace;
  totalOrders: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
}

export interface InvoiceTaxDetail {
  orderId: string;
  orderDate: string;
  marketplace: Marketplace;
  productName: string;
  sku: string | null;
  quantity: number;
  sellingPrice: number;
  taxableValue: number;
  taxRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
}

export interface GSTR1Entry {
  invoiceNo: string;
  invoiceDate: string;
  invoiceValue: number;
  placeOfSupply: string;
  reverseCharge: string;
  applicableRate: number;
  invoiceType: string;
  eComOperator: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

export interface GSTR3BSummary {
  description: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

export interface SalesRegisterEntry {
  date: string;
  invoiceNo: string;
  customerName: string;
  marketplace: Marketplace;
  productDetails: string;
  quantity: number;
  grossValue: number;
  discount: number;
  taxableValue: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  netValue: number;
  commission: number;
  shipping: number;
  netRealized: number;
}

export interface HSNSummary {
  hsnCode: string;
  description: string;
  uqc: string;
  totalQuantity: number;
  totalValue: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

export interface ProductWiseSummary {
  productName: string;
  sku: string | null;
  totalQuantity: number;
  totalRevenue: number;
  totalCommission: number;
  totalShipping: number;
  totalTax: number;
  netProfit: number;
  avgSellingPrice: number;
  orderCount: number;
}

export interface MarketplaceCommissionReport {
  marketplace: Marketplace;
  totalOrders: number;
  grossSales: number;
  totalCommission: number;
  commissionRate: number;
  shippingCharges: number;
  netReceived: number;
}
