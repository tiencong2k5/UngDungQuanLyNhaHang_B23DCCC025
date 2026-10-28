import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { invoiceList as initialInvoiceList } from '../data/invoiceList';
import type { Invoice, InvoiceItem, InvoicePayment } from '../types/restaurant';
import { colors } from '../theme/colors';
import { isInvoiceList } from '../storage/restaurantDataValidation';

const STORAGE_KEY = '@myapp/invoices-v1';

type InvoiceContextValue = {
  invoices: Invoice[];
  adjustItemQuantity: (
    tableNumber: number,
    item: InvoiceItem,
    change: 1 | -1,
  ) => void;
  updateItemNote: (
    tableNumber: number,
    item: InvoiceItem,
    note: string,
  ) => void;
  sendPendingItemsToKitchen: (tableNumber: number) => void;
  markInvoicePaid: (
    invoiceId: string,
    payment: InvoicePayment,
    items: InvoiceItem[],
  ) => Promise<void>;
};

const InvoiceContext = createContext<InvoiceContextValue | null>(null);

function createItemId() {
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createInvoiceId() {
  return `invoice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createTimestamp() {
  const now = new Date();
  const time = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const date = now.toLocaleDateString('vi-VN');
  return `${time} ${date}`;
}

function matchesItem(candidate: InvoiceItem, item: InvoiceItem) {
  if (candidate.id && item.id) {
    return candidate.id === item.id;
  }
  return (
    candidate.dishId === item.dishId &&
    Boolean(candidate.sentToKitchen) === Boolean(item.sentToKitchen)
  );
}

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState(initialInvoiceList);
  const [isReady, setIsReady] = useState(false);
  const [canPersist, setCanPersist] = useState(false);
  const saveQueue = useRef(Promise.resolve());

  useEffect(() => {
    let isMounted = true;

    const loadInvoices = async () => {
      try {
        const storedInvoices = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedInvoices !== null) {
          const parsedInvoices: unknown = JSON.parse(storedInvoices);
          if (!isInvoiceList(parsedInvoices)) {
            throw new Error('Dữ liệu hoá đơn đã lưu không đúng định dạng.');
          }
          if (isMounted) {
            setInvoices(parsedInvoices);
          }
        }
        if (isMounted) {
          setCanPersist(true);
        }
      } catch (error) {
        Alert.alert(
          'Không thể tải hoá đơn',
          error instanceof Error
            ? error.message
            : 'Đã xảy ra lỗi không xác định.',
        );
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    loadInvoices().catch(error => {
      Alert.alert(
        'Không thể tải hoá đơn',
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi không xác định.',
      );
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !canPersist) {
      return;
    }

    saveQueue.current = saveQueue.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(invoices)))
      .catch(error => {
        Alert.alert(
          'Không thể lưu hoá đơn',
          error instanceof Error
            ? error.message
            : 'Đã xảy ra lỗi không xác định.',
        );
      });
  }, [canPersist, invoices, isReady]);

  const adjustItemQuantity = useCallback(
    (tableNumber: number, item: InvoiceItem, change: 1 | -1) => {
      setInvoices(current => {
        const activeInvoice = current.find(
          invoice =>
            invoice.tableNumber === tableNumber &&
            invoice.status === 'Đang phục vụ',
        );

        if (!activeInvoice) {
          if (change < 0) {
            return current;
          }
          return [
            ...current,
            {
              id: createInvoiceId(),
              tableNumber,
              guestCount: 1,
              items: [
                {
                  ...item,
                  id: createItemId(),
                  quantity: 1,
                  sentToKitchen: false,
                },
              ],
              status: 'Đang phục vụ',
              createdAt: createTimestamp(),
            },
          ];
        }

        const itemIndex = activeInvoice.items.findIndex(existing =>
          matchesItem(existing, item),
        );

        if (change > 0) {
          if (itemIndex < 0 || activeInvoice.items[itemIndex].sentToKitchen) {
            return current.map(invoice =>
              invoice.id === activeInvoice.id
                ? {
                    ...invoice,
                    items: [
                      ...invoice.items,
                      {
                        id: createItemId(),
                        dishId: item.dishId,
                        quantity: 1,
                        note: '',
                        sentToKitchen: false,
                      },
                    ],
                  }
                : invoice,
            );
          }

          return current.map(invoice =>
            invoice.id === activeInvoice.id
              ? {
                  ...invoice,
                  items: invoice.items.map((existing, index) =>
                    index === itemIndex
                      ? { ...existing, quantity: existing.quantity + 1 }
                      : existing,
                  ),
                }
              : invoice,
          );
        }

        if (itemIndex < 0) {
          return current;
        }

        return current.map(invoice =>
          invoice.id === activeInvoice.id
            ? {
                ...invoice,
                items: invoice.items.flatMap((existing, index) => {
                  if (index !== itemIndex) {
                    return [existing];
                  }
                  return existing.quantity > 1
                    ? [{ ...existing, quantity: existing.quantity - 1 }]
                    : [];
                }),
              }
            : invoice,
        );
      });
    },
    [],
  );

  const updateItemNote = useCallback(
    (tableNumber: number, item: InvoiceItem, note: string) => {
      setInvoices(current =>
        current.map(invoice =>
          invoice.tableNumber === tableNumber &&
          invoice.status === 'Đang phục vụ'
            ? {
                ...invoice,
                items: invoice.items.map(existing =>
                  matchesItem(existing, item)
                    ? { ...existing, note }
                    : existing,
                ),
              }
            : invoice,
        ),
      );
    },
    [],
  );

  const markInvoicePaid = useCallback(
    async (
      invoiceId: string,
      payment: InvoicePayment,
      items: InvoiceItem[],
    ) => {
      const updatedInvoices = invoices.map(invoice =>
        invoice.id === invoiceId
          ? {
              ...invoice,
              items: items.map(item => ({
                ...item,
                id: item.id ?? createItemId(),
              })),
              payment,
              status: 'Đã thanh toán' as const,
            }
          : invoice,
      );
      const save = saveQueue.current
        .catch(() => undefined)
        .then(() =>
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedInvoices)),
        );
      saveQueue.current = save;

      await save;
      setInvoices(updatedInvoices);
    },
    [invoices],
  );

  const sendPendingItemsToKitchen = useCallback((tableNumber: number) => {
    setInvoices(current =>
      current.map(invoice =>
        invoice.tableNumber === tableNumber && invoice.status === 'Đang phục vụ'
          ? {
              ...invoice,
              items: invoice.items.map(item =>
                item.sentToKitchen ? item : { ...item, sentToKitchen: true },
              ),
            }
          : invoice,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({
      invoices,
      adjustItemQuantity,
      updateItemNote,
      sendPendingItemsToKitchen,
      markInvoicePaid,
    }),
    [
      invoices,
      adjustItemQuantity,
      updateItemNote,
      sendPendingItemsToKitchen,
      markInvoicePaid,
    ],
  );

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <InvoiceContext.Provider value={value}>{children}</InvoiceContext.Provider>
  );
}

export function useInvoices() {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoices must be used inside InvoiceProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
