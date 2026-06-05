import { Marketplace, OrderStatus } from '@/types/orders';

interface ParsedOrder {
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
}

// Column mappings for different marketplaces
const columnMappings: Record<Marketplace, Record<string, string>> = {
  amazon: {
    'order-id': 'order_id',
    'amazon-order-id': 'order_id',
    'purchase-date': 'order_date',
    'order date': 'order_date',
    'product-name': 'product_name',
    'product name': 'product_name',
    'item-name': 'product_name',
    'sku': 'sku',
    'quantity': 'quantity',
    'qty': 'quantity',
    'item-price': 'selling_price',
    'selling price': 'selling_price',
    'price': 'selling_price',
    'commission': 'marketplace_commission',
    'amazon fee': 'marketplace_commission',
    'fba fees': 'marketplace_commission',
    'shipping': 'shipping_charges',
    'shipping-price': 'shipping_charges',
    'tax': 'tax',
    'total': 'total_amount',
    'item-total': 'total_amount',
    'settlement amount': 'net_settlement_amount',
    'your earnings': 'net_settlement_amount',
    'status': 'order_status',
    'order-status': 'order_status',
  },
  flipkart: {
    'order id': 'order_id',
    'order_id': 'order_id',
    'orderId': 'order_id',
    'order date': 'order_date',
    'order_date': 'order_date',
    'orderDate': 'order_date',
    'product': 'product_name',
    'product name': 'product_name',
    'product_title': 'product_name',
    'fsn': 'sku',
    'sku': 'sku',
    'seller sku': 'sku',
    'quantity': 'quantity',
    'qty': 'quantity',
    'selling price': 'selling_price',
    'final invoice amount': 'selling_price',
    'marketplace fee': 'marketplace_commission',
    'commission': 'marketplace_commission',
    'flipkart fee': 'marketplace_commission',
    'shipping fee': 'shipping_charges',
    'logistics': 'shipping_charges',
    'tax': 'tax',
    'gst': 'tax',
    'total': 'total_amount',
    'invoice amount': 'total_amount',
    'settlement': 'net_settlement_amount',
    'settlement value': 'net_settlement_amount',
    'status': 'order_status',
    'order status': 'order_status',
  },
  meesho: {
    'order id': 'order_id',
    'sub order no': 'order_id',
    'sub order number': 'order_id',
    'order date': 'order_date',
    'ordered on': 'order_date',
    'product name': 'product_name',
    'product': 'product_name',
    'sku': 'sku',
    'supplier sku': 'sku',
    'quantity': 'quantity',
    'qty': 'quantity',
    'selling price': 'selling_price',
    'product price': 'selling_price',
    'commission': 'marketplace_commission',
    'meesho commission': 'marketplace_commission',
    'shipping': 'shipping_charges',
    'shipping charge': 'shipping_charges',
    'tax': 'tax',
    'gst': 'tax',
    'total': 'total_amount',
    'order value': 'total_amount',
    'settlement': 'net_settlement_amount',
    'your earning': 'net_settlement_amount',
    'payout': 'net_settlement_amount',
    'status': 'order_status',
    'order status': 'order_status',
  },
};

function normalizeColumnName(column: string): string {
  return column.toLowerCase().trim().replace(/[_-]/g, ' ').replace(/\s+/g, ' ');
}

function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // Try various date formats
  const formats = [
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY or MM/DD/YYYY
    /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    /(\d{4})\/(\d{2})\/(\d{2})/, // YYYY/MM/DD
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      const [, a, b, c] = match;
      // If first group is 4 digits, it's year first
      if (a.length === 4) {
        return `${a}-${b}-${c}`;
      }
      // If last group is 4 digits, assume DD/MM/YYYY
      if (c.length === 4) {
        return `${c}-${b}-${a}`;
      }
    }
  }

  // Try to parse with Date object
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

