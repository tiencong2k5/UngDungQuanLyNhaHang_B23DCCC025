/**
 * Các loại món ăn trong nhà hàng
 */
export type DishCategory = 'Khai vị' | 'Món chính' | 'Tráng miệng' | 'Đồ uống';

/**
 * Trạng thái phục vụ của món ăn
 */
export type Dish = {
  id: string;
  name: string;
  category: DishCategory;
  price: number;
  available: boolean;
};

/**
 * Một món ăn trong hóa đơn
 */
export type InvoiceItem = {
  id?: string;
  dishId: string;
  dishName?: string;
  unitPrice?: number;
  quantity: number;
  note?: string;
  sentToKitchen?: boolean;
};

export type PaymentMethod =
  | 'Tiền mặt'
  | 'Chuyển khoản VietQR'
  | 'Thẻ / Ví điện tử';

export type InvoicePayment = {
  method: PaymentMethod;
  subtotal: number;
  vat: number;
  total: number;
  amountReceived?: number;
  change: number;
  paidAt: string;
};

/**
 * Trạng thái hóa đơn
 */
export type InvoiceStatus = 'Đang phục vụ' | 'Đã thanh toán';

/**
 * Thông tin hóa đơn
 */
export type Invoice = {
  id: string;
  tableNumber: number;
  guestCount?: number;
  items: InvoiceItem[];
  status: InvoiceStatus;
  createdAt: string;
  payment?: InvoicePayment;
};
