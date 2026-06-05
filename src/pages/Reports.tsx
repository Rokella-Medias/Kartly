import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Order, Marketplace } from '@/types/orders';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Loader2,
  Receipt,
  Calculator,
  Building2,
  IndianRupee,
  FileCheck,
  ClipboardList,
  Package,
  Percent,
  TrendingUp,
  CalendarIcon,
} from 'lucide-react';
import kartlyLogo from '@/assets/kartly-logo.png';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ReportCard } from '@/components/reports/ReportCard';
import { useReportExports } from '@/hooks/useReportExports';
import { formatCurrency, downloadFile, openPrintWindow, getReportHeader, getSummaryCards, getReportFooter, formatCurrencyShort, wrapReport } from '@/lib/reportUtils';

export default function Reports() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'month' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [pendingRange, setPendingRange] = useState<{ from?: Date; to?: Date }>({});
  const [localExporting, setLocalExporting] = useState<string | null>(null);

  // Compute the active date label for display
  const activeDateLabel = useMemo(() => {
    if (filterMode === 'custom' && dateRange.from) {
      const fromStr = format(dateRange.from, 'dd MMM yyyy');
      const toStr = dateRange.to ? format(dateRange.to, 'dd MMM yyyy') : fromStr;
      return `${fromStr} – ${toStr}`;
    }
    return format(new Date(selectedMonth + '-01'), 'MMMM yyyy');
  }, [filterMode, selectedMonth, dateRange]);

  const {
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
  } = useReportExports(orders, selectedMonth, filterMode === 'custom' && dateRange.from ? activeDateLabel : undefined);


  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let startDate: string;
      let endDate: string;

      if (filterMode === 'custom' && dateRange.from) {
        startDate = format(dateRange.from, 'yyyy-MM-dd');
        endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : startDate;
      } else {
        const monthDate = new Date(selectedMonth + '-01');
        startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
        endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');
      }
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .gte('order_date', startDate)
        .lte('order_date', endDate)
        .order('order_date', { ascending: false });

      if (error) throw error;
      setOrders((data as unknown as Order[]) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, selectedMonth, filterMode, dateRange.from, dateRange.to]);

  // Generate month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = subMonths(now, i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy'),
      });
    }
    return options;
  }, []);

  const gstSummary = useMemo(() => calculateGSTSummary(), [orders]);
  const invoiceTaxDetails = useMemo(() => calculateInvoiceTaxDetails(), [orders]);
  const totalTaxCollected = gstSummary.reduce((sum, g) => sum + g.totalTax, 0);
  const combinedExporting = exporting || localExporting;

  // GST Summary exports (kept inline for backward compatibility)
  const exportGSTSummaryCSV = async () => {
    setLocalExporting('gst-csv');
    try {
      const headers = ['Marketplace', 'Total Orders', 'Taxable Value', 'CGST (9%)', 'SGST (9%)', 'IGST (18%)', 'Total Tax', 'Total Amount'];
      const rows = gstSummary.map((row) => [row.marketplace.toUpperCase(), row.totalOrders, row.taxableValue.toFixed(2), row.cgst.toFixed(2), row.sgst.toFixed(2), row.igst.toFixed(2), row.totalTax.toFixed(2), row.totalAmount.toFixed(2)]);
      const totals = gstSummary.reduce((acc, row) => ({ orders: acc.orders + row.totalOrders, taxable: acc.taxable + row.taxableValue, cgst: acc.cgst + row.cgst, sgst: acc.sgst + row.sgst, igst: acc.igst + row.igst, tax: acc.tax + row.totalTax, amount: acc.amount + row.totalAmount }), { orders: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0, amount: 0 });
      rows.push(['TOTAL', totals.orders, totals.taxable.toFixed(2), totals.cgst.toFixed(2), totals.sgst.toFixed(2), totals.igst.toFixed(2), totals.tax.toFixed(2), totals.amount.toFixed(2)]);
      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const fLabel = filterMode === 'custom' && dateRange.from ? activeDateLabel.replace(/[^a-zA-Z0-9]/g, '_') : selectedMonth;
      downloadFile(csv, `GST_Summary_${fLabel}.csv`, 'text/csv');
    } finally {
      setLocalExporting(null);
    }
  };

  const exportGSTSummaryPDF = async () => {
    setLocalExporting('gst-pdf');
    try {
      const totals = gstSummary.reduce((acc, row) => ({ orders: acc.orders + row.totalOrders, taxable: acc.taxable + row.taxableValue, cgst: acc.cgst + row.cgst, sgst: acc.sgst + row.sgst, igst: acc.igst + row.igst, tax: acc.tax + row.totalTax, amount: acc.amount + row.totalAmount }), { orders: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0, amount: 0 });
      const pLabel = activeDateLabel;

      const content = `
        ${getReportHeader('GST Summary Report', 'Tax & Compliance Report — Marketplace-wise', pLabel)}
        ${getSummaryCards([
          { label: 'Total Orders', value: String(totals.orders) },
          { label: 'Taxable Value', value: formatCurrencyShort(totals.taxable) },
          { label: 'Total GST', value: formatCurrencyShort(totals.tax) },
          { label: 'Total Revenue', value: formatCurrencyShort(totals.amount), highlight: true },
        ])}
        <div class="section-title">Marketplace-wise Tax Breakdown</div>
        <table>
          <thead><tr><th>Marketplace</th><th class="amount">Orders</th><th class="amount">Taxable Value</th><th class="amount">CGST (9%)</th><th class="amount">SGST (9%)</th><th class="amount">IGST (18%)</th><th class="amount">Total Tax</th><th class="amount">Total Amount</th></tr></thead>
          <tbody>
            ${gstSummary.map((row) => `<tr>
              <td><span class="badge badge-${row.marketplace}">${row.marketplace.toUpperCase()}</span></td>
              <td class="amount">${row.totalOrders}</td>
              <td class="amount">${formatCurrencyShort(row.taxableValue)}</td>
              <td class="amount">${formatCurrencyShort(row.cgst)}</td>
              <td class="amount">${formatCurrencyShort(row.sgst)}</td>
              <td class="amount">${formatCurrencyShort(row.igst)}</td>
              <td class="amount">${formatCurrencyShort(row.totalTax)}</td>
              <td class="amount">${formatCurrencyShort(row.totalAmount)}</td>
            </tr>`).join('')}
            <tr class="total-row">
              <td>TOTAL</td>
              <td class="amount">${totals.orders}</td>
              <td class="amount">${formatCurrencyShort(totals.taxable)}</td>
              <td class="amount">${formatCurrencyShort(totals.cgst)}</td>
              <td class="amount">${formatCurrencyShort(totals.sgst)}</td>
              <td class="amount">${formatCurrencyShort(totals.igst)}</td>
              <td class="amount">${formatCurrencyShort(totals.tax)}</td>
              <td class="amount">${formatCurrencyShort(totals.amount)}</td>
            </tr>
          </tbody>
        </table>
        ${getReportFooter()}
      `;
      openPrintWindow(wrapReport(content, 'GST Summary Report'));
    } finally {
      setLocalExporting(null);
    }
  };

  const exportInvoiceTaxCSV = async () => {
    setLocalExporting('invoice-csv');
    try {
      const headers = ['Order ID', 'Order Date', 'Marketplace', 'Product Name', 'SKU', 'Qty', 'Selling Price', 'Taxable Value', 'Tax Rate %', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Total Amount'];
      const rows = invoiceTaxDetails.map((row) => [row.orderId, format(new Date(row.orderDate), 'dd/MM/yyyy'), row.marketplace.toUpperCase(), `"${row.productName.replace(/"/g, '""')}"`, row.sku || '', row.quantity, row.sellingPrice.toFixed(2), row.taxableValue.toFixed(2), row.taxRate, row.cgst.toFixed(2), row.sgst.toFixed(2), row.igst.toFixed(2), row.totalTax.toFixed(2), row.totalAmount.toFixed(2)]);
      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const fLabel = filterMode === 'custom' && dateRange.from ? activeDateLabel.replace(/[^a-zA-Z0-9]/g, '_') : selectedMonth;
      downloadFile(csv, `Invoice_Tax_Report_${fLabel}.csv`, 'text/csv');
    } finally {
      setLocalExporting(null);
    }
  };

  const exportInvoiceTaxPDF = async () => {
    setLocalExporting('invoice-pdf');
    try {
      const totals = invoiceTaxDetails.reduce((acc, row) => ({ qty: acc.qty + row.quantity, taxable: acc.taxable + row.taxableValue, cgst: acc.cgst + row.cgst, sgst: acc.sgst + row.sgst, tax: acc.tax + row.totalTax, amount: acc.amount + row.totalAmount }), { qty: 0, taxable: 0, cgst: 0, sgst: 0, tax: 0, amount: 0 });
      const pLabel = activeDateLabel;

      const content = `
        ${getReportHeader('Invoice-Level Tax Report', 'CA Audit Ready — Detailed Tax Breakdown', pLabel)}
        ${getSummaryCards([
          { label: 'Total Invoices', value: String(invoiceTaxDetails.length) },
          { label: 'Total Quantity', value: String(totals.qty) },
          { label: 'Taxable Value', value: formatCurrencyShort(totals.taxable) },
          { label: 'Total GST', value: formatCurrencyShort(totals.tax) },
          { label: 'Total Amount', value: formatCurrencyShort(totals.amount), highlight: true },
        ])}
        <div class="section-title">Invoice-wise Tax Details</div>
        <table>
          <thead><tr>
            <th>#</th><th>Order ID</th><th>Date</th><th>Platform</th><th>Product</th>
            <th class="amount">Qty</th><th class="amount">Taxable</th><th class="amount">Rate</th>
            <th class="amount">CGST</th><th class="amount">SGST</th><th class="amount">Total Tax</th><th class="amount">Amount</th>
          </tr></thead>
          <tbody>
            ${invoiceTaxDetails.slice(0, 100).map((row, i) => `<tr>
              <td>${i + 1}</td>
              <td>${row.orderId}</td>
              <td>${format(new Date(row.orderDate), 'dd/MM/yyyy')}</td>
              <td><span class="badge badge-${row.marketplace}">${row.marketplace.toUpperCase()}</span></td>
              <td class="truncate-cell">${row.productName}</td>
              <td class="amount">${row.quantity}</td>
              <td class="amount">${formatCurrencyShort(row.taxableValue)}</td>
              <td class="amount">${row.taxRate}%</td>
              <td class="amount">${formatCurrencyShort(row.cgst)}</td>
              <td class="amount">${formatCurrencyShort(row.sgst)}</td>
              <td class="amount">${formatCurrencyShort(row.totalTax)}</td>
              <td class="amount">${formatCurrencyShort(row.totalAmount)}</td>
            </tr>`).join('')}
            <tr class="total-row">
              <td colspan="5">TOTAL (${invoiceTaxDetails.length} orders)</td>
              <td class="amount">${totals.qty}</td>
              <td class="amount">${formatCurrencyShort(totals.taxable)}</td>
              <td class="amount">—</td>
              <td class="amount">${formatCurrencyShort(totals.cgst)}</td>
              <td class="amount">${formatCurrencyShort(totals.sgst)}</td>
              <td class="amount">${formatCurrencyShort(totals.tax)}</td>
              <td class="amount">${formatCurrencyShort(totals.amount)}</td>
            </tr>
          </tbody>
        </table>
        ${invoiceTaxDetails.length > 100 ? '<div class="note">⚠ Showing first 100 invoices. Download CSV for complete data.</div>' : ''}
        ${getReportFooter()}
      `;
      openPrintWindow(wrapReport(content, 'Invoice-Level Tax Report'));
    } finally {
      setLocalExporting(null);
    }
  };



  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={kartlyLogo} alt="Kartly" className="h-9 w-auto" />
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {/* Page Title */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground">Tax & Compliance Reports</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              All government-ready reports for GST filing, CA audits & business analysis
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
            {/* Filter mode toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <Button
                variant={filterMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => setFilterMode('month')}
              >
                Monthly
              </Button>
              <Button
                variant={filterMode === 'custom' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => setFilterMode('custom')}
              >
                Custom Range
              </Button>
            </div>

            {filterMode === 'month' ? (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal w-full sm:min-w-[240px]',
                      !dateRange.from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} – {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={pendingRange.from || dateRange.from}
                    selected={{ from: pendingRange.from, to: pendingRange.to }}
                    onSelect={(range) => setPendingRange(range || { from: undefined, to: undefined })}
                    numberOfMonths={1}
                    className="p-3 pointer-events-auto"
                  />
                  <div className="flex items-center justify-end gap-2 p-3 pt-0 border-t border-border mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingRange({})}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      disabled={!pendingRange.from}
                      onClick={() => {
                        setDateRange({ from: pendingRange.from, to: pendingRange.to || pendingRange.from });
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Receipt className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <IndianRupee className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxable Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(gstSummary.reduce((s, g) => s + g.taxableValue, 0))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Calculator className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GST Collected</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalTaxCollected)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Platforms</p>
                  <p className="text-2xl font-bold">{gstSummary.filter(g => g.totalOrders > 0).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Tabs */}
        <Tabs defaultValue="gst" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="gst" className="gap-2">
              <FileCheck className="w-4 h-4" />
              <span className="hidden sm:inline">GST Returns</span>
              <span className="sm:hidden">GST</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Business Reports</span>
              <span className="sm:hidden">Business</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Audit Reports</span>
              <span className="sm:hidden">Audit</span>
            </TabsTrigger>
          </TabsList>

          {/* GST Returns Tab */}
          <TabsContent value="gst" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GST Summary Report */}
              <ReportCard
                title="GST Summary Report"
                description="Platform-wise GST breakup for tax filing"
                icon={<Calculator className="w-6 h-6 text-primary" />}
                iconBgClass="bg-primary/10"
                gradientClass="bg-gradient-to-br from-primary/10 to-transparent"
                badge="Tax Filing"
                features={['Tax collected per marketplace', 'CGST, SGST, IGST breakdown', 'Total taxable value summary', 'Ready for GSTR-3B filing']}
                preview={`${orders.length} orders • ${formatCurrency(totalTaxCollected)} GST`}
                loading={loading}
                disabled={loading || orders.length === 0}
                exporting={combinedExporting}
                exportKey="gst"
                onExportCSV={exportGSTSummaryCSV}
                onExportPDF={exportGSTSummaryPDF}
              />

              {/* GSTR-1 Format Report */}
              <ReportCard
                title="GSTR-1 Format Report"
                description="Outward supplies in GST portal format"
                icon={<FileCheck className="w-6 h-6 text-emerald-600" />}
                iconBgClass="bg-emerald-500/10"
                gradientClass="bg-gradient-to-br from-emerald-500/10 to-transparent"
                badge="GST Portal"
                features={['Invoice-wise outward supplies', 'B2C transaction details', 'E-Commerce operator info', 'Ready for GSTR-1 upload']}
                preview={`${orders.length} invoices ready for filing`}
                loading={loading}
                disabled={loading || orders.length === 0}
                exporting={combinedExporting}
                exportKey="gstr1"
                onExportCSV={exportGSTR1CSV}
                onExportPDF={exportGSTR1PDF}
              />

              {/* GSTR-3B Summary */}
              <ReportCard
                title="GSTR-3B Summary"
                description="Monthly return summary for GST filing"
                icon={<ClipboardList className="w-6 h-6 text-violet-600" />}
                iconBgClass="bg-violet-500/10"
                gradientClass="bg-gradient-to-br from-violet-500/10 to-transparent"
                badge="Monthly Return"
                features={['Outward taxable supplies', 'Tax liability summary', 'Section 3.1 format', 'Direct filing ready']}
                preview={`Tax liability: ${formatCurrency(totalTaxCollected)}`}
                loading={loading}
                disabled={loading || orders.length === 0}
                exporting={combinedExporting}
                exportKey="gstr3b"
                onExportCSV={exportGSTR3BCSV}
                onExportPDF={exportGSTR3BPDF}
              />

              {/* Invoice-Level Tax Report */}
              <ReportCard
                title="Invoice-Level Tax Report"
                description="Detailed order-level tax breakdown"
                icon={<Receipt className="w-6 h-6 text-orange-600" />}
                iconBgClass="bg-orange-500/10"
                gradientClass="bg-gradient-to-br from-orange-500/10 to-transparent"
                badge="CA Audit"
                features={['Order-level tax details', 'Tax rate per invoice', 'Platform source tracking', 'Audit-ready format']}
                preview={`${invoiceTaxDetails.length} invoices • Complete tax trail`}
                loading={loading}
                disabled={loading || orders.length === 0}
                exporting={combinedExporting}
                exportKey="invoice"
                onExportCSV={exportInvoiceTaxCSV}
                onExportPDF={exportInvoiceTaxPDF}
              />
            </div>
          </TabsContent>

          {/* Business Reports Tab */}
          <TabsContent value="business" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Summary Report */}
              <ReportCard
                title="Product-wise Summary"
                description="Performance analysis by product"
                icon={<Package className="w-6 h-6 text-blue-600" />}
                iconBgClass="bg-blue-500/10"
                gradientClass="bg-gradient-to-br from-blue-500/10 to-transparent"
                badge="Performance"
                features={['Revenue by product', 'Quantity & order count', 'Average selling price', 'Net profit per product']}
                preview={`Analyze ${new Set(orders.map(o => o.product_name)).size} products`}
                loading={loading}
                disabled={loading || orders.length === 0}
                exporting={combinedExporting}
                exportKey="product"
                onExportCSV={exportProductSummaryCSV}
                onExportPDF={exportProductSummaryPDF}
              />

              {/* Commission Report */}
              <ReportCard
                title="Marketplace Commission Report"
                description="Platform fee analysis & comparison"
                icon={<Percent className="w-6 h-6 text-pink-600" />}
                iconBgClass="bg-pink-500/10"
                gradientClass="bg-gradient-to-br from-pink-500/10 to-transparent"
                badge="Cost Analysis"
                features={['Commission by platform', 'Commission rate %', 'Shipping charges', 'Net amount received']}
                preview={`Compare fees across ${gstSummary.filter(g => g.totalOrders > 0).length} platforms`}
                loading={loading}
                disabled={loading || orders.length === 0}
                exporting={combinedExporting}
                exportKey="commission"
                onExportCSV={exportCommissionReportCSV}
                onExportPDF={exportCommissionReportPDF}
              />
            </div>
          </TabsContent>

          {/* Audit Reports Tab */}
          <TabsContent value="audit" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Register */}
              <ReportCard
                title="Sales Register"
                description="Comprehensive sales record with all deductions"
                icon={<ClipboardList className="w-6 h-6 text-teal-600" />}
                iconBgClass="bg-teal-500/10"
                gradientClass="bg-gradient-to-br from-teal-500/10 to-transparent"
                badge="Accounting"
                features={['Complete transaction log', 'All charges breakdown', 'Commission & shipping', 'Net realized amount']}
                preview={`${orders.length} transactions recorded`}
                loading={loading}
                disabled={loading || orders.length === 0}
                exporting={combinedExporting}
                exportKey="sales"
                onExportCSV={exportSalesRegisterCSV}
                onExportPDF={exportSalesRegisterPDF}
              />

              {/* Invoice Tax Report (duplicate for audit section) */}
              <ReportCard
                title="Detailed Tax Register"
                description="Complete tax trail for auditors"
                icon={<FileText className="w-6 h-6 text-amber-600" />}
                iconBgClass="bg-amber-500/10"
                gradientClass="bg-gradient-to-br from-amber-500/10 to-transparent"
                badge="Tax Audit"
                features={['Invoice-wise tax details', 'SKU-level tracking', 'Tax rate verification', 'Auditor-friendly format']}
                preview={`${invoiceTaxDetails.length} tax entries`}
                loading={loading}
                disabled={loading || orders.length === 0}
                exporting={combinedExporting}
                exportKey="invoice"
                onExportCSV={exportInvoiceTaxCSV}
                onExportPDF={exportInvoiceTaxPDF}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* GST Breakdown Table */}
        {!loading && orders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">GST Breakdown by Marketplace</CardTitle>
              <CardDescription>
                Summary for {activeDateLabel}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Marketplace</th>
                      <th className="text-right py-3 px-4 font-medium">Orders</th>
                      <th className="text-right py-3 px-4 font-medium">Taxable Value</th>
                      <th className="text-right py-3 px-4 font-medium">CGST</th>
                      <th className="text-right py-3 px-4 font-medium">SGST</th>
                      <th className="text-right py-3 px-4 font-medium">Total Tax</th>
                      <th className="text-right py-3 px-4 font-medium">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gstSummary.map((row) => (
                      <tr key={row.marketplace} className="border-b last:border-0">
                        <td className="py-3 px-4">
                          <Badge 
                            variant="outline" 
                            className={
                              row.marketplace === 'amazon' ? 'border-orange-500 text-orange-600' :
                              row.marketplace === 'flipkart' ? 'border-blue-500 text-blue-600' :
                              'border-pink-500 text-pink-600'
                            }
                          >
                            {row.marketplace.charAt(0).toUpperCase() + row.marketplace.slice(1)}
                          </Badge>
                        </td>
                        <td className="text-right py-3 px-4 font-mono">{row.totalOrders}</td>
                        <td className="text-right py-3 px-4 font-mono">{formatCurrency(row.taxableValue)}</td>
                        <td className="text-right py-3 px-4 font-mono">{formatCurrency(row.cgst)}</td>
                        <td className="text-right py-3 px-4 font-mono">{formatCurrency(row.sgst)}</td>
                        <td className="text-right py-3 px-4 font-mono">{formatCurrency(row.totalTax)}</td>
                        <td className="text-right py-3 px-4 font-mono font-medium">{formatCurrency(row.totalAmount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/50 font-medium">
                      <td className="py-3 px-4">Total</td>
                      <td className="text-right py-3 px-4 font-mono">{orders.length}</td>
                      <td className="text-right py-3 px-4 font-mono">{formatCurrency(gstSummary.reduce((s, g) => s + g.taxableValue, 0))}</td>
                      <td className="text-right py-3 px-4 font-mono">{formatCurrency(gstSummary.reduce((s, g) => s + g.cgst, 0))}</td>
                      <td className="text-right py-3 px-4 font-mono">{formatCurrency(gstSummary.reduce((s, g) => s + g.sgst, 0))}</td>
                      <td className="text-right py-3 px-4 font-mono">{formatCurrency(totalTaxCollected)}</td>
                      <td className="text-right py-3 px-4 font-mono">{formatCurrency(gstSummary.reduce((s, g) => s + g.totalAmount, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <Card className="py-12">
            <CardContent className="text-center">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Orders Found</h3>
              <p className="text-muted-foreground mb-4">
                No orders found for {activeDateLabel}. 
                Try selecting a different period or upload order data.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
