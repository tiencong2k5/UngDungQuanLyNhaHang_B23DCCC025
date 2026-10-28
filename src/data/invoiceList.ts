import type { Invoice } from '../types/restaurant';

export const invoiceList: Invoice[] = [
  {
    id: 'invoice_001',
    tableNumber: 3,
    guestCount: 3,
    items: [
      {
        id: 'invoice_001_item_001',
        dishId: 'dish_001',
        quantity: 2,
        sentToKitchen: true,
      },
      {
        id: 'invoice_001_item_002',
        dishId: 'dish_003',
        quantity: 1,
        sentToKitchen: true,
      },
      {
        id: 'invoice_001_item_003',
        dishId: 'dish_007',
        quantity: 2,
        sentToKitchen: true,
      },
    ],
    status: 'Đang phục vụ',
    createdAt: '09:30 28/10/2026',
  },
];
