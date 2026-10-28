export function calculatePaymentTotals(subtotal: number) {
  const vat = Math.round(subtotal * 0.08);
  return {
    subtotal,
    vat,
    total: subtotal + vat,
  };
}

export function calculateChange(cashReceived: number, total: number) {
  return Math.max(cashReceived - total, 0);
}

export function canConfirmPayment(
  hasItems: boolean,
  cashReceived: number,
  total: number,
) {
  return hasItems && total > 0 && cashReceived >= total;
}
