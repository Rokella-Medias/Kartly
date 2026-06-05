import { format } from 'date-fns';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCurrencyShort = (amount: number) => {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const openPrintWindow = (html: string) => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
};

export const getReportStyles = () => `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  @page {
    size: A4 landscape;
    margin: 15mm 12mm;
  }

  body {
    font-family: 'Segoe UI', -apple-system, Arial, sans-serif;
    margin: 0;
    padding: 30px 40px;
    color: #1a1a2e;
    background: #fff;
    font-size: 13px;
    line-height: 1.5;
  }

  /* Report Header */
  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #0D47A1;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .report-header .brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .report-header .brand-icon {
    width: 42px;
    height: 42px;
    background: linear-gradient(135deg, #0D47A1, #1565C0);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 800;
    font-size: 18px;
  }
  .report-header .brand-text {
    font-size: 22px;
    font-weight: 700;
    color: #0D47A1;
    letter-spacing: -0.5px;
  }
  .report-header .brand-sub {
    font-size: 11px;
    color: #6b7280;
    margin-top: 1px;
  }
  .report-header .meta {
    text-align: right;
    font-size: 11px;
    color: #6b7280;
    line-height: 1.6;
  }
  .report-header .meta strong {
    color: #0D47A1;
    font-size: 12px;
  }

  h1 {
    font-size: 20px;
    font-weight: 700;
    color: #0D47A1;
    margin-bottom: 4px;
    letter-spacing: -0.3px;
  }

  .subtitle {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 20px;
  }

  /* Summary Cards Row */
  .summary-cards {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .summary-card {
    flex: 1;
    min-width: 130px;
    background: #e8f0fe;
    border: 1px solid #bbdefb;
    border-radius: 10px;
    padding: 14px 16px;
  }
  .summary-card .label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #6b7280;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .summary-card .value {
    font-size: 18px;
    font-weight: 700;
    color: #0D47A1;
  }
  .summary-card.highlight {
    background: linear-gradient(135deg, #0D47A1, #1565C0);
    border-color: #0D47A1;
  }
  .summary-card.highlight .label { color: rgba(255,255,255,0.7); }
  .summary-card.highlight .value { color: #fff; }

  /* Section titles */
  .section-title {
    font-size: 14px;
    font-weight: 700;
    color: #0D47A1;
    margin: 24px 0 10px;
    padding-bottom: 6px;
    border-bottom: 2px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-title::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 16px;
    background: #F57C20;
    border-radius: 2px;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-top: 8px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    overflow: hidden;
    font-size: 11px;
  }
  thead tr {
    background: linear-gradient(135deg, #0D47A1, #1565C0);
  }
  th {
    color: #fff;
    padding: 10px 12px;
    text-align: left;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #0a3d8f;
    white-space: nowrap;
  }
  td {
    padding: 8px 12px;
    border-bottom: 1px solid #e5e7eb;
    color: #374151;
    vertical-align: middle;
  }
  tr:nth-child(even) td { background: #f9fafb; }
  tr:hover td { background: #e8f0fe; }
  tr:last-child td { border-bottom: none; }

  .total-row td {
    background: #e8f0fe !important;
    font-weight: 700;
    color: #0D47A1;
    border-top: 2px solid #0D47A1;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .amount { text-align: right; font-family: 'SF Mono', 'Consolas', 'Courier New', monospace; font-size: 11px; }

  /* Marketplace badges */
  .badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge-amazon { background: #ff990020; color: #b45309; border: 1px solid #ff990040; }
  .badge-flipkart { background: #2874f020; color: #1e40af; border: 1px solid #2874f040; }
  .badge-meesho { background: #f4339720; color: #be185d; border: 1px solid #f4339740; }
  .badge-AMAZON { background: #ff990020; color: #b45309; border: 1px solid #ff990040; }
  .badge-FLIPKART { background: #2874f020; color: #1e40af; border: 1px solid #2874f040; }
  .badge-MEESHO { background: #f4339720; color: #be185d; border: 1px solid #f4339740; }

  /* Truncated text */
  .truncate-cell {
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Note text */
  .note {
    margin-top: 16px;
    padding: 10px 14px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    font-size: 11px;
    color: #92400e;
  }

  /* Footer */
  .footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 2px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-size: 10px;
    color: #9ca3af;
  }
  .footer .left { line-height: 1.6; }
  .footer .right { text-align: right; line-height: 1.6; }
  .footer .disclaimer {
    margin-top: 6px;
    font-size: 9px;
    font-style: italic;
    color: #b0b8c4;
  }

  /* Print optimizations */
  @media print {
    body { padding: 0; margin: 0; }
    .summary-card { break-inside: avoid; }
    table { break-inside: auto; }
    tr { break-inside: avoid; }
    .footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 10px 30px; }
    .no-print { display: none; }
  }
`;

export const getReportHeader = (title: string, subtitle: string, period: string) => `
  <div class="report-header">
    <div class="brand">
      <div class="brand-icon">K</div>
      <div>
        <div class="brand-text">Kartly</div>
        <div class="brand-sub">Multi-Platform E-Commerce Analytics</div>
      </div>
    </div>
    <div class="meta">
      <strong>${title}</strong><br/>
      Period: ${period}<br/>
      Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}
    </div>
  </div>
  <h1>${title}</h1>
  <p class="subtitle">${subtitle}</p>
`;

export const getSummaryCards = (items: { label: string; value: string; highlight?: boolean }[]) => `
  <div class="summary-cards">
    ${items.map(item => `
      <div class="summary-card${item.highlight ? ' highlight' : ''}">
        <div class="label">${item.label}</div>
        <div class="value">${item.value}</div>
      </div>
    `).join('')}
  </div>
`;

export const getReportFooter = () => `
  <div class="footer">
    <div class="left">
      <strong>Kartly</strong> — Multi-Platform E-Commerce Analytics<br/>
      <span class="disclaimer">This is a computer-generated report and does not require a signature.</span>
    </div>
    <div class="right">
      Report generated on ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}<br/>
      Page 1
    </div>
  </div>
`;

export const wrapReport = (content: string, title: string) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>${getReportStyles()}</style>
  </head>
  <body>${content}</body>
  </html>
`;
