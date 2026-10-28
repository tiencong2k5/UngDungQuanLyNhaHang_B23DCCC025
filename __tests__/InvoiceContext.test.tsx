import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InvoiceProvider, useInvoices } from '../src/context/InvoiceContext';

beforeEach(() => {
  jest.mocked(AsyncStorage.getItem).mockReset().mockResolvedValue(null);
  jest.mocked(AsyncStorage.setItem).mockReset().mockResolvedValue(undefined);
});

test('creates an order, updates its items, and marks an invoice as paid', async () => {
  let invoiceContext: ReturnType<typeof useInvoices> | undefined;

  function Probe() {
    invoiceContext = useInvoices();
    return null;
  }

  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <InvoiceProvider>
        <Probe />
      </InvoiceProvider>,
    );
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });

  const getContext = () => {
    if (!invoiceContext) {
      throw new Error('Invoice context was not initialized.');
    }
    return invoiceContext;
  };

  const newDish = {
    dishId: 'dish_002',
    quantity: 1,
    sentToKitchen: false,
  };

  await ReactTestRenderer.act(() => {
    getContext().adjustItemQuantity(4, newDish, 1);
    getContext().adjustItemQuantity(4, newDish, 1);
  });

  let tableInvoice = getContext().invoices.find(
    invoice => invoice.tableNumber === 4,
  );
  expect(tableInvoice?.status).toBe('Đang phục vụ');
  expect(tableInvoice?.items).toHaveLength(1);
  expect(tableInvoice?.items[0].quantity).toBe(2);

  const orderItem = tableInvoice?.items[0];
  if (!orderItem) {
    throw new Error('Expected the new order to contain an item.');
  }

  await ReactTestRenderer.act(() => {
    getContext().updateItemNote(4, orderItem, 'Ít cay');
  });
  expect(
    getContext().invoices.find(invoice => invoice.tableNumber === 4)?.items[0]
      .note,
  ).toBe('Ít cay');

  await ReactTestRenderer.act(() => {
    getContext().sendPendingItemsToKitchen(4);
  });
  expect(
    getContext().invoices.find(invoice => invoice.tableNumber === 4)?.items[0]
      .sentToKitchen,
  ).toBe(true);

  await ReactTestRenderer.act(() => {
    getContext().adjustItemQuantity(4, orderItem, -1);
    getContext().adjustItemQuantity(4, orderItem, -1);
  });
  tableInvoice = getContext().invoices.find(
    invoice => invoice.tableNumber === 4,
  );
  expect(tableInvoice?.items).toHaveLength(0);

  const existingInvoice = getContext().invoices.find(
    invoice => invoice.tableNumber === 3,
  );
  if (!existingInvoice) {
    throw new Error('Expected the sample invoice for table 3.');
  }

  await ReactTestRenderer.act(async () => {
    await getContext().markInvoicePaid(
      existingInvoice.id,
      {
        method: 'Tiền mặt',
        subtotal: 160000,
        vat: 12800,
        total: 172800,
        amountReceived: 200000,
        change: 27200,
        paidAt: '10:00 28/10/2026',
      },
      existingInvoice.items.map(invoiceItem => ({
        ...invoiceItem,
        dishName: 'Món ăn mẫu',
        unitPrice: 30000,
      })),
    );
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });
  expect(
    getContext().invoices.find(invoice => invoice.id === existingInvoice.id)
      ?.status,
  ).toBe('Đã thanh toán');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    '@myapp/invoices-v1',
    expect.stringContaining('"method":"Tiền mặt"'),
  );

  await ReactTestRenderer.act(() => {
    renderer?.unmount();
  });
});

test('restores invoices saved in AsyncStorage before showing the app', async () => {
  const savedInvoices = [
    {
      id: 'saved_invoice',
      tableNumber: 8,
      items: [],
      status: 'Đã thanh toán',
      createdAt: '10:00 28/10/2026',
    },
  ];
  jest
    .mocked(AsyncStorage.getItem)
    .mockResolvedValue(JSON.stringify(savedInvoices));

  let invoiceContext: ReturnType<typeof useInvoices> | undefined;

  function Probe() {
    invoiceContext = useInvoices();
    return null;
  }

  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <InvoiceProvider>
        <Probe />
      </InvoiceProvider>,
    );
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });

  expect(AsyncStorage.getItem).toHaveBeenCalledWith('@myapp/invoices-v1');
  expect(invoiceContext?.invoices).toEqual(savedInvoices);

  await ReactTestRenderer.act(() => {
    renderer?.unmount();
  });
});

test('does not mark an invoice paid if saving the payment fails', async () => {
  let invoiceContext: ReturnType<typeof useInvoices> | undefined;

  function Probe() {
    invoiceContext = useInvoices();
    return null;
  }

  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <InvoiceProvider>
        <Probe />
      </InvoiceProvider>,
    );
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });

  if (!invoiceContext) {
    throw new Error('Invoice context was not initialized.');
  }

  const invoice = invoiceContext.invoices.find(
    current => current.status === 'Đang phục vụ',
  );
  if (!invoice) {
    throw new Error('Expected an unpaid invoice.');
  }

  jest
    .mocked(AsyncStorage.setItem)
    .mockRejectedValueOnce(
      new Error('Native module is null, cannot access legacy storage'),
    );

  await ReactTestRenderer.act(async () => {
    await expect(
      invoiceContext?.markInvoicePaid(
        invoice.id,
        {
          method: 'Tiền mặt',
          subtotal: 100000,
          vat: 8000,
          total: 108000,
          amountReceived: 120000,
          change: 12000,
          paidAt: '11:22 28/10/2026',
        },
        invoice.items,
      ),
    ).rejects.toThrow('Native module is null');
  });

  expect(
    invoiceContext.invoices.find(current => current.id === invoice.id)?.status,
  ).toBe('Đang phục vụ');

  await ReactTestRenderer.act(() => {
    renderer?.unmount();
  });
});