function parseNumber(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  
  // Remove currency symbols and commas
  const cleaned = value.toString().replace(/[₹$,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseStatus(status: string | undefined): OrderStatus {
  if (!status) return 'pending';
  
  const normalized = status.toLowerCase().trim();
  
  if (normalized.includes('deliver')) return 'delivered';
  if (normalized.includes('ship')) return 'shipped';
  if (normalized.includes('cancel')) return 'cancelled';
  if (normalized.includes('return')) return 'returned';
  if (normalized.includes('pend') || normalized.includes('process')) return 'pending';
  
  return 'pending';
}

export function detectMarketplace(headers: string[]): Marketplace | null {
  const normalizedHeaders = headers.map(normalizeColumnName);
  
  // Amazon-specific columns
  if (normalizedHeaders.some(h => h.includes('amazon') || h.includes('fba') || h.includes('asin'))) {
    return 'amazon';
  }
  
  // Flipkart-specific columns
  if (normalizedHeaders.some(h => h.includes('flipkart') || h.includes('fsn') || h.includes('ekart'))) {
    return 'flipkart';
  }
  
  // Meesho-specific columns
  if (normalizedHeaders.some(h => h.includes('meesho') || h.includes('sub order') || h.includes('supplier sku'))) {
    return 'meesho';
  }
  
  return null;
}

export function parseCSV(csvText: string, marketplace: Marketplace): { orders: ParsedOrder[]; errors: string[] } {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    return { orders: [], errors: ['CSV file is empty or has no data rows'] };
  }

  // Parse headers
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const normalizedHeaders = headers.map(normalizeColumnName);
  const mapping = columnMappings[marketplace];

  // Create column index map
  const columnMap: Record<string, number> = {};
  normalizedHeaders.forEach((header, index) => {
    for (const [key, value] of Object.entries(mapping)) {
      if (header.includes(key) || key.includes(header)) {
        columnMap[value] = index;
        break;
      }
    }
  });

  const orders: ParsedOrder[] = [];
  const errors: string[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      
      // Skip empty rows
      if (values.every(v => !v.trim())) continue;

      const getValue = (field: string): string => {
        const index = columnMap[field];
        return index !== undefined ? values[index]?.replace(/"/g, '').trim() || '' : '';
      };

      const order_id = getValue('order_id');
      const product_name = getValue('product_name');

      // Skip rows without essential data
      if (!order_id && !product_name) {
        continue;
      }

      const order: ParsedOrder = {
        order_id: order_id || `${marketplace.toUpperCase()}-${Date.now()}-${i}`,
        order_date: parseDate(getValue('order_date')),
        marketplace,
        product_name: product_name || 'Unknown Product',
        sku: getValue('sku') || null,
        quantity: Math.max(1, Math.round(parseNumber(getValue('quantity')))),
        selling_price: parseNumber(getValue('selling_price')),
        marketplace_commission: parseNumber(getValue('marketplace_commission')),
        shipping_charges: parseNumber(getValue('shipping_charges')),
        tax: parseNumber(getValue('tax')),
        total_amount: parseNumber(getValue('total_amount')),
        net_settlement_amount: parseNumber(getValue('net_settlement_amount')),
        order_status: parseStatus(getValue('order_status')),
      };

      // Calculate total if not provided
      if (order.total_amount === 0 && order.selling_price > 0) {
        order.total_amount = order.selling_price * order.quantity;
      }

      // Calculate net settlement if not provided
      if (order.net_settlement_amount === 0 && order.total_amount > 0) {
        order.net_settlement_amount = order.total_amount - order.marketplace_commission - order.shipping_charges;
      }

      orders.push(order);
    } catch (err) {
      errors.push(`Error parsing row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return { orders, errors };
}

// Handle CSV lines with quoted values containing commas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

export function generateSampleCSV(marketplace: Marketplace): string {
  const headers = {
    amazon: 'order-id,purchase-date,product-name,sku,quantity,item-price,commission,shipping-price,tax,item-total,settlement amount,order-status',
    flipkart: 'Order Id,Order Date,Product Name,SKU,Quantity,Selling Price,Marketplace Fee,Shipping Fee,Tax,Total,Settlement Value,Order Status',
    meesho: 'Sub Order No,Order Date,Product Name,Supplier SKU,Quantity,Selling Price,Meesho Commission,Shipping Charge,GST,Order Value,Your Earning,Order Status',
  };

  const sampleData = {
    amazon: 'AMZ-123456,2024-01-15,Wireless Mouse,SKU001,1,599,89.85,40,47.92,599,421.23,Delivered',
    flipkart: 'FLP-789012,2024-01-15,Bluetooth Speaker,SKU002,2,1499,224.85,60,119.92,2998,2593.23,Shipped',
    meesho: 'MSH-345678,2024-01-15,Cotton T-Shirt,SKU003,3,299,44.85,30,23.92,897,798.23,Pending',
  };

  return `${headers[marketplace]}\n${sampleData[marketplace]}`;
}
