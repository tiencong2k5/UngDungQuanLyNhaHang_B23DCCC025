export type RootStackParamList = {
  Main: undefined;
  Order: {
    tableNumber: number;
    isOccupied: boolean;
  };
  Payment: {
    invoiceId: string;
  };
  TableActions: {
    tableNumber: number;
  };
  DishForm: {
    dishId?: string;
  };
};

export type MainTabParamList = {
  Tables: undefined;
  Menu: undefined;
  Invoices: undefined;
};
