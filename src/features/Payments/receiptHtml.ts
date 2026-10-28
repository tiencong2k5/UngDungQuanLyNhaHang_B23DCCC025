import type { InvoicePayment } from '../../types/restaurant';

type ReceiptLine = {
  name: string;
  quantity: number;
  unitPrice: number;
  note?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString('vi-VN')} đ`;
}

export function createReceiptHtml({
  tableNumber,
  guestCount,
  createdAt,
  lines,
  payment,
  isEstimate,
}: {
  tableNumber: number;
  guestCount?: number;
  createdAt: string;
  lines: ReceiptLine[];
  payment: InvoicePayment;
  isEstimate: boolean;
}) {
  const itemRows = lines
    .map(
      line => `
        <tr>
          <td>${escapeHtml(line.name)}${
        line.note ? `<small>${escapeHtml(line.note)}</small>` : ''
      }</td>
          <td class="number">${line.quantity}</td>
          <td class="number">${formatCurrency(line.unitPrice)}</td>
          <td class="number">${formatCurrency(
            line.quantity * line.unitPrice,
          )}</td>
        </tr>`,
    )
    .join('');

  return `<!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: Arial, sans-serif; color: #243329; padding: 24px; }
          h1 { margin: 0 0 8px; text-align: center; font-size: 22px; }
          .muted { color: #64756a; text-align: center; font-size: 12px; }
          .meta { margin: 22px 0 12px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { padding: 9px 5px; border-bottom: 1px solid #e5eae5; text-align: left; }
          th { color: #64756a; }
          .number { text-align: right; white-space: nowrap; }
          small { display: block; color: #64756a; margin-top: 3px; }
          .totals { margin: 18px 0 0 auto; width: 65%; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
          .grand { border-top: 1px solid #243329; margin-top: 5px; padding-top: 12px; font-size: 17px; font-weight: bold; }
          .estimate { margin-top: 22px; text-align: center; color: #64756a; font-size: 11px; }
        </style>
      </head>
      <body>
        <h1>${isEstimate ? 'TẠM TÍNH' : 'HOÁ ĐƠN THANH TOÁN'}</h1>
        <div class="muted">Bàn ${String(tableNumber).padStart(2, '0')}${
    guestCount ? ` · ${guestCount} khách` : ''
  }</div>
        <div class="meta">Thời gian vào: ${escapeHtml(createdAt)}<br/>${
    isEstimate
      ? 'Phiếu tạm tính - chưa phải hoá đơn thanh toán'
      : `Phương thức: ${escapeHtml(payment.method)} · ${escapeHtml(
          payment.paidAt,
        )}`
  }</div>
        <table>
          <thead><tr><th>Món</th><th class="number">SL</th><th class="number">Đơn giá</th><th class="number">Thành tiền</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div class="totals">
          <div class="total-row"><span>Tạm tính</span><strong>${formatCurrency(
            payment.subtotal,
          )}</strong></div>
          <div class="total-row"><span>VAT 8%</span><strong>${formatCurrency(
            payment.vat,
          )}</strong></div>
          <div class="total-row grand"><span>Tổng cộng</span><span>${formatCurrency(
            payment.total,
          )}</span></div>
          ${
            payment.method === 'Tiền mặt' &&
            payment.amountReceived !== undefined
              ? `<div class="total-row"><span>Khách đưa</span><strong>${formatCurrency(
                  payment.amountReceived,
                )}</strong></div><div class="total-row"><span>Tiền thối</span><strong>${formatCurrency(
                  payment.change,
                )}</strong></div>`
              : ''
          }
        </div>
        ${isEstimate ? '<div class="estimate">Cảm ơn quý khách!</div>' : ''}
      </body>
    </html>`;
}
