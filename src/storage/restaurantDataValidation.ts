import type { Dish, DishCategory, Invoice } from '../types/restaurant';

const dishCategories: DishCategory[] = [
  'Khai vị',
  'Món chính',
  'Tráng miệng',
  'Đồ uống',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isDishList(value: unknown): value is Dish[] {
  return (
    Array.isArray(value) &&
    value.every(
      dish =>
        isRecord(dish) &&
        typeof dish.id === 'string' &&
        typeof dish.name === 'string' &&
        dishCategories.includes(dish.category as DishCategory) &&
        typeof dish.price === 'number' &&
        Number.isFinite(dish.price) &&
        typeof dish.available === 'boolean',
    )
  );
}

function isInvoiceItem(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.dishId === 'string' &&
    typeof value.quantity === 'number' &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0 &&
    (value.id === undefined || typeof value.id === 'string') &&
    (value.dishName === undefined || typeof value.dishName === 'string') &&
    (value.unitPrice === undefined ||
      (typeof value.unitPrice === 'number' &&
        Number.isFinite(value.unitPrice) &&
        value.unitPrice > 0)) &&
    (value.note === undefined || typeof value.note === 'string') &&
    (value.sentToKitchen === undefined ||
      typeof value.sentToKitchen === 'boolean')
  );
}

export function isInvoiceList(value: unknown): value is Invoice[] {
  return (
    Array.isArray(value) &&
    value.every(
      invoice =>
        isRecord(invoice) &&
        typeof invoice.id === 'string' &&
        typeof invoice.tableNumber === 'number' &&
        Number.isInteger(invoice.tableNumber) &&
        invoice.tableNumber > 0 &&
        (invoice.guestCount === undefined ||
          (typeof invoice.guestCount === 'number' &&
            Number.isInteger(invoice.guestCount) &&
            invoice.guestCount > 0)) &&
        Array.isArray(invoice.items) &&
        invoice.items.every(isInvoiceItem) &&
        (invoice.status === 'Đang phục vụ' ||
          invoice.status === 'Đã thanh toán') &&
        typeof invoice.createdAt === 'string' &&
        (invoice.payment === undefined ||
          (isRecord(invoice.payment) &&
            (invoice.payment.method === 'Tiền mặt' ||
              invoice.payment.method === 'Chuyển khoản VietQR' ||
              invoice.payment.method === 'Thẻ / Ví điện tử') &&
            typeof invoice.payment.subtotal === 'number' &&
            Number.isFinite(invoice.payment.subtotal) &&
            typeof invoice.payment.vat === 'number' &&
            Number.isFinite(invoice.payment.vat) &&
            typeof invoice.payment.total === 'number' &&
            Number.isFinite(invoice.payment.total) &&
            (invoice.payment.amountReceived === undefined ||
              (typeof invoice.payment.amountReceived === 'number' &&
                Number.isFinite(invoice.payment.amountReceived))) &&
            typeof invoice.payment.change === 'number' &&
            Number.isFinite(invoice.payment.change) &&
            typeof invoice.payment.paidAt === 'string')),
    )
  );
}
