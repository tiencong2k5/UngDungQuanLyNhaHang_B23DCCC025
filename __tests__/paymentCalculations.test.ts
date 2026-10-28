import {
  calculateChange,
  calculatePaymentTotals,
  canConfirmPayment,
} from '../src/features/Payments/paymentCalculations';

test('calculates subtotal, rounded 8% VAT, total and change', () => {
  const totals = calculatePaymentTotals(50000);

  expect(totals).toEqual({
    subtotal: 50000,
    vat: 4000,
    total: 54000,
  });
  expect(calculateChange(60000, totals.total)).toBe(6000);
});

test('does not allow payment for an empty invoice or insufficient cash', () => {
  expect(canConfirmPayment(false, 100000, 54000)).toBe(false);
  expect(canConfirmPayment(true, 53999, 54000)).toBe(false);
  expect(canConfirmPayment(true, 54000, 54000)).toBe(true);
});
