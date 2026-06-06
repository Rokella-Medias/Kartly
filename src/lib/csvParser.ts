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
    'order id': 'order_id',
    'purchase-date': 'order_date',
    'order date': 'order_date',
    'date/time': 'order_date',
    'date time': 'order_date',
    'time': 'order_date', // Amazon Sales Dashboard
    'product-name': 'product_name',
    'product name': 'product_name',
    'item-name': 'product_name',
    'description': 'product_name',
    'sku': 'sku',
    'quantity': 'quantity',
    'qty': 'quantity',
    'selected date range (units ordered)': 'quantity', // Amazon Sales Dashboard
    'item-price': 'selling_price',
    'selling price': 'selling_price',
    'price': 'selling_price',
    'product sales': 'selling_price',
    'product sale': 'selling_price',
    'selected date range (ordered product sales)': 'selling_price', // Amazon Sales Dashboard
    'commission': 'marketplace_commission',
    'amazon fee': 'marketplace_commission',
    'fba fees': 'marketplace_commission',
    'selling fees': 'marketplace_commission',
    'shipping': 'shipping_charges',
    'shipping-price': 'shipping_charges',
    'shipping charges': 'shipping_charges',
    'other transaction fees': 'shipping_charges',
    'tax': 'tax',
    'total sales tax liable': 'tax',
    'total': 'total_amount',
    'item-total': 'total_amount',
    'selected date range (ordered product sales) total': 'total_amount', // Amazon Sales Dashboard
    'settlement amount': 'net_settlement_amount',
    'your earnings': 'net_settlement_amount',
    'status': 'order_status',
    'order-status': 'order_status',
    'transaction status': 'order_status',
    // GST invoice keys
    'invoice number': 'order_id',
    'invoice date': 'order_date',
    'invoice value': 'total_amount',
    'taxable value': 'selling_price',
  },
  flipkart: {
    'order id': 'order_id',
    'order_id': 'order_id',
    'orderid': 'order_id',
    'order date': 'order_date',
    'order_date': 'order_date',
    'orderdate': 'order_date',
    'product': 'product_name',
    'product name': 'product_name',
    'product_title': 'product_name',
    'fsn': 'sku',
    'sku': 'sku',
    'seller sku': 'sku',
    'sku name': 'sku',
    'quantity': 'quantity',
    'qty': 'quantity',
    'gross units': 'quantity',
    'selling price': 'selling_price',
    'final invoice amount': 'selling_price',
    'final selling price': 'selling_price',
    'marketplace fee': 'marketplace_commission',
    'commission': 'marketplace_commission',
    'flipkart fee': 'marketplace_commission',
    'total expenses': 'marketplace_commission',
    'shipping fee': 'shipping_charges',
    'logistics': 'shipping_charges',
    'tax': 'tax',
    'gst': 'tax',
    'total': 'total_amount',
    'invoice amount': 'total_amount',
    'settlement': 'net_settlement_amount',
    'settlement value': 'net_settlement_amount',
    'bank settlement': 'net_settlement_amount',
    'status': 'order_status',
    'order status': 'order_status',
    // GST invoice keys
    'invoice number': 'order_id',
    'invoice date': 'order_date',
    'invoice value': 'total_amount',
    'taxable value': 'selling_price',
  },
  meesho: {
    'order id': 'order_id',
    'sub order no': 'order_id',
    'sub order number': 'order_id',
    'sub_order_num': 'order_id',
    'sub order num': 'order_id',
    'order date': 'order_date',
    'ordered on': 'order_date',
    'order_date': 'order_date',
    'product name': 'product_name',
    'product': 'product_name',
    'sku': 'sku',
    'supplier sku': 'sku',
    'supplier_sku': 'sku',
    'quantity': 'quantity',
    'qty': 'quantity',
    'selling price': 'selling_price',
    'product price': 'selling_price',
    'total_taxable_sale_value': 'selling_price',
    'total taxable sale value': 'selling_price',
    'commission': 'marketplace_commission',
    'meesho commission': 'marketplace_commission',
    'shipping': 'shipping_charges',
    'shipping charge': 'shipping_charges',
    'taxable_shipping': 'shipping_charges',
    'taxable shipping': 'shipping_charges',
    'tax': 'tax',
    'gst': 'tax',
    'tax_amount': 'tax',
    'tax amount': 'tax',
    'total': 'total_amount',
    'order value': 'total_amount',
    'total_invoice_value': 'total_amount',
    'total invoice value': 'total_amount',
    'settlement': 'net_settlement_amount',
    'your earning': 'net_settlement_amount',
    'payout': 'net_settlement_amount',
    'status': 'order_status',
    'order status': 'order_status',
    'cancel_return_date': 'order_status',
    'cancel return date': 'order_status',
    // GST invoice keys
    'invoice number': 'order_id',
    'invoice date': 'order_date',
    'invoice value': 'total_amount',
    'taxable value': 'selling_price',
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

function parseStatus(status: string | undefined, fieldName?: string): OrderStatus {
  if (!status) return 'pending';
  
  const normalized = status.toLowerCase().trim();
  
  // If the field name represents a cancel or return date, and it has a date value, it is returned/cancelled
  if (fieldName && (fieldName.includes('cancel_return_date') || fieldName.includes('cancel return date') || fieldName.includes('cancel_return') || fieldName.includes('cancel return')) && status) {
    return 'returned';
  }
  
  if (normalized.includes('deliver')) return 'delivered';
  if (normalized.includes('ship')) return 'shipped';
  if (normalized.includes('cancel')) return 'cancelled';
  if (normalized.includes('return')) return 'returned';
  if (normalized.includes('pend') || normalized.includes('process')) return 'pending';
  
  return 'pending';
}

export function detectMarketplace(lines: string[]): Marketplace | null {
  // Scan first 20 lines to find marketplace-specific keywords or operator GSTINs
  const maxScan = Math.min(20, lines.length);
  for (let i = 0; i < maxScan; i++) {
    const normalized = normalizeColumnName(lines[i]);
    
    // Check for Amazon keywords or Rajasthani/National GSTIN PAN 'AAICA3918J'
    if (
      normalized.includes('amazon') || 
      normalized.includes('fba') || 
      normalized.includes('asin') || 
      normalized.includes('sales dashboard') ||
      normalized.includes('aaica3918j')
    ) {
      return 'amazon';
    }
    
    // Check for Flipkart keywords or GSTIN PAN 'AABCF4837J'
    if (
      normalized.includes('flipkart') || 
      normalized.includes('fsn') || 
      normalized.includes('ekart') ||
      normalized.includes('aabcf4837j')
    ) {
      return 'flipkart';
    }
    
    // Check for Meesho keywords or GSTIN PAN 'AAHCM9332R'
    if (
      normalized.includes('meesho') || 
      normalized.includes('sub order') || 
      normalized.includes('supplier sku') || 
      normalized.includes('sub_order_num') || 
      normalized.includes('sub order num') ||
      normalized.includes('aahcm9332r')
    ) {
      return 'meesho';
    }
  }
  return null;
}

export function findHeaderRowIndex(lines: string[], marketplace: Marketplace): number {
  const mapping = columnMappings[marketplace];
  const mappingKeys = Object.keys(mapping);
  
  const maxScan = Math.min(30, lines.length);
  for (let i = 0; i < maxScan; i++) {
    const cells = parseCSVLine(lines[i]).map(normalizeColumnName);
    
    let matchCount = 0;
    for (const cell of cells) {
      if (!cell) continue;
      const matched = mappingKeys.some(key => cell === key || cell.includes(key));
      if (matched) {
        matchCount++;
      }
    }
    
    if (matchCount >= 3) {
      return i;
    }
  }
  
  return 0;
}

function getProductNameFromHSN(hsn: string): string {
  if (!hsn) return 'Unknown Product';
  const cleanHSN = hsn.replace(/[^0-9]/g, '').trim();
  
  if (cleanHSN.startsWith('9018')) {
    return 'Medical Equipment & Lancets';
  }
  if (cleanHSN.startsWith('9021')) {
    return 'Hearing Aids & Amplifiers';
  }
  if (cleanHSN.startsWith('6115')) {
    return 'Socks & Compression Stockings';
  }
  if (cleanHSN.startsWith('3304')) {
    return 'Cosmetics & Skin Care';
  }
  if (cleanHSN.startsWith('9506')) {
    return 'Sports & Fitness Equipment';
  }
  if (cleanHSN.startsWith('4015')) {
    return 'Rubber Gloves & Medical Accessories';
  }
  if (cleanHSN.startsWith('3926')) {
    return 'Plastic Household Articles';
  }
  if (cleanHSN.startsWith('9613')) {
    return 'Pocket Lighters & Accessories';
  }
  if (cleanHSN === '804103' || cleanHSN.startsWith('0804')) {
    return 'Dates / Dried Fruits';
  }
  
  return `Meesho Product (HSN ${hsn})`;
}

export function parseCSV(csvText: string, marketplace: Marketplace): { orders: ParsedOrder[]; errors: string[] } {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    return { orders: [], errors: ['CSV file is empty or has no data rows'] };
  }

  const headerIndex = findHeaderRowIndex(lines, marketplace);
  if (headerIndex >= lines.length) {
    return { orders: [], errors: ['Failed to find header row in CSV file'] };
  }

  // Parse headers
  const headers = parseCSVLine(lines[headerIndex]);
  const normalizedHeaders = headers.map(normalizeColumnName);
  const mapping = columnMappings[marketplace];

  // Create column index map
  const columnMap: Record<string, number> = {};
  normalizedHeaders.forEach((header, index) => {
    // 1. First look for exact match
    for (const [key, value] of Object.entries(mapping)) {
      if (header === key) {
        columnMap[value] = index;
        return;
      }
    }
    // 2. Fallback to substring match
    for (const [key, value] of Object.entries(mapping)) {
      if (header.includes(key)) {
        columnMap[value] = index;
        return;
      }
    }
  });

  const orders: ParsedOrder[] = [];
  const errors: string[] = [];
  const orderIdCounts: Record<string, number> = {};

  // Parse data rows starting after header row
  for (let i = headerIndex + 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      
      // Skip empty rows
      if (values.every(v => !v.trim())) continue;

      // For Amazon, only import 'Order' and 'Refund' transaction types
      const typeIndex = normalizedHeaders.indexOf('type');
      if (marketplace === 'amazon' && typeIndex !== -1) {
        const rowType = values[typeIndex]?.replace(/"/g, '').trim().toLowerCase();
        if (rowType && rowType !== 'order' && rowType !== 'refund') {
          continue;
        }
      }

      const getValue = (field: string): string => {
        const index = columnMap[field];
        return index !== undefined ? values[index]?.replace(/"/g, '').trim() || '' : '';
      };

      const getHeaderName = (field: string): string => {
        const index = columnMap[field];
        return index !== undefined ? normalizedHeaders[index] : '';
      };

      const order_date_raw = getValue('order_date');
      const order_date = parseDate(order_date_raw);
      
      // If we don't have an order ID, generate a deterministic one for summaries
      let order_id = getValue('order_id');
      if (!order_id && order_date_raw) {
        order_id = `${marketplace.toUpperCase()}-SUMMARY-${order_date}`;
      }

      // Check if we can get HSN code from headers
      const hsnIndex = normalizedHeaders.findIndex(h => h.includes('hsn'));
      const hsnCode = hsnIndex !== -1 ? values[hsnIndex]?.replace(/"/g, '').trim() || '' : '';

      const product_name = getValue('product_name');
      const sku = getValue('sku');

      // Skip rows without essential data
      if (!order_id && !product_name && !sku && !hsnCode) {
        continue;
      }

      const order: ParsedOrder = {
        order_id: order_id || `${marketplace.toUpperCase()}-${Date.now()}-${i}`,
        order_date,
        marketplace,
        product_name: product_name || sku || (hsnCode ? getProductNameFromHSN(hsnCode) : (order_id.includes('SUMMARY') ? 'Daily Sales Summary' : 'Unknown Product')),
        sku: sku || (hsnCode ? `HSN-${hsnCode}` : null),
        quantity: Math.max(1, Math.round(parseNumber(getValue('quantity')))),
        selling_price: parseNumber(getValue('selling_price')),
        marketplace_commission: Math.abs(parseNumber(getValue('marketplace_commission'))),
        shipping_charges: Math.abs(parseNumber(getValue('shipping_charges'))),
        tax: Math.abs(parseNumber(getValue('tax'))),
        total_amount: parseNumber(getValue('total_amount')),
        net_settlement_amount: parseNumber(getValue('net_settlement_amount')),
        order_status: parseStatus(getValue('order_status'), getHeaderName('order_status')),
      };

      // Calculate total if not provided or 0
      if (order.total_amount === 0 && order.selling_price !== 0) {
        order.total_amount = order.selling_price * order.quantity;
      }

      // Calculate net settlement if not provided or 0
      if (order.net_settlement_amount === 0 && order.total_amount !== 0) {
        order.net_settlement_amount = order.total_amount - order.marketplace_commission - order.shipping_charges;
      }

      // Ensure unique order_id by appending suffix for duplicates
      const base_order_id = order.order_id;
      if (base_order_id) {
        orderIdCounts[base_order_id] = (orderIdCounts[base_order_id] || 0) + 1;
        if (orderIdCounts[base_order_id] > 1) {
          order.order_id = `${base_order_id}-${orderIdCounts[base_order_id] - 1}`;
        }
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

export function parseAmazonPDFText(text: string): ParsedOrder[] {
  const isCreditNote = text.toLowerCase().includes('credit note');
  const orders: ParsedOrder[] = [];
  
  // Extract Invoice/Credit Note number
  let invoiceNo = '';
  const invNoMatch = text.match(/(?:Invoice|Credit Note) Number:\s*([\w-]+)/i);
  if (invNoMatch) {
    invoiceNo = invNoMatch[1].trim();
  }
  
  // Extract main Invoice/Credit Note date (as fallback)
  let fallbackDate = '';
  const invDateMatch = text.match(/(?:Invoice|Credit Note) Date:\s*([\d/|-]+)/i);
  if (invDateMatch) {
    fallbackDate = parseDate(invDateMatch[1].trim());
  }

  // 1. Try to find detailed daily transaction rows by searching for date tokens (DD/MM/YYYY)
  const detailsOfFeesIdx = text.toLowerCase().indexOf('details of fees');
  const detailsText = detailsOfFeesIdx !== -1 ? text.substring(detailsOfFeesIdx) : '';

  const dateRegex = /\b(\d{2}\/\d{2}\/\d{4})\b/g;
  const matches: { date: string; index: number }[] = [];
  let match;
  while ((match = dateRegex.exec(detailsText)) !== null) {
    matches.push({
      date: match[1],
      index: match.index
    });
  }

  const detailedRows: { text: string; date: string; hsn: string }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const startIdx = matches[i].index;
    let endIdx = (i + 1 < matches.length) ? matches[i + 1].index : detailsText.length;
    
    // Check if there is "Total" or "Subtotal" or similar keywords signaling the end of the details section
    const subText = detailsText.substring(startIdx, endIdx);
    const totalMatch = subText.match(/\b(total|subtotal|to view your account|regd office|satellite office)\b/i);
    if (totalMatch) {
      endIdx = startIdx + totalMatch.index;
    }
    
    const blockText = detailsText.substring(startIdx, endIdx).trim();
    
    // Check if block contains HSN code (typically 99\d{4})
    const hsnMatch = blockText.match(/\b(99\d{4})\b/);
    if (hsnMatch) {
      detailedRows.push({
        text: blockText,
        date: matches[i].date,
        hsn: hsnMatch[1]
      });
    }
  }

  if (detailedRows.length > 0) {
    const rowInvoiceCounts: Record<string, number> = {};
    detailedRows.forEach((rowInfo, index) => {
      const { text: blockText, date, hsn } = rowInfo;
      const hsnIdx = blockText.indexOf(hsn);
      const afterHsn = blockText.substring(hsnIdx + hsn.length).trim();
      
      // Extract amounts
      const inrRegex = /(-?\s*INR\s*-?|INR\s*-?)\s*([\d,]+\.\d{2})/gi;
      const amounts: number[] = [];
      let inrMatch;
      while ((inrMatch = inrRegex.exec(blockText)) !== null) {
        const valStr = inrMatch[2].replace(/,/g, '');
        let val = parseFloat(valStr);
        if (inrMatch[1].includes('-') || blockText.includes(`-${inrMatch[0]}`) || blockText.includes(`- ${inrMatch[0]}`)) {
          val = -val;
        }
        amounts.push(val);
      }
      
      let taxableAmount = 0;
      let taxAmount = 0;
      if (amounts.length >= 1) {
        taxableAmount = amounts[0];
      }
      if (amounts.length >= 2) {
        taxAmount = amounts.slice(1).reduce((sum, val) => sum + val, 0);
      }
      
      // Extract description
      let description = '';
      const inrIndex = afterHsn.search(/-?\s*INR/i);
      if (inrIndex !== -1) {
        description = afterHsn.substring(0, inrIndex).trim();
      } else {
        description = afterHsn;
      }
      description = description.replace(/\s+/g, ' ').trim();
      description = description.replace(/^\s*-\s*/, '').trim();
      
      // Extract original invoice number if mentioned in the block (different from invoiceNo)
      let rowInvoiceNo = invoiceNo;
      const invMatch = blockText.match(/\b([A-Z]+(?:-[A-Z])?-\d+-\d+)\b/i);
      if (invMatch && invMatch[1].toLowerCase() !== invoiceNo.toLowerCase()) {
        rowInvoiceNo = invMatch[1].trim();
      }

      // Track index for uniqueness per invoice number
      rowInvoiceCounts[rowInvoiceNo] = (rowInvoiceCounts[rowInvoiceNo] || 0) + 1;
      const order_id = rowInvoiceNo !== invoiceNo
        ? `${invoiceNo}-${rowInvoiceNo}-${rowInvoiceCounts[rowInvoiceNo]}`
        : `${invoiceNo}-${index + 1}`;

      const absTaxable = Math.abs(taxableAmount);
      const absTax = Math.abs(taxAmount);
      const totalCost = absTaxable + absTax;
      
      orders.push({
        order_id,
        order_date: parseDate(date),
        marketplace: 'amazon',
        product_name: description || 'EasyShip Weight Handling Fee',
        sku: hsn || null,
        quantity: 1,
        selling_price: 0,
        marketplace_commission: absTaxable,
        shipping_charges: 0,
        tax: absTax,
        total_amount: 0,
        net_settlement_amount: isCreditNote ? totalCost : -totalCost,
        order_status: 'delivered'
      });
    });
    
    return orders;
  }

  // 2. Fallback to parsing summary page items
  const cleanText = text.replace(/\s+/g, ' ');
  const itemRegex = /\b(\d+)\.\s+(?=\b99\d{4}\b|\b[A-Z0-9-]+\b\s+[\d-]+\b\s+\b99\d{4}\b)/g;
  const summaryMatches: { index: number; number: string }[] = [];
  let summaryMatch;
  while ((summaryMatch = itemRegex.exec(cleanText)) !== null) {
    summaryMatches.push({ index: summaryMatch.index, number: summaryMatch[1] });
  }
  
  for (let i = 0; i < summaryMatches.length; i++) {
    const startIdx = summaryMatches[i].index;
    const endIdx = (i + 1 < summaryMatches.length) ? summaryMatches[i + 1].index : cleanText.indexOf('Total:', startIdx);
    const itemText = cleanText.substring(startIdx, endIdx !== -1 ? endIdx : cleanText.length).trim();
    
    const hsnMatch = itemText.match(/\b(99\d{4})\b/);
    if (!hsnMatch) continue;
    const hsn = hsnMatch[1];
    
    const hsnIdx = itemText.indexOf(hsn);
    const afterHsn = itemText.substring(hsnIdx + hsn.length).trim();
    
    let description = '';
    let taxableAmount = 0;
    let taxAmount = 0;
    
    const inrRegex = /(-?\s*INR\s*-?|INR\s*-?)\s*([\d,]+\.\d{2})/gi;
    const amounts: number[] = [];
    let inrMatch;
    while ((inrMatch = inrRegex.exec(itemText)) !== null) {
      const valStr = inrMatch[2].replace(/,/g, '');
      let val = parseFloat(valStr);
      if (inrMatch[1].includes('-') || itemText.includes(`-${inrMatch[0]}`) || itemText.includes(`- ${inrMatch[0]}`)) {
        val = -val;
      }
      amounts.push(val);
    }
    
    if (amounts.length >= 1) {
      taxableAmount = amounts[0];
    }
    if (amounts.length >= 2) {
      taxAmount = amounts.slice(1).reduce((sum, val) => sum + val, 0);
    }
    
    const inrIndex = afterHsn.search(/-?\s*INR/i);
    if (inrIndex !== -1) {
      description = afterHsn.substring(0, inrIndex).trim();
    } else {
      description = afterHsn;
    }
    description = description.replace(/\s+/g, ' ').trim();
    description = description.replace(/^\s*-\s*/, '').trim();
    
    const absTaxable = Math.abs(taxableAmount);
    const absTax = Math.abs(taxAmount);
    const totalCost = absTaxable + absTax;
    
    // Extract original invoice number if mentioned in the block (different from invoiceNo)
    let rowInvoiceNo = invoiceNo;
    const invMatch = itemText.match(/\b([A-Z]+(?:-[A-Z])?-\d+-\d+)\b/i);
    if (invMatch && invMatch[1].toLowerCase() !== invoiceNo.toLowerCase()) {
      rowInvoiceNo = invMatch[1].trim();
    }

    const order_id = rowInvoiceNo !== invoiceNo
      ? `${invoiceNo}-${rowInvoiceNo}`
      : (summaryMatches.length > 1 ? `${invoiceNo}-${i + 1}` : invoiceNo);

    orders.push({
      order_id,
      order_date: fallbackDate || new Date().toISOString().split('T')[0],
      marketplace: 'amazon',
      product_name: description || 'Amazon Marketplace Service Fee',
      sku: hsn || null,
      quantity: 1,
      selling_price: 0,
      marketplace_commission: absTaxable,
      shipping_charges: 0,
      tax: absTax,
      total_amount: 0,
      net_settlement_amount: isCreditNote ? totalCost : -totalCost,
      order_status: 'delivered'
    });
  }
  
  return orders;
}
