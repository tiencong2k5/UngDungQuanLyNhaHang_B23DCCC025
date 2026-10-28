import Ionicons from '@react-native-vector-icons/ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInvoices } from '../../context/InvoiceContext';
import { useMenu } from '../../context/MenuContext';
import { colors, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import type { InvoicePayment, PaymentMethod } from '../../types/restaurant';
import { buildVietQrUrl } from '../../config/payment';
import {
  calculateChange,
  calculatePaymentTotals,
  canConfirmPayment,
} from './paymentCalculations';
import { createReceiptHtml } from './receiptHtml';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;
type PrintOptions = {
  html: string;
  jobName: string;
};
type NativePrintModule = {
  print: (options: PrintOptions) => Promise<unknown>;
};

const nativePrint = NativeModules.RNPrint as NativePrintModule | undefined;

async function printHtml(options: PrintOptions) {
  if (!nativePrint || typeof nativePrint.print !== 'function') {
    throw new Error('Dịch vụ in chưa được cài đặt trong ứng dụng.');
  }
  await nativePrint.print(options);
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString('vi-VN')} đ`;
}

function formatTableNumber(tableNumber: number) {
  return String(tableNumber).padStart(2, '0');
}

function PaymentScreen({ navigation, route }: Props) {
  const { invoiceId } = route.params;
  const { invoices, markInvoicePaid } = useInvoices();
  const { dishes } = useMenu();
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>('Tiền mặt');
  const [cashReceivedInput, setCashReceivedInput] = useState('');
  const [showCashError, setShowCashError] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const invoice = invoices.find(item => item.id === invoiceId);
  const lineItems = useMemo(
    () =>
      (invoice?.items ?? []).flatMap(item => {
        const dish = dishes.find(menuItem => menuItem.id === item.dishId);
        const dishName = item.dishName ?? dish?.name;
        const unitPrice = item.unitPrice ?? dish?.price;
        return dishName && unitPrice !== undefined
          ? [
              {
                item,
                dishName,
                unitPrice,
                lineTotal: unitPrice * item.quantity,
              },
            ]
          : [];
      }),
    [dishes, invoice],
  );
  const calculatedSubtotal = lineItems.reduce(
    (sum, line) => sum + line.lineTotal,
    0,
  );
  const subtotal = invoice?.payment?.subtotal ?? calculatedSubtotal;
  const calculatedTotals = calculatePaymentTotals(subtotal);
  const vat = invoice?.payment?.vat ?? calculatedTotals.vat;
  const grandTotal = invoice?.payment?.total ?? calculatedTotals.total;
  const cashReceived = Number(cashReceivedInput) || 0;
  const change =
    invoice?.payment?.change ?? calculateChange(cashReceived, grandTotal);
  const hasItems = lineItems.length > 0;
  const isPaid = invoice?.status === 'Đã thanh toán';
  const paymentMethod =
    isPaid && invoice?.payment ? invoice.payment.method : selectedPaymentMethod;
  const isCash = paymentMethod === 'Tiền mặt';
  const isQrPayment = paymentMethod === 'Chuyển khoản VietQR';
  const qrUrl = invoice
    ? buildVietQrUrl(grandTotal, invoice.tableNumber, invoice.id)
    : undefined;
  const canCompletePayment =
    hasItems &&
    grandTotal > 0 &&
    (isCash
      ? canConfirmPayment(hasItems, cashReceived, grandTotal)
      : !isQrPayment || Boolean(qrUrl));
  const isCashInsufficient =
    showCashError && isCash && cashReceived < grandTotal && hasItems;

  const handleCashChange = (value: string) => {
    setCashReceivedInput(value.replace(/\D/g, ''));
    setShowCashError(true);
  };

  const getReceiptPayment = (isEstimate: boolean): InvoicePayment => ({
    method: paymentMethod,
    subtotal,
    vat,
    total: grandTotal,
    amountReceived: isCash ? cashReceived : undefined,
    change: isCash ? calculateChange(cashReceived, grandTotal) : 0,
    paidAt: isEstimate
      ? ''
      : new Date().toLocaleString('vi-VN', { hour12: false }),
  });

  const printReceipt = async (isEstimate: boolean) => {
    if (!invoice || !hasItems) {
      Alert.alert('Không thể in', 'Hoá đơn chưa có món để in.');
      return;
    }

    const receiptPayment = invoice.payment ?? getReceiptPayment(isEstimate);
    const html = createReceiptHtml({
      tableNumber: invoice.tableNumber,
      guestCount: invoice.guestCount,
      createdAt: invoice.createdAt,
      lines: lineItems.map(line => ({
        name: line.dishName,
        quantity: line.item.quantity,
        unitPrice: line.unitPrice,
        note: line.item.note,
      })),
      payment: receiptPayment,
      isEstimate,
    });

    try {
      setIsPrinting(true);
      await printHtml({
        html,
        jobName: isEstimate
          ? `Tam tinh ban ${invoice.tableNumber}`
          : `Hoa don ban ${invoice.tableNumber}`,
      });
    } catch (error) {
      Alert.alert(
        'Không thể in hoá đơn',
        error instanceof Error ? error.message : 'Vui lòng thử lại.',
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const completePayment = async () => {
    setShowCashError(true);
    if (!invoice || isPaid || !canCompletePayment) {
      return;
    }

    const complete = async () => {
      const paidAt = new Date().toLocaleString('vi-VN', { hour12: false });
      const payment: InvoicePayment = {
        method: paymentMethod,
        subtotal,
        vat,
        total: grandTotal,
        amountReceived: isCash ? cashReceived : undefined,
        change: isCash ? calculateChange(cashReceived, grandTotal) : 0,
        paidAt,
      };
      const itemsWithSnapshot = lineItems.map(
        ({ item, dishName, unitPrice }) => ({
          ...item,
          dishName,
          unitPrice,
        }),
      );
      await markInvoicePaid(invoice.id, payment, itemsWithSnapshot);
      await printReceipt(false);
      navigation.popToTop();
    };

    if (isCash) {
      await complete();
      return;
    }

    Alert.alert(
      'Xác nhận đã nhận tiền',
      isQrPayment
        ? 'Vui lòng xác nhận đã nhận được khoản chuyển khoản trong ứng dụng ngân hàng.'
        : 'Vui lòng xác nhận đã nhận đủ tiền qua thẻ hoặc ví điện tử.',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Đã nhận tiền',
          onPress: () => {
            complete().catch(error => {
              Alert.alert(
                'Không thể hoàn tất thanh toán',
                error instanceof Error ? error.message : 'Vui lòng thử lại.',
              );
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại hoá đơn"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Thanh toán</Text>
            <Text style={styles.headerSubtitle}>
              {invoice
                ? `Hoá đơn Bàn ${formatTableNumber(invoice.tableNumber)}`
                : 'Hoá đơn không tồn tại'}
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="card-outline" size={22} color={colors.primary} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {!invoice ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="receipt-outline"
                size={30}
                color={colors.textMuted}
              />
              <Text style={styles.emptyTitle}>Không tìm thấy hoá đơn</Text>
              <Text style={styles.emptyDescription}>
                Hoá đơn có thể đã được thanh toán hoặc không còn tồn tại.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.invoiceMetaCard}>
                <View style={styles.metaIcon}>
                  <Ionicons
                    name="restaurant-outline"
                    size={19}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.metaText}>
                  <Text style={styles.tableTitle}>
                    Bàn {formatTableNumber(invoice.tableNumber)}
                    {invoice.guestCount ? ` · ${invoice.guestCount} khách` : ''}
                  </Text>
                  <Text style={styles.metaCaption}>
                    Vào lúc {invoice.createdAt}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    isPaid ? styles.statusPaid : styles.statusUnpaid,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isPaid ? styles.statusPaidText : styles.statusUnpaidText,
                    ]}
                  >
                    {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </Text>
                </View>
              </View>

              <View style={styles.sectionHeading}>
                <View>
                  <Text style={styles.sectionTitle}>Chi tiết hoá đơn</Text>
                  <Text style={styles.sectionSubtitle}>
                    {lineItems.reduce(
                      (sum, line) => sum + line.item.quantity,
                      0,
                    )}{' '}
                    món
                  </Text>
                </View>
                <Ionicons
                  name="receipt-outline"
                  size={19}
                  color={colors.primary}
                />
              </View>

              <View style={styles.itemsCard}>
                {lineItems.length > 0 ? (
                  lineItems.map(
                    ({ item, dishName, unitPrice, lineTotal }, index) => (
                      <View
                        key={item.id ?? `${item.dishId}-${index}`}
                        style={[
                          styles.itemRow,
                          index === lineItems.length - 1 && styles.lastItemRow,
                        ]}
                      >
                        <View style={styles.itemMain}>
                          <Text style={styles.itemName}>{dishName}</Text>
                          {item.note ? (
                            <Text style={styles.itemNote}>
                              Ghi chú: {item.note}
                            </Text>
                          ) : null}
                          <Text style={styles.itemUnitPrice}>
                            {item.quantity} × {formatCurrency(unitPrice)}
                          </Text>
                        </View>
                        <Text style={styles.itemTotal}>
                          {formatCurrency(lineTotal)}
                        </Text>
                      </View>
                    ),
                  )
                ) : (
                  <View style={styles.emptyItems}>
                    <Text style={styles.emptyDescription}>
                      Hoá đơn chưa có món để thanh toán.
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tạm tính</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(subtotal)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <View>
                    <Text style={styles.summaryLabel}>VAT</Text>
                    <Text style={styles.vatCaption}>
                      Thuế giá trị gia tăng 8%
                    </Text>
                  </View>
                  <Text style={styles.summaryValue}>{formatCurrency(vat)}</Text>
                </View>
                <View style={styles.totalDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.grandTotalLabel}>Tổng cộng</Text>
                  <Text style={styles.grandTotalValue}>
                    {formatCurrency(grandTotal)}
                  </Text>
                </View>
              </View>

              <View style={styles.methodSection}>
                <Text style={styles.cashTitle}>Phương thức thanh toán</Text>
                <View style={styles.methods}>
                  {(
                    [
                      {
                        label: 'Tiền mặt',
                        icon: 'cash-outline',
                      },
                      {
                        label: 'Chuyển khoản VietQR',
                        icon: 'qr-code-outline',
                      },
                      {
                        label: 'Thẻ / Ví điện tử',
                        icon: 'wallet-outline',
                      },
                    ] as const
                  ).map(method => {
                    const selected = paymentMethod === method.label;
                    return (
                      <Pressable
                        key={method.label}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        disabled={isPaid}
                        onPress={() => setSelectedPaymentMethod(method.label)}
                        style={[
                          styles.methodOption,
                          selected && styles.methodOptionSelected,
                          isPaid && styles.methodOptionDisabled,
                        ]}
                      >
                        <Ionicons
                          name={method.icon}
                          size={18}
                          color={
                            selected ? colors.primary : colors.textSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.methodText,
                            selected && styles.methodTextSelected,
                          ]}
                        >
                          {method.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {isCash ? (
                <View style={styles.cashCard}>
                  <Text style={styles.cashTitle}>Tiền khách đưa</Text>
                  <View
                    style={[
                      styles.cashInputContainer,
                      isCashInsufficient && styles.cashInputError,
                    ]}
                  >
                    <TextInput
                      accessibilityLabel="Số tiền khách đưa"
                      value={
                        isPaid && invoice.payment?.amountReceived !== undefined
                          ? String(invoice.payment.amountReceived)
                          : cashReceivedInput
                      }
                      onChangeText={handleCashChange}
                      keyboardType="numeric"
                      editable={!isPaid && hasItems}
                      placeholder="Nhập số tiền"
                      placeholderTextColor={colors.textMuted}
                      style={styles.cashInput}
                      returnKeyType="done"
                    />
                    <Text style={styles.currencySuffix}>đ</Text>
                  </View>
                  {isCashInsufficient ? (
                    <Text style={styles.errorText}>
                      {cashReceivedInput.length === 0
                        ? 'Vui lòng nhập số tiền khách đưa.'
                        : 'Tiền khách đưa chưa đủ thanh toán.'}
                    </Text>
                  ) : null}
                  {!isPaid ? (
                    <View style={styles.denominations}>
                      {[100000, 200000, 500000].map(amount => (
                        <Pressable
                          key={amount}
                          accessibilityRole="button"
                          onPress={() => handleCashChange(String(amount))}
                          style={styles.denomination}
                        >
                          <Text style={styles.denominationText}>
                            {amount / 1000}k
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                  <View style={styles.changeRow}>
                    <Text style={styles.changeLabel}>Tiền thối lại</Text>
                    <Text style={styles.changeValue}>
                      {formatCurrency(change)}
                    </Text>
                  </View>
                </View>
              ) : null}

              {isQrPayment ? (
                <View style={styles.qrCard}>
                  <Text style={styles.cashTitle}>Chuyển khoản VietQR</Text>
                  {qrUrl ? (
                    <>
                      <Image
                        accessibilityLabel="Mã QR thanh toán VietQR"
                        source={{ uri: qrUrl }}
                        resizeMode="contain"
                        style={styles.qrImage}
                      />
                      <Text style={styles.qrAmount}>
                        {formatCurrency(grandTotal)}
                      </Text>
                      <Text style={styles.qrCaption}>
                        Nội dung: Thanh toan ban{' '}
                        {formatTableNumber(invoice.tableNumber)} {invoice.id}
                      </Text>
                      <Text style={styles.qrCaption}>
                        Chỉ xác nhận sau khi đã kiểm tra giao dịch thành công.
                      </Text>
                    </>
                  ) : (
                    <View style={styles.qrNotConfigured}>
                      <Ionicons
                        name="qr-code-outline"
                        size={28}
                        color={colors.warning}
                      />
                      <Text style={styles.qrWarningTitle}>
                        Chưa cấu hình tài khoản VietQR
                      </Text>
                      <Text style={styles.qrCaption}>
                        Cần mã BIN ngân hàng, số tài khoản và tên chủ tài khoản
                        để tạo QR nhận tiền.
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}

              {paymentMethod === 'Thẻ / Ví điện tử' ? (
                <View style={styles.qrCard}>
                  <Ionicons
                    name="wallet-outline"
                    size={25}
                    color={colors.primary}
                  />
                  <Text style={styles.qrWarningTitle}>
                    Xác nhận giao dịch tại máy POS hoặc ứng dụng ví
                  </Text>
                  <Text style={styles.qrCaption}>
                    Chỉ hoàn tất hoá đơn sau khi giao dịch đã được chấp nhận.
                  </Text>
                </View>
              ) : null}

              {isPaid && invoice.payment ? (
                <View style={styles.paidPaymentInfo}>
                  <Text style={styles.changeLabel}>
                    Đã thanh toán bằng {invoice.payment.method}
                  </Text>
                  <Text style={styles.metaCaption}>
                    Lúc {invoice.payment.paidAt}
                  </Text>
                </View>
              ) : null}
              {!isPaid && (
                <Pressable
                  accessibilityRole="button"
                  disabled={!hasItems || isPrinting}
                  onPress={() => {
                    printReceipt(true).catch(error => {
                      Alert.alert(
                        'Không thể in tạm tính',
                        error instanceof Error
                          ? error.message
                          : 'Vui lòng thử lại.',
                      );
                    });
                  }}
                  style={({ pressed }) => [
                    styles.estimateButton,
                    (!hasItems || isPrinting) && styles.buttonDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="print-outline"
                    size={18}
                    color={hasItems ? colors.primary : colors.textMuted}
                  />
                  <Text style={styles.estimateButtonText}>In tạm tính</Text>
                </Pressable>
              )}
            </>
          )}
        </ScrollView>

        {invoice ? (
          <View style={styles.footer}>
            <View style={styles.footerTotal}>
              <Text style={styles.footerLabel}>Cần thanh toán</Text>
              <Text style={styles.footerAmount}>
                {formatCurrency(grandTotal)}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={isPrinting || (!isPaid && !canCompletePayment)}
              onPress={() => {
                if (isPaid) {
                  printReceipt(false).catch(error => {
                    Alert.alert(
                      'Không thể in hoá đơn',
                      error instanceof Error
                        ? error.message
                        : 'Vui lòng thử lại.',
                    );
                  });
                } else {
                  completePayment().catch(error => {
                    Alert.alert(
                      'Không thể hoàn tất thanh toán',
                      error instanceof Error
                        ? error.message
                        : 'Vui lòng thử lại.',
                    );
                  });
                }
              }}
              style={({ pressed }) => [
                styles.payButton,
                !isPaid && !canCompletePayment && styles.payButtonDisabled,
                isPrinting && styles.payButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={isPaid ? 'print-outline' : 'checkmark-circle-outline'}
                size={19}
                color={colors.white}
              />
              <Text style={styles.payButtonText}>
                {isPrinting
                  ? 'Đang mở bản in...'
                  : isPaid
                  ? 'In lại hoá đơn'
                  : 'Hoàn tất & In hóa đơn'}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default PaymentScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoider: {
    flex: 1,
  },
  header: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.surface,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#14251A',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  pressed: {
    opacity: 0.78,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: colors.textStrong,
    fontSize: typography.sizeSubtitle,
    fontWeight: typography.weightHeavy,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizeCaption,
    marginTop: 2,
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 20,
  },
  invoiceMetaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: 19,
    elevation: 2,
    shadowColor: '#14251A',
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
  metaIcon: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    marginRight: 10,
  },
  metaText: {
    flex: 1,
  },
  tableTitle: {
    color: colors.text,
    fontSize: typography.sizeBody,
    fontWeight: typography.weightBold,
  },
  metaCaption: {
    color: colors.textMuted,
    fontSize: typography.sizeCaption,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
  },
  statusUnpaid: {
    backgroundColor: colors.warningLight,
  },
  statusPaid: {
    backgroundColor: colors.successLight,
  },
  statusText: {
    fontSize: 9,
    fontWeight: typography.weightBold,
  },
  statusUnpaidText: {
    color: colors.warning,
  },
  statusPaidText: {
    color: colors.success,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  sectionTitle: {
    color: colors.textStrong,
    fontSize: typography.sizeSubtitle,
    fontWeight: typography.weightBold,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizeCaption,
    marginTop: 3,
  },
  itemsCard: {
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: 13,
    elevation: 2,
    shadowColor: '#14251A',
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
  itemRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  lastItemRow: {
    borderBottomWidth: 0,
  },
  itemMain: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    color: colors.text,
    fontSize: typography.sizeSmall,
    fontWeight: typography.weightBold,
  },
  itemNote: {
    color: colors.textSecondary,
    fontSize: typography.sizeCaption,
    marginTop: 4,
  },
  itemUnitPrice: {
    color: colors.textMuted,
    fontSize: typography.sizeCaption,
    marginTop: 4,
  },
  itemTotal: {
    color: colors.text,
    fontSize: typography.sizeSmall,
    fontWeight: typography.weightBold,
  },
  emptyItems: {
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: 13,
    elevation: 2,
    shadowColor: '#14251A',
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
  summaryRow: {
    minHeight: 33,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizeSmall,
  },
  summaryValue: {
    color: colors.text,
    fontSize: typography.sizeSmall,
    fontWeight: typography.weightSemibold,
  },
  vatCaption: {
    color: colors.textMuted,
    fontSize: typography.sizeCaption,
    marginTop: 3,
  },
  totalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 7,
  },
  grandTotalLabel: {
    color: colors.textStrong,
    fontSize: typography.sizeBody,
    fontWeight: typography.weightBold,
  },
  grandTotalValue: {
    color: colors.primaryDark,
    fontSize: typography.sizeHeading,
    fontWeight: typography.weightHeavy,
  },
  cashCard: {
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: '#14251A',
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
  methodSection: {
    marginBottom: 13,
  },
  methods: {
    gap: 7,
  },
  methodOption: {
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surface,
    gap: 10,
  },
  methodOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  methodOptionDisabled: {
    opacity: 0.7,
  },
  methodText: {
    color: colors.textSecondary,
    fontSize: typography.sizeSmall,
    fontWeight: typography.weightMedium,
  },
  methodTextSelected: {
    color: colors.primaryDark,
    fontWeight: typography.weightBold,
  },
  cashTitle: {
    color: colors.text,
    fontSize: typography.sizeSmall,
    fontWeight: typography.weightBold,
    marginBottom: 8,
  },
  cashInputContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  cashInputError: {
    borderColor: colors.danger,
  },
  cashInput: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontSize: typography.sizeBody,
  },
  currencySuffix: {
    color: colors.textSecondary,
    fontSize: typography.sizeSmall,
    fontWeight: typography.weightSemibold,
  },
  denominations: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  denomination: {
    minWidth: 62,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: 9,
    backgroundColor: colors.primaryLight,
  },
  denominationText: {
    color: colors.primaryDark,
    fontSize: typography.sizeCaption,
    fontWeight: typography.weightBold,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sizeCaption,
    marginTop: 6,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 13,
  },
  changeLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizeSmall,
  },
  changeValue: {
    color: colors.success,
    fontSize: typography.sizeBody,
    fontWeight: typography.weightBold,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    elevation: 2,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.sizeSubtitle,
    fontWeight: typography.weightBold,
    marginTop: 11,
  },
  emptyDescription: {
    color: colors.textMuted,
    fontSize: typography.sizeSmall,
    textAlign: 'center',
    marginTop: 5,
  },
  qrCard: {
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginTop: 13,
    elevation: 2,
    shadowColor: '#14251A',
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
  qrImage: {
    width: 205,
    height: 205,
    marginTop: 9,
  },
  qrAmount: {
    color: colors.primaryDark,
    fontSize: typography.sizeHeading,
    fontWeight: typography.weightHeavy,
    marginTop: 4,
  },
  qrCaption: {
    color: colors.textMuted,
    fontSize: typography.sizeCaption,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 6,
  },
  qrNotConfigured: {
    alignItems: 'center',
    paddingVertical: 13,
  },
  qrWarningTitle: {
    color: colors.text,
    fontSize: typography.sizeSmall,
    fontWeight: typography.weightBold,
    textAlign: 'center',
    marginTop: 8,
  },
  paidPaymentInfo: {
    padding: 14,
    borderRadius: 13,
    backgroundColor: colors.successLight,
    marginTop: 13,
  },
  estimateButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginTop: 13,
    gap: 7,
  },
  estimateButtonText: {
    color: colors.primary,
    fontSize: typography.sizeSmall,
    fontWeight: typography.weightBold,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 11,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerTotal: {
    flex: 1,
  },
  footerLabel: {
    color: colors.textMuted,
    fontSize: typography.sizeCaption,
  },
  footerAmount: {
    color: colors.primaryDark,
    fontSize: typography.sizeSubtitle,
    fontWeight: typography.weightHeavy,
    marginTop: 3,
  },
  payButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: colors.primary,
    gap: 7,
    elevation: 2,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.17,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  payButtonDisabled: {
    backgroundColor: '#B9C4BB',
    elevation: 0,
    shadowOpacity: 0,
  },
  payButtonText: {
    color: colors.white,
    fontSize: typography.sizeSmall,
    fontWeight: typography.weightBold,
  },
});
