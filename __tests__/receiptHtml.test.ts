import { createReceiptHtml } from '../src/features/Payments/receiptHtml';

test('creates a printable invoice with escaped item details and payment totals', () => {
  const html = createReceiptHtml({
    tableNumber: 4,
    guestCount: 2,
    createdAt: '10:00 28/10/2026',
    lines: [
      {
        name: '<Món & nước>',
        quantity: 2,
        unitPrice: 30000,
        note: 'ít cay',
      },
    ],
    payment: {
      method: 'Tiền mặt',
      subtotal: 60000,
      vat: 4800,
      total: 64800,
      amountReceived: 100000,
      change: 35200,
      paidAt: '10:30 28/10/2026',
    },
    isEstimate: false,
  });

  expect(html).toContain('HOÁ ĐƠN THANH TOÁN');
  expect(html).toContain('Bàn 04 · 2 khách');
  expect(html).toContain('&lt;Món &amp; nước&gt;');
  expect(html).toContain('64.800 đ');
  expect(html).toContain('35.200 đ');
});

test('marks a printed estimate as unpaid', () => {
  const html = createReceiptHtml({
    tableNumber: 1,
    createdAt: '10:00 28/10/2026',
    lines: [{ name: 'Phở bò', quantity: 1, unitPrice: 50000 }],
    payment: {
      method: 'Tiền mặt',
      subtotal: 50000,
      vat: 4000,
      total: 54000,
      change: 0,
      paidAt: '',
    },
    isEstimate: true,
  });

  expect(html).toContain('TẠM TÍNH');
  expect(html).toContain('chưa phải hoá đơn thanh toán');
});
