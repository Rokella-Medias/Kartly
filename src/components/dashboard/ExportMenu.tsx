import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Order } from '@/types/orders';
import { format } from 'date-fns';

interface ExportMenuProps {
  orders: Order[];
  filters?: {
    marketplace?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export function ExportMenu({ orders, filters }: ExportMenuProps) {
  const [exporting, setExporting] = useState(false);

  const generateCSV = (data: Order[]) => {
    const headers = [
      'Order ID',
      'Order Date',
      'Marketplace',
      'Product Name',
      'SKU',
      'Quantity',
      'Selling Price',
      'Commission',
      'Shipping',
      'Tax',
      'Total Amount',
      'Net Settlement',
      'Status',
    ];

    const rows = data.map((order) => [
      order.order_id,
      format(new Date(order.order_date), 'yyyy-MM-dd'),
      order.marketplace,
      `"${order.product_name.replace(/"/g, '""')}"`,
      order.sku || '',
      order.quantity,
      order.selling_price,
      order.marketplace_commission,
      order.shipping_charges,
      order.tax,
      order.total_amount,
      order.net_settlement_amount,
      order.order_status,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const csv = generateCSV(orders);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const filename = `kartly_orders_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      // Generate a printable HTML report
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const totalProfit = orders.reduce((sum, o) => sum + Number(o.net_settlement_amount), 0);
      
      const reportHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Kartly Sales Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #0D47A1; margin-bottom: 10px; }
            .summary { display: flex; gap: 40px; margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; }
            .metric { text-align: center; }
            .metric-value { font-size: 24px; font-weight: bold; color: #0D47A1; }
            .metric-label { font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background: #0D47A1; color: white; padding: 10px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background: #f9f9f9; }
            .footer { margin-top: 40px; text-align: center; color: #999; font-size: 11px; }
          </style>
        </head>
        <body>
          <h1>Kartly Sales Report</h1>
          <p style="color: #666;">Generated on ${format(new Date(), 'MMMM dd, yyyy')}</p>
          
          <div class="summary">
            <div class="metric">
              <div class="metric-value">${orders.length}</div>
              <div class="metric-label">Total Orders</div>
            </div>
            <div class="metric">
              <div class="metric-value">₹${totalRevenue.toLocaleString('en-IN')}</div>
              <div class="metric-label">Total Revenue</div>
            </div>
            <div class="metric">
              <div class="metric-value">₹${totalProfit.toLocaleString('en-IN')}</div>
              <div class="metric-label">Net Settlement</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Marketplace</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Net</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${orders.slice(0, 100).map((order) => `
                <tr>
                  <td>${order.order_id}</td>
                  <td>${format(new Date(order.order_date), 'MMM dd, yyyy')}</td>
                  <td style="text-transform: capitalize">${order.marketplace}</td>
                  <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${order.product_name}</td>
                  <td>${order.quantity}</td>
                  <td>₹${Number(order.total_amount).toLocaleString('en-IN')}</td>
                  <td>₹${Number(order.net_settlement_amount).toLocaleString('en-IN')}</td>
                  <td style="text-transform: capitalize">${order.order_status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${orders.length > 100 ? '<p style="color: #666; margin-top: 20px;">Showing first 100 orders...</p>' : ''}
          
          <div class="footer">
            <p>Generated by Kartly - Multi-Platform E-Commerce Analytics</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(reportHtml);
        printWindow.document.close();
        printWindow.print();
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={exporting || orders.length === 0} className="h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm">
          {exporting ? (
            <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export to Excel (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Export to PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
