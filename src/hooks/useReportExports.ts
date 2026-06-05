import { useState } from 'react';
import { format } from 'date-fns';
import { Order, Marketplace } from '@/types/orders';
import { 
  GSTSummary, 
  InvoiceTaxDetail, 
  GSTR1Entry, 
  GSTR3BSummary, 
  SalesRegisterEntry,
  ProductWiseSummary,
  MarketplaceCommissionReport 
} from '@/types/reports';
import { downloadFile, openPrintWindow, getReportHeader, getSummaryCards, getReportFooter, formatCurrencyShort, wrapReport } from '@/lib/reportUtils';

export function useReportExports(orders: Order[], selectedMonth: string, periodLabelOverride?: string) {
  const [exporting, setExporting] = useState<string | null>(null);

  const periodLabel = periodLabelOverride || (() => {
    try { return format(new Date(selectedMonth + '-01'), 'MMMM yyyy'); } catch { return selectedMonth; }
  })();

  const fileLabel = periodLabelOverride ? periodLabelOverride.replace(/[^a-zA-Z0-9]/g, '_') : selectedMonth;

  // Calculate GST Summary
  const calculateGSTSummary = (): GSTSummary[] => {
    const marketplaces: Marketplace[] = ['amazon', 'flipkart', 'meesho'];
    return marketplaces.map((marketplace) => {
      const marketplaceOrders = orders.filter((o) => o.marketplace === marketplace);
      const totalOrders = marketplaceOrders.length;
      const totalAmount = marketplaceOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const totalTax = marketplaceOrders.reduce((sum, o) => sum + Number(o.tax || 0), 0);
      const taxableValue = totalAmount - totalTax;
      const cgst = totalTax / 2;
      const sgst = totalTax / 2;
      return { marketplace, totalOrders, taxableValue, cgst, sgst, igst: 0, totalTax, totalAmount };
    });
  };

  // Calculate Invoice Tax Details
  const calculateInvoiceTaxDetails = (): InvoiceTaxDetail[] => {
    return orders.map((order) => {
      const totalTax = Number(order.tax || 0);
      const taxableValue = Number(order.total_amount) - totalTax;
      const taxRate = taxableValue > 0 ? (totalTax / taxableValue) * 100 : 0;
      return {
        orderId: order.order_id,
        orderDate: order.order_date,
        marketplace: order.marketplace,
        productName: order.product_name,
        sku: order.sku,
        quantity: order.quantity,
        sellingPrice: Number(order.selling_price),
        taxableValue,
        taxRate: Math.round(taxRate),
        cgst: totalTax / 2,
        sgst: totalTax / 2,
        igst: 0,
        totalTax,
        totalAmount: Number(order.total_amount),
      };
    });
  };

  // Calculate GSTR-1 Entries
  const calculateGSTR1Entries = (): GSTR1Entry[] => {
    return orders.map((order) => {
      const totalTax = Number(order.tax || 0);
      const taxableValue = Number(order.total_amount) - totalTax;
      const taxRate = taxableValue > 0 ? Math.round((totalTax / taxableValue) * 100) : 18;
      return {
        invoiceNo: order.order_id,
        invoiceDate: order.order_date,
        invoiceValue: Number(order.total_amount),
        placeOfSupply: '29-Karnataka',
        reverseCharge: 'N',
        applicableRate: taxRate,
        invoiceType: 'B2C',
        eComOperator: order.marketplace.toUpperCase(),
        taxableValue,
        igst: 0,
        cgst: totalTax / 2,
        sgst: totalTax / 2,
        cess: 0,
      };
    });
  };

  // Calculate GSTR-3B Summary
  const calculateGSTR3BSummary = (): GSTR3BSummary[] => {
    const totals = orders.reduce((acc, order) => {
      const tax = Number(order.tax || 0);
      const taxableValue = Number(order.total_amount) - tax;
      return {
        taxableValue: acc.taxableValue + taxableValue,
        cgst: acc.cgst + tax / 2,
        sgst: acc.sgst + tax / 2,
      };
    }, { taxableValue: 0, cgst: 0, sgst: 0 });

    return [
      { description: '(a) Outward taxable supplies (other than zero rated, nil rated and exempted)', ...totals, igst: 0, cess: 0 },
      { description: '(b) Outward taxable supplies (zero rated)', taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
      { description: '(c) Other outward supplies (nil rated, exempted)', taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
      { description: '(d) Inward supplies (liable to reverse charge)', taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
      { description: '(e) Non-GST outward supplies', taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
    ];
  };

  // Calculate Sales Register
  const calculateSalesRegister = (): SalesRegisterEntry[] => {
    return orders.map((order) => {
      const totalTax = Number(order.tax || 0);
      const grossValue = Number(order.selling_price) * order.quantity;
      const taxableValue = Number(order.total_amount) - totalTax;
      const gstRate = taxableValue > 0 ? Math.round((totalTax / taxableValue) * 100) : 18;
      const commission = Number(order.marketplace_commission || 0);
      const shipping = Number(order.shipping_charges || 0);
      return {
        date: order.order_date,
        invoiceNo: order.order_id,
        customerName: 'E-Commerce Customer',
        marketplace: order.marketplace,
        productDetails: order.product_name,
        quantity: order.quantity,
        grossValue,
        discount: grossValue - taxableValue - totalTax,
        taxableValue,
        gstRate,
        cgst: totalTax / 2,
        sgst: totalTax / 2,
        igst: 0,
        totalTax,
        netValue: Number(order.total_amount),
        commission,
        shipping,
        netRealized: Number(order.net_settlement_amount || 0),
      };
    });
  };

  // Calculate Product-wise Summary
  const calculateProductSummary = (): ProductWiseSummary[] => {
    const productMap = new Map<string, ProductWiseSummary>();
    orders.forEach((order) => {
      const key = order.product_name;
      const existing = productMap.get(key) || {
        productName: order.product_name,
        sku: order.sku,
        totalQuantity: 0,
        totalRevenue: 0,
        totalCommission: 0,
        totalShipping: 0,
        totalTax: 0,
        netProfit: 0,
        avgSellingPrice: 0,
        orderCount: 0,
      };
      existing.totalQuantity += order.quantity;
      existing.totalRevenue += Number(order.total_amount);
      existing.totalCommission += Number(order.marketplace_commission || 0);
      existing.totalShipping += Number(order.shipping_charges || 0);
      existing.totalTax += Number(order.tax || 0);
      existing.netProfit += Number(order.net_settlement_amount || 0);
      existing.orderCount += 1;
      existing.avgSellingPrice = existing.totalRevenue / existing.totalQuantity;
      productMap.set(key, existing);
    });
    return Array.from(productMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  };

  // Calculate Marketplace Commission Report
  const calculateMarketplaceCommission = (): MarketplaceCommissionReport[] => {
    const marketplaces: Marketplace[] = ['amazon', 'flipkart', 'meesho'];
    return marketplaces.map((marketplace) => {
      const marketplaceOrders = orders.filter((o) => o.marketplace === marketplace);
      const totalOrders = marketplaceOrders.length;
      const grossSales = marketplaceOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const totalCommission = marketplaceOrders.reduce((sum, o) => sum + Number(o.marketplace_commission || 0), 0);
      const shippingCharges = marketplaceOrders.reduce((sum, o) => sum + Number(o.shipping_charges || 0), 0);
      const netReceived = marketplaceOrders.reduce((sum, o) => sum + Number(o.net_settlement_amount || 0), 0);
      const commissionRate = grossSales > 0 ? (totalCommission / grossSales) * 100 : 0;
      return { marketplace, totalOrders, grossSales, totalCommission, commissionRate, shippingCharges, netReceived };
    });
  };

  // ==================== CSV EXPORTS ====================

  const exportGSTR1CSV = async () => {
    setExporting('gstr1-csv');
    try {
      const entries = calculateGSTR1Entries();
      const headers = ['GSTIN/UIN', 'Invoice Number', 'Invoice Date', 'Invoice Value', 'Place Of Supply', 'Reverse Charge', 'Applicable Rate', 'Invoice Type', 'E-Commerce GSTIN', 'Rate', 'Taxable Value', 'IGST', 'CGST', 'SGST/UTGST', 'Cess'];
      const rows = entries.map((e) => ['', e.invoiceNo, format(new Date(e.invoiceDate), 'dd-MMM-yyyy'), e.invoiceValue.toFixed(2), e.placeOfSupply, e.reverseCharge, `${e.applicableRate}%`, e.invoiceType, e.eComOperator, `${e.applicableRate}%`, e.taxableValue.toFixed(2), e.igst.toFixed(2), e.cgst.toFixed(2), e.sgst.toFixed(2), e.cess.toFixed(2)]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      downloadFile(csv, `GSTR1_${fileLabel}.csv`, 'text/csv');
    } finally {
      setExporting(null);
    }
  };

  const exportGSTR3BCSV = async () => {
    setExporting('gstr3b-csv');
    try {
      const summary = calculateGSTR3BSummary();
      const headers = ['Description', 'Taxable Value', 'IGST', 'CGST', 'SGST/UTGST', 'Cess'];
      const rows = summary.map((s) => [`"${s.description}"`, s.taxableValue.toFixed(2), s.igst.toFixed(2), s.cgst.toFixed(2), s.sgst.toFixed(2), s.cess.toFixed(2)]);
      const totals = summary.reduce((acc, s) => ({ taxable: acc.taxable + s.taxableValue, igst: acc.igst + s.igst, cgst: acc.cgst + s.cgst, sgst: acc.sgst + s.sgst, cess: acc.cess + s.cess }), { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 });
      rows.push(['TOTAL', totals.taxable.toFixed(2), totals.igst.toFixed(2), totals.cgst.toFixed(2), totals.sgst.toFixed(2), totals.cess.toFixed(2)]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      downloadFile(csv, `GSTR3B_${fileLabel}.csv`, 'text/csv');
    } finally {
      setExporting(null);
    }
  };

  const exportSalesRegisterCSV = async () => {
    setExporting('sales-csv');
    try {
      const entries = calculateSalesRegister();
      const headers = ['Date', 'Invoice No', 'Marketplace', 'Product', 'Qty', 'Gross Value', 'Discount', 'Taxable Value', 'GST Rate', 'CGST', 'SGST', 'Total Tax', 'Net Value', 'Commission', 'Shipping', 'Net Realized'];
      const rows = entries.map((e) => [format(new Date(e.date), 'dd/MM/yyyy'), e.invoiceNo, e.marketplace.toUpperCase(), `"${e.productDetails.replace(/"/g, '""')}"`, e.quantity, e.grossValue.toFixed(2), e.discount.toFixed(2), e.taxableValue.toFixed(2), `${e.gstRate}%`, e.cgst.toFixed(2), e.sgst.toFixed(2), e.totalTax.toFixed(2), e.netValue.toFixed(2), e.commission.toFixed(2), e.shipping.toFixed(2), e.netRealized.toFixed(2)]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      downloadFile(csv, `Sales_Register_${fileLabel}.csv`, 'text/csv');
    } finally {
      setExporting(null);
    }
  };

  const exportProductSummaryCSV = async () => {
    setExporting('product-csv');
    try {
      const entries = calculateProductSummary();
      const headers = ['Product Name', 'SKU', 'Total Qty', 'Order Count', 'Total Revenue', 'Avg Price', 'Commission', 'Shipping', 'Tax', 'Net Profit'];
      const rows = entries.map((e) => [`"${e.productName.replace(/"/g, '""')}"`, e.sku || '', e.totalQuantity, e.orderCount, e.totalRevenue.toFixed(2), e.avgSellingPrice.toFixed(2), e.totalCommission.toFixed(2), e.totalShipping.toFixed(2), e.totalTax.toFixed(2), e.netProfit.toFixed(2)]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      downloadFile(csv, `Product_Summary_${fileLabel}.csv`, 'text/csv');
    } finally {
      setExporting(null);
    }
  };

  const exportCommissionReportCSV = async () => {
    setExporting('commission-csv');
    try {
      const entries = calculateMarketplaceCommission();
      const headers = ['Marketplace', 'Total Orders', 'Gross Sales', 'Commission', 'Commission %', 'Shipping Charges', 'Net Received'];
      const rows = entries.map((e) => [e.marketplace.toUpperCase(), e.totalOrders, e.grossSales.toFixed(2), e.totalCommission.toFixed(2), `${e.commissionRate.toFixed(2)}%`, e.shippingCharges.toFixed(2), e.netReceived.toFixed(2)]);
      const totals = entries.reduce((acc, e) => ({ orders: acc.orders + e.totalOrders, gross: acc.gross + e.grossSales, commission: acc.commission + e.totalCommission, shipping: acc.shipping + e.shippingCharges, net: acc.net + e.netReceived }), { orders: 0, gross: 0, commission: 0, shipping: 0, net: 0 });
      rows.push(['TOTAL', totals.orders, totals.gross.toFixed(2), totals.commission.toFixed(2), `${totals.gross > 0 ? (totals.commission / totals.gross * 100).toFixed(2) : '0.00'}%`, totals.shipping.toFixed(2), totals.net.toFixed(2)]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      downloadFile(csv, `Commission_Report_${fileLabel}.csv`, 'text/csv');
    } finally {
      setExporting(null);
    }
  };

  // ==================== PDF EXPORTS ====================

  const exportGSTR1PDF = async () => {
    setExporting('gstr1-pdf');
    try {
      const entries = calculateGSTR1Entries();
      const totals = entries.reduce((acc, e) => ({
        value: acc.value + e.invoiceValue,
        taxable: acc.taxable + e.taxableValue,
        cgst: acc.cgst + e.cgst,
        sgst: acc.sgst + e.sgst,
      }), { value: 0, taxable: 0, cgst: 0, sgst: 0 });

      const content = `
        ${getReportHeader('GSTR-1 Format Report', 'Outward Supplies — Statement of Invoices', periodLabel)}
        ${getSummaryCards([
          { label: 'Total Invoices', value: String(entries.length) },
          { label: 'Invoice Value', value: formatCurrencyShort(totals.value) },
          { label: 'Taxable Value', value: formatCurrencyShort(totals.taxable) },
          { label: 'Total GST', value: formatCurrencyShort(totals.cgst + totals.sgst), highlight: true },
        ])}
        <div class="section-title">B2C Invoice Details</div>
        <table>
          <thead><tr>
            <th>#</th><th>Invoice No</th><th>Date</th><th>Platform</th><th>Type</th>
            <th class="amount">Invoice Value</th><th class="amount">Taxable Value</th>
            <th class="amount">Rate</th><th class="amount">CGST</th><th class="amount">SGST</th>
          </tr></thead>
          <tbody>
            ${entries.slice(0, 100).map((e, i) => `<tr>
              <td>${i + 1}</td>
              <td>${e.invoiceNo}</td>
              <td>${format(new Date(e.invoiceDate), 'dd/MM/yyyy')}</td>
              <td><span class="badge badge-${e.eComOperator}">${e.eComOperator}</span></td>
              <td>${e.invoiceType}</td>
              <td class="amount">${formatCurrencyShort(e.invoiceValue)}</td>
              <td class="amount">${formatCurrencyShort(e.taxableValue)}</td>
              <td class="amount">${e.applicableRate}%</td>
              <td class="amount">${formatCurrencyShort(e.cgst)}</td>
              <td class="amount">${formatCurrencyShort(e.sgst)}</td>
            </tr>`).join('')}
            <tr class="total-row">
              <td colspan="5">TOTAL (${entries.length} invoices)</td>
              <td class="amount">${formatCurrencyShort(totals.value)}</td>
              <td class="amount">${formatCurrencyShort(totals.taxable)}</td>
              <td class="amount">—</td>
              <td class="amount">${formatCurrencyShort(totals.cgst)}</td>
              <td class="amount">${formatCurrencyShort(totals.sgst)}</td>
            </tr>
          </tbody>
        </table>
        ${entries.length > 100 ? '<div class="note">⚠ Showing first 100 invoices. Download CSV for complete data.</div>' : ''}
        ${getReportFooter()}
      `;
      openPrintWindow(wrapReport(content, 'GSTR-1 Report'));
    } finally {
      setExporting(null);
    }
  };

  const exportGSTR3BPDF = async () => {
    setExporting('gstr3b-pdf');
    try {
      const summary = calculateGSTR3BSummary();
      const totals = summary.reduce((acc, s) => ({ taxable: acc.taxable + s.taxableValue, cgst: acc.cgst + s.cgst, sgst: acc.sgst + s.sgst }), { taxable: 0, cgst: 0, sgst: 0 });

      const content = `
        ${getReportHeader('GSTR-3B Summary Report', 'Monthly Return Summary — Tax Liability', periodLabel)}
        ${getSummaryCards([
          { label: 'Total Taxable Value', value: formatCurrencyShort(totals.taxable) },
          { label: 'CGST Payable', value: formatCurrencyShort(totals.cgst) },
          { label: 'SGST Payable', value: formatCurrencyShort(totals.sgst) },
          { label: 'Total Tax Payable', value: formatCurrencyShort(totals.cgst + totals.sgst), highlight: true },
        ])}
        <div class="section-title">3.1 — Tax on Outward and Reverse Charge Inward Supplies</div>
        <table>
          <thead><tr>
            <th style="width:45%">Nature of Supplies</th>
            <th class="amount">Taxable Value</th><th class="amount">IGST</th>
            <th class="amount">CGST</th><th class="amount">SGST/UTGST</th><th class="amount">Cess</th>
          </tr></thead>
          <tbody>
            ${summary.map((s) => `<tr>
              <td>${s.description}</td>
              <td class="amount">${formatCurrencyShort(s.taxableValue)}</td>
              <td class="amount">${formatCurrencyShort(s.igst)}</td>
              <td class="amount">${formatCurrencyShort(s.cgst)}</td>
              <td class="amount">${formatCurrencyShort(s.sgst)}</td>
              <td class="amount">${formatCurrencyShort(s.cess)}</td>
            </tr>`).join('')}
            <tr class="total-row">
              <td>TOTAL</td>
              <td class="amount">${formatCurrencyShort(totals.taxable)}</td>
              <td class="amount">${formatCurrencyShort(0)}</td>
              <td class="amount">${formatCurrencyShort(totals.cgst)}</td>
              <td class="amount">${formatCurrencyShort(totals.sgst)}</td>
              <td class="amount">${formatCurrencyShort(0)}</td>
            </tr>
          </tbody>
        </table>
        ${getReportFooter()}
      `;
      openPrintWindow(wrapReport(content, 'GSTR-3B Summary'));
    } finally {
      setExporting(null);
    }
  };

  const exportSalesRegisterPDF = async () => {
    setExporting('sales-pdf');
    try {
      const entries = calculateSalesRegister();
      const totals = entries.reduce((acc, e) => ({
        qty: acc.qty + e.quantity, gross: acc.gross + e.grossValue, taxable: acc.taxable + e.taxableValue, tax: acc.tax + e.totalTax, net: acc.net + e.netValue, commission: acc.commission + e.commission, realized: acc.realized + e.netRealized
      }), { qty: 0, gross: 0, taxable: 0, tax: 0, net: 0, commission: 0, realized: 0 });

      const content = `
        ${getReportHeader('Sales Register', 'Comprehensive Sales Record — All Platforms', periodLabel)}
        ${getSummaryCards([
          { label: 'Total Orders', value: String(entries.length) },
          { label: 'Gross Sales', value: formatCurrencyShort(totals.gross) },
          { label: 'Total Tax', value: formatCurrencyShort(totals.tax) },
          { label: 'Commission', value: formatCurrencyShort(totals.commission) },
          { label: 'Net Realized', value: formatCurrencyShort(totals.realized), highlight: true },
        ])}
        <div class="section-title">Order-wise Breakdown</div>
        <table>
          <thead><tr>
            <th>#</th><th>Date</th><th>Invoice</th><th>Platform</th><th>Product</th>
            <th class="amount">Qty</th><th class="amount">Taxable</th><th class="amount">Tax</th>
            <th class="amount">Net Value</th><th class="amount">Comm.</th><th class="amount">Realized</th>
          </tr></thead>
          <tbody>
            ${entries.slice(0, 100).map((e, i) => `<tr>
              <td>${i + 1}</td>
              <td>${format(new Date(e.date), 'dd/MM/yy')}</td>
              <td>${e.invoiceNo}</td>
              <td><span class="badge badge-${e.marketplace}">${e.marketplace.toUpperCase()}</span></td>
              <td class="truncate-cell">${e.productDetails}</td>
              <td class="amount">${e.quantity}</td>
              <td class="amount">${formatCurrencyShort(e.taxableValue)}</td>
              <td class="amount">${formatCurrencyShort(e.totalTax)}</td>
              <td class="amount">${formatCurrencyShort(e.netValue)}</td>
              <td class="amount">${formatCurrencyShort(e.commission)}</td>
              <td class="amount">${formatCurrencyShort(e.netRealized)}</td>
            </tr>`).join('')}
            <tr class="total-row">
              <td colspan="5">TOTAL (${entries.length} orders)</td>
              <td class="amount">${totals.qty}</td>
              <td class="amount">${formatCurrencyShort(totals.taxable)}</td>
              <td class="amount">${formatCurrencyShort(totals.tax)}</td>
              <td class="amount">${formatCurrencyShort(totals.net)}</td>
              <td class="amount">${formatCurrencyShort(totals.commission)}</td>
              <td class="amount">${formatCurrencyShort(totals.realized)}</td>
            </tr>
          </tbody>
        </table>
        ${entries.length > 100 ? '<div class="note">⚠ Showing first 100 entries. Download CSV for complete data.</div>' : ''}
        ${getReportFooter()}
      `;
      openPrintWindow(wrapReport(content, 'Sales Register'));
    } finally {
      setExporting(null);
    }
  };

  const exportProductSummaryPDF = async () => {
    setExporting('product-pdf');
    try {
      const entries = calculateProductSummary();
      const totals = entries.reduce((acc, e) => ({ qty: acc.qty + e.totalQuantity, revenue: acc.revenue + e.totalRevenue, profit: acc.profit + e.netProfit }), { qty: 0, revenue: 0, profit: 0 });

      const content = `
        ${getReportHeader('Product-wise Summary Report', 'Product Performance & Profitability Analysis', periodLabel)}
        ${getSummaryCards([
          { label: 'Unique Products', value: String(entries.length) },
          { label: 'Total Units Sold', value: String(totals.qty) },
          { label: 'Total Revenue', value: formatCurrencyShort(totals.revenue) },
          { label: 'Net Profit', value: formatCurrencyShort(totals.profit), highlight: true },
        ])}
        <div class="section-title">Product Performance (Ranked by Revenue)</div>
        <table>
          <thead><tr>
            <th>#</th><th>Product</th><th>SKU</th>
            <th class="amount">Qty</th><th class="amount">Orders</th>
            <th class="amount">Revenue</th><th class="amount">Avg Price</th>
            <th class="amount">Net Profit</th>
          </tr></thead>
          <tbody>
            ${entries.slice(0, 50).map((e, i) => `<tr>
              <td>${i + 1}</td>
              <td class="truncate-cell">${e.productName}</td>
              <td>${e.sku || '—'}</td>
              <td class="amount">${e.totalQuantity}</td>
              <td class="amount">${e.orderCount}</td>
              <td class="amount">${formatCurrencyShort(e.totalRevenue)}</td>
              <td class="amount">${formatCurrencyShort(e.avgSellingPrice)}</td>
              <td class="amount">${formatCurrencyShort(e.netProfit)}</td>
            </tr>`).join('')}
            <tr class="total-row">
              <td colspan="3">TOTAL (${entries.length} products)</td>
              <td class="amount">${totals.qty}</td>
              <td class="amount">${orders.length}</td>
              <td class="amount">${formatCurrencyShort(totals.revenue)}</td>
              <td class="amount">—</td>
              <td class="amount">${formatCurrencyShort(totals.profit)}</td>
            </tr>
          </tbody>
        </table>
        ${entries.length > 50 ? '<div class="note">⚠ Showing top 50 products. Download CSV for complete data.</div>' : ''}
        ${getReportFooter()}
      `;
      openPrintWindow(wrapReport(content, 'Product Summary'));
    } finally {
      setExporting(null);
    }
  };

  const exportCommissionReportPDF = async () => {
    setExporting('commission-pdf');
    try {
      const entries = calculateMarketplaceCommission();
      const totals = entries.reduce((acc, e) => ({ orders: acc.orders + e.totalOrders, gross: acc.gross + e.grossSales, commission: acc.commission + e.totalCommission, net: acc.net + e.netReceived }), { orders: 0, gross: 0, commission: 0, net: 0 });

      const content = `
        ${getReportHeader('Marketplace Commission Report', 'Platform Fee Analysis & Net Settlement', periodLabel)}
        ${getSummaryCards([
          { label: 'Total Orders', value: String(totals.orders) },
          { label: 'Gross Sales', value: formatCurrencyShort(totals.gross) },
          { label: 'Total Commission', value: formatCurrencyShort(totals.commission) },
          { label: 'Avg Commission %', value: `${totals.gross > 0 ? (totals.commission / totals.gross * 100).toFixed(2) : '0.00'}%` },
          { label: 'Net Received', value: formatCurrencyShort(totals.net), highlight: true },
        ])}
        <div class="section-title">Platform-wise Breakdown</div>
        <table>
          <thead><tr>
            <th>Marketplace</th><th class="amount">Orders</th><th class="amount">Gross Sales</th>
            <th class="amount">Commission</th><th class="amount">Rate</th>
            <th class="amount">Shipping</th><th class="amount">Net Received</th>
          </tr></thead>
          <tbody>
            ${entries.map((e) => `<tr>
              <td><span class="badge badge-${e.marketplace}">${e.marketplace.toUpperCase()}</span></td>
              <td class="amount">${e.totalOrders}</td>
              <td class="amount">${formatCurrencyShort(e.grossSales)}</td>
              <td class="amount">${formatCurrencyShort(e.totalCommission)}</td>
              <td class="amount">${e.commissionRate.toFixed(2)}%</td>
              <td class="amount">${formatCurrencyShort(e.shippingCharges)}</td>
              <td class="amount">${formatCurrencyShort(e.netReceived)}</td>
            </tr>`).join('')}
            <tr class="total-row">
              <td>TOTAL</td>
              <td class="amount">${totals.orders}</td>
              <td class="amount">${formatCurrencyShort(totals.gross)}</td>
              <td class="amount">${formatCurrencyShort(totals.commission)}</td>
              <td class="amount">${totals.gross > 0 ? (totals.commission / totals.gross * 100).toFixed(2) : '0.00'}%</td>
              <td class="amount">—</td>
              <td class="amount">${formatCurrencyShort(totals.net)}</td>
            </tr>
          </tbody>
        </table>
        ${getReportFooter()}
      `;
      openPrintWindow(wrapReport(content, 'Commission Report'));
    } finally {
      setExporting(null);
    }
  };

  return {
    exporting,
    calculateGSTSummary,
    calculateInvoiceTaxDetails,
    exportGSTR1CSV,
    exportGSTR1PDF,
    exportGSTR3BCSV,
    exportGSTR3BPDF,
    exportSalesRegisterCSV,
    exportSalesRegisterPDF,
    exportProductSummaryCSV,
    exportProductSummaryPDF,
    exportCommissionReportCSV,
    exportCommissionReportPDF,
  };
}
